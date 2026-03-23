import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "./BasePage";

export class ConfirmationPage extends BasePage {
  readonly confirmationHeader: Locator;
  readonly confirmationText: Locator;
  readonly backHomeButton: Locator;
  readonly ponyExpressImage: Locator;
  readonly cartBadge: Locator;

  constructor(page: Page) {
    super(page);
    this.confirmationHeader = page.locator('[data-test="complete-header"]');
    this.confirmationText = page.locator('[data-test="complete-text"]');
    this.backHomeButton = page.locator('[data-test="back-to-products"]');
    this.ponyExpressImage = page.locator(".pony_express");
    this.cartBadge = page.locator(".shopping_cart_badge");
  }

  async assertOnConfirmationPage(): Promise<void> {
    await this.assertUrlContains("checkout-complete");
    await expect(this.confirmationHeader).toBeVisible();
  }

  async assertConfirmationPage(): Promise<void> {
    await this.assertOnConfirmationPage();
    await expect(this.confirmationHeader).toHaveText(
      "Thank you for your order!",
    );
    await expect(this.confirmationText).toContainText(
      "Your order has been dispatched",
    );
    await expect(this.ponyExpressImage).toBeVisible();
  }

  async assertCartIsReset(): Promise<void> {
    await expect(this.cartBadge).not.toBeVisible();
  }

  async backToProducts(): Promise<void> {
    await this.backHomeButton.click();
    await this.assertUrlContains("inventory");
  }
}
