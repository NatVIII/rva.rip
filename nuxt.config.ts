export default {
	typescript: {
	  typeCheck: false
	},
	modules: [
	  'nuxt-security'
	],
	security: {
	  rateLimiter: {
		value(ctx: { dev?: boolean }) {
		  return {
			tokensPerInterval: ctx.dev ? 999999 : 30,
			interval: "hour",
			fireImmediately: false
		  }
		},
		route: '',
		throwError: false,
	  },
	  requestSizeLimiter: {
		value: {
		  maxRequestSizeInBytes: 8000,
		  maxUploadFileRequestInBytes: 1000000,
		},
		route: '',
		throwError: false,
	  },
	  allowedMethodsRestricter: {
		value: ['GET'],
		route: '',
		throwError: false,
	  },
	  corsHandler: {
		value: {
		  origin: '*',
		  methods: '*',
		},
		route: ''
	  }
	},
	plugins: [{ src: '~/plugins/vercel.ts', mode: 'client' }],
	css: ['vue-final-modal/style.css'],
  }
  