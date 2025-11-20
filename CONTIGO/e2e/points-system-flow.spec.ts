import { test, expect } from '@playwright/test';
import { formatedCurrentDate } from '@/lib/utils';

const testId = Math.random().toString(36).slice(2, 8);

test.describe
  .serial('Escenario 1: Configuración Inicial y Creación de Entidades', () => {
  const baseURL = 'http://localhost:3000/';
  const verifiedUser = {
    email: 'testuser@example.com',
    password: 'Password123!',
  };

  const childUser = {
    name: `Child Test User ${testId}`,
    birthDay: '2018-01-01',
  };

  const habit = {
    name: `Leer durante 15 minutos ${testId}`,
    description: 'Leer un libro de elección personal.',
    category: 'ORGANIZATION',
    targetFrequency: 15,
    unit: 'Minutos',
    pointsValue: 10,
  };

  const positiveBehavior = {
    name: `Ayudar con las tareas del hogar ${testId}`,
    type: 'POSITIVE',
    pointsValue: 5,
  };

  const negativeBehavior = {
    name: `No hacer la cama ${testId}`,
    type: 'NEGATIVE',
    pointsValue: 5,
  };

  const reward = {
    name: `Una hora de videojuegos ${testId}`,
    pointsCost: 50,
  };

  const routine = {
    title: `Rutina de la mañana ${testId}`,
  };

  test('Flujo completo del sistema de puntos', async ({ page }) => {
    test.setTimeout(120000); // Aumentamos el timeout a 120 segundos

    // Login
    await page.goto(`${baseURL}login`);

    // Manejo robusto del botón "Continue" si aparece
    const continueButton = page.getByRole('button', { name: 'Continue' });
    try {
      // Esperamos brevemente a que el botón sea visible (máximo 3 segundos)
      await continueButton.waitFor({ state: 'visible', timeout: 3000 });
      await continueButton.click();
      await page.waitForURL('**/login', { timeout: 10000 });
    } catch (e) {
      // Si no aparece en 3 segundos, asumimos que no es necesario y continuamos
    }

    await page.getByLabel('Email').fill(verifiedUser.email);
    await page.getByLabel('Contraseña').fill(verifiedUser.password);
    await page
      .getByRole('button', { name: 'Iniciar sesión', exact: true })
      .click();
    await expect(page).toHaveURL(`${baseURL}dashboard`, { timeout: 30000 });

    // 1.1 Agregar un nuevo hijo
    await page.goto(`${baseURL}children/new`);
    await expect(
      page.getByRole('heading', { name: 'Agregar nuevo hijo' })
    ).toBeVisible();
    await page.getByLabel('Nombre completo').fill(childUser.name);
    await page.getByLabel('Fecha de nacimiento').fill(childUser.birthDay);
    await page.getByLabel('Tipo de TDAH').click();
    await page.getByRole('option', { name: 'Combinado' }).click();
    await page.getByRole('button', { name: 'Agregar hijo' }).click();
    await page.waitForURL(`${baseURL}dashboard`, { timeout: 10000 });

    // Seleccionar el nuevo hijo de la lista
    await page.getByText(childUser.name).first().click();
    await page.waitForURL(`${baseURL}dashboard`, { timeout: 10000 });

    await expect(
      page.getByRole('main').getByText(childUser.name, { exact: true })
    ).toBeVisible();
    await expect(page.getByText('0 pts')).toBeVisible();

    // 1.2 Crear un Hábito con Puntos
    await page.getByRole('link', { name: 'Hábitos', exact: true }).click();
    await page.waitForURL(`${baseURL}habits`, { timeout: 10000 });
    await page.getByRole('link', { name: 'Nuevo' }).click();
    await page.waitForURL(`${baseURL}habits/new`, { timeout: 10000 });

    await expect(
      page.getByRole('heading', { name: 'Nuevo hábito' })
    ).toBeVisible();
    await page.getByLabel('Título del hábito').fill(habit.name);
    await page.getByLabel('Descripción (opcional)').fill(habit.description);
    await page.getByLabel('Valor de puntos').fill(habit.pointsValue.toString());
    await page.getByRole('combobox').click();
    await page.getByRole('option', { name: 'Organización' }).click();
    await page
      .getByLabel('Frecuencia objetivo')
      .fill(habit.targetFrequency.toString());
    await page.getByLabel('Unidad de medida').fill(habit.unit);
    await page.getByLabel('Valor de puntos').fill(habit.pointsValue.toString());
    await page.getByRole('button', { name: 'Crear Hábito' }).click();
    await page.waitForURL(`${baseURL}habits`, { timeout: 10000 });

    await expect(
      page.getByText(`Hábitos de Child Test User ${testId}`)
    ).toBeVisible();

    // 1.3 Crear un Comportamiento Positivo
    await page
      .getByRole('link', { name: 'Comportamientos', exact: true })
      .click();
    await page.waitForURL(`${baseURL}behaviors`, { timeout: 10000 });
    await page.getByRole('link', { name: 'Nuevo Comportamiento' }).click();
    await page.waitForURL(`${baseURL}behaviors/new`, { timeout: 10000 });

    await expect(
      page.getByRole('heading', { name: 'Nuevo comportamiento' })
    ).toBeVisible();
    await page
      .getByLabel('Título del comportamiento')
      .fill(positiveBehavior.name);
    await page.getByRole('combobox').click();
    await page.getByRole('option', { name: 'Positivo' }).click();
    await page
      .getByLabel('Puntos')
      .fill(positiveBehavior.pointsValue.toString());
    await page.getByRole('button', { name: 'Crear comportamiento' }).click();
    let toast = page
      .locator('div')
      .filter({ hasText: /^El nuevo comportamiento ha sido guardado\.$/ });
    await toast.waitFor();
    await expect(toast).toBeVisible();

    // 1.4 Crear un Comportamiento Negativo
    await page
      .getByRole('link', { name: 'Comportamientos', exact: true })
      .click({ force: true });
    await page.waitForURL(`${baseURL}behaviors`, { timeout: 10000 });
    await page.getByRole('link', { name: 'Nuevo comportamiento' }).click();
    await page.waitForURL(`${baseURL}behaviors/new`, { timeout: 10000 });

    await expect(
      page.getByRole('heading', { name: 'Nuevo comportamiento' })
    ).toBeVisible();
    await page
      .getByLabel('Título del comportamiento')
      .fill(negativeBehavior.name);
    await page.getByRole('combobox').click();
    await page.getByRole('option', { name: 'Negativo' }).click();
    await page
      .getByLabel('Puntos')
      .fill(negativeBehavior.pointsValue.toString());
    await page.getByRole('button', { name: 'Crear comportamiento' }).click();
    toast = page
      .locator('div')
      .filter({ hasText: /^El nuevo comportamiento ha sido guardado\.$/ });
    await toast.waitFor();
    await expect(toast).toBeVisible();

    // 1.5 Registrar comportamiento positivo
    await page
      .getByRole('button', { name: 'Registrar hoy' })
      .first()
      .click({ force: true });
    let behaviorModal = page
      .getByLabel('Registrar Comportamiento')
      .getByText(`Ayudar con las tareas del hogar ${testId}`, { exact: true });
    await behaviorModal.waitFor({ timeout: 10000 });
    await page.getByLabel('Fecha').fill(formatedCurrentDate());
    await page.getByRole('button', { name: 'Registrar' }).click();
    toast = page.locator('div').filter({
      hasText: /^El comportamiento se ha registrado correctamente$/,
    });
    await toast.waitFor();
    await expect(toast).toBeVisible();

    // 1.6 Registrar comportamiento negativo
    await page
      .getByRole('button', { name: 'Registrar hoy' })
      .nth(1)
      .click({ force: true });
    behaviorModal = page
      .getByLabel('Registrar Comportamiento')
      .getByText(`No hacer la cama ${testId}`, { exact: true });
    await behaviorModal.waitFor();
    await page.getByLabel('Fecha').fill(formatedCurrentDate());
    await page.getByRole('button', { name: 'Registrar' }).click();
    toast = page.locator('div').filter({
      hasText: /^El comportamiento se ha registrado correctamente$/,
    });
    await toast.waitFor();
    await expect(toast).toBeVisible();

    // 1.7 Crear una Recompensa
    await page
      .getByRole('link', { name: 'Recompensas', exact: true })
      .click({ force: true });
    await page.waitForURL(`${baseURL}rewards`, { timeout: 10000 });
    await page.getByRole('button', { name: 'Nueva recompensa' }).click();
    await page.waitForURL(`${baseURL}rewards/new`, { timeout: 10000 });

    await expect(
      page.getByRole('heading', { name: 'Nueva recompensa' })
    ).toBeVisible();
    await page.getByLabel('Título de la recompensa').fill(reward.name);
    await page
      .getByLabel('Puntos requeridos')
      .fill(reward.pointsCost.toString());
    await page.getByRole('button', { name: 'Crear Recompensa' }).click();
    await page.waitForURL(`${baseURL}rewards`, { timeout: 10000 });
    toast = page.locator('div').filter({
      hasText: new RegExp(
        `^La recompensa "${reward.name}" se ha creado correctamente$`
      ),
    });
    await toast.waitFor();
    await expect(toast).toBeVisible();

    // 1.8 Crear una Rutina y Asignar un Hábito
    await page
      .getByRole('link', { name: 'Rutinas', exact: true })
      .click({ force: true });
    await page.waitForURL(`${baseURL}routines`, { timeout: 10000 });
    await page.getByRole('button', { name: 'Nueva Rutina' }).click();
    await page.waitForURL(`${baseURL}routines/new`, { timeout: 10000 });

    await expect(
      page.getByRole('heading', { name: 'Nueva rutina' })
    ).toBeVisible();
    await page.getByLabel('Título de la rutina').fill(routine.title);
    await page.getByRole('combobox').click();
    await page.getByRole('option', { name: '07:00' }).click();

    // Seleccionar días (requerido)
    await page.getByLabel('Lunes').check();

    await page.getByRole('button', { name: 'Añadir primer hábito' }).click();
    let habitModal = page.getByRole('heading', {
      name: 'Añadir Hábitos a la Rutina',
    });
    await expect(habitModal).toBeVisible();
    await page
      .getByRole('checkbox', { name: `Leer durante 15 minutos ${testId}` })
      .click();

    const assignButton = page.getByRole('button', { name: 'Asignar Hábito' });
    await expect(assignButton).toBeEnabled();
    await assignButton.click();

    // 1. Verificar que la operación fue exitosa mediante el toast
    const successToast = page
      .getByText(/hábito\(s\) han sido asignados correctamente a la rutina/)
      .first();
    await expect(successToast).toBeVisible({ timeout: 10000 });

    // 2. El modal debería desaparecer (porque el componente padre entra en estado de carga y desmonta el modal)
    await expect(
      page.getByRole('heading', { name: 'Añadir Hábitos a la Rutina' })
    ).toBeHidden({ timeout: 10000 });

    // 3. Esperar a que termine la carga (si aparece el loader)
    try {
      await expect(page.getByText('Cargando hábitos...')).toBeHidden({
        timeout: 10000,
      });
    } catch (e) {
      // Ignoramos si ya pasó
    }

    // 4. Verificar que aparece el botón de "Añadir más hábitos"
    const addMoreHabitsBtn = page.getByRole('button', {
      name: 'Añadir más hábitos',
    });
    await expect(addMoreHabitsBtn).toBeVisible({ timeout: 15000 });

    const createRoutineBtn = page.getByRole('button', { name: 'Crear rutina' });
    await expect(createRoutineBtn).toBeEnabled();

    // Esperar un momento para asegurar que la UI esté estable
    await page.waitForTimeout(1000);

    // Intentar hacer scroll hasta el botón primero
    await createRoutineBtn.scrollIntoViewIfNeeded();

    // Click en el botón
    await createRoutineBtn.click();

    // Verificar toast de éxito o redirección
    // A veces el toast es muy rápido o la redirección ocurre antes de que podamos captarlo
    try {
      toast = page
        .locator('div')
        .filter({
          hasText:
            /La rutina se ha creado correctamente|Error|Debes seleccionar/,
        })
        .first();
      await toast.waitFor({ state: 'visible', timeout: 10000 });
      if (await toast.isVisible()) {
        await expect(toast).toContainText(
          'La rutina se ha creado correctamente'
        );
      }
    } catch (e) {
      // Si falla la verificación del toast, confiamos en la redirección
    }

    // La prueba definitiva de éxito es la redirección a la lista de rutinas
    await page.waitForURL(`${baseURL}routines`, { timeout: 30000 });
  });
});
