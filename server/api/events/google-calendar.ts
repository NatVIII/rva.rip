import eventSourcesJSON from '@/assets/event_sources.json';
import { logTimeElapsedSince, serverCacheMaxAgeSeconds, serverStaleWhileInvalidateSeconds, serverFetchHeaders } from '~~/utils/util';

export default defineCachedEventHandler(async (event) => {
	console.log('defineCachedEventHandler');
	// export default defineEventHandler(async (event) => {
	const startTime = new Date();
	const body = await fetchGoogleCalendarEvents();
	logTimeElapsedSince(startTime.getTime(), 'Google Calendar: events fetched.');
	return {
		body
	}
}, {
	maxAge: serverCacheMaxAgeSeconds,
	staleMaxAge: serverStaleWhileInvalidateSeconds,
	swr: true,
});

async function fetchGoogleCalendarEvents() {
	console.log('fetchGoogleCalendarEvents');
	let googleCalendarSources = await useStorage().getItem('googleCalendarSources');
	try {
		if (!process.env.GOOGLE_CALENDAR_API_KEY) {
			throw new Error('No Google Calendar API key found. Please set the GOOGLE_CALENDAR_API_KEY environment variable.');
		}

		googleCalendarSources = await Promise.all(
			eventSourcesJSON.googleCalendar.map(async (source) => {

				const searchParams = new URLSearchParams({
					singleEvents: 'true',
					maxResults: '9999',
					timeMin: new Date(new Date().setMonth(new Date().getMonth() - 2)).toISOString(),
					timeMax: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
				});

				const res = await fetch(
					`https://www.googleapis.com/calendar/v3/calendars/${source.googleCalendarId}/events?key=${process.env.GOOGLE_CALENDAR_API_KEY}`
					+ `&${searchParams.toString()}`,
					{ headers: serverFetchHeaders }
				);
				// Error check.
				if (!res.ok) {
					throw new Error(`Error fetching Google Calendar events for ${source.name}: ${res.status} ${res.statusText}`);
				}
				const data = await res.json()

				console.log(data);

				const events = await Promise.all(data.items.map(async (item: {
					summary: any;
					start: { dateTime: any; };
					end: { dateTime: any; };
					htmlLink: any;
					location: any; // Add location as property
					description: any; // Add description as property
				}) => {
					const event: {
						title: string;
						org: string;
						start: any;
						end: any;
						url: any;
						location: string; // Specify location as optional here as well
						description: string; // Specify location as optional here as well
					} = {
						title: `${item.summary}`,
						org: `${source.name}`,
						start: item.start.dateTime,
						end: item.end.dateTime,
						url: item.htmlLink,
						location: `${item.location ? item.location.toString() : 'Location not specified'}`,
						description: `${item.description ? item.description.toString() : 'Description not available'}`,
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
