export const clientCacheMaxAgeSeconds = 20 * 60;
export const clientStaleWhileInvalidateSeconds = 12 * 3600;

export const serverCacheMaxAgeSeconds = 20 * 60;
// For how long can a server use an invalidated response (during which it will revalidate for the next request).
// But it appears that the Nitro server (Nuxt's backend) supports a specific flag for always using stale-while-revalidating if set to -1.
// https://nitro.unjs.io/guide/introduction/cache
export const serverStaleWhileInvalidateSeconds = -1; /* 24 * 3600; */

export const serverFetchHeaders = {
	'Cache-Control': `max-age=${serverCacheMaxAgeSeconds}, stale-while-revalidate=${serverStaleWhileInvalidateSeconds}`,
};

export function logTimeElapsedSince(startTime: number, message: string) {
	const timeElapsed = Date.now() - startTime;
	console.log(`[time] ${timeElapsed}ms for ${message}`);
}

export const eventDayDurationSplitThreshold = 3; 

//Badge stuff
import { badgeMap } from '../server/badgeMap';
import DOMPurify from 'dompurify';
export const replaceBadgePlaceholders = (text: string): string => {
	return text.replace(/:\w+:/g, (match) => badgeMap[match] || match);
  };
  
//Tagging script that's reused multiple times
export function applyEventTags(source: any, title: string, description: string): string[] {
	const tags: string[] = [];
	// Apply filters to add tags
	if (source.filters) source.filters.forEach(filter => {
		if (filter.length === 1) {
			// If the filter has only one entry, apply it as a tag to every event
			const sourceTags = Array.isArray(filter[0]) ? filter[0] : [filter[0]];
			for (const sourceTag of sourceTags) tags.push(sourceTag);
		}
		else if (filter.length === 2) { //Future plans to have a backup tag, i.e., if a tag or series of tags in filter[1] are not present, then this tag will be applied from filter[0]
			// Because of how this works, these entries need to be at the very end of the filters section to work properly
			const sourceTags = Array.isArray(filter[0]) ? filter[0] : [filter[0]];
			const sourceAntiTags = Array.isArray(filter[1]) ? filter[1] : [filter[1]];
			let sourceAntiTagFound = false;
			for (const tag of tags) for (const sourceAntiTag of sourceAntiTags) if(tag == sourceAntiTag) sourceAntiTagFound = true;
			if(!sourceAntiTagFound) for (const sourceTag of sourceTags) tags.push(sourceTag);
		}
		else if (filter.length >= 3) {
			const sourceTags = Array.isArray(filter[0]) ? filter[0] : [filter[0]];	//Entry 1, the tag that will be applied. May be an array of strings or a single string
			const regex = new RegExp(filter[1], 'i');	//Entry 2, the regex script to be used
			const searchFields = Array.isArray(filter[2]) ? filter[2] : [filter[2]];	//Entry 3, whether to search the "title", "description", or some other portion. May be an array of strings or a single string
			const fallbackTag = filter.length > 3 ? filter[3] : null;	//Entry 4, an optional one, that'll apply a tag if the regex doesn't match

			// Initialize a flag to track if there's a regex match
			let regexMatch = false;

			// Check if the event title or description matches the regex based off of searchFields
			// Loop through each search field specified
			for (const field of searchFields) {
				if (field === 'title') { regexMatch = regex.test(title); }
				if (field === 'description') { regexMatch = regex.test(description); }
		
				// Stop checking once a match is found
				if (regexMatch) {
					break;
				}
			}

			// Check if the event title or description matches the regex based off of searchFields
			if (regexMatch) {
				for (const sourceTag of sourceTags) tags.push(sourceTag);
			} else if (fallbackTag) {
				tags.push(fallbackTag);
			}
		}
	});

	return tags;
}