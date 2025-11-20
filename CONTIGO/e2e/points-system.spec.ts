import { test, expect } from '@playwright/test';

test.describe('Points System E2E Flow', () => {
  const baseURL = 'https://46tb7hj7-3000.use2.devtunnels.ms/';
  const verifiedUser = {
    email: 'testuser@example.com', // Using the same verified user
    password: 'Password123!',
  };

  const childUser = {
    name: 'Child Test User',
    birthDay: '2018-01-01',
    tadhType: 'COMBINED',
  };

  const habit = {
    name: 'Test Habit',
    description: 'This is a test habit',
    category: 'SLEEP',
    targetFrequency: 10,
    unit: 'HOURS',
    pointsValue: 10,
  };

  const routine = {
    title: 'Test Routine',
    description: 'This is a test routine',
    time: '10:00',
    days: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
    is_active: true,
  };

  // Log in once before all tests in this file
  test.beforeEach(async ({ page }) => {
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

  test('Can add a child', async ({ page }) => {
    // 0. Add a child
    await page.getByText('Agregar primer hijo').click();

    await page.waitForURL('**/children/new');
    // await page.waitForLoadState('networkidle');

    await expect(
      page.getByRole('heading', { name: 'Agregar nuevo hijo', exact: true })
    ).toBeVisible();

    await page.getByLabel('Nombre completo').fill(childUser.name);
    await page.getByLabel('Fecha de nacimiento').fill(childUser.birthDay);

    // Interact with the custom shadcn/ui Select component
    await page.getByLabel('Tipo de TDAH').click();
    await page.getByRole('option', { name: 'Combinado' }).click();

    await page.getByRole('button', { name: 'Agregar hijo' }).click();

    await expect(page).toHaveURL(`${baseURL}dashboard`, { timeout: 15000 });
  });

  //   test('should correctly award points for completing a habit and recording a behavior', async ({
  //     page,
  //   }) => {
  //     // Let's get the initial points balance
  //     const initialPoints = 0;

  //     // 1. Create a new Habit with points
  //     await page.locator('[href="/habits/new"]>button').click();

  //     await page.waitForURL('**/habits/new');
  //     await page.waitForLoadState('networkidle');

  //     await expect(page).toHaveURL(`${baseURL}dashboard/habits/new`, {
  //       timeout: 15000,
  //     });

  //     await page.getByLabel('Título del hábito').fill(habit.name);
  //     await page.getByLabel('Descripción (opcional)').fill(habit.description);
  //     await page.getByLabel('Categoría').fill(habit.category);
  //     await page
  //       .getByLabel('Frecuencia objetivo')
  //       .fill(habit.targetFrequency.toString());
  //     await page.getByLabel('Unidad de medida').fill(habit.unit);
  //     await page.getByLabel('Valor de puntos').fill(habit.pointsValue.toString());
  //     await page.getByRole('button', { name: 'Crear Hábito' }).click();

  //     await page.waitForURL('**/habits');
  //     await page.waitForLoadState('networkidle');

  //     await expect(page).toHaveURL(`${baseURL}dashboard/habits`, {
  //       timeout: 15000,
  //     });

  //     // 2. Create a rutine
  //     await page.locator('[href="/routines/new"]>button').click();

  //     await page.waitForURL('**/routines/new');
  //     await page.waitForLoadState('networkidle');

  //     const routineName = `Routine ${Date.now()}`;
  //     await page.getByRole('button', { name: 'Nueva Rutina' }).click();
  //     await page.getByLabel('Nombre de la rutina').fill(routineName);
  //     await page.getByRole('button', { name: 'Crear Rutina' }).click();
  //     await expect(page.getByText(routineName)).toBeVisible();

  //     // 2. Create a new positive Behavior with points
  //     const behaviorName = `Ayudar en casa ${Date.now()}`;
  //     const behaviorPoints = 5;
  //     await page.goto(`${baseURL}behaviors`);
  //     await page.getByRole('button', { name: 'Nuevo Comportamiento' }).click();
  //     await page.getByLabel('Nombre del comportamiento').fill(behaviorName);
  //     await page.getByLabel('Puntos').fill(behaviorPoints.toString());
  //     await page.getByRole('button', { name: 'Crear Comportamiento' }).click();
  //     await expect(page.getByText(behaviorName)).toBeVisible();

  //     // 3. Go to the "Today" view and complete the habit
  //     await page.goto(`${baseURL}today`);
  //     // This selector assumes a checkbox or button associated with the habit's name
  //     await page
  //       .locator(`[data-habit-name="${habitName}"]`)
  //       .getByRole('checkbox')
  //       .check();

  //     // 4. Go to the Dashboard and record the behavior
  //     await page.goto(`${baseURL}dashboard`);
  //     await page
  //       .getByRole('button', { name: 'Registrar Comportamiento' })
  //       .click();
  //     // Select the behavior from a dropdown/list
  //     await page.getByText(behaviorName).click();
  //     await page.getByRole('button', { name: 'Confirmar Registro' }).click();

  //     // 5. Verify the new points balance
  //     const expectedPoints = initialPoints + habitPoints + behaviorPoints;
  //     const finalPointsLocator = page.locator('.points-balance-display');
  //     await expect(finalPointsLocator).toContainText(`${expectedPoints} Puntos`, {
  //       timeout: 10000,
  //     });

  //     // 6. Verify the points history
  //     await finalPointsLocator.click(); // Assuming clicking the balance opens the history
  //     const historyModal = page.locator('.points-history-modal');
  //     await expect(historyModal).toBeVisible();
  //     await expect(historyModal.getByText(habitName)).toBeVisible();
  //     await expect(historyModal.getByText(`+${habitPoints}`)).toBeVisible();
  //     await expect(historyModal.getByText(behaviorName)).toBeVisible();
  //     await expect(historyModal.getByText(`+${behaviorPoints}`)).toBeVisible();
  //   });
});
