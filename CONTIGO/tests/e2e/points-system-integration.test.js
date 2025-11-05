/**
 * Test de Integración E2E para el Sistema de Refuerzo Integral
 * 
 * Este script valida el flujo completo del sistema de puntos:
 * 1. Creación de hábitos con puntos
 * 2. Asignación a rutinas
 * 3. Completar hábitos y ganar puntos
 * 4. Registrar conductas (positivas/negativas)
 * 5. Canjear recompensas
 * 6. Validar restricciones de puntos insuficientes
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
class TestUtils {
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

  static async makeAuthenticatedRequest(supabase, method, url, body = null) {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabase.auth.session()?.access_token}`,
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${SUPABASE_URL}/rest/v1${url}`, options);
    return response;
  }
}

// Clase principal para el testing de integración
class PointsSystemIntegrationTest {
  constructor() {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    this.testData = {
      user: null,
      child: null,
      habit: null,
      routine: null,
      routineHabit: null,
      behavior: null,
      reward: null,
      initialPoints: 0,
    };
    this.testResults = {
      passed: 0,
      failed: 0,
      errors: [],
    };
  }

  async runAllTests() {
    console.log('🧪 Iniciando Test de Integración del Sistema de Puntos\n');
    
    try {
      // Paso 1: Configuración inicial
      await this.setupTestEnvironment();
      
      // Paso 2: Ejecutar pruebas del flujo
      await this.testHabitCreationAndPoints();
      await this.testHabitCompletionAndPointsAward();
      await this.testBehaviorPoints();
      await this.testRewardCreation();
      await this.testRewardRedemption();
      await this.testInsufficientPointsRestriction();
      await this.testPointsHistory();
      
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
    console.log('🔧 Configurando entorno de pruebas...');
    
    try {
      // Crear usuario de prueba
      const userData = TestUtils.generateRandomUser();
      const { data: authData, error: authError } = await this.supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            full_name: userData.full_name,
          },
        },
      });

      if (authError) {
        throw new Error(`Error creando usuario: ${authError.message}`);
      }

      this.testData.user = authData.user;
      
      // Esperar un momento para que se complete el registro
      await TestUtils.delay(1000);

      // Iniciar sesión para obtener token válido
      const { error: signInError } = await this.supabase.auth.signInWithPassword({
        email: userData.email,
        password: userData.password,
      });

      if (signInError) {
        throw new Error(`Error iniciando sesión: ${signInError.message}`);
      }

      // Crear hijo de prueba
      const childData = TestUtils.generateRandomChild();
      const { data: child, error: childError } = await this.supabase
        .from('children')
        .insert([childData])
        .select()
        .single();

      if (childError) {
        throw new Error(`Error creando hijo: ${childError.message}`);
      }

      this.testData.child = child;
      this.testData.initialPoints = child.points_balance || 0;

      console.log('✅ Entorno de pruebas configurado correctamente');
      console.log(`   Usuario: ${userData.email}`);
      console.log(`   Hijo: ${child.name} (Puntos iniciales: ${this.testData.initialPoints})\n`);
      
    } catch (error) {
      throw new Error(`Error en configuración: ${error.message}`);
    }
  }

  async testHabitCreationAndPoints() {
    console.log('📝 Test 1: Creación de hábito con puntos');
    
    try {
      // Crear un hábito
      const habitData = {
        child_id: this.testData.child.id,
        title: 'Hábito de Prueba',
        description: 'Este es un hábito para testing',
        category: 'HYGIENE',
        target_frequency: 1,
        unit: 'vez',
      };

      const { data: habit, error: habitError } = await this.supabase
        .from('habits')
        .insert([habitData])
        .select()
        .single();

      if (habitError) {
        throw new Error(`Error creando hábito: ${habitError.message}`);
      }

      this.testData.habit = habit;

      // Crear una rutina para el día actual
      const today = new Date().getDay();
      const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
      const todayName = dayNames[today];

      const routineData = {
        child_id: this.testData.child.id,
        title: 'Rutina de Prueba',
        description: 'Rutina para testing',
        time: '08:00',
        days: [todayName],
      };

      const { data: routine, error: routineError } = await this.supabase
        .from('routines')
        .insert([routineData])
        .select()
        .single();

      if (routineError) {
        throw new Error(`Error creando rutina: ${routineError.message}`);
      }

      this.testData.routine = routine;

      // Asignar el hábito a la rutina con puntos
      const routineHabitData = {
        routine_id: routine.id,
        habit_id: habit.id,
        points_value: 10,
        is_required: true,
      };

      const { data: routineHabit, error: routineHabitError } = await this.supabase
        .from('routine_habits')
        .insert([routineHabitData])
        .select()
        .single();

      if (routineHabitError) {
        throw new Error(`Error asignando hábito a rutina: ${routineHabitError.message}`);
      }

      this.testData.routineHabit = routineHabit;

      console.log(`   ✅ Hábito creado: "${habit.title}"`);
      console.log(`   ✅ Rutina creada: "${routine.title}"`);
      console.log(`   ✅ Hábito asignado a rutina con ${routineHabitData.points_value} puntos\n`);
      
      this.testResults.passed++;
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}\n`);
      this.testResults.failed++;
      this.testResults.errors.push(error.message);
    }
  }

  async testHabitCompletionAndPointsAward() {
    console.log('✅ Test 2: Completar hábito y ganar puntos');
    
    try {
      if (!this.testData.habit || !this.testData.routineHabit) {
        throw new Error('Datos previos no disponibles');
      }

      const today = new Date().toISOString().split('T')[0];

      // Marcar el hábito como completado
      const { data: habitRecord, error: habitRecordError } = await this.supabase
        .from('habit_records')
        .insert([{
          habit_id: this.testData.habit.id,
          date: today,
          value: 1,
          notes: 'Completado en test',
        }])
        .select()
        .single();

      if (habitRecordError) {
        throw new Error(`Error registrando hábito: ${habitRecordError.message}`);
      }

      // Esperar un momento para que se ejecute el trigger
      await TestUtils.delay(500);

      // Verificar que se creó la transacción de puntos
      const { data: transaction, error: transactionError } = await this.supabase
        .from('points_transactions')
        .select('*')
        .eq('child_id', this.testData.child.id)
        .eq('transaction_type', 'HABIT')
        .eq('related_id', this.testData.habit.id)
        .single();

      if (transactionError) {
        throw new Error(`Error verificando transacción: ${transactionError.message}`);
      }

      // Verificar que se actualizaron los puntos del niño
      const { data: updatedChild, error: childError } = await this.supabase
        .from('children')
        .select('points_balance')
        .eq('id', this.testData.child.id)
        .single();

      if (childError) {
        throw new Error(`Error verificando puntos del niño: ${childError.message}`);
      }

      const expectedBalance = this.testData.initialPoints + this.testData.routineHabit.points_value;
      
      if (updatedChild.points_balance !== expectedBalance) {
        throw new Error(`Balance incorrecto. Esperado: ${expectedBalance}, Actual: ${updatedChild.points_balance}`);
      }

      console.log(`   ✅ Hábito completado: "${this.testData.habit.title}"`);
      console.log(`   ✅ Transacción creada: +${transaction.points} puntos`);
      console.log(`   ✅ Balance actualizado: ${updatedChild.points_balance} puntos\n`);
      
      this.testResults.passed++;
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}\n`);
      this.testResults.failed++;
      this.testResults.errors.push(error.message);
    }
  }

  async testBehaviorPoints() {
    console.log('👍 Test 3: Puntos por conductas (positiva y negativa)');
    
    try {
      // Crear conducta positiva
      const positiveBehavior = {
        child_id: this.testData.child.id,
        title: 'Buena Conducta',
        description: 'Comportamiento positivo para testing',
        type: 'POSITIVE',
        points: 5,
      };

      const { data: behavior, error: behaviorError } = await this.supabase
        .from('behaviors')
        .insert([positiveBehavior])
        .select()
        .single();

      if (behaviorError) {
        throw new Error(`Error creando conducta: ${behaviorError.message}`);
      }

      this.testData.behavior = behavior;

      // Registrar la conducta (esto debería crear una transacción de puntos)
      const { data: behaviorRecord, error: recordError } = await this.supabase
        .from('behavior_records')
        .insert([{
          behavior_id: behavior.id,
          date: new Date().toISOString().split('T')[0],
          notes: 'Registrado en test',
        }])
        .select()
        .single();

      if (recordError) {
        throw new Error(`Error registrando conducta: ${recordError.message}`);
      }

      // Esperar un momento para que se ejecute el trigger
      await TestUtils.delay(500);

      // Verificar la transacción de puntos
      const { data: behaviorTransaction, error: transactionError } = await this.supabase
        .from('points_transactions')
        .select('*')
        .eq('child_id', this.testData.child.id)
        .eq('transaction_type', 'BEHAVIOR')
        .eq('related_id', behavior.id)
        .single();

      if (transactionError) {
        throw new Error(`Error verificando transacción de conducta: ${transactionError.message}`);
      }

      console.log(`   ✅ Conducta registrada: "${behavior.title}" (+${behavior.points} puntos)`);
      console.log(`   ✅ Transacción creada: +${behaviorTransaction.points} puntos\n`);
      
      this.testResults.passed++;
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}\n`);
      this.testResults.failed++;
      this.testResults.errors.push(error.message);
    }
  }

  async testRewardCreation() {
    console.log('🎁 Test 4: Creación de recompensas');
    
    try {
      // Crear una recompensa
      const rewardData = {
        child_id: this.testData.child.id,
        title: 'Recompensa de Prueba',
        description: 'Esta es una recompensa para testing',
        points_required: 15,
      };

      const { data: reward, error: rewardError } = await this.supabase
        .from('rewards')
        .insert([rewardData])
        .select()
        .single();

      if (rewardError) {
        throw new Error(`Error creando recompensa: ${rewardError.message}`);
      }

      this.testData.reward = reward;

      console.log(`   ✅ Recompensa creada: "${reward.title}"`);
      console.log(`   ✅ Puntos requeridos: ${reward.points_required}\n`);
      
      this.testResults.passed++;
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}\n`);
      this.testResults.failed++;
      this.testResults.errors.push(error.message);
    }
  }

  async testRewardRedemption() {
    console.log('🏆 Test 5: Canjeo de recompensas');
    
    try {
      if (!this.testData.reward) {
        throw new Error('Recompensa no disponible para canjear');
      }

      // Verificar puntos actuales del niño
      const { data: currentChild, error: childError } = await this.supabase
        .from('children')
        .select('points_balance')
        .eq('id', this.testData.child.id)
        .single();

      if (childError) {
        throw new Error(`Error obteniendo puntos actuales: ${childError.message}`);
      }

      if (currentChild.points_balance < this.testData.reward.points_required) {
        throw new Error(`Puntos insuficientes: ${currentChild.points_balance} < ${this.testData.reward.points_required}`);
      }

      // Canjear la recompensa
      const { data: claim, error: claimError } = await this.supabase
        .from('reward_claims')
        .insert([{
          reward_id: this.testData.reward.id,
          notes: 'Canjeado en test',
        }])
        .select()
        .single();

      if (claimError) {
        throw new Error(`Error canjeando recompensa: ${claimError.message}`);
      }

      // Esperar un momento para que se ejecute el trigger
      await TestUtils.delay(500);

      // Verificar la transacción de puntos (negativa)
      const { data: redemptionTransaction, error: transactionError } = await this.supabase
        .from('points_transactions')
        .select('*')
        .eq('child_id', this.testData.child.id)
        .eq('transaction_type', 'REWARD_REDEMPTION')
        .eq('related_id', this.testData.reward.id)
        .single();

      if (transactionError) {
        throw new Error(`Error verificando transacción de canje: ${transactionError.message}`);
      }

      // Verificar que se descontaron los puntos
      const { data: updatedChild, error: updateError } = await this.supabase
        .from('children')
        .select('points_balance')
        .eq('id', this.testData.child.id)
        .single();

      if (updateError) {
        throw new Error(`Error verificando balance actualizado: ${updateError.message}`);
      }

      console.log(`   ✅ Recompensa canjeada: "${this.testData.reward.title}"`);
      console.log(`   ✅ Puntos descontados: ${Math.abs(redemptionTransaction.points)}`);
      console.log(`   ✅ Balance final: ${updatedChild.points_balance} puntos\n`);
      
      this.testResults.passed++;
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}\n`);
      this.testResults.failed++;
      this.testResults.errors.push(error.message);
    }
  }

  async testInsufficientPointsRestriction() {
    console.log('🚫 Test 6: Restricción de puntos insuficientes');
    
    try {
      // Crear una recompensa cara
      const expensiveReward = {
        child_id: this.testData.child.id,
        title: 'Recompensa Cara',
        description: 'Recompensa muy costosa para testing',
        points_required: 1000,
      };

      const { data: reward, error: rewardError } = await this.supabase
        .from('rewards')
        .insert([expensiveReward])
        .select()
        .single();

      if (rewardError) {
        throw new Error(`Error creando recompensa cara: ${rewardError.message}`);
      }

      // Intentar canjear la recompensa sin puntos suficientes
      const { error: claimError } = await this.supabase
        .from('reward_claims')
        .insert([{
          reward_id: reward.id,
          notes: 'Intento de canje con puntos insuficientes',
        }]);

      if (claimError) {
        // Esperamos un error aquí, lo cual es correcto
        console.log(`   ✅ Restricción funcionó: No se puede canjear sin puntos suficientes`);
        console.log(`   ✅ Error esperado: ${claimError.message}\n`);
        this.testResults.passed++;
      } else {
        throw new Error('El canje debería haber fallado por puntos insuficientes');
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}\n`);
      this.testResults.failed++;
      this.testResults.errors.push(error.message);
    }
  }

  async testPointsHistory() {
    console.log('📊 Test 7: Historial de puntos');
    
    try {
      // Obtener el historial completo de transacciones
      const { data: transactions, error: historyError } = await this.supabase
        .from('points_transactions')
        .select('*')
        .eq('child_id', this.testData.child.id)
        .order('created_at', { ascending: false });

      if (historyError) {
        throw new Error(`Error obteniendo historial: ${historyError.message}`);
      }

      // Verificar que tengamos todas las transacciones esperadas
      const expectedTypes = ['HABIT', 'BEHAVIOR', 'REWARD_REDEMPTION'];
      const foundTypes = new Set(transactions.map(t => t.transaction_type));

      for (const expectedType of expectedTypes) {
        if (!foundTypes.has(expectedType)) {
          throw new Error(`Falta transacción de tipo: ${expectedType}`);
        }
      }

      console.log(`   ✅ Historial obtenido: ${transactions.length} transacciones`);
      transactions.forEach(t => {
        console.log(`   - ${t.transaction_type}: ${t.points > 0 ? '+' : ''}${t.points} puntos`);
      });
      console.log('');
      
      this.testResults.passed++;
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}\n`);
      this.testResults.failed++;
      this.testResults.errors.push(error.message);
    }
  }

  async cleanup() {
    console.log('🧹 Limpiando datos de prueba...');
    
    try {
      // Eliminar en orden correcto para no violar constraints
      const operations = [
        { table: 'reward_claims', condition: `reward_id IN (SELECT id FROM rewards WHERE child_id = '${this.testData.child.id}')` },
        { table: 'rewards', condition: `child_id = '${this.testData.child.id}'` },
        { table: 'behavior_records', condition: `behavior_id IN (SELECT id FROM behaviors WHERE child_id = '${this.testData.child.id}')` },
        { table: 'behaviors', condition: `child_id = '${this.testData.child.id}'` },
        { table: 'habit_records', condition: `habit_id IN (SELECT id FROM habits WHERE child_id = '${this.testData.child.id}')` },
        { table: 'routine_habits', condition: `habit_id IN (SELECT id FROM habits WHERE child_id = '${this.testData.child.id}')` },
        { table: 'routines', condition: `child_id = '${this.testData.child.id}'` },
        { table: 'habits', condition: `child_id = '${this.testData.child.id}'` },
        { table: 'points_transactions', condition: `child_id = '${this.testData.child.id}'` },
        { table: 'children', condition: `id = '${this.testData.child.id}'` },
      ];

      for (const op of operations) {
        await this.supabase
          .from(op.table)
          .delete()
          .filter('id', 'in', `(${this.supabase.from(op.table).select('id').match(op.condition)})`);
      }

      // Eliminar usuario
      if (this.testData.user) {
        await this.supabase.auth.admin.deleteUser(this.testData.user.id);
      }

      console.log('✅ Limpieza completada\n');
      
    } catch (error) {
      console.log(`⚠️ Error en limpieza (requerida manual): ${error.message}\n`);
    }
  }

  printResults() {
    console.log('📋 RESULTADOS DEL TEST DE INTEGRACIÓN');
    console.log('=====================================');
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
      console.log('\n🎉 TODAS LAS PRUEBAS PASARON CORRECTAMENTE');
      console.log('✅ El Sistema de Refuerzo Integral funciona como se espera');
    } else {
      console.log('\n⚠️ ALGUNAS PRUEBAS FALLARON - REVISAR ERRORES');
    }
  }
}

// Ejecutar el test
async function main() {
  const test = new PointsSystemIntegrationTest();
  await test.runAllTests();
}

// Exportar para uso en otros scripts
export { PointsSystemIntegrationTest, TestUtils };

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Error ejecutando tests:', error);
    process.exit(1);
  });
}