import { replaceBadgePlaceholders } from '@/utils/util'; // Adjust the path as necessary

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.directive('badge', {
    beforeMount(el) {
      if (el.nodeType === Node.TEXT_NODE) {
        const replacedText = replaceBadgePlaceholders(el.textContent);
        el.textContent = replacedText;
      } else if (el.nodeType === Node.ELEMENT_NODE) {
        const replacedHtml = replaceBadgePlaceholders(el.innerHTML);
        el.innerHTML = replacedHtml;
      }
    },
    updated(el) {
      if (el.nodeType === Node.TEXT_NODE) {
        const replacedText = replaceBadgePlaceholders(el.textContent);
        el.textContent = replacedText;
      } else if (el.nodeType === Node.ELEMENT_NODE) {
        const replacedHtml = replaceBadgePlaceholders(el.innerHTML);
        el.innerHTML = replacedHtml;
      }
    }
  });
});
