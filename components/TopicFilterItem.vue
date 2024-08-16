<script setup lang="ts">
const props = defineProps({
  label: String
});

const emit = defineEmits(['checkAll', 'uncheckAll']);

function checkAllTags() {
  emit('checkAll');
}

function uncheckAllTags() {
  emit('uncheckAll');
}
</script>

<template>
  <div class="county-header">
    <span>
      <button class="county-input" @click="checkAllTags">+</button>
      <button class="county-input" @click="uncheckAllTags">-</button>
      {{ label }}
    </span>
    <slot></slot>
  </div>
</template>
