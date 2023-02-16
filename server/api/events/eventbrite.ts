import eventSourcesJSON from 'public/event_sources.json';
import { JSDOM } from 'jsdom';

export default defineCachedEventHandler(async (event) => {
	const body = await fetchEventbriteEvents();
	return {
		body
	}
}, {
	maxAge: 3600,
});

async function fetchEventbriteEvents() {
	const eventbriteSources = await Promise.all(
		eventSourcesJSON.eventbrite.map(async (source) => {
			return await fetch(source.url)
				.then(res => res.text())
				.then(html => {
					const dom = new JSDOM(html);
					const events = JSON.parse(dom.window.document.querySelectorAll('script[type="application/ld+json"]')[1].innerHTML).map(convertSchemaDotOrgEventToFullCalendarEvent);
					return {
						events,
						city: source.city
					} as EventNormalSource;
				});
		}))
	return eventbriteSources;
};

function convertSchemaDotOrgEventToFullCalendarEvent(item) {
	// If we have a `geo` object, format it to geoJSON.
	var geoJSON = (item.location.geo) ? {
		type: "Point",
		coordinates: [
			item.location.geo.longitude,
			item.location.geo.latitude
		]
		// Otherwise, set it to null.
	} : null;

	return {
		title: item.name,
		start: new Date(item.startDate),
		end: new Date(item.endDate),
		url: item.url,
		extendedProps: {
			description: item.description || null,
			image: item.image,
			location: {
				geoJSON: geoJSON,
				eventVenue: {
					name: item.location.name,
					address: {
						streetAddress: item.location.streetAddress,
						addressLocality: item.location.addressLocality,
						addressRegion: item.location.addressRegion,
						postalCode: item.location.postalCode,
						addressCountry: item.location.addressCountry
					},
					geo: item.location?.geo
				}
			}
		}
	};
};

