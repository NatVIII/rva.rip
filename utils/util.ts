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

import { badgeMap } from '../server/badgeMap';
import DOMPurify from 'dompurify';
export const replaceBadgePlaceholders = (text: string): string => {
	return text.replace(/:\w+:/g, (match) => badgeMap[match] || match);
  };

export interface Filter {
	tags: Array<string>;
	anti_tags: Array<string>;
	search_fields: Array<string>;
	regex: string;
	fallback_tag: string;
}

export interface Source {
	name: string;
	googleCalendarId?: string;
	url?: string;
	city?: string;
	filters: Array<Filter>;
	prefixTitle?: string;
	suffixTitle?: string;
	suffixDescription?: string;
	defaultLocation?: string;
}
  
export function applyEventTags(source: any, title: string, description: string): string[] {
	const tags: string[] = [];
	// Apply filters to add tags
	if (source.filters) {
		source.filters.forEach((filter: Filter) => {
			if (filter.search_fields && filter.regex) {
				const regex = new RegExp(filter.regex, 'i');

				let regexMatch = false;

				for (const field of filter.search_fields) {
					if (field === 'title') { regexMatch = regex.test(title); }
					if (field === 'description') { regexMatch = regex.test(description); }
			
					if (regexMatch) {
						break;
					}
				}

				if (regexMatch) {
					for (const filterTag of filter.tags) {
						tags.push(filterTag);
					}
				} else if (filter.fallback_tag) {
					tags.push(filter.fallback_tag);
				}
			} else if (filter.anti_tags) {
				// Because of how this works, these entries need to be at the very end of the filters section to work properly
				let filterAntiTagFound = false;
				for (const tag of tags) {
					for (const filterAntiTag of filter.anti_tags) {
						if (tag == filterAntiTag) {
							filterAntiTagFound = true;
						}
					}
				}
				if (!filterAntiTagFound) {
					for (const filterTag of filter.tags) {
						tags.push(filterTag);
					}
				}
			} else if (filter.tags) {
				// apply tag to every event
				for (const filterTag of filter.tags) {
					tags.push(filterTag);
				}
			}
		});
	}

	return tags;
}