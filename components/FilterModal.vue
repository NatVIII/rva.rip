<script setup lang="ts">
import { VueFinalModal } from 'vue-final-modal'
const props = defineProps<{
  title?: string
  events: any[] // Add this prop to pass the event data
}>()
const emit = defineEmits<{
  (e: 'confirm'): void
}>()

// New computed property to extract unique tags
const uniqueTags = computed(() => {
  const tagsSet = new Set();
  props.events.forEach((event) => {
    if (event.extendedProps && event.extendedProps.tags && Array.isArray(event.extendedProps.tags)) {
      event.extendedProps.tags.forEach((tag) => {
        tagsSet.add(tag.trim()); // Trim whitespace around tags
		console.log(tag.trim()); //Log for each tag
      });
    }
  });
  console.log(Array.from(tagsSet));
  return Array.from(tagsSet);
});

console.log(props.events);
</script>

<template>
  <VueFinalModal class="popper-box-wrapper" content-class="popper-box-inner" overlay-transition="vfm-fade" content-transition="vfm-fade">
    <!-- Display Event Details -->
    <div class="event-details">
      <span class="event-headers">Filter by Tags:</span>
      <ul>
        <li v-for="tag in uniqueTags" :key="tag">
          {{ tag }}
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