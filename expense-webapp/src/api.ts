import createClient from "openapi-fetch";
import type { paths } from "./generated/expense-api";
import { getAccessToken, signIn } from "./auth";

const client = createClient<paths>({ baseUrl: "/api" });

// Attach the bearer token to every request; on 401 restart sign-in. A single
// middleware keeps every page's call site free of auth plumbing.
client.use({
  async onRequest({ request }) {
    const token = await getAccessToken();
    if (token) request.headers.set("Authorization", `Bearer ${token}`);
    return request;
  },
  async onResponse({ response }) {
    if (response.status === 401) {
      await signIn();
    }
    return response;
  },
});

export const expenseApi = client;

// expense-api's contract declares X-User-Id as a required request header on
// every operation, but that identity is gateway-injected from the validated
// bearer token (thunder-authentication / api-management) — nginx clears any
// inbound value the browser sets before proxying (nginx/default.conf) and the
// gateway supplies the real one. This placeholder only satisfies the
// generated client's required-header typing; its value is never trusted.
export const USER_ID_HEADER = { "X-User-Id": "browser" } as const;
