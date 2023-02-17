// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	typescript: {
		// This ignores errors on build too.
		typeCheck: false
	},
	modules: [
		'nuxt-security'
	],
	// See https://nuxt-security.vercel.app/getting-started/quick-start for info on security.
	security: {
		rateLimiter: {
			value: {
				tokensPerInterval: 18,
				interval: "hour",
				fireImmediately: false
			},
			route: '',
			throwError: false, // optional
		},
		requestSizeLimiter: {
			value: {
				maxRequestSizeInBytes: 8000, // Most browsers have a request limit of 8KB, but this is to be safe.
				maxUploadFileRequestInBytes: 1000000,
			},
			route: '',
			throwError: false // optional,
		},
		allowedMethodsRestricter: {
			value: ['GET'],
			route: '',
			throwError: false, // optional
		}
	},
	plugins: [{ src: '~/plugins/vercel.ts', mode: 'client' }],
	css: ['vue-final-modal/style.css'],
})
