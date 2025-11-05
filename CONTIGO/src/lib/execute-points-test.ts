/**
 * Script para ejecutar la verificación completa del sistema de puntos
 * 
 * Para ejecutar este test:
 * 1. En el navegador, abrir la consola de desarrollador
 * 2. Importar el módulo: import { runPointsSystemCheck } from '@/lib/test-points-system'
 * 3. Ejecutar: await runPointsSystemCheck()
 * 
 * O ejecutar directamente desde un componente React
 */

import { testPointsSystem } from './test-points-system';

// Función auto-ejecutable para pruebas
export async function executePointsSystemTest() {
  console.log('🚀 EJECUTANDO VERIFICACIÓN COMPLETA DEL SISTEMA DE PUNTOS');
  console.log('='.repeat(60));
  
  const startTime = Date.now();
  
  try {
    const result = await testPointsSystem();
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESULTADOS DE LA VERIFICACIÓN');
    console.log('='.repeat(60));
    console.log(`⏱️ Tiempo de ejecución: ${duration}ms`);
    console.log(`📋 Esquema BD: ${result.schema.isValid ? '✅ VÁLIDO' : '❌ CON ERRORES'}`);
    console.log(`📊 Datos: ${result.consistency.isValid ? '✅ CONSISTENTES' : '❌ INCONSISTENTES'}`);
    console.log(`🎯 Estado General: ${result.success ? '✅ SISTEMA FUNCIONAL' : '❌ REQUIERE ATENCIÓN'}`);
    
    // Mostrar detalles si hay problemas
    if (!result.success) {
      console.log('\n🔍 DETALLES DE LOS PROBLEMAS:');
      console.log('-'.repeat(40));
      
      if (result.schema.errors.length > 0) {
        console.log('❌ ERRORES DE ESQUEMA:');
        result.schema.errors.forEach((error, index) => {
          console.log(`  ${index + 1}. ${error}`);
        });
      }
      
      if (result.schema.warnings.length > 0) {
        console.log('⚠️ ADVERTENCIAS DEL ESQUEMA:');
        result.schema.warnings.forEach((warning, index) => {
          console.log(`  ${index + 1}. ${warning}`);
        });
      }
      
      if (result.consistency.errors.length > 0) {
        console.log('❌ ERRORES DE CONSISTENCIA:');
        result.consistency.errors.forEach((error, index) => {
          console.log(`  ${index + 1}. ${error}`);
        });
      }
      
      if (result.consistency.fixes.length > 0) {
        console.log('🔧 REPARACIONES SUGERIDAS:');
        result.consistency.fixes.forEach((fix, index) => {
          console.log(`  ${index + 1}. ${fix}`);
        });
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ VERIFICACIÓN COMPLETADA');
    console.log('='.repeat(60));
    
    return result;
    
  } catch (error) {
    console.error('❌ ERROR CRÍTICO DURANTE LA VERIFICACIÓN:');
    console.error(error);
    return {
      success: false,
      error: error,
      schema: { isValid: false, errors: ['Error ejecutando verificación'], warnings: [] },
      consistency: { isValid: false, errors: ['Error ejecutando verificación'], fixes: [] }
    };
  }
}

// Ejecución inmediata si este archivo se importa
if (typeof window !== 'undefined') {
  // Disponible para testing desde consola del navegador
  (window as any).executePointsSystemTest = executePointsSystemTest;
  
  // También ejecutar automáticamente después de 1 segundo para desarrollo
  setTimeout(async () => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🧪 Ejecutando verificación automática en modo desarrollo...');
      await executePointsSystemTest();
    }
  }, 1000);
}

export default executePointsSystemTest;