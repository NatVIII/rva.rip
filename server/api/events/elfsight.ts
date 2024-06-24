import eventSourcesJSON from '@/assets/event_sources.json';
import { logTimeElapsedSince, serverCacheMaxAgeSeconds, serverStaleWhileInvalidateSeconds, serverFetchHeaders, applyEventTags } from '@/utils/util';
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
				const elfsightEventTypes = firstWidget.data.settings.eventTypes;
				const elfsightLocations = firstWidget.data.settings.locations;
				return {
					events: elfsightEvents.map(event => convertElfsightEventToFullCalendarEvent(event, source, elfsightEventTypes, elfsightLocations)),
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

function convertElfsightEventToFullCalendarEvent(e, source, eventTypes, eventLocations) {
    let start = DateTime.fromISO(`${e.start.date}T${e.start.time}`).setZone('America/New_York');
    let end = DateTime.fromISO(`${e.end.date}T${e.end.time}`).setZone('America/New_York');
    let title = e.name;
    let description = e.description;
    let location = "";
    let url = "";

    if(e.eventType) //Check if the eventtype exists for an event, if it does, add indicators to the event
    {
        // Find the event type by its id in the eventTypes array
        const eventType = eventTypes.find(type => type.id === e.eventType);
        
        // Function to find the emoji for a given event type name
        const findEmojiForEventType = (eventName, sourceEventTypes) => {
            // Search for the event name in the sourceEventTypes array
            const eventTypePair = sourceEventTypes.find(([name, emoji]) => name === eventName);
        
            // If found, return the emoji, otherwise return an empty string or a default emoji
            return eventTypePair ? eventTypePair[1] : '';
        };
        
        // Prepend the event type name to the title if found
        if (eventType) { 
            const emoji = findEmojiForEventType(eventType.name, source.eventTypes);
            description = 'Event Type: ' + emoji + ' ' + eventType.name + '  <br />' + description;
            title = emoji + " " + title;
        }
    }
    else if(source.eventDefault) //If eventtype is not on the event, check if there's eventDefault info, if so add it, if not ignore it
    {
        description = 'Event Type: ' + source.eventDefault[1] + ' ' + source.eventDefault[0] + '  <br />' + description;
        title = source.eventDefault[1] + " " + title;
    }

    // Find the event location by its id in the eventLocations array
    const eventLocation = eventLocations.find(place => place.id === e.location);
    // Prepend the event type name to the title if found
    if (eventLocation) {  
        location = eventLocation.address; 
        url = "https://"+eventLocation.website;
    }

    // Append or prepend text if specified in the source
    if (source.prefixTitle) { title = source.prefixTitle + title; }

    const tags = applyEventTags(source, title, description);
    title=tags.length+" "+title;
    
    return {
        id: formatTitleAndDateToID(start.toUTC().toJSDate(), title),
        title: title,
        org: source.name,
        start: start.toUTC().toJSDate(),
        end: end.toUTC().toJSDate(),
        url: url,
        description: description,
        images: e.image.type && e.image.type.includes("image") ? [e.image.url] : [],//if it's an image, attach it
        location: location,
        tags,
    };
}
