<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';

// timeGrid, 
const calendarViewSelection = 'dayGridMonth';
const calendarHeight = ref(window.innerHeight);

const updateCalendarHeight = () => calendarHeight.value = window.innerHeight;

onMounted(() => {
  window.addEventListener("resize", updateCalendarHeight);
})
onUnmounted(() => window.removeEventListener('resize', updateCalendarHeight));

const calendarOptions = {
  plugins: [dayGridPlugin, timeGridPlugin],
  initialView: calendarViewSelection,
  height: calendarHeight.value,
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

  <div class="calendar-container">
    <FullCalendar :options='calendarOptions' />
    <div>rnps</div>
    <div>rnps</div>
    <div>rnps</div>
    <div>rnps</div>
    <div>rnps</div>
    <div>rnps</div>
    <div>rnps</div>
    <div>rnps</div>
    <div>rnps</div>
    <div>rnps</div>
    <div>rnps</div>
  </div>

</template>

<style scoped>

</style>
