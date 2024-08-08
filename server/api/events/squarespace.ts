import eventSourcesJSON from '@/assets/event_sources.json';
import { logTimeElapsedSince, serverCacheMaxAgeSeconds, serverStaleWhileInvalidateSeconds, serverFetchHeaders, applyEventTags } from '@/utils/util';
import { url } from 'inspector';
import { DateTime } from 'luxon';
const isDevelopment = process.env.NODE_ENV === 'development';

export default defineCachedEventHandler(async (event) => {
	const startTime = new Date();
	const body = await fetchSquarespaceEvents();
	logTimeElapsedSince(startTime.getTime(), 'Squarespace: events fetched.');
	return {
		body
	}
}, {
	maxAge: serverCacheMaxAgeSeconds,
	staleMaxAge: serverStaleWhileInvalidateSeconds,
	swr: true,
});

function formatTitleAndDateToID(inputDate: any, title: string) {
	const date = new Date(inputDate);
	const year = date.getFullYear().toString().slice(-2); // Get last 2 digits of year
	const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Get month (0-11) and format to 2 digits
	const day = date.getDate().toString().padStart(2, '0');
	const hours = date.getHours().toString().padStart(2, '0');
	const minutes = date.getMinutes().toString().padStart(2, '0');
  
    // Function to get the first three URL-compatible characters from the title
    function getFirstThreeUrlCompatibleChars(inputTitle: string): string {
        // Define URL-compatible characters (alphanumeric and some special characters)
        const urlCompatibleChars = /^[A-Za-z]+$/;

		// Ensure inputTitle is a string to prevent the "undefined is not iterable" error
		inputTitle = inputTitle || 'und';
        // Filter out non-URL-compatible characters and take the first three
        return Array.from(inputTitle)
            .filter(char => urlCompatibleChars.test(char))
            .slice(0, 3)
            .join('')
            .toLowerCase();
    }

    // Extract the first three URL-compatible characters from the title
    const titlePrefix = getFirstThreeUrlCompatibleChars(title);
  
	return `${year}${month}${day}${hours}${minutes}${titlePrefix}`;
  }

async function fetchSquarespaceEvents() {
	console.log('Fetching Squarespace events...')
	let squarespaceSources = await useStorage().getItem('squarespaceSources');
	try {
		squarespaceSources = await Promise.all(
			eventSourcesJSON.squarespace.map(async (source) => {
				// Add current date in milliseconds to the URL to get events starting from this moment.
				const response = await fetch(source.url, { headers: serverFetchHeaders });
				if (!response.ok) {
					console.error('[Squarespace] Error: could not fetch events from', source.url);
					return {
						events: [],
						city: source.city,
						name: source.name,
					} as EventNormalSource;
				}
				const squarespaceJson = await response.json();
				const squarespaceEvents = squarespaceJson.upcoming || squarespaceJson.items;
				return {
					events: squarespaceEvents.map(event => convertSquarespaceEventToFullCalendarEvent(squarespaceJson.website.timeZone, event, source)),
					city: source.city,
					name: source.name,
				} as EventNormalSource;
			})
		);
		await useStorage().setItem('squarespaceSources', squarespaceSources);
	} catch (e) {
		console.log('Error fetching Squarespace events: ', e);
	}
	return squarespaceSources;
};

function convertSquarespaceEventToFullCalendarEvent(timeZone: string, e, source) {
	let start = DateTime.fromMillis(e.startDate).setZone(timeZone);
	let end = DateTime.fromMillis(e.endDate).setZone(timeZone);
	let url = new URL(source.url).origin + e.fullUrl;
	let title = e.title;
	let description = e.body + '<br /><a href="'+url+'">More Info</a>';
	let locationParts = [
		e.location.addressTitle,
		e.location.addressLine1,
		e.location.addressLine2,
		e.location.addressCountry
	  ].filter(part => part && part.trim() !== ''); // Remove any empty or undefined parts
	// Append or prepend text if specified in the source
	if (source.prefixTitle) { title = source.prefixTitle + title; }
	if (source.suffixTitle) { title += source.suffixTitle; }
	// Get raw times because some calendars have incorrect time zones (i.e. America/New_York), even though they're in California.
	const actualStart = DateTime.fromObject({
		day: start.day,
		month: start.month,
		year: start.year,
		hour: start.hour,
		minute: start.minute,
	}, { zone: 'America/New_York' });
	const actualEnd = DateTime.fromObject({
		day: end.day,
		month: end.month,
		year: end.year,
		hour: end.hour,
		minute: end.minute,
	}, { zone: 'America/New_York' });

	const tags = applyEventTags(source, title, description);
	if (isDevelopment) title=tags.length+" "+title;

	return {
		id: formatTitleAndDateToID(actualStart.toUTC().toJSDate(), title),
		title: title,
		org: source.name,
		start: actualStart.toUTC().toJSDate(),
		end: actualEnd.toUTC().toJSDate(),
		url: url,
		description: description,
		images: e.contentType && e.contentType.includes("image") ? [e.assetUrl] : [],//if it's an image, attach it
		location: locationParts.join(", "),
		tags,
	};
}
