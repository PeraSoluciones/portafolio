# 🐛 Bug de Balance Acumulativo - Análisis y Solución

## Problema Identificado

**Síntoma**: El balance de puntos se acumula incorrectamente

- Balance inicial: -10
- Después de marcar todos: +20
- Después de desmarcar: **se mantiene en +20** ❌ (debería volver a -10)
- Después de 4 ciclos: +80 ❌

## Causa Raíz

### ❌ **FALTA TRIGGER PARA DELETE**

El sistema tiene:

- ✅ Trigger para `INSERT` en `habit_records` → Otorga puntos
- ✅ Trigger para `UPDATE` en `habit_records` → Otorga puntos adicionales
- ❌ **NO HAY** Trigger para `DELETE` en `habit_records` → **NO revierte puntos**

### Evidencia

**Archivo**: `db/phase-2-triggers.sql` líneas 201-203

```sql
CREATE TRIGGER on_habit_record_created_trigger
  AFTER INSERT OR UPDATE ON habit_records  -- ✅ INSERT y UPDATE
  FOR EACH ROW EXECUTE FUNCTION on_habit_record_created();

-- ❌ FALTA: Trigger para DELETE
```

**Flujo actual (INCORRECTO)**:

1. Usuario marca hábito → INSERT → Trigger → +10 pts ✅
2. Usuario desmarca hábito → DELETE → **NO HAY TRIGGER** → Balance se mantiene ❌
3. Usuario marca de nuevo → INSERT → Trigger → +10 pts más ❌
4. **Resultado**: Acumulación infinita

## Solución

### Script creado: `fix-missing-delete-trigger.sql`

**Función**: `on_habit_record_deleted()`

- Calcula puntos que se otorgaron originalmente
- Crea transacción **negativa** para revertir
- Usa `handle_points_transaction()` con puntos negativos

**Trigger**: `on_habit_record_deleted_trigger`

- Se dispara `AFTER DELETE` en `habit_records`
- Revierte automáticamente los puntos

### Flujo correcto (DESPUÉS DEL FIX):

1. Usuario marca hábito → INSERT → +10 pts ✅
2. Usuario desmarca hábito → DELETE → **Trigger DELETE** → -10 pts ✅
3. Usuario marca de nuevo → INSERT → +10 pts ✅
4. **Resultado**: Balance correcto

---

## Otros Problemas Relacionados

### 2. Hábito Duplicado en Múltiples Rutinas

**Problema**: Mismo `habit_id` usado como key en estado

- "Cepillarse los dientes" está en "Rutina mañana" Y "Rutina noche"
- Al marcar en una, se marca en ambas

**Solución**: Usar `routine_habits.id` (único) en lugar de `habit_id`

### 3. Frontend No Refresca Balance

**Problema**: Balance no se actualiza hasta recargar página

**Solución**: Después de toggle, hacer fetch del balance actualizado desde BD

---

## Pasos para Aplicar Fix

1. **Ejecutar en Supabase**:

   ```bash
   db/fix-missing-delete-trigger.sql
   ```

2. **Verificar con**:

   ```bash
   db/debug-balance-bug.sql
   ```

3. **Probar**:
   - Marcar hábito → Ver balance aumentar
   - Desmarcar hábito → Ver balance **disminuir** ✅
   - Repetir 4 veces → Balance debe volver al inicial ✅

---

## Prevención Futura

### Agregar a `complete-database-setup.sql`:

```sql
-- Trigger para revertir puntos al DELETE
CREATE TRIGGER on_habit_record_deleted_trigger
  AFTER DELETE ON habit_records
  FOR EACH ROW EXECUTE FUNCTION on_habit_record_deleted();
```

### Testing:

- Siempre probar INSERT, UPDATE **Y DELETE**
- Verificar que balance vuelve al estado original
