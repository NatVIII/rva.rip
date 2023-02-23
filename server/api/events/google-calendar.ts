import eventSourcesJSON from 'public/event_sources.json';
import { serverCacheMaxAgeSeconds, serverStaleWhileInvalidateSeconds, serverFetchHeaders } from '~~/utils/util';

export default defineCachedEventHandler(async (event) => {
	// export default defineEventHandler(async (event) => {
	const body = await fetchGoogleCalendarEvents();
	return {
		body
	}
}, {
	maxAge: serverCacheMaxAgeSeconds,
	staleMaxAge: serverStaleWhileInvalidateSeconds,
	swr: true,
});

async function fetchGoogleCalendarEvents() {
	console.log('Fetching Google Calendar events...');
	let googleCalendarSources = await useStorage().getItem('googleCalendarSources');
	try {
		if (!process.env.GOOGLE_CALENDAR_API_KEY) {
			throw new Error('No Google Calendar API key found. Please set the GOOGLE_CALENDAR_API_KEY environment variable.');
		}

		googleCalendarSources = await Promise.all(
			eventSourcesJSON.googleCalendar.map(async (source) => {

				const searchParams = new URLSearchParams({
					singleEvents: true,
					maxResults: 9999,
					timeMin: new Date(new Date().setMonth(new Date().getMonth() - 2)).toISOString(),
					timeMax: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
				});

				const res = await fetch(
					`https://www.googleapis.com/calendar/v3/calendars/${source.googleCalendarId}/events?key=${process.env.GOOGLE_CALENDAR_API_KEY}`
					+ `&${searchParams.toString()}`,
					{ headers: serverFetchHeaders }
				);
				const data = await res.json()

				const events = await Promise.all(data.items.map(async (item) => {
					const event = {
						title: item.summary,
						start: item.start.dateTime,
						end: item.end.dateTime,
						url: item.htmlLink,
					};
					return event;
				}));
				return {
					events,
					city: source.city
				};
			}
			));
		await useStorage().setItem('googleCalendarSources', googleCalendarSources);
	}
	catch (e) {
		console.error("Error fetching Google Calendar events: ", e);
	}
	return googleCalendarSources;
}
