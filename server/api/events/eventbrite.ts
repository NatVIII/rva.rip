import eventSourcesJSON from '@/assets/event_sources.json';
import { logTimeElapsedSince, serverCacheMaxAgeSeconds, serverFetchHeaders, serverStaleWhileInvalidateSeconds } from '~~/utils/util';
import { JSDOM } from 'jsdom';
import { DateTime } from 'luxon';

export default defineCachedEventHandler(async (event) => {
	const startTime = new Date();
	const body = await fetchEventbriteEvents();
	logTimeElapsedSince(startTime, 'Eventbrite: events fetched.');
	return {
		body
	}
}, {
	maxAge: serverCacheMaxAgeSeconds,
	staleMaxAge: serverStaleWhileInvalidateSeconds,
	swr: true,
});

async function fetchEventbriteEvents() {
	console.log('Fetching Eventbrite events...');

	if (process.env.EVENTBRITE_API_KEY === undefined) {
		console.error("No Eventbrite API key found. Please set the EVENTBRITE_API_KEY environment variable.");
	}

	let eventbriteSources = await useStorage().getItem('eventbriteSources');
	try {
		eventbriteSources = await Promise.all(
			eventSourcesJSON.eventbriteAccounts.map(async (source) => {
				return await fetch(source.url, { headers: serverFetchHeaders })
					// Error check.
					.then(res => {
						if (!res.ok) {
							console.error(`Error fetching Eventbrite events for ${source.name}: ${res.status} ${res.statusText}`);
							return {
								events: [],
								city: source.city,
								name: source.name,
							} as EventNormalSource;
						}
						return res;
					})
					.then(res => res.text())
					.then(async html => {
						const dom = new JSDOM(html);
						const eventsRaw = JSON.parse(dom.window.document.querySelectorAll('script[type="application/ld+json"]')[1].innerHTML)
							.map(event => convertSchemaDotOrgEventToFullCalendarEvent(event, source.name));

						// Since public & private Eventbrite endpoints provides a series of events as a single event, we need to split them up using their API.
						const events = Promise.all(eventsRaw.map(async (rawEvent) => {
							const isLongerThan3Days = (rawEvent.end.getTime() - rawEvent.start.getTime()) / (1000 * 3600 * 24) > 3;
							if (isLongerThan3Days) {
								const eventSeries = await getEventSeries(rawEvent.url);
								return eventSeries.map(event => convertEventbriteAPIEventToFullCalendarEvent(event, source.name));
							} else {
								return rawEvent;
							}
						}));
						const newEvents = (await events).flat();

						return {
							events: newEvents,
							city: source.city,
							name: source.name,
						} as EventNormalSource;
					});
			}));
		const eventbriteSingleEventSeries = await Promise.all(
			eventSourcesJSON.eventbriteSingleEventSeries.map(async (source) => {
				const eventsSeries = (await getEventSeries(source.url)).map(event => convertEventbriteAPIEventToFullCalendarEvent(event, source.sourceName));
				return {
					events: eventsSeries,
					city: source.city,
					name: source.name,
				} as EventNormalSource;
			}));
		const allEventbriteSources = eventbriteSources.concat(eventbriteSingleEventSeries);
		await useStorage().setItem('eventbriteSources', allEventbriteSources);
		return allEventbriteSources;
	}
	catch (e) {
		console.error("Error fetching Eventbrite events: ", e);
	}
	return eventbriteSources;
};

async function getEventSeries(event_url: string) {
	// Split URL by '-' and get the last part.
	const series_id = event_url.split('-').pop();
	const res = await fetch(`https://www.eventbriteapi.com/v3/series/${series_id}/events/?token=${process.env.EVENTBRITE_API_KEY}`, { headers: serverFetchHeaders })
		.then((res) => {
			return res.json();
		});

	// Sometimes the response returns 404 for whatever reason. I imagine for events with information set to private. Ignore those.
	if (!res.events) {
		return [];
	} else {
		return res.events;
	};
}

function convertSchemaDotOrgEventToFullCalendarEvent(item, sourceName) {
	// If we have a `geo` object, format it to geoJSON.
	var geoJSON = (item.location.geo) ? {
		type: "Point",
		coordinates: [
			item.location.geo.longitude,
			item.location.geo.latitude
		]
		// Otherwise, set it to null.
	} : null;

	return {
		title: `${item.name} @ ${sourceName}`,
		// Converts from System Time to UTC.
		start: DateTime.fromISO(item.startDate).toUTC().toJSDate(),
		end: DateTime.fromISO(item.endDate).toUTC().toJSDate(),
		url: item.url,
		extendedProps: {
			description: item.description || null,
			image: item.image,
			location: {
				geoJSON: geoJSON,
				eventVenue: {
					name: item.location.name,
					address: {
						streetAddress: item.location.streetAddress,
						addressLocality: item.location.addressLocality,
						addressRegion: item.location.addressRegion,
						postalCode: item.location.postalCode,
						addressCountry: item.location.addressCountry
					},
					geo: item.location?.geo
				}
			}
		}
	};
};

// The problem with the Eventbrite developer API format is that it lacks geolocation.
function convertEventbriteAPIEventToFullCalendarEvent(item, sourceName) {
	return {
		title: `${item.name.text} @ ${sourceName}`,
		start: new Date(item.start.utc),
		end: new Date(item.end.utc),
		url: item.url,
	};
};
