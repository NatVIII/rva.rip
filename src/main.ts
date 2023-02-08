import { createApp } from 'vue'
import FullCalendar from '@fullcalendar/vue3'
import './style.css'
import App from './App.vue'
import {
	Dropdown
} from 'floating-vue'

const app = createApp(App);
app.component('FullCalendar', FullCalendar);
app.component('VDropdown', Dropdown);
app.mount('#app')
