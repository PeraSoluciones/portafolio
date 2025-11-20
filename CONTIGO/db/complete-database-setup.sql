-- =====================================================
-- SCRIPT COMPLETO DE CONFIGURACIÓN DE BASE DE DATOS
-- PARA EL SISTEMA DE REFUERZO INTEGRAL
-- =====================================================
-- 
-- Este script consolida todos los cambios necesarios para
-- implementar el sistema de puntos en un entorno limpio.
-- Debe ejecutarse en orden secuencial.
-- 
-- USO: psql -h [host] -U [user] -d [database] -f complete-database-setup.sql

-- =====================================================
-- 1. CREACIÓN DE TABLAS Y ESTRUCTURA BASE
-- =====================================================

-- Verificar si la extensión UUID está habilitada
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Crear tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de hijos
CREATE TABLE IF NOT EXISTS children (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  birth_date DATE NOT NULL,
  avatar_url TEXT,
  adhd_type TEXT NOT NULL CHECK (adhd_type IN ('INATTENTIVE', 'HYPERACTIVE', 'COMBINED')),
  points_balance INTEGER DEFAULT 0 CHECK (points_balance >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de rutinas
CREATE TABLE IF NOT EXISTS routines (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  time TEXT NOT NULL, -- Formato HH:MM
  days TEXT[] NOT NULL, -- Array de días ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM']
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de hábitos
CREATE TABLE IF NOT EXISTS habits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('SLEEP', 'NUTRITION', 'EXERCISE', 'HYGIENE', 'SOCIAL', 'ORGANIZATION')),
  target_frequency INTEGER NOT NULL CHECK (target_frequency > 0),
  unit TEXT NOT NULL,
  points_value INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de registros de hábitos
CREATE TABLE IF NOT EXISTS habit_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  value INTEGER NOT NULL CHECK (value >= 0),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(habit_id, date)
);

-- Crear tabla de comportamientos
CREATE TABLE IF NOT EXISTS behaviors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('POSITIVE', 'NEGATIVE')),
  points_value INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de registros de comportamientos
CREATE TABLE IF NOT EXISTS behavior_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  behavior_id UUID NOT NULL REFERENCES behaviors(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de recompensas
CREATE TABLE IF NOT EXISTS rewards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  points_required INTEGER NOT NULL CHECK (points_required > 0),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de reclamos de recompensas
CREATE TABLE IF NOT EXISTS reward_claims (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reward_id UUID NOT NULL REFERENCES rewards(id) ON DELETE CASCADE,
  claimed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT
);

-- Crear tabla de transacciones de puntos
CREATE TABLE IF NOT EXISTS points_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('BEHAVIOR', 'HABIT', 'ROUTINE', 'REWARD_REDEMPTION', 'ADJUSTMENT')),
  related_id UUID, -- ID del comportamiento, hábito, rutina o recompensa relacionada
  points INTEGER NOT NULL, -- Positivo para ganancia, negativo para pérdida
  description TEXT NOT NULL,
  balance_after INTEGER NOT NULL, -- Saldo después de la transacción
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de hábitos de rutina (conexión entre rutinas y hábitos con puntos)
CREATE TABLE IF NOT EXISTS routine_habits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  routine_id UUID NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
  habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  points_value INTEGER DEFAULT 0,
  is_required BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(routine_id, habit_id)
);

-- Crear tabla de recursos educativos
CREATE TABLE IF NOT EXISTS resources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('ROUTINES', 'HABITS', 'BEHAVIOR', 'EMOTIONAL', 'EDUCATIONAL')),
  type TEXT NOT NULL CHECK (type IN ('ARTICLE', 'VIDEO', 'TIP')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================

-- Índices para tablas principales
CREATE INDEX IF NOT EXISTS idx_children_parent_id ON children(parent_id);
CREATE INDEX IF NOT EXISTS idx_children_points_balance ON children(points_balance);
CREATE INDEX IF NOT EXISTS idx_routines_child_id ON routines(child_id);
CREATE INDEX IF NOT EXISTS idx_routines_is_active ON routines(is_active);
CREATE INDEX IF NOT EXISTS idx_habits_child_id ON habits(child_id);
CREATE INDEX IF NOT EXISTS idx_habits_points_value ON habits(points_value);
CREATE INDEX IF NOT EXISTS idx_habit_records_habit_id ON habit_records(habit_id);
CREATE INDEX IF NOT EXISTS idx_habit_records_date ON habit_records(date);
CREATE INDEX IF NOT EXISTS idx_behaviors_child_id ON behaviors(child_id);
CREATE INDEX IF NOT EXISTS idx_behavior_records_behavior_id ON behavior_records(behavior_id);
CREATE INDEX IF NOT EXISTS idx_rewards_child_id ON rewards(child_id);
CREATE INDEX IF NOT EXISTS idx_rewards_is_active ON rewards(is_active);
CREATE INDEX IF NOT EXISTS idx_reward_claims_reward_id ON reward_claims(reward_id);
CREATE INDEX IF NOT EXISTS idx_points_transactions_child_id ON points_transactions(child_id);
CREATE INDEX IF NOT EXISTS idx_points_transactions_type ON points_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_points_transactions_created_at ON points_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_routine_habits_routine_id ON routine_habits(routine_id);
CREATE INDEX IF NOT EXISTS idx_routine_habits_habit_id ON routine_habits(habit_id);
CREATE INDEX IF NOT EXISTS idx_resources_category ON resources(category);
CREATE INDEX IF NOT EXISTS idx_resources_is_active ON resources(is_active);

-- =====================================================
-- 3. FUNCIONES AUXILIARES
-- =====================================================

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =====================================================
-- 4. TRIGGERS PARA TIMESTAMP AUTOMÁTICO
-- =====================================================

-- Crear triggers para actualizar updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_children_updated_at ON children;
CREATE TRIGGER update_children_updated_at BEFORE UPDATE ON children
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_routines_updated_at ON routines;
CREATE TRIGGER update_routines_updated_at BEFORE UPDATE ON routines
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_habits_updated_at ON habits;
CREATE TRIGGER update_habits_updated_at BEFORE UPDATE ON habits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_behaviors_updated_at ON behaviors;
CREATE TRIGGER update_behaviors_updated_at BEFORE UPDATE ON behaviors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_rewards_updated_at ON rewards;
CREATE TRIGGER update_rewards_updated_at BEFORE UPDATE ON rewards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_resources_updated_at ON resources;
CREATE TRIGGER update_resources_updated_at BEFORE UPDATE ON resources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_points_transactions_updated_at ON points_transactions;
CREATE TRIGGER update_points_transactions_updated_at BEFORE UPDATE ON points_transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_routine_habits_updated_at ON routine_habits;
CREATE TRIGGER update_routine_habits_updated_at BEFORE UPDATE ON routine_habits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 5. FUNCIONES DEL SISTEMA DE PUNTOS
-- =====================================================

-- Función principal para manejar todas las transacciones de puntos
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

-- =====================================================
-- 6. TRIGGERS DEL SISTEMA DE PUNTOS
-- =====================================================

-- Función trigger para asignar puntos cuando se registra un comportamiento
CREATE OR REPLACE FUNCTION on_behavior_record_created()
RETURNS TRIGGER AS $$
DECLARE
  behavior_points INTEGER;
  child_id UUID;
  behavior_title TEXT;
  result RECORD;
  behavior_type TEXT;
BEGIN
  -- Obtener los detalles del comportamiento, incluyendo el tipo
  SELECT b.points_value, b.child_id, b.title, b.type
  INTO behavior_points, child_id, behavior_title, behavior_type
  FROM behaviors b
  WHERE b.id = NEW.behavior_id;

  -- Si el comportamiento es negativo, convertir los puntos a un valor negativo
  IF behavior_type = 'NEGATIVE' THEN
    behavior_points := -ABS(behavior_points);
  END IF;
  
  -- Usar la función principal para crear la transacción de puntos
  SELECT * INTO result FROM handle_points_transaction(
    child_id,
    'BEHAVIOR',
    NEW.behavior_id,
    behavior_points,
    'Puntos por comportamiento: ' || behavior_title,
    FALSE -- No permitir saldo negativo
  );
  
  -- Verificar que la transacción fue exitosa
  IF NOT result.success THEN
    RAISE EXCEPTION 'Error al procesar puntos de comportamiento: %', result.message;
  END IF;
  
  -- Retornar el nuevo registro
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función trigger para asignar puntos cuando se registra un hábito
CREATE OR REPLACE FUNCTION on_habit_record_created()
RETURNS TRIGGER AS $$
DECLARE
  base_points INTEGER := 0;
  habit_child_id UUID;
  habit_title TEXT;
  habit_points_value INTEGER;
  routine_points_value INTEGER;
  result RECORD;
  points_to_award INTEGER := 0;
BEGIN
  -- Solo procesar si es un INSERT o si el valor ha aumentado en un UPDATE
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.value > OLD.value) THEN
    
    -- Obtener información del hábito, incluyendo su valor de puntos directo
    SELECT h.child_id, h.title, h.points_value INTO habit_child_id, habit_title, habit_points_value
    FROM habits h
    WHERE h.id = NEW.habit_id;
    
    -- Sumar puntos de todas las rutinas activas que incluyen este hábito
    SELECT COALESCE(SUM(rh.points_value), 0) INTO routine_points_value
    FROM routine_habits rh
    JOIN routines r ON r.id = rh.routine_id
    WHERE rh.habit_id = NEW.habit_id
    AND r.is_active = true
    AND rh.points_value > 0;
    
    -- Priorizar puntos de rutina, si no, usar los del hábito
    IF routine_points_value > 0 THEN
      base_points := routine_points_value;
    ELSE
      base_points := habit_points_value;
    END IF;

    -- Calcular los puntos a otorgar basados en el cambio de valor
    IF TG_OP = 'UPDATE' THEN
      points_to_award := base_points * (NEW.value - OLD.value);
    ELSE -- Si es un INSERT
      points_to_award := base_points * NEW.value;
    END IF;
    
    -- Si hay puntos a otorgar, crear la transacción
    IF points_to_award > 0 THEN
      SELECT * INTO result FROM handle_points_transaction(
        habit_child_id,
        'HABIT',
        NEW.habit_id,
        points_to_award,
        'Puntos por hábito: ' || habit_title,
        FALSE -- No permitir saldo negativo
      );
      
      -- Verificar que la transacción fue exitosa
      IF NOT result.success THEN
        RAISE EXCEPTION 'Error al procesar puntos de hábito: %', result.message;
      END IF;
    END IF;
  END IF;
  
  -- Retornar el nuevo registro
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función trigger para descontar puntos cuando se reclama una recompensa
CREATE OR REPLACE FUNCTION on_reward_claimed()
RETURNS TRIGGER AS $$
DECLARE
  reward_points INTEGER;
  child_id UUID;
  reward_title TEXT;
  result RECORD;
BEGIN
  -- Obtener detalles de la recompensa
  SELECT r.points_required, r.child_id, r.title INTO reward_points, child_id, reward_title
  FROM rewards r
  WHERE r.id = NEW.reward_id;
  
  -- Usar la función principal para crear la transacción de puntos (negativa)
  SELECT * INTO result FROM handle_points_transaction(
    child_id,
    'REWARD_REDEMPTION',
    NEW.reward_id,
    -reward_points,
    'Canjeo de recompensa: ' || reward_title,
    FALSE -- No permitir saldo negativo
  );
  
  -- Verificar que la transacción fue exitosa
  IF NOT result.success THEN
    RAISE EXCEPTION 'Error al procesar canje de recompensa: %', result.message;
    -- En caso de error, hacer rollback del reclamo
    DELETE FROM reward_claims WHERE id = NEW.id;
    RETURN NULL;
  END IF;
  
  -- Retornar el nuevo registro
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear los triggers automáticos
DROP TRIGGER IF EXISTS on_behavior_record_created_trigger ON behavior_records;
CREATE TRIGGER on_behavior_record_created_trigger
  AFTER INSERT ON behavior_records
  FOR EACH ROW EXECUTE FUNCTION on_behavior_record_created();

DROP TRIGGER IF EXISTS on_habit_record_created_trigger ON habit_records;
CREATE TRIGGER on_habit_record_created_trigger
  AFTER INSERT OR UPDATE ON habit_records
  FOR EACH ROW EXECUTE FUNCTION on_habit_record_created();

DROP TRIGGER IF EXISTS on_reward_claimed_trigger ON reward_claims;
CREATE TRIGGER on_reward_claimed_trigger
  AFTER INSERT ON reward_claims
  FOR EACH ROW EXECUTE FUNCTION on_reward_claimed();

-- =====================================================
-- 7. FUNCIONES AUXILIARES DE AUTENTICACIÓN
-- =====================================================

-- Función para insertar usuario en la tabla users después del registro
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear trigger para nuevo usuario
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =====================================================
-- 8. POLÍTICAS RLS (ROW LEVEL SECURITY)
-- =====================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE children ENABLE ROW LEVEL SECURITY;
ALTER TABLE routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE behaviors ENABLE ROW LEVEL SECURITY;
ALTER TABLE behavior_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE routine_habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

-- Políticas para usuarios
DROP POLICY IF EXISTS "Users can view own profile" ON users;
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Políticas para hijos
DROP POLICY IF EXISTS "Parents can view their children" ON children;
CREATE POLICY "Parents can view their children" ON children
    FOR SELECT USING (auth.uid() = parent_id);

DROP POLICY IF EXISTS "Parents can insert their children" ON children;
CREATE POLICY "Parents can insert their children" ON children
    FOR INSERT WITH CHECK (auth.uid() = parent_id);

DROP POLICY IF EXISTS "Parents can update their children" ON children;
CREATE POLICY "Parents can update their children" ON children
    FOR UPDATE USING (auth.uid() = parent_id);

DROP POLICY IF EXISTS "Parents can delete their children" ON children;
CREATE POLICY "Parents can delete their children" ON children
    FOR DELETE USING (auth.uid() = parent_id);

-- Políticas para rutinas
DROP POLICY IF EXISTS "Parents can view their children's routines" ON routines;
CREATE POLICY "Parents can view their children's routines" ON routines
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM children 
            WHERE children.id = routines.child_id 
            AND children.parent_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Parents can insert their children's routines" ON routines;
CREATE POLICY "Parents can insert their children's routines" ON routines
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM children 
            WHERE children.id = routines.child_id 
            AND children.parent_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Parents can update their children's routines" ON routines;
CREATE POLICY "Parents can update their children's routines" ON routines
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM children 
            WHERE children.id = routines.child_id 
            AND children.parent_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Parents can delete their children's routines" ON routines;
CREATE POLICY "Parents can delete their children's routines" ON routines
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM children 
            WHERE children.id = routines.child_id 
            AND children.parent_id = auth.uid()
        )
    );

-- Políticas para hábitos
DROP POLICY IF EXISTS "Parents can view their children's habits" ON habits;
CREATE POLICY "Parents can view their children's habits" ON habits
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM children 
            WHERE children.id = habits.child_id 
            AND children.parent_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Parents can insert their children's habits" ON habits;
CREATE POLICY "Parents can insert their children's habits" ON habits
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM children 
            WHERE children.id = habits.child_id 
            AND children.parent_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Parents can update their children's habits" ON habits;
CREATE POLICY "Parents can update their children's habits" ON habits
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM children 
            WHERE children.id = habits.child_id 
            AND children.parent_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Parents can delete their children's habits" ON habits;
CREATE POLICY "Parents can delete their children's habits" ON habits
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM children 
            WHERE children.id = habits.child_id 
            AND children.parent_id = auth.uid()
        )
    );

-- Políticas para registros de hábitos
DROP POLICY IF EXISTS "Parents can view their children's habit records" ON habit_records;
CREATE POLICY "Parents can view their children's habit records" ON habit_records
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM habits 
            JOIN children ON children.id = habits.child_id 
            WHERE habits.id = habit_records.habit_id 
            AND children.parent_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Parents can insert their children's habit records" ON habit_records;
CREATE POLICY "Parents can insert their children's habit records" ON habit_records
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM habits 
            JOIN children ON children.id = habits.child_id 
            WHERE habits.id = habit_records.habit_id 
            AND children.parent_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Parents can update their children's habit records" ON habit_records;
CREATE POLICY "Parents can update their children's habit records" ON habit_records
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM habits 
            JOIN children ON children.id = habits.child_id 
            WHERE habits.id = habit_records.habit_id 
            AND children.parent_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Parents can delete their children's habit records" ON habit_records;
CREATE POLICY "Parents can delete their children's habit records" ON habit_records
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM habits 
            JOIN children ON children.id = habits.child_id 
            WHERE habits.id = habit_records.habit_id 
            AND children.parent_id = auth.uid()
        )
    );

-- Políticas para comportamientos
DROP POLICY IF EXISTS "Parents can view their children's behaviors" ON behaviors;
CREATE POLICY "Parents can view their children's behaviors" ON behaviors
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM children 
            WHERE children.id = behaviors.child_id 
            AND children.parent_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Parents can insert their children's behaviors" ON behaviors;
CREATE POLICY "Parents can insert their children's behaviors" ON behaviors
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM children 
            WHERE children.id = behaviors.child_id 
            AND children.parent_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Parents can update their children's behaviors" ON behaviors;
CREATE POLICY "Parents can update their children's behaviors" ON behaviors
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM children 
            WHERE children.id = behaviors.child_id 
            AND children.parent_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Parents can delete their children's behaviors" ON behaviors;
CREATE POLICY "Parents can delete their children's behaviors" ON behaviors
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM children 
            WHERE children.id = behaviors.child_id 
            AND children.parent_id = auth.uid()
        )
    );

-- Políticas para registros de comportamientos
DROP POLICY IF EXISTS "Parents can view their children's behavior records" ON behavior_records;
CREATE POLICY "Parents can view their children's behavior records" ON behavior_records
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM behaviors 
            JOIN children ON children.id = behaviors.child_id 
            WHERE behaviors.id = behavior_records.behavior_id 
            AND children.parent_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Parents can insert their children's behavior records" ON behavior_records;
CREATE POLICY "Parents can insert their children's behavior records" ON behavior_records
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM behaviors 
            JOIN children ON children.id = behaviors.child_id 
            WHERE behaviors.id = behavior_records.behavior_id 
            AND children.parent_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Parents can delete their children's behavior records" ON behavior_records;
CREATE POLICY "Parents can delete their children's behavior records" ON behavior_records
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM behaviors 
            JOIN children ON children.id = behaviors.child_id 
            WHERE behaviors.id = behavior_records.behavior_id 
            AND children.parent_id = auth.uid()
        )
    );

-- Políticas para recompensas
DROP POLICY IF EXISTS "Parents can view their children's rewards" ON rewards;
CREATE POLICY "Parents can view their children's rewards" ON rewards
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM children 
            WHERE children.id = rewards.child_id 
            AND children.parent_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Parents can insert their children's rewards" ON rewards;
CREATE POLICY "Parents can insert their children's rewards" ON rewards
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM children 
            WHERE children.id = rewards.child_id 
            AND children.parent_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Parents can update their children's rewards" ON rewards;
CREATE POLICY "Parents can update their children's rewards" ON rewards
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM children 
            WHERE children.id = rewards.child_id 
            AND children.parent_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Parents can delete their children's rewards" ON rewards;
CREATE POLICY "Parents can delete their children's rewards" ON rewards
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM children 
            WHERE children.id = rewards.child_id 
            AND children.parent_id = auth.uid()
        )
    );

-- Políticas para reclamos de recompensas
DROP POLICY IF EXISTS "Parents can view their children's reward claims" ON reward_claims;
CREATE POLICY "Parents can view their children's reward claims" ON reward_claims
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM rewards 
            JOIN children ON children.id = rewards.child_id 
            WHERE rewards.id = reward_claims.reward_id 
            AND children.parent_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Parents can insert their children's reward claims" ON reward_claims;
CREATE POLICY "Parents can insert their children's reward claims" ON reward_claims
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM rewards 
            JOIN children ON children.id = rewards.child_id 
            WHERE rewards.id = reward_claims.reward_id 
            AND children.parent_id = auth.uid()
        )
    );

-- Políticas para transacciones de puntos
DROP POLICY IF EXISTS "Parents can view their children's point transactions" ON points_transactions;
CREATE POLICY "Parents can view their children's point transactions" ON points_transactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM children
            WHERE children.id = points_transactions.child_id
            AND children.parent_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Parents can insert their children's point transactions" ON points_transactions;
CREATE POLICY "Parents can insert their children's point transactions" ON points_transactions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM children
            WHERE children.id = points_transactions.child_id
            AND children.parent_id = auth.uid()
        )
    );

-- Políticas para hábitos de rutina
DROP POLICY IF EXISTS "Parents can view their children's routine habits" ON routine_habits;
CREATE POLICY "Parents can view their children's routine habits" ON routine_habits
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM routines
            JOIN children ON children.id = routines.child_id
            WHERE routines.id = routine_habits.routine_id
            AND children.parent_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Parents can insert their children's routine habits" ON routine_habits;
CREATE POLICY "Parents can insert their children's routine habits" ON routine_habits
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM routines
            JOIN children ON children.id = routines.child_id
            WHERE routines.id = routine_habits.routine_id
            AND children.parent_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Parents can update their children's routine habits" ON routine_habits;
CREATE POLICY "Parents can update their children's routine habits" ON routine_habits
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM routines
            JOIN children ON children.id = routines.child_id
            WHERE routines.id = routine_habits.routine_id
            AND children.parent_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Parents can delete their children's routine habits" ON routine_habits;
CREATE POLICY "Parents can delete their children's routine habits" ON routine_habits
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM routines
            JOIN children ON children.id = routines.child_id
            WHERE routines.id = routine_habits.routine_id
            AND children.parent_id = auth.uid()
        )
    );

-- Políticas para recursos (todos pueden ver los recursos activos)
DROP POLICY IF EXISTS "Everyone can view active resources" ON resources;
CREATE POLICY "Everyone can view active resources" ON resources
    FOR SELECT USING (is_active = true);

-- =====================================================
-- 9. DATOS INICIALES (RECURSOS EDUCATIVOS)
-- =====================================================

-- Insertar recursos educativos iniciales
INSERT INTO resources (title, content, category, type) VALUES
('Estableciendo Rutinas Efectivas', 'Las rutinas son fundamentales para los niños con TDAH. Establece horarios consistentes para las actividades diarias como despertarse, comer, hacer tareas y dormir. Usa calendarios visuales y listas de tareas para ayudar a tu hijo a organizarse.', 'ROUTINES', 'ARTICLE'),
('La Importancia del Sueño', 'Un sueño adecuado es crucial para los niños con TDAH. Establece una rutina de sueño relajante, limita el tiempo de pantalla antes de dormir y asegúrate de que el niño duerma las horas recomendadas para su edad.', 'HABITS', 'TIP'),
('Ejercicio Físico y TDAH', 'El ejercicio regular ayuda a canalizar la energía excesiva y mejora la concentración. Fomenta actividades deportivas que tu hijo disfrute, como nadar, correr o practicar deportes de equipo.', 'HABITS', 'ARTICLE'),
('Técnicas de Refuerzo Positivo', 'Reconoce y elogia los comportamientos positivos de tu hijo. Usa sistemas de recompensas como puntos o fichas que puedan canjearse por actividades especiales. Sé específico en tus elogios y sé consistente.', 'BEHAVIOR', 'ARTICLE'),
('Manejo de Emociones', 'Enseña a tu hijo a identificar y expresar sus emociones de manera saludable. Usa técnicas de respiración y cuenta hasta 10 para manejar la frustración. Valida sus sentimientos y ayúdalo a encontrar soluciones constructivas.', 'EMOTIONAL', 'TIP'),
('Comunicación Efectiva', 'Mantén una comunicación abierta y empática con tu hijo. Escucha activamente, evita las críticas constantes y enfócate en los esfuerzos más que en los resultados. Dedica tiempo de calidad sin distracciones.', 'EMOTIONAL', 'ARTICLE'),
('Organización y Planificación', 'Ayuda a tu hijo a desarrollar habilidades de organización usando calendarios visuales, listas de tareas y agendas. Enseña a dividir tareas grandes en pasos más pequeños y manejables.', 'EDUCATIONAL', 'ARTICLE'),
('Alimentación Saludable', 'Aunque no existe una dieta específica para el TDAH, una alimentación equilibrada puede ayudar. Limita azúcares y colorantes artificiales, y asegúrate de incluir frutas, verduras y pescado rico en omega-3.', 'HABITS', 'TIP')
ON CONFLICT DO NOTHING;

-- =====================================================
-- 10. VERIFICACIÓN FINAL
-- =====================================================

-- Verificar que todas las tablas se hayan creado correctamente
SELECT 'Tablas creadas exitosamente:' AS info;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
  AND table_name IN (
    'users', 'children', 'routines', 'habits', 'habit_records',
    'behaviors', 'behavior_records', 'rewards', 'reward_claims',
    'points_transactions', 'routine_habits', 'resources'
  )
ORDER BY table_name;

-- Verificar que todas las funciones se hayan creado correctamente
SELECT '';
SELECT 'Funciones del sistema de puntos creadas exitosamente:' AS info;
SELECT proname AS function_name
FROM pg_proc 
WHERE proname LIKE '%points%' 
   OR proname LIKE 'handle_points_transaction'
   OR proname LIKE 'get_child_points_%'
   OR proname LIKE 'adjust_child_points'
ORDER BY proname;

-- Verificar que todos los triggers se hayan creado correctamente
SELECT '';
SELECT 'Triggers del sistema de puntos creados exitosamente:' AS info;
SELECT tgname AS trigger_name,
       tgrelid::regclass AS table_name
FROM pg_trigger 
WHERE tgname LIKE '%points%' 
   OR tgname LIKE '%behavior%'
   OR tgname LIKE '%habit%'
   OR tgname LIKE '%reward%'
ORDER BY tgrelid::regclass, tgname;

-- Verificar que todas las políticas RLS se hayan creado correctamente
SELECT '';
SELECT 'Políticas RLS creadas exitosamente:' AS info;
SELECT schemaname,
       tablename,
       policyname,
       permissive,
       cmd
FROM pg_policies 
WHERE tablename IN (
  'users', 'children', 'routines', 'habits', 'habit_records',
  'behaviors', 'behavior_records', 'rewards', 'reward_claims',
  'points_transactions', 'routine_habits', 'resources'
)
ORDER BY tablename, policyname;

-- Mensaje final
SELECT '';
SELECT '====================================================' AS info;
SELECT 'CONFIGURACIÓN COMPLETA DE LA BASE DE DATOS FINALIZADA' AS info;
SELECT '====================================================' AS info;
SELECT 'El Sistema de Refuerzo Integral está listo para usarse' AS info;
SELECT '' AS info;
SELECT 'Próximos pasos:' AS info;
SELECT '1. Configurar las variables de entorno en la aplicación' AS info;
SELECT '2. Ejecutar las pruebas de integración y seguridad' AS info;
SELECT '3. Verificar que los endpoints de API funcionen correctamente' AS info;
SELECT '====================================================' AS info;