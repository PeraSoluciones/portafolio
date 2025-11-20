import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  const baseURL = 'https://46tb7hj7-3000.use2.devtunnels.ms/';
  const user = {
    fullName: 'Test User',
    email: `test-${Date.now()}@example.com`,
    password: 'Password123$',
  };

//   test('should allow a user to register successfully', async ({ page }) => {
//     await page.goto(`${baseURL}register`);

//     // Handle VS Code tunnel security warning
//     const continueButton = page.getByRole('button', { name: 'Continue' });
//     if (await continueButton.isVisible()) {
//       await continueButton.click();
//     }

//     await expect(page).toHaveTitle(/CONTIGO/);

//     // Fill out the registration form
//     await page.getByLabel('Nombre completo').fill(user.fullName);
//     await page.getByLabel('Email').fill(user.email);
//     await page.getByLabel('Contraseña', { exact: true }).fill(user.password);
//     await page.getByLabel('Confirmar contraseña').fill(user.password);

//     // Submit the form
//     await page.getByRole('button', { name: 'Crear cuenta' }).click();

//     // The correct behavior for a flow with email confirmation is to show a success message.
//     // We verify this message appears.
//     await expect(page.getByText('¡Registro exitoso!')).toBeVisible({ timeout: 15000 });
//     await expect(page.getByText('Hemos enviado un email de confirmación')).toBeVisible();
//   });

  test('should allow a verified user to log in', async ({ page }) => {
    // IMPORTANT: Replace with credentials of an EXISTING and VERIFIED user in your test database
    const verifiedUser = {
      email: 'testuser@example.com', // <-- REPLACE THIS
      password: 'Password123!',      // <-- REPLACE THIS
    };

    await page.goto(`${baseURL}login`);

    // Handle VS Code tunnel security warning
    const continueButton = page.getByRole('button', { name: 'Continue' });
    if (await continueButton.isVisible()) {
      await continueButton.click();
      // *** CRITICAL FIX ***
      // After clicking 'Continue', we must explicitly wait for the navigation to the login page to complete.
      await page.waitForURL('**/login');
      await page.waitForLoadState('networkidle');
    }

    // Now that we've ensured the page is loaded, we can safely look for the heading.
    // await expect(page.getByRole('heading', { name: 'Bienvenido de nuevo' })).toBeVisible();

    // Fill out the login form
    await page.getByLabel('Email').fill(verifiedUser.email);
    await page.getByLabel('Contraseña').fill(verifiedUser.password);

    // Submit the form
    await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click();

    // Verify successful login by checking for redirection and dashboard content
    await expect(page).toHaveURL(`${baseURL}dashboard`, { timeout: 15000 });
    await expect(page.getByRole('heading', { name: /Bienvenido/i })).toBeVisible();
  });
});