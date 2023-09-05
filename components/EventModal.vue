<script setup lang="ts">
import { VueFinalModal } from 'vue-final-modal'
const props = defineProps<{
    event: any // Declare the event prop here
}>()
const emit = defineEmits<{
	(e: 'confirm'): void
}>()

// Use composable.

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

</script>
<template>
  <VueFinalModal class="popper-box-wrapper" content-class="popper-box-inner" overlay-transition="vfm-fade" content-transition="vfm-fade">
    <!-- Display Event Details -->
    <div class="event-details">
      Event Title: {{ eventTitle }}<br>
      Event Time: {{ eventTime }}<br>
      Event Host: {{ eventHost }}<br>
      Event URL: <a href="{{ eventURL }}">Here</a><br>
      Event Location: <a href="{{ createGoogleMapsURL(eventLocation) }}">{{ eventLocation }}</a><br>
      Event Description: {{ eventDescription }}<br>
    </div>

    <!-- Add a "Done" button -->
    <div class="bottom">
      <button @click="emit('confirm')">
        Done
      </button>
    </div>
  </VueFinalModal>
</template>