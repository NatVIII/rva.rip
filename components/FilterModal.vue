<script setup lang="ts">
import { VueFinalModal } from 'vue-final-modal'
import eventSourcesFromFile from '@/assets/event_sources.json'

const { disableEventSource } = defineProps<{
  disableEventSource: (name: string) => void
}>()
const emit = defineEmits<{
  (e: 'confirm'): void
}>()

const sources = Object.values(eventSourcesFromFile).flat()

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort#sorting_array_of_objects
sources.sort((a, b) => {
  const nameA = a.name.toUpperCase(); // ignore upper and lowercase
  const nameB = b.name.toUpperCase(); // ignore upper and lowercase
  if (nameA < nameB) {
    return -1;
  }
  if (nameA > nameB) {
    return 1;
  }

  // names must be equal
  return 0;
})
</script>

<template>
  <VueFinalModal class="popper-box-wrapper" content-class="popper-box-inner" overlay-transition="vfm-fade"
    content-transition="vfm-fade">
    <CountyFilterItem v-for="source in sources" :key="source.name" :label="source.name"
      @on-no="disableEventSource(source.name)" />
    <div class="bottom">
      <button @click="emit('confirm')">
        Done
      </button>
    </div>
  </VueFinalModal>
</template>