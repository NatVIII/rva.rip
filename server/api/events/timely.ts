import eventSourcesJSON from 'public/event_sources.json';
import { logTimeElapsedSince, serverCacheMaxAgeSeconds, serverStaleWhileInvalidateSeconds, serverFetchHeaders } from '~~/utils/util';
import { DateTime } from 'luxon';

export default defineCachedEventHandler(async (event) => {
	const startTime = new Date();
	const body = await fetchTimelyEvents();
	logTimeElapsedSince(startTime, 'Timely: events fetched.');
	return {
		body
	}
}, {
	maxAge: serverCacheMaxAgeSeconds,
	staleMaxAge: serverStaleWhileInvalidateSeconds,
	swr: true,
});

async function fetchTimelyEvents() {
	console.log('Fetching Timely events...')
	let timelySources = await useStorage().getItem('timelySources');
	try {
		timelySources = await Promise.all(
			eventSourcesJSON.timely.map(async (source) => {
				// Can get the calendarId from inspecting the Calendar's request URL in the Browser's Network inspector.
				// startUtc is 1 month before today in Unix epoch time.
				const startUtc = Math.floor(new Date(new Date().getTime() - 30 * 24 * 60 * 60 * 1000).getTime() / 1000);
				// endUtc is 1 month after today in Unix epoch time.
				const endUtc = Math.floor(new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000).getTime() / 1000);
				const fetchUrl = new URL(`https://timelyapp.time.ly/api/calendars/${source.calendarId}/events?group_by_date=1&start_date_utc=${startUtc}&end_date_utc=${endUtc}&per_page=600&page=1/`);

				// This seems to be hard-set by Timely? Needs further testing.
				const xApiKey = 'c6e5e0363b5925b28552de8805464c66f25ba0ce';
				const headers = {
					...serverFetchHeaders,
					'x-api-key': xApiKey,
				};

				const response = await fetch(fetchUrl, { headers });

				if (!response.ok) {
					console.error('[Timely] Error: could not fetch events from', source.name);
					return {
						events: [],
						city: source.city,
					};
				}

				const json = await response.json();
				// Convert to map because Timely returns an object with keys being dates, with data as values.
				const map = new Map(Object.entries(json.data.items));

				const events = [...map.values()].map((item) => {
					item = item[0];
					const timeZone = item.timezone;
					return {
						title: `${item.title} @ ${source.name}`,
						url: item.url,
						start: DateTime.fromFormat(item.start_datetime, 'yyyy-MM-dd HH:mm:ss', { zone: timeZone }),
						end: DateTime.fromFormat(item.end_datetime, 'yyyy-MM-dd HH:mm:ss', { zone: timeZone }),
					}
				});

				return {
					events,
					city: source.city
				};
			})
		);
		await useStorage().setItem('timelySources', timelySources);
	} catch (e) {
		console.log('Error fetching Timely events: ', e);
	}
	return timelySources;
};
