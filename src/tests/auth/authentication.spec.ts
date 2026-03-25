import { test, expect } from "../../utils/fixtures";
import usersData from "../../fixtures/users.json";
import { ENV } from "../../config/env";

test.describe("Authentication", () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.navigate();
  });

  test.describe("successful login", () => {
    test("standard_user logs in and lands on inventory page", async ({
      loginPage,
      inventoryPage,
    }) => {
      await loginPage.loginSuccessfully(ENV.users.standard);
      await expect(loginPage.page).toHaveURL(/inventory/);
      await inventoryPage.assertOnInventoryPage();
    });
  });

  test.describe("invalid credentials", () => {
    for (const scenario of usersData.invalidCredentials) {
      test(`login failure — ${scenario.label}`, async ({ loginPage }) => {
        await loginPage.login({
          username: scenario.username,
          password: scenario.password,
        });
        await loginPage.assertErrorMessage(scenario.expectedError);
        await loginPage.assertOnLoginPage();
      });
    }

    test("login fails with empty username — shows specific error", async ({
      loginPage,
    }) => {
      await loginPage.login({ username: "", password: "secret_sauce" });
      await loginPage.assertErrorMessage("Username is required");
    });

    test("login fails with empty password — shows specific error", async ({
      loginPage,
    }) => {
      await loginPage.login({ username: "standard_user", password: "" });
      await loginPage.assertErrorMessage("Password is required");
    });

    test("login fails with SQL injection attempt", async ({ loginPage }) => {
      await loginPage.login({
        username: "' OR '1'='1",
        password: "secret_sauce",
      });
      await loginPage.assertErrorMessage(
        "Username and password do not match any user",
      );
    });
  });

  test.describe("locked out user", () => {
    test("locked_out_user sees locked out error", async ({ loginPage }) => {
      await loginPage.login(ENV.users.lockedOut);
      await loginPage.assertErrorMessage(
        "Sorry, this user has been locked out",
      );
    });
  });

  test.describe("session and logout", () => {
    test("user stays logged in after page refresh", async ({
      loginPage,
      inventoryPage,
    }) => {
      await loginPage.loginSuccessfully(ENV.users.standard);
      await loginPage.page.reload();
      await inventoryPage.assertOnInventoryPage();
    });

    test("user can logout and is redirected to login page", async ({
      loginPage,
      inventoryPage,
    }) => {
      await loginPage.loginSuccessfully(ENV.users.standard);
      await inventoryPage.logout();
      await loginPage.assertOnLoginPage();
    });

    test("logged out user cannot access inventory directly", async ({
      loginPage,
      inventoryPage,
    }) => {
      await loginPage.loginSuccessfully(ENV.users.standard);
      await inventoryPage.logout();
      await loginPage.page.goto("/inventory.html");
      await loginPage.assertOnLoginPage();
    });

    test("error banner can be dismissed", async ({ loginPage }) => {
      await loginPage.login({ username: "", password: "" });
      await loginPage.assertErrorMessage("Username is required");
      await loginPage.closeError();
      await loginPage.assertNoError();
    });
  });
});
