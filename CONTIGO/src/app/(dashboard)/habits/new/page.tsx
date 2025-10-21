'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAppStore } from '@/store/app-store';
import { ArrowLeft, Target, Award } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { habitSchema, type HabitFormValues } from '@/lib/validations/habit';
import { useToast } from '@/hooks/use-toast';

const habitCategories = [
  {
    value: 'SLEEP',
    label: 'Sueño',
    examples: 'Horas de sueño, calidad del descanso',
  },
  {
    value: 'NUTRITION',
    label: 'Nutrición',
    examples: 'Comidas saludables, consumo de agua',
  },
  {
    value: 'EXERCISE',
    label: 'Ejercicio',
    examples: 'Minutos de actividad física, deportes',
  },
  {
    value: 'HYGIENE',
    label: 'Higiene',
    examples: 'Cepillado de dientes, baño diario',
  },
  {
    value: 'SOCIAL',
    label: 'Social',
    examples: 'Interacciones positivas, compartir',
  },
  {
    value: 'ORGANIZATION',
    label: 'Organización',
    examples: 'Orden, planificación, técnicas de estudio',
  },
];

export default function NewHabitPage() {
  const { user, children, selectedChild, setSelectedChild } = useAppStore();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    target_frequency: '',
    unit: '',
  });
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof HabitFormValues, string>>
  >({});
  const [isLoading, setIsLoading] = useState(false);
  const [selectedExample, setSelectedExample] = useState<string | null>(null);
  const router = useRouter();

  const typeColors = {
    SLEEP: {
      border: 'border-t-blue-500',
      text: 'text-blue-600',
      button: 'bg-blue-600 hover:bg-blue-700',
    },
    NUTRITION: {
      border: 'border-t-green-500',
      text: 'text-green-600',
      button: 'bg-green-600 hover:bg-green-700',
    },
    EXERCISE: {
      border: 'border-t-orange-500',
      text: 'text-orange-600',
      button: 'bg-orange-600 hover:bg-orange-700',
    },
    HYGIENE: {
      border: 'border-t-purple-500',
      text: 'text-purple-600',
      button: 'bg-purple-600 hover:bg-purple-700',
    },
    SOCIAL: {
      border: 'border-t-pink-500',
      text: 'text-pink-600',
      button: 'bg-pink-600 hover:bg-pink-700',
    },
    ORGANIZATION: {
      border: 'border-t-indigo-500',
      text: 'text-indigo-600',
      button: 'bg-indigo-600 hover:bg-indigo-700',
    },
    default: {
      border: 'border-t-secondary',
      text: 'text-secondary',
      button: 'bg-secondary hover:bg-secondary/90',
    },
  };

  const currentStyle =
    typeColors[formData.category as keyof typeof typeColors] ||
    typeColors.default;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setFieldErrors({});

    if (!user) {
      toast({
        title: 'Error de autenticación',
        description: 'Debes iniciar sesión para crear un hábito',
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }

    if (!selectedChild) {
      toast({
        title: 'Error de selección',
        description: 'Debes seleccionar un hijo',
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }

    // Validar con Zod
    const validationResult = habitSchema.safeParse(formData);

    if (!validationResult.success) {
      // Extraer errores de validación por campo
      const errors: Partial<Record<keyof HabitFormValues, string>> = {};
      validationResult.error.issues.forEach((issue) => {
        const fieldName = issue.path[0] as keyof HabitFormValues;
        errors[fieldName] = issue.message;
      });

      setFieldErrors(errors);

      toast({
        title: 'Error de validación',
        description: 'Por favor, corrige los errores en el formulario',
        variant: 'destructive',
      });

      setIsLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const validatedData = validationResult.data;

      const { data, error: insertError } = await supabase
        .from('habits')
        .insert([
          {
            child_id: selectedChild.id,
            title: validatedData.title,
            description: validatedData.description,
            category: validatedData.category,
            target_frequency: validatedData.target_frequency,
            unit: validatedData.unit,
          },
        ])
        .select()
        .single();

      if (insertError) {
        toast({
          title: 'Error al crear el hábito',
          description: insertError.message,
          variant: 'destructive',
        });
        return;
      }

      // Notificación de éxito con color según la categoría
      const categoryColors = {
        SLEEP: 'bg-blue-500',
        NUTRITION: 'bg-green-500',
        EXERCISE: 'bg-orange-500',
        HYGIENE: 'bg-purple-500',
        SOCIAL: 'bg-pink-500',
        ORGANIZATION: 'bg-indigo-500',
      };

      toast({
        title: '¡Hábito creado exitosamente!',
        description: `"${validatedData.title}" ha sido agregado a la lista de hábitos.`,
        variant: 'success',
      });

      // Redirigir a la página de hábitos
      router.push('/habits');
    } catch (err) {
      toast({
        title: 'Error inesperado',
        description:
          'Ocurrió un error al crear el hábito. Por favor, inténtalo nuevamente.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleExampleClick = (example: string) => {
    handleInputChange('title', example);
    setSelectedExample(example);
    setTimeout(() => setSelectedExample(null), 300);
  };

  const getUnitSuggestions = (category: string) => {
    const suggestions: { [key: string]: string[] } = {
      SLEEP: ['horas', 'minutos', 'veces'],
      NUTRITION: ['porciones', 'vasos', 'veces', 'gramos'],
      EXERCISE: ['minutos', 'horas', 'veces', 'kilómetros'],
      HYGIENE: ['veces', 'minutos'],
      SOCIAL: ['veces', 'minutos', 'interacciones'],
      ORGANIZATION: ['minutos', 'veces', 'tareas'],
    };
    return suggestions[category] || [];
  };

  const habitExamples = {
    SLEEP: [
      'Mantener un horario regular para acostarse',
      'Asegurarse de dormir 8 horas diarias',
      'Tener una rutina relajante antes de dormir',
    ],
    NUTRITION: [
      'Mantener una dieta equilibrada',
      'Comer 5 porciones de frutas y verduras',
      'Tomar suficiente agua durante el día',
    ],
    EXERCISE: [
      'Realizar ejercicio regularmente',
      'Hacer 30 minutos de actividad física diaria',
      'Practicar deportes 3 veces por semana',
    ],
    HYGIENE: [
      'Lavarse los dientes 2 veces al día',
      'Ducharse diariamente',
      'Lavarse las manos antes de comer',
    ],
    SOCIAL: [
      'Practicar habilidades sociales (saludar, escuchar)',
      'Compartir con compañeros',
      'Participar en actividades grupales',
    ],
    ORGANIZATION: [
      'Ordenar la mesa de trabajo 5 minutos al día',
      'Revisar la agenda escolar diariamente',
      'Usar técnicas de estudio (subrayado, esquemas)',
      'Practicar autoinstrucciones para tareas',
      'Seguir pasos para resolver problemas',
    ],
  };

  if (!user) {
    router.push('/login');
    return null;
  }

  return (
    <>
      <div className='mb-8'>
        <Link
          href='/habits'
          className='inline-flex items-center text-gray-600 hover:text-gray-900 mb-4'
        >
          <ArrowLeft className='h-4 w-4 mr-2' />
          Volver a hábitos
        </Link>
        <h2 className='text-3xl font-bold text-gray-900'>Nuevo hábito</h2>
        <p className='text-gray-600 mt-2'>
          Crea un hábito para fomentar rutinas saludables y positivas
        </p>
      </div>

      <Card
        className={`transition-all duration-300 border-t-4 ${currentStyle.border}`}
      >
        <CardHeader>
          <CardTitle className='flex items-center space-x-2'>
            <Target className={`h-5 w-5 ${currentStyle.text}`} />
            <span>Información del hábito</span>
          </CardTitle>
          <CardDescription>
            Define los detalles del hábito que quieres seguir
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className='space-y-6'>
            <div className='space-y-2'>
              <Label htmlFor='title'>Título del hábito</Label>
              <Input
                id='title'
                type='text'
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                required
                placeholder='Ej: Dormir 8 horas, Comer frutas, Hacer ejercicio'
                className={fieldErrors.title ? 'border-red-500' : ''}
              />
              {fieldErrors.title && (
                <p className='text-sm text-red-500'>{fieldErrors.title}</p>
              )}
            </div>

            <div className='space-y-2'>
              <Label htmlFor='description'>Descripción (opcional)</Label>
              <Textarea
                id='description'
                value={formData.description}
                onChange={(e) =>
                  handleInputChange('description', e.target.value)
                }
                placeholder='Describe en qué consiste el hábito y por qué es importante...'
                rows={3}
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='category'>Categoría</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => handleInputChange('category', value)}
              >
                <SelectTrigger
                  className={fieldErrors.category ? 'border-red-500' : ''}
                >
                  <SelectValue placeholder='Selecciona una categoría' />
                </SelectTrigger>
                <SelectContent>
                  {habitCategories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      <div>
                        <div className='font-medium'>{category.label}</div>
                        <div className='text-xs text-gray-500'>
                          {category.examples}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldErrors.category && (
                <p className='text-sm text-red-500'>{fieldErrors.category}</p>
              )}
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div className='space-y-2'>
                <Label htmlFor='target_frequency'>Frecuencia objetivo</Label>
                <Input
                  id='target_frequency'
                  type='number'
                  value={formData.target_frequency}
                  onChange={(e) =>
                    handleInputChange('target_frequency', e.target.value)
                  }
                  required
                  min='1'
                  placeholder='8'
                  className={
                    fieldErrors.target_frequency ? 'border-red-500' : ''
                  }
                />
                {fieldErrors.target_frequency && (
                  <p className='text-sm text-red-500'>
                    {fieldErrors.target_frequency}
                  </p>
                )}
              </div>
              <div className='space-y-2'>
                <Label htmlFor='unit'>Unidad de medida</Label>
                <Input
                  id='unit'
                  type='text'
                  value={formData.unit}
                  onChange={(e) => handleInputChange('unit', e.target.value)}
                  required
                  placeholder='horas, veces, porciones'
                  className={fieldErrors.unit ? 'border-red-500' : ''}
                />
                {fieldErrors.unit && (
                  <p className='text-sm text-red-500'>{fieldErrors.unit}</p>
                )}
                {formData.category && (
                  <div className='text-xs text-gray-500 mt-1'>
                    Sugerencias:{' '}
                    {getUnitSuggestions(formData.category).join(', ')}
                  </div>
                )}
              </div>
            </div>

            {formData.category && (
              <div
                className={`p-4 rounded-lg border ${
                  formData.category === 'SLEEP'
                    ? 'bg-blue-50 border-blue-200'
                    : formData.category === 'NUTRITION'
                    ? 'bg-green-50 border-green-200'
                    : formData.category === 'EXERCISE'
                    ? 'bg-orange-50 border-orange-200'
                    : formData.category === 'HYGIENE'
                    ? 'bg-purple-50 border-purple-200'
                    : formData.category === 'SOCIAL'
                    ? 'bg-pink-50 border-pink-200'
                    : formData.category === 'ORGANIZATION'
                    ? 'bg-indigo-50 border-indigo-200'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className='flex items-center space-x-2 mb-3'>
                  <div
                    className={`p-1 rounded-full ${
                      formData.category === 'SLEEP'
                        ? 'bg-blue-100'
                        : formData.category === 'NUTRITION'
                        ? 'bg-green-100'
                        : formData.category === 'EXERCISE'
                        ? 'bg-orange-100'
                        : formData.category === 'HYGIENE'
                        ? 'bg-purple-100'
                        : formData.category === 'SOCIAL'
                        ? 'bg-pink-100'
                        : formData.category === 'ORGANIZATION'
                        ? 'bg-indigo-100'
                        : 'bg-gray-100'
                    }`}
                  >
                    <Award
                      className={`h-4 w-4 ${
                        formData.category === 'SLEEP'
                          ? 'text-blue-600'
                          : formData.category === 'NUTRITION'
                          ? 'text-green-600'
                          : formData.category === 'EXERCISE'
                          ? 'text-orange-600'
                          : formData.category === 'HYGIENE'
                          ? 'text-purple-600'
                          : formData.category === 'SOCIAL'
                          ? 'text-pink-600'
                          : formData.category === 'ORGANIZATION'
                          ? 'text-indigo-600'
                          : 'text-gray-600'
                      }`}
                    />
                  </div>
                  <h4 className='font-medium text-gray-900'>
                    Ideas inspiradoras para hábitos de{' '}
                    {habitCategories
                      .find((c) => c.value === formData.category)
                      ?.label.toLowerCase()}
                    :
                  </h4>
                </div>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-2'>
                  {habitExamples[
                    formData.category as keyof typeof habitExamples
                  ].map((example, index) => (
                    <div
                      key={index}
                      className={`p-2 rounded-md text-sm cursor-pointer transition-all hover:shadow-sm ${
                        selectedExample === example
                          ? formData.category === 'SLEEP'
                            ? 'bg-blue-200 border-blue-400 scale-95'
                            : formData.category === 'NUTRITION'
                            ? 'bg-green-200 border-green-400 scale-95'
                            : formData.category === 'EXERCISE'
                            ? 'bg-orange-200 border-orange-400 scale-95'
                            : formData.category === 'HYGIENE'
                            ? 'bg-purple-200 border-purple-400 scale-95'
                            : formData.category === 'SOCIAL'
                            ? 'bg-pink-200 border-pink-400 scale-95'
                            : formData.category === 'ORGANIZATION'
                            ? 'bg-indigo-200 border-indigo-400 scale-95'
                            : 'bg-gray-200 border-gray-400 scale-95'
                          : formData.category === 'SLEEP'
                          ? 'bg-white border border-blue-200 hover:bg-blue-100'
                          : formData.category === 'NUTRITION'
                          ? 'bg-white border border-green-200 hover:bg-green-100'
                          : formData.category === 'EXERCISE'
                          ? 'bg-white border border-orange-200 hover:bg-orange-100'
                          : formData.category === 'HYGIENE'
                          ? 'bg-white border border-purple-200 hover:bg-purple-100'
                          : formData.category === 'SOCIAL'
                          ? 'bg-white border border-pink-200 hover:bg-pink-100'
                          : formData.category === 'ORGANIZATION'
                          ? 'bg-white border border-indigo-200 hover:bg-indigo-100'
                          : 'bg-white border border-gray-200 hover:bg-gray-100'
                      }`}
                      onClick={() => handleExampleClick(example)}
                    >
                      <div className='flex items-center space-x-2'>
                        <span
                          className={`${
                            formData.category === 'SLEEP'
                              ? 'text-blue-500'
                              : formData.category === 'NUTRITION'
                              ? 'text-green-500'
                              : formData.category === 'EXERCISE'
                              ? 'text-orange-500'
                              : formData.category === 'HYGIENE'
                              ? 'text-purple-500'
                              : formData.category === 'SOCIAL'
                              ? 'text-pink-500'
                              : formData.category === 'ORGANIZATION'
                              ? 'text-indigo-500'
                              : 'text-gray-500'
                          }`}
                        >
                          ✓
                        </span>
                        <span className='text-gray-700'>{example}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <p className='text-xs text-gray-500 mt-3 italic'>
                  💡 Haz clic en cualquier ejemplo para usarlo como título
                </p>
              </div>
            )}

            <div className='flex justify-end space-x-4 border-t pt-6 mt-6'>
              <Link href='/habits'>
                <Button variant='outline'>Cancelar</Button>
              </Link>
              <Button
                type='submit'
                disabled={isLoading}
                className={cn(currentStyle.button)}
              >
                {isLoading ? 'Creando...' : 'Crear hábito'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
