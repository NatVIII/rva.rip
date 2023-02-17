import eventSourcesJSON from 'public/event_sources.json';
import { serverCacheMaxAgeSeconds, refreshCacheCallback } from '~~/utils/util';

export default defineCachedEventHandler(async (event) => {
	const body = await fetchTockifyEvents();
	return {
		body
	}
}, {
	maxAge: serverCacheMaxAgeSeconds,
});

refreshCacheCallback(fetchTockifyEvents, 'Tockify');

async function fetchTockifyEvents() {
	return await Promise.all(
		eventSourcesJSON.tockify.map(async (source) => {
			const url = new URL(source.url);
			// Add current date in milliseconds to the URL to get events starting from this moment.
			url.searchParams.append('startms', Date.now().toString());
			let tockifyJson = await (await fetch(url)).json();
			let tockifyEvents = tockifyJson.events;
			return {
				events: tockifyEvents.map(event => convertTockifyEventToFullCalendarEvent(event, url)),
				city: source.city
			} as EventNormalSource;
		}
		)
	);
};

function convertTockifyEventToFullCalendarEvent(e, url) {
	var url = (e.content.customButtonLink)
		? e.content.customButtonLink
		: `${url.origin}/${url.searchParams.get('calname')}/detail/${e.eid.uid}/${e.eid.tid}`;
	var geoJSON = (e.content.location?.latitude && e.content.location?.longitude)
		? {
			type: "Point",
			coordinates: [
				e.content.location.longitude,
				e.content.location.latitude
			]
		} : null;
	return {
		title: e.content.summary.text,
		start: new Date(e.when.start.millis),
		end: new Date(e.when.end.millis),
		url: url,
		extendedProps: {
			description: e.content.description.text,
			image: null,
			location: {
				geoJSON: geoJSON,
				eventVenue: {
					name: e.content.place,
					address: {
						streetAddress: e.content?.location?.c_street,
						addressLocality: e.content?.location?.c_locality,
						addressRegion: e.content?.location?.c_region,
						postalCode: e.content?.location?.c_postcode,
						addressCountry: e.content?.location?.c_country
					},
					geo: {
						latitude: e.content?.location?.latitude,
						longitude: e.content?.location?.longitude
					}
				}
			},
			raw: e
		}
	};
}
