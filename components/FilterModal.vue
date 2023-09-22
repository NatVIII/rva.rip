<script setup lang="ts">
import { VueFinalModal } from 'vue-final-modal'
const props = defineProps<{
	title?: string
	allCallback: (newIsEnabled: boolean) => void
	cityCallback: (newIsEnabled: boolean, city: string) => void
	countyCallback: (newIsEnabled: boolean, county: string) => void
}>()
const emit = defineEmits<{
	(e: 'confirm'): void
}>()
</script>

<template>
  <VueFinalModal class="popper-box-wrapper" content-class="popper-box-inner" overlay-transition="vfm-fade" content-transition="vfm-fade">
    <!-- Display Event Details -->
    <div class="event-details">
      <span class="event-headers">Hello World!</span>
    </div>

    <!-- Add a "Done" button -->
    <div class="bottom">
      <button @click="emit('confirm')">
        Done
      </button>
    </div>
  </VueFinalModal>
</template>