-- =====================================================
-- FASE 2: FUNCIÓN PRINCIPAL DE TRANSACCIONES DE PUNTOS
-- =====================================================

-- Función principal para manejar todas las transacciones de puntos
-- Centraliza la lógica de negocio para sumar/restar puntos y actualizar el balance del niño
CREATE OR REPLACE FUNCTION handle_points_transaction(
  p_child_id UUID,
  p_transaction_type TEXT,
  p_related_id UUID DEFAULT NULL,
  p_points INTEGER,
  p_description TEXT,
  p_allow_negative BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
  transaction_id UUID,
  new_balance INTEGER,
  success BOOLEAN,
  message TEXT
) AS $$
DECLARE
  current_balance INTEGER;
  new_balance INTEGER;
  transaction_id UUID;
  child_exists BOOLEAN;
BEGIN
  -- Verificar que el niño existe
  SELECT EXISTS(SELECT 1 FROM children WHERE id = p_child_id) INTO child_exists;
  
  IF NOT child_exists THEN
    RETURN QUERY SELECT NULL::UUID, 0, FALSE, 'El niño especificado no existe'::TEXT;
    RETURN;
  END IF;
  
  -- Obtener el saldo actual del niño
  SELECT points_balance INTO current_balance
  FROM children
  WHERE id = p_child_id;
  
  -- Calcular el nuevo saldo
  new_balance := current_balance + p_points;
  
  -- Verificar que el saldo no sea negativo (a menos que se permita explícitamente)
  IF new_balance < 0 AND NOT p_allow_negative THEN
    RETURN QUERY SELECT NULL::UUID, current_balance, FALSE, 'Saldo de puntos insuficiente para esta transacción'::TEXT;
    RETURN;
  END IF;
  
  -- Iniciar transacción atómica
  BEGIN
    -- Actualizar el saldo del niño
    UPDATE children
    SET points_balance = new_balance
    WHERE id = p_child_id;
    
    -- Crear la transacción de puntos
    INSERT INTO points_transactions (
      child_id,
      transaction_type,
      related_id,
      points,
      description,
      balance_after
    ) VALUES (
      p_child_id,
      p_transaction_type,
      p_related_id,
      p_points,
      p_description,
      new_balance
    ) RETURNING id INTO transaction_id;
    
    -- Retornar éxito
    RETURN QUERY SELECT transaction_id, new_balance, TRUE, 'Transacción completada exitosamente'::TEXT;
    
    -- Notificar al sistema (si es necesario para futuras integraciones)
    PERFORM pg_notify('points_transaction_updated', 
      json_build_object(
        'transaction_id', transaction_id,
        'child_id', p_child_id,
        'transaction_type', p_transaction_type,
        'points', p_points,
        'new_balance', new_balance
      )::text
    );
    
  EXCEPTION
    WHEN OTHERS THEN
      -- En caso de error, hacer rollback y retornar el mensaje
      RETURN QUERY SELECT NULL::UUID, current_balance, FALSE, 'Error en la transacción: ' || SQLERRM::TEXT;
  END;
  
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función optimizada para obtener el balance de puntos actual de un niño
CREATE OR REPLACE FUNCTION get_child_points_balance(p_child_id UUID)
RETURNS INTEGER AS $$
DECLARE
  balance INTEGER;
BEGIN
  SELECT points_balance INTO balance
  FROM children
  WHERE id = p_child_id;
  
  IF balance IS NULL THEN
    RETURN 0;
  ELSE
    RETURN balance;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener el historial de transacciones con más detalles
CREATE OR REPLACE FUNCTION get_child_points_history(
  p_child_id UUID, 
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  transaction_type TEXT,
  related_id UUID,
  related_title TEXT,
  points INTEGER,
  description TEXT,
  balance_before INTEGER,
  balance_after INTEGER,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  WITH transactions_with_balance AS (
    SELECT
      pt.id AS id,
      pt.child_id AS child_id,
      pt.transaction_type AS transaction_type,
      pt.related_id AS related_id,
      pt.points AS points,
      pt.description AS description,
      pt.balance_after AS balance_after,
      LAG(pt.balance_after, 1, 0) OVER (ORDER BY pt.created_at) AS balance_before,
      pt.created_at AS created_at
    FROM public.points_transactions pt
    WHERE pt.child_id = p_child_id
    ORDER BY pt.created_at DESC
    LIMIT p_limit
    OFFSET p_offset
  )
  SELECT
    twb.id,
    twb.transaction_type,
    twb.related_id,
    CASE
      WHEN twb.transaction_type = 'BEHAVIOR' THEN (
        SELECT b.title FROM public.behaviors b WHERE b.id = twb.related_id
      )
      WHEN twb.transaction_type = 'HABIT' THEN (
        SELECT h.title FROM public.habits h WHERE h.id = twb.related_id
      )
      WHEN twb.transaction_type = 'REWARD_REDEMPTION' THEN (
        SELECT r.title FROM public.rewards r WHERE r.id = twb.related_id
      )
      ELSE NULL
    END AS related_title,
    twb.points,
    twb.description,
    twb.balance_before,
    twb.balance_after,
    twb.created_at
  FROM transactions_with_balance twb;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para ajustar manualmente los puntos de un niño (solo para padres)
CREATE OR REPLACE FUNCTION adjust_child_points(
  p_child_id UUID,
  p_points INTEGER,
  p_description TEXT DEFAULT 'Ajuste manual de puntos'
)
RETURNS TABLE (
  transaction_id UUID,
  new_balance INTEGER,
  success BOOLEAN,
  message TEXT
) AS $$
BEGIN
  -- Verificar que el usuario actual sea el padre del niño
  IF NOT EXISTS (
    SELECT 1 FROM children
    WHERE id = p_child_id
    AND parent_id = auth.uid()
  ) THEN
    RETURN QUERY SELECT NULL::UUID, 0, FALSE, 'No tienes permiso para ajustar los puntos de este niño'::TEXT;
    RETURN;
  END IF;
  
  -- Crear la transacción de ajuste usando la función principal
  RETURN QUERY SELECT * FROM handle_points_transaction(
    p_child_id,
    'ADJUSTMENT',
    NULL,
    p_points,
    p_description,
    TRUE -- Permitir saldo negativo para ajustes manuales
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener estadísticas de puntos de un niño
CREATE OR REPLACE FUNCTION get_child_points_stats(p_child_id UUID)
RETURNS TABLE (
  total_earned INTEGER,
  total_spent INTEGER,
  current_balance INTEGER,
  habits_completed INTEGER,
  behaviors_recorded INTEGER,
  rewards_claimed INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE((SELECT SUM(points) FROM points_transactions WHERE child_id = p_child_id AND points > 0), 0)::integer,
    COALESCE((SELECT SUM(ABS(points)) FROM points_transactions WHERE child_id = p_child_id AND points < 0), 0)::integer,
    COALESCE((SELECT points_balance FROM children WHERE id = p_child_id), 0)::integer,
    COALESCE((SELECT COUNT(*) FROM points_transactions WHERE child_id = p_child_id AND transaction_type = 'HABIT'), 0)::integer,
    COALESCE((SELECT COUNT(*) FROM points_transactions WHERE child_id = p_child_id AND transaction_type = 'BEHAVIOR'), 0)::integer,
    COALESCE((SELECT COUNT(*) FROM points_transactions WHERE child_id = p_child_id AND transaction_type = 'REWARD_REDEMPTION'), 0)::integer;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;