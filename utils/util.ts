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

export const serverCacheMaxAgeSeconds = 14400;
export const serverCacheRefreshIntermissionSeconds = 10;

export const refreshCacheCallback = (callback: () => void) => {
	setInterval(() => {
		callback();
	}, 1000 * (serverCacheRefreshIntermissionSeconds + serverCacheMaxAgeSeconds));
}