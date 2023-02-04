<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';

// timeGrid, 
const calendarViewSelection = 'dayGridMonth';
const calendarHeight = ref(window.innerHeight);

const updateWeekNumbers = () => { return window.innerWidth < 350 ? false : true };
const calendarOptions = ref({
  plugins: [dayGridPlugin, timeGridPlugin, listPlugin],
  initialView: calendarViewSelection,
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth timeGridDay,listDay'
  },
  nowIndicator: true,
  height: '100vh',
  dayMaxEventRows: 8,
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
  calendarHeight.value = window.innerHeight;
  calendarOptions.value = { ...calendarOptions.value, weekNumbers: window.innerWidth < 350 ? false : true };
};

onMounted(() => {
  window.addEventListener("resize", updateCalendarHeight);
})
onUnmounted(() => window.removeEventListener('resize', updateWeekNumbers));

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
