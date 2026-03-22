import { test, expect } from "@playwright/test";
import { LoginPage } from "../../pages/LoginPage";
import usersData from "../../fixtures/users.json";
import { ENV } from "../../config/env";

test.describe("Authentication", () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate();
  });

  test("should login successfully with standard_user", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.loginSuccessfully(ENV.users.standard);
    await expect(page).toHaveURL(/inventory/);
  });

  for (const scenario of usersData.invalidCredentials) {
    test(`login failure — ${scenario.label}`, async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.login({
        username: scenario.username,
        password: scenario.password,
      });
      await loginPage.assertErrorMessage("Epic sadface");
      await loginPage.assertOnLoginPage();
    });
  }

  test("locked_out_user should see locked out message", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.login(ENV.users.lockedOut);
    await loginPage.assertErrorMessage("Sorry, this user has been locked out");
  });

  test("error banner can be dismissed", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.login({ username: "", password: "" });
    await loginPage.assertErrorMessage("Epic sadface");
    await loginPage.closeError();
    await loginPage.assertNoError();
  });
});
