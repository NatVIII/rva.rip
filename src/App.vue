<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';

const calendarViewSelection = 'dayGridMonth';
const calendarHeight = ref(window.innerHeight);
const isUsingDayMaxEventRows = ref(true);

const updateWeekNumbers = () => { return window.innerWidth < 350 ? false : true };
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
  calendarHeight.value = window.innerHeight;
  calendarOptions.value = {
    ...calendarOptions.value,
    weekNumbers: window.innerWidth < 350 ? false : true,
    dayMaxEventRows: updateDayMaxEventRows()
  };
};

onMounted(() => {
  window.addEventListener("resize", updateCalendarHeight);
  console.log(isUsingDayMaxEventRows.value);

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
