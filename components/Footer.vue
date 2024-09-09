<script setup lang="ts">
import { useTheme } from '@/composables/useTheme';
import { onMounted } from 'vue';

const { theme, setTheme } = useTheme();

const switchTheme = (newTheme) => setTheme(newTheme);

// This could potentially force an update if necessary, but might not be needed
// if your initial setup already correctly handles this.
onMounted(() => {
  const currentTheme = theme.value;
  switchTheme('default');
  setTimeout(() => {
    switchTheme(currentTheme); // Re-apply the current theme to ensure UI consistency
  }, 0); // A delay of 0 ms still allows the event loop to process pending tasks
});
</script>

<template>
    <div>
      <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 0;">
        <div class="desc no-toppy">
          <a href="/">home</a> |
          <a href="/list">list of cool groups</a> |
          <a href="/contributing">how to contribute</a> | 
          <a href="https://github.com/NacreData/calendar">source code</a> 
        </div>
        <div class="desc no-toppy">
          <span class="window-box-effect">theme:  
            <span class="window-box-inner">
              <span @click="switchTheme('dark')" class="link-like" :class="{'selected-preference': theme === 'dark'}">🌑</span> <a> </a>
              <span @click="switchTheme('default')" class="link-like" :class="{'selected-preference': theme === 'default'}">🌓</span> <a> </a>
              <span @click="switchTheme('light')" class="link-like" :class="{'selected-preference': theme === 'light'}">🌕</span>
            </span>
          </span>
        </div>
      </div>
      <div style="background-color: var(--rip-red);" class="color-stripe"></div>
      <div style="background-color: var(--rip-orange);" class="color-stripe"></div>
      <div style="background-color: var(--rip-yellow);" class="color-stripe"></div>
      <div style="background-color: var(--rip-green);" class="color-stripe"></div>
      <div style="background-color: var(--rip-blue);" class="color-stripe"></div>
      <div style="background-color: var(--rip-purple);" class="color-stripe"></div>
      <div class="color-stripe"></div><div class="color-stripe"></div>
    </div>
</template>
