import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

// Make sure to update the Turbo config to include new env variables!
export const env = createEnv({
	server: {
		DATABASE_URL: z.string().url(),
		BETTER_AUTH_SECRET: z.string(),
		GITHUB_CLIENT_SECRET: z.string(),
		RESEND_API_KEY: z.string().startsWith("re_"),
		RESEND_FROM_EMAIL: z.string().email(),
		RESEND_POSTAL_ADDRESS: z.string().optional(),
		SENTRY_ORG: z.string(),
		SENTRY_PROJECT: z.string(),
		SENTRY_AUTH_TOKEN: z.string(),
		PORT: z.coerce.number().default(7676),
		FRONTEND_DOMAIN: z.string().url(),
		SESSION_STORAGE_SECRET: z.string(),
		SESSION_DB_FILE_PATH: z.string().default("sqlite://sessions-cache.sqlite"),
		TURNSTILE_SECRET_KEY: z.string(),
	},
	// Make sure to update client.ts too!
	clientPrefix: "VITE_",
	client: {
		VITE_GITHUB_CLIENT_ID: z.string(),
		VITE_SENTRY_DSN: z.string(),
		VITE_TURNSTILE_SITE_KEY: z.string(),
	},
	runtimeEnv: process.env,
	emptyStringAsUndefined: true,
});
