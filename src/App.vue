<script setup lang="ts">
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';

// timeGrid, 
const calendarViewSelection = 'dayGridMonth';

const calendarOptions = {
  plugins: [dayGridPlugin, timeGridPlugin],
  initialView: calendarViewSelection,
  dayMaxEventRows: 8,
  // moreLinkClick: "day",
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
};

</script>
<script>
</script>

<template>
  <button></button>
  <FullCalendar :options='calendarOptions' />
  <div class="content">hi</div>
</template>

<style scoped>

</style>
