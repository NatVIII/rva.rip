<script setup lang="ts">
import { useTheme } from '@/composables/useTheme';

const { theme, setTheme } = useTheme();

const switchTheme = (newTheme) => setTheme(newTheme);
</script>

<template>
    <div>
      <div class="desc" style="padding-top: 0;">
        <a href="/">home</a> |
        <a href="/list">list of cool groups</a> |
        <a href="/contributing">how to contribute</a> |
        <a>color theme: </a>
        <span :style="{ filter: theme === 'dark' ? 'drop-shadow(0px 0px 0.25em var(--border-outer))' : '' }" @click="switchTheme('dark')" class="link-like">🌑</span> 
        <span :style="{ filter: theme === 'default' ? 'drop-shadow(0px 0px 0.25em var(--border-outer))' : '' }" @click="switchTheme('default')" class="link-like">🌓</span> 
        <span :style="{ filter: theme === 'light' ? 'drop-shadow(0px 0px 0.25em var(--border-outer))' : '' }" @click="switchTheme('light')" class="link-like">🌕</span> |
        <a href="https://github.com/natviii/rva.rip/">source code</a> 
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