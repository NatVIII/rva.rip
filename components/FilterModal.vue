<script setup lang="ts">
import { ref, inject, computed } from 'vue';
import { VueFinalModal } from 'vue-final-modal';
import eventSourcesJSON from '@/assets/event_sources.json';

const tags = inject('tags'); //Grabs the 'tags' array, which features all tags and whether they're hidden, from App.vue

function getTagVisibility(tagName) {
  const tag = tags.value.find(t => t.name === tagName);
  return tag ? tag.visible : false;
}

function updateTagVisibility(tagName, visibility) {
  const tag = tags.value.find(t => t.name === tagName);
  if (tag) {
    tag.visible = visibility;
  }
}

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

// Example function to toggle visibility
function toggleTagVisibility(tagName: string) {
  const tag = tags.value.find(t => t.name === tagName);
  if (tag) {
    tag.visible = !tag.visible;
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
          <TagFilterItem v-for="tag in group.slice(1)" :key="tag" :label="tag" :modelValue="getTagVisibility(tag)" @update:modelValue="updateTagVisibility(tag, $event)">
          </TagFilterItem>
        </TopicFilterItem>
      </template>
      <template v-else>
        <TagFilterItem class="tag-sub-item" :label="group" :modelValue="getTagVisibility(group)" @update:modelValue="updateTagVisibility(group, $event)">
        </TagFilterItem>
      </template>
    </div>
    <span class="event-headers">
      Debug Info
    </span>
    <div v-for="tag in tags" :key="tag.name">
      <label :class="{ 'is-hidden': !tag.visible }">
        <input type="checkbox" v-model="tag.visible" /> {{ tag.name }}
      </label>
    </div>
    <div class="bottom">
      <button @click="emit('confirm')">Apply</button>
    </div>
  </VueFinalModal>
</template>
