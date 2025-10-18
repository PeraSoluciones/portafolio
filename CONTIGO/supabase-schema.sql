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

-- Crear tabla de rutinas
CREATE TABLE routines (
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