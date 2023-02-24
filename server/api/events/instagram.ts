import { Configuration, OpenAIApi } from 'openai';
import eventSourcesJSON from 'public/event_sources.json';
import { logTimeElapsedSince, serverCacheMaxAgeSeconds, serverFetchHeaders, serverStaleWhileInvalidateSeconds } from '~~/utils/util';
import { PrismaClient } from '@prisma/client'
import vision from '@google-cloud/vision';

export default defineCachedEventHandler(async (event) => {
// export default defineEventHandler(async (event) => {

	const body = await fetchInstagramEvents();
	return {
		body
	}
}, {
	maxAge: serverCacheMaxAgeSeconds,
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
				result.fullTextAnnotation.text : ''
			return annotations;
		}));

	const result = annotationsAll.join('\n');
	return result;
}

function getInstagramQuery(sourceUsername: string) {
	return `https://graph.facebook.com/v16.0/${process.env.INSTAGRAM_BUSINESS_USER_ID}?fields=`
		+ `business_discovery.username(${sourceUsername}){biography,media_count,media.limit(6){caption,permalink,media_type,media_url,children{media_url}}}`
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

	let instagramOrganizers = await useStorage().getItem('instagramOrganizers');
	// const instagramJson = [eventSourcesJSON.instagram[0]];
	const instagramJson = eventSourcesJSON.instagram;
	console.log('instagramJson: ', instagramJson);

	try {
		instagramOrganizers = await Promise.all(
			instagramJson.map(async (source) => {
				const instagramQuery = getInstagramQuery(source.username);
				return await fetch(instagramQuery, { headers: serverFetchHeaders })
					.then(res => {
						return res.json();
					})
		}));
		await useStorage().setItem('instagramOrganizers', instagramOrganizers);
	} catch (err) {
		console.error('Could not fetch data from Instagram: ', err);
	}
	logTimeElapsedSince(startTime, 'Instagram: fetching Instagram data');

	// Check if last organizer is an error message.
	const lastOrganizer = instagramOrganizers[instagramOrganizers.length - 1];
	if (lastOrganizer.error && lastOrganizer.error.code && lastOrganizer.error.code === 4) {
		console.error("Instagram API rate limit reached! Returning cached data.")
		console.log('instagramOrganizers: ', instagramOrganizers);
		return await useStorage().getItem('instagramEventSources');
	}

	let eventsZippedAllSources = await useStorage().getItem('eventsZippedAllSources');
	try {
		eventsZippedAllSources = await Promise.all(
			instagramOrganizers.map(async (instagramOrganizer) => {
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
					console.log('dbNonEntry', dbEntryNonEvent);
					return [
						instagramEvent.id,
						{
							newEntry: instagramEvent,
							dbEntry: dbEntryNonEvent
						}
					];
				}));
			}));
		await useStorage().setItem('eventsZippedAllSources', eventsZippedAllSources);
	} catch (err) {
		console.error('Could not zip events: ', err);
	}

	logTimeElapsedSince(startTime, 'Instagram: zipping events');

	const eventsZippedAllSourcesMap = eventsZippedAllSources.map((eventsZipped) => {
		return new Map(eventsZipped);
	});

	let unregisteredInstagramEventsAllSources = [];
	try {
		unregisteredInstagramEventsAllSources = eventsZippedAllSources.map((eventsZipped, sourceNum) => {
			// Promise always returns false, so we filter here.
			return eventsZipped.filter(([id, eventZip]) => eventZip.dbEntry === null)
				.map(([id, eventZip]) => eventZip.newEntry);
		});
	} catch (err) {
		console.error('Could not filter events: ', err);
	}
	logTimeElapsedSince(startTime, 'Instagram: filtering events');

	let unregisteredInstagramEventsWithOcrAllSources = unregisteredInstagramEventsAllSources;
	try {
		unregisteredInstagramEventsWithOcrAllSources = await Promise.all(
			unregisteredInstagramEventsAllSources.map(async (unregisteredInstagramEvents) => {
				return await Promise.all(unregisteredInstagramEvents.map(async (event) => {
					const mediaLinks = event.children ?
						event.children.data.filter((child) => child.media_url.includes('jpg'))
							.map((child) => child.media_url)
						:
						[event.media_url];
					console.log('mediaLinks', mediaLinks);

					const ocrResult = await doOCR(mediaLinks);
					return {
						...event,
						ocrResult
					};
				}
				));
			}));
	}
	catch (err) {
		console.error('Could perform OCR: ', err);
	}
	logTimeElapsedSince(startTime, 'Instagram: performing OCR');

	let openAIResponsesAllSources = [];
	try {
		openAIResponsesAllSources = await Promise.all(
			unregisteredInstagramEventsWithOcrAllSources.map(async (unregisteredInstagramEvents, sourceNum) => {
				const source = eventSourcesJSON.instagram[sourceNum];

				return await Promise.all(unregisteredInstagramEvents.map(async (event) => {

					const tags_string = source.context_clues.join(' & ');

					const caption = event.caption;
					const prompt = `You're given a post from an Instagram account${source.context_clues.length > 0 ? ' related to ' + tags_string : ''}. Your task is to parse event information and output it into JSON. (Note: it's possible that the post isn't event-related).\n` +
						"Here's the caption provided by the post:\n" +
						"```\n" +
						`${caption}` + "\n" +
						"```\n" +
						"\n" +
						"Here's the result of an OCR AI that reads text from the post's image:\n" +
						"```\n" +
						`${event.ocrResult !== undefined ? "OCR Result: " + event.ocrResult : ''}` + "\n" +
						"```\n" +
						"\n" +
						"Output the results in the following JSON format: \n" +
						"```\n" +
						`{ ` +
						`"isEvent": boolean, ` +
						`"title": string, ` +
						`"startHourMilitaryTime": number, ` +
						`"endHourMilitaryTime": number, ` +
						`"startDay": number, ` +
						`"endDay": number, ` +
						`"startMonth": number, ` +
						`"endMonth": number` +
						`"startYear": number, ` +
						`"endYear": number, ` +
						` }\n` +
						"```\n" +
						"Here's some important information regarding the post information:\n" +
						"-Information provided by the caption is guaranteed to be correct. However, the caption might be lacking information.\n" +
						"-The OCR result is provided by an OCR AI & thus may contain errors. Use it as a supplement for the information provided in the caption! This is especially useful when the caption is lacking information. The OCR Result also may contain information that's not provided by the caption!\n" +
						"-Sometimes a person or artist's username and their actual name can be found in the caption and OCR result; the username can be indicated by it being all lowercase and containing `.`s or `_`s. Their actual names would have very similar letters to the username, and might be provided by the OCR result. If the actual name is found, prefer using it for the JSON title, otherwise use the username.\n" +
						"Here are some additional rules you should follow:\n" +
						"-If the end time states 'late' or similar, assume it ends around 2 AM.\n" +
						"-If the end time states 'morning' or similar, assume it ends around 6 AM.\n" +
						"-If no end day is explicitly provided by the post, assign it to null.\n" +
						"-If no end hour is explicitly provided by the post, assign it to null.\n" +
						"-If no end month is explicitly provided by the post, assign it to the same month as startMonth.\n" +
						`-If no start or end year are explicity provided, assume they are both the current year of ${new Date().getFullYear()}.\n` +
						"-Don't add any extra capitalization or spacing to the title that wasn't included in the post's information.\n" +
						`${source.context_clues.some(clue => clue.toLowerCase().includes('live music')) ? "-Add \`&\` in between multiple music artist names, if any exist.\n" : ""}` +
						`${source.context_clues.some(clue => clue.toLowerCase().includes('live music')) ? "-Include featured music artists in the title as well.\n" : ""}` +
						"-Do not include any other text in your response besides the raw JSON." + "\n" +
						"\n" +
						"A:";

					const runResponse = async () => {
						try {
							const res = await openai.createCompletion({
								model: "text-davinci-003",
								// model: "text-curie-001",
								prompt,
								temperature: 0,
								max_tokens: 500,
							});
							return res;
						} catch (e) {
							console.log('Error: ', e.response.data);
							throw e;
						}
					};

					let attempts = 0;
					const maxAttempts = 2;
					while (attempts < maxAttempts) {
						try {
							return { event, data: (await runResponse()).data };
						} catch (e) {
							++attempts;
							if (attempts === maxAttempts) {
								throw new Error('Could not fetch OpenAI response');
							}
						}
					}
				}));
			}));
	}
	catch (err) {
		console.error('Could not get OpenAI responses: ', err);
	}
	logTimeElapsedSince(startTime, 'Instagram: getting OpenAI responses');

	let parsedOpenAIResponsesAllSources = [];
	try {
		parsedOpenAIResponsesAllSources = await Promise.all(
			openAIResponsesAllSources.map(async (openAIResponses, sourceNum) => {
				const source = eventSourcesJSON.instagram[sourceNum];
				return Promise.all(openAIResponses.map(async ({ event, data }) => {
					let jsonFromResponse = { isNull: true };
					try {
						const responseText = data.choices[0].text.replace(/^[^{]*/, '').replace(/[^}]*$/, '');
						console.log('Parsing the following into JSON: ', responseText)
						const potentialResult = JSON.parse(await responseText);

						// Check if JSON contains expected fields.
						if (!(Object.hasOwn(potentialResult, 'isEvent')
							&& Object.hasOwn(potentialResult, 'title')
							&& Object.hasOwn(potentialResult, 'startHourMilitaryTime')
							&& Object.hasOwn(potentialResult, 'endHourMilitaryTime')
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
						console.error(e);
						throw new Error('Could not parse into JSON: ', responseText);
					}
					// Post-processing.
					if (jsonFromResponse.startYear === null) {
						jsonFromResponse.startYear = new Date().getFullYear();
					}
					if (jsonFromResponse.endYear === null) {
						jsonFromResponse.endYear = jsonFromResponse.startYear;
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

					const tags_string = source.context_clues.join(' & ');
					jsonFromResponse.title = `${jsonFromResponse.title}${source.context_clues.length > 0 ? ' [' + tags_string + ']' : ''}`;

					return jsonFromResponse;
				}));
			}));
	}
	catch (err) {
		console.error('Could not parse OpenAI responses: ', err);
	}
	logTimeElapsedSince(startTime, 'Instagram: parsing OpenAI responses');

	let instagramEventSources = await useStorage().getItem('instagramEventSources') || [];
	try {
		instagramEventSources = await Promise.all(
			parsedOpenAIResponsesAllSources.map(async (organizerEventsAndNonEventsToAdd, sourceNum) => {
				const source = eventSourcesJSON.instagram[sourceNum];

				// Add to already-existing event organizer if it exists. Otherwise, create a new event organizer.
				const organizer = await prisma.instagramEventOrganizer.findFirst({
					where: {
						name: source.username
					}
				}
				).then(async (organizer) => {
					if (organizer === null) {
						return await prisma.instagramEventOrganizer.create({
							data: {
								name: source.username
							}
						});
					}
					else { return organizer; };
				});
				const organizerId = (await organizer).id;

				// Add each of the new events and non-events to the database.
				return await Promise.all(organizerEventsAndNonEventsToAdd.map(async (post) => {
					// First check if post got processed.
					if (!Object.hasOwn(post, 'isNull')) {
						// Add the event or non-event to the database.
						if (post.isEvent) {
							console.log("Adding InstagramEvent to database: ", post);
							return await prisma.instagramEvent.create({
								data: {
									igId: post.id,
									start: new Date(post.startYear, post.startMonth - 1, post.startDay, post.startHourMilitaryTime),
									end: new Date(post.endYear, post.endMonth - 1, post.endDay, post.endHourMilitaryTime),
									url: post.url,
									title: post.title,
									organizerId: organizerId
								}
							});
						}
						else {
							return await prisma.instagramNonEvent.create({
								data: {
									igId: post.id,
									organizerId: organizerId
								}
							});
						}
					}
				})
				).then(async (newEventsAndNonEvents) => {
					// This avoids redundant queries to the DB.

					const currentEventsIds = new Set();
					let currentEventSourceMap = eventsZippedAllSourcesMap[sourceNum]
					newEventsAndNonEvents.forEach((newEventOrNonEvent) => {
						// Check if it's an event.
						if (Object.hasOwn(newEventOrNonEvent, 'start')) {
							// Get previous entry.
							const newEntry = currentEventSourceMap.get(newEventOrNonEvent.igId);
							newEntry.dbEntry = newEventOrNonEvent;
							currentEventSourceMap.set(newEventOrNonEvent.igId, newEntry);
						}
						// Otherwise remove it from map.
						else {
							currentEventsIds.add(newEventOrNonEvent.igId);
							currentEventSourceMap.delete(newEventOrNonEvent.igId);
						}
					});
					// Map each entry to have just .dbEntry
					const eventsToKeep = Array.from(currentEventSourceMap.values()).map((entry) => { return entry.dbEntry });

					// Pruning step.
					eventsToKeep.forEach((event) => currentEventsIds.add(event.igId));
					// Get all events from organizer.
					const eventsFromOrganizer = await prisma.instagramEvent.findMany({
						where: {
							organizerId: organizerId
						}
					});
					// Delete all events from organizer that are not in eventsToKeepIds.
					await Promise.all(eventsFromOrganizer.map(async (event) => {
						if (!currentEventsIds.has(event.igId)) {
							const res = await prisma.instagramEvent.delete({
								where: {
									igId: event.igId
								}
							});
							if (res === null) {
								// Delete from non-events.
								await prisma.instagramNonEvent.delete({
									where: {
										igId: event.igId
									}
								});
							}
						}
					}))

					// Ignore events with the same name, double for-loop style.
					for (let i = 0; i < eventsToKeep.length; i++) {
						for (let j = i + 1; j < eventsToKeep.length; j++) {
							if (Object.hasOwn(eventsToKeep[i], 'display') && eventsToKeep[i].display === 'none') { continue; }

							if (Object.hasOwn(eventsToKeep[i], 'title') && Object.hasOwn(eventsToKeep[j], 'title') && eventsToKeep[i].title === eventsToKeep[j].title) {
								eventsToKeep[j].display = 'none';
							}
						}
					}

					return {
						events: eventsToKeep,
						city: source.city,
					};
				});
			}));
		await useStorage().setItem('instagramEventSources', instagramEventSources);
	}
	catch (err) {
		console.error('Could return Instagram Events: ', err);
	}
	logTimeElapsedSince(startTime, 'Instagram: getting new event sources & pruning');

	console.table(instagramEventSources);

	return instagramEventSources;
};
