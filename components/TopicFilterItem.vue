<script setup lang="ts">
defineProps({
	label: String,
});
</script>
<template>
	<div class="county-header">
		<span>
			<button class="county-input" @click.passive="$emit('onYes')">+</button>
			<button class="county-input" @click.passive="$emit('onNo')">-</button>
			{{ label }}
		</span>
			<slot></slot>
	</div>
</template>