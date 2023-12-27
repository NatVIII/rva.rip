<script setup lang="ts">

useHead({
  title: 'rva.rip',
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    {
      hid: 'description',
      name: 'rva.rip',
      content: '',
    },
  ],
  link: [{ rel: 'icon', type: 'image/png', href: '/favicon.png' }],
  script: [
    {
      src: 'https://polyfill.io/v3/polyfill.min.js?features=default%2Ces2015%2Ces6%2Ces5',
      crossorigin: 'anonymous',
    },
  ],
})
</script>

<template>
  <App />
</template>
