<script setup lang="ts">
defineProps({
	label: String,
});
</script>
<template>
	<div class="county-header">
		<span>
			<button class="county-input" @click.passive="$emit('onYes')">Y</button>
			<button class="county-input" @click.passive="$emit('onNo')">N</button>
			{{ label }}
		</span>
			<slot></slot>
	</div>
</template>