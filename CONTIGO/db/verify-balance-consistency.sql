-- =====================================================
-- VERIFICACIÓN: CONSISTENCIA DE BALANCE DE PUNTOS
-- =====================================================

DO $$
DECLARE
  test_child_id UUID := 'e783a827-4cba-446c-81c3-20f8b5d74d7e';
  current_balance INTEGER;
  calculated_balance INTEGER;
  rec RECORD;
BEGIN
  RAISE NOTICE '==========================================';
  RAISE NOTICE 'VERIFICACIÓN DE CONSISTENCIA DE PUNTOS';
  RAISE NOTICE '==========================================';

  -- 1. Balance actual en la tabla children
  SELECT points_balance INTO current_balance
  FROM children
  WHERE id = test_child_id;

  RAISE NOTICE 'Balance en tabla children: % pts', current_balance;

  -- 2. Balance calculado desde points_transactions
  SELECT COALESCE(SUM(points), 0) INTO calculated_balance
  FROM points_transactions
  WHERE child_id = test_child_id;

  RAISE NOTICE 'Balance calculado desde transacciones: % pts', calculated_balance;

  -- 3. Verificar consistencia
  IF current_balance = calculated_balance THEN
    RAISE NOTICE '✅ Balance CONSISTENTE';
  ELSE
    RAISE NOTICE '⚠️  Balance INCONSISTENTE';
    RAISE NOTICE '   Diferencia: % pts', (calculated_balance - current_balance);
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE 'Historial de transacciones:';
  RAISE NOTICE '==========================================';

  -- 4. Mostrar todas las transacciones
  FOR rec IN
    SELECT 
      created_at,
      transaction_type,
      points,
      balance_after,
      description
    FROM points_transactions
    WHERE child_id = test_child_id
    ORDER BY created_at
  LOOP
    RAISE NOTICE '% | % | %pts | Balance: % | %',
      TO_CHAR(rec.created_at, 'YYYY-MM-DD HH24:MI:SS'),
      RPAD(rec.transaction_type, 20),
      LPAD(rec.points::text, 4),
      LPAD(rec.balance_after::text, 4),
      rec.description;
  END LOOP;

  RAISE NOTICE '==========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'NOTA IMPORTANTE:';
  RAISE NOTICE 'El campo balance_after es un SNAPSHOT histórico.';
  RAISE NOTICE 'NO se actualiza cuando eliminas transacciones.';
  RAISE NOTICE 'Lo importante es que children.points_balance sea correcto.';

END $$;

-- =====================================================
-- FUNCIÓN PARA RECALCULAR BALANCE (si es necesario)
-- =====================================================

CREATE OR REPLACE FUNCTION recalculate_child_balance(p_child_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_calculated_balance INTEGER;
  v_current_balance INTEGER;
BEGIN
  -- Calcular balance desde transacciones
  SELECT COALESCE(SUM(points), 0) INTO v_calculated_balance
  FROM points_transactions
  WHERE child_id = p_child_id;

  -- Obtener balance actual
  SELECT points_balance INTO v_current_balance
  FROM children
  WHERE id = p_child_id;

  -- Si hay inconsistencia, actualizar
  IF v_calculated_balance != v_current_balance THEN
    UPDATE children
    SET points_balance = v_calculated_balance
    WHERE id = p_child_id;

    RAISE NOTICE 'Balance recalculado: % → %', v_current_balance, v_calculated_balance;
  ELSE
    RAISE NOTICE 'Balance ya está correcto: %', v_current_balance;
  END IF;

  RETURN v_calculated_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION recalculate_child_balance IS 'Recalcula el balance de puntos de un niño basándose en sus transacciones';

-- Ejecutar recálculo para el niño de prueba
SELECT recalculate_child_balance('e783a827-4cba-446c-81c3-20f8b5d74d7e') as balance_recalculado;
