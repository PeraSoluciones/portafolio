-- =====================================================================
-- SCRIPT DE CORRECCIÓN PARA PUNTOS DE COMPORTAMIENTOS NEGATIVOS
-- =====================================================================
--
-- Este script realiza dos acciones principales:
-- 1. Corrige las transacciones de puntos existentes donde un
--    comportamiento de tipo 'NEGATIVE' fue incorrectamente sumado
--    en lugar de restado.
-- 2. Recalcula el balance de puntos de todos los niños basándose
--    en el historial de transacciones corregido.
--
-- USO:
-- 1. Revisar el script para entender los cambios que se realizarán.
-- 2. Ejecutar el script en la base de datos afectada.
--    psql -h [host] -U [user] -d [database] -f db/fix-negative-behavior-points.sql
--
-- =====================================================================

-- Iniciar una transacción para asegurar que todos los cambios se apliquen
-- de forma atómica. Si algo falla, se revertirá todo.
BEGIN;

-- Desactivar temporalmente los triggers para evitar el error con 'updated_at'
ALTER TABLE children DISABLE TRIGGER update_children_updated_at;
ALTER TABLE points_transactions DISABLE TRIGGER update_points_transactions_updated_at;

-- 1. CORREGIR TRANSACCIONES DE PUNTOS INCORRECTAS
-- -------------------------------------------------
-- Actualiza la tabla points_transactions, convirtiendo a negativo
-- el valor de 'points' para las transacciones de tipo 'BEHAVIOR'
-- que están vinculadas a un comportamiento 'NEGATIVE' y que
-- actualmente tienen un valor de puntos positivo.

UPDATE points_transactions pt
SET points = -ABS(pt.points)
WHERE pt.transaction_type = 'BEHAVIOR'
  AND pt.points > 0
  AND EXISTS (
    SELECT 1
    FROM behaviors b
    WHERE b.id = pt.related_id
      AND b.type = 'NEGATIVE'
  );

-- 2. RECALCULAR EL CAMPO 'balance_after' EN CADA TRANSACCIÓN
-- -------------------------------------------------------------
-- Primero, creamos una CTE que calcula el balance correcto después de cada
-- transacción para cada niño, ordenado por fecha de creación.

WITH corrected_balances AS (
  SELECT
    id,
    SUM(points) OVER (PARTITION BY child_id ORDER BY created_at, id) AS running_total
  FROM points_transactions
)
-- Ahora, actualizamos la columna 'balance_after' en la tabla original
-- con los valores correctos calculados en la CTE.
UPDATE points_transactions pt
SET balance_after = cb.running_total
FROM corrected_balances cb
WHERE pt.id = cb.id;

-- 3. RECALCULAR EL BALANCE DE PUNTOS FINAL DE TODOS LOS NIÑOS
-- -------------------------------------------------------------
-- Se crea una tabla temporal para almacenar los balances finales correctos
-- de cada niño, basándose en su última transacción.

CREATE TEMP TABLE final_child_balances AS
SELECT DISTINCT ON (child_id)
  child_id,
  balance_after AS final_balance
FROM points_transactions
ORDER BY child_id, created_at DESC, id DESC;

-- Actualiza la tabla 'children' con los balances finales correctos.
UPDATE children c
SET points_balance = fcb.final_balance
FROM final_child_balances fcb
WHERE c.id = fcb.child_id;

-- Para los niños que no tienen ninguna transacción, asegurarse de que
-- su balance sea 0.
UPDATE children
SET points_balance = 0
WHERE id NOT IN (SELECT child_id FROM final_child_balances);

-- Reactivar los triggers una vez finalizadas las actualizaciones
ALTER TABLE children ENABLE TRIGGER update_children_updated_at;
ALTER TABLE points_transactions ENABLE TRIGGER update_points_transactions_updated_at;

-- Finalizar la transacción y aplicar los cambios.
COMMIT;

-- =====================================================================
-- VERIFICACIÓN (OPCIONAL)
-- =====================================================================
--
-- Puedes ejecutar estas consultas después de correr el script para
-- verificar que los cambios se aplicaron correctamente.
--
-- -- Verificar que no queden transacciones de comportamientos negativos con puntos positivos
-- SELECT COUNT(*)
-- FROM points_transactions pt
-- JOIN behaviors b ON pt.related_id = b.id
-- WHERE pt.transaction_type = 'BEHAVIOR'
--   AND b.type = 'NEGATIVE'
--   AND pt.points > 0;
--
-- -- Comparar balances antiguos con los nuevos (requiere ejecutar antes del script)
-- -- SELECT c.id, c.name, c.points_balance AS old_balance, cb.recalculated_balance AS new_balance
-- -- FROM children c
-- -- JOIN child_balances cb ON c.id = cb.child_id
-- -- WHERE c.points_balance != cb.recalculated_balance;
--
-- =====================================================================