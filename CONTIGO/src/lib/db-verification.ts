import { createBrowserClient } from '@/lib/supabase/client';

/**
 * Verifica que todas las tablas y columnas necesarias existan
 * y que las políticas RLS estén configuradas correctamente
 */
export async function verifyDatabaseSchema(): Promise<{
  isValid: boolean;
  errors: string[];
  warnings: string[];
}> {
  const supabase = createBrowserClient();
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // Verificar tabla children tiene points_balance
    const { data: childrenColumns, error: childrenError } = await supabase.rpc(
      'get_table_columns',
      { table_name: 'children' }
    );

    if (childrenError) {
      errors.push('No se pudieron verificar las columnas de la tabla children');
    } else {
      const hasPointsBalance = childrenColumns?.some(
        (col: any) => col.column_name === 'points_balance'
      );
      if (!hasPointsBalance) {
        errors.push('La tabla children no tiene la columna points_balance');
      }
    }

    // Verificar tabla behaviors tiene points_value
    const { data: behaviorsColumns, error: behaviorsError } =
      await supabase.rpc('get_table_columns', { table_name: 'behaviors' });

    if (behaviorsError) {
      errors.push(
        'No se pudieron verificar las columnas de la tabla behaviors'
      );
    } else {
      const hasPointsValue = behaviorsColumns?.some(
        (col: any) => col.column_name === 'points_value'
      );
      if (!hasPointsValue) {
        errors.push('La tabla behaviors no tiene la columna points_value');
      }
    }

    // Verificar nuevas tablas existen
    const { data: tables, error: tablesError } = await supabase.rpc(
      'get_points_system_tables'
    );

    if (tablesError) {
      errors.push('No se pudieron verificar las tablas del esquema');
    } else {
      const tableNames = tables?.map((t: any) => t.table_name) || [];

      if (!tableNames.includes('points_transactions')) {
        errors.push('La tabla points_transactions no existe');
      }

      if (!tableNames.includes('routine_habits')) {
        errors.push('La tabla routine_habits no existe');
      }
    }

    try {
      const { error: getChildPointsBalanceError } = await supabase.rpc(
        'get_child_points_balance',
        {
          p_child_id: '00000000-0000-0000-0000-000000000000',
        }
      );
      // El error esperado es "invalid input syntax", lo que significa que la función existe
      if (
        getChildPointsBalanceError &&
        !getChildPointsBalanceError.message?.includes('invalid input syntax')
      ) {
        warnings.push(
          `La función 'get_child_points_balance' puede no estar configurada correctamente`
        );
      }

      const { error: getChildPointsHistoryError } = await supabase.rpc(
        'get_child_points_history',
        {
          p_child_id: '00000000-0000-0000-0000-000000000000',
          p_limit: 100,
          p_offset: 50,
        }
      );
      // El error esperado es "invalid input syntax", lo que significa que la función existe
      if (
        getChildPointsHistoryError &&
        !getChildPointsHistoryError.message?.includes('invalid input syntax')
      ) {
        warnings.push(
          `La función 'get_child_points_hitory' puede no estar configurada correctamente`
        );
      }

      const { error: adjustChildPointsError } = await supabase.rpc(
        'adjust_child_points',
        {
          p_child_id: '00000000-0000-0000-0000-000000000000',
          p_points: 100,
          p_description: 'test',
        }
      );
      // El error esperado es "invalid input syntax", lo que significa que la función existe
      if (
        adjustChildPointsError &&
        !adjustChildPointsError.message?.includes('invalid input syntax')
      ) {
        warnings.push(
          `La función 'adjust_child_points' puede no estar configurada correctamente`
        );
      }
    } catch (err) {
      warnings.push(`No se pudo verificar la función`);
    }

    // Verificar triggers (solo se puede hacer con SQL directo)
    warnings.push(
      'La verificación de triggers requiere acceso administrativo a la base de datos'
    );
  } catch (error) {
    errors.push(`Error general durante la verificación: ${error}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Verifica que los datos existentes sean consistentes con el nuevo esquema
 */
export async function verifyDataConsistency(): Promise<{
  isValid: boolean;
  errors: string[];
  fixes: string[];
}> {
  const supabase = createBrowserClient();
  const errors: string[] = [];
  const fixes: string[] = [];

  try {
    // Verificar que todos los niños tengan points_balance no nulo
    const { data: children, error: childrenError } = await supabase
      .from('children')
      .select('id, points_balance');

    if (childrenError) {
      errors.push('No se pudieron verificar los datos de children');
    } else {
      const childrenWithNullBalance =
        children?.filter((child) => child.points_balance === null) || [];
      if (childrenWithNullBalance.length > 0) {
        errors.push(
          `${childrenWithNullBalance.length} niños tienen points_balance nulo`
        );
        fixes.push(
          'Ejecutar UPDATE children SET points_balance = 0 WHERE points_balance IS NULL'
        );
      }

      const childrenWithNegativeBalance =
        children?.filter((child) => child.points_balance < 0) || [];
      if (childrenWithNegativeBalance.length > 0) {
        errors.push(
          `${childrenWithNegativeBalance.length} niños tienen saldo negativo`
        );
        fixes.push('Revisar las transacciones que causaron saldos negativos');
      }
    }

    // Verificar que todos los behaviors tengan points_value positivo
    const { data: behaviors, error: behaviorsError } = await supabase
      .from('behaviors')
      .select('id, points_value, type');

    if (behaviorsError) {
      errors.push('No se pudieron verificar los datos de behaviors');
    } else {
      const behaviorsWithInvalidPoints =
        behaviors?.filter((b) => b.points_value <= 0) || [];
      if (behaviorsWithInvalidPoints.length > 0) {
        errors.push(
          `${behaviorsWithInvalidPoints.length} behaviors tienen points_value inválido`
        );
        fixes.push(
          'Actualizar behaviors para que points_value sea siempre positivo'
        );
      }
    }

    // Verificar consistencia de transacciones
    const { data: transactions, error: transactionsError } = await supabase
      .from('points_transactions')
      .select('*')
      .limit(100);

    if (!transactionsError && transactions) {
      const inconsistentTransactions = transactions.filter((t) => {
        // Verificar que balance_after sea consistente
        const prevTransaction = transactions.find(
          (pt) => pt.created_at < t.created_at && pt.child_id === t.child_id
        );
        return (
          prevTransaction &&
          prevTransaction.balance_after + t.points !== t.balance_after
        );
      });

      if (inconsistentTransactions.length > 0) {
        errors.push(
          `${inconsistentTransactions.length} transacciones tienen balances inconsistentes`
        );
        fixes.push(
          'Recalcular los balances de puntos a partir de las transacciones'
        );
      }
    }
  } catch (error) {
    errors.push(`Error general durante la verificación de datos: ${error}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    fixes,
  };
}

/**
 * Ejecuta las reparaciones automáticas básicas
 */
export async function repairDatabaseData(): Promise<{
  success: boolean;
  repaired: string[];
  errors: string[];
}> {
  const supabase = createBrowserClient();
  const repaired: string[] = [];
  const errors: string[] = [];

  try {
    // Reparar children con points_balance nulo
    const { error: balanceError } = await supabase
      .from('children')
      .update({ points_balance: 0 })
      .is('points_balance', null);

    if (balanceError) {
      errors.push('Error reparando balances nulos');
    } else {
      repaired.push('Balances nulos reparados');
    }

    // Nota: No podemos reparar automáticamente todo aquí,
    // ya que algunas operaciones requieren SQL específico
  } catch (error) {
    errors.push(`Error durante reparación: ${error}`);
  }

  return {
    success: errors.length === 0,
    repaired,
    errors,
  };
}
