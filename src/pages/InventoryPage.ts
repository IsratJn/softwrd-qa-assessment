import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "./BasePage";

export type SortOption = "az" | "za" | "lohi" | "hilo";

export class InventoryPage extends BasePage {
  readonly pageTitle: Locator;
  readonly productList: Locator;
  readonly productItems: Locator;
  readonly sortDropdown: Locator;
  readonly cartBadge: Locator;
  readonly cartIcon: Locator;
  readonly burgerMenu: Locator;
  readonly logoutLink: Locator;

  constructor(page: Page) {
    super(page);
    this.pageTitle = page.locator(".title");
    this.productList = page.locator(".inventory_list");
    this.productItems = page.locator(".inventory_item");
    this.sortDropdown = page.locator('[data-test="product-sort-container"]');
    this.cartBadge = page.locator(".shopping_cart_badge");
    this.cartIcon = page.locator(".shopping_cart_link");
    this.burgerMenu = page.locator("#react-burger-menu-btn");
    this.logoutLink = page.locator("#logout_sidebar_link");
  }

  async navigate(): Promise<void> {
    await this.goto("/inventory.html");
    await this.waitForVisible(this.productList);
  }

  async logout(): Promise<void> {
    await this.burgerMenu.click();
    await this.waitForVisible(this.logoutLink);
    await this.logoutLink.click();
  }

  async goToCart(): Promise<void> {
    await this.cartIcon.click();
  }

  async addToCartByName(productName: string): Promise<void> {
    const item = this.productItems.filter({ hasText: productName });
    await item.locator("button").click();
  }

  async addMultipleToCart(productNames: string[]): Promise<void> {
    for (const name of productNames) {
      await this.addToCartByName(name);
    }
  }

  async sortBy(option: SortOption): Promise<void> {
    await this.sortDropdown.selectOption(option);
  }

  async getProductNames(): Promise<string[]> {
    return this.productItems.locator(".inventory_item_name").allTextContents();
  }

  async getProductPrices(): Promise<number[]> {
    const priceTexts = await this.productItems
      .locator(".inventory_item_price")
      .allTextContents();
    return priceTexts.map((p) => parseFloat(p.replace("$", "")));
  }

  async getProductImageSrcs(): Promise<string[]> {
    return this.productItems
      .locator(".inventory_item_img img")
      .evaluateAll((imgs) => imgs.map((img) => (img as HTMLImageElement).src));
  }

  async getCartCount(): Promise<number> {
    const isVisible = await this.cartBadge.isVisible();
    if (!isVisible) return 0;
    return parseInt((await this.cartBadge.textContent()) ?? "0", 10);
  }

  async assertOnInventoryPage(): Promise<void> {
    await expect(this.pageTitle).toHaveText("Products");
    await this.assertUrlContains("inventory");
  }

  async assertProductCount(expected: number): Promise<void> {
    await expect(this.productItems).toHaveCount(expected);
  }

  async assertCartBadge(expected: number): Promise<void> {
    if (expected === 0) {
      await expect(this.cartBadge).not.toBeVisible();
    } else {
      await expect(this.cartBadge).toHaveText(String(expected));
    }
  }

  async assertSortedByNameAscending(): Promise<void> {
    const names = await this.getProductNames();
    const sorted = [...names].sort((a, b) => a.localeCompare(b));
    expect(names).toEqual(sorted);
  }

  async assertSortedByNameDescending(): Promise<void> {
    const names = await this.getProductNames();
    const sorted = [...names].sort((a, b) => b.localeCompare(a));
    expect(names).toEqual(sorted);
  }

  async assertSortedByPriceAscending(): Promise<void> {
    const prices = await this.getProductPrices();
    const sorted = [...prices].sort((a, b) => a - b);
    expect(prices).toEqual(sorted);
  }

  async assertSortedByPriceDescending(): Promise<void> {
    const prices = await this.getProductPrices();
    const sorted = [...prices].sort((a, b) => b - a);
    expect(prices).toEqual(sorted);
  }
}
