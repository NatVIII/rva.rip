import {
  serverCacheMaxAgeSeconds,
  serverStaleWhileInvalidateSeconds,
} from "./utils/util";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  routeRules: {
    '/cuba': { redirect: 'https://secure.givelively.org/donate/peoples-forum-inc/let-cuba-live-bread-for-our-neighbors/let-cuba-live-rva' },
  },
  typescript: {
    // This ignores errors on build too.
    typeCheck: false,
  },
  modules: ["nuxt-security", "@nuxt/test-utils/module"],
  // See https://nuxt-security.vercel.app/getting-started/quick-start for info on security.
  security: {
    rateLimiter: {
      value: {
        tokensPerInterval: process.dev ? 999999 : 30,
        interval: "hour",
        fireImmediately: false,
      },
      route: "",
      throwError: false, // optional
    },
    requestSizeLimiter: {
      value: {
        maxRequestSizeInBytes: 8000, // Most browsers have a request limit of 8KB, but this is to be safe.
        maxUploadFileRequestInBytes: 1000000,
      },
      route: "",
      throwError: false, // optional,
    },
    allowedMethodsRestricter: {
      value: ["GET"],
      route: "",
      throwError: false, // optional
    },
    corsHandler: {
      value: {
        origin: "*",
        methods: "*",
      },
      route: "",
    },
  },
  plugins: [{ src: "~/plugins/vercel.ts", mode: "client" }],
  css: ["vue-final-modal/style.css"],
});
