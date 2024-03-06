<script setup lang="ts">
import { ref, watchEffect } from 'vue'

//Light/Dark Stuff
const theme = ref<'light' | 'dark'>('light');
function toggleTheme() {
    theme.value = theme.value === 'light' ? 'dark' : 'light';
    if (process.client) {
        loadThemeStyles();
    }
}

function loadThemeStyles() {
  if (process.client) {
    // Define the URLs for the theme-specific stylesheet and the general style.css
    const themeStyleUrl = theme.value === 'light' ? '/_nuxt/assets/light.css' : '/_nuxt/assets/dark.css';
    const generalStyleUrl = '/_nuxt/assets/style.css';

    // Remove the existing theme-specific stylesheet if it exists
    const existingThemeLinkElement = document.head.querySelector('link[data-theme-style]');
    if (existingThemeLinkElement) {
      document.head.removeChild(existingThemeLinkElement);
    }

    // Create and append the new theme-specific stylesheet
    const themeLinkElement = document.createElement('link');
    themeLinkElement.rel = 'stylesheet';
    themeLinkElement.href = themeStyleUrl;
    themeLinkElement.setAttribute('data-theme-style', ''); // Mark it for easy identification
    document.head.appendChild(themeLinkElement);

    // Check if the general style.css is already appended, if not, append it
    let generalStyleLinkElement = document.head.querySelector('link[data-general-style]');
    if (!generalStyleLinkElement) {
      generalStyleLinkElement = document.createElement('link');
      generalStyleLinkElement.rel = 'stylesheet';
      generalStyleLinkElement.href = generalStyleUrl;
      generalStyleLinkElement.setAttribute('data-general-style', ''); // Mark it for easy identification
      document.head.appendChild(generalStyleLinkElement);
    }
  }
}

watchEffect(() => {
    if (process.client) {loadThemeStyles();}
});

// Initial theme setup
loadThemeStyles();

onMounted(() => { 
  if (process.client) {
        theme.value = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        loadThemeStyles();
    }
});
</script>

<template>
    <div>
      <div class="desc" style="padding-top: 0;">
        <button @click="toggleTheme">Toggle Theme</button> |
        <a href="https://github.com/natviii/rva.rip/">source code</a> |
        <a href="/list">list of cool groups</a> |
        <a href="/contributing">how to contribute</a> |
        <a href="/">home</a>
      </div>
      <div style="background-color: #fb4934;" class="color-stripe"></div>
      <div style="background-color: #fe8019;" class="color-stripe"></div>
      <div style="background-color: #fabd2f;" class="color-stripe"></div>
      <div style="background-color: #b8bb26;" class="color-stripe"></div>
      <div style="background-color: #83a598;" class="color-stripe"></div>
      <div style="background-color: #d3869b;" class="color-stripe"></div>
      <div class="color-stripe"></div><div class="color-stripe"></div>
    </div>
</template>