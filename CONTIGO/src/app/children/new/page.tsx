'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAppStore } from '@/store/app-store';
import { Child } from '@/types';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewChildPage() {
  const { user } = useAppStore();
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    birth_date: '',
    adhd_type: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!user) {
      setError('Debes iniciar sesión para agregar un hijo');
      setIsLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      
      const { data, error: insertError } = await supabase
        .from('children')
        .insert([
          {
            parent_id: user.id,
            name: formData.name,
            age: parseInt(formData.age),
            birth_date: formData.birth_date,
            adhd_type: formData.adhd_type,
          },
        ])
        .select()
        .single();

      if (insertError) {
        setError(insertError.message);
        return;
      }

      // Redirigir al dashboard
      router.push('/dashboard');
    } catch (err) {
      setError('Ocurrió un error inesperado');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

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
                <Link href="/children" className="text-blue-600 font-medium">
                  Hijos
                </Link>
              </nav>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link href="/children" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a hijos
          </Link>
          <h2 className="text-3xl font-bold text-gray-900">Agregar nuevo hijo</h2>
          <p className="text-gray-600 mt-2">
            Ingresa la información de tu hijo para crear su perfil
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Información personal</CardTitle>
            <CardDescription>
              Los datos ayudarán a personalizar las recomendaciones y rutinas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre completo</Label>
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
                    placeholder="Nombre del hijo"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="age">Edad</Label>
                  <Input
                    id="age"
                    type="number"
                    value={formData.age}
                    onChange={(e) => handleInputChange('age', e.target.value)}
                    required
                    min="1"
                    max="17"
                    placeholder="8"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="birth_date">Fecha de nacimiento</Label>
                <Input
                  id="birth_date"
                  type="date"
                  value={formData.birth_date}
                  onChange={(e) => handleInputChange('birth_date', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="adhd_type">Tipo de TDAH</Label>
                <Select value={formData.adhd_type} onValueChange={(value) => handleInputChange('adhd_type', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el tipo de TDAH" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INATTENTIVE">Inatento</SelectItem>
                    <SelectItem value="HYPERACTIVE">Hiperactivo</SelectItem>
                    <SelectItem value="COMBINED">Combinado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex justify-end space-x-4">
                <Link href="/children">
                  <Button variant="outline">Cancelar</Button>
                </Link>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Agregando...' : 'Agregar hijo'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}