<script setup lang="ts">
import { computed, onUpdated } from 'vue';
const props = defineProps({ label: String, modelValue: Boolean });
const emit = defineEmits(['update:modelValue', 'onInput']);
const value = computed({
	get() {
		return props.modelValue
	},
	set(checked) {
		emit('update:modelValue', checked)
	}
})
</script>

<template>
	<label class="city-header">
		<input type="checkbox" v-model="value" @click.passive="$emit('onInput', $event)"> {{ label }}
	</label>
</template>
