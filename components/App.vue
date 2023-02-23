<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import iCalendarPlugin from '@fullcalendar/icalendar';
import googleCalendarPlugin from '@fullcalendar/google-calendar';
import json from 'public/event_sources.json';
import $ from 'jquery';

import 'assets/style.css';
import FullCalendar from '@fullcalendar/vue3'
import { ModalsContainer, useModal } from 'vue-final-modal'
import FilterModal from './FilterModal.vue'
import { clientCacheMaxAgeSeconds, clientStaleWhileInvalidateSeconds } from '~~/utils/util';

interface County {
  enabled: any;
  cities: any;
}

// Note: cannot use LocalStorage due to SSR not having LocalStorage. Using LocalStorage would thus cause a hydration mismatch.
const isAllCitiesInMarinCountyEnabled = useIsAllCitiesInMarinCountyEnabled();
// SF-San Mateo County Cities.
const isSanFranciscoEnabled = useIsSanFranciscoEnabled();
const isOthersInSFSanMateoCountyEnabled = useIsOthersInSFSanMateoCountyEnabled();

// Alameda County Cities.
const isOaklandEnabled = useIsOaklandEnabled();
const isBerkeleyEnabled = useIsBerkeleyEnabled();
const isOthersInAlamedaCountyEnabled = useIsOthersInAlamedaCountyEnabled();

// Santa Clara County Cities.
const isSanJoseEnabled = useIsSanJoseEnabled();
const isSunnyvaleEnabled = useIsSunnyvaleEnabled();
const isOthersInSantaClaraCountyEnabled = useIsOthersInSantaClaraCountyEnabled();
// Santa Cruz County Cities.
const isSantaCruzEnabled = useIsSantaCruzEnabled();
const isOthersInSantaCruzCountyEnabled = useIsOthersInSantaCruzCountyEnabled();

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

const getWindowHeight = () => {
  if (process.client) return window.innerHeight;
  return 600;
};

const getWindowWidth = () => {
  if (process.client) return window.innerWidth;
  return 350;
};

const calendarHeight = useCookie('calendarHeight', { default: () => 100, maxAge: 3600 * 365 });
if (process.client) calendarHeight.value = window.innerHeight;
const pageWidth = useCookie('pageWidth', { default: () => 100, maxAge: 3600 * 365 });
if (process.client) pageWidth.value = window.innerWidth;

const isUsingDayMaxEventRows = useState('isUsingDayMaxEventRows', () => true);

const updateWeekNumbers = () => { 
  return getWindowWidth() < 350 ? false : true 
};
// -1 indicates that there is no limit.
const updateDayMaxEventRows = () => { return isUsingDayMaxEventRows.value ? -1 : Math.floor(getWindowHeight() / 75) };

const { open: openFilterModal, close: closeFilterModal } = useModal({
  component: FilterModal,
  attrs: {
    title: 'County/City Filter',
    allCallback: updateAllIsEnabledSetting,
    countyCallback: updateCountyIsEnabledSetting,
    cityCallback: updateCityIsEnabledSetting,
    onConfirm() {
      closeFilterModal()
    },
  },
})

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
      click: openFilterModal,
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
  // Event handlers.
  viewDidMount: moveListViewScrollbarToTodayAndColor,
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

function moveListViewScrollbarToTodayAndColor() {
  const isInListMonthView = $('.fc-scroller.fc-scroller-liquid').length > 0;
  const isInCurrentMonth = $('.fc-list-day.fc-day.fc-day-today').length > 0;
  if (isInListMonthView && isInCurrentMonth) {
    $('.fc-scroller.fc-scroller-liquid').scrollTop($('.fc-list-day.fc-day.fc-day-today').position().top);
    // Also change the color
    $('.fc-list-day.fc-day.fc-day-today').css('--fc-neutral-bg-color', 'lightgreen');
  }
}

onMounted(() => { 
  window.addEventListener("resize", updateCalendarHeight);
});
// onUpdated(() => {});
onUnmounted(() => {
  if (process.client) window.removeEventListener('resize', updateWeekNumbers)
});

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
      // events: newEvents,
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
  'Cache-Control': `max-age=${clientCacheMaxAgeSeconds}, stale-while-revalidate=${clientStaleWhileInvalidateSeconds}`,
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

const { data: eventbriteSourcesResponse } = await useFetch('/api/events/eventbrite', { headers: clientHeaders });
addEventSources(transformEventSourcesResponse(eventbriteSourcesResponse));
const { data: wordPressTribeSourcesResponse } = await useFetch('/api/events/wordpress-tribe', { headers: clientHeaders });
addEventSources(transformEventSourcesResponse(wordPressTribeSourcesResponse));
const { data: tockifySourcesResponse } = await useFetch('/api/events/tockify', { headers: clientHeaders });
addEventSources(transformEventSourcesResponse(tockifySourcesResponse));
const { data: squarespaceEventSourcesResponse } = await useFetch('/api/events/squarespace', { headers: clientHeaders });
addEventSources(transformEventSourcesResponse(squarespaceEventSourcesResponse));
const { data: instagramSourcesResponse } = await useFetch('/api/events/instagram', { headers: clientHeaders });
addEventSources(transformEventSourcesResponse(instagramSourcesResponse));
const { data: googleCalendarSourcesResponse } = await useFetch('/api/events/google-calendar', { headers: clientHeaders });
addEventSources(transformEventSourcesResponse(googleCalendarSourcesResponse));
// loadGoogleCalendarEvents();

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

function updateCityIsEnabledSetting(newIsEnabled: boolean, cityId: string) {
  const isEnabledRef = countiesToCities[getCounty(cityId)].cities[cityId].enabled;
  setCityIsEnabled(cityId, isEnabledRef, newIsEnabled);
  updateEventSourcesEnabled();
}

function test() {
  console.log('test');
}
</script>

<template>
  <ModalsContainer />
<div class="calendar-container">
    <div style="display: flex; flex-direction:column; position:relative;">
      <div class="title">
        bay.lgbt
      </div>
      <div style="display:flex; flex-direction: column; align-items: center;">
        <div class="blurb">An lgbt events aggregator for all around SF bay! Currently in open beta! Please DM event
          & organizers recommendations <a href="https://www.instagram.com/ivyrainey/">here</a> ;3
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
          improvements there! Thanks to recent advances in AI, you may also share your events as Instagram posts, but it comes
          at the expense of accuracy and Ivy's budget (nonexistent).</p>
        <a href="https://github.com/ivyraine/bay.lgbt/">source code</a>
      </div>
      <img class="gifs" src="/bmo.gif" alt="BMO dancing" :width='Math.min(pageWidth / 3, 400)' />
    </div>
  </div>
</template>