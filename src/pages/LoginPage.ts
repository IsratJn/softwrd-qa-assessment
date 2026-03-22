import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "./BasePage";

export interface UserCredentials {
  username: string;
  password: string;
}

export class LoginPage extends BasePage {
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly errorMessage: Locator;
  readonly errorCloseButton: Locator;

  constructor(page: Page) {
    super(page);
    this.usernameInput = page.locator('[data-test="username"]');
    this.passwordInput = page.locator('[data-test="password"]');
    this.loginButton = page.locator('[data-test="login-button"]');
    this.errorMessage = page.locator('[data-test="error"]');
    this.errorCloseButton = page.locator('[data-test="error"] button');
  }

  async navigate(): Promise<void> {
    await this.goto("/");
    await this.waitForVisible(this.loginButton);
  }

  async login(credentials: UserCredentials): Promise<void> {
    await this.fillField(this.usernameInput, credentials.username);
    await this.fillField(this.passwordInput, credentials.password);
    await this.loginButton.click();
  }

  async loginSuccessfully(credentials: UserCredentials): Promise<void> {
    await this.login(credentials);
    await this.assertUrlContains("inventory");
  }

  async closeError(): Promise<void> {
    await this.errorCloseButton.click();
    await this.waitForHidden(this.errorMessage);
  }

  async assertErrorMessage(expectedText: string): Promise<void> {
    await expect(this.errorMessage).toBeVisible();
    await expect(this.errorMessage).toContainText(expectedText);
  }

  async assertOnLoginPage(): Promise<void> {
    await expect(this.loginButton).toBeVisible();
  }

  async assertNoError(): Promise<void> {
    await expect(this.errorMessage).not.toBeVisible();
  }
}
