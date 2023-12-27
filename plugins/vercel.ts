// Adds analytics to rva.rip
// See https://vercel.com/docs/concepts/analytics/audiences/quickstart for details
import { inject } from "@vercel/analytics";

export default defineNuxtPlugin(() => {
  inject();
});
