// Yikes this file is gross. Want to help me rerefactor it? I would appreciate it!
import { Configuration, OpenAIApi } from 'openai';
import eventSourcesJSON from '@/assets/event_sources.json';
import { logTimeElapsedSince, serverFetchHeaders, serverStaleWhileInvalidateSeconds } from '~~/utils/util';
import { InstagramEvent, PrismaClient } from '@prisma/client'
import vision from '@google-cloud/vision';
import { DateTime } from 'luxon';


export default defineCachedEventHandler(async (event) => {
	const body = await fetchInstagramEvents();
	return {
		body
	}
}, {
	// Set this cache to only 1 hour to best utilize the Instagram API rate limit.
	maxAge: 60 * 60 + 10,
	staleMaxAge: serverStaleWhileInvalidateSeconds,
	swr: true,
});

async function doOCR(urls: string[]) {
	if (!process.env.GOOGLE_CLOUD_VISION_PRIVATE_KEY) {
		console.error('GOOGLE_CLOUD_VISION_PRIVATE_KEY not found.');
	}
	if (!process.env.GOOGLE_CLOUD_VISION_CLIENT_EMAIL) {
		console.error('GOOGLE_CLOUD_VISION_CLIENT_EMAIL not found.');
	}
	const client = new vision.ImageAnnotatorClient({
		scopes: ['https://www.googleapis.com/auth/cloud-platform'],
		credentials: {
			private_key: process.env.GOOGLE_CLOUD_VISION_PRIVATE_KEY.replace(/\\n/g, '\n'),
			client_email: process.env.GOOGLE_CLOUD_VISION_CLIENT_EMAIL,
		},
	});
	const annotationsAll = await Promise.all(
		urls.map(async (url) => {
			const [result] = await client.textDetection(url);
			const annotations = (Object.hasOwn(result, 'textAnnotations') && result.textAnnotations.length > 0) ?
				result.fullTextAnnotation.text : '';
			return annotations;
		}));

	const result = annotationsAll.join('\n');
	return result;
}

function getInstagramQuery(sourceUsername: string) {
	return `https://graph.facebook.com/v16.0/${process.env.INSTAGRAM_BUSINESS_USER_ID}?fields=`
		+ `business_discovery.username(${sourceUsername}){media.limit(5){caption,permalink,timestamp,media_type,media_url,children{media_url,media_type}}}`
		+ `&access_token=${process.env.INSTAGRAM_USER_ACCESS_TOKEN}`
}

async function fetchInstagramEvents() {
	console.log('Fetching Instagram events...');
	if (!process.env.INSTAGRAM_BUSINESS_USER_ID) {
		console.error('INSTAGRAM_BUSINESS_USER_ID not found.');
	}
	if (!process.env.INSTAGRAM_USER_ACCESS_TOKEN) {
		console.error('INSTAGRAM_USER_ACCESS_TOKEN not found.');
	}
	if (!process.env.OPENAI_API_KEY) {
		console.error('OPENAI_API_KEY not found.');
	}

	const startTime = Date.now();

	const prisma = new PrismaClient();

	const configuration = new Configuration({
		apiKey: process.env.OPENAI_API_KEY,
	});
	const openai = new OpenAIApi(configuration);

	// const instagramJson = [eventSourcesJSON.instagram[0], eventSourcesJSON.instagram[1]];
	const instagramJson = eventSourcesJSON.instagram;
	console.log('instagramJson: ', instagramJson);

	let instagramOrganizersDb = new Array();
	try {
		// Add any organizers not in database.
		instagramOrganizersDb = await Promise.all(instagramJson.map(async (instagramOrganizer) => {
			let dbEntry = await prisma.instagramEventOrganizer.findUnique({ where: { username: instagramOrganizer.username } });
			if (!dbEntry) {
				dbEntry = await prisma.instagramEventOrganizer.create({
					data: {
						username: instagramOrganizer.username,
						city: instagramOrganizer.city,
						contextClues: instagramOrganizer.context_clues.join(' '),
						// Set lastUpdated to as early as possible so that it will be updated first.
						lastUpdated: new Date(0),
					}
				});
			}
			const res = { ...dbEntry, name: instagramOrganizer.name };
			return res;
		}));
		instagramOrganizersDb = instagramOrganizersDb.sort((a, b) => a.lastUpdated.getTime() - b.lastUpdated.getTime());
	}
	catch (err) {
		console.error('Could not add Instagram organizers to database: ', err);
		return await useStorage().getItem('instagramEventSources');
	}
	logTimeElapsedSince(startTime, 'Instagram: fetch/add organizers to database');

	// InstagramOrganizers to update.
	let instagramOrganizersIG = new Array();
	let firstIndexOfNonUpdatedOrganizer = 0;
	try {
		// Get all Instagram organizers from database, sorted by lastUpdated, with most recent first.
		for (const instagramOrganizerDb of instagramOrganizersDb) {
			let req = await fetch(getInstagramQuery(instagramOrganizerDb.username), { headers: serverFetchHeaders });
			const appUsage = JSON.parse((await req).headers.get('X-App-Usage'));
			const callCount = appUsage.call_count;
			const totalCPUTime = appUsage.total_cputime;
			const totalTime = appUsage.total_time;
			let newOrganizer = await req.json();
			console.log(`[IG] Current rate limit: call_count:${callCount} total_cputime:${totalCPUTime} total_time:${totalTime}`)
			if (!newOrganizer.error) {
				instagramOrganizersIG.push(newOrganizer);
				++firstIndexOfNonUpdatedOrganizer;
				if (callCount > 35 || totalCPUTime > 35 || totalTime > 35) {
					console.log("[IG] throttled with " + callCount + " " + totalCPUTime + " " + totalTime);
					break
				}
			}
			else {
				console.log(newOrganizer.error)
				console.error(`It appears the username ${instagramOrganizerDb.username} cannot be found 
				using business discovery. Confirm it is correct. If so, then that account is not a business account. 
				Consider asking them to enable this feature. Or, you have exceeded Instagram's rate limit.`)
				break;
			}
		}
	} catch (err) {
		console.error('Could not get Instagram organizers to update: ', err);
		return await useStorage().getItem('instagramEventSources');
	}
	logTimeElapsedSince(startTime, 'Instagram: fetching Instagram data');

	let eventsZippedAllSources = null;
	try {
		eventsZippedAllSources = await Promise.all(
			instagramOrganizersIG.map(async (instagramOrganizer) => {
				return await Promise.all(instagramOrganizer.business_discovery.media.data.map(async (instagramEvent) => {
					// First check InstagramEvent table.
					const dbEntryEvent = await prisma.instagramEvent.findUnique({ where: { igId: instagramEvent.id } });
					if (dbEntryEvent) {
						return [
							instagramEvent.id,
							{
								newEntry: instagramEvent,
								dbEntry: dbEntryEvent,
							}
						];
					}
					const dbEntryNonEvent = await prisma.instagramNonEvent.findUnique({ where: { igId: instagramEvent.id } });
					return [
						instagramEvent.id,
						{
							newEntry: instagramEvent,
							dbEntry: dbEntryNonEvent,
						}
					];
				}));
			}));
	} catch (err) {
		console.error('Could not zip events: ', err);
		return await useStorage().getItem('instagramEventSources');
	}

	logTimeElapsedSince(startTime, 'Instagram: zipping events');

	const eventsZippedAllSourcesMap = eventsZippedAllSources.map((eventsZipped) => {
		return new Map(eventsZipped);
	});

	let unregisteredInstagramEventsAllSources = [];
	try {
		unregisteredInstagramEventsAllSources = eventsZippedAllSources.map((eventsZipped) => {
			// Promise always returns false, so we filter here.
			return eventsZipped.filter(([id, eventZip]) => eventZip.dbEntry === null)
				.map(([id, eventZip]) => {
					console.log('eventZip.newEntry: ', eventZip.newEntry)
					return {
						...eventZip.newEntry,
					}
				});
		});
	} catch (err) {
		console.error('Could not filter events: ', err);
		return await useStorage().getItem('instagramEventSources');
	}
	logTimeElapsedSince(startTime, 'Instagram: filtering events');


	let unregisteredInstagramEventsWithOcrAllSources = unregisteredInstagramEventsAllSources;
	try {
		unregisteredInstagramEventsWithOcrAllSources = await Promise.all(
			unregisteredInstagramEventsAllSources.map(async (unregisteredInstagramEvents) => {
				return await Promise.all(unregisteredInstagramEvents.map(async (event) => {
					let mediaLinks: string[] = [];
					switch (event.media_type) {
						case 'IMAGE':
							// May be omitted for legal reasons.
							if (event.media_url) {
								mediaLinks = [event.media_url];
							}
							break;
						case 'CAROUSEL_ALBUM':
							mediaLinks = event.children.data
								.map((child) => child.media_url)
								// Keep only if defined, since it may be omitted.
								.filter((mediaUrl) => mediaUrl);
							break;
						case 'VIDEO':
							// TODO: We can OCR the thumbnail_url, but due to a bug on Instagram's end we cannot access the `thumbnail_url` field.
							// See https://developers.facebook.com/support/bugs/3431232597133817/?join_id=fa03b2657f7a9c for updates.
							break;
						default:
							console.error(`Unknown media type: ${event.media_type} for event: ${event}`);
							break;
					}

					const ocrResult = await doOCR(mediaLinks);
					return {
						...event,
						ocrResult
					};
				}));
			}));
	}
	catch (err) {
		console.error('Could not perform OCR: ', err);
		return await useStorage().getItem('instagramEventSources');
	}
	logTimeElapsedSince(startTime, 'Instagram: performing OCR');

	const fixGeneratedJson = (generatedJson: string) => {
		return generatedJson.replace(/^[^{]*/, '').replace(/[^}]*$/, '');
	};

	let openAIResponsesAllSources = [];
	try {
		openAIResponsesAllSources = await Promise.all(
			unregisteredInstagramEventsWithOcrAllSources.map(async (unregisteredInstagramEvents, sourceNum) => {
				const source = instagramOrganizersDb[sourceNum];

				return await Promise.all(unregisteredInstagramEvents.map(async (event) => {

					const tags_string = source.contextClues;

					// Some Instagram events have no caption.
					const caption = event.caption || '';
					// Trim OCR result to approximately avoid going over token limit.
					const ocrResult = event.ocrResult.substring(0, 2200);
					const startPrompt = `You're given a post from an Instagram account${tags_string.length > 0 ? ' related to ' + tags_string : ''}. Your task is to parse event information and output it into JSON. (Note: it's possible that the post isn't event-related).\n` +
						"Here's the caption provided by the post:\n" +
						"```\n" +
						`${caption}` + "\n" +
						"```\n" +
						"\n" +
						"Here's the result of an OCR AI that reads text from the post's image:\n" +
						"```\n" +
						`${ocrResult !== undefined ? "OCR Result: " + ocrResult : ''}` + "\n" +
						"```\n" +
						"\n" +
						"Output the results in the following JSON format: \n" +
						"```\n" +
						`{\n` +
						`"isEvent": boolean,\n` +
						`"title": string | null,\n` +
						`"startDay": number | null,\n` +
						`"endDay": number | null,\n` +
						// Putting `isPastEvent` and `startHourMilitaryTime` knocks some sense into the model into not imagining start times. 
						`"isPastEvent": boolean,\n` +
						`"hasStartHourInPost": boolean,\n` +
						`"startHourMilitaryTime": number | null,\n` +
						`"endHourMilitaryTime": number | null,\n` +
						`"startMinute": number | null,\n` +
						`"endMinute": number | null,\n` +
						`"startMonth": number | null,\n` +
						`"endMonth": number | null,\n` +
						`"startYear": number | null,\n` +
						`"endYear": number | null,\n` +
						` }\n` +
						"```\n" +
						// "Here's some important information regarding the post information:\n" +
						"Guidelines to follow when creating the JSON:\n" +
						"- Information regarding time provided by the caption is guaranteed to be correct. However, the caption might be lacking information regarding time and title.\n" +
						"- The OCR result is provided by an OCR AI & thus may contain errors. Use it as a supplement for the information provided in the caption! This is especially useful when the caption is lacking information. The OCR Result also may contain time or title information that's not provided by the caption!\n" +
						"- Sometimes a person or artist's username and their actual name can be found in the caption and OCR result; the username can be indicated by it being all lowercase and containing `.`s or `_`s. Their actual names would have very similar letters to the username, and might be provided by the OCR result. If the actual name is found, prefer using it for the JSON title, otherwise use the username.\n" +
						// "Here are some additional rules you should follow:\n" +
						`- The post was posted on ${new Date(event.timestamp).toDateString()}. The time it was posted itself is not an event start time. However, if the post is about an event, the post time can be used to extrapolate event times relative to today, time-relative wording is used; for example, if the event starts 'tomorrow', you can determine that the event begins 1 day after today's date.\n` +
						"- If no start day is explicitly provided by the caption or OCR result, and it cannot be inferred using relative times, assign `startDay` to `null`.\n" +
						"- If no end day is explicitly provided by the caption or OCR result, assign `endDay` to `null`.\n" +
						// "-If only one time is provided in the caption or OCR result, assume it's the start time.\n" +
						"- If no start hour is explicitly provided by the caption or OCR result, such as ('2 pm' or the '9' in '9-12'), you MUST assign `startHourMilitaryTime` to `null`, even if the post is about an event.\n" +
						"- If no end hour is explicitly provided by the caption or OCR result, assign `endHourMilitaryTime` to `null`.\n" +
						"- If it's an event, use any written relative time descriptors (such as 'night') to determine whether the event starts and/or ends in the AM or PM.\n" +
						// "-If the end hour is less than the start hour (for example, 9 to 2), assume the event ends on the day after the starting day.\n" +
						"- If no start minute is explicitly provided by the caption or OCR result, assign `startMinute` to `null`.\n" +
						"- If no end minute is explicitly provided by the caption or OCR result, assign `endMinute` to `null`.\n" +
						"- If the end time states 'late' or similar, assume it ends around 2 AM on the next day from `startDay`.\n" +
						"- If the end time states 'morning' or similar, assume it ends around 6 AM on the next day from `startDay`.\n" +
						"- If no end month is explicitly provided by the caption or OCR result, assign it to the same month as startMonth.\n" +
						`- If no start or end year are explicity provided, assume they are both the current year of ${new Date().getFullYear()}.\n` +
						"- If the start hour is PM and the end hour is AM, assume the event ends on the next day from the starting day.\n" +
						"- If the event happened already, indicated by past-tense language like 'last Sunday', then set `isPastEvent` to false.\n" +
						// Do this to prevent it from making adjustments to the time.
						"- Don't make any timezone-related adjustments to the times; assume it is UTC already.\n" +
						"- Don't add any extra capitalization or spacing to the title that wasn't included in the post's information.\n" +
						"- If the title of the event is longer than 210 characters, shorten it to include just the most important parts.\n" +
						// The following is to avoid organizer meetings.
						"- If post contains multiple different events, only output the result for the earliest event.\n" +
						"- If the event is explicity 'private', or a 'meeting', then set the start hour to null.\n" +
						`${tags_string.toLowerCase().includes('music') ? "- Add \`&\` in between multiple music artist names, if any exist.\n" : ""}` +
						`${tags_string.toLowerCase().includes('music') ? "- Include featured music artists in the title as well.\n" : ""}` +
						`${(caption.includes('🎱') || ocrResult.includes('🎱')) ? "- Consider 🎱 to be read as `8` if given as a time. \n" : ""}` +
						"- Do not include any other text in your response besides the raw JSON." + "\n" +
						'- Make sure JSON format is valid (i.e. contains commas after each field, except for the last one).' + "\n" +
						"\n" +
						"A:";

					console.log('prompt:', startPrompt)
					const runResponse = async (prompt) => {
						try {
							const res = await openai.createChatCompletion({
								model: "gpt-3.5-turbo",
								messages: [
									{ role: "system", content: prompt },
								],
								temperature: 0,
								max_tokens: 500,
							});
							return res;
						} catch (e) {
							console.log('Error: ', e.response.data);
							throw e;
						}
					};

					let initialGenerationAttempts = 0;
					const maxInitialGenerationAttempts = 2;
					let unvalidatedCompletion = "";
					while (initialGenerationAttempts < maxInitialGenerationAttempts) {
						try {
							unvalidatedCompletion = { event, data: (await runResponse(startPrompt)).data };
							console.log('output json 1', fixGeneratedJson(unvalidatedCompletion.data.choices[0].message.content));

							// This ignores validation for now.
							return {
								event,
								data: fixGeneratedJson(
									unvalidatedCompletion.data.choices[0].message.content
								)
							};

							break;
						} catch (e) {
							++initialGenerationAttempts;
							if (initialGenerationAttempts === maxInitialGenerationAttempts) {
								throw new Error('Could not fetch OpenAI response');
							}
						}
					}
					// Use GPT to double-check its results.
					const validationPrompt = `You were given a post from an Instagram account and used it to generate the following JSON:\n` +
						"```\n" +
						`${fixGeneratedJson(unvalidatedCompletion.data.choices[0].message.content)}` + "\n" +
						"```\n" +
						"\n" +
						"The post's caption is as follows:\n" +
						"```\n" +
						`${caption}` + "\n" +
						"```\n" +
						"\n" +
						"The post's OCR result is as follows:\n" +
						"```\n" +
						`${event.ocrResult !== undefined ? "OCR Result: " + event.ocrResult : ''}` + "\n" +
						"```\n" +
						"\n" +
						"Your job is to fix potential incorrect values for `hasStartHourInPost` in the generated JSON's values with respect to the post's information (via caption & OCR result), and output a corrected JSON. In particular, set `hasStartHourInPost` to false if the post's information doesn't contain any identifiable hour information or hour-conveying time-of-day information, disregarding whether it has a starting date. Conversely, set it to true if it does contain hour information." +
						"Don't edit any other fields besides `hasStartHourInPost`. Make sure to not change the structure of the JSON. Only output the raw JSON (in a valid format), without saying anything else. Here are some examples to help guide you." + "\n" +
						"\n" +
						`Input: The post's caption and OCR don't contain any hour-conveying info.` + "\n" +
						`Output: The JSON with "hasStartHourInPost" set to \`false\`.` + "\n" +
						"\n" +
						`Input: The post's caption and/or OCR contains "1 to 3 PM."` + "\n" +
						`Output: The JSON with "hasStartHourInPost" set to \`true\`.` + "\n" +
						"\n" +
						`Input: The post's caption and/or OCR contains just "night" or "tonight" for time-of-day.` + "\n" +
						`Output: The JSON with "hasStartHourInPost" set to \`false\` because "tonight" does not represent a specific hour.` + "\n" +
						"\n" +
						`Input: The post's OCR says "midnight"` + "\n" +
						`Output: The JSON with "hasStartHourInPost" set to \`true\` because "midnight" represents 12 AM.`;

					// console.log('validation prompt', validationPrompt);

					let validationGenerationAttempts = 0;
					const maxValidationGenerationAttempts = 2;
					while (validationGenerationAttempts < maxValidationGenerationAttempts) {
						try {
							const response = await runResponse(validationPrompt);
							const validatedCompletion = {
								event,
								data: fixGeneratedJson(
									response.data.choices[0].message.content
								)
							};
							console.log('output json 2', validatedCompletion.data)
							return validatedCompletion;
						} catch (e) {
							++validationGenerationAttempts;
							if (validationGenerationAttempts === maxValidationGenerationAttempts) {
								throw new Error('Could not fetch OpenAI response');
							}
						}
					}
				}));
			}));
	}
	catch (err) {
		console.error('Could not get OpenAI responses: ', err);
		return await useStorage().getItem('instagramEventSources');
	}
	logTimeElapsedSince(startTime, 'Instagram: getting OpenAI responses');

	let parsedOpenAIResponsesAllSources = [];
	try {
		parsedOpenAIResponsesAllSources = await Promise.all(
			openAIResponsesAllSources.map(async (openAIResponses, sourceNum) => {
				const source = instagramOrganizersDb[sourceNum];
				return Promise.all(openAIResponses.map(async ({ event, data }) => {
					let jsonFromResponse = { isNull: true };
					// const responseText = data.choices[0].text.replace(/^[^{]*/, '').replace(/[^}]*$/, '');
					const responseText = data;
					try {
						const potentialResult = JSON.parse(responseText);

						// Check if JSON contains expected fields.
						if (!(Object.hasOwn(potentialResult, 'isEvent')
							&& Object.hasOwn(potentialResult, 'title')
							&& Object.hasOwn(potentialResult, 'startHourMilitaryTime')
							&& Object.hasOwn(potentialResult, 'endHourMilitaryTime')
							&& Object.hasOwn(potentialResult, 'isPastEvent')
							&& Object.hasOwn(potentialResult, 'hasStartHourInPost')
							&& Object.hasOwn(potentialResult, 'startMinute')
							&& Object.hasOwn(potentialResult, 'endMinute')
							&& Object.hasOwn(potentialResult, 'startDay')
							&& Object.hasOwn(potentialResult, 'endDay')
							&& Object.hasOwn(potentialResult, 'startMonth')
							&& Object.hasOwn(potentialResult, 'endMonth')
							&& Object.hasOwn(potentialResult, 'startYear')
							&& Object.hasOwn(potentialResult, 'endYear')
						)) {
							throw new Error('JSON does not contain expected fields');
						}
						jsonFromResponse = potentialResult;
					} catch (e) {
						throw new Error(`Caught error: ${e}; could not parse into JSON: ${responseText}`);
					}
					// Post-processing.
					if (jsonFromResponse.startYear === null) {
						jsonFromResponse.startYear = new Date().getFullYear();
					}
					if (jsonFromResponse.endYear === null) {
						jsonFromResponse.endYear = jsonFromResponse.startYear;
					}
					if (jsonFromResponse.startMinute === null) {
						jsonFromResponse.startMinute = 0;
					}
					if (jsonFromResponse.endMinute === null) {
						jsonFromResponse.endMinute = 0;
					}
					if (jsonFromResponse.startMonth === 12 && jsonFromResponse.endMonth === 1) {
						jsonFromResponse.endYear = jsonFromResponse.startYear + 1;
					}
					if (jsonFromResponse.endMonth === null) {
						jsonFromResponse.endMonth = jsonFromResponse.startMonth;
					}
					if (jsonFromResponse.endDay === null) {
						jsonFromResponse.endDay = jsonFromResponse.startDay;
					}
					if (jsonFromResponse.endHourMilitaryTime === null) {
						// End 2 hours from startHourMilitaryTime
						jsonFromResponse.endHourMilitaryTime = jsonFromResponse.startHourMilitaryTime + 2;
						if (jsonFromResponse.endHourMilitaryTime > 23) {
							jsonFromResponse.endHourMilitaryTime -= 24;
							jsonFromResponse.endDay = jsonFromResponse.startDay + 1; // Would this overflow the month? Need to check.
						}
					}

					// Add tokens not used in the prompt.
					jsonFromResponse.organizer = source.username;
					jsonFromResponse.id = event.id;
					jsonFromResponse.url = event.permalink;

					let newTitle = jsonFromResponse.title;
					newTitle += ` @ ${source.name}`
					if (newTitle.length <= 255) {
						jsonFromResponse.title = newTitle;
					}
					// Trim title to 255 characters.
					if (jsonFromResponse.title.length > 255) {
						jsonFromResponse.title = jsonFromResponse.title.substring(0, 255);
					}

					return jsonFromResponse;
				}));
			}));
	}
	catch (err) {
		console.error('Could not parse OpenAI responses: ', err);
		return await useStorage().getItem('instagramEventSources');
	}
	logTimeElapsedSince(startTime, 'Instagram: parsing OpenAI responses');

	let updatedInstagramSources = [];
	try {
		updatedInstagramSources = await Promise.all(
			parsedOpenAIResponsesAllSources.map(async (organizerEventsAndNonEventsToAdd, sourceNum) => {
				const source = instagramOrganizersDb[sourceNum];
				const organizerId = source.id;

				// Add each of the new events and non-events to the database.
				let events = await Promise.all(organizerEventsAndNonEventsToAdd.map(async (post) => {
					// First check if post got processed.
					if (!Object.hasOwn(post, 'isNull')) {
						// Add the event or non-event to the database.
						if (post.isEvent === true
							&& post.startDay !== null
							&& post.startHourMilitaryTime !== null
							&& post.endHourMilitaryTime !== null
							&& post.startMinute !== null
							&& post.endMinute !== null
							&& post.hasStartHourInPost === true
							&& post.isPastEvent === false
						) {
							console.log("Adding InstagramEvent to database: ", post);

							let end = DateTime.fromObject({ year: post.endYear, month: post.endMonth, day: post.startDay, hour: post.endHourMilitaryTime, minute: post.endMinute }, { zone: 'America/Los_Angeles' });
							// Allow Luxon to automatically take care of overflow (i.e. day 32 of the month).
							end = end.plus({ days: post.endDay - post.startDay });
							return await prisma.instagramEvent.create({
								data: {
									igId: post.id,
									start: DateTime.fromObject({ year: post.startYear, month: post.startMonth, day: post.startDay, hour: post.startHourMilitaryTime, minute: post.startMinute }, { zone: 'America/Los_Angeles' }).toUTC().toJSDate(),
									end: end.toUTC().toJSDate(),
									// start: new Date(Date.UTC(post.startYear, post.startMonth - 1, post.startDay, post.startHourMilitaryTime + PST_OFFSET)),
									// end: new Date(Date.UTC(post.endYear, post.endMonth - 1, post.endDay, post.endHourMilitaryTime + PST_OFFSET)),
									url: post.url,
									title: post.title,
									organizerId: organizerId
								}
							});
						}
						else {
							console.log("Adding InstagramNonEvent to database: ", post);
							return await prisma.instagramNonEvent.create({
								data: {
									igId: post.id,
									organizerId: organizerId
								}
							});
						}
					}
				})
				);

				// Pruning step.
				// TODO, it's deleting incorrect events, this line is prolly wrong. oh prolly because u need to search for the events with the sae organizer
				const validEventIds = instagramOrganizersIG[sourceNum].business_discovery.media.data.map((post) => post.id);
				// const validEventIds = [];
				const organizerFromDB = await prisma.instagramEventOrganizer.findUnique({
					where: {
						id: organizerId
					}
				});

				const currentEventsIds = new Set(validEventIds);

				// Get all events from organizer.
				const eventsFromOrganizer = await prisma.instagramEvent.findMany({
					where: {
						organizerId: organizerId
					}
				});
				// Get the non-events from organizer.
				const nonEventsFromOrganizer = await prisma.instagramNonEvent.findMany({
					where: {
						organizerId: organizerId
					}
				});

				const allIdsFromOrganizer = eventsFromOrganizer.concat(nonEventsFromOrganizer);

				// Delete all events from organizer that are not in eventsToKeepIds.
				await Promise.all(allIdsFromOrganizer.map(async (event) => {
					if (!currentEventsIds.has(event.igId)) {
						const isEvent = await prisma.instagramEvent.findFirst({ where: { igId: event.igId } });
						// Current date in UTC.
						if (isEvent) {
							// TODO: check that this actually works.
							// Check if event has actually passed, with a margin of 30 days needing to pass. It's given as UTC.
							const deleteAfterDate = DateTime.now().minus({ days: 30 }).toUTC().toJSDate();
							const isEventFinished = event.end < deleteAfterDate;
							console.log(`isEventFinished: ${isEventFinished}, event: ${event.title}`);
							// Delete events not within a year of current date, in order to avoid clogging database with events that may never happen.
							const isEventWithinYear = event.start > DateTime.now().minus({ years: 1 }).toUTC().toJSDate();
							console.log(`isEventWithinYear: ${isEventWithinYear}, event: ${event.title}`)
							if (!isEventFinished && isEventWithinYear) return;

							// Delete from events.
							console.log('deleting event', event.igId, event.title)
							await prisma.instagramEvent.delete({ where: { igId: event.igId } });
						}
						else {
							// Delete from non-events.
							console.log('deleting non-event', event.igId)
							await prisma.instagramNonEvent.delete({ where: { igId: event.igId } });
						}
					}
				}));

				// Query for all events by organizer.
				// Note: potentially redundant query.
				events = await prisma.instagramEvent.findMany({
					where: {
						organizerId: organizerId
					}
				});

				setIgnoreInstagramEventsInplace(events);

				// Update lastUpdated in DB.
				await prisma.instagramEventOrganizer.update({
					where: {
						id: organizerId
					},
					data: {
						lastUpdated: new Date()
					}
				});

				return {
					events,
					city: source.city,
				};

			}));
	}
	catch (err) {
		console.error('Could not update Instagram Events: ', err);
		return await useStorage().getItem('instagramEventSources');
	}
	logTimeElapsedSince(startTime, 'Instagram: getting new event sources & pruning');

	const nonUpdatedInstagramOrganizersDb = instagramOrganizersDb.slice(firstIndexOfNonUpdatedOrganizer);
	let nonUpdatedInstagramSources = [];
	try {
		nonUpdatedInstagramSources = await Promise.all(
			nonUpdatedInstagramOrganizersDb.map(async (source) => {
				const organizerId = source.id;

				// Query for all events by organizer.
				const events = await prisma.instagramEvent.findMany({
					where: {
						organizerId: organizerId
					}
				});
				setIgnoreInstagramEventsInplace(events);

				return {
					events,
					city: source.city,
				};
			}));
	}
	catch {
		console.error('Could return Instagram Events for non-updated sources: ', err);
		return await useStorage().getItem('instagramEventSources');
	}

	const res = updatedInstagramSources.concat(nonUpdatedInstagramSources);
	await useStorage().setItem('instagramEventSources', res);
	return res;
};

async function getAllInstagramOrganizers(json) {
	return await Promise.all(
		json.map(async (source) => {
			const instagramQuery = getInstagramQuery(source.username);
			return await fetch(instagramQuery, { headers: serverFetchHeaders })
				.then(res => {
					const appUsage = res.headers.get('X-App-Usage');
					if (appUsage) {
						console.table(`[rate] Instagram; X-App-Usage after ${source.username} is ${appUsage}. Throttled when any reach 100(%).`);
					}
					return res.json();
				})
		}));
}

// Ignore events with the same name, double for-loop style.
function setIgnoreInstagramEventsInplace(eventsFromOrganizer: InstagramEvent[]) {
	for (let i = 0; i < eventsFromOrganizer.length; i++) {
		for (let j = i + 1; j < eventsFromOrganizer.length; j++) {
			if (Object.hasOwn(eventsFromOrganizer[i], 'display') && eventsFromOrganizer[i].display === 'none') { continue; }

			const nameFront = 7;
			// Ignore eventsFromOrganizer with ~same name.
			if (Object.hasOwn(eventsFromOrganizer[i], 'title') && Object.hasOwn(eventsFromOrganizer[j], 'title')
				&& (eventsFromOrganizer[i].title === eventsFromOrganizer[j].title ||
					// Ignore names with the same prefix.
				(eventsFromOrganizer[i].title.length > nameFront
					&& eventsFromOrganizer[j].title.length > nameFront
					&& eventsFromOrganizer[i].title.substring(0, nameFront).toLowerCase() === eventsFromOrganizer[j].title.substring(0, nameFront).toLowerCase()))
			) {
				// Add new property to event- used by FullCalendar to ignore event.
				eventsFromOrganizer[j].display = 'none';
			}
			// Ignore eventsFromOrganizer with the same start time and end time- as they are likely to be the same event.
			else if (Object.hasOwn(eventsFromOrganizer[i], 'start') && Object.hasOwn(eventsFromOrganizer[j], 'start')
				&& Object.hasOwn(eventsFromOrganizer[i], 'end') && Object.hasOwn(eventsFromOrganizer[j], 'end')
				&& eventsFromOrganizer[i].start.toISOString() === eventsFromOrganizer[j].start.toISOString()
				&& eventsFromOrganizer[i].end.toISOString() === eventsFromOrganizer[j].end.toISOString()
			) {
				eventsFromOrganizer[j].display = 'none';
			}
		}
	}
}
