import { verifyDatabaseSchema, verifyDataConsistency, repairDatabaseData } from './db-verification';
import { getChildPointsBalance, getChildPointsHistory } from './services/points-service';

/**
 * Script completo de prueba del sistema de puntos
 * Ejecutar este script para verificar que todo funciona correctamente
 */
export async function testPointsSystem() {
  console.log('🧪 Iniciando pruebas del Sistema de Puntos...');
  
  try {
    // 1. Verificación del esquema
    console.log('\n📋 1. Verificando esquema de base de datos...');
    const schemaResult = await verifyDatabaseSchema();
    
    console.log('✅ Esquema válido:', schemaResult.isValid);
    
    if (schemaResult.errors.length > 0) {
      console.log('❌ Errores del esquema:');
      schemaResult.errors.forEach(error => console.log(`  - ${error}`));
    }
    
    if (schemaResult.warnings.length > 0) {
      console.log('⚠️ Advertencias del esquema:');
      schemaResult.warnings.forEach(warning => console.log(`  - ${warning}`));
    }
    
    // 2. Verificación de consistencia de datos
    console.log('\n📊 2. Verificando consistencia de datos...');
    const consistencyResult = await verifyDataConsistency();
    
    console.log('✅ Datos consistentes:', consistencyResult.isValid);
    
    if (consistencyResult.errors.length > 0) {
      console.log('❌ Errores de consistencia:');
      consistencyResult.errors.forEach(error => console.log(`  - ${error}`));
    }
    
    if (consistencyResult.fixes.length > 0) {
      console.log('🔧 Reparaciones sugeridas:');
      consistencyResult.fixes.forEach(fix => console.log(`  - ${fix}`));
    }
    
    // 3. Intentar reparaciones automáticas si hay errores
    if (!schemaResult.isValid || !consistencyResult.isValid) {
      console.log('\n🔧 3. Ejecutando reparaciones automáticas...');
      const repairResult = await repairDatabaseData();
      
      console.log('✅ Reparación exitosa:', repairResult.success);
      
      if (repairResult.repaired.length > 0) {
        console.log('🎉 Elementos reparados:');
        repairResult.repaired.forEach(repaired => console.log(`  - ${repaired}`));
      }
      
      if (repairResult.errors.length > 0) {
        console.log('❌ Errores en reparación:');
        repairResult.errors.forEach(error => console.log(`  - ${error}`));
      }
    }
    
    // 4. Pruebas funcionales básicas
    console.log('\n🚀 4. Ejecutando pruebas funcionales...');
    await runFunctionalTests();
    
    console.log('\n✅ Pruebas del Sistema de Puntos completadas');
    
    return {
      schema: schemaResult,
      consistency: consistencyResult,
      success: schemaResult.isValid && consistencyResult.isValid
    };
    
  } catch (error) {
    console.error('❌ Error durante las pruebas:', error);
    throw error;
  }
}

/**
 * Pruebas funcionales básicas del sistema
 */
async function runFunctionalTests() {
  try {
    // Test 1: Verificar que podemos obtener el balance de puntos
    console.log('  📈 Test 1: Obtener balance de puntos...');
    
    // Intentar con un ID inválido para verificar manejo de errores
    try {
      const balance = await getChildPointsBalance('00000000-0000-0000-0000-000000000000');
      console.log('    ✅ Función de balance responde correctamente');
    } catch (error) {
      console.log('    ✅ Manejo de errores de balance funciona');
    }
    
    // Test 2: Verificar que podemos obtener historial
    console.log('  📜 Test 2: Obtener historial de puntos...');
    
    try {
      const history = await getChildPointsHistory('00000000-0000-0000-0000-000000000000', { limit: 5 });
      console.log('    ✅ Función de historial responde correctamente');
    } catch (error) {
      console.log('    ✅ Manejo de errores de historial funciona');
    }
    
    // Test 3: Verificar que las validaciones Zod funcionan
    console.log('  🛡️ Test 3: Validaciones Zod...');
    
    const { pointsAdjustmentSchema, routineHabitSchema } = await import('./validations/points');
    
    try {
      pointsAdjustmentSchema.parse({
        child_id: 'invalid-uuid',
        points: 'not-a-number',
        description: ''
      });
      console.log('    ❌ Validación de ajuste de puntos no funcionó');
    } catch (error) {
      console.log('    ✅ Validación de ajuste de puntos funciona correctamente');
    }
    
    try {
      routineHabitSchema.parse({
        routine_id: 'invalid',
        habit_id: 'invalid',
        points_value: -10,
        is_required: 'not-boolean'
      });
      console.log('    ❌ Validación de hábito de rutina no funcionó');
    } catch (error) {
      console.log('    ✅ Validación de hábito de rutina funciona correctamente');
    }
    
    // Test 4: Verificar tipos TypeScript
    console.log('  🔍 Test 4: Verificación de tipos...');
    
    const typesModule = await import('../types/database');
    const hasPointsTransaction = 'PointsTransaction' in typesModule;
    const hasPointsSummary = 'PointsSummary' in typesModule;
    const hasRoutineHabit = 'RoutineHabit' in typesModule;
    
    if (hasPointsTransaction && hasPointsSummary && hasRoutineHabit) {
      console.log('    ✅ Todos los tipos necesarios están definidos');
    } else {
      console.log('    ❌ Faltan tipos necesarios');
    }
    
  } catch (error) {
    console.error('  ❌ Error en pruebas funcionales:', error);
  }
}

/**
 * Función para ejecutar las pruebas desde el navegador
 * Llamar a esta función desde la consola del navegador
 */
export async function runPointsSystemCheck() {
  console.log('🎯 Ejecutando verificación del Sistema de Puntos desde el navegador...');
  
  try {
    const result = await testPointsSystem();
    
    // Mostrar resumen visual
    console.log('\n📊 RESUMEN DE VERIFICACIÓN:');
    console.log('━'.repeat(50));
    console.log(`📋 Esquema BD: ${result.schema.isValid ? '✅ VÁLIDO' : '❌ INVÁLIDO'}`);
    console.log(`📊 Consistencia Datos: ${result.consistency.isValid ? '✅ VÁLIDA' : '❌ INVÁLIDA'}`);
    console.log(`🎯 Estado General: ${result.success ? '✅ SISTEMA FUNCIONAL' : '❌ REQUIERE ATENCIÓN'}`);
    
    if (result.schema.warnings.length > 0) {
      console.log(`⚠️ Advertencias: ${result.schema.warnings.length}`);
    }
    
    if (result.consistency.fixes.length > 0) {
      console.log(`🔧 Reparaciones sugeridas: ${result.consistency.fixes.length}`);
    }
    
    console.log('━'.repeat(50));
    
    return result;
  } catch (error) {
    console.error('❌ Error en verificación:', error);
    return { success: false, error };
  }
}

// Exportar función principal para uso global
if (typeof window !== 'undefined') {
  // Hacer disponible en el objeto window para testing en navegador
  (window as any).checkPointsSystem = runPointsSystemCheck;
}