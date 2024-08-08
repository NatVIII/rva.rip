<script setup lang="ts">
import { ref } from 'vue';
import { VueFinalModal } from 'vue-final-modal';
import eventSourcesFromFile from '@/assets/event_sources.json';

const { enableEventSource, disableEventSource } = defineProps<{
  enableEventSource: (name: string) => void;
  disableEventSource: (name: string) => void;
}>();

const emit = defineEmits<{
  (e: 'confirm'): void;
}>();

// Accessing tags from the imported JSON
const headerTags = ref(eventSourcesFromFile.tags.headerTags);
const tagsToShow = ref(eventSourcesFromFile.tags.tagsToShow);

// Sorting the headerTags alphabetically
headerTags.value.sort((a, b) => a.toUpperCase().localeCompare(b.toUpperCase()));

function handleEventSourceChange(tag: string, isEnabled: boolean) {
  if (isEnabled) {
    enableEventSource(tag);
  } else {
    disableEventSource(tag);
  }
}
</script>

<template>
  <VueFinalModal class="popper-box-wrapper" content-class="popper-box-inner" overlay-transition="vfm-fade" content-transition="vfm-fade">
    <span class="event-headers">
      Event Purpose
      <div v-for="tag in headerTags" :key="tag" class="event-details">
        <input type="checkbox" :id="tag" @change="handleEventSourceChange(tag, $event.target.checked)" />
        <label for="tag">{{ tag }}</label>
      </div>
    </span>
    <span class="event-headers">
      Event Type
      <div v-for="group in tagsToShow" :key="group[0] || group" class="tag-group">
        <template v-if="Array.isArray(group)">
          <div class="tag-header">
            <input type="checkbox" :id="group[0]" @change="handleEventSourceChange(group[0], $event.target.checked)" />
            <label for="group[0]">{{ group[0] }}</label>
          </div>
          <div v-for="tag in group.slice(1)" :key="tag" class="tag-sub-item">
            <input type="checkbox" :id="tag" @change="handleEventSourceChange(tag, $event.target.checked)" />
            <label for="tag">{{ tag }}</label>
          </div>
        </template>
        <template v-else>
          <div class="tag-group-single">
            <input type="checkbox" :id="group" @change="handleEventSourceChange(group, $event.target.checked)" />
            <label for="group">{{ group }}</label>
          </div>
        </template>
      </div>
    </span>
    <div class="bottom">
      <button @click="emit('confirm')">Apply</button>
    </div>
  </VueFinalModal>
</template>

<style scoped>
.tag-header {
  font-weight: bold;
  margin-top: 1rem;
}

.tag-sub-item {
  margin-left: 20px;
}
</style>
