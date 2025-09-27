'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAppStore } from '@/store/app-store';
import { ArrowLeft, Gift, Award } from 'lucide-react';
import Link from 'next/link';

const rewardExamples = [
  { title: 'Tiempo extra de pantalla', points: 50, description: '30 minutos adicionales de tablet o videojuegos' },
  { title: 'Salida especial', points: 100, description: 'Ir al parque, cine o lugar favorito' },
  { title: 'Postre favorito', points: 30, description: 'Helado, pastel o dulce preferido' },
  { title: 'Juguete nuevo', points: 200, description: 'Un juguete pequeño de su elección' },
  { title: 'Tiempo con padres', points: 75, description: 'Actividad especial juntos: juegos, lectura, etc.' },
  { title: 'Amigo para dormir', points: 150, description: 'Invitar a un amigo a dormir' },
  { title: 'Elegir cena', points: 40, description: 'Seleccionar la comida familiar de una noche' },
  { title: 'Día sin tareas', points: 120, description: 'Libre de responsabilidades escolares por un día' },
];

export default function NewRewardPage() {
  const { user, children, selectedChild, setSelectedChild } = useAppStore();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    points_required: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!user) {
      setError('Debes iniciar sesión para crear una recompensa');
      setIsLoading(false);
      return;
    }

    if (!selectedChild) {
      setError('Debes seleccionar un hijo');
      setIsLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      
      const { data, error: insertError } = await supabase
        .from('rewards')
        .insert([
          {
            child_id: selectedChild.id,
            title: formData.title,
            description: formData.description,
            points_required: parseInt(formData.points_required),
            is_active: true,
          },
        ])
        .select()
        .single();

      if (insertError) {
        setError(insertError.message);
        return;
      }

      // Redirigir a la página de recompensas
      router.push('/rewards');
    } catch (err) {
      setError('Ocurrió un error inesperado');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleUseExample = (example: typeof rewardExamples[0]) => {
    setFormData({
      title: example.title,
      description: example.description,
      points_required: example.points.toString(),
    });
  };

  if (!user) {
    router.push('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">CONTIGO</h1>
              <nav className="ml-10 flex space-x-8">
                <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
                  Dashboard
                </Link>
                <Link href="/children" className="text-gray-600 hover:text-gray-900">
                  Hijos
                </Link>
                <Link href="/routines" className="text-gray-600 hover:text-gray-900">
                  Rutinas
                </Link>
                <Link href="/habits" className="text-gray-600 hover:text-gray-900">
                  Hábitos
                </Link>
                <Link href="/behaviors" className="text-gray-600 hover:text-gray-900">
                  Comportamientos
                </Link>
                <Link href="/rewards" className="text-blue-600 font-medium">
                  Recompensas
                </Link>
              </nav>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link href="/rewards" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a recompensas
          </Link>
          <h2 className="text-3xl font-bold text-gray-900">Nueva recompensa</h2>
          <p className="text-gray-600 mt-2">
            Crea recompensas motivadoras para incentivar comportamientos positivos
          </p>
        </div>

        {/* Selector de hijo */}
        {children.length > 1 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Selecciona un hijo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                {children.map((child) => (
                  <Card
                    key={child.id}
                    className={`cursor-pointer transition-all ${
                      selectedChild?.id === child.id ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:shadow-md'
                    }`}
                    onClick={() => setSelectedChild(child)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <div>
                          <h3 className="font-medium text-gray-900">{child.name}</h3>
                          <p className="text-sm text-gray-500">{child.age} años</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Gift className="h-5 w-5" />
                  <span>Información de la recompensa</span>
                </CardTitle>
                <CardDescription>
                  Define los detalles de la recompensa y su costo en puntos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="title">Título de la recompensa</Label>
                    <Input
                      id="title"
                      type="text"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      required
                      placeholder="Ej: Tiempo extra de pantalla, Salida especial, Postre favorito"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Descripción (opcional)</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Describe en qué consiste la recompensa..."
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="points_required">Puntos requeridos</Label>
                    <Input
                      id="points_required"
                      type="number"
                      value={formData.points_required}
                      onChange={(e) => handleInputChange('points_required', e.target.value)}
                      required
                      min="1"
                      placeholder="50"
                    />
                    <p className="text-sm text-gray-500">
                      Cantidad de puntos necesarios para canjear esta recompensa
                    </p>
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="flex justify-end space-x-4">
                    <Link href="/rewards">
                      <Button variant="outline">Cancelar</Button>
                    </Link>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? 'Creando...' : 'Crear recompensa'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Award className="h-5 w-5" />
                  <span>Ejemplos</span>
                </CardTitle>
                <CardDescription>
                  Ideas de recompensas que puedes usar
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {rewardExamples.map((example, index) => (
                    <div
                      key={index}
                      className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => handleUseExample(example)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium text-sm">{example.title}</h4>
                        <Badge variant="outline" className="text-xs">
                          {example.points} pts
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600">{example.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}