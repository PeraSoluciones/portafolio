'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAppStore } from '@/store/app-store';
import { ArrowLeft, Star, Award } from 'lucide-react';
import Link from 'next/link';

export default function NewBehaviorPage() {
  const { user, children, selectedChild, setSelectedChild } = useAppStore();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: '',
    points: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!user) {
      setError('Debes iniciar sesión para crear un comportamiento');
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
        .from('behaviors')
        .insert([
          {
            child_id: selectedChild.id,
            title: formData.title,
            description: formData.description,
            type: formData.type,
            points: parseInt(formData.points),
          },
        ])
        .select()
        .single();

      if (insertError) {
        setError(insertError.message);
        return;
      }

      // Redirigir a la página de comportamientos
      router.push('/behaviors');
    } catch (err) {
      setError('Ocurrió un error inesperado');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const behaviorExamples = {
    POSITIVE: [
      'Completar tareas escolares',
      'Compartir juguetes',
      'Seguir instrucciones',
      'Ayudar en casa',
      'Ser amable con otros'
    ],
    NEGATIVE: [
      'Interrumpir conversaciones',
      'No seguir instrucciones',
      'Comportamiento disruptivo',
      'Pérdida de autocontrol',
      'Agresividad verbal'
    ]
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
                <Link href="/behaviors" className="text-blue-600 font-medium">
                  Comportamientos
                </Link>
              </nav>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link href="/behaviors" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a comportamientos
          </Link>
          <h2 className="text-3xl font-bold text-gray-900">Nuevo comportamiento</h2>
          <p className="text-gray-600 mt-2">
            Define comportamientos para registrar y asignar puntos
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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Star className="h-5 w-5" />
              <span>Información del comportamiento</span>
            </CardTitle>
            <CardDescription>
              Define los detalles del comportamiento y su sistema de puntos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Título del comportamiento</Label>
                <Input
                  id="title"
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  required
                  placeholder="Ej: Completar tareas escolares, Compartir juguetes"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción (opcional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe en qué consiste el comportamiento..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Tipo de comportamiento</Label>
                <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="POSITIVE">
                      <div className="flex items-center space-x-2">
                        <span className="text-green-600">➕</span>
                        <span>Positivo - Refuerza conductas deseables</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="NEGATIVE">
                      <div className="flex items-center space-x-2">
                        <span className="text-red-600">➖</span>
                        <span>Negativo - Registra conductas a mejorar</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="points">Puntos</Label>
                <Input
                  id="points"
                  type="number"
                  value={formData.points}
                  onChange={(e) => handleInputChange('points', e.target.value)}
                  required
                  placeholder="10"
                />
                <p className="text-sm text-gray-500">
                  Usa números positivos para comportamientos positivos y negativos para los negativos
                </p>
              </div>

              {formData.type && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Ejemplos de comportamientos {formData.type === 'POSITIVE' ? 'positivos' : 'negativos'}:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {behaviorExamples[formData.type as keyof typeof behaviorExamples].map((example, index) => (
                      <li key={index} className="flex items-center space-x-2">
                        <span className="text-blue-500">•</span>
                        <span>{example}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex justify-end space-x-4">
                <Link href="/behaviors">
                  <Button variant="outline">Cancelar</Button>
                </Link>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Creando...' : 'Crear comportamiento'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}