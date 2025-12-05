# Diagnóstico: Problemas de Sincronización de Estado

## Problema 1: Balance No Se Actualiza en `/today`

### Causa Raíz

`fetchChildrenWithPoints()` actualiza el store, pero el componente no se re-renderiza porque:

- El balance se muestra usando `selectedChild?.points_balance`
- El store se actualiza pero React no detecta el cambio

### Solución

Agregar `useEffect` que escuche cambios en `children` del store y actualice `selectedChild`.

---

## Problema 2: Porcentaje de Rutinas No Se Actualiza en `/dashboard`

### Causa Raíz

`routine_completions` no se está creando/actualizando cuando se completan hábitos.

- El trigger `check_routine_completion_trigger` debe evaluar si la rutina está completa
- Pero solo se dispara en INSERT/UPDATE de `habit_records`

### Solución

Verificar que el trigger funciona y que se crean registros en `routine_completions`.

---

## Problema 3: Hábitos Se Desmarcan al Navegar

### Causa Raíz Probable

Los `habit_records` SÍ se guardan en BD, pero:

- El API `/api/today` no los está trayendo correctamente
- O hay un problema de caché en Next.js

### Solución

1. Verificar query de `habit_records` en `/api/today`
2. Agregar `cache: 'no-store'` al fetch
3. Verificar que la fecha del record coincide con hoy

---

## Plan de Acción

### 1. Debug Balance (Prioridad Alta)

```typescript
// En today/page.tsx después de fetchChildrenWithPoints()
const updatedChild = children.find((c) => c.id === selectedChild.id);
if (updatedChild) {
  setSelectedChild(updatedChild); // Forzar actualización
}
```

### 2. Debug Rutinas (Prioridad Media)

```sql
-- Verificar si se crean routine_completions
SELECT * FROM routine_completions
WHERE child_id = 'xxx'
AND completion_date = CURRENT_DATE;
```

### 3. Debug Hábitos Desmarcados (Prioridad Alta)

```typescript
// En /api/today agregar
headers: {
  'Cache-Control': 'no-cache, no-store, must-revalidate'
}
```

## Archivos a Modificar

1. `src/app/(dashboard)/today/page.tsx`
   - Agregar actualización de selectedChild después de fetchChildrenWithPoints
2. `src/app/api/today/route.ts`
   - Verificar query de habit_records
   - Agregar logs de debug
3. `src/app/(dashboard)/dashboard/page.tsx`
   - Agregar revalidación al montar componente
