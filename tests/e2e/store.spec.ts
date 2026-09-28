import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test("visitor can browse, filter, and add a product", async ({ page }) => {
  await expect(
    page.getByRole("heading", { name: /Everything you need/i }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Shop now" }).click();
  await expect(
    page.getByRole("heading", { name: /Find your next good thing/i }),
  ).toBeVisible();
  await page.getByLabel("Category").selectOption("electronics");
  await page.getByRole("button", { name: "Apply filters" }).click();
  await expect(page).toHaveURL(/category=electronics/);
  await page.getByRole("button", { name: "Add" }).first().click();
  await expect(
    page.getByRole("link", { name: "Cart with 1 items" }),
  ).toBeVisible();
});

test("guest cart survives sign-in and completes simulated checkout", async ({
  page,
}) => {
  await page.goto("/products");
  await page.getByRole("button", { name: "Add" }).first().click();
  await expect(
    page.getByRole("link", { name: "Cart with 1 items" }),
  ).toBeVisible();
  await page.goto("/checkout");
  await page.getByRole("link", { name: /Sign in securely/i }).click();
  await page.getByLabel("Email address").fill("shopper@example.com");
  await page.getByLabel("Password").fill("SamplePass123!");
  await page.getByRole("button", { name: /Sign in/i }).click();
  await expect(page).toHaveURL("http://127.0.0.1:5173/checkout");
  await page.getByRole("button", { name: "Confirm order" }).click();
  await expect(page.getByRole("heading", { name: "Thank you!" })).toBeVisible();
  await page.getByRole("link", { name: "View order history" }).click();
  await expect(page.getByRole("heading", { name: /RM-\d{4}-/ })).toBeVisible();
});

test("admin sample data is labeled and mutations are disabled", async ({
  page,
}) => {
  await page.goto("/admin");
  await expect(
    page.getByRole("heading", { name: "Store overview" }),
  ).toBeVisible();
  await expect(page.getByText("Sample data")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Top-selling products" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Operational alerts" }),
  ).toBeVisible();
  const chartControl = page
    .locator(".chart-toggle")
    .getByRole("link", { name: "Orders" });
  await chartControl.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/metric=orders/);
  await expect(
    page.getByRole("heading", { name: "Order volume" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "30 days" }).click();
  await expect(page).toHaveURL(/range=30/);
  const downloadPromise = page.waitForEvent("download");
  await page
    .locator(".export-card")
    .getByRole("link", { name: "orders" })
    .focus();
  await page.keyboard.press("Enter");
  await expect((await downloadPromise).suggestedFilename()).toMatch(
    /^randommart-orders-\d{4}-\d{2}-\d{2}-\d{4}-\d{2}-\d{2}\.csv$/,
  );
  await page.goto("/admin/products");
  await expect(
    page.getByRole("button", { name: "New product" }),
  ).toBeDisabled();
});

test("invalid product filters return a safe empty or bounded result", async ({
  page,
}) => {
  await page.goto("/products?min=999999&max=1&q=%3Cscript%3E");
  await expect(
    page.getByRole("heading", { name: "No products found" }),
  ).toBeVisible();
  await expect(page.locator("script").filter({ hasText: "alert" })).toHaveCount(
    0,
  );
});
