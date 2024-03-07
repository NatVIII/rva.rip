<script setup lang="ts">
import { useTheme } from '@/composables/useTheme';

const { theme, toggleTheme } = useTheme();
</script>

<template>
    <div>
      <div class="desc" style="padding-top: 0;">
        <span @click="toggleTheme" class="link-like"> {{ theme === 'dark' ? 'switch to light mode' : 'switch to dark mode' }} </span> |
        <a href="https://github.com/natviii/rva.rip/">source code</a> |
        <a href="/list">list of cool groups</a> |
        <a href="/contributing">how to contribute</a> |
        <a href="/">home</a>
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