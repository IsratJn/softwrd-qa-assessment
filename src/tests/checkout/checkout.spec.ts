import { test, expect } from "../../utils/fixtures";
import { ENV } from "../../config/env";
import checkoutData from "../../fixtures/checkout.json";
import productsData from "../../fixtures/products.json";

test.describe("Checkout Flow", () => {
  test.describe("valid checkout", () => {
    test("complete full purchase with single item", async ({
      loginPage,
      inventoryPage,
      cartPage,
      checkoutPage,
      confirmationPage,
    }) => {
      await loginPage.navigate();
      await loginPage.loginSuccessfully(ENV.users.standard);
      await inventoryPage.addMultipleToCart([
        productsData.expectedProducts[0].name,
      ]);
      await inventoryPage.goToCart();
      await cartPage.proceedToCheckout();

      await checkoutPage.fillAndContinue(checkoutData.validCheckout);
      await checkoutPage.assertOnStepTwo();
      await checkoutPage.finish();
      await confirmationPage.assertConfirmationPage();
      await confirmationPage.assertCartIsReset();
    });

    test("complete full purchase with multiple items", async ({
      loginPage,
      inventoryPage,
      cartPage,
      checkoutPage,
      confirmationPage,
    }) => {
      const items = productsData.expectedProducts
        .slice(0, 3)
        .map((p) => p.name);
      await loginPage.navigate();
      await loginPage.loginSuccessfully(ENV.users.standard);
      await inventoryPage.addMultipleToCart(items);
      await inventoryPage.goToCart();
      await cartPage.proceedToCheckout();

      await checkoutPage.fillAndContinue(checkoutData.validCheckout);
      await checkoutPage.assertOnStepTwo();
      await checkoutPage.finish();
      await confirmationPage.assertConfirmationPage();
    });

    test("can navigate back to products after order", async ({
      loginPage,
      inventoryPage,
      cartPage,
      checkoutPage,
      confirmationPage,
    }) => {
      await loginPage.navigate();
      await loginPage.loginSuccessfully(ENV.users.standard);
      await inventoryPage.addMultipleToCart([
        productsData.expectedProducts[0].name,
      ]);
      await inventoryPage.goToCart();
      await cartPage.proceedToCheckout();

      await checkoutPage.fillAndContinue(checkoutData.validCheckout);
      await checkoutPage.finish();
      await confirmationPage.backToProducts();
      await expect(loginPage.page).toHaveURL(/inventory/);
    });
  });

  test.describe("missing required fields", () => {
    test.beforeEach(async ({ loginPage, inventoryPage, cartPage }) => {
      await loginPage.navigate();
      await loginPage.loginSuccessfully(ENV.users.standard);
      await inventoryPage.addMultipleToCart([
        productsData.expectedProducts[0].name,
      ]);
      await inventoryPage.goToCart();
      await cartPage.proceedToCheckout();
    });

    for (const scenario of checkoutData.invalidCheckout) {
      test(`checkout blocked — ${scenario.label}`, async ({ checkoutPage }) => {
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
    test.beforeEach(
      async ({ loginPage, inventoryPage, cartPage, checkoutPage }) => {
        await loginPage.navigate();
        await loginPage.loginSuccessfully(ENV.users.standard);
        await inventoryPage.addMultipleToCart([
          productsData.expectedProducts[0].name,
        ]);
        await inventoryPage.goToCart();
        await cartPage.proceedToCheckout();
        await checkoutPage.fillAndContinue(checkoutData.validCheckout);
      },
    );

    test("order summary shows correct item", async ({ checkoutPage }) => {
      await checkoutPage.assertItemsInSummary([
        productsData.expectedProducts[0].name,
      ]);
    });

    test("subtotal matches expected product price", async ({
      checkoutPage,
    }) => {
      const subtotal = await checkoutPage.getSubtotal();
      expect(subtotal).toBeCloseTo(productsData.expectedProducts[0].price, 2);
    });

    test("order total is mathematically correct", async ({ checkoutPage }) => {
      await checkoutPage.assertTotalIsCorrect();
    });
  });

  test("multi-item subtotal aggregates correctly", async ({
    loginPage,
    inventoryPage,
    cartPage,
    checkoutPage,
  }) => {
    const items = productsData.expectedProducts.slice(0, 3);
    await loginPage.navigate();
    await loginPage.loginSuccessfully(ENV.users.standard);
    await inventoryPage.addMultipleToCart(items.map((p) => p.name));
    await inventoryPage.goToCart();
    await cartPage.proceedToCheckout();

    await checkoutPage.fillAndContinue(checkoutData.validCheckout);
    const expectedSubtotal = items.reduce((sum, p) => sum + p.price, 0);
    const actualSubtotal = await checkoutPage.getSubtotal();
    expect(actualSubtotal).toBeCloseTo(expectedSubtotal, 2);
  });
});
