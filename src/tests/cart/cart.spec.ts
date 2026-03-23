import { test } from "@playwright/test";
import { LoginPage } from "../../pages/LoginPage";
import { InventoryPage } from "../../pages/InventoryPage";
import { CartPage } from "../../pages/CartPage";
import { ENV } from "../../config/env";
import productsData from "../../fixtures/products.json";

test.describe("Shopping Cart", () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate();
    await loginPage.loginSuccessfully(ENV.users.standard);
  });

  test.describe("adding items", () => {
    test("add single item and verify cart badge updates", async ({ page }) => {
      const inventoryPage = new InventoryPage(page);
      const cartPage = new CartPage(page);

      await inventoryPage.addToCartByName(
        productsData.expectedProducts[0].name,
      );
      await inventoryPage.assertCartBadge(1);
      await inventoryPage.goToCart();
      await cartPage.assertItemInCart(productsData.expectedProducts[0].name);
    });

    test("add multiple items and verify all appear in cart", async ({
      page,
    }) => {
      const inventoryPage = new InventoryPage(page);
      const cartPage = new CartPage(page);

      const items = productsData.expectedProducts
        .slice(0, 3)
        .map((p) => p.name);
      await inventoryPage.addMultipleToCart(items);
      await inventoryPage.assertCartBadge(3);
      await inventoryPage.goToCart();
      await cartPage.assertCartContainsItems(items);
    });

    test("adding all products updates badge to total count", async ({
      page,
    }) => {
      const inventoryPage = new InventoryPage(page);

      const allItems = productsData.expectedProducts.map((p) => p.name);
      await inventoryPage.addMultipleToCart(allItems);
      await inventoryPage.assertCartBadge(productsData.expectedProductCount);
    });
  });

  test.describe("removing items", () => {
    test("remove item from cart and verify cart is empty", async ({ page }) => {
      const inventoryPage = new InventoryPage(page);
      const cartPage = new CartPage(page);

      await inventoryPage.addToCartByName(
        productsData.expectedProducts[0].name,
      );
      await inventoryPage.goToCart();
      await cartPage.removeItemByName(productsData.expectedProducts[0].name);
      await cartPage.assertCartIsEmpty();
    });

    test("badge updates correctly after item removal", async ({ page }) => {
      const inventoryPage = new InventoryPage(page);
      const cartPage = new CartPage(page);

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
    test("cart persists across page navigation", async ({ page }) => {
      const inventoryPage = new InventoryPage(page);
      const cartPage = new CartPage(page);

      await inventoryPage.addToCartByName(
        productsData.expectedProducts[0].name,
      );
      await inventoryPage.goToCart();
      await cartPage.continueShopping();
      await inventoryPage.goToCart();
      await cartPage.assertItemInCart(productsData.expectedProducts[0].name);
    });

    test("empty cart shows no items and no badge", async ({ page }) => {
      const inventoryPage = new InventoryPage(page);
      const cartPage = new CartPage(page);

      await inventoryPage.goToCart();
      await cartPage.assertCartIsEmpty();
    });
  });
});
