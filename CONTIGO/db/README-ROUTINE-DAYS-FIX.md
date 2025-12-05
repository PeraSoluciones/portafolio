# 🐛 Fix: Rutinas no se muestran en /today

## Problema Identificado

Las rutinas no se muestran en `/today` porque hay **inconsistencia en el formato de días**:

- **Rutinas antiguas**: Usan español (`'LUN', 'MAR', 'MIÉ'`)
- **Código de la aplicación**: Busca en inglés (`'MONDAY', 'TUESDAY'`)

### Evidencia

```sql
-- Rutina "Rutina de la noche"
days: ["LUN","MAR","MIÉ","JUE","DOM","VIE","SÁB"]

-- Endpoint /api/today busca:
.contains('days', ['TUESDAY'])  // ❌ NO coincide con 'MAR'
```

## ✅ Solución

### Paso 1: Normalizar días a inglés

**Ejecuta en Supabase:**

```bash
db/fix-routine-days-to-english.sql
```

Este script:

1. Muestra el estado actual
2. Convierte todos los días de español a inglés:
   - `'LUN'` → `'MONDAY'`
   - `'MAR'` → `'TUESDAY'`
   - `'MIÉ'` → `'WEDNESDAY'`
   - `'JUE'` → `'THURSDAY'`
   - `'VIE'` → `'FRIDAY'`
   - `'SÁB'` → `'SATURDAY'`
   - `'DOM'` → `'SUNDAY'`
3. Verifica que se actualizaron correctamente

### Paso 2: Verificar en el navegador

1. Abre `/today` en el navegador
2. Deberías ver "Rutina de la noche" y todas las demás rutinas
3. Verifica que los hábitos se muestran correctamente

## 📊 Resultado Esperado

**Antes:**

```
/today → "No hay rutinas para hoy"
```

**Después:**

```
/today →
  - Rutina de la mañana (5 hábitos)
  - Rutina de la noche (X hábitos)
  - [Otras rutinas del día]
```

## 🔧 Cambios Realizados

### 1. Script de migración

- `db/fix-routine-days-to-english.sql` - Normaliza días a inglés

### 2. Schema actualizado

- `supabase-schema.sql` - Comentario actualizado para reflejar formato inglés

## 📝 Formato Estándar de Días

De ahora en adelante, **SIEMPRE** usar inglés en mayúsculas:

```typescript
const DAYS = [
  'SUNDAY',
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
];
```

## ⚠️ Importante

- Este cambio afecta **todas las rutinas existentes**
- Es **irreversible** (a menos que hagas backup antes)
- Asegúrate de ejecutar el script en **producción** también

## 🧪 Testing

Después de ejecutar el script, verifica:

```sql
-- Todas las rutinas deberían tener días en inglés
SELECT title, days
FROM routines
WHERE is_active = true;

-- No debería haber días en español
SELECT title, days
FROM routines
WHERE EXISTS (
  SELECT 1 FROM unnest(days) d
  WHERE d IN ('LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM')
);
-- Debería retornar 0 filas
```
