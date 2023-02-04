<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';

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
  events: [
    { title: 'nrspr', start: new Date() },
    { title: 'nrspr', start: new Date() },
    { title: 'nrspr', start: new Date() },
    { title: 'nrspr', start: new Date() },
    { title: 'nrspr', start: new Date() },
    { title: 'nrspr', start: new Date() },
    { title: 'nrspr', start: new Date() },
    { title: 'nrspr', start: new Date() },
    { title: 'nrspr', start: new Date() },
    { title: 'nrspr', start: new Date() }
  ],
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
onUnmounted(() => window.removeEventListener('resize', updateWeekNumbers));
</script>

<template>
  <div class="calendar-container">
    <div class="title">Events board for SF Bay, but mostly the girls, gays, and theys!</div>
    <!-- Note: Cat causes some weirdness with resizing, almost all bugs down the line stem from them. -->
    <img class="cat" src="cat.gif" alt="cat moving" v-bind:width=pageWidth />
    <FullCalendar :options='calendarOptions' />

    <div style="display: flex; align-items: center;">
      <img class="gifs" src="shark.gif" alt="shark dancing" :width='Math.min(pageWidth / 3, 600)' />
      <img class="gifs" src="balloons.gif" alt="balloons and words that say 'INTERNET PARTY'"
        :width='Math.min(pageWidth / 3, 600)' />
      <img class="gifs" src="bmo.gif" alt="BMO dancing" :width='Math.min(pageWidth / 3, 600)' />
    </div>

    <div class="desc">
      <p><strong>This board was made because I felt events in the Bay were hard to find! The events here are scraped
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
        published, request inclusion of your event feed by <a
          href="https://github.com/ivyraine/bay.lgbt/issues">submitting
          your event feed address to us via a new GitHub issue</a>. You may also provide feedback, fixes, or
        improvements there!</p>
    </div>
  </div>
</template>

<style scoped>

</style>
