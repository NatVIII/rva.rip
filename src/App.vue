<script setup lang="ts">
import { ref, onMounted, onUnmounted, onUpdated } from 'vue'
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';

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

interface EventSource {
  events: Event[];
}

const eventSources = ref([]);
const calendarViewSelection = 'dayGridMonth';
const calendarHeight = ref(window.innerHeight);
const pageWidth = ref(window.innerWidth);
const isUsingDayMaxEventRows = ref(true);

const updateWeekNumbers = () => { return window.innerWidth < 350 ? false : true };
// -1 indicates that there is no limit.
const updateDayMaxEventRows = () => { return isUsingDayMaxEventRows.value ? -1 : Math.floor(window.innerHeight / 75) };

const calendarOptions = ref({
  plugins: [dayGridPlugin, timeGridPlugin, listPlugin],
  initialView: calendarViewSelection,
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
    }
  },
  headerToolbar: {
    left: 'prev,next today,less',
    center: 'title',
    right: 'dayGridMonth timeGridDay,listDay'
  },
  nowIndicator: true,
  height: '100vh',
  dayMaxEventRows: updateDayMaxEventRows(),
  navLinks: true,
  weekNumbers: updateWeekNumbers(),
  eventSources: eventSources.value,
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
    start: item.startDate,
    end: item.endDate,
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
function addEventSource(eventSource: EventSource) {
  // Issue: might take a long time to actually update the calendar if the list of, for example, Eventbrite events/sources is large.
  calendarOptions.value = {
    ...calendarOptions.value,
    eventSources: eventSources.value.concat(eventSource)
  };
}

async function loadEvents() {
  const toCorsProxy = (url: string) => 'https://corsproxy.io/?' + encodeURIComponent(url);
  const domParser = new DOMParser();
  const eventSourcesFromFile = await (await fetch('event_sources.json')).json();

  // Eventbrite
  let eventBriteSources = await Promise.all(
    eventSourcesFromFile.eventbrite.map(async (source: Event) =>
      await fetch(toCorsProxy(source.url))
        .then(res => res.text())
        .then(html => {
          const events = JSON.parse(
            domParser.parseFromString(html, 'text/html')
              .querySelectorAll('script[type="application/ld+json"]')[1].innerHTML
          ).map(convertSchemaDotOrgEventToFullCalendarEvent);
          return {
            events
          } as EventSource;
        })
    )
  );
  addEventSource(eventBriteSources);


}

loadEvents()
</script>

<template>
  <div class="calendar-container">
    <div class="title">Events board for SF Bay, but mostly the girls, gays, and theys!</div>
    <!-- Note: Cat causes some weirdness with resizing, almost all bugs down the line stem from them. -->
    <img class="cat" src="cat.gif" alt="cat moving" v-bind:width=pageWidth />
    <FullCalendar :options='calendarOptions' />

    <div style="display: flex; align-items: center; flex-direction: row;">
      <!-- <img class="gifs" src="shark.gif" alt="shark dancing" :width='Math.min(pageWidth / 3, 600)' /> -->
      <!-- <img class="gifs" src="balloons.gif" alt="balloons and words that say 'INTERNET PARTY'" -->
      <!-- :width='Math.min(pageWidth / 3, 600)' /> -->
      <div class="desc">
        <p><strong>The events here are scraped
            from various venue event listings.</strong> Before
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
      <img class="gifs" src="bmo.gif" alt="BMO dancing" :width='Math.min(pageWidth / 3, 400)' />
    </div>
  </div>
</template>

<style scoped>
</style>
