import eventSourcesJSON from 'public/event_sources.json';
import { logTimeElapsedSince, serverCacheMaxAgeSeconds, serverStaleWhileInvalidateSeconds, serverFetchHeaders } from '~~/utils/util';

export default defineCachedEventHandler(async (event) => {
	const startTime = new Date();
	const body = await fetchTockifyEvents();
	logTimeElapsedSince(startTime, 'Tockify: events fetched.');
	return {
		body
	}
}, {
	maxAge: serverCacheMaxAgeSeconds,
	staleMaxAge: serverStaleWhileInvalidateSeconds,
	swr: true,
});

async function fetchTockifyEvents() {
	console.log('Fetching Tockify events...')
	let tockifySources = await useStorage().getItem('tockifySources');
	try {
		tockifySources = await Promise.all(
			eventSourcesJSON.tockify.map(async (source) => {
				const url = new URL(source.url);
				// Add current date in milliseconds to the URL to get events starting from this moment.
				url.searchParams.append('startms', Date.now().toString());
				const res = await fetch(url, { headers: serverFetchHeaders });
				if (!res.ok) {
					console.error(`Error fetching Tockify events for ${source.name}: ${res.status} ${res.statusText}`);
					return {
						events: [],
						city: source.city
					} as EventNormalSource;
				}
				let tockifyJson = await res.json();
				let tockifyEvents = tockifyJson.events;
				return {
					events: tockifyEvents.map(event => convertTockifyEventToFullCalendarEvent(event, url, source.name)),
					city: source.city
				} as EventNormalSource;
			}
			)
		);
		await useStorage().setItem('tockifySources', tockifySources);
	}
	catch (e) {
		console.log('Error fetching Tockify events: ', e);
	}
	return tockifySources;
};

function convertTockifyEventToFullCalendarEvent(e, url, sourceName: string) {
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
		title: `${e.content.summary.text} @ ${sourceName}`,
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
