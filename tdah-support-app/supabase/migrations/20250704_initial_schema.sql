-- TDAH Support App - Initial Schema and Policies
-- version 1.0

-- 1. ENUM Types Definition
CREATE TYPE public.behavior_type AS ENUM ('positive', 'to_improve');
CREATE TYPE public.goal_status AS ENUM ('in_progress', 'completed');
CREATE TYPE public.behavior_context AS ENUM ('Casa', 'Escuela', 'Extracurricular', 'Público', 'Otro');

-- 2. Table Creation

-- Parents/Profiles Table (links to auth.users)
CREATE TABLE public.parents (
    id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email character varying(255)
);

-- Children Table
CREATE TABLE public.children (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    parent_id uuid NOT NULL REFERENCES public.parents(id) ON DELETE CASCADE,
    name character varying(255) NOT NULL,
    date_of_birth date,
    avatar_url text
);

-- Behaviors Table (System and Custom)
CREATE TABLE public.behaviors (
    id serial PRIMARY KEY,
    name character varying(255) NOT NULL,
    description text,
    type public.behavior_type NOT NULL,
    points_value integer NOT NULL DEFAULT 0,
    is_custom boolean NOT NULL DEFAULT false,
    parent_id uuid REFERENCES public.parents(id) ON DELETE CASCADE
);
-- Add constraint to ensure custom behaviors have a parent
ALTER TABLE public.behaviors ADD CONSTRAINT custom_behavior_must_have_parent CHECK (NOT is_custom OR parent_id IS NOT NULL);

-- Behavior Links Table
CREATE TABLE public.behavior_links (
    to_improve_behavior_id integer NOT NULL REFERENCES public.behaviors(id) ON DELETE CASCADE,
    positive_behavior_id integer NOT NULL REFERENCES public.behaviors(id) ON DELETE CASCADE,
    PRIMARY KEY (to_improve_behavior_id, positive_behavior_id)
);

-- Rewards Table (System and Custom)
CREATE TABLE public.rewards (
    id serial PRIMARY KEY,
    name character varying(255) NOT NULL,
    points_cost integer NOT NULL DEFAULT 0,
    is_custom boolean NOT NULL DEFAULT false,
    parent_id uuid REFERENCES public.parents(id) ON DELETE CASCADE
);
-- Add constraint to ensure custom rewards have a parent
ALTER TABLE public.rewards ADD CONSTRAINT custom_reward_must_have_parent CHECK (NOT is_custom OR parent_id IS NOT NULL);

-- Goals Table
CREATE TABLE public.goals (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    child_id uuid NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
    name character varying(255) NOT NULL,
    description text,
    target_points integer NOT NULL,
    current_points integer NOT NULL DEFAULT 0,
    status public.goal_status NOT NULL DEFAULT 'in_progress',
    reward_description text
);

-- Behavior Records Table
CREATE TABLE public.behavior_records (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    child_id uuid NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
    behavior_id integer NOT NULL REFERENCES public.behaviors(id) ON DELETE CASCADE,
    context public.behavior_context,
    recorded_at timestamptz NOT NULL DEFAULT now(),
    points_awarded integer NOT NULL,
    notes text
);

-- Reward Redemptions Table
CREATE TABLE public.reward_redemptions (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    child_id uuid NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
    reward_id integer NOT NULL REFERENCES public.rewards(id) ON DELETE CASCADE,
    redeemed_at timestamptz NOT NULL DEFAULT now(),
    points_spent integer NOT NULL
);


-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.behaviors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.behavior_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_redemptions ENABLE ROW LEVEL SECURITY;
-- behavior_links is system data, no RLS needed.

-- 4. RLS Policies

-- Function to get the current user's ID
CREATE OR REPLACE FUNCTION auth.current_user_id()
RETURNS uuid AS $$
  SELECT auth.uid();
$$ LANGUAGE sql STABLE;


-- Policies for 'parents' table
CREATE POLICY "Parents can view and edit their own profile."
    ON public.parents FOR ALL
    USING (id = auth.current_user_id())
    WITH CHECK (id = auth.current_user_id());

-- Policies for 'children' table
CREATE POLICY "Parents can CRUD their own children."
    ON public.children FOR ALL
    USING (parent_id = auth.current_user_id())
    WITH CHECK (parent_id = auth.current_user_id());

-- Policies for 'behaviors' table
CREATE POLICY "Users can see system behaviors and their own custom ones."
    ON public.behaviors FOR SELECT
    USING (is_custom = false OR parent_id = auth.current_user_id());
CREATE POLICY "Users can create custom behaviors for themselves."
    ON public.behaviors FOR INSERT
    WITH CHECK (is_custom = true AND parent_id = auth.current_user_id());
CREATE POLICY "Users can update/delete their own custom behaviors."
    ON public.behaviors FOR UPDATE, DELETE
    USING (is_custom = true AND parent_id = auth.current_user_id());

-- Policies for 'rewards' table (similar to behaviors)
CREATE POLICY "Users can see system rewards and their own custom ones."
    ON public.rewards FOR SELECT
    USING (is_custom = false OR parent_id = auth.current_user_id());
CREATE POLICY "Users can create custom rewards for themselves."
    ON public.rewards FOR INSERT
    WITH CHECK (is_custom = true AND parent_id = auth.current_user_id());
CREATE POLICY "Users can update/delete their own custom rewards."
    ON public.rewards FOR UPDATE, DELETE
    USING (is_custom = true AND parent_id = auth.current_user_id());

-- Policies for tables linked to 'children'
CREATE POLICY "Parents can CRUD records related to their own children."
    ON public.goals FOR ALL
    USING ( (SELECT parent_id FROM public.children WHERE id = child_id) = auth.current_user_id() )
    WITH CHECK ( (SELECT parent_id FROM public.children WHERE id = child_id) = auth.current_user_id() );

CREATE POLICY "Parents can CRUD records related to their own children."
    ON public.behavior_records FOR ALL
    USING ( (SELECT parent_id FROM public.children WHERE id = child_id) = auth.current_user_id() )
    WITH CHECK ( (SELECT parent_id FROM public.children WHERE id = child_id) = auth.current_user_id() );

CREATE POLICY "Parents can CRUD records related to their own children."
    ON public.reward_redemptions FOR ALL
    USING ( (SELECT parent_id FROM public.children WHERE id = child_id) = auth.current_user_id() )
    WITH CHECK ( (SELECT parent_id FROM public.children WHERE id = child_id) = auth.current_user_id() );


-- 5. Seed Data

-- Seed 'behaviors' table
INSERT INTO public.behaviors (id, name, type, description, points_value, is_custom) VALUES
-- Gestión de Emociones
(101, 'Tuvo un arrebato de ira', 'to_improve', 'Gritó, tiró objetos o se enfadó de forma desproporcionada.', -5, false),
(201, 'Expresó sus sentimientos con calma', 'positive', 'Usó palabras para decir que estaba enfadado o frustrado.', 10, false),
(202, 'Usó una técnica de relajación', 'positive', 'Practicó la respiración profunda o se tomó un momento a solas.', 15, false),
-- Tareas y Responsabilidades
(102, 'No completó la tarea asignada', 'to_improve', 'Dejó una tarea (escolar o del hogar) sin terminar.', -5, false),
(103, 'Se distrajo durante la tarea', 'to_improve', 'Perdió la concentración y no continuó con la actividad.', -5, false),
(203, 'Terminó la tarea a tiempo', 'positive', 'Completó la tarea asignada en el tiempo esperado.', 10, false),
(204, 'Pidió ayuda cuando la necesitó', 'positive', 'En lugar de rendirse, buscó ayuda de un adulto.', 10, false),
(205, 'Trabajó de forma enfocada', 'positive', 'Mantuvo la concentración en una tarea por un período.', 15, false),
-- Habilidades Sociales
(104, 'Interrumpió a otros al hablar', 'to_improve', 'No esperó su turno para hablar en una conversación.', -5, false),
(206, 'Esperó su turno para hablar', 'positive', 'Escuchó a los demás y esperó a que terminaran para hablar.', 10, false),
(207, 'Compartió sus juguetes/materiales', 'positive', 'Ofreció compartir con otros de manera proactiva.', 10, false);

-- Seed 'behavior_links' table
INSERT INTO public.behavior_links (to_improve_behavior_id, positive_behavior_id) VALUES
-- Vínculos para 'Arrebato de ira'
(101, 201),
(101, 202),
-- Vínculos para 'No completar tarea'
(102, 203),
(102, 204),
-- Vínculos para 'Distracción'
(103, 205),
-- Vínculos para 'Interrumpir'
(104, 206);

-- Seed 'rewards' table
INSERT INTO public.rewards (id, name, points_cost, is_custom) VALUES
(1, '30 minutos de videojuegos', 50, false),
(2, 'Ver una película en familia', 100, false),
(3, 'Elegir la cena del viernes', 150, false),
(4, 'Una hora extra antes de dormir', 200, false);
