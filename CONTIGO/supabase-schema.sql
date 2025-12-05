-- Crear tabla de usuarios
CREATE TABLE users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de hijos
CREATE TABLE children (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  birth_date DATE NOT NULL,
  avatar_url TEXT,
  adhd_type TEXT NOT NULL CHECK (adhd_type IN ('INATTENTIVE', 'HYPERACTIVE', 'COMBINED')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agregar columna de saldo de puntos a la tabla hijos
ALTER TABLE children ADD COLUMN points_balance INTEGER DEFAULT 0 CHECK (points_balance >= 0);

-- Crear tabla de rutinas
CREATE TABLE routines (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  time TEXT NOT NULL, -- Formato HH:MM
  days TEXT[] NOT NULL, -- Array de días ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de hábitos
CREATE TABLE habits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('SLEEP', 'NUTRITION', 'EXERCISE', 'HYGIENE', 'SOCIAL')),
  target_frequency INTEGER NOT NULL CHECK (target_frequency > 0),
  unit TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de registros de hábitos
CREATE TABLE habit_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  value INTEGER NOT NULL CHECK (value >= 0),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(habit_id, date)
);

-- Crear tabla de comportamientos
CREATE TABLE behaviors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('POSITIVE', 'NEGATIVE')),
  points INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cambiar el nombre de la columna points a points_value y mantener compatibilidad
ALTER TABLE behaviors RENAME COLUMN points TO points_value;

-- Crear tabla de registros de comportamientos
CREATE TABLE behavior_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  behavior_id UUID NOT NULL REFERENCES behaviors(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de recompensas
CREATE TABLE rewards (
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
CREATE TABLE reward_claims (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reward_id UUID NOT NULL REFERENCES rewards(id) ON DELETE CASCADE,
  claimed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT
);

-- Crear tabla de transacciones de puntos
CREATE TABLE points_transactions (
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
CREATE TABLE routine_habits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  routine_id UUID NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
  habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  points_value INTEGER DEFAULT 0,
  is_required BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(routine_id, habit_id)
);

-- Crear tabla de recursos educativos
CREATE TABLE resources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('ROUTINES', 'HABITS', 'BEHAVIOR', 'EMOTIONAL', 'EDUCATIONAL')),
  type TEXT NOT NULL CHECK (type IN ('ARTICLE', 'VIDEO', 'TIP')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear triggers para actualizar updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_children_updated_at BEFORE UPDATE ON children
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_routines_updated_at BEFORE UPDATE ON routines
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_habits_updated_at BEFORE UPDATE ON habits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_behaviors_updated_at BEFORE UPDATE ON behaviors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rewards_updated_at BEFORE UPDATE ON rewards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resources_updated_at BEFORE UPDATE ON resources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_points_transactions_updated_at BEFORE UPDATE ON points_transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_routine_habits_updated_at BEFORE UPDATE ON routine_habits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Crear políticas RLS (Row Level Security)
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

-- Políticas para usuarios
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Políticas para hijos
CREATE POLICY "Parents can view their children" ON children
    FOR SELECT USING (auth.uid() = parent_id);

CREATE POLICY "Parents can insert their children" ON children
    FOR INSERT WITH CHECK (auth.uid() = parent_id);

CREATE POLICY "Parents can update their children" ON children
    FOR UPDATE USING (auth.uid() = parent_id);

CREATE POLICY "Parents can delete their children" ON children
    FOR DELETE USING (auth.uid() = parent_id);

-- Políticas para rutinas
CREATE POLICY "Parents can view their children's routines" ON routines
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM children 
            WHERE children.id = routines.child_id 
            AND children.parent_id = auth.uid()
        )
    );

CREATE POLICY "Parents can insert their children's routines" ON routines
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM children 
            WHERE children.id = routines.child_id 
            AND children.parent_id = auth.uid()
        )
    );

CREATE POLICY "Parents can update their children's routines" ON routines
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM children 
            WHERE children.id = routines.child_id 
            AND children.parent_id = auth.uid()
        )
    );

CREATE POLICY "Parents can delete their children's routines" ON routines
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM children 
            WHERE children.id = routines.child_id 
            AND children.parent_id = auth.uid()
        )
    );

-- Políticas para hábitos
CREATE POLICY "Parents can view their children's habits" ON habits
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM children 
            WHERE children.id = habits.child_id 
            AND children.parent_id = auth.uid()
        )
    );

CREATE POLICY "Parents can insert their children's habits" ON habits
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM children 
            WHERE children.id = habits.child_id 
            AND children.parent_id = auth.uid()
        )
    );

CREATE POLICY "Parents can update their children's habits" ON habits
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM children 
            WHERE children.id = habits.child_id 
            AND children.parent_id = auth.uid()
        )
    );

CREATE POLICY "Parents can delete their children's habits" ON habits
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM children 
            WHERE children.id = habits.child_id 
            AND children.parent_id = auth.uid()
        )
    );

-- Políticas para registros de hábitos
CREATE POLICY "Parents can view their children's habit records" ON habit_records
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM habits 
            JOIN children ON children.id = habits.child_id 
            WHERE habits.id = habit_records.habit_id 
            AND children.parent_id = auth.uid()
        )
    );

CREATE POLICY "Parents can insert their children's habit records" ON habit_records
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM habits 
            JOIN children ON children.id = habits.child_id 
            WHERE habits.id = habit_records.habit_id 
            AND children.parent_id = auth.uid()
        )
    );

CREATE POLICY "Parents can update their children's habit records" ON habit_records
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM habits 
            JOIN children ON children.id = habits.child_id 
            WHERE habits.id = habit_records.habit_id 
            AND children.parent_id = auth.uid()
        )
    );

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
CREATE POLICY "Parents can view their children's behaviors" ON behaviors
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM children 
            WHERE children.id = behaviors.child_id 
            AND children.parent_id = auth.uid()
        )
    );

CREATE POLICY "Parents can insert their children's behaviors" ON behaviors
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM children 
            WHERE children.id = behaviors.child_id 
            AND children.parent_id = auth.uid()
        )
    );

CREATE POLICY "Parents can update their children's behaviors" ON behaviors
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM children 
            WHERE children.id = behaviors.child_id 
            AND children.parent_id = auth.uid()
        )
    );

CREATE POLICY "Parents can delete their children's behaviors" ON behaviors
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM children 
            WHERE children.id = behaviors.child_id 
            AND children.parent_id = auth.uid()
        )
    );

-- Políticas para registros de comportamientos
CREATE POLICY "Parents can view their children's behavior records" ON behavior_records
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM behaviors 
            JOIN children ON children.id = behaviors.child_id 
            WHERE behaviors.id = behavior_records.behavior_id 
            AND children.parent_id = auth.uid()
        )
    );

CREATE POLICY "Parents can insert their children's behavior records" ON behavior_records
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM behaviors 
            JOIN children ON children.id = behaviors.child_id 
            WHERE behaviors.id = behavior_records.behavior_id 
            AND children.parent_id = auth.uid()
        )
    );

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
CREATE POLICY "Parents can view their children's rewards" ON rewards
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM children 
            WHERE children.id = rewards.child_id 
            AND children.parent_id = auth.uid()
        )
    );

CREATE POLICY "Parents can insert their children's rewards" ON rewards
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM children 
            WHERE children.id = rewards.child_id 
            AND children.parent_id = auth.uid()
        )
    );

CREATE POLICY "Parents can update their children's rewards" ON rewards
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM children 
            WHERE children.id = rewards.child_id 
            AND children.parent_id = auth.uid()
        )
    );

CREATE POLICY "Parents can delete their children's rewards" ON rewards
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM children 
            WHERE children.id = rewards.child_id 
            AND children.parent_id = auth.uid()
        )
    );

-- Políticas para reclamos de recompensas
CREATE POLICY "Parents can view their children's reward claims" ON reward_claims
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM rewards 
            JOIN children ON children.id = rewards.child_id 
            WHERE rewards.id = reward_claims.reward_id 
            AND children.parent_id = auth.uid()
        )
    );

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
CREATE POLICY "Parents can view their children's point transactions" ON points_transactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM children
            WHERE children.id = points_transactions.child_id
            AND children.parent_id = auth.uid()
        )
    );

CREATE POLICY "Parents can insert their children's point transactions" ON points_transactions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM children
            WHERE children.id = points_transactions.child_id
            AND children.parent_id = auth.uid()
        )
    );

-- Políticas para hábitos de rutina
CREATE POLICY "Parents can view their children's routine habits" ON routine_habits
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM routines
            JOIN children ON children.id = routines.child_id
            WHERE routines.id = routine_habits.routine_id
            AND children.parent_id = auth.uid()
        )
    );

CREATE POLICY "Parents can insert their children's routine habits" ON routine_habits
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM routines
            JOIN children ON children.id = routines.child_id
            WHERE routines.id = routine_habits.routine_id
            AND children.parent_id = auth.uid()
        )
    );

CREATE POLICY "Parents can update their children's routine habits" ON routine_habits
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM routines
            JOIN children ON children.id = routines.child_id
            WHERE routines.id = routine_habits.routine_id
            AND children.parent_id = auth.uid()
        )
    );

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
CREATE POLICY "Everyone can view active resources" ON resources
    FOR SELECT USING (is_active = true);

-- Crear función para insertar usuario en la tabla users después del registro
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear trigger para nuevo usuario
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Función para crear transacción de puntos y actualizar saldo del niño
CREATE OR REPLACE FUNCTION create_points_transaction(
  p_child_id UUID,
  p_transaction_type TEXT,
  p_related_id UUID,
  p_points INTEGER,
  p_description TEXT
)
RETURNS VOID AS $$
DECLARE
  current_balance INTEGER;
  new_balance INTEGER;
BEGIN
  -- Obtener el saldo actual del niño
  SELECT points_balance INTO current_balance
  FROM children
  WHERE id = p_child_id;
  
  -- Calcular el nuevo saldo
  new_balance := current_balance + p_points;
  
  -- Verificar que el saldo no sea negativo
  IF new_balance < 0 THEN
    RAISE EXCEPTION 'Saldo de puntos insuficiente';
  END IF;
  
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
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para asignar puntos cuando se registra un comportamiento
CREATE OR REPLACE FUNCTION award_behavior_points()
RETURNS TRIGGER AS $$
BEGIN
  -- Obtener los detalles del comportamiento
  DECLARE
    behavior_points INTEGER;
    child_id UUID;
  BEGIN
    SELECT b.points_value, b.child_id INTO behavior_points, child_id
    FROM behaviors b
    WHERE b.id = NEW.behavior_id;
    
    -- Crear transacción de puntos
    PERFORM create_points_transaction(
      child_id,
      'BEHAVIOR',
      NEW.behavior_id,
      behavior_points,
      'Puntos por comportamiento: ' || (SELECT title FROM behaviors WHERE id = NEW.behavior_id)
    );
    
    RETURN NEW;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para asignar puntos cuando se registra un hábito
CREATE OR REPLACE FUNCTION award_habit_points()
RETURNS TRIGGER AS $$
BEGIN
  -- Verificar si el hábito tiene puntos asignados a través de rutinas
  DECLARE
    total_points INTEGER := 0;
    habit_child_id UUID;
    habit_title TEXT;
  BEGIN
    -- Obtener información del hábito
    SELECT h.child_id, h.title INTO habit_child_id, habit_title
    FROM habits h
    WHERE h.id = NEW.habit_id;
    
    -- Sumar puntos de todas las rutinas que incluyen este hábito
    SELECT COALESCE(SUM(rh.points_value), 0) INTO total_points
    FROM routine_habits rh
    JOIN routines r ON r.id = rh.routine_id
    WHERE rh.habit_id = NEW.habit_id
    AND r.is_active = true
    AND rh.points_value > 0;
    
    -- Si hay puntos asignados, crear la transacción
    IF total_points > 0 THEN
      PERFORM create_points_transaction(
        habit_child_id,
        'HABIT',
        NEW.habit_id,
        total_points,
        'Puntos por hábito completado: ' || habit_title
      );
    END IF;
    
    RETURN NEW;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para descontar puntos cuando se reclama una recompensa
CREATE OR REPLACE FUNCTION deduct_reward_points()
RETURNS TRIGGER AS $$
BEGIN
  DECLARE
    reward_points INTEGER;
    child_id UUID;
    reward_title TEXT;
  BEGIN
    -- Obtener detalles de la recompensa
    SELECT r.points_required, r.child_id, r.title INTO reward_points, child_id, reward_title
    FROM rewards r
    WHERE r.id = NEW.reward_id;
    
    -- Crear transacción de puntos (negativa)
    PERFORM create_points_transaction(
      child_id,
      'REWARD_REDEMPTION',
      NEW.reward_id,
      -reward_points,
      'Canjeo de recompensa: ' || reward_title
    );
    
    RETURN NEW;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear los triggers automáticos
CREATE TRIGGER award_behavior_points_trigger
  AFTER INSERT ON behavior_records
  FOR EACH ROW EXECUTE FUNCTION award_behavior_points();

CREATE TRIGGER award_habit_points_trigger
  AFTER INSERT ON habit_records
  FOR EACH ROW EXECUTE FUNCTION award_habit_points();

CREATE TRIGGER deduct_reward_points_trigger
  AFTER INSERT ON reward_claims
  FOR EACH ROW EXECUTE FUNCTION deduct_reward_points();

-- Función para obtener el balance de puntos actual de un niño
CREATE OR REPLACE FUNCTION get_child_points_balance(p_child_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN points_balance FROM children WHERE id = p_child_id;
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
  p_description TEXT
)
RETURNS VOID AS $$
BEGIN
  -- Verificar que el usuario actual sea el padre del niño
  IF NOT EXISTS (
    SELECT 1 FROM children
    WHERE id = p_child_id
    AND parent_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'No tienes permiso para ajustar los puntos de este niño';
  END IF;
  
  -- Crear la transacción de ajuste
  PERFORM create_points_transaction(
    p_child_id,
    'ADJUSTMENT',
    NULL,
    p_points,
    COALESCE(p_description, 'Ajuste manual de puntos')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insertar recursos educativos iniciales
INSERT INTO resources (title, content, category, type) VALUES
('Estableciendo Rutinas Efectivas', 'Las rutinas son fundamentales para los niños con TDAH. Establece horarios consistentes para las actividades diarias como despertarse, comer, hacer tareas y dormir. Usa calendarios visuales y listas de tareas para ayudar a tu hijo a organizarse.', 'ROUTINES', 'ARTICLE'),
('La Importancia del Sueño', 'Un sueño adecuado es crucial para los niños con TDAH. Establece una rutina de sueño relajante, limita el tiempo de pantalla antes de dormir y asegúrate de que el niño duerma las horas recomendadas para su edad.', 'HABITS', 'TIP'),
('Ejercicio Físico y TDAH', 'El ejercicio regular ayuda a canalizar la energía excesiva y mejora la concentración. Fomenta actividades deportivas que tu hijo disfrute, como nadar, correr o practicar deportes de equipo.', 'HABITS', 'ARTICLE'),
('Técnicas de Refuerzo Positivo', 'Reconoce y elogia los comportamientos positivos de tu hijo. Usa sistemas de recompensas como puntos o fichas que puedan canjearse por actividades especiales. Sé específico en tus elogios y sé consistente.', 'BEHAVIOR', 'ARTICLE'),
('Manejo de Emociones', 'Enseña a tu hijo a identificar y expresar sus emociones de manera saludable. Usa técnicas de respiración y cuenta hasta 10 para manejar la frustración. Valida sus sentimientos y ayúdalo a encontrar soluciones constructivas.', 'EMOTIONAL', 'TIP'),
('Comunicación Efectiva', 'Mantén una comunicación abierta y empática con tu hijo. Escucha activamente, evita las críticas constantes y enfócate en los esfuerzos más que en los resultados. Dedica tiempo de calidad sin distracciones.', 'EMOTIONAL', 'ARTICLE'),
('Organización y Planificación', 'Ayuda a tu hijo a desarrollar habilidades de organización usando calendarios visuales, listas de tareas y agendas. Enseña a dividir tareas grandes en pasos más pequeños y manejables.', 'EDUCATIONAL', 'ARTICLE'),
('Alimentación Saludable', 'Aunque no existe una dieta específica para el TDAH, una alimentación equilibrada puede ayudar. Limita azúcares y colorantes artificiales, y asegúrate de incluir frutas, verduras y pescado rico en omega-3.', 'HABITS', 'TIP');