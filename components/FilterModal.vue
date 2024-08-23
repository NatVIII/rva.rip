<script setup lang="ts">
import { ref, inject, computed } from 'vue';
import { VueFinalModal } from 'vue-final-modal';
import TopicFilterItem from './TopicFilterItem.vue';
import TagFilterItem from './TagFilterItem.vue';
import eventSourcesJSON from '@/assets/event_sources.json';

const tags = inject('tags'); //Grabs the 'tags' array, which features all tags and whether they're hidden, from App.vue

function getTagVisibility(tagName) {
  const tag = tags.value.find(t => t.name === tagName);
  return tag ? tag.isVisible : false;
}

function updateTagVisibility(tagName, visibility) {
  const tag = tags.value.find(t => t.name === tagName);
  if (tag) {
    tag.isVisible = visibility;
  }
}

function setVisibilityForGroup(tagsInGroup, visibility) {
  tagsInGroup.forEach(tagName => {
    const tag = tags.value.find(t => t.name === tagName.name);
    if (tag) {
      tag.isVisible = visibility;
    }
  });
}

const { enableEventSource, disableEventSource } = defineProps<{
  enableEventSource: (name: string) => void;
  disableEventSource: (name: string) => void;
}>();

const emit = defineEmits<{
  (e: 'confirm'): void;
}>();

// Development environment flag
const isDevelopment = process.env.NODE_ENV === 'development';

// Accessing tags from the imported JSON
const tagsHeader = ref(eventSourcesJSON.appConfig.tagsHeader);
const tagsHidden = ref(eventSourcesJSON.appConfig.tagsHidden);
const tagsToShow = ref(eventSourcesJSON.appConfig.tagsToShow);

// Computed property to flatten tagsToShow into a 1D array of strings, for the purpose of debugging to make sure there's no tags missing
const tagsAllShown = computed(() => {
  let flattened = [];
  for (let i = 0; i < tagsToShow.value.length; i++) {
    if (tagsToShow.value[i].length === 1) {
      flattened.push(tagsToShow.value[i][0].map(tag => tag.name));
    } else {
      flattened.push(...tagsToShow.value[i].slice(1).map(tag => tag.name)); // Skip the first element (label) and add rest
    }
  }
  flattened.push(...tagsHeader.value.map(tag => tag.name)); //Add the tagsHeader values to the array, ensuring that they're not left out from the list of ALL TAGS SHOWN
  flattened.push(...tagsHidden.value); //Add the tagsHidden values to the array, ensuring that they're not left out from the list of ALL TAGS SHOWN
  return flattened;
});

//
const tagsNotShown = computed(() => { //A 1D array of tags that aren't featured in tagsAllShown but ARE featured in tags; used to show any tags that maybe should be visible in the UI or should be wiped from event_sources.json altogether.
  const shownSet = new Set(tagsAllShown.value);
  return tags.value.filter(tag => !shownSet.has(tag.name));
});

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
    tag.isVisible = !tag.isVisible;
  }
}

</script>

<template>
  <VueFinalModal class="popper-box-wrapper" content-class="popper-box-inner" overlay-transition="vfm-fade" content-transition="vfm-fade">
    <span class="event-headers">
      Event Purpose
    </span>
    <TagFilterItem v-for="tag in tagsHeader" :key="tag.name" class="tag-group" :label="tag.fullName" :modelValue="getTagVisibility(tag.name)" @update:modelValue="updateTagVisibility(tag.name, $event)">
    </TagFilterItem>
    <span class="event-headers">
      Event Type
    </span>
    <div v-for="group in tagsToShow" :key="group[0] || group" class="tag-group">
      <template v-if="Array.isArray(group)">
        <TopicFilterItem class="tag-header" :label="group[0].fullName" @checkAll="setVisibilityForGroup(group.slice(1), true)" @uncheckAll="setVisibilityForGroup(group.slice(1), false)">
          <TagFilterItem v-for="tag in group.slice(1)" :key="tag.name" :label="tag.fullName" :modelValue="getTagVisibility(tag.name)" @update:modelValue="updateTagVisibility(tag.name, $event)">
          </TagFilterItem>
        </TopicFilterItem>
      </template>
      <template v-else>
        <TagFilterItem class="tag-sub-item" :label="group" :modelValue="getTagVisibility(group)" @update:modelValue="updateTagVisibility(group, $event)">
        </TagFilterItem>
      </template>
    </div>
    <span v-if="isDevelopment">
      <span class="event-headers">
        Tags Not Shown
      </span>
      <div v-for="tag in tagsNotShown" :key="tag">
        <input type="checkbox" 
              :checked="getTagVisibility(tag.name)" 
              @change="updateTagVisibility(tag.name, $event.target.checked)" /> {{ tag.name }}
      </div>
    </span>
    <div class="bottom">
      <button @click="emit('confirm')">Apply</button>
    </div>
  </VueFinalModal>
</template>
