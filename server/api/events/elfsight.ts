import eventSourcesJSON from '@/assets/event_sources.json';
import { logTimeElapsedSince, serverCacheMaxAgeSeconds, serverStaleWhileInvalidateSeconds, serverFetchHeaders } from '@/utils/util';
import { url } from 'inspector';
import { DateTime } from 'luxon';

export default defineCachedEventHandler(async (event) => {
	const startTime = new Date();
	const body = await fetchElfsightEvents();
	logTimeElapsedSince(startTime.getTime(), 'Elfsight: events fetched.');
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

async function fetchElfsightEvents() {
	console.log('Fetching Elfsight events...');
	let elfsightSources = await useStorage().getItem('elfsightSources');
	try {
		elfsightSources = await Promise.all(
			eventSourcesJSON.elfsight.map(async (source) => {
				// Add current date in milliseconds to the URL to get events starting from this moment.
				const response = await fetch(source.url, { headers: serverFetchHeaders });
				if (!response.ok) {
					console.error('[Elfsight] Error: could not fetch events from', source.url);
					return {
						events: [],
						city: source.city,
					} as EventNormalSource;
				}
				const elfsightJson = await response.json();
				const firstWidgetKey = Object.keys(elfsightJson.data.widgets)[0];//I'm just gonna assume each elfsight calendar has only one, like S23
                const firstWidget = elfsightJson.data.widgets[firstWidgetKey];
				const elfsightEvents = firstWidget.data.settings.events;
				return {
					events: elfsightEvents.map(event => convertElfsightEventToFullCalendarEvent(event, source)),
					city: source.city
				} as EventNormalSource;
			})
		);
		await useStorage().setItem('elfsightSources', elfsightSources);
	} catch (e) {
		console.log('Error fetching Elfsight events: ', e);
	}
	return elfsightSources;
};

function convertElfsightEventToFullCalendarEvent(e, source) {
	let start = DateTime.fromISO(`${e.start.date}T${e.start.time}`).setZone('America/New_York');
	let end = DateTime.fromISO(`${e.end.date}T${e.end.time}`).setZone('America/New_York');
	let title = e.name;
	let description = e.description;
	// Append or prepend text if specified in the source
	if (source.prefixTitle) { title = source.prefixTitle + title; }

	return {
		id: formatTitleAndDateToID(start.toUTC().toJSDate(), title),
		title: title,
		org: source.name,
		start: start.toUTC().toJSDate(),
		end: end.toUTC().toJSDate(),
		url: "",
		description: description,
		images: e.image.type && e.image.type.includes("image") ? [e.image.url] : [],//if it's an image, attach it
		location: "",
		/*location: {
			geoJSON: {
				type: "Point",
				coordinates: [e.location.mapLng, e.location.mapLat]
			},
			eventVenue: {
				name: e.location.addressTitle,
				address: {
					streetAddress: e.location.addressLine1,
					// TODO: Some of these are not provided.
					//                        addressLocality: e.location.addressLine2.split(',')[0].trim(),
					//                        addressRegion: e.location.addressLine2.split(',')[1].trim(),
					//                        postalCode: e.location.addressLine2.split(',')[2].trim(),
					addressCountry: e.location.addressCountry
				},
				geo: {
					latitude: e.location.mapLat,
					longitude: e.location.mapLng,
				}
			},
		},*/
	};
}
