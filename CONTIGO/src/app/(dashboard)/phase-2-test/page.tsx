import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertTriangle, Play, FileText, Database } from 'lucide-react';
import { runPhase2BackendTests } from '@/lib/test-phase-2-backend';

// Marcar la página como Server Component
export const runtime = 'edge';

interface TestResults {
  functions: { passed: number; failed: number; details: string[] };
  triggers: { passed: number; failed: number; details: string[] };
  api: { passed: number; failed: number; details: string[] };
  integration: { passed: number; failed: number; details: string[] };
}

export default async function Phase2TestPage() {
  // Ejecutar las pruebas en el servidor
  const testResults = await runPhase2BackendTests();
  
  const totalPassed = testResults.functions.passed + testResults.triggers.passed +
                   testResults.api.passed + testResults.integration.passed;
  const totalFailed = testResults.functions.failed + testResults.triggers.failed +
                   testResults.api.failed + testResults.integration.failed;

  const getStatusIcon = (passed: number, failed: number) => {
    if (failed > 0) return <XCircle className="h-5 w-5 text-red-500" />;
    if (passed > 0) return <CheckCircle className="h-5 w-5 text-green-500" />;
    return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
  };

  const getStatusBadge = (passed: number, failed: number) => {
    const total = passed + failed;
    if (total === 0) return <Badge variant="outline">No ejecutado</Badge>;
    if (failed === 0) return <Badge variant="default" className="bg-green-500">Exitoso</Badge>;
    const successRate = (passed / total) * 100;
    if (successRate >= 70) return <Badge variant="secondary">Parcial</Badge>;
    return <Badge variant="destructive">Fallido</Badge>;
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pruebas - Fase 2 del Sistema de Puntos</h1>
          <p className="text-muted-foreground mt-2">
            Verificación de la lógica de backend del sistema de refuerzo integral
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={totalFailed === 0 ? "default" : "destructive"}>
            {totalFailed === 0 ? "✅ Todas las pruebas pasaron" : `❌ ${totalFailed} pruebas fallaron`}
          </Badge>
        </div>
      </div>

      <Alert>
        <Database className="h-4 w-4" />
        <AlertTitle>Información de Pruebas</AlertTitle>
        <AlertDescription>
          Estas pruebas verifican que todas las funciones, triggers y endpoints de la API del sistema de puntos funcionen correctamente.
          Los cambios de la Fase 2 ya están aplicados a la base de datos.
        </AlertDescription>
      </Alert>

      {testResults && (
        <div className="space-y-6">
          {/* Resumen General */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Resumen General
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {testResults.functions.passed + testResults.triggers.passed +
                     testResults.api.passed + testResults.integration.passed}
                  </div>
                  <div className="text-sm text-muted-foreground">Pruebas Pasadas</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {testResults.functions.failed + testResults.triggers.failed +
                     testResults.api.failed + testResults.integration.failed}
                  </div>
                  <div className="text-sm text-muted-foreground">Pruebas Fallidas</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {(
                      ((testResults.functions.passed + testResults.triggers.passed +
                        testResults.api.passed + testResults.integration.passed) /
                       (testResults.functions.passed + testResults.functions.failed +
                        testResults.triggers.passed + testResults.triggers.failed +
                        testResults.api.passed + testResults.api.failed +
                        testResults.integration.passed + testResults.integration.failed)) * 100
                    ).toFixed(1)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Tasa de Éxito</div>
                </div>
                <div className="text-center">
                  {getStatusBadge(
                    testResults.functions.passed + testResults.triggers.passed +
                    testResults.api.passed + testResults.integration.passed,
                    testResults.functions.failed + testResults.triggers.failed +
                    testResults.api.failed + testResults.integration.failed
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detalles por Categoría */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Funciones PostgreSQL */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg">Funciones PostgreSQL</CardTitle>
                {getStatusIcon(testResults.functions.passed, testResults.functions.failed)}
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Pruebas pasadas:</span>
                    <span className="font-medium text-green-600">{testResults.functions.passed}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pruebas fallidas:</span>
                    <span className="font-medium text-red-600">{testResults.functions.failed}</span>
                  </div>
                  <Separator />
                  <div className="space-y-1">
                    {testResults.functions.details.map((detail, index) => (
                      <div key={index} className="text-sm text-muted-foreground">
                        {detail}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Triggers */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg">Triggers Automáticos</CardTitle>
                {getStatusIcon(testResults.triggers.passed, testResults.triggers.failed)}
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Pruebas pasadas:</span>
                    <span className="font-medium text-green-600">{testResults.triggers.passed}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pruebas fallidas:</span>
                    <span className="font-medium text-red-600">{testResults.triggers.failed}</span>
                  </div>
                  <Separator />
                  <div className="space-y-1">
                    {testResults.triggers.details.map((detail, index) => (
                      <div key={index} className="text-sm text-muted-foreground">
                        {detail}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* API Endpoints */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg">Endpoints de API</CardTitle>
                {getStatusIcon(testResults.api.passed, testResults.api.failed)}
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Pruebas pasadas:</span>
                    <span className="font-medium text-green-600">{testResults.api.passed}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pruebas fallidas:</span>
                    <span className="font-medium text-red-600">{testResults.api.failed}</span>
                  </div>
                  <Separator />
                  <div className="space-y-1">
                    {testResults.api.details.map((detail, index) => (
                      <div key={index} className="text-sm text-muted-foreground">
                        {detail}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Integración */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg">Integración</CardTitle>
                {getStatusIcon(testResults.integration.passed, testResults.integration.failed)}
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Pruebas pasadas:</span>
                    <span className="font-medium text-green-600">{testResults.integration.passed}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pruebas fallidas:</span>
                    <span className="font-medium text-red-600">{testResults.integration.failed}</span>
                  </div>
                  <Separator />
                  <div className="space-y-1">
                    {testResults.integration.details.map((detail, index) => (
                      <div key={index} className="text-sm text-muted-foreground">
                        {detail}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

// Funciones auxiliares movidas fuera del componente
function getStatusIcon(passed: number, failed: number) {
  if (failed > 0) return <XCircle className="h-5 w-5 text-red-500" />;
  if (passed > 0) return <CheckCircle className="h-5 w-5 text-green-500" />;
  return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
}

function getStatusBadge(passed: number, failed: number) {
  const total = passed + failed;
  if (total === 0) return <Badge variant="outline">No ejecutado</Badge>;
  if (failed === 0) return <Badge variant="default" className="bg-green-500">Exitoso</Badge>;
  const successRate = (passed / total) * 100;
  if (successRate >= 70) return <Badge variant="secondary">Parcial</Badge>;
  return <Badge variant="destructive">Fallido</Badge>;
}