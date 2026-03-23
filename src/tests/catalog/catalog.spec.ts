import { test, expect } from "@playwright/test";
import { LoginPage } from "../../pages/LoginPage";
import { InventoryPage } from "../../pages/InventoryPage";
import productsData from "../../fixtures/products.json";
import { ENV } from "../../config/env";

test.describe("Product Catalog", () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate();
    await loginPage.loginSuccessfully(ENV.users.standard);
  });

  test("should display correct number of products", async ({ page }) => {
    const inventoryPage = new InventoryPage(page);
    await inventoryPage.assertProductCount(productsData.expectedProductCount);
  });

  test("all expected product names should be visible", async ({ page }) => {
    const inventoryPage = new InventoryPage(page);
    const names = await inventoryPage.getProductNames();
    for (const product of productsData.expectedProducts) {
      expect(names).toContain(product.name);
    }
  });

  test("all product prices should be positive numbers", async ({ page }) => {
    const inventoryPage = new InventoryPage(page);
    const prices = await inventoryPage.getProductPrices();
    for (const price of prices) {
      expect(price).toBeGreaterThan(0);
    }
  });

  test("sort by Name A→Z", async ({ page }) => {
    const inventoryPage = new InventoryPage(page);
    await inventoryPage.sortBy("az");
    await inventoryPage.assertSortedByNameAscending();
  });

  test("sort by Name Z→A", async ({ page }) => {
    const inventoryPage = new InventoryPage(page);
    await inventoryPage.sortBy("za");
    await inventoryPage.assertSortedByNameDescending();
  });

  test("sort by Price Low→High", async ({ page }) => {
    const inventoryPage = new InventoryPage(page);
    await inventoryPage.sortBy("lohi");
    await inventoryPage.assertSortedByPriceAscending();
  });

  test("sort by Price High→Low", async ({ page }) => {
    const inventoryPage = new InventoryPage(page);
    await inventoryPage.sortBy("hilo");
    await inventoryPage.assertSortedByPriceDescending();
  });

  test("problem_user should have mismatched product images", async ({
    page,
  }) => {
    const loginPage = new LoginPage(page);
    const inventoryPage = new InventoryPage(page);
    await loginPage.navigate();
    await loginPage.loginSuccessfully(ENV.users.problem);
    const srcs = await inventoryPage.getProductImageSrcs();
    const uniqueSrcs = new Set(srcs);
    expect(uniqueSrcs.size).toBe(1);
  });
});
