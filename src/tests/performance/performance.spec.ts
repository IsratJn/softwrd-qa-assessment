import { test, expect } from "@playwright/test";
import { LoginPage } from "../../pages/LoginPage";
import { InventoryPage } from "../../pages/InventoryPage";
import { CartPage } from "../../pages/CartPage";
import { CheckoutPage } from "../../pages/CheckoutPage";
import { ENV } from "../../config/env";
import checkoutData from "../../fixtures/checkout.json";
import productsData from "../../fixtures/products.json";

test.describe("Performance Glitch User", () => {
  test("login completes successfully despite delay", async ({ page }) => {
    const loginPage = new LoginPage(page);
    const inventoryPage = new InventoryPage(page);

    await loginPage.navigate();
    await loginPage.login(ENV.users.performanceGlitch);

    // performance_glitch_user has a 5-8s delay — Playwright's built-in retry-based assertions handle this without hardcoded sleeps

    await inventoryPage.assertOnInventoryPage();
  });

  test("inventory page loads fully after slow login", async ({ page }) => {
    const loginPage = new LoginPage(page);
    const inventoryPage = new InventoryPage(page);

    await loginPage.navigate();
    await loginPage.login(ENV.users.performanceGlitch);
    await inventoryPage.assertOnInventoryPage();
    await inventoryPage.assertProductCount(productsData.expectedProductCount);
  });
});

test.describe("Error User", () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate();
    await loginPage.loginSuccessfully(ENV.users.error);
  });

  test.describe("add to cart errors", () => {
    for (const product of productsData.errorUserBrokenProducts) {
      test(`${product} — add to cart fails silently`, async ({ page }) => {
        const inventoryPage = new InventoryPage(page);
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
        page,
      }) => {
        const inventoryPage = new InventoryPage(page);
        const cartPage = new CartPage(page);

        await inventoryPage.addToCartByName(product);
        expect(await inventoryPage.getCartCount()).toBe(1);

        await inventoryPage.removeFromCartByName(product);

        // verify item still in cart — proves remove failed
        await inventoryPage.goToCart();
        await cartPage.assertItemInCart(product);
      });
    }
  });

  test.describe("sorting error", () => {
    test("sorting triggers error dialog and product order stays unchanged", async ({
      page,
    }) => {
      const inventoryPage = new InventoryPage(page);

      const beforeSort = await inventoryPage.getProductNames();

      let dialogMessage = "";
      page.once("dialog", async (dialog) => {
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
    test.beforeEach(async ({ page }) => {
      const inventoryPage = new InventoryPage(page);
      const cartPage = new CartPage(page);
      await inventoryPage.addToCartByName(
        productsData.expectedProducts[0].name,
      );
      await inventoryPage.goToCart();
      await cartPage.proceedToCheckout();
    });

    test("last name field cannot be typed into", async ({ page }) => {
      const checkoutPage = new CheckoutPage(page);
      await checkoutPage.fillField(checkoutPage.lastNameInput, "Jahan");
      await expect(checkoutPage.lastNameInput).toHaveValue("");
    });

    test("checkout continues without last name and shows no validation error", async ({
      page,
    }) => {
      const checkoutPage = new CheckoutPage(page);
      await checkoutPage.fillField(checkoutPage.firstNameInput, "Israt");
      await checkoutPage.fillField(checkoutPage.postalCodeInput, "1207");
      await checkoutPage.continue();
      // no error shown — proceeds silently despite missing last name
      await expect(checkoutPage.errorMessage).not.toBeVisible();
      await checkoutPage.assertOnStepTwo();
    });

    test("finish button does not complete order", async ({ page }) => {
      const checkoutPage = new CheckoutPage(page);
      await checkoutPage.fillAndContinue(checkoutData.validCheckout);
      await checkoutPage.assertOnStepTwo();
      await checkoutPage.clickFinish();
      await expect(page).toHaveURL(/checkout-step-two/);
    });
  });
});
