import { replaceEmojiPlaceholders } from '@/utils/util'; // Adjust the path as necessary

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.directive('emoji', {
    beforeMount(el) {
      if (el.nodeType === Node.TEXT_NODE) {
        const replacedText = replaceEmojiPlaceholders(el.textContent);
        el.textContent = replacedText;
      } else if (el.nodeType === Node.ELEMENT_NODE) {
        const replacedHtml = replaceEmojiPlaceholders(el.innerHTML);
        el.innerHTML = replacedHtml;
      }
    },
    updated(el) {
      if (el.nodeType === Node.TEXT_NODE) {
        const replacedText = replaceEmojiPlaceholders(el.textContent);
        el.textContent = replacedText;
      } else if (el.nodeType === Node.ELEMENT_NODE) {
        const replacedHtml = replaceEmojiPlaceholders(el.innerHTML);
        el.innerHTML = replacedHtml;
      }
    }
  });
});
