import { type Page, expect } from "@playwright/test";

// Thunder's OIDC discovery advertises no resource-owner-password grant, so
// there is no shortcut around driving the real sign-in form. The IDP
// occasionally answers an authorize redirect with its own "Oh no, we ran
// into a problem! / The request is invalid" error page (observed live,
// independent of any locator in this file) instead of the sign-in form —
// racing that error heading against the sign-in form lets a retry detect it
// in seconds rather than burning a full wait on a form that was never going
// to appear, so more attempts fit inside the fixed 30s test timeout.
export async function loginAsHouseholdMember(page: Page): Promise<void> {
  const username = process.env.AEP_E2E_USERNAME;
  const password = process.env.AEP_E2E_PASSWORD;
  if (!username || !password) {
    throw new Error("AEP_E2E_USERNAME / AEP_E2E_PASSWORD must be set");
  }

  const attempts = 2;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    await page.goto("/");
    const usernameBox = page.getByRole("textbox", { name: "Username" });
    const idpError = page.getByRole("heading", { name: "Oh no, we ran into a problem!" });
    const dashboardHeading = page.getByRole("heading", { name: "Dashboard" });

    const outcome = await Promise.race([
      usernameBox.waitFor({ state: "visible", timeout: 12_000 }).then(() => "signin" as const),
      idpError.waitFor({ state: "visible", timeout: 12_000 }).then(() => "idp-error" as const),
    ]).catch(() => "timeout" as const);

    if (outcome !== "signin") {
      if (attempt === attempts) throw new Error(`Thunder sign-in unavailable after ${attempts} attempts (${outcome})`);
      continue;
    }

    await usernameBox.fill(username);
    await page.getByRole("textbox", { name: "Password" }).fill(password);
    await page.getByRole("button", { name: "Sign In" }).click();

    const reachedDashboard = await dashboardHeading
      .waitFor({ state: "visible", timeout: 12_000 })
      .then(() => true)
      .catch(() => false);
    if (reachedDashboard) return;
    if (attempt === attempts) {
      await expect(dashboardHeading).toBeVisible({ timeout: 1 });
    }
  }
}

// oidc-client-ts keys the stored user by authority+client_id, both of which
// are platform-derived — match by prefix instead of hardcoding either.
export async function getAccessToken(page: Page): Promise<string> {
  const token = await page.evaluate(() => {
    const key = Object.keys(localStorage).find((k) => k.startsWith("oidc.user:"));
    if (!key) return null;
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return (JSON.parse(raw) as { access_token?: string }).access_token ?? null;
  });
  if (!token) throw new Error("no access token found in localStorage after login");
  return token;
}
