<script setup lang="ts">
import { ref } from 'vue';
import { VueFinalModal } from 'vue-final-modal';
import eventSourcesJSON from '@/assets/event_sources.json';

const { enableEventSource, disableEventSource } = defineProps<{
  enableEventSource: (name: string) => void;
  disableEventSource: (name: string) => void;
}>();

const emit = defineEmits<{
  (e: 'confirm'): void;
}>();

// Accessing tags from the imported JSON
const tagsHeader = ref(eventSourcesJSON.appConfig.tagsHeader);
const tagsToShow = ref(eventSourcesJSON.appConfig.tagsToShow);

// Sorting the tagsHeader alphabetically
tagsHeader.value.sort((a, b) => a.toUpperCase().localeCompare(b.toUpperCase()));

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
    </span>
    <TagFilterItem v-for="tag in tagsHeader" :key="tag" class="tag-group" :label="tag">
    </TagFilterItem>
    <span class="event-headers">
      Event Type
    </span>
    <div v-for="group in tagsToShow" :key="group[0] || group" class="tag-group">
      <template v-if="Array.isArray(group)">
        <TopicFilterItem class="tag-header" :label="group[0]">
          <TagFilterItem v-for="tag in group.slice(1)" :key="tag" class="tag-sub-item" :label="tag">
          </TagFilterItem>
        </TopicFilterItem>
      </template>
      <template v-else>
        <TagFilterItem class="tag-sub-item" :label="group">
        </TagFilterItem>
      </template>
    </div>
    <div class="bottom">
      <button @click="emit('confirm')">Apply</button>
    </div>
  </VueFinalModal>
</template>
