import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "./BasePage";

export interface CheckoutInfo {
  firstName: string;
  lastName: string;
  postalCode: string;
}

export class CheckoutPage extends BasePage {
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly postalCodeInput: Locator;
  readonly continueButton: Locator;
  readonly cancelButton: Locator;
  readonly errorMessage: Locator;
  readonly summarySubtotal: Locator;
  readonly summaryTax: Locator;
  readonly summaryTotal: Locator;
  readonly summaryItems: Locator;
  readonly finishButton: Locator;

  constructor(page: Page) {
    super(page);
    this.firstNameInput = page.locator('[data-test="firstName"]');
    this.lastNameInput = page.locator('[data-test="lastName"]');
    this.postalCodeInput = page.locator('[data-test="postalCode"]');
    this.continueButton = page.locator('[data-test="continue"]');
    this.cancelButton = page.locator('[data-test="cancel"]');
    this.errorMessage = page.locator('[data-test="error"]');
    this.summarySubtotal = page.locator(".summary_subtotal_label");
    this.summaryTax = page.locator(".summary_tax_label");
    this.summaryTotal = page.locator(".summary_total_label");
    this.summaryItems = page.locator(".cart_item");
    this.finishButton = page.locator('[data-test="finish"]');
  }

  async navigate(): Promise<void> {
    await this.goto("/checkout-step-one.html");
    await this.waitForVisible(this.firstNameInput);
  }

  async fillCheckoutInfo(info: CheckoutInfo): Promise<void> {
    await this.fillField(this.firstNameInput, info.firstName);
    await this.fillField(this.lastNameInput, info.lastName);
    await this.fillField(this.postalCodeInput, info.postalCode);
  }

  async continue(): Promise<void> {
    await this.continueButton.click();
  }

  async fillAndContinue(info: CheckoutInfo): Promise<void> {
    await this.fillCheckoutInfo(info);
    await this.continue();
  }

  async finish(): Promise<void> {
    await this.finishButton.click();
    await this.assertUrlContains("checkout-complete");
  }

  async getSubtotal(): Promise<number> {
    const text = (await this.summarySubtotal.textContent()) ?? "";
    return parseFloat(text.replace(/[^0-9.]/g, ""));
  }

  async getTax(): Promise<number> {
    const text = (await this.summaryTax.textContent()) ?? "";
    return parseFloat(text.replace(/[^0-9.]/g, ""));
  }

  async getTotal(): Promise<number> {
    const text = (await this.summaryTotal.textContent()) ?? "";
    return parseFloat(text.replace(/[^0-9.]/g, ""));
  }

  async assertOnStepOne(): Promise<void> {
    await this.assertUrlContains("checkout-step-one");
  }

  async assertOnStepTwo(): Promise<void> {
    await this.assertUrlContains("checkout-step-two");
  }

  async assertErrorMessage(expected: string): Promise<void> {
    await expect(this.errorMessage).toBeVisible();
    await expect(this.errorMessage).toContainText(expected);
  }

  async assertTotalIsCorrect(): Promise<void> {
    const subtotal = await this.getSubtotal();
    const tax = await this.getTax();
    const total = await this.getTotal();
    const expected = parseFloat((subtotal + tax).toFixed(2));
    expect(total).toBeCloseTo(expected, 2);
  }

  async assertItemsInSummary(expectedNames: string[]): Promise<void> {
    for (const name of expectedNames) {
      await expect(this.summaryItems.filter({ hasText: name })).toHaveCount(1);
    }
  }
}
