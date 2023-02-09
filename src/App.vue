<script setup lang="ts">
import { ref, onMounted, onUnmounted, onUpdated, callWithAsyncErrorHandling } from 'vue'
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import iCalendarPlugin from '@fullcalendar/icalendar';
import googleCalendarPlugin from '@fullcalendar/google-calendar';
import json from './event_sources.json';
import 'floating-vue/dist/style.css';
import CountyFilterItem from './components/CountyFilterItem.vue';
import CityFilterItem from './components/CityFilterItem.vue';

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

interface EventNormalSource {
  events: Event[];
  display: string;
  city: string;
}

interface EventGoogleCalendarSource {
  googleCalendarId: string;
}

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

const getLocalStorageIsAreaEnabled = (areaName: string) => {
  return JSON.parse(localStorage.getItem(areaName) || 'true');
};

const isAllEnabled = ref(getLocalStorageIsAreaEnabled(ALL_ID));

const isAllCitiesInMarinCountyEnabled = ref(getLocalStorageIsAreaEnabled(ALL_CITIES_IN_MARIN_COUNTY_ID));

// SF-San Mateo County Cities.
const isSanFranciscoEnabled = ref(getLocalStorageIsAreaEnabled(SAN_FRANCISCO_ID));
const isOthersInSFSanMateoCountyEnabled = ref(getLocalStorageIsAreaEnabled(OTHERS_IN_SF_SAN_MATEO_COUNTY_ID));

// Alameda County Cities.
const isOaklandEnabled = ref(getLocalStorageIsAreaEnabled(OAKLAND_ID));
const isBerkeleyEnabled = ref(getLocalStorageIsAreaEnabled(BERKELEY_ID));
const isOthersInAlamedaCountyEnabled = ref(getLocalStorageIsAreaEnabled(OTHERS_IN_ALAMEDA_COUNTY_ID));

// Santa Clara County Cities.
const isSanJoseEnabled = ref(getLocalStorageIsAreaEnabled(SAN_JOSE_ID));
const isSunnyvaleEnabled = ref(getLocalStorageIsAreaEnabled(SUNNYVALE_ID));
const isOthersInSantaClaraCountyEnabled = ref(getLocalStorageIsAreaEnabled(OTHERS_IN_SANTA_CLARA_COUNTY_ID));

// Santa Cruz County Cities.
const isSantaCruzEnabled = ref(getLocalStorageIsAreaEnabled(SANTA_CRUZ_ID));
const isOthersInSantaCruzCountyEnabled = ref(getLocalStorageIsAreaEnabled(OTHERS_IN_SANTA_CRUZ_COUNTY_ID));

const citiesToCounty = {
  [ALL_CITIES_IN_MARIN_COUNTY_ID]: MARIN_COUNTY_ID,
  [SAN_FRANCISCO_ID]: SF_SAN_MATEO_COUNTY_ID,
  [OAKLAND_ID]: ALAMEDA_COUNTY_ID,
  [BERKELEY_ID]: ALAMEDA_COUNTY_ID,
  [SAN_JOSE_ID]: SANTA_CLARA_COUNTY_ID,
  [SUNNYVALE_ID]: SANTA_CLARA_COUNTY_ID,
  [SANTA_CRUZ_ID]: SANTA_CRUZ_COUNTY_ID,
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

const isFilterDropdownShown = ref(false);

const isMobile = ref(true);
const calendarHeight = ref(window.innerHeight);
const pageWidth = ref(window.innerWidth);
const isUsingDayMaxEventRows = ref(true);

const updateWeekNumbers = () => { return window.innerWidth < 350 ? false : true };
// -1 indicates that there is no limit.
const updateDayMaxEventRows = () => { return isUsingDayMaxEventRows.value ? -1 : Math.floor(window.innerHeight / 75) };

const calendarOptions = ref({
  plugins: [dayGridPlugin, timeGridPlugin, listPlugin, iCalendarPlugin, googleCalendarPlugin],
  initialView: window.innerWidth <= 600 ? 'listMonth' : 'dayGridMonth',
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
  pageWidth.value = window.innerWidth - 100;
  calendarHeight.value = window.innerHeight;
  calendarOptions.value = {
    ...calendarOptions.value,
    weekNumbers: window.innerWidth < 350 ? false : true,
    dayMaxEventRows: updateDayMaxEventRows()
  };
};

onMounted(() => window.addEventListener("resize", updateCalendarHeight));
// onUpdated(() => {});
onUnmounted(() => window.removeEventListener('resize', updateWeekNumbers));

function onShow() {
  document.body.classList.add('no-scroll')
}

function onHide() {
  document.body.classList.remove('no-scroll')
  isFilterDropdownShown.value = false;
}

// Converts a schema.org event to a FullCalendar event.
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

// Updates calendarOptions' eventSources and triggers a re-render of the calendar.
function addEventSources(newEventSources: EventNormalSource[] | EventGoogleCalendarSource[]) {
  // Cut out events without times, but typecheck for types that can have invalid times.
  newEventSources = newEventSources.map(eventSource => {
    // Skip events that can't be invalid.
    if (!Object.hasOwn(eventSource, 'events')) return eventSource;

    // Filter events.
    const newEvents = eventSource.events.filter((event) => {
      /* Remove events that last longer than 3 days.
      Note: This also tends to cut out Eventbrite events that have 'Multiple Dates' over a range of 3 days.
      Using the official Eventbrite API would allow us to avoid this issue, but would potentially run into 
      rate limits pretty quickly during peak hours. */
      const isShorterThan3DaysLong = (event.end.getTime() - event.start.getTime()) / (1000 * 3600 * 24) <= 3;
      return (event.start && isShorterThan3DaysLong);
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
  if (city === ALL_ID) return isAllEnabled.value ? 'auto' : 'none';
  if (isCity(city)) {
    const county = getCounty(city);
    return countiesToCities[county].cities[city].enabled.value ? 'auto' : 'none';
  } 
  console.error(citiesToCounty[city], `Err: Invalid area name "${city} "chosen! You should only provide city names to event sources.`)
  return 'auto';
}

async function loadEvents() {
  const toCorsProxy = (url: string) => 'https://corsproxy.io/?' + encodeURIComponent(url);
  const domParser = new DOMParser();
  const eventSourcesFromFile = json;

  // Google Calendar
  const googleCalendarSources = eventSourcesFromFile.googleCalendar.map((source) => {
    return {
      googleCalendarId: source.googleCalendarId,
      display: isDisplayingBasedOnFilterSettings(source.city),
      city: source.city
    } as EventGoogleCalendarSource
  });
  addEventSources(googleCalendarSources);

  // Eventbrite.
  const eventbriteSources = await Promise.all(
    eventSourcesFromFile.eventbrite.map(async (source: Event) =>
      await fetch(toCorsProxy(source.url))
        .then(res => res.text())
        .then(html => {
          const events = JSON.parse(
            domParser.parseFromString(html, 'text/html')
              .querySelectorAll('script[type="application/ld+json"]')[1].innerHTML
          ).map(convertSchemaDotOrgEventToFullCalendarEvent);
          return {
            events,
            display: isDisplayingBasedOnFilterSettings(source.city),
            city: source.city
          } as EventNormalSource;
        })
    )
  );
  addEventSources(eventbriteSources);

  // Wordpress tribe API.
  const wordpressTribeSources = await Promise.all(
    eventSourcesFromFile.wordpressTribe.map(async (source: Event) => {
      let wpJson = await (await fetch(source.url)).json();
      let wpEvents = wpJson.events;
      // Get events from each page.
      while (Object.hasOwn(wpJson, 'next_rest_url')) {
        let next_page_url = wpJson.next_rest_url;
        wpJson = await (await fetch(next_page_url)).json();
        wpEvents = wpEvents.concat(wpJson.events);
      }
      return {
        events: wpEvents.map(convertWordpressTribeEventToFullCalendarEvent),
        display: isDisplayingBasedOnFilterSettings(source.city),
        city: source.city
      } as EventNormalSource;
    }
    ));
  addEventSources(wordpressTribeSources);
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

loadEvents()
document.getElementById("error-main").style.visibility = "hidden";
</script>

<template>
<VDropdown :positioning-disabled="isMobile" @apply-show="isMobile && onShow()" @apply-hide="isMobile && onHide()"
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
</VDropdown>
<div class="calendar-container">
    <div style="display: flex; position:relative;">
      <div class="title">
        bay.lgbt
      </div>
      <div style="display:flex; flex-direction: column; align-items: center;">
        <!-- Note: Cat causes some weirdness with resizing, almost all bugs down the line stem from them. -->
        <!-- <img class="cat" src="cat.gif" alt="cat moving" v-bind:width=pageWidth/1.5 /> -->
        <div class="blurb">A curated events board for SF Bay- mostly the girls, gays, and theys!</div>
      </div>
    </div>
    <FullCalendar :options='calendarOptions' />

    <div style="display: flex; align-items: center; flex-direction: row;">
      <div class="desc">
        <p><strong>The events here are scraped
            from various venue event listings that contributors (thank you!) & I collectively find trustworthy. Venue feedback is
            encouraged!
            </strong> Before
          making plans, consider checking with venue staff or event organizers directly. Come out and dance!
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

<style scoped>
</style>
