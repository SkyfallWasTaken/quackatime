import KeyvSqlite from "@keyv/sqlite";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { apiKey, captcha, haveIBeenPwned } from "better-auth/plugins";
import { eq } from "drizzle-orm";
import Keyv from "keyv";
import { Resend } from "resend";

import ForgotPassword from "@repo/emails/emails/forgot-password";
import VerifyEmail from "@repo/emails/emails/verify-email";
import { env } from "@repo/env/server";
import {
	account,
	apikey,
	db,
	session,
	user as usersTable,
	verification,
} from "~/server/db";

if (globalThis.window) {
	throw new Error("`auth.ts` should only be imported on the server");
}

const resend = new Resend(env.RESEND_API_KEY);

const keyvSqlite = new KeyvSqlite(env.SESSION_DB_FILE_PATH);
const keyv = new Keyv({ store: keyvSqlite, namespace: "sessions-cache" });

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "pg",
		schema: {
			user: usersTable,
			verification,
			account,
			session,
			apikey,
		},
	}),
	emailAndPassword: {
		enabled: true,
		sendResetPassword: async ({ user, url }) => {
			const res = await resend.emails.send({
				from: `OtterTime <${env.RESEND_FROM_EMAIL}>`,
				to: [user.email],
				subject: "Reset your password for OtterTime",
				react: ForgotPassword({
					link: url,
					address: env.RESEND_POSTAL_ADDRESS,
				}),
			});
			if (res.error) {
				console.error("Error sending email verification", res.error);
				throw new Error("Error sending forgot password email");
			}
		},
	},
	socialProviders: {
		github: {
			clientId: env.VITE_GITHUB_CLIENT_ID,
			clientSecret: env.GITHUB_CLIENT_SECRET,
		},
	},
	plugins: [
		haveIBeenPwned({
			customPasswordCompromisedMessage:
				"This password has been detected as part of a data breach. Please choose a more secure password (you might need to reset it if you already have an account).",
		}),
		apiKey({
			customKeyGenerator: async () => {
				// WakaTime plugins check for this: https://github.com/wakatime/wakatime-cli/blob/a76bb39bb741740851d6eb4d3142c6d9732e9ee8/cmd/params/params.go#L46
				return crypto.randomUUID();
			},
			defaultKeyLength: 32,
			rateLimit: {
				maxRequests: 50,
				timeWindow: 3 * 60 * 1000, // 3 minute
				enabled: true,
			},
		}),
		captcha({
			provider: "cloudflare-turnstile",
			secretKey: env.TURNSTILE_SECRET_KEY,
		}),
	],
	user: {
		additionalFields: {
			apiKey: {
				type: "string",
				nullable: true,
				input: false,
			},
		},
	},
	session: {
		cookieCache: {
			enabled: false, // TODO: store avatars in R2, then re-enable this
			maxAge: 5 * 60, // 5 minutes
		},
	},
	databaseHooks: {
		user: {
			create: {
				after: async (user) => {
					const key = await auth.api.createApiKey({
						body: {
							userId: user.id,
						},
					});
					await db
						.update(usersTable)
						.set({ apiKey: key.key })
						.where(eq(usersTable.id, key.userId));
				},
			},
		},
	},
	emailVerification: {
		sendVerificationEmail: async ({ user, url }) => {
			console.log("Sending email verification to", user.email);
			const res = await resend.emails.send({
				from: `OtterTime <${env.RESEND_FROM_EMAIL}>`,
				to: [user.email],
				subject: "Verify your email for OtterTime",
				react: VerifyEmail({
					link: url,
					address: env.RESEND_POSTAL_ADDRESS,
				}),
			});
			if (res.error) {
				console.error("Error sending email verification", res.error);
				throw new Error("Error sending email verification");
			}

			console.log("Email verification sent to", user.email);
		},
		sendOnSignUp: true,
		autoSignInAfterVerification: true,
	},
	advanced: {
		cookiePrefix: "ottertime",
		disableCSRFCheck: process.env.NODE_ENV === "development",
	},
	// secondaryStorage: {
	// 	get: async (key) => {
	// 		const value = await keyv.get(key);
	// 		return value ? value : null;
	// 	},
	// 	set: async (key, value, ttl) => {
	// 		if (ttl) {
	// 			await keyv.set(key, value, ttl);
	// 		} else {
	// 			await keyv.set(key, value);
	// 		}
	// 	},
	// 	delete: async (key) => {
	// 		await keyv.delete(key);
	// 	},
	// },
});
