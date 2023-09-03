import eventSourcesJSON from '@/assets/event_sources.json';
import { logTimeElapsedSince, serverCacheMaxAgeSeconds, serverStaleWhileInvalidateSeconds, serverFetchHeaders } from '~~/utils/util';
import { DateTime } from 'luxon';

export default defineCachedEventHandler(async (event) => {
	const startTime = new Date();
	const body = await fetchForbiddenTicketsEvents();
	logTimeElapsedSince(startTime, 'ForbiddenTickets: events fetched.');
	return {
		body
	}
}, {
	maxAge: serverCacheMaxAgeSeconds,
	staleMaxAge: serverStaleWhileInvalidateSeconds,
	swr: true,
});

async function fetchForbiddenTicketsEvents() {
	console.log('Fetching ForbiddenTickets events...')
	let forbiddenTicketsSources = await useStorage().getItem('forbiddenTicketsSources');
	try {
		forbiddenTicketsSources = await Promise.all(
			eventSourcesJSON.forbiddenTickets.map(async (source) => {
				const fetchUrl = new URL(`https://forbiddentickets.com/events/${source.username}/json`);

				const response = await fetch(fetchUrl);
				if (!response.ok) {
					console.error('[ForbiddenTickets] Error: could not fetch events from', source.name);
					return {
						events: [],
						city: source.city,
					};
				}

				const json = await response.json();

				const events = json.map((item) => {
					return {
						title: `${item.title}`,
						url: item.url,
						start: DateTime.fromFormat(item.start, 'yyyy-MM-dd HH:mm:ss', { zone: 'UTC' }),
						end: DateTime.fromFormat(item.end, 'yyyy-MM-dd HH:mm:ss', { zone: 'UTC' }),
					}
				});

				console.log('Fetched ForbiddenTickets events: ', events)

				return {
					events,
					city: source.city
				};
			})
		);
		await useStorage().setItem('forbiddenTicketsSources', forbiddenTicketsSources);
	} catch (e) {
		console.log('Error fetching ForbiddenTickets events: ', e);
	}
	return forbiddenTicketsSources;
};
