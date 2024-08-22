import eventSourcesJSON from '@/assets/event_sources.json';
import { logTimeElapsedSince, serverCacheMaxAgeSeconds, serverStaleWhileInvalidateSeconds, serverFetchHeaders, applyEventTags } from '@/utils/util';
import { url } from 'inspector';
import { DateTime } from 'luxon';
const isDevelopment = process.env.NODE_ENV === 'development';

export default defineCachedEventHandler(async (event) => {
	const startTime = new Date();
	const body = await fetchlibcalEvents();
	logTimeElapsedSince(startTime.getTime(), 'libcal: events fetched.');
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

function formatCalendartoLocation(calendarName: string, calendarToLocationArray: string[]) { //In Richmond the Calendar Name is the easiest way to find what the address location of this event is, in order to get the address we use this function
	for (let pair of calendarToLocationArray) { //Loop through each value in the calendarToLocationArray
		if (pair[0] == calendarName) {
			return pair[1];
		}
	}
	return "Error on server side processing, please alert this instance's maintainers! ";
}

async function fetchlibcalEvents() {
	console.log('Fetching libcal events...')
	let libcalSources = await useStorage().getItem('libcalSources');
	try {
		libcalSources = await Promise.all(
			eventSourcesJSON.libcal.map(async (source) => {
				// Add current date in milliseconds to the URL to get events starting from this moment.
				const response = await fetch(source.url, { headers: serverFetchHeaders });
				if (!response.ok) {
					console.error('[libcal] Error: could not fetch events from', source.url);
					return {
						events: [],
						city: source.city,
						name: source.name,
					} as EventNormalSource;
				}
				const libcalJson = await response.json();
				const libcalEvents = libcalJson.results;
				return {
					events: libcalEvents.map(event => convertlibcalEventToFullCalendarEvent(libcalJson.timezone, event, source)),
					city: source.city,
					name: source.name,
				} as EventNormalSource;
			})
		);
		await useStorage().setItem('libcalSources', libcalSources);
	} catch (e) {
		console.log('Error fetching libcal events: ', e);
	}
	return libcalSources;
};

function convertlibcalEventToFullCalendarEvent(timeZone: string, e, source) {
	let start = DateTime.fromSQL(e.startdt).setZone(timeZone);
	let end = DateTime.fromSQL(e.enddt).setZone(timeZone);
	let url = e.url;
	let title = e.title;
	let description = e.shortdesc;
	if	(('online_registration' in e && 'in_person_registration' in e && 'registration_enabled' in e) && //If you have to register
		(e.online_registration||e.in_person_registration||e.registration_enabled))
		description = description + '<br /><a href="'+url+'">For more information and to register check out the full page here!</a>';
	else description = description + '<br /><a href="'+url+'">For more information check out the full page here!</a>';
	let location = formatCalendartoLocation(e.calendar, source.calendarToLocation); // Use the formatCalendartoLocation function to get an address.
	// Append or prepend text if specified in the source
	if (source.prefixTitle) { title = source.prefixTitle + title; }
	if (source.suffixTitle) { title += source.suffixTitle; }

	const tags = applyEventTags(source, title, description);
	if (isDevelopment) title=tags.length+" "+title;
	if (e.location) description = 'Location: '+e.location+'<br />'+description;
	if (e.categories_arr) e.categories_arr.forEach(category => { description = description + '<br />Category: '+category.name});

	return {
		id: formatTitleAndDateToID(start.toUTC().toJSDate(), title),
		title: title,
		org: source.name+": "+e.calendar,
		start: start.toUTC().toJSDate(),
		end: end.toUTC().toJSDate(),
		url: url,
		description: description,
		images: e.featured_image ? [e.featured_image] : [],//if it's an image, attach it (add checking logic later)
		location: location,
		tags,
	};
}
