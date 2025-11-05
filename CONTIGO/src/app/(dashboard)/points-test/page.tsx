import { Metadata } from 'next';
import PointsTestRunner from '@/components/points-test-runner';

export const metadata: Metadata = {
  title: 'Verificación del Sistema de Puntos',
  description: 'Ejecuta pruebas completas para verificar el funcionamiento del sistema de puntos',
};

export default function PointsTestPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Verificación del Sistema de Puntos</h1>
        <p className="text-muted-foreground mt-2">
          Utiliza esta herramienta para ejecutar pruebas completas y verificar que el sistema de puntos esté funcionando correctamente.
        </p>
      </div>
      
      <PointsTestRunner />
      
      <div className="mt-12 space-y-4">
        <h2 className="text-2xl font-semibold">¿Qué se verifica?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <span>📋</span> Esquema de Base de Datos
            </h3>
            <ul className="text-sm text-muted-foreground space-y-1 ml-6">
              <li>• Verifica que todas las tablas necesarias existan</li>
              <li>• Comprueba que las columnas requeridas estén presentes</li>
              <li>• Valida que las funciones RPC estén configuradas</li>
              <li>• Revisa las políticas de seguridad (RLS)</li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <span>📊</span> Consistencia de Datos
            </h3>
            <ul className="text-sm text-muted-foreground space-y-1 ml-6">
              <li>• Verifica que los balances de puntos sean correctos</li>
              <li>• Comprueba que no haya valores negativos inesperados</li>
              <li>• Valida la consistencia de las transacciones</li>
              <li>• Suggest reparaciones automáticas cuando sea posible</li>
            </ul>
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-lg font-medium text-blue-900 mb-2">💡 Nota Importante</h3>
          <p className="text-sm text-blue-800">
            Esta herramienta está diseñada para desarrollo y diagnóstico. En un entorno de producción, 
            considera ejecutar estas verificaciones de forma programática en intervalos regulares 
            para asegurar la integridad continua del sistema.
          </p>
        </div>
      </div>
    </div>
  );
}