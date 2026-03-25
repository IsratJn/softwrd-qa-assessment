import { test } from "../../utils/fixtures";
import { ENV } from "../../config/env";
import productsData from "../../fixtures/products.json";

test.describe("Shopping Cart", () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.navigate();
    await loginPage.loginSuccessfully(ENV.users.standard);
  });

  test.describe("adding items", () => {
    test("add single item and verify cart badge updates", async ({
      inventoryPage,
      cartPage,
    }) => {
      await inventoryPage.addToCartByName(
        productsData.expectedProducts[0].name,
      );
      await inventoryPage.assertCartBadge(1);
      await inventoryPage.goToCart();
      await cartPage.assertItemInCart(productsData.expectedProducts[0].name);
    });

    test("add multiple items and verify all appear in cart", async ({
      inventoryPage,
      cartPage,
    }) => {
      const items = productsData.expectedProducts
        .slice(0, 3)
        .map((p) => p.name);
      await inventoryPage.addMultipleToCart(items);
      await inventoryPage.assertCartBadge(3);
      await inventoryPage.goToCart();
      await cartPage.assertCartContainsItems(items);
    });

    test("adding all products updates badge to total count", async ({
      inventoryPage,
    }) => {
      const allItems = productsData.expectedProducts.map((p) => p.name);
      await inventoryPage.addMultipleToCart(allItems);
      await inventoryPage.assertCartBadge(productsData.expectedProductCount);
    });
  });

  test.describe("removing items", () => {
    test("remove item from cart and verify cart is empty", async ({
      inventoryPage,
      cartPage,
    }) => {
      await inventoryPage.addToCartByName(
        productsData.expectedProducts[0].name,
      );
      await inventoryPage.goToCart();
      await cartPage.removeItemByName(productsData.expectedProducts[0].name);
      await cartPage.assertCartIsEmpty();
    });

    test("badge updates correctly after item removal", async ({
      inventoryPage,
      cartPage,
    }) => {
      const items = productsData.expectedProducts
        .slice(0, 2)
        .map((p) => p.name);
      await inventoryPage.addMultipleToCart(items);
      await inventoryPage.goToCart();
      await cartPage.removeItemByName(items[0]);
      await cartPage.assertBadgeCount(1);
      await cartPage.assertItemNotInCart(items[0]);
      await cartPage.assertItemInCart(items[1]);
    });
  });

  test.describe("cart state", () => {
    test("cart persists across page navigation", async ({
      inventoryPage,
      cartPage,
    }) => {
      await inventoryPage.addToCartByName(
        productsData.expectedProducts[0].name,
      );
      await inventoryPage.goToCart();
      await cartPage.continueShopping();
      await inventoryPage.goToCart();
      await cartPage.assertItemInCart(productsData.expectedProducts[0].name);
    });

    test("empty cart shows no items and no badge", async ({
      inventoryPage,
      cartPage,
    }) => {
      await inventoryPage.goToCart();
      await cartPage.assertCartIsEmpty();
    });
  });
});
