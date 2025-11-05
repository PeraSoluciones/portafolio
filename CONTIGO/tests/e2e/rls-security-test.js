/**
 * Test de Seguridad para Políticas RLS (Row Level Security)
 * 
 * Este script valida que las políticas de seguridad funcionen correctamente:
 * 1. Usuarios no pueden acceder a datos de otros usuarios
 * 2. Padres solo pueden ver/Modificar datos de sus propios hijos
 * 3. Las políticas RLS bloquean accesos no autorizados
 */

import { createClient } from '@supabase/supabase-js';
import { faker } from '@faker-js/faker';

// Configuración del entorno de pruebas
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Error: Variables de entorno de Supabase no configuradas');
  process.exit(1);
}

// Utilidades para el testing
class SecurityTestUtils {
  static async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  static generateRandomUser() {
    return {
      email: faker.internet.email(),
      password: 'TestPassword123!',
      full_name: faker.person.fullName(),
    };
  }

  static generateRandomChild() {
    return {
      name: faker.person.firstName(),
      birth_date: faker.date.past({ years: 10 }).toISOString().split('T')[0],
      adhd_type: faker.helpers.arrayElement(['INATTENTIVE', 'HYPERACTIVE', 'COMBINED']),
    };
  }
}

// Clase principal para el testing de seguridad RLS
class RLSSecurityTest {
  constructor() {
    this.supabase1 = null; // Cliente para usuario 1 (Padre A)
    this.supabase2 = null; // Cliente para usuario 2 (Padre B)
    this.testData = {
      user1: null,
      user2: null,
      child1: null, // Hijo del usuario 1
      child2: null, // Hijo del usuario 2
      habit1: null, // Hábito del hijo 1
      habit2: null, // Hábito del hijo 2
      reward1: null, // Recompensa del hijo 1
      reward2: null, // Recompensa del hijo 2
    };
    this.testResults = {
      passed: 0,
      failed: 0,
      errors: [],
    };
  }

  async runAllTests() {
    console.log('🔒 Iniciando Test de Seguridad RLS\n');
    
    try {
      // Paso 1: Configuración inicial
      await this.setupTestEnvironment();
      
      // Paso 2: Ejecutar pruebas de seguridad
      await this.testUserCannotAccessOtherUserData();
      await this.testParentCannotAccessOtherChildData();
      await this.testRLSPoliciesForAllTables();
      
      // Paso 3: Limpieza
      await this.cleanup();
      
      // Resultados finales
      this.printResults();
      
    } catch (error) {
      console.error('❌ Error crítico en el test:', error);
      this.testResults.errors.push(error.message);
      this.printResults();
      throw error;
    }
  }

  async setupTestEnvironment() {
    console.log('🔧 Configurando entorno de pruebas de seguridad...');
    
    try {
      // Crear dos usuarios de prueba
      const userData1 = SecurityTestUtils.generateRandomUser();
      const userData2 = SecurityTestUtils.generateRandomUser();
      
      // Registrar usuario 1
      const { data: authData1, error: authError1 } = await createClient(SUPABASE_URL, SUPABASE_ANON_KEY).auth.signUp({
        email: userData1.email,
        password: userData1.password,
        options: {
          data: {
            full_name: userData1.full_name,
          },
        },
      });

      if (authError1) {
        throw new Error(`Error creando usuario 1: ${authError1.message}`);
      }

      // Registrar usuario 2
      const { data: authData2, error: authError2 } = await createClient(SUPABASE_URL, SUPABASE_ANON_KEY).auth.signUp({
        email: userData2.email,
        password: userData2.password,
        options: {
          data: {
            full_name: userData2.full_name,
          },
        },
      });

      if (authError2) {
        throw new Error(`Error creando usuario 2: ${authError2.message}`);
      }

      this.testData.user1 = authData1.user;
      this.testData.user2 = authData2.user;
      
      // Esperar un momento para que se complete el registro
      await SecurityTestUtils.delay(1000);

      // Crear clientes para cada usuario
      this.supabase1 = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      this.supabase2 = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

      // Iniciar sesión para obtener tokens válidos
      const { error: signInError1 } = await this.supabase1.auth.signInWithPassword({
        email: userData1.email,
        password: userData1.password,
      });

      if (signInError1) {
        throw new Error(`Error iniciando sesión usuario 1: ${signInError1.message}`);
      }

      const { error: signInError2 } = await this.supabase2.auth.signInWithPassword({
        email: userData2.email,
        password: userData2.password,
      });

      if (signInError2) {
        throw new Error(`Error iniciando sesión usuario 2: ${signInError2.message}`);
      }

      // Crear hijos para cada usuario
      const childData1 = SecurityTestUtils.generateRandomChild();
      const { data: child1, error: childError1 } = await this.supabase1
        .from('children')
        .insert([childData1])
        .select()
        .single();

      if (childError1) {
        throw new Error(`Error creando hijo 1: ${childError1.message}`);
      }

      const childData2 = SecurityTestUtils.generateRandomChild();
      const { data: child2, error: childError2 } = await this.supabase2
        .from('children')
        .insert([childData2])
        .select()
        .single();

      if (childError2) {
        throw new Error(`Error creando hijo 2: ${childError2.message}`);
      }

      this.testData.child1 = child1;
      this.testData.child2 = child2;

      // Crear hábitos para cada hijo
      const habitData1 = {
        child_id: child1.id,
        title: 'Hábito del Hijo 1',
        description: 'Hábito para testing de seguridad',
        category: 'HYGIENE',
        target_frequency: 1,
        unit: 'vez',
      };

      const { data: habit1, error: habitError1 } = await this.supabase1
        .from('habits')
        .insert([habitData1])
        .select()
        .single();

      if (habitError1) {
        throw new Error(`Error creando hábito 1: ${habitError1.message}`);
      }

      const habitData2 = {
        child_id: child2.id,
        title: 'Hábito del Hijo 2',
        description: 'Hábito para testing de seguridad',
        category: 'HYGIENE',
        target_frequency: 1,
        unit: 'vez',
      };

      const { data: habit2, error: habitError2 } = await this.supabase2
        .from('habits')
        .insert([habitData2])
        .select()
        .single();

      if (habitError2) {
        throw new Error(`Error creando hábito 2: ${habitError2.message}`);
      }

      this.testData.habit1 = habit1;
      this.testData.habit2 = habit2;

      // Crear recompensas para cada hijo
      const rewardData1 = {
        child_id: child1.id,
        title: 'Recompensa del Hijo 1',
        description: 'Recompensa para testing de seguridad',
        points_required: 10,
      };

      const { data: reward1, error: rewardError1 } = await this.supabase1
        .from('rewards')
        .insert([rewardData1])
        .select()
        .single();

      if (rewardError1) {
        throw new Error(`Error creando recompensa 1: ${rewardError1.message}`);
      }

      const rewardData2 = {
        child_id: child2.id,
        title: 'Recompensa del Hijo 2',
        description: 'Recompensa para testing de seguridad',
        points_required: 15,
      };

      const { data: reward2, error: rewardError2 } = await this.supabase2
        .from('rewards')
        .insert([rewardData2])
        .select()
        .single();

      if (rewardError2) {
        throw new Error(`Error creando recompensa 2: ${rewardError2.message}`);
      }

      this.testData.reward1 = reward1;
      this.testData.reward2 = reward2;

      console.log('✅ Entorno de seguridad configurado correctamente');
      console.log(`   Usuario 1: ${userData1.email} con hijo: ${child1.name}`);
      console.log(`   Usuario 2: ${userData2.email} con hijo: ${child2.name}\n`);
      
    } catch (error) {
      throw new Error(`Error en configuración de seguridad: ${error.message}`);
    }
  }

  async testUserCannotAccessOtherUserData() {
    console.log('🚫 Test 1: Usuario no puede acceder a datos de otro usuario');
    
    try {
      // El usuario 1 intenta acceder a los hijos del usuario 2
      const { data: otherChildren, error: childrenError } = await this.supabase1
        .from('children')
        .select('*')
        .eq('parent_id', this.testData.user2.id);

      if (childrenError) {
        // Esperamos un error aquí, lo cual es correcto
        console.log(`   ✅ Acceso denegado: No puede ver hijos de otro usuario`);
        console.log(`   ✅ Error esperado: ${childrenError.message}`);
      } else if (otherChildren.length === 0) {
        // También es correcto si no devuelve resultados
        console.log(`   ✅ Acceso denegado: No se devolvieron hijos de otro usuario`);
      } else {
        throw new Error('El usuario 1 no debería poder ver los hijos del usuario 2');
      }

      // El usuario 2 intenta acceder a los hijos del usuario 1
      const { data: otherChildren2, error: childrenError2 } = await this.supabase2
        .from('children')
        .select('*')
        .eq('parent_id', this.testData.user1.id);

      if (childrenError2) {
        // Esperamos un error aquí, lo cual es correcto
        console.log(`   ✅ Acceso denegado: No puede ver hijos de otro usuario`);
        console.log(`   ✅ Error esperado: ${childrenError2.message}`);
      } else if (otherChildren2.length === 0) {
        // También es correcto si no devuelve resultados
        console.log(`   ✅ Acceso denegado: No se devolvieron hijos de otro usuario`);
      } else {
        throw new Error('El usuario 2 no debería poder ver los hijos del usuario 1');
      }

      console.log('');
      this.testResults.passed++;
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}\n`);
      this.testResults.failed++;
      this.testResults.errors.push(error.message);
    }
  }

  async testParentCannotAccessOtherChildData() {
    console.log('🚫 Test 2: Padre no puede acceder a datos de hijos de otros padres');
    
    try {
      // El usuario 1 intenta acceder a los hábitos del hijo 2
      const { data: otherHabits, error: habitsError } = await this.supabase1
        .from('habits')
        .select('*')
        .eq('child_id', this.testData.child2.id);

      if (habitsError) {
        // Esperamos un error aquí, lo cual es correcto
        console.log(`   ✅ Acceso denegado: No puede ver hábitos de otro hijo`);
        console.log(`   ✅ Error esperado: ${habitsError.message}`);
      } else if (otherHabits.length === 0) {
        // También es correcto si no devuelve resultados
        console.log(`   ✅ Acceso denegado: No se devolvieron hábitos de otro hijo`);
      } else {
        throw new Error('El usuario 1 no debería poder ver los hábitos del hijo 2');
      }

      // El usuario 2 intenta acceder a las recompensas del hijo 1
      const { data: otherRewards, error: rewardsError } = await this.supabase2
        .from('rewards')
        .select('*')
        .eq('child_id', this.testData.child1.id);

      if (rewardsError) {
        // Esperamos un error aquí, lo cual es correcto
        console.log(`   ✅ Acceso denegado: No puede ver recompensas de otro hijo`);
        console.log(`   ✅ Error esperado: ${rewardsError.message}`);
      } else if (otherRewards.length === 0) {
        // También es correcto si no devuelve resultados
        console.log(`   ✅ Acceso denegado: No se devolvieron recompensas de otro hijo`);
      } else {
        throw new Error('El usuario 2 no debería poder ver las recompensas del hijo 1');
      }

      console.log('');
      this.testResults.passed++;
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}\n`);
      this.testResults.failed++;
      this.testResults.errors.push(error.message);
    }
  }

  async testRLSPoliciesForAllTables() {
    console.log('🚫 Test 3: Políticas RLS para todas las tablas');
    
    try {
      // Lista de tablas críticas que deben tener RLS
      const criticalTables = [
        'children',
        'habits',
        'behaviors',
        'rewards',
        'routines',
        'points_transactions',
        'habit_records',
        'behavior_records',
        'reward_claims',
      ];

      for (const table of criticalTables) {
        // El usuario 1 intenta acceder a todos los datos de la tabla
        const { data: allData, error: tableError } = await this.supabase1
          .from(table)
          .select('*');

        if (tableError) {
          // Esperamos un error aquí, lo cual es correcto
          console.log(`   ✅ Tabla ${table}: Acceso denegado correctamente`);
          console.log(`   ✅ Error esperado: ${tableError.message}`);
        } else {
          // Si no hay error, verificar que solo devuelve datos del usuario 1
          const hasOtherUserData = allData.some(item => {
            if (table === 'children') {
              return item.parent_id !== this.testData.user1.id;
            } else if (item.child_id) {
              return item.child_id !== this.testData.child1.id;
            }
            return false;
          });

          if (hasOtherUserData) {
            throw new Error(`La tabla ${table} devuelve datos de otros usuarios`);
          } else {
            console.log(`   ✅ Tabla ${table}: Solo devuelve datos del usuario autenticado`);
          }
        }
      }

      console.log('');
      this.testResults.passed++;
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}\n`);
      this.testResults.failed++;
      this.testResults.errors.push(error.message);
    }
  }

  async cleanup() {
    console.log('🧹 Limpiando datos de pruebas de seguridad...');
    
    try {
      // Limpiar datos del usuario 1
      if (this.supabase1) {
        await this.supabase1.from('reward_claims').delete().eq('reward_id', this.testData.reward1.id);
        await this.supabase1.from('rewards').delete().eq('id', this.testData.reward1.id);
        await this.supabase1.from('habit_records').delete().eq('habit_id', this.testData.habit1.id);
        await this.supabase1.from('behaviors').delete().eq('child_id', this.testData.child1.id);
        await this.supabase1.from('habits').delete().eq('id', this.testData.habit1.id);
        await this.supabase1.from('points_transactions').delete().eq('child_id', this.testData.child1.id);
        await this.supabase1.from('children').delete().eq('id', this.testData.child1.id);
      }

      // Limpiar datos del usuario 2
      if (this.supabase2) {
        await this.supabase2.from('reward_claims').delete().eq('reward_id', this.testData.reward2.id);
        await this.supabase2.from('rewards').delete().eq('id', this.testData.reward2.id);
        await this.supabase2.from('habit_records').delete().eq('habit_id', this.testData.habit2.id);
        await this.supabase2.from('behaviors').delete().eq('child_id', this.testData.child2.id);
        await this.supabase2.from('habits').delete().eq('id', this.testData.habit2.id);
        await this.supabase2.from('points_transactions').delete().eq('child_id', this.testData.child2.id);
        await this.supabase2.from('children').delete().eq('id', this.testData.child2.id);
      }

      // Eliminar usuarios
      const adminClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          persistSession: false,
        },
      });

      if (this.testData.user1) {
        await adminClient.auth.admin.deleteUser(this.testData.user1.id);
      }

      if (this.testData.user2) {
        await adminClient.auth.admin.deleteUser(this.testData.user2.id);
      }

      console.log('✅ Limpieza completada\n');
      
    } catch (error) {
      console.log(`⚠️ Error en limpieza (requerida manual): ${error.message}\n`);
    }
  }

  printResults() {
    console.log('📋 RESULTADOS DEL TEST DE SEGURIDAD RLS');
    console.log('====================================');
    console.log(`✅ Pruebas pasadas: ${this.testResults.passed}`);
    console.log(`❌ Pruebas fallidas: ${this.testResults.failed}`);
    console.log(`📊 Total de pruebas: ${this.testResults.passed + this.testResults.failed}`);
    
    if (this.testResults.errors.length > 0) {
      console.log('\n🚨 ERRORES DETALLADOS:');
      this.testResults.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }
    
    if (this.testResults.failed === 0) {
      console.log('\n🎉 TODAS LAS PRUEBAS DE SEGURIDAD PASARON CORRECTAMENTE');
      console.log('✅ Las políticas RLS están funcionando como se espera');
    } else {
      console.log('\n⚠️ ALGUNAS PRUEBAS FALLARON - REVISAR ERRORES');
    }
  }
}

// Ejecutar el test
async function main() {
  const test = new RLSSecurityTest();
  await test.runAllTests();
}

// Exportar para uso en otros scripts
export { RLSSecurityTest, SecurityTestUtils };

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Error ejecutando tests de seguridad:', error);
    process.exit(1);
  });
}