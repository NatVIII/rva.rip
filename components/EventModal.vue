<script setup lang="ts">
import { VueFinalModal } from 'vue-final-modal'
import sanitizeHtml from 'sanitize-html';

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
const eventDescription = sanitizeHtml(props.event.event.extendedProps.description);

//For interpreting the location into a google maps recognizable address
function createGoogleMapsURL(location) {
  const encodedLocation = encodeURIComponent(location); // Encode the location string to make it URL-friendly
  const googleMapsURL = `https://www.google.com/maps/search/?q=${encodedLocation}`; // Make the Google Maps URL with the location as the parameter
  return googleMapsURL;
}

// Function to extract image urls from the eventDescription and construct a new URL
// pointing towards your serverless function
const getImageUrls = () => {
  const regex = /(https?:\/\/[^\s]+\.(jpg|png|jpeg))/g;
  const result = eventDescription.match(regex);
  return result !== null ? result.map(url => `/api/fetchImage?url=${encodeURIComponent(url)}`) : [];
};

let errorMessages = ref([]); // To store error messages relating to image display

const handleImageError = (index) => {
  errorMessages.value[index] = `Failed to load image at ${index + 1}. This might be caused by an invalid image URL, or the image size is larger than 5MB.`;
};

// For displaying multiple images
const getImageClass = (index) => {
  const classes = ['single', 'double', 'triple'];
  return classes[index] || '';
};
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
      <!-- Display Images -->
      <div class="image-container">
        <div 
          class="image-wrapper"
          v-for="(url, index) in getImageUrls().slice(0,3)" 
          :key="index"
        >
          <!-- Check if there's an error message for this image, if so, display the message instead of image -->
          <div v-if="errorMessages[index]">
            {{ errorMessages[index] }}
          </div>   
          <!-- If there's no error message, render the image as usual --> 
          <img
            class="event-image"
            v-else
            :src="url"
            :class="getImageClass(index)"
            @error="handleImageError(index)"
            alt="Image found within the description of this calendar event"
          />
        </div>
      </div>
      <span class="event-headers">Event Description:</span> <div v-html="eventDescription"></div><br>
    </div>

    <!-- Add a "Done" button -->
    <div class="bottom">
      <button @click="emit('confirm')">
        Done
      </button>
    </div>
  </VueFinalModal>
</template>