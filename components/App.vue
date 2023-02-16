<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import iCalendarPlugin from '@fullcalendar/icalendar';
import googleCalendarPlugin from '@fullcalendar/google-calendar';
import json from 'public/event_sources.json';
import 'floating-vue/dist/style.css';

import 'assets/style.css';
import FullCalendar from '@fullcalendar/vue3'
import floatingVuePkg from 'floating-vue';
const { Dropdown } = floatingVuePkg;

const ALL_ID = 'All';

const MARIN_COUNTY_ID = 'Marin County';
const SF_SAN_MATEO_COUNTY_ID = 'SF-San Mateo County';
const ALAMEDA_COUNTY_ID = 'Alameda County';
const SANTA_CLARA_COUNTY_ID = 'Santa Clara County';
const SANTA_CRUZ_COUNTY_ID = 'Santa Cruz County';

const ALL_CITIES_IN_MARIN_COUNTY_ID = 'All cities in Marin County';

const OTHERS_IN_SF_SAN_MATEO_COUNTY_ID = 'Others in SF-San Mateo County';
const OTHERS_IN_ALAMEDA_COUNTY_ID = 'Others in Alameda County';
const OTHERS_IN_SANTA_CLARA_COUNTY_ID = 'Others in Santa Clara County';
const OTHERS_IN_SANTA_CRUZ_COUNTY_ID = 'Others in Santa Cruz County';

// SF-San Mateo County Cities.
const SAN_FRANCISCO_ID = 'San Francisco';

// Alameda County Cities.
const OAKLAND_ID = 'Oakland';
const BERKELEY_ID = 'Berkeley';

// Santa Clara County Cities.
const SAN_JOSE_ID = 'San Jose';
const SUNNYVALE_ID = 'Sunnyvale';

// Santa Cruz County Cities.
const SANTA_CRUZ_ID = 'Santa Cruz';

interface County {
  enabled: any;
  cities: any;
}

const getCookieDefaultValue = (areaName: string) => {
  return true;
};

// Note: cannot use LocalStorage due to SSR not having LocalStorage. Using LocalStorage would thus cause a hydration mismatch.
const isAllCitiesInMarinCountyEnabled = useCookie(ALL_CITIES_IN_MARIN_COUNTY_ID, { default: () => getCookieDefaultValue(ALL_CITIES_IN_MARIN_COUNTY_ID) });

// SF-San Mateo County Cities.
const isSanFranciscoEnabled = useCookie(SAN_FRANCISCO_ID, { default: () => getCookieDefaultValue(SAN_FRANCISCO_ID) });
const isOthersInSFSanMateoCountyEnabled = useCookie(OTHERS_IN_SF_SAN_MATEO_COUNTY_ID, { default: () => getCookieDefaultValue(OTHERS_IN_SF_SAN_MATEO_COUNTY_ID) });

// Alameda County Cities.
const isOaklandEnabled = useCookie(OAKLAND_ID, { default: () => getCookieDefaultValue(OAKLAND_ID) });
const isBerkeleyEnabled = useCookie(BERKELEY_ID, { default: () => getCookieDefaultValue(BERKELEY_ID) });

const isOthersInAlamedaCountyEnabled = useCookie(OTHERS_IN_ALAMEDA_COUNTY_ID, { default: () => getCookieDefaultValue(OTHERS_IN_ALAMEDA_COUNTY_ID) });

// Santa Clara County Cities.
const isSanJoseEnabled = useCookie(SAN_JOSE_ID, { default: () => getCookieDefaultValue(SAN_JOSE_ID) });
const isSunnyvaleEnabled = useCookie(SUNNYVALE_ID, { default: () => getCookieDefaultValue(SUNNYVALE_ID) });
const isOthersInSantaClaraCountyEnabled = useCookie(OTHERS_IN_SANTA_CLARA_COUNTY_ID, { default: () => getCookieDefaultValue(OTHERS_IN_SANTA_CLARA_COUNTY_ID) });

// Santa Cruz County Cities.
const isSantaCruzEnabled = useCookie(SANTA_CRUZ_ID, { default: () => getCookieDefaultValue(SANTA_CRUZ_ID) });
const isOthersInSantaCruzCountyEnabled = useCookie(OTHERS_IN_SANTA_CRUZ_COUNTY_ID, { default: () => getCookieDefaultValue(OTHERS_IN_SANTA_CRUZ_COUNTY_ID) });

const citiesToCounty = {
  [ALL_CITIES_IN_MARIN_COUNTY_ID]: MARIN_COUNTY_ID,
  [SAN_FRANCISCO_ID]: SF_SAN_MATEO_COUNTY_ID,
  [OTHERS_IN_SF_SAN_MATEO_COUNTY_ID]: SF_SAN_MATEO_COUNTY_ID,
  [OAKLAND_ID]: ALAMEDA_COUNTY_ID,
  [BERKELEY_ID]: ALAMEDA_COUNTY_ID,
  [OTHERS_IN_ALAMEDA_COUNTY_ID]: ALAMEDA_COUNTY_ID,
  [SAN_JOSE_ID]: SANTA_CLARA_COUNTY_ID,
  [SUNNYVALE_ID]: SANTA_CLARA_COUNTY_ID,
  [OTHERS_IN_SANTA_CLARA_COUNTY_ID]: SANTA_CLARA_COUNTY_ID,
  [SANTA_CRUZ_ID]: SANTA_CRUZ_COUNTY_ID,
  [OTHERS_IN_SANTA_CRUZ_COUNTY_ID]: SANTA_CRUZ_COUNTY_ID,
};

function isCity(city: string) {
  return Object.keys(citiesToCounty).includes(city);
}

function getCounty(city: string) {
  return citiesToCounty[city];
}

function isCounty(county: string) {
  return Object.keys(countiesToCities).includes(county);
}

const countiesToCities = {
  // Make an exception for Marin County: cluster all cities into one.
  [MARIN_COUNTY_ID]: {
    cities: {
      [ALL_CITIES_IN_MARIN_COUNTY_ID]: {
        enabled: isAllCitiesInMarinCountyEnabled,
      },
    }
  } as County,
  [SF_SAN_MATEO_COUNTY_ID]: {
    cities: {
      [SAN_FRANCISCO_ID]: {
        enabled: isSanFranciscoEnabled,
      },
      [OTHERS_IN_SF_SAN_MATEO_COUNTY_ID]: {
        enabled: isOthersInSFSanMateoCountyEnabled
      },
    }
  } as County,
  [ALAMEDA_COUNTY_ID]: {
    cities: {
      [OAKLAND_ID]: {
        enabled: isOaklandEnabled,
      },
      [BERKELEY_ID]: {
        enabled: isBerkeleyEnabled,
      },
      [OTHERS_IN_ALAMEDA_COUNTY_ID]: {
        enabled: isOthersInAlamedaCountyEnabled,
      },
    }
  } as County,
  [SANTA_CLARA_COUNTY_ID]: {
    cities: {
      [SAN_JOSE_ID]: {
        enabled: isSanJoseEnabled,
      },
      [SUNNYVALE_ID]: {
        enabled: isSunnyvaleEnabled,
      },
      [OTHERS_IN_SANTA_CLARA_COUNTY_ID]: {
        enabled: isOthersInSantaClaraCountyEnabled,
      },
    }
  } as County,
  [SANTA_CRUZ_COUNTY_ID]: {
    cities: {
      [SANTA_CRUZ_ID]: {
        enabled: isSantaCruzEnabled,
      },
      [OTHERS_IN_SANTA_CRUZ_COUNTY_ID]: {
        enabled: isOthersInSantaCruzCountyEnabled,
      },
    }
  } as County,
};

const isFilterDropdownShown = useState('isFilterDropdownShown', () => false);

const getWindowHeight = () => {
  if (process.client) return window.innerHeight;
  return 600;
};

const getWindowWidth = () => {
  if (process.client) return window.innerWidth;
  return 350;
};

const isMobile = useState('isMobile', () => true);
const calendarHeight = useCookie('calendarHeight', { default: () => 100 });
if (process.client) calendarHeight.value = window.innerHeight;
const pageWidth = useCookie('pageWidth', { default: () => 100 });
if (process.client) pageWidth.value = window.innerWidth;

const isUsingDayMaxEventRows = useState('isUsingDayMaxEventRows', () => true);

const updateWeekNumbers = () => { 
  return getWindowWidth() < 350 ? false : true 
};
// -1 indicates that there is no limit.
const updateDayMaxEventRows = () => { return isUsingDayMaxEventRows.value ? -1 : Math.floor(getWindowHeight() / 75) };

const calendarOptions = ref({
  plugins: [dayGridPlugin, timeGridPlugin, listPlugin, iCalendarPlugin, googleCalendarPlugin],
  initialView: getWindowWidth() <= 600 ? 'listMonth' : 'dayGridMonth',
  customButtons: {
    less: {
      text: 'less',
      click: function () {
        isUsingDayMaxEventRows.value = !isUsingDayMaxEventRows.value;
        calendarOptions.value = {
          ...calendarOptions.value,
          dayMaxEventRows: updateDayMaxEventRows()
        };
      }
    },
    filter: {
      text: 'filter',
      click: function () {
        isFilterDropdownShown.value = true;
      }
    },
  },
  headerToolbar: {
    left: 'prev today,filter',
    center: 'title',
    right: 'dayGridMonth,listMonth next'
  },
  buttonText: {
    month: 'grid', // Feels clearar than 'month' and 'list'
    list: 'list'
  },
  nowIndicator: true,
  height: '100vh',
  dayMaxEventRows: updateDayMaxEventRows(),
  navLinks: true,
  weekNumbers: updateWeekNumbers(),
  googleCalendarApiKey: 'AIzaSyDS35k9d6_Ch4MtSEzcqJqA5Zw9f5TGNZ0',
  eventSources: [],
  // Open in a new tab.
  eventClick: function (event) {
    if (event.event.url) {
      event.jsEvent.preventDefault();
      window.open(event.event.url, "_blank");
    }
  },
  progressiveEventRendering: true, // More re-renders; not batched. Needs further testing.
  stickyHeaderDates: true,
});

const updateCalendarHeight = () => {
  pageWidth.value = getWindowWidth() - 100;
  calendarHeight.value = getWindowHeight();
  calendarOptions.value = {
    ...calendarOptions.value,
    weekNumbers: getWindowWidth() < 350 ? false : true,
    dayMaxEventRows: updateDayMaxEventRows()
  };
};

onMounted(() => { 
  window.addEventListener("resize", updateCalendarHeight)
});
// onUpdated(() => {});
onUnmounted(() => {
  if (process.client) window.removeEventListener('resize', updateWeekNumbers)
});

function onShow() {
  if (process.client) document.body.classList.add('no-scroll')
}

function onHide() {
  if (process.client) document.body.classList.remove('no-scroll')
  isFilterDropdownShown.value = false;
}

// The following conversion functions are basically ripped from anarchism.nyc.
function convertSchemaDotOrgEventToFullCalendarEvent(item) {
	// If we have a `geo` object, format it to geoJSON.
	var geoJSON = (item.location.geo) ? {
		type: "Point",
		coordinates: [
			item.location.geo.longitude,
			item.location.geo.latitude
		]
	} : null; // Otherwise, set it to null.

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


// Updates calendarOptions' eventSources and triggers a re-render of the calendar.
function addEventSources(newEventSources: EventNormalSource[] | EventGoogleCalendarSource[]) {
  // Cut out events without times, but typecheck for types that can have invalid times.
  newEventSources = newEventSources.map(eventSource => {
    // Skip events that can't be invalid.
    if (!Object.hasOwn(eventSource, 'events')) return eventSource;



    // Filter events.
    const newEvents = eventSource.events.filter((event) => {


      /* REMOVED TEMPORARILY, replaced with the hack below: Remove events that last longer than 3 days.
      Note: This also tends to cut out Eventbrite events that have 'Multiple Dates' over a range of 3 days.
      Using the official Eventbrite API would allow us to avoid this issue, but would potentially run into 
      rate limits pretty quickly during peak hours. */
      const isShorterThan3DaysLong = (event.end.getTime() - event.start.getTime()) / (1000 * 3600 * 24) <= 3;

      // This is a hack where we set the end day to match start day. This is to get around the issue of
      // Eventbrite events that have 'Multiple Dates' spanning 'All Day'. The downside is that this hack 
      // removes all event dates except the first, but it is better than nothing.
      if (!isShorterThan3DaysLong) {
        event.end.setFullYear(event.start.getFullYear(), event.start.getMonth(), event.start.getDate());
        // If the event's starting hour is greater than the event's ending hour, the ending day should be 1 day ahead of the 
        // the start. Here we increment the day by 1.
        if (event.start.getHours() > event.end.getHours()) {
          event.end.setDate(event.end.getDate() + 1);
        }
      }
      return (
        event.start
        // && isShorterThan3DaysLong
      );
    });
    return {
      ...eventSource,
      events: newEvents,
    } as EventNormalSource;
  });
  // Issue: might take a long time to actually update the calendar if the list of, for example, Eventbrite events/sources is large.

  calendarOptions.value = {
    ...calendarOptions.value,
    eventSources: calendarOptions.value.eventSources.concat(newEventSources)
  };
}

function isDisplayingBasedOnFilterSettings(city: string) {
  if (isCity(city)) {
    const county = getCounty(city);
    return countiesToCities[county].cities[city].enabled.value ? 'auto' : 'none';
  }
  console.error(citiesToCounty[city], `Err: Invalid area name "${city} "chosen! You should only provide city names to event sources.`)
  return 'auto';
}

const eventSourcesFromFile = json;
const clientHeaders = {
  'Cache-Control': 'max-age=5400'
};

const transformEventSourcesResponse = (eventSources) => {
  const eventsSourcesWithoutProxy = toRaw(eventSources.value.body)
  const datesAdded = eventsSourcesWithoutProxy.map(eventSource => {
    return {
      ...eventSource,
      // Set the `display` property, since the endpoints don't add it.
      display: isDisplayingBasedOnFilterSettings(eventSource.city),
      events: eventSource.events.map(event => {
        return {
          ...event,
          // Convert date strings to Date objects.
          start: new Date(event.start),
          end: new Date(event.end)
        }
      })
    }
  })
  return datesAdded;
}

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

const { data: eventbriteSourcesResponse } = await useFetch('/api/events/eventbrite', { headers: clientHeaders });
addEventSources(transformEventSourcesResponse(eventbriteSourcesResponse));
const { data: wordPressTribeSourcesResponse } = await useFetch('/api/events/wordpress-tribe', { headers: clientHeaders });
addEventSources(transformEventSourcesResponse(wordPressTribeSourcesResponse));
const { data: tockifySourcesResponse } = await useFetch('/api/events/tockify', { headers: clientHeaders });
addEventSources(transformEventSourcesResponse(tockifySourcesResponse));
const { data: squarespaceEventSourcesResponse } = await useFetch('/api/events/squarespace');
addEventSources(transformEventSourcesResponse(squarespaceEventSourcesResponse));
loadGoogleCalendarEvents();

async function loadGoogleCalendarEvents() {
  // Note: Google Calendar has integration with FullCalendar, which allows us to avoid calling it on the server, at
  // the cost of some waterfalling (but it's minimal since the API is fast).
  const googleCalendarSources = eventSourcesFromFile.googleCalendar.map((source) => {
    return {
      googleCalendarId: source.googleCalendarId,
      display: isDisplayingBasedOnFilterSettings(source.city),
      city: source.city
    } as EventGoogleCalendarSource
  });
  addEventSources(googleCalendarSources);
}

function setCityIsEnabled(settingId, vueRef, value) {
  localStorage.setItem(settingId, value);
  vueRef.value = value;
}

function updateAllIsEnabledSetting(newIsEnabled: boolean) {
  Object.keys(countiesToCities).forEach(county => {
    updateCountyIsEnabledSetting(newIsEnabled, county);
  });
  updateEventSourcesEnabled();
}

function updateCountyIsEnabledSetting(newIsEnabled: boolean, county: string) {
  Object.keys(countiesToCities[county].cities).forEach(cityId => {
    setCityIsEnabled(cityId, countiesToCities[county].cities[cityId].enabled, newIsEnabled);
  });
  updateEventSourcesEnabled();
}

// Re-calculates event sources w.r.t. whether should be displayed or not, and updates the calendarOptions (re-render).
// Warning: Might be expensive for only changing a single city.
function updateEventSourcesEnabled() {
  const newEventSources = calendarOptions.value.eventSources.map((source: EventNormalSource | EventGoogleCalendarSource) => {
    const isEnabled = countiesToCities[getCounty(source.city)].cities[source.city].enabled.value;
    return {
      ...source,
      // Updated filtered area.
      display: isEnabled ? 'auto' : 'none'
    } as EventSource;
  });
  calendarOptions.value = { ...calendarOptions.value, eventSources: newEventSources };
}

function updateCityIsEnabledSetting(newIsEnabled, cityId: string) {
  const isEnabledRef = countiesToCities[getCounty(cityId)].cities[cityId].enabled;
  setCityIsEnabled(cityId, isEnabledRef, newIsEnabled);
  updateEventSourcesEnabled();
}
</script>

<template>
<Dropdown :positioning-disabled="isMobile" @apply-show="isMobile && onShow()" @apply-hide="isMobile && onHide()"
  :trigger="[]" :shown="isFilterDropdownShown">

  <template #popper="{ hide }">
    <div class="popper-box">
      <div class="popper-box-inner">
          <CountyFilterItem :label="ALL_ID" @on-yes="updateAllIsEnabledSetting(true)" @on-no="updateAllIsEnabledSetting(false)">
          </CountyFilterItem>
          <CountyFilterItem :label="MARIN_COUNTY_ID" @on-yes="updateCountyIsEnabledSetting(true, MARIN_COUNTY_ID)"
            @on-no="updateCountyIsEnabledSetting(false, MARIN_COUNTY_ID)"></CountyFilterItem>
          <CityFilterItem v-model="isAllCitiesInMarinCountyEnabled" :label="ALL_CITIES_IN_MARIN_COUNTY_ID"
            @on-input="updateCityIsEnabledSetting($event.target.checked, ALL_CITIES_IN_MARIN_COUNTY_ID)">
          </CityFilterItem>
          
          <CountyFilterItem :label="SF_SAN_MATEO_COUNTY_ID" @on-yes="updateCountyIsEnabledSetting(true, SF_SAN_MATEO_COUNTY_ID)"
            @on-no="updateCountyIsEnabledSetting(false, SF_SAN_MATEO_COUNTY_ID)"></CountyFilterItem>
          <CityFilterItem v-model="isSanFranciscoEnabled" :label="SAN_FRANCISCO_ID"
            @on-input="updateCityIsEnabledSetting($event.target.checked, SAN_FRANCISCO_ID)">
          </CityFilterItem>
          <CityFilterItem v-model="isOthersInSFSanMateoCountyEnabled" :label="OTHERS_IN_SF_SAN_MATEO_COUNTY_ID"
            @on-input="updateCityIsEnabledSetting($event.target.checked, OTHERS_IN_SF_SAN_MATEO_COUNTY_ID)">
          </CityFilterItem>
          
          <CountyFilterItem :label="ALAMEDA_COUNTY_ID" @on-yes="updateCountyIsEnabledSetting(true, ALAMEDA_COUNTY_ID)"
            @on-no="updateCountyIsEnabledSetting(false, ALAMEDA_COUNTY_ID)"></CountyFilterItem>
          <CityFilterItem v-model="isOaklandEnabled" :label="OAKLAND_ID"
            @on-input="updateCityIsEnabledSetting($event.target.checked, OAKLAND_ID)">
          </CityFilterItem>
          <CityFilterItem v-model="isBerkeleyEnabled" :label="BERKELEY_ID"
            @on-input="updateCityIsEnabledSetting($event.target.checked, BERKELEY_ID)">
          </CityFilterItem>
          <CityFilterItem v-model="isOthersInAlamedaCountyEnabled" :label="OTHERS_IN_ALAMEDA_COUNTY_ID"
            @on-input="updateCityIsEnabledSetting($event.target.checked, OTHERS_IN_ALAMEDA_COUNTY_ID)">
          </CityFilterItem>
          
          <CountyFilterItem :label="SANTA_CLARA_COUNTY_ID" @on-yes="updateCountyIsEnabledSetting(true, SANTA_CLARA_COUNTY_ID)"
            @on-no="updateCountyIsEnabledSetting(false, SANTA_CLARA_COUNTY_ID)"></CountyFilterItem>
          <CityFilterItem v-model="isSanJoseEnabled" :label="SAN_JOSE_ID"
            @on-input="updateCityIsEnabledSetting($event.target.checked, SAN_JOSE_ID)">
          </CityFilterItem>
          <CityFilterItem v-model="isOthersInSantaClaraCountyEnabled" :label="OTHERS_IN_SANTA_CLARA_COUNTY_ID"
            @on-input="updateCityIsEnabledSetting($event.target.checked, OTHERS_IN_SANTA_CLARA_COUNTY_ID)">
          </CityFilterItem>
          
          <CountyFilterItem :label="SANTA_CRUZ_COUNTY_ID" @on-yes="updateCountyIsEnabledSetting(true, SANTA_CRUZ_COUNTY_ID)"
            @on-no="updateCountyIsEnabledSetting(false, SANTA_CRUZ_COUNTY_ID)"></CountyFilterItem>
          <CityFilterItem v-model="isSantaCruzEnabled" :label="SANTA_CRUZ_ID"
            @on-input="updateCityIsEnabledSetting($event.target.checked, SANTA_CRUZ_ID)">
          </CityFilterItem>
          <CityFilterItem v-model="isOthersInSantaCruzCountyEnabled" :label="OTHERS_IN_SANTA_CRUZ_COUNTY_ID"
            @on-input="updateCityIsEnabledSetting($event.target.checked, OTHERS_IN_SANTA_CRUZ_COUNTY_ID)">
          </CityFilterItem>

      </div>
    <div class="bottom"><button v-if="isMobile" @click.passive="hide()">Done</button></div>
    </div>

  </template>
</Dropdown>
<div class="calendar-container">
    <div style="display: flex; flex-direction:column; position:relative;">
      <div class="title">
        bay.lgbt
      </div>
      <div style="display:flex; flex-direction: column; align-items: center;">
        <!-- Note: Cat causes some weirdness with resizing, almost all bugs down the line stem from them. -->
        <!-- <img class="cat" src="cat.gif" alt="cat moving" v-bind:width=pageWidth/1.5 /> -->
        <div class="blurb">The missing LGBT+-leaning events board for SF Bay! Currently in open beta- please provide
          venue
          suggestions to Ivy at <a href="https://twitter.com/BYTEWIFE">Twitter</a> / <a
            href="https://mastodon.social/@BYTEWIFE">Mastodon</a> / <a href="https://www.instagram.com/bytewife/">Instagram!</a>
        </div>
      </div>
    </div>
    <FullCalendar :options='calendarOptions' />

    <div style="display: flex; align-items: center; flex-direction: row;">
      <div class="desc">
        <p><strong>The events here are drawn
            from various venue listings that contributors (thank you!) have provided. The venues are in a constant state of
            community-based vetting; don't hesitate to provide feedback!
            </strong> Before
          making plans, consider checking with venue staff or event organizers directly. This site is not affiliated with ANY
          venues or events listed here.
        </p>
        <p>In New York? Check out our sister site at <a href="https://anarchism.nyc/">anarchism.nyc</a>- to who I owe
          the
          inspiration.</p>
        <p><strong>Want your event listed here?</strong> You must be publishing a machine-readable feed of event data
          formatted in <a href="https://fullcalendar.io/docs/event-source">a compatible Event Source format</a>. (This
          can
          be as simple as a <a href="https://support.google.com/calendar/answer/37083">public Google Calendar</a>.) Once
          published, request inclusion of your event feed by <a href="https://github.com/ivyraine/bay.lgbt/issues">submitting
            your event feed address to us via a new GitHub issue</a>. You may also provide feedback, fixes, or
          improvements there!</p>
      </div>
      <img class="gifs" src="/bmo.gif" alt="BMO dancing" :width='Math.min(pageWidth / 3, 400)' />
    </div>
  </div>
</template>