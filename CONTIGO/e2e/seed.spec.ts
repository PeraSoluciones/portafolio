import { test, expect } from '@playwright/test';

test.describe('Test group', () => {
  test('seed', async ({ page }) => {
    const baseURL = 'https://46tb7hj7-3000.use2.devtunnels.ms/';
    const verifiedUser = {
      email: 'testuser@example.com', // Using the same verified user
      password: 'Password123!',
    };
    await page.goto(`${baseURL}login`);

    const continueButton = page.getByRole('button', { name: 'Continue' });
    if (await continueButton.isVisible()) {
      await continueButton.click();
      await page.waitForURL('**/login');
      await page.waitForLoadState('networkidle');
    }

    // await expect(
    //   page.getByRole('heading', { name: 'Bienvenido de nuevo' })
    // ).toBeVisible();
    await page.getByLabel('Email').fill(verifiedUser.email);
    await page.getByLabel('Contraseña').fill(verifiedUser.password);
    await page
      .getByRole('button', { name: 'Iniciar sesión', exact: true })
      .click();
    await expect(page).toHaveURL(`${baseURL}dashboard`, { timeout: 10000 });
  });
});
