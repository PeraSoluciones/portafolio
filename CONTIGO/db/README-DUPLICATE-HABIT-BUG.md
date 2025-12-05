# Bug: Hábito Duplicado en Múltiples Rutinas

## Problema

Cuando marcas "Cepillarse los dientes" en "Rutina de la mañana", también se marca automáticamente en "Rutina de la noche".

## Causa Raíz

El mismo hábito (ej: "Cepillarse los dientes") está asignado a MÚLTIPLES rutinas:

- Rutina mañana → Cepillarse dientes (habit_id: `abc123`)
- Rutina noche → Cepillarse dientes (habit_id: `abc123`) ← **MISMO ID**

El estado actual usa `habitId` como key:

```typescript
interface HabitState {
  habitId: string; // ❌ NO es único entre rutinas
  isCompleted: boolean;
}
```

Cuando actualizas el estado:

```typescript
setHabitsState((prev) =>
  prev.map((h) =>
    h.habitId === habitId // ❌ Encuentra AMBOS hábitos
      ? { ...h, isCompleted: true }
      : h
  )
);
```

## Solución Propuesta

### Opción 1: Usar `routine_habits.id` como Key Única ✅

El API ya retorna:

- `id`: routine_habits.id (ÚNICO)
- `habitId`: habits.id (puede repetirse)

**Cambios necesarios:**

1. **Actualizar interfaz:**

```typescript
interface HabitState {
  routineHabitId: string; // ✅ ID único de routine_habits
  habitId: string; // Para el API
  isCompleted: boolean;
}
```

2. **Actualizar mapeo:**

```typescript
habits: routine.habits.map((habit: any) => ({
  routineHabitId: habit.id, // ✅ Único
  habitId: habit.habitId, // Para API
  isCompleted: habit.isCompleted,
}));
```

3. **Actualizar comparaciones:**

```typescript
setHabitsState((prev) =>
  prev.map((h) =>
    h.routineHabitId === routineHabitId // ✅ Solo uno
      ? { ...h, isCompleted: true }
      : h
  )
);
```

4. **Actualizar función toggle:**

```typescript
const handleToggleHabit = async (
  routineHabitId: string, // Para estado
  habitId: string, // Para API
  isChecked: boolean
) => {
  // Usar routineHabitId para estado local
  // Usar habitId para API call
};
```

5. **Actualizar JSX:**

```tsx
<Checkbox
  id={habit.routineHabitId} // ✅ Único
  onCheckedChange={(checked) =>
    handleToggleHabit(habit.routineHabitId, habit.habitId, checked as boolean)
  }
/>
```

### Opción 2: Cambiar Lógica del API ❌

Hacer que el API acepte `routine_habit_id` en lugar de `habit_id`.

**Desventaja**: Requiere cambios en BD y API.

## Recomendación

**Usar Opción 1** porque:

- El API ya retorna ambos IDs
- Solo requiere cambios en frontend
- Más simple y directo

## Estado Actual

❌ **NO APLICADO** - Los cambios anteriores se revirtieron porque corrompían el archivo.

## Próximos Pasos

1. Aplicar cambios de Opción 1 de manera incremental
2. Probar que solo se marca un hábito
3. Verificar que el API toggle funciona correctamente
