<script setup lang="ts">
import { ref, onMounted, onUnmounted, onUpdated, callWithAsyncErrorHandling } from 'vue'
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import iCalendarPlugin from '@fullcalendar/icalendar';
import googleCalendarPlugin from '@fullcalendar/google-calendar';
import json from './event_sources.json';
import 'floating-vue/dist/style.css';

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
  area: string;
}

interface EventGoogleCalendarSource {
  googleCalendarId: string;
}

const isFilterDropdownShown = ref(false);
const isSfBayEnabled = ref(JSON.parse(localStorage.getItem(getFilterVarFromAreaName('SF Bay')) || 'true'));
const isEastBayEnabled = ref(JSON.parse(localStorage.getItem(getFilterVarFromAreaName('East Bay')) || 'true'));
const isSouthBayEnabled = ref(JSON.parse(localStorage.getItem(getFilterVarFromAreaName('South Bay')) || 'true'));
const isSantaCruzCountyEnabled = ref(JSON.parse(localStorage.getItem(getFilterVarFromAreaName('Santa Cruz County')) || 'true'));

const count = ref(0);
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

function isDisplayingBasedOnFilterSettings(area: string) {
  switch (area) {
    case 'SF Bay':
      return isSfBayEnabled.value ? 'auto' : 'none';
    case 'East Bay':
      return isEastBayEnabled.value ? 'auto' : 'none';
    case 'South Bay':
      return isSouthBayEnabled.value ? 'auto' : 'none';
    case 'Santa Cruz County':
      return isSantaCruzCountyEnabled.value ? 'auto' : 'none';
  }
  console.error('Err: Could not invalid naming chosen!')
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
      display: isDisplayingBasedOnFilterSettings(source.area),
      area: source.area
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
            display: isDisplayingBasedOnFilterSettings(source.area),
            area: source.area
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
        display: isDisplayingBasedOnFilterSettings(source.area),
        area: source.area
      } as EventNormalSource;
    }
    ));
  addEventSources(wordpressTribeSources);
}

function getFilterVarFromAreaName(area: string) {
  const converter = {
    'SF Bay': 'isSfBayEnabled',
    'East Bay': 'isEastBayEnabled',
    'South Bay': 'isSouthBayEnabled',
    'Santa Cruz County': 'isSantaCruzCountyEnabled'
  };
  console.assert(Object.hasOwn(converter, area));
  return converter[area]!;
}

function onFilterUpdate(event, area: string) {
  localStorage.setItem(getFilterVarFromAreaName(area), event.target.checked);
  const newEventSources = calendarOptions.value.eventSources.map((source: EventNormalSource | EventGoogleCalendarSource) => {
    return {
      ...source,
      // Updated filtered area.
      display: source.area === area ?
        (event.target.checked ? 'auto' : 'none') : source.display
    } as EventSource;
  });
  calendarOptions.value = { ...calendarOptions.value, eventSources: newEventSources };
}

loadEvents()
</script>

<template>
<VDropdown :positioning-disabled="isMobile" @apply-show="isMobile && onShow()" @apply-hide="isMobile && onHide()"
  :trigger="[]" :shown="isFilterDropdownShown">

  <template #popper="{ hide }">
    <div class="popper-box">
      <div class="popper-box-inner">
        <label>
          <input v-model="isSfBayEnabled" type="checkbox" @click.passive="onFilterUpdate($event, 'SF Bay')"> SF Bay
        </label>
        <label>
          <input v-model="isEastBayEnabled" type="checkbox" @click.passive="onFilterUpdate($event, 'East Bay')"> East Bay
        </label>
        <label>
          <input v-model="isSouthBayEnabled" type="checkbox" @click.passive="onFilterUpdate($event, 'South Bay')"> South Bay
        </label>
        <label>
          <input v-model="isSantaCruzCountyEnabled" type="checkbox" @click.passive="onFilterUpdate($event, 'Santa Cruz County')">
          Santa Cruz County
        </label>
      </div>
      <div style="text-align:center"><button v-if="isMobile" @click.passive="hide()">Done</button></div>
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
      <!-- <img class="gifs" src="shark.gif" alt="shark dancing" :width='Math.min(pageWidth / 3, 600)' /> -->
      <!-- <img class="gifs" src="balloons.gif" alt="balloons and words that say 'INTERNET PARTY'" -->
      <!-- :width='Math.min(pageWidth / 3, 600)' /> -->
      <div class="desc">
        <p><strong>The events here are scraped
            from various venue event listings that I find trustworthy. Venue feedback is encouraged! </strong> Before
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
