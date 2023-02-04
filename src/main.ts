import { createApp } from 'vue'
import FullCalendar from '@fullcalendar/vue3'
import './style.css'
import App from './App.vue'


const app = createApp(App);
app.component('FullCalendar', FullCalendar);
app.mount('#app')
