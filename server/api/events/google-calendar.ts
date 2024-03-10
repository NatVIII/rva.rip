import eventSourcesJSON from '@/assets/event_sources.json';
import { logTimeElapsedSince, serverCacheMaxAgeSeconds, serverStaleWhileInvalidateSeconds, serverFetchHeaders } from '@/utils/util';

export default defineCachedEventHandler(async (event) => {
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

// Function to replace Google tracking URLs with the actual URL
function replaceGoogleTrackingUrls(description: string): string {
	const googleTrackingUrlRegex = /https:\/\/www\.google\.com\/url\?q=(https[^&]+)&.*/g;
	return description.replace(googleTrackingUrlRegex, (match, p1) => decodeURIComponent(p1));
  }

function findImageUrls(description: string): string[] {
	if (!description) return [];
	const imageUrlRegex = /(https?:\/\/[^\s"<>]+?\.(jpg|jpeg|png|gif|bmp|svg|webp))/g;
	const matches = description.match(imageUrlRegex);
	const uniqueMatches = matches ? [...new Set(matches)] : [];
	return uniqueMatches || [];
}

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

  async function fetchGoogleCalendarEvents() {
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
		  
		  if (!res.ok) {
			throw new Error(`Error fetching Google Calendar events for ${source.name}: ${res.status} ${res.statusText}`);
		  }
		  const data = await res.json()
  
		  const events = data.items.map((item) => {
			let title = item.summary;
			let description = item.description ? replaceGoogleTrackingUrls(item.description.toString()) : '';
			let tags = [];
			// Append or prepend text if specified in the source
			if (source.prefixTitle) { title = source.prefixTitle + title; }
			if (source.suffixTitle) { title += source.suffixTitle; }
			if (source.suffixDescription) { description += source.suffixDescription; }

			// Apply filters to add tags
			if (source.filters) source.filters.forEach(filter => {
				const tag = filter[0];					//Entry 1, the tag that will be applied
				const regex = new RegExp(filter[1]);	//Entry 2, the regex script to be used
				const searchField = filter[2];			//Entry 3, whether to search the "title", "body", or "both". If none of those are in filter[2] then it'll fail always.
				const fallbackTag = filter.length > 3 ? filter[3] : null;	//Entry 4, an optional one, that'll apply a tag if the regex doesn't match

				// Check if the event title or description matches the regex based off of searchField
				let regexMatch = false;
				if (searchField === 'title') {
					regexMatch = regex.test(title);
				} else if (searchField === 'body') {
					regexMatch = regex.test(description);
				} else if (searchField === 'both') {
					regexMatch = regex.test(title) || regex.test(description);
				}
				// Check if the event title or description matches the regex based off of searchField
				if (regexMatch) {
					tags.push(tag);
				} else if (fallbackTag) {
					tags.push(fallbackTag);
				}
			});

			return {
			  id: formatTitleAndDateToID(item.start.dateTime, title),
			  title: title,
			  org: source.name,
			  start: item.start.dateTime,
			  end: item.end.dateTime,
			  url: item.htmlLink,
			  location: item.location || source.defaultLocation || 'Location not specified',
			  description: description,
			  images: findImageUrls(description),
			  tags,
			};
		  });

		  return {
			events,
			city: source.city
		  };
		})
	  );
	  await useStorage().setItem('googleCalendarSources', googleCalendarSources);
	} catch (e) {
	  console.error("Error fetching Google Calendar events: ", e);
	}
	return googleCalendarSources;
  }
  
