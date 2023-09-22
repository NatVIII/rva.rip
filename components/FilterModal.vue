<script setup lang="ts">
import { VueFinalModal } from 'vue-final-modal';
import { ref, onMounted, watch } from 'vue';

const props = defineProps<{
  title?: string;
  events: any[]; // Add this prop to pass the event data
}>();
const emit = defineEmits<{
  (e: 'confirm'): void;
}>();

const uniqueTags = ref<string[]>([]);

// Watch for changes in the events data and update uniqueTags
watch(() => props.events, (newEvents) => {
  const tagsSet = new Set<string>();
  newEvents.forEach((event) => {
    if (event.extendedProps && event.extendedProps.tags && Array.isArray(event.extendedProps.tags)) {
      event.extendedProps.tags.forEach((tag) => {
        tagsSet.add(tag.trim());
      });
    }
  });
  uniqueTags.value = Array.from(tagsSet);
});

//console.log(props.events);
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