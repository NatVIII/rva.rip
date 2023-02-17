// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	typescript: {
		// This ignores errors on build too.
		typeCheck: false
	},
	css: ['vue-final-modal/style.css'],
	plugins: [{ src: '~/plugins/vercel.ts', mode: 'client' }],
})
