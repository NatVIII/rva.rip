
// The Event object is based on https://fullcalendar.io/docs/event-object, as well as 
interface Event {
	title: string | null;
	start: Date | null;
	end: Date | null;
	url: string;
	display?: string;
	backgroundColor?: string;
	borderColor?: string;
	textColor?: string;
	classNames?: string[];
	extendedProps?: Object;
}

export const clientCacheMaxAgeSeconds = 1 * 3600;
export const clientStaleWhileInvalidateSeconds = 12 * 3600;

export const serverCacheMaxAgeSeconds = 1 * 3600;
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
  