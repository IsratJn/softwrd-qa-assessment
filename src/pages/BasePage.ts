import { Page, Locator, expect } from "@playwright/test";

export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  async goto(path: string = ""): Promise<void> {
    await this.page.goto(path);
  }

  async waitForVisible(locator: Locator, timeout?: number): Promise<void> {
    await locator.waitFor({ state: "visible", timeout });
  }

  async waitForHidden(locator: Locator, timeout?: number): Promise<void> {
    await locator.waitFor({ state: "hidden", timeout });
  }

  async fillField(locator: Locator, value: string): Promise<void> {
    await locator.clear();
    await locator.fill(value);
  }

  async assertUrlContains(segment: string): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(segment));
  }
}
