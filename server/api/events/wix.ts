import eventSourcesJSON from '@/assets/event_sources.json';
import { logTimeElapsedSince, serverCacheMaxAgeSeconds, serverFetchHeaders, serverStaleWhileInvalidateSeconds } from '~~/utils/util';
import { DateTime } from 'luxon';

export default defineCachedEventHandler(async (event) => {
	const startTime = new Date();
	const body = await fetchWixEvents();
	logTimeElapsedSince(startTime, 'Wix: events fetched.');
	return {
		body
	}
}, {
	maxAge: serverCacheMaxAgeSeconds,
	staleMaxAge: serverStaleWhileInvalidateSeconds,
	swr: true,
});

async function fetchWixEvents() {
	console.log('Fetching Wix events...');

	let wixSources = await useStorage().getItem('wixSources');
	try {
		wixSources = await Promise.all(
			eventSourcesJSON.wix.map(async (source) => {
				if (process.env[source.api_key_envvar] === undefined) {
					console.error(`No Wix API key named ${source.api_key_envvar} found for ${source.name}. Consider setting this environment variable.`);
				}
				if (process.env[source.account_id_envvar] === undefined) {
					console.error(`No Wix account ID named ${source.account_id_envvar} found for ${source.name}. Consider setting this environment variable.`);
				}
				if (process.env[source.site_id_envvar] === undefined) {
					console.error(`No Wix site ID named ${source.site_id_envvar} found for ${source.name}. Consider setting this environment variable.`);
				}

				const url = 'https://www.wixapis.com/events/v1/events/query'
				const headers = {
					...serverFetchHeaders,
					// These are the 3 headers required to bypass OAuth. See https://dev.wix.com/api/rest/getting-started/api-keys
					'Authorization': process.env[source.api_key_envvar],
					'wix-account-id': process.env[source.account_id_envvar],
					'wix-site-id': process.env[source.site_id_envvar]
				};
				const response = await fetch(url, {
					method: 'POST',
					headers,
					body: JSON.stringify({
						"offset": 0,
						// Max limit is 1000.
						"limit": 1000,
						"order": "start:asc",
						"filter": {
							"status": {
								"$hasSome": ["ENDED", "SCHEDULED", "STARTED"]
							}
						},
						"fieldset": ["URLS"],
						"facet": ["status"],
					})
				});
				// Error check.
				if (!response.ok) {
					console.error(`Error fetching Wix events for ${source.name}: ${response.status} ${response.statusText}`);
					return {
						events: [],
						city: source.city,
						name: source.name,
					} as EventNormalSource;
				}

				const json = await response.json();
				const events = json.events.map((e) => {
					const timeZone = e.scheduling.config.timeZoneId;
					return {
						start: DateTime.fromISO(e.scheduling.config.startDate, { zone: timeZone }).toUTC().toJSDate(),
						end: DateTime.fromISO(e.scheduling.config.endDate, { zone: timeZone }).toUTC().toJSDate(),
						title: `${e.title} @ ${source.name}`,
						url: e.eventPageUrl.base + e.eventPageUrl.path
					};
				});

				return {
					events: events,
					city: source.city,
					name: source.name,
				} as EventNormalSource;
			}
			));
		await useStorage().setItem('wixSources', wixSources);
	}
	catch (e) {
		console.error("Error fetching Wix events: ", e);
	}
	return wixSources;
};
