'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { executePointsSystemTest } from '@/lib/execute-points-test';

// Tipos para los resultados de las pruebas
interface TestResults {
  success: boolean;
  schema: {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  };
  consistency: {
    isValid: boolean;
    errors: string[];
    fixes: string[];
  };
  error?: any;
}

interface TestProgress {
  step: string;
  progress: number;
}

export function PointsTestRunner() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestResults | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<TestProgress>({ step: '', progress: 0 });
  const [logs, setLogs] = useState<string[]>([]);

  // Función para ejecutar las pruebas
  const runTests = async () => {
    setIsRunning(true);
    setResults(null);
    setError(null);
    setProgress({ step: 'Iniciando pruebas...', progress: 10 });
    setLogs(['🚀 Iniciando verificación del sistema de puntos...']);

    try {
      // Simular progreso mientras se ejecutan las pruebas
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev.progress < 90) {
            return { ...prev, progress: prev.progress + 5 };
          }
          return prev;
        });
      }, 300);

      // Ejecutar las pruebas
      const testResults = await executePointsSystemTest();
      
      clearInterval(progressInterval);
      setProgress({ step: 'Pruebas completadas', progress: 100 });
      setResults(testResults);
      
      // Agregar logs según los resultados
      if (testResults.success) {
        setLogs(prev => [...prev, '✅ Todas las pruebas pasaron correctamente']);
      } else {
        setLogs(prev => [...prev, '❌ Se encontraron problemas durante las pruebas']);
        
        if (testResults.schema.errors.length > 0) {
          setLogs(prev => [...prev, `📋 Errores de esquema: ${testResults.schema.errors.length}`]);
        }
        
        if (testResults.consistency.errors.length > 0) {
          setLogs(prev => [...prev, `📊 Errores de consistencia: ${testResults.consistency.errors.length}`]);
        }
      }
      
      if (testResults.schema.warnings.length > 0) {
        setLogs(prev => [...prev, `⚠️ Advertencias: ${testResults.schema.warnings.length}`]);
      }
      
      if (testResults.consistency.fixes.length > 0) {
        setLogs(prev => [...prev, `🔧 Reparaciones sugeridas: ${testResults.consistency.fixes.length}`]);
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setLogs(prev => [...prev, `❌ Error durante la ejecución: ${err instanceof Error ? err.message : 'Error desconocido'}`]);
      setProgress({ step: 'Error', progress: 0 });
    } finally {
      setIsRunning(false);
    }
  };

  // Función para limpiar los resultados
  const clearResults = () => {
    setResults(null);
    setError(null);
    setLogs([]);
    setProgress({ step: '', progress: 0 });
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>🧪</span>
            Verificación del Sistema de Puntos
          </CardTitle>
          <CardDescription>
            Ejecuta pruebas completas para verificar el funcionamiento del sistema de puntos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button 
              onClick={runTests} 
              disabled={isRunning}
              className="gap-2"
            >
              {isRunning ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                  Ejecutando pruebas...
                </>
              ) : (
                <>
                  <span>🚀</span>
                  Ejecutar Verificación
                </>
              )}
            </Button>
            {results && (
              <Button 
                variant="outline" 
                onClick={clearResults}
              >
                Limpiar Resultados
              </Button>
            )}
          </div>

          {/* Barra de progreso */}
          {isRunning && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{progress.step}</span>
                <span>{progress.progress}%</span>
              </div>
              <Progress value={progress.progress} className="w-full" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resultados de las pruebas */}
      {results && (
        <div className="space-y-4">
          {/* Resumen general */}
          <Card className={cn(
            results.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
          )}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>{results.success ? '✅' : '❌'}</span>
                Resumen de Verificación
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Esquema de BD:</span>
                    <span className={cn(
                      "font-medium",
                      results.schema.isValid ? "text-green-600" : "text-red-600"
                    )}>
                      {results.schema.isValid ? '✅ Válido' : '❌ Con errores'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Consistencia de Datos:</span>
                    <span className={cn(
                      "font-medium",
                      results.consistency.isValid ? "text-green-600" : "text-red-600"
                    )}>
                      {results.consistency.isValid ? '✅ Consistente' : '❌ Inconsistente'}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Estado General:</span>
                    <span className={cn(
                      "font-medium",
                      results.success ? "text-green-600" : "text-red-600"
                    )}>
                      {results.success ? '✅ Sistema Funcional' : '❌ Requiere Atención'}
                    </span>
                  </div>
                  {results.schema.warnings.length > 0 && (
                    <div className="flex justify-between">
                      <span>Advertencias:</span>
                      <span className="font-medium text-yellow-600">
                        ⚠️ {results.schema.warnings.length}
                      </span>
                    </div>
                  )}
                  {results.consistency.fixes.length > 0 && (
                    <div className="flex justify-between">
                      <span>Reparaciones Sugeridas:</span>
                      <span className="font-medium text-blue-600">
                        🔧 {results.consistency.fixes.length}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Errores del esquema */}
          {results.schema.errors.length > 0 && (
            <Alert variant="destructive">
              <AlertTitle>❌ Errores del Esquema</AlertTitle>
              <AlertDescription>
                <ul className="mt-2 space-y-1">
                  {results.schema.errors.map((error, index) => (
                    <li key={index} className="text-sm">• {error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Advertencias del esquema */}
          {results.schema.warnings.length > 0 && (
            <Alert>
              <AlertTitle>⚠️ Advertencias del Esquema</AlertTitle>
              <AlertDescription>
                <ul className="mt-2 space-y-1">
                  {results.schema.warnings.map((warning, index) => (
                    <li key={index} className="text-sm">• {warning}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Errores de consistencia */}
          {results.consistency.errors.length > 0 && (
            <Alert variant="destructive">
              <AlertTitle>❌ Errores de Consistencia</AlertTitle>
              <AlertDescription>
                <ul className="mt-2 space-y-1">
                  {results.consistency.errors.map((error, index) => (
                    <li key={index} className="text-sm">• {error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Reparaciones sugeridas */}
          {results.consistency.fixes.length > 0 && (
            <Alert>
              <AlertTitle>🔧 Reparaciones Sugeridas</AlertTitle>
              <AlertDescription>
                <ul className="mt-2 space-y-1">
                  {results.consistency.fixes.map((fix, index) => (
                    <li key={index} className="text-sm font-mono bg-gray-100 p-2 rounded">• {fix}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Error general */}
      {error && (
        <Alert variant="destructive">
          <AlertTitle>❌ Error Crítico</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Logs de ejecución */}
      {logs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>📋</span>
              Logs de Ejecución
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-900 text-green-400 p-4 rounded-md font-mono text-sm max-h-60 overflow-y-auto">
              {logs.map((log, index) => (
                <div key={index}>{log}</div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default PointsTestRunner;