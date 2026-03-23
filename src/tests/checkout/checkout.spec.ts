import { test, expect } from "@playwright/test";
import { LoginPage } from "../../pages/LoginPage";
import { InventoryPage } from "../../pages/InventoryPage";
import { CartPage } from "../../pages/CartPage";
import { CheckoutPage } from "../../pages/CheckoutPage";
import { ConfirmationPage } from "../../pages/ConfirmationPage";
import { ENV } from "../../config/env";
import checkoutData from "../../fixtures/checkout.json";
import productsData from "../../fixtures/products.json";

async function proceedToCheckout(
  page: any,
  itemNames: string[],
): Promise<void> {
  const loginPage = new LoginPage(page);
  const inventoryPage = new InventoryPage(page);
  const cartPage = new CartPage(page);

  await loginPage.navigate();
  await loginPage.loginSuccessfully(ENV.users.standard);
  await inventoryPage.addMultipleToCart(itemNames);
  await inventoryPage.goToCart();
  await cartPage.proceedToCheckout();
}

test.describe("Checkout Flow", () => {
  test.describe("valid checkout", () => {
    test("complete full purchase with single item", async ({ page }) => {
      await proceedToCheckout(page, [productsData.expectedProducts[0].name]);
      const checkoutPage = new CheckoutPage(page);
      const confirmationPage = new ConfirmationPage(page);

      await checkoutPage.fillAndContinue(checkoutData.validCheckout);
      await checkoutPage.assertOnStepTwo();
      await checkoutPage.finish();
      await confirmationPage.assertConfirmationPage();
      await confirmationPage.assertCartIsReset();
    });

    test("complete full purchase with multiple items", async ({ page }) => {
      const items = productsData.expectedProducts
        .slice(0, 3)
        .map((p) => p.name);
      await proceedToCheckout(page, items);
      const checkoutPage = new CheckoutPage(page);
      const confirmationPage = new ConfirmationPage(page);

      await checkoutPage.fillAndContinue(checkoutData.validCheckout);
      await checkoutPage.assertOnStepTwo();
      await checkoutPage.finish();
      await confirmationPage.assertConfirmationPage();
    });

    test("can navigate back to products after order", async ({ page }) => {
      await proceedToCheckout(page, [productsData.expectedProducts[0].name]);
      const checkoutPage = new CheckoutPage(page);
      const confirmationPage = new ConfirmationPage(page);

      await checkoutPage.fillAndContinue(checkoutData.validCheckout);
      await checkoutPage.finish();
      await confirmationPage.backToProducts();
      await expect(page).toHaveURL(/inventory/);
    });
  });

  test.describe("missing required fields", () => {
    test.beforeEach(async ({ page }) => {
      await proceedToCheckout(page, [productsData.expectedProducts[0].name]);
    });

    for (const scenario of checkoutData.invalidCheckout) {
      test(`checkout blocked — ${scenario.label}`, async ({ page }) => {
        const checkoutPage = new CheckoutPage(page);

        await checkoutPage.fillAndContinue({
          firstName: scenario.firstName,
          lastName: scenario.lastName,
          postalCode: scenario.postalCode,
        });
        await checkoutPage.assertErrorMessage(scenario.expectedError);
        await checkoutPage.assertOnStepOne();
      });
    }
  });

  test.describe("order summary", () => {
    test.beforeEach(async ({ page }) => {
      await proceedToCheckout(page, [productsData.expectedProducts[0].name]);
      const checkoutPage = new CheckoutPage(page);
      await checkoutPage.fillAndContinue(checkoutData.validCheckout);
    });

    test("order summary shows correct item", async ({ page }) => {
      const checkoutPage = new CheckoutPage(page);
      await checkoutPage.assertItemsInSummary([
        productsData.expectedProducts[0].name,
      ]);
    });

    test("subtotal matches expected product price", async ({ page }) => {
      const checkoutPage = new CheckoutPage(page);
      const subtotal = await checkoutPage.getSubtotal();
      expect(subtotal).toBeCloseTo(productsData.expectedProducts[0].price, 2);
    });

    test("order total is mathematically correct", async ({ page }) => {
      const checkoutPage = new CheckoutPage(page);
      await checkoutPage.assertTotalIsCorrect();
    });
  });

  test("multi-item subtotal aggregates correctly", async ({ page }) => {
    const items = productsData.expectedProducts.slice(0, 3);
    await proceedToCheckout(
      page,
      items.map((p) => p.name),
    );
    const checkoutPage = new CheckoutPage(page);

    await checkoutPage.fillAndContinue(checkoutData.validCheckout);
    const expectedSubtotal = items.reduce((sum, p) => sum + p.price, 0);
    const actualSubtotal = await checkoutPage.getSubtotal();
    expect(actualSubtotal).toBeCloseTo(expectedSubtotal, 2);
  });
});
