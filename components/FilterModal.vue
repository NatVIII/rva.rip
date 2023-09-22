<script setup lang="ts">
import { VueFinalModal } from 'vue-final-modal';
const props = defineProps<{
  title?: string;
  uniqueTags: string[]; // Add this prop to receive the unique tags
}>();
const emit = defineEmits<{
  (e: 'confirm'): void;
}>();
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
