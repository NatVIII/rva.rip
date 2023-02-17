interface EventNormalSource {
	events: Event[];
	city: string;
	display?: string;
}

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

interface EventGoogleCalendarSource {
	googleCalendarId: string;
}

export const toCorsProxy = (url: string) => 'https://corsproxy.io/?' + encodeURIComponent(url);


export const serverCacheMaxAgeSeconds = 4 * 3600;
// For how long can a server use an invalidated response (during which it will revalidate for the next request).
// But it appears that the Nitro server (Nuxt's backend) supports a specific flag for always using stale-while-revalidating if set to -1.
// https://nitro.unjs.io/guide/introduction/cache
export const serverStaleWhileInvalidateSeconds = -1; /* 24 * 3600; */