import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "./BasePage";

export class CartPage extends BasePage {
  readonly pageTitle: Locator;
  readonly cartItems: Locator;
  readonly checkoutButton: Locator;
  readonly continueShoppingButton: Locator;
  readonly cartBadge: Locator;

  constructor(page: Page) {
    super(page);
    this.pageTitle = page.locator(".title");
    this.cartItems = page.locator(".cart_item");
    this.checkoutButton = page.locator('[data-test="checkout"]');
    this.continueShoppingButton = page.locator(
      '[data-test="continue-shopping"]',
    );
    this.cartBadge = page.locator(".shopping_cart_badge");
  }

  async navigate(): Promise<void> {
    await this.goto("/cart.html");
    await this.waitForVisible(this.pageTitle);
  }

  async proceedToCheckout(): Promise<void> {
    await this.checkoutButton.click();
    await this.assertUrlContains("checkout-step-one");
  }

  async continueShopping(): Promise<void> {
    await this.continueShoppingButton.click();
    await this.assertUrlContains("inventory");
  }

  async removeItemByName(productName: string): Promise<void> {
    await this.cartItems
      .filter({ hasText: productName })
      .locator('[data-test^="remove"]')
      .click();
  }

  async getCartItemCount(): Promise<number> {
    return this.cartItems.count();
  }

  async assertOnCartPage(): Promise<void> {
    await expect(this.pageTitle).toHaveText("Your Cart");
    await this.assertUrlContains("cart");
  }

  async assertItemInCart(productName: string): Promise<void> {
    await expect(
      this.cartItems
        .filter({ hasText: productName })
        .locator(".inventory_item_name"),
    ).toContainText(productName);
  }

  async assertItemNotInCart(productName: string): Promise<void> {
    await expect(
      this.cartItems.locator(".inventory_item_name"),
    ).not.toContainText(productName);
  }

  async assertCartContainsItems(productNames: string[]): Promise<void> {
    for (const name of productNames) {
      await this.assertItemInCart(name);
    }
  }

  async assertCartItemCount(expected: number): Promise<void> {
    await expect(this.cartItems).toHaveCount(expected);
  }

  async assertCartIsEmpty(): Promise<void> {
    await expect(this.cartItems).toHaveCount(0);
    await expect(this.cartBadge).not.toBeVisible();
  }

  async assertBadgeCount(expected: number): Promise<void> {
    if (expected === 0) {
      await expect(this.cartBadge).not.toBeVisible();
    } else {
      await expect(this.cartBadge).toHaveText(String(expected));
    }
  }
}
