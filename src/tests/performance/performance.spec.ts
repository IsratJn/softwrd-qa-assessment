import { test, expect } from "../../utils/fixtures";
import { ENV } from "../../config/env";
import checkoutData from "../../fixtures/checkout.json";
import productsData from "../../fixtures/products.json";

test.describe("Performance Glitch User", () => {
  test("login completes successfully despite delay", async ({
    loginPage,
    inventoryPage,
  }) => {
    await loginPage.navigate();
    await loginPage.login(ENV.users.performanceGlitch);
    // performance_glitch_user has a 5-8s delay — Playwright's built-in retry-based assertions handle this without hardcoded sleeps
    await inventoryPage.assertOnInventoryPage();
  });

  test("inventory page loads fully after slow login", async ({
    loginPage,
    inventoryPage,
  }) => {
    await loginPage.navigate();
    await loginPage.login(ENV.users.performanceGlitch);
    await inventoryPage.assertOnInventoryPage();
    await inventoryPage.assertProductCount(productsData.expectedProductCount);
  });
});

test.describe("Error User", () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.navigate();
    await loginPage.loginSuccessfully(ENV.users.error);
  });

  test.describe("add to cart errors", () => {
    for (const product of productsData.errorUserBrokenProducts) {
      test(`${product} — add to cart fails`, async ({ inventoryPage }) => {
        const before = await inventoryPage.getCartCount();
        await inventoryPage.addToCartByName(product);
        const after = await inventoryPage.getCartCount();
        expect(after).toBe(before);
      });
    }
  });

  test.describe("remove from cart errors", () => {
    for (const product of productsData.errorUserWorkingProducts) {
      test(`remove button on inventory page does not work for ${product}`, async ({
        inventoryPage,
        cartPage,
      }) => {
        await inventoryPage.addToCartByName(product);
        expect(await inventoryPage.getCartCount()).toBe(1);

        await inventoryPage.removeFromCartByName(product);

        await inventoryPage.goToCart();
        await cartPage.assertItemInCart(product);
      });
    }
  });

  test.describe("sorting error", () => {
    test("sorting triggers error dialog and product order stays unchanged", async ({
      inventoryPage,
      loginPage,
    }) => {
      const beforeSort = await inventoryPage.getProductNames();

      let dialogMessage = "";
      loginPage.page.once("dialog", async (dialog) => {
        dialogMessage = dialog.message();
        await dialog.accept();
      });

      await inventoryPage.sortBy("za");
      expect(dialogMessage).toContain("Sorting is broken");

      const afterSort = await inventoryPage.getProductNames();
      expect(afterSort).toEqual(beforeSort);
    });
  });

  test.describe("checkout errors", () => {
    test.beforeEach(async ({ inventoryPage, cartPage }) => {
      await inventoryPage.addToCartByName(
        productsData.expectedProducts[0].name,
      );
      await inventoryPage.goToCart();
      await cartPage.proceedToCheckout();
    });

    test("last name field cannot be typed into", async ({ checkoutPage }) => {
      await checkoutPage.fillField(checkoutPage.lastNameInput, "Jahan");
      await expect(checkoutPage.lastNameInput).toHaveValue("");
    });

    test("checkout continues without last name and shows no validation error", async ({
      checkoutPage,
    }) => {
      await checkoutPage.fillField(checkoutPage.firstNameInput, "Israt");
      await checkoutPage.fillField(checkoutPage.postalCodeInput, "1207");
      await checkoutPage.continue();
      await expect(checkoutPage.errorMessage).not.toBeVisible();
      await checkoutPage.assertOnStepTwo();
    });

    test("finish button does not complete order", async ({
      checkoutPage,
      loginPage,
    }) => {
      await checkoutPage.fillAndContinue(checkoutData.validCheckout);
      await checkoutPage.assertOnStepTwo();
      await checkoutPage.clickFinish();
      await expect(loginPage.page).toHaveURL(/checkout-step-two/);
    });
  });
});
