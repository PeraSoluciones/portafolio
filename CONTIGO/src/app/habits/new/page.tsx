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
import { Habit } from '@/types';
import { ArrowLeft, Target } from 'lucide-react';
import Link from 'next/link';

const habitCategories = [
  { value: 'SLEEP', label: 'Sueño', examples: 'Horas de sueño, calidad del descanso' },
  { value: 'NUTRITION', label: 'Nutrición', examples: 'Comidas saludables, consumo de agua' },
  { value: 'EXERCISE', label: 'Ejercicio', examples: 'Minutos de actividad física, deportes' },
  { value: 'HYGIENE', label: 'Higiene', examples: 'Cepillado de dientes, baño diario' },
  { value: 'SOCIAL', label: 'Social', examples: 'Interacciones positivas, compartir' },
];

export default function NewHabitPage() {
  const { user, children, selectedChild, setSelectedChild } = useAppStore();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    target_frequency: '',
    unit: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!user) {
      setError('Debes iniciar sesión para crear un hábito');
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
        .from('habits')
        .insert([
          {
            child_id: selectedChild.id,
            title: formData.title,
            description: formData.description,
            category: formData.category,
            target_frequency: parseInt(formData.target_frequency),
            unit: formData.unit,
          },
        ])
        .select()
        .single();

      if (insertError) {
        setError(insertError.message);
        return;
      }

      // Redirigir a la página de hábitos
      router.push('/habits');
    } catch (err) {
      setError('Ocurrió un error inesperado');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getUnitSuggestions = (category: string) => {
    const suggestions: { [key: string]: string[] } = {
      'SLEEP': ['horas', 'minutos', 'veces'],
      'NUTRITION': ['porciones', 'vasos', 'veces', 'gramos'],
      'EXERCISE': ['minutos', 'horas', 'veces', 'kilómetros'],
      'HYGIENE': ['veces', 'minutos'],
      'SOCIAL': ['veces', 'minutos', 'interacciones'],
    };
    return suggestions[category] || [];
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
                <Link href="/habits" className="text-blue-600 font-medium">
                  Hábitos
                </Link>
              </nav>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link href="/habits" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a hábitos
          </Link>
          <h2 className="text-3xl font-bold text-gray-900">Nuevo hábito</h2>
          <p className="text-gray-600 mt-2">
            Crea un hábito para fomentar rutinas saludables y positivas
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
              <Target className="h-5 w-5" />
              <span>Información del hábito</span>
            </CardTitle>
            <CardDescription>
              Define los detalles del hábito que quieres seguir
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Título del hábito</Label>
                <Input
                  id="title"
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  required
                  placeholder="Ej: Dormir 8 horas, Comer frutas, Hacer ejercicio"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción (opcional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe en qué consiste el hábito y por qué es importante..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Categoría</Label>
                <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {habitCategories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        <div>
                          <div className="font-medium">{category.label}</div>
                          <div className="text-xs text-gray-500">{category.examples}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="target_frequency">Frecuencia objetivo</Label>
                  <Input
                    id="target_frequency"
                    type="number"
                    value={formData.target_frequency}
                    onChange={(e) => handleInputChange('target_frequency', e.target.value)}
                    required
                    min="1"
                    placeholder="8"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">Unidad de medida</Label>
                  <Input
                    id="unit"
                    type="text"
                    value={formData.unit}
                    onChange={(e) => handleInputChange('unit', e.target.value)}
                    required
                    placeholder="horas, veces, porciones"
                  />
                  {formData.category && (
                    <div className="text-xs text-gray-500 mt-1">
                      Sugerencias: {getUnitSuggestions(formData.category).join(', ')}
                    </div>
                  )}
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex justify-end space-x-4">
                <Link href="/habits">
                  <Button variant="outline">Cancelar</Button>
                </Link>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Creando...' : 'Crear hábito'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}