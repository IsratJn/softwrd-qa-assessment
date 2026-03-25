# softwrd-qa-assessment

Production-grade test automation framework for [SauceDemo](https://www.saucedemo.com) built with Playwright and TypeScript.

## 1. Framework Choice & Rationale

**Stack: Playwright + TypeScript**

Playwright was chosen over Selenium and Cypress for three specific reasons relevant to this application:

- **Built-in auto-waiting** — SauceDemo has a `performance_glitch_user` that introduces 5–8 second delays. Playwright's retry-based assertions handle this natively without hardcoded sleeps, which is exactly the kind of real-world resilience a production framework needs.
- **Multi-browser support out of the box** — Chromium, Firefox, and WebKit run from a single config with no extra setup. The CI pipeline runs all three; local runs default to Chromium for speed.
- **TypeScript** — adds type safety across page objects and fixtures, catches errors at compile time rather than at runtime, and makes the codebase easier to navigate and maintain.

## 2. Architecture Overview

```
src/
├── config/
│   └── env.ts              # Single source of truth for all env-driven config
├── fixtures/
│   ├── users.json          # User credentials and invalid login scenarios
│   ├── products.json       # Expected products, prices, error user broken products
│   └── checkout.json       # Valid and invalid checkout data
├── pages/
│   ├── BasePage.ts         # Shared navigation, waits, assertions
│   ├── LoginPage.ts
│   ├── InventoryPage.ts
│   ├── CartPage.ts
│   ├── CheckoutPage.ts
│   └── ConfirmationPage.ts
└── tests/
    ├── auth/               # Authentication scenarios
    ├── catalog/            # Product listing and sorting
    ├── cart/               # Cart management
    ├── checkout/           # End-to-end purchase flow
    └── performance/        # performance_glitch_user and error_user
```

**Key design decisions:**

**Page Object Model** — every page has its own class that owns its locators and interactions. Tests never touch raw selectors. This means a selector change requires updating one file, not hunting through test code.

**Data layer separation** — no test data is hardcoded inline. Credentials live in `.env`, scenario data lives in `src/fixtures/`. The `error_user` broken products are defined in `products.json` so if the bug scope changes, only the fixture needs updating.

**Fixture-driven invalid scenarios** — invalid credential and checkout scenarios are defined in JSON and iterated with `for` loops, generating named test cases automatically. This keeps the data and the test logic cleanly separated.

**Environment-aware configuration** — `playwright.config.ts` reads from environment variables for all credentials and URLs. Locally these come from `.env`; in CI they are injected as GitHub Actions secrets. Nothing is hardcoded.

---

## 3. Setup & Run Instructions

### Prerequisites

- Node.js 18 or higher
- npm

### Installation

```bash
git clone https://github.com/IsratJn/softwrd-qa-assessment.git
cd softwrd-qa-assessment
npm install
npx playwright install --with-deps chromium
```

### Environment setup

```bash
cp .env.example .env
```

Fill in the values in `.env` — see `.env.example` for the required keys. For SauceDemo, all credentials are publicly documented in the assessment brief.

### Running tests

```bash
# Run all tests (headless, Chromium only)
npm test

# Run a specific suite
npm run test:auth
npm run test:catalog
npm run test:cart
npm run test:checkout
npm run test:performance

# Run with browser visible
npm run test:headed

# View HTML report after run
npm run report
```

---

## 4. CI/CD Pipeline

The pipeline is defined in `.github/workflows/ci.yml` and triggers on every push and pull request to `main`.

**Pipeline steps:**

1. Checkout repository
2. Setup Node.js 20
3. Install dependencies via `npm ci`
4. Install Playwright browsers (Chromium, Firefox, WebKit)
5. Run full test suite across all three browsers (`153 tests = 51 × 3 browsers`)
6. Upload HTML report as a downloadable artifact (retained 30 days)

**Credentials** are stored as GitHub Actions repository secrets — never in code.

**To view the pipeline:** go to the [Actions tab](https://github.com/IsratJn/softwrd-qa-assessment/actions) on GitHub.

**To download the test report:** open any completed workflow run → scroll to Artifacts → download `playwright-report`.

---

## 5. Test Coverage Summary

### What is covered

| Area                         | Scenarios                                                                                                                                                                                                                                                                                           |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Authentication**           | Successful login, invalid credentials (wrong password, empty fields, SQL injection), locked-out user, session persistence after refresh, logout and redirect, direct URL access after logout                                                                                                        |
| **Product Catalog**          | Product count, name and price validation against fixture data, all four sort orders (A→Z, Z→A, price low→high, price high→low), `problem_user` broken image detection via src attribute comparison                                                                                                  |
| **Shopping Cart**            | Add single item, add multiple items, remove item, cart persistence across navigation, badge sync after removal, empty cart state                                                                                                                                                                    |
| **Checkout**                 | Full purchase flow (single and multiple items), missing required field validation (first name, last name, postal code), order summary math verification (subtotal + tax = total), item name validation in summary, multi-item subtotal aggregation, post-order confirmation screen                  |
| **Performance & Resilience** | `performance_glitch_user` login with smart waits, `error_user` add-to-cart failures, remove button failure on inventory page, remove from cart page (works correctly), sorting error dialog, last name field non-interactive, silent checkout continuation without last name, finish button failure |
