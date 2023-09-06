<script setup lang="ts">
import { VueFinalModal } from 'vue-final-modal'
const props = defineProps<{
    event: any // Declare the event prop here
}>()
const emit = defineEmits<{
	(e: 'confirm'): void
}>()

// Constants that are used for storing shorthand event information
const eventTitle = props.event.event.title;
const eventTime = props.event.event.start.toLocaleDateString() + ' @ ' + 
                  props.event.event.start.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
const eventHost = props.event.event.extendedProps.org;
const eventURL = props.event.event.url;
const eventLocation = props.event.event.extendedProps.location;
const eventDescription = props.event.event.extendedProps.description;

//For interpreting the location into a google maps recognizable address
function createGoogleMapsURL(location) {
  const encodedLocation = encodeURIComponent(location); // Encode the location string to make it URL-friendly
  const googleMapsURL = `https://www.google.com/maps/search/?q=${encodedLocation}`; // Make the Google Maps URL with the location as the parameter
  return googleMapsURL;
}

const buttonStyles = [ //This will make the modal done button choose one of a couple different queer flags for rep
  {
    normal: {fontSize: '14px'},
    active: {
      'background-image': 'linear-gradient(to bottom right, #f00, #f80, #ff0, #0f0, #0ff, #00f, #80f, #f00)', //gay
    },
  },
  {
    normal: {fontSize: '14px'},
    active: {
      'background-image': 'linear-gradient(to bottom right, #5BCEFA, #F5A9B8, #FFFFFF, #F5A9B8, #5BCEFA)', //trans
    },
  },
  {
    normal: {fontSize: '14px'},
    active: {
      'background-image': 'linear-gradient(to bottom right, #B00B69, #420A55, #042069)', //bi
    },
  },
];

function getRandomStyle() {
  const randomIndex = Math.floor(Math.random() * buttonStyles.length);
  return buttonStyles[randomIndex];
}

const buttonStyle = getRandomStyle();

</script>
<template>
  <VueFinalModal class="popper-box-wrapper" content-class="popper-box-inner" overlay-transition="vfm-fade" content-transition="vfm-fade">
    <!-- Display Event Details -->
    <div class="event-details">
      <span class="event-headers">Event Title:</span> {{ eventTitle }}<br>
      <span class="event-headers">Event Time:</span> {{ eventTime }}<br>
      <span class="event-headers">Event Host:</span> {{ eventHost }}<br>
      <span class="event-headers">Event URL:</span> <a :href="eventURL" target="_blank">Here</a><br>
      <span class="event-headers">Event Location:</span> <a :href="createGoogleMapsURL(eventLocation)" target="_blank">{{ eventLocation }}</a><br>
      <span class="event-headers">Event Description:</span> {{ eventDescription }}<br>
    </div>

    <!-- Add a "Done" button -->
    <div class="bottom">
      <button @click="emit('confirm')" :style="buttonStyle.normal">
        Done
      </button>
    </div>
  </VueFinalModal>
</template>