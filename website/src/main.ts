import { createApp } from 'vue'
import FullCalendar from '@fullcalendar/vue3'
import './style.css'
import App from './App.vue'
import {
	Dropdown
} from 'floating-vue'

import CountyFilterItem from './components/CountyFilterItem.vue';
import CityFilterItem from './components/CityFilterItem.vue';

const app = createApp(App);
app.component('FullCalendar', FullCalendar);
app.component('CountyFilterItem', CountyFilterItem);
app.component('CityFilterItem', CityFilterItem);
app.component('VDropdown', Dropdown);
app.mount('#app')
