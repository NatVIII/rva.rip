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

const clickedEvent = ref(null); // For storing the clickedEvent data

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
    title: 'Tag Filter',
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

const eventSourcesFromFile = json;
const transformEventSourcesResponse = (eventSources) => {
  const eventsSourcesWithoutProxy = toRaw(eventSources.value.body)
  if (!eventsSourcesWithoutProxy || eventsSourcesWithoutProxy.length < 1) return [];
  const datesAdded = eventsSourcesWithoutProxy.map(eventSource => {
    return {
      ...eventSource,
      // Set the `display` property, since the endpoints don't add it.
      display: 'auto',
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
      display: 'auto'
    } as EventGoogleCalendarSource
  });
  addEventSources(googleCalendarSources);
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
              Stop scrolling insta to find the move!
            </div>
          </td>
        </tr>
      </tbody>
    </table>
    <FullCalendar :options='calendarOptions' />
    <div style="display: flex; align-items: center; flex-direction: row;">
      <div class="desc">
        <p>rva.rip was built with the personal hope that no queer in richmond should be without community. The site will
          always be free, without frills, and remain a public utility. The events here are drawn from various <a
            href="https://github.com/natviii/rva.rip/blob/main/assets/event_sources.json">organizer listings</a> that
          contributors (thank you!) have provided. The listings are in a constant state of community-based vetting; don't
          hesitate to provide feedback! For suggestions and questions email host@rva.rip &lt;3</p>
        <p>Before making plans, consider checking with venue staff or event organizers directly. This site is not
          affiliated with any events listed.</p>
        <p>Still can't figure out what to do? 
          <ul style="line-height: 1.5em">
            <li>Roll up to <a href="https://goo.gl/maps/7hE5ARFYcE7KTgun7">scuff</a> and say hi to the punks</li>
            <li>Check out <a href="https://www.restlessrva.com/">restless</a> for local concerts happening. </li>
            <li>Like sports? Sign up for <a href="https://stonewallrichmond.leagueapps.com/leagues/">stonewall sports</a>!!! Hot athletic gays!!!!!</li>
          </ul></p>
        <p>In New York or the Bay Area??? Check out our sister sites <a href="https://anarchism.nyc/">anarchism.nyc</a>
          and <a href="https://bay.lgbt/">bay.lgbt</a>. This site wouldn't exist without them.</p>
        <p>Want your event listed here? Start making <a
          href="https://support.google.com/calendar/answer/37083">public google calendar</a> for your events (or any other
          <a href="https://fullcalendar.io/docs/event-source">machine readable format</a>). Once published,
          request inclusion of your event feed by sending your Google Calendar ID via a 
          <a href="https://github.com/natviii/rva.rip/issues">new GitHub issue</a> or by emailing me at host@rva.rip! 
          You may also provide feedback, fixes, or improvements through either means</p>
        <a href="https://raw.githubusercontent.com/natviii/rva.rip/main/assets/event_sources.json">event sources</a> |
        <a href="https://github.com/natviii/rva.rip/">source code</a>
      </div>
    </div>
  </div>
</template>
