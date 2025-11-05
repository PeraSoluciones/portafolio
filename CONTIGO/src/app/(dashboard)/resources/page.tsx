'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase/client';
import { extractFirstParagraphText } from '@/lib/utils';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppStore } from '@/store/app-store';
import { Resource } from '@/types/index';
import { BookOpen, Video, Lightbulb, Headphones, Calendar, User, Wand2 } from 'lucide-react';
import Link from 'next/link';

export default function ResourcesPage() {
  const { user } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [resources, setResources] = useState<Resource[]>([]);
  const router = useRouter();

  const typeCategoryColors = {
    ROUTINES: 'border-t-secondary',
    HABITS: 'border-t-chart-5',
    BEHAVIOR: 'border-t-accent',
    EMOTIONAL: 'border-t-chart-1',
    EDUCATIONAL: 'border-t-destructive',
  };

  const typeColors = {
    ARTICLE: 'text-accent',
    VIDEO: 'text-chart-1',
    TIP: 'text-success',
    AUDIO: 'text-purple-500',
  };

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    fetchResources();
  }, [user, router]);

  const fetchResources = async () => {
    const supabase = createBrowserClient();
    const { data, error } = await supabase
      .from('resources')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching resources:', error);
    } else {
      setResources(data || []);
    }

    setLoading(false);
  };

  const getResourcesByCategory = (category: string) => {
    return resources.filter((resource) => resource.category === category);
  };

  const getCategoryLabel = (category: string) => {
    const labels: { [key: string]: string } = {
      ROUTINES: 'Rutinas',
      HABITS: 'Hábitos',
      BEHAVIOR: 'Comportamiento',
      EMOTIONAL: 'Emocional',
      EDUCATIONAL: 'Educativo',
    };
    return labels[category] || category;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'ARTICLE':
        return <BookOpen className={`h-4 w-4 ${typeColors[type]}`} />;
      case 'VIDEO':
        return <Video className={`h-4 w-4 ${typeColors[type]}`} />;
      case 'TIP':
        return <Lightbulb className={`h-4 w-4 ${typeColors[type]}`} />;
      case 'AUDIO':
        return <Headphones className={`h-4 w-4 ${typeColors[type]}`} />;
      default:
        return <BookOpen className='h-4 w-4 text-accent' />;
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      ARTICLE: 'Artículo',
      VIDEO: 'Video',
      TIP: 'Consejo',
      AUDIO: 'Audio',
    };
    return labels[type] || type;
  };

  const getAudioDescription = (content: string) => {
    try {
      const parsed = JSON.parse(content);
      if (parsed && typeof parsed.description === 'string') {
        return parsed.description;
      }
    } catch (e) {
      // El contenido no es JSON válido o no tiene la propiedad 'description'
      console.error("Failed to parse audio content:", e);
    }
    // Fallback si todo lo demás falla
    return extractFirstParagraphText(content);
  };

  const getVideoDescription = (content: string) => {
    try {
      const parsed = JSON.parse(content);
      if (parsed && typeof parsed.description === 'string') {
        return parsed.description;
      }
    } catch (e) {
      // El contenido no es JSON válido o no tiene la propiedad 'description'
      console.error("Failed to parse video content:", e);
    }
    // Fallback si todo lo demás falla
    return extractFirstParagraphText(content);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-EC', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50'>
        <div className='animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600'></div>
      </div>
    );
  }

  return (
    <>
      <div className='mb-8'>
        <h1 className='text-3xl font-bold text-foreground'>
          Recursos educativos
        </h1>
        <p className='text-muted-foreground mt-2'>
          Accede a artículos, consejos y guías sobre el manejo del TDAH en niños
        </p>
      </div>

      <Tabs defaultValue='all' className='space-y-6'>
        <TabsList className='flex overflow-x-auto whitespace-nowrap scrollbar-hide'>
          <TabsTrigger value='all'>Todos</TabsTrigger>
          <TabsTrigger value='ROUTINES'>Rutinas</TabsTrigger>
          <TabsTrigger value='HABITS'>Hábitos</TabsTrigger>
          <TabsTrigger value='BEHAVIOR'>Comportamiento</TabsTrigger>
          <TabsTrigger value='EMOTIONAL'>Emocional</TabsTrigger>
          <TabsTrigger value='EDUCATIONAL'>Educativo</TabsTrigger>
        </TabsList>

        {/* Tarjeta especial para el Generador de Planes de Acción */}
        <div className='mb-8'>
            <Card className="border-2 border-dashed border-primary hover:shadow-lg transition-shadow cursor-pointer group">
                <Link href="/resources/action-plan-generator">
                  <CardHeader>
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center space-x-2'>
                        <Wand2 className='h-6 w-6 text-primary' />
                        <Badge variant='default' className="bg-primary">
                          Herramienta IA
                        </Badge>
                      </div>
                    </div>
                    <CardTitle className='text-2xl group-hover:text-primary transition-colors'>
                      Generador de Planes de Acción
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className='text-muted-foreground mb-4 text-lg'>
                      Obtén un plan de acción personalizado y basado en IA para abordar desafíos específicos del TDAH. Describe una situación y recibe estrategias prácticas de un experto.
                    </p>
                    <Button variant="default" className="w-full">
                      Generar Plan Ahora
                    </Button>
                  </CardContent>
                </Link>
            </Card>
        </div>

        <TabsContent value='all' className='space-y-6'>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {resources.map((resource) => (
              <Card
                key={resource.id}
                className={`hover:shadow-lg transition-shadow border-t-4 ${
                  typeCategoryColors[resource.category] || 'border-t-chart-3'
                }`}
              >
                <CardHeader>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center space-x-2'>
                      {getTypeIcon(resource.type)}
                      <Badge variant='outline'>
                        {getTypeLabel(resource.type)}
                      </Badge>
                    </div>
                    <Badge variant='secondary'>
                      {getCategoryLabel(resource.category)}
                    </Badge>
                  </div>
                  <CardTitle className='text-xl'>{resource.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className='text-muted-foreground mb-4 line-clamp-3'>
                    {resource.type === 'AUDIO'
                      ? getAudioDescription(resource.content)
                      : resource.type === 'VIDEO'
                      ? getVideoDescription(resource.content)
                      : extractFirstParagraphText(resource.content)
                    }
                  </p>
                  <div className='flex items-center justify-between text-sm text-muted-foreground'>
                    <div className='flex items-center space-x-1'>
                      <Calendar className='h-4 w-4' />
                      <span>{formatDate(resource.created_at)}</span>
                    </div>
                    <Link href={`/resources/${resource.id}`}>
                      <Button variant='outline' size='sm'>
                        {resource.type === 'AUDIO' ? 'Reproducir' : resource.type === 'VIDEO' ? 'Reproducir' : 'Leer más'}
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {['ROUTINES', 'HABITS', 'BEHAVIOR', 'EMOTIONAL', 'EDUCATIONAL'].map(
          (category) => (
            <TabsContent key={category} value={category} className='space-y-6'>
              <div className='mb-6'>
                <h3 className='text-2xl font-bold text-foreground'>
                  {getCategoryLabel(category)}
                </h3>
                <p className='text-muted-foreground mt-2'>
                  Recursos especializados en{' '}
                  {getCategoryLabel(category).toLowerCase()}
                </p>
              </div>

              {getResourcesByCategory(category).length === 0 ? (
                <div className='text-center py-12'>
                  <BookOpen className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
                  <h3 className='text-xl font-bold text-foreground mb-4'>
                    No hay recursos disponibles
                  </h3>
                  <p className='text-muted-foreground'>
                    Pronto tendremos nuevos recursos sobre esta categoría.
                  </p>
                </div>
              ) : (
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                  {getResourcesByCategory(category).map((resource) => (
                    <Card
                      key={resource.id}
                      className={`hover:shadow-lg transition-shadow border-t-4 ${
                        typeCategoryColors[resource.category] ||
                        'border-t-chart-3'
                      }`}
                    >
                      <CardHeader>
                        <div className='flex items-center justify-between'>
                          <div className='flex items-center space-x-2'>
                            {getTypeIcon(resource.type)}
                            <Badge variant='outline'>
                              {getTypeLabel(resource.type)}
                            </Badge>
                          </div>
                        </div>
                        <CardTitle className='text-xl'>
                          {resource.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className='text-muted-foreground mb-4 line-clamp-3'>
                          {resource.type === 'AUDIO'
                            ? getAudioDescription(resource.content)
                            : resource.type === 'VIDEO'
                            ? getVideoDescription(resource.content)
                            : extractFirstParagraphText(resource.content)
                          }
                        </p>
                        <div className='flex items-center justify-between text-sm text-muted-foreground'>
                          <div className='flex items-center space-x-1'>
                            <Calendar className='h-4 w-4' />
                            <span>{formatDate(resource.created_at)}</span>
                          </div>
                          <Link href={`/resources/${resource.id}`}>
                            <Button variant='outline' size='sm'>
                              {resource.type === 'AUDIO' ? 'Reproducir' : resource.type === 'VIDEO' ? 'Reproducir' : 'Leer más'}
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          )
        )}
      </Tabs>
    </>
  );
}
