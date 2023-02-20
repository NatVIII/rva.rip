// nitro.config.ts
import { defineNitroConfig } from "nitropack";
import { serverCacheMaxAgeSeconds, serverStaleWhileInvalidateSeconds } from './utils/util';

export default defineNitroConfig({
	routeRules: {
		// '/': { cache: { swr: true, maxAge: serverCacheMaxAgeSeconds, staleMaxAge: serverStaleWhileInvalidateSeconds } }
	},
});