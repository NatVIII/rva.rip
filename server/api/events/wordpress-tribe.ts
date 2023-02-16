import eventSourcesJSON from 'public/event_sources.json';

export default defineCachedEventHandler(async (event) => {
	const body = await fetchWordPressTribeEvents();
	return {
		body
	}
}, {
	maxAge: 3600,
});

async function fetchWordPressTribeEvents() {
	return await Promise.all(
		eventSourcesJSON.wordPressTribe.map(async (source) => {
			let wpJson = await (await fetch(source.url)).json();
			let wpEvents = wpJson.events;
			while (Object.hasOwn(wpJson, 'next_rest_url')) {
				let next_page_url = wpJson.next_rest_url;
				wpJson = await (await fetch(next_page_url)).json();
				wpEvents = wpEvents.concat(wpJson.events);
			}
			return {
				events: wpEvents.map(convertWordpressTribeEventToFullCalendarEvent),
				city: source.city
			} as EventNormalSource;
		}
		));
};

// The following conversion function is basically ripped from anarchism.nyc.
function convertWordpressTribeEventToFullCalendarEvent(e) {
	var geoJSON = (e.venue.geo_lat && e.venue.geo_lng)
		? {
			type: "Point",
			coordinates: [e.venue.geo_lng, e.venue.geo_lat]
		}
		: null;
	return {
		title: e.title,
		start: new Date(e.utc_start_date + 'Z'),
		end: new Date(e.utc_end_date + 'Z'),
		url: e.url,
		extendedProps: {
			description: e.description,
			image: e.image.url,
			location: {
				geoJSON: geoJSON,
				eventVenue: {
					name: e.venue.venue,
					address: {
						streetAddress: e.venue.address,
						addressLocality: e.venue.city,
						postalCode: e.venue.zip,
						addressCountry: e.venue.country
					},
					geo: {
						latitude: e.venue.geo_lat,
						longitude: e.venue.geo_lng
					}
				}
			}
		}
	};
}
