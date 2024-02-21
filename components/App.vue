<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import json from '@/assets/event_sources.json';
import $ from 'jquery';
import { DateTime } from 'luxon';

import 'assets/style.css';
import FullCalendar from '@fullcalendar/vue3'
import { ModalsContainer, useModal } from 'vue-final-modal'
import FilterModal from './FilterModal.vue'
import EventModal from './EventModal.vue'
import { clientCacheMaxAgeSeconds, clientStaleWhileInvalidateSeconds } from '~~/utils/util';
import { replaceBadgePlaceholders } from '~~/utils/util';

const clickedEvent = ref(null); // For storing the clickedEvent data
const calendarRef = ref(null); // Ref for the FullCalendar instance

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

const calendarHeight = useCookie('calendarHeight', {
  sameSite: 'strict',
  default: () => 2000, maxAge: 60 * 60 * 24 * 365
});
if (process.client) calendarHeight.value = window.innerHeight;
const pageWidth = useCookie('pageWidth', {
  sameSite: 'strict',
  default: () => 1000, maxAge: 60 * 60 * 24 * 365
});
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

const { open: openEventModal, close: closeEventModal } = useModal({
  component: EventModal,
  attrs: {
    event: clickedEvent,
    onConfirm() {
      closeEventModal()
    },
  },
})

const calendarOptions = ref({
  plugins: [dayGridPlugin, timeGridPlugin, listPlugin],
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
    },/*
    filter: {
      text: 'filter',
      click: openFilterModal,
    },*/
  },
  headerToolbar: {
    left: 'prev today',
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

  eventClick: function (event) {
    event.jsEvent.preventDefault(); // Prevent the default behavior of clicking a link
    clickedEvent.value = event;
    openEventModal();
  },

  progressiveEventRendering: true, // More re-renders; not batched. Needs further testing.
  stickyHeaderDates: true,
  // Event handlers.
  // Move the scrollbar to today when the switching from other views.
  viewDidMount: moveListViewScrollbarToTodayAndColor,
  // eventDidMount: moveListViewScrollbarToTodayAndColor,

  eventContent: function(arg) {
    // Ensure you use v-html in your FullCalendar component to render HTML content
    // Format the start time and title as desired
    let startTime = '';
    if (arg.event.start) {
      // Use Luxon to format the time
      let startDateTime = DateTime.fromJSDate(arg.event.start);
      // Format the time to show "7p" for 19:00 and "5:30a" for 05:30
      startTime = startDateTime.toFormat('h:mma').toLowerCase(); // Converts to "7:00pm" or "5:30am"
      // Remove the leading "0" for times like "07:00pm", remove ":00" for whole hours, and remove "m" to return to it's previous format
      startTime = startTime.replace(/^0/, '').replace(':00', '').replace('m','');
    }
    let title = replaceBadgePlaceholders(arg.event.title);
    let contentHtml;
    if (arg.view.type != 'listMonth') {
      contentHtml = `<div class="fc-daygrid-event-dot" style="display: inline-block; vertical-align: middle; margin-right: 4px; position: relative; top: -1px;"></div><span class="fc-event-time" style="margin-right: 0px;">${startTime}</span> <span class="fc-event-title">${title}</span>`;
    }
    else {
      contentHtml = `<a href="${arg.event.url}" class="fc-event-link" style="text-decoration: none; color: inherit;"><span class="fc-event-title">${title}</span></a>`;
    }
    return { html: contentHtml };
  },
});

const updateCalendarHeight = () => {
  pageWidth.value = getWindowWidth();
  calendarHeight.value = getWindowHeight();
  calendarOptions.value = {
    ...calendarOptions.value,
    weekNumbers: getWindowWidth() < 350 ? false : true,
    dayMaxEventRows: updateDayMaxEventRows()
  };
};

function moveListViewScrollbarToTodayAndColor() {
  const listMonthViewScrollerClass = '.fc-scroller.fc-scroller-liquid';
  const dayGridMonthViewScrollerClass = '.fc-scroller.fc-scroller-liquid-absolute';

  const isInListMonthView = document.querySelector(listMonthViewScrollerClass) !== null;
  const isInDayGridMonthView = document.querySelector(dayGridMonthViewScrollerClass) !== null;

  const isInCurrentMonth = document.querySelector('.fc-list-day.fc-day.fc-day-today') !== null;

  if (isInListMonthView && isInCurrentMonth) {
    const today = document.querySelector('.fc-list-day.fc-day.fc-day-today');
    if (today.length <= 0) return;
    today?.scrollIntoView({ behavior: 'instant', block: 'start', inline: 'nearest' });
    window.scrollTo(0, 0);
    // const todayY = today!.getBoundingClientRect().top;
    // const goToY = Math.min(todayY, todayY);
    // const listMonthViewScroller = document.querySelector(listMonthViewScrollerClass);
    // listMonthViewScroller!.scrollTop = goToY;

    // Old.
    // const today = '.fc-list-day.fc-day.fc-day-today';
    // const scrollLength = $('.fc-scroller.fc-scroller-liquid').prop("scrollHeight");
    // $('.fc-scroller.fc-scroller-liquid').scrollTop(Math.min($(today).position().top, scrollLength));

    // Change today element's --fc-neutral-bg-color to lightgreen.
    today!.style.setProperty('--fc-neutral-bg-color', 'lightgreen');
  }
  else if (isInDayGridMonthView) {
    const today = $('.fc-day.fc-day-today.fc-daygrid-day');
    if (today.length <= 0) return;
    const scrollLength = $('.fc-scroller.fc-scroller-liquid-absolute').prop("scrollHeight");
    $(dayGridMonthViewScrollerClass).scrollTop(Math.min($(today).position().top, scrollLength));
  }
}

async function getEventSources() {
  const endpoints = [
    /*
    '/api/events/eventbrite',
    '/api/events/forbidden-tickets',
    '/api/events/instagram',
    */'/api/events/google-calendar',/*
    '/api/events/squarespace',
    '/api/events/tockify',
    '/api/events/with-friends',
    '/api/events/wordpress-tribe',
    '/api/events/timely',
    '/api/events/wix',
    */
  ];
  const clientHeaders = {
    'Cache-Control': `max-age=${clientCacheMaxAgeSeconds}, stale-while-revalidate=${clientStaleWhileInvalidateSeconds}`,
  };
  // This is to preventing the UI changes from each fetch result to cause more fetches to occur.,
  Promise.allSettled(endpoints.map(async (endpoint) => {
    const { data: response } = await useLazyFetch(endpoint, { headers: clientHeaders });
    return addEventSources(transformEventSourcesResponse(response));
  }));
}

// Multiple re-renders (which may be unrelated to the fetching) cause this to be called multiple times.
getEventSources();
// A hack to move the scrollbar to today after mounting- it is inconsistent otherwise on mobile.
if (process.client)
  setTimeout(moveListViewScrollbarToTodayAndColor, 0);

onMounted(() => { 
  window.addEventListener("resize", updateCalendarHeight);
  moveListViewScrollbarToTodayAndColor();
  // Expose the calendar instance to the window object for debugging
  if (calendarRef.value) window.myCalendar = calendarRef.value.getApi(); 
});
onUpdated(() => {
});
onUnmounted(() => {
  if (process.client) window.removeEventListener('resize', updateWeekNumbers)
});

// Updates calendarOptions' eventSources and triggers a re-render of the calendar.
function addEventSources(newEventSources: EventNormalSource[] | EventGoogleCalendarSource[]) {
  // Cut out events without times, but typecheck for types that can have invalid times.
  newEventSources = newEventSources.map(eventSource => {
    // Skip events that can't be invalid.
    if (eventSource.events === undefined) return eventSource;

    // Filter events.
    const updatedEvents = new Array();
    eventSource.events.forEach((event) => {
      /* REMOVED TEMPORARILY, replaced with the hack below: Remove events that last longer than 3 days.
      Note: This also tends to cut out Eventbrite events that have 'Multiple Dates' over a range of 3 days.
      Using the official Eventbrite API would allow us to avoid this issue, but would potentially run into 
      rate limits pretty quickly during peak hours. */
      const lengthInDays = Math.round((event.end.getTime() - event.start.getTime()) / (1000 * 3600 * 24));

      if (lengthInDays <= eventDayDurationSplitThreshold) {
        updatedEvents.push(event);
      }
      else {
        // Split the event into multiple day-long events.
        // for (let i = 0; i < lengthInDays; i++) {
          // Temporarily just split into the first day and last day. TODO: Change this to split into individual days.
        for (let i = 0; i < lengthInDays; i += lengthInDays - 1) {

          let currentDayStart = DateTime.fromJSDate(event.start, { zone: 'utc' });
          // Set currentDayEnd to start's day, but end's hour and minute.
          let currentDayEnd = DateTime.fromJSDate(event.end, { zone: 'utc' }).set({ month: currentDayStart.month, day: currentDayStart.day }).plus({ days: i });
          currentDayStart = currentDayStart.plus({ days: i });

          // // Adjust for end time being before start time.
          if (currentDayEnd < currentDayStart) {
            currentDayEnd.plus({ days: 1 });
          }

          // If set to all-day, set start to 0 and end to 23:59 in America/Los_Angeles time, to correct inaccurate times.
          if (event.allDay) {
            currentDayStart = currentDayStart.setZone('America/Los_Angeles').set({ hour: 0, minute: 0 }).toUTC();
            currentDayEnd = currentDayEnd.setZone('America/Los_Angeles').set({ hour: 23, minute: 59 }).toUTC();
          }

          const newSplitEvent = {
            ...event,
            // allDay: false,
            // title: `${event.title} (Day (${i + 1}/${lengthInDays})`,
            title: `${event.title} (${i === lengthInDays ? 'Last' : 'First'} Day)`,
            start: currentDayStart.toJSDate(),
            // Use the end time's hour and minute.
            end: currentDayStart.toJSDate(),
          };
          updatedEvents.push(newSplitEvent);
        }
      }
    });

    return {
      ...eventSource,
      events: updatedEvents,
      // events: newEvents,
    } as EventNormalSource;
  });
  // Issue: might take a long time to actually update the calendar if the list of, for example, Eventbrite events/sources is large.

  const res = {
    ...calendarOptions.value,
    eventSources: calendarOptions.value.eventSources.concat(newEventSources)
  };
  calendarOptions.value = res;
  return res;
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
const transformEventSourcesResponse = (eventSources) => {
  const eventsSourcesWithoutProxy = toRaw(eventSources.value.body)
  if (!eventsSourcesWithoutProxy || eventsSourcesWithoutProxy.length < 1) return [];
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

</script>

<template>
  <ModalsContainer />
  <div class="calendar-container">
    <table style="width:100%;">
      <tbody>
        <tr>
          <td class="blurb-image"> <img src="../assets/gravestone.svg" alt="rva.rip"> </td>
          <td>
            <div class="blurb-text">
              A communal board for DIY events all around RVA; queer, radical, and STINKY!!!
            </div>
            <div style="font-size: min(1.2em); text-align: center;">
              Stop scrolling insta to find the move!<br>
              🇵🇸 <a href="https://decolonizepalestine.com/">Long Live Palestine</a> 🇵🇸
            </div>
          </td>
        </tr>
      </tbody>
    </table>
    <FullCalendar ref="calendarRef" :options='calendarOptions' />
    <div style="display: flex; align-items: center; flex-direction: row;">
      <div class="desc">
        <p>rva.rip was built with the personal hope that no person in richmond should be without community. The site will
          always be free, without frills, and remain a public utility. The events here are drawn from various 
          <a href="https://github.com/natviii/rva.rip/blob/main/assets/event_sources.json">organizer listings</a> that
          contributors (thank you!) have provided. Building community is the focus of this project. If you'd like to become
          a contributor of events, check out our contributing guide <a href="/contributing">here</a>! The events presented here are in a
          constant state of community-based vetting; don't hesitate to provide feedback! For suggestions and questions
          email <a href="mailto:host@rva.rip">host@rva.rip</a> &lt;3</p>
        <p>Before making plans, consider checking with venue staff or event organizers directly. This site is not
          affiliated with any events listed.</p>
        <p>Still can't figure out what to do? 
          <ul style="line-height: 1.5em">
            <li>Bored? Roll up to <a href="https://goo.gl/maps/7hE5ARFYcE7KTgun7">scuff</a> and say hi to the punks</li>
            <li>Looking for music? Check out <a href="https://www.restlessrva.com/">restless</a> for local concerts happening. </li>
            <li>Like sports? Sign up for <a href="https://stonewallrichmond.leagueapps.com/leagues/">stonewall sports</a>!!! Hot athletic gays!!!!!</li>
            <li>Don't wanna go outside? Play <a href="https://play.half.earth//">half earth socialism</a>!!!</li>
            <li>Wanna find more groups? Check out our <a href="/list">list of organizations and groups</a> in RVA</li>
            <li>Looking for a reddit alternative? <a href="https://hexbear.net/">Check out this dope ass bear</a>.</li>
          </ul></p>
        <p>Not in Richmond??? Check out our sibling sites <a href="https://anarchism.nyc/">anarchism.nyc</a>, 
        <a href="https://bay.lgbt/">bay.lgbt</a>, and <a href="https://readymouse.github.io/AnarchistEventsBOS//">anarchism.bos</a>.
        This site wouldn't exist without them, and we're all run by trans folks.</p>
        <p>Want your event listed here? Start making <a href="/contributing">public google calendar</a> for your events. 
          Once published, request inclusion of your event feed by sending your Google Calendar ID via a 
          <a href="https://github.com/natviii/rva.rip/issues">new GitHub issue</a> or by emailing me at host@rva.rip! 
          You may also provide feedback, fixes, or improvements through either means</p>
        <a href="https://raw.githubusercontent.com/natviii/rva.rip/main/assets/event_sources.json">event sources</a> |
        <a href="https://github.com/natviii/rva.rip/">source code</a> |
        <a href="/list">list of cool groups</a> |
        <a href="/contributing">how to contribute</a>
      </div>
    </div>
    <div>
      <div style="background-color: #fb4934;" class="color-stripe"></div>
      <div style="background-color: #fe8019;" class="color-stripe"></div>
      <div style="background-color: #fabd2f;" class="color-stripe"></div>
      <div style="background-color: #b8bb26;" class="color-stripe"></div>
      <div style="background-color: #83a598;" class="color-stripe"></div>
      <div style="background-color: #d3869b;" class="color-stripe"></div>
      <div class="color-stripe"></div><div class="color-stripe"></div>
    </div>
  </div>
</template>
