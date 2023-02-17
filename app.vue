<script setup lang="ts">
import { AppConfigInput } from '@nuxt/schema'
const app = useAppConfig() as AppConfigInput
useHead({
  title: 'bay.lgbt',
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    {
      hid: 'description',
      name: 'bay.lgbt',
      content: '',
    },
  ],
  link: [{ rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }],
  script: [
    {
      src: 'https://polyfill.io/v3/polyfill.min.js?features=default%2Ces2015%2Ces6%2Ces5',
    },
  ],
})
</script>

<template>
  <App />
</template>
