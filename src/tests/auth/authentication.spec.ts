import { test, expect } from "@playwright/test";
import { LoginPage } from "../../pages/LoginPage";
import { InventoryPage } from "../../pages/InventoryPage";
import usersData from "../../fixtures/users.json";
import { ENV } from "../../config/env";

test.describe("Authentication", () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate();
  });

  test.describe("successful login", () => {
    test("standard_user logs in and lands on inventory page", async ({
      page,
    }) => {
      const loginPage = new LoginPage(page);
      await loginPage.loginSuccessfully(ENV.users.standard);
      await expect(page).toHaveURL(/inventory/);
    });
  });

  test.describe("invalid credentials", () => {
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

    test("login fails with empty username — shows specific error", async ({
      page,
    }) => {
      const loginPage = new LoginPage(page);
      await loginPage.login({ username: "", password: "secret_sauce" });
      await loginPage.assertErrorMessage("Username is required");
    });

    test("login fails with empty password — shows specific error", async ({
      page,
    }) => {
      const loginPage = new LoginPage(page);
      await loginPage.login({ username: "standard_user", password: "" });
      await loginPage.assertErrorMessage("Password is required");
    });

    test("login fails with SQL injection attempt", async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.login({
        username: "' OR '1'='1",
        password: "secret_sauce",
      });
      await loginPage.assertErrorMessage("Username and password do not match");
    });
  });

  test.describe("locked out user", () => {
    test("locked_out_user sees locked out error", async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.login(ENV.users.lockedOut);
      await loginPage.assertErrorMessage(
        "Sorry, this user has been locked out",
      );
    });
  });

  test.describe("session and logout", () => {
    test("user stays logged in after page refresh", async ({ page }) => {
      const loginPage = new LoginPage(page);
      const inventoryPage = new InventoryPage(page);
      await loginPage.loginSuccessfully(ENV.users.standard);
      await page.reload();
      await inventoryPage.assertOnInventoryPage();
    });

    test("user can logout and is redirected to login page", async ({
      page,
    }) => {
      const loginPage = new LoginPage(page);
      const inventoryPage = new InventoryPage(page);
      await loginPage.loginSuccessfully(ENV.users.standard);
      await inventoryPage.logout();
      await loginPage.assertOnLoginPage();
    });

    test("logged out user cannot access inventory directly", async ({
      page,
    }) => {
      const loginPage = new LoginPage(page);
      const inventoryPage = new InventoryPage(page);
      await loginPage.loginSuccessfully(ENV.users.standard);
      await inventoryPage.logout();
      await page.goto("/inventory.html");
      await loginPage.assertOnLoginPage();
    });

    test("error banner can be dismissed", async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.login({ username: "", password: "" });
      await loginPage.assertErrorMessage("Epic sadface");
      await loginPage.closeError();
      await loginPage.assertNoError();
    });
  });
});
