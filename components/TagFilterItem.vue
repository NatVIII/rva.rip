<script setup>
const props = defineProps({
  label: String,
  modelValue: Boolean,
  isVisible: Boolean
});
const emit = defineEmits(['update:modelValue']);

// Emitting visibility changes if needed
function updateVisibility(checked) {
  emit('update:modelValue', checked);
}
</script>

<template>
  <label class="city-header" :class="{ 'is-hidden': !props.isVisible }">
    <input type="checkbox" :checked="props.modelValue" @change="updateVisibility($event.target.checked)">
    {{ props.label }}
  </label>
</template>
