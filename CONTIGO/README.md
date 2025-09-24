# 🚀 CONTIGO - Aplicación para Padres de Niños con TDAH

Una aplicación web moderna y visualmente atractiva diseñada específicamente para padres de niños con TDAH, enfocada en la parte psicosocial y conductual.

## ✨ Características Principales

### 👥 Gestión de Perfiles
- **Perfiles de hijos**: Crea y gestiona perfiles individuales para cada hijo
- **Tipos de TDAH**: Soporte para tipos inatento, hiperactivo y combinado
- **Información personal**: Seguimiento de edad, fecha de nacimiento y preferencias

### 📅 Sistema de Rutinas
- **Rutinas diarias**: Crea horarios estructurados para actividades diarias
- **Días de la semana**: Configura rutinas específicas para cada día
- **Activación/Desactivación**: Controla qué rutinas están activas
- **Horarios flexibles**: Establece horas específicas para cada actividad

### 🎯 Seguimiento de Hábitos
- **Hábitos saludables**: Monitoriza sueño, nutrición, ejercicio, higiene y social
- **Objetivos personalizables**: Establece metas diarias con unidades de medida
- **Progreso visual**: Indicadores de progreso y cumplimiento diario
- **Categorías organizadas**: Clasificación por tipo de hábito

### ⭐ Sistema de Comportamientos
- **Registro de comportamientos**: Documenta comportamientos positivos y negativos
- **Sistema de puntos**: Asigna puntos para reforzar conductas positivas
- **Seguimiento histórico**: Registro de comportamientos a lo largo del tiempo

### 🎁 Sistema de Recompensas
- **Catálogo de recompensas**: Crea recompensas personalizadas
- **Puntos requeridos**: Establece el costo en puntos para cada recompensa
- **Canje de recompensas**: Sistema para reclamar recompensas acumuladas

### 📚 Recursos Educativos
- **Artículos especializados**: Contenido sobre manejo del TDAH
- **Consejos prácticos**: Recomendaciones diarias para padres
- **Categorías temáticas**: Rutinas, hábitos, comportamiento, emocional y educativo
- **Contenido curado**: Información validada y actualizada

## 🛠️ Tecnología Utilizada

### Frontend
- **⚡ Next.js 15** - Framework React con App Router
- **📘 TypeScript 5** - Tipado estático para mayor seguridad
- **🎨 Tailwind CSS 4** - Framework de CSS utility-first
- **🧩 shadcn/ui** - Componentes accesibles y modernos
- **🐻 Zustand** - Gestión de estado ligera y escalable
- **🔄 TanStack Query** - Gestión de estado del servidor

### Backend
- **🔐 Supabase** - Backend como servicio con autenticación
- **🗄️ PostgreSQL** - Base de datos relacional
- **🔗 Row Level Security (RLS)** - Seguridad a nivel de fila
- **⚡ API REST** - Endpoints para operaciones CRUD

### Características Técnicas
- **🌈 Diseño responsivo**: Optimizado para móviles y escritorio
- **🎯 Accesibilidad**: Componentes accesibles con ARIA
- **🔒 Seguridad**: Autenticación segura y políticas RLS
- **📊 Rendimiento**: Optimizado para producción

## 🚀 Configuración Inicial

### 1. Instalar Dependencias
```bash
npm install
```

### 2. Configurar Variables de Entorno
Crea un archivo `.env.local` basado en `.env.example`:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Configurar Base de Datos
Ejecuta el script SQL en tu proyecto de Supabase:

```sql
-- Ejecuta el contenido del archivo supabase-schema.sql
```

### 4. Iniciar Servidor de Desarrollo
```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) para ver la aplicación.

## 📁 Estructura del Proyecto

```
src/
├── app/                    # Páginas de Next.js App Router
│   ├── api/               # Rutas API
│   │   ├── children/      # API para gestión de hijos
│   │   ├── routines/      # API para gestión de rutinas
│   │   ├── habits/        # API para gestión de hábitos
│   │   ├── behaviors/     # API para gestión de comportamientos
│   │   ├── rewards/       # API para gestión de recompensas
│   │   └── resources/     # API para recursos educativos
│   ├── dashboard/         # Dashboard principal
│   ├── children/          # Gestión de hijos
│   ├── routines/          # Gestión de rutinas
│   ├── habits/            # Gestión de hábitos
│   ├── resources/         # Recursos educativos
│   ├── login/             # Página de inicio de sesión
│   └── register/          # Página de registro
├── components/            # Componentes React reutilizables
│   └── ui/               # Componentes shadcn/ui
├── hooks/                 # Hooks personalizados de React
├── lib/                   # Utilidades y configuraciones
│   ├── supabase/          # Cliente de Supabase
│   └── utils.ts           # Funciones utilitarias
├── store/                 # Gestión de estado (Zustand)
└── types/                 # Definiciones de TypeScript
```

## 🔐 Seguridad

### Row Level Security (RLS)
La aplicación implementa políticas de seguridad a nivel de fila para garantizar que:
- Los padres solo puedan ver y modificar los datos de sus propios hijos
- Cada usuario tenga acceso restringido a su información
- Los datos estén protegidos contra accesos no autorizados

### Autenticación
- Sistema de autenticación basado en Supabase Auth
- Tokens JWT para sesiones seguras
- Middleware de protección de rutas

## 🎨 Componentes Disponibles

### UI Components (shadcn/ui)
- **Layout**: Card, Separator, Aspect Ratio
- **Forms**: Input, Textarea, Select, Checkbox, Radio Group, Switch
- **Feedback**: Alert, Toast, Progress, Skeleton
- **Navigation**: Breadcrumb, Menubar, Navigation Menu
- **Overlay**: Dialog, Sheet, Popover, Tooltip
- **Data Display**: Badge, Avatar, Calendar, Tabs

### Características Específicas
- **Dashboard**: Vista principal con resumen de actividades
- **Gestión de Hijos**: CRUD completo para perfiles de hijos
- **Sistema de Rutinas**: Creación y gestión de rutinas diarias
- **Seguimiento de Hábitos**: Monitorización de hábitos saludables
- **Recursos Educativos**: Contenido organizado por categorías

## 🚀 Despliegue

### Build para Producción
```bash
npm run build
npm start
```

### Variables de Entorno para Producción
Asegúrate de configurar todas las variables de entorno necesarias en tu entorno de producción.

## 🤝 Contribuir

1. Haz un fork del proyecto
2. Crea una rama para tu feature (`git checkout -b feature/amazing-feature`)
3. Commit tus cambios (`git commit -m 'Add some amazing feature'`)
4. Push a la rama (`git push origin feature/amazing-feature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - mira el archivo [LICENSE](LICENSE) para detalles.

## 🙏 Agradecimientos

- **Supabase** - Por el backend y autenticación
- **shadcn/ui** - Por los componentes de UI de alta calidad
- **Next.js** - Por el framework React increíble

---

Construido con ❤️ para la comunidad de padres de niños con TDAH.