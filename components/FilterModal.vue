<script setup lang="ts">
import { VueFinalModal } from 'vue-final-modal'
const props = defineProps<{
  title?: string
  events: any[] // Add this prop to pass the event data
}>()
const emit = defineEmits<{
  (e: 'confirm'): void
}>()

const toggleTag = (event) => {
  // You can perform any necessary logic here, e.g., update the state of the tags
  // and call the appropriate callback functions based on the checked state.
  if (event.checked) {
    // Tag is checked, you can implement your logic here
  } else {
    // Tag is unchecked, you can implement your logic here
  }
}
</script>

<template>
  <VueFinalModal class="popper-box-wrapper" content-class="popper-box-inner" overlay-transition="vfm-fade" content-transition="vfm-fade">
    <!-- Display Event Details -->
    <div class="event-details">
      <span class="event-headers">Filter by Tags:</span>
      <ul>
        <li v-for="event in props.events" :key="event.id">
          <label>
            <input type="checkbox" v-model="event.checked" @change="toggleTag(event)">
            {{ event.tags }}
          </label>
        </li>
      </ul>
    </div>

    <!-- Add a "Done" button -->
    <div class="bottom">
      <button @click="emit('confirm')">
        Done
      </button>
    </div>
  </VueFinalModal>
</template>