import { Configuration, OpenAIApi } from 'openai';
import eventSourcesJSON from 'public/event_sources.json';
import { json } from 'stream/consumers';
import { serverCacheMaxAgeSeconds, serverFetchHeaders, serverStaleWhileInvalidateSeconds } from '~~/utils/util';
import { Prisma, PrismaClient } from '@prisma/client'

export default defineCachedEventHandler(async (event) => {
	const body = await fetchInstagramEvents();
	return {
		body
	}
}, {
	maxAge: serverCacheMaxAgeSeconds,
	staleMaxAge: serverStaleWhileInvalidateSeconds,
	swr: true,
});

function getInstagramQuery(sourceUsername: string) {
	return `https://graph.facebook.com/v16.0/${process.env.INSTAGRAM_BUSINESS_USER_ID}?fields=`
		+ `business_discovery.username(${sourceUsername}){biography,media_count,media.limit(1){caption,permalink,media_type,media_url,children{media_url}}}`
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

	const prisma = new PrismaClient();

	const configuration = new Configuration({
		apiKey: process.env.OPENAI_API_KEY,
	});
	const openai = new OpenAIApi(configuration);

	let instagramOrganizers = await useStorage().getItem('instagramOrganizers');
	try {
		instagramOrganizers = await Promise.all(
			eventSourcesJSON.instagram.map(async (source) => {
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

	let eventsZippedAllSources = await useStorage().getItem('eventsZippedAllSources');
	try {
		eventsZippedAllSources = await Promise.all(
			instagramOrganizers.map(async (instagramOrganizer) => {
				return await Promise.all(instagramOrganizer.business_discovery.media.data.map(async (instagramEvent) => {
					return [
						instagramEvent.id,
						{
							newEntry: instagramEvent,
							dbEntry: await prisma.instagramEvent.findUnique({
								where: {
									igId: instagramEvent.id
								}
							})
						}
					];
				}));
			}));
		await useStorage().setItem('eventsZippedAllSources', eventsZippedAllSources);
	} catch (err) {
		console.error('Could not zip events: ', err);
	}

	let unregisteredInstagramEventsAllSources = await useStorage().getItem('unregisteredInstagramEventsAllSources');
	try {
		unregisteredInstagramEventsAllSources = eventsZippedAllSources.map((eventsZipped, sourceNum) => {
			// Promise always returns false, so we filter here.
			return eventsZipped.filter(([id, eventZip]) => eventZip.dbEntry === null)
				.map(([id, eventZip]) => eventZip.newEntry);
		});
		await useStorage().setItem('unregisteredInstagramEventsAllSources', unregisteredInstagramEventsAllSources);
	} catch (err) {
		console.error('Could not filter events: ', err);
	}

	let openAIResponsesAllSources = await useStorage().getItem('openAIResponsesAllSources');
	try {
		openAIResponsesAllSources = await Promise.all(
			unregisteredInstagramEventsAllSources.map(async (unregisteredInstagramEvents, sourceNum) => {
				const source = eventSourcesJSON.instagram[sourceNum];

				return await Promise.all(unregisteredInstagramEvents.map(async (event) => {

					const tags_string = source.context_clues.join(' & ');

					const caption = event.caption;
					const prompt = `You're given a post from an Instagram account related to ${tags_string}. Your task is to parse event information and output it into JSON. (Note: it's possible that the post isn't event-related)\n` +
						"Here's all the information provided by the post:\n" +
						"```\n" +
						`caption: ${caption}` + "\n" +
						"```\n" +
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
						"Here are some additional rules you should follow:\n" +
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
							return { event, response: await runResponse() };
						} catch (e) {
							++attempts;
							if (attempts === maxAttempts) {
								throw new Error('Could not fetch OpenAI response');
							}
						}
					}
				}));
			}));
		await useStorage().setItem('openAIResponsesAllSources', openAIResponsesAllSources);
	}
	catch (err) {
		console.error('Could not get OpenAI responses: ', err);
	}

	let parsedOpenAIResponsesAllSources = await useStorage().getItem('parsedOpenAIResponsesAllSources');
	try {
		parsedOpenAIResponsesAllSources = await Promise.all(
			openAIResponsesAllSources.map(async (openAIResponses, sourceNum) => {
				const source = eventSourcesJSON.instagram[sourceNum];
				return Promise.all(openAIResponses.map(async ({ event, response }) => {
					let jsonFromResponse = { isNull: true };
					try {
						const responseText = response.data.choices[0].text.replace(/^[^{]*/, '').replace(/[^}]*$/, '');

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
							console.log('missing fields')
							throw new Error('JSON does not contain expected fields');
						}
						jsonFromResponse = potentialResult;
					} catch (e) {
						++attempts;
						console.log(`JSON parse attempt #${attempts} failed`);
						if (attempts === maxAttempts) {
							return;
						}
					}
					if (jsonFromResponse.startYear === null) {
						jsonFromResponse.startYear = new Date().getFullYear();
					}
					if (jsonFromResponse.endYear === null) {
						jsonFromResponse.endYear = jsonFromResponse.startYear;
					}
				// Post-processing.
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
					jsonFromResponse.title = `${jsonFromResponse.title} [${tags_string}]`;

					return jsonFromResponse;
				}));
			}));
		await useStorage().setItem('parsedOpenAIResponsesAllSources', parsedOpenAIResponsesAllSources);
	}
	catch (err) {
		console.error('Could not parse OpenAI responses: ', err);
	}

	let instagramEventSources = await useStorage().getItem('instagramEventSources');
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
					// First check if post is valid.
					if (!Object.hasOwn(post, 'isNull')) {
						// Add the event or non-event to the database.
						if (post.isEvent) {
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
				).then(async () => {
					// Then re-query the database for each event now that it's in the database.
					// Note: this is redundant- can concat the registered events with the new events, which we don't need to query for.
					return await Promise.all(instagramOrganizers.map(async (instagramOrganizer) => {
						const eventsToKeep = await Promise.all(instagramOrganizer.business_discovery.media.data.map((instagramEvent) => {
							return prisma.instagramEvent.findUnique({
								where: {
									igId: instagramEvent.id
								}
							});
						}));

						// Pruning step.
						const eventsToKeepIds = new Set(eventsToKeep.map((event) => event.igId));
						// Get all events from organizer.
						const eventsFromOrganizer = await prisma.instagramEvent.findMany({
							where: {
								organizerId: organizerId
							}
						});
						// Delete all events from organizer that are not in eventsToKeepIds.
						await Promise.all(eventsFromOrganizer.map(async (event) => {
							if (!eventsToKeepIds.has(event.igId)) {
								await prisma.instagramEvent.delete({
									where: {
										igId: event.igId
									}
								});
							}
						}));

						return {
							events: eventsToKeep,
							city: source.city
						};
					}));
				});
			}));
		await useStorage().setItem('instagramEventSources', instagramEventSources);
	}
	catch (err) {
		console.error('Could not add events to database: ', err);
	}

	return instagramEventSources[0];
};
