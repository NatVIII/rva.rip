<script setup lang="ts">
<<<<<<< HEAD
import { VueFinalModal } from 'vue-final-modal';
const props = defineProps<{
  title?: string;
  uniqueTags: string[]; // Add this prop to receive the unique tags
}>();
const emit = defineEmits<{
  (e: 'confirm'): void;
}>();
=======
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
>>>>>>> parent of 8c13a59 (reverted some breaks, new FilterModal approach)
</script>

<template>
  <VueFinalModal class="popper-box-wrapper" content-class="popper-box-inner" overlay-transition="vfm-fade" content-transition="vfm-fade">
    <!-- Display Unique Tags -->
    <div class="event-details">
      <span class="event-headers">Unique Tags:</span>
      <ul>
        <li v-for="tag in props.uniqueTags" :key="tag">
          {{ tag }}
        </li>
      </ul>
    </div>

    <!-- Add a "Done" button -->
    <div class="bottom">
      <button @click="emit('confirm')">Done</button>
    </div>
  </VueFinalModal>
</template>
