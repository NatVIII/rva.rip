<script setup lang="ts">
import { VueFinalModal } from 'vue-final-modal'
const props = defineProps<{
    event: Event => void // Declare the event prop here
}>()
const emit = defineEmits<{
	(e: 'confirm'): void
}>()

// Use composable.
/*
const eventTitle = props.event.event.title;
const eventTime = props.event.event.start.toLocaleDateString() + ' @ ' + 
                  props.event.event.start.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
const eventHost = props.event.event.extendedProps.org;
const eventURL = props.event.event.url;
const eventLocation = props.event.event.extendedProps.location;
const eventDescription = props.event.event.extendedProps.description;
*/

</script>
<template>
  <VueFinalModal class="popper-box-wrapper" content-class="popper-box-inner" overlay-transition="vfm-fade" content-transition="vfm-fade">
    <!-- Display "Hello World!" -->
    <div class="hello-world">
      Hello World!
    </div>

    <!-- Add a "Done" button -->
    <div class="bottom">
      <button @click="emit('confirm')">
        Done
      </button>
    </div>
  </VueFinalModal>
</template>