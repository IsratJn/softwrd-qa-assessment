import { test, expect } from "../../utils/fixtures";
import productsData from "../../fixtures/products.json";
import { ENV } from "../../config/env";

test.describe("Product Catalog", () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.navigate();
    await loginPage.loginSuccessfully(ENV.users.standard);
  });

  test.describe("product listing", () => {
    test("should display correct number of products", async ({
      inventoryPage,
    }) => {
      await inventoryPage.assertProductCount(productsData.expectedProductCount);
    });

    test("all expected product names should be visible", async ({
      inventoryPage,
    }) => {
      const names = await inventoryPage.getProductNames();
      expect(names).toEqual(
        expect.arrayContaining(
          productsData.expectedProducts.map((p) => p.name),
        ),
      );
    });

    test("all product prices should match expected values", async ({
      inventoryPage,
    }) => {
      const prices = await inventoryPage.getProductPrices();
      const expectedPrices = productsData.expectedProducts.map((p) => p.price);
      expect(prices.sort()).toEqual(expectedPrices.sort());
    });
  });

  test.describe("sorting", () => {
    test("sort by Name A→Z", async ({ inventoryPage }) => {
      await inventoryPage.sortBy("az");
      await inventoryPage.assertSortedByNameAscending();
    });

    test("sort by Name Z→A", async ({ inventoryPage }) => {
      await inventoryPage.sortBy("za");
      await inventoryPage.assertSortedByNameDescending();
    });

    test("sort by Price Low→High", async ({ inventoryPage }) => {
      await inventoryPage.sortBy("lohi");
      await inventoryPage.assertSortedByPriceAscending();
    });

    test("sort by Price High→Low", async ({ inventoryPage }) => {
      await inventoryPage.sortBy("hilo");
      await inventoryPage.assertSortedByPriceDescending();
    });
  });

  test.describe("visual regression", () => {
    test("problem_user should have mismatched product images", async ({
      loginPage,
      inventoryPage,
    }) => {
      await loginPage.navigate();
      await loginPage.loginSuccessfully(ENV.users.problem);
      const srcs = await inventoryPage.getProductImageSrcs();
      const uniqueSrcs = new Set(srcs);
      expect(uniqueSrcs.size).toBe(1);
    });
  });
});
