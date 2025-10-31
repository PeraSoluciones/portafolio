import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookOpen, Video, Lightbulb, Headphones, Calendar } from 'lucide-react';
import Link from 'next/link';
import parse, { domToReact, DOMNode, Element } from 'html-react-parser';
import { SymptomChart, AdaptationsChart, BehavioralChart, RoutineChart, LifestyleChart, HeredabilityChart, BehaviorRadarChart, TreatmentByAgeChart } from '@/components/adhd-charts';
import { TimelineChart, PyramidChart, VennChart } from '@/components/adhd-mermaid-charts';

interface ResourcePageProps {
  params: {
    id: string;
  };
}

const typeColors = {
  ARTICLE: 'text-accent',
  VIDEO: 'text-chart-1',
  TIP: 'text-success',
  AUDIO: 'text-purple-500',
};

const typeIcons = {
  ARTICLE: BookOpen,
  VIDEO: Video,
  TIP: Lightbulb,
  AUDIO: Headphones,
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

const getTypeLabel = (type: string) => {
  const labels: { [key: string]: string } = {
    ARTICLE: 'Artículo',
    VIDEO: 'Video',
    TIP: 'Consejo',
    AUDIO: 'Audio',
  };
  return labels[type] || type;
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('es-EC', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const replacePlaceholdersWithComponents = (domNode: DOMNode) => {
  // Reemplazar <canvas> con componentes de Chart.js existentes
  if (domNode.type === 'tag' && domNode.name === 'canvas') {
    const id = (domNode as Element).attribs?.id;
    switch (id) {
      case 'symptomChart':
        return <SymptomChart />;
      case 'adaptationsChart':
        return <AdaptationsChart />;
      case 'behavioralChart':
        return <BehavioralChart />;
      case 'routineChart':
        return <RoutineChart />;
      case 'lifestyleChart':
        return <LifestyleChart />;
      case 'heredabilityChart':
        return <HeredabilityChart />;
      case 'behaviorRadarChart':
        return <BehaviorRadarChart />;
      case 'treatmentByAgeChart':
        return <TreatmentByAgeChart />;
      default:
        return undefined;
    }
  }

  // Reemplazar comentarios con nuestros nuevos componentes de React
  if (domNode.type === 'comment') {
    const comment = domNode.data.trim();
    switch (comment) {
      case 'CHART_PLACEHOLDER:timeline':
        return <TimelineChart />;
      case 'CHART_PLACEHOLDER:pyramid':
        return <PyramidChart />;
      case 'CHART_PLACEHOLDER:venn':
        return <VennChart />;
      default:
        return undefined;
    }
  }
};

export default async function ResourcePage({ params }: ResourcePageProps) {
  const awaitedParams = await params;
  const id = awaitedParams.id;
  const supabase = await createClient();

  const { data: resource, error } = await supabase
    .from('resources')
    .select('*')
    .eq('id', id)
    .eq('is_active', true)
    .single();

  if (error || !resource) {
    notFound();
  }

  const IconComponent = typeIcons[resource.type] || BookOpen;

  return (
    <div className='container mx-auto py-8 px-4'>
      <div className='mb-6'>
        <Link href='/resources'>
          <Button variant='ghost' className='mb-4'>
            <ArrowLeft className='mr-2 h-4 w-4' />
            Volver a recursos
          </Button>
        </Link>
      </div>

      <Card className='w-full max-w-4xl mx-auto'>
        <CardHeader>
          <div className='flex items-center justify-between flex-wrap gap-2'>
            <div className='flex items-center space-x-2'>
              <IconComponent className={`h-5 w-5 ${typeColors[resource.type]}`} />
              <Badge variant='outline'>
                {getTypeLabel(resource.type)}
              </Badge>
            </div>
            <Badge variant='secondary'>
              {getCategoryLabel(resource.category)}
            </Badge>
          </div>
          <CardTitle className='text-2xl md:text-3xl mt-4'>
            {resource.title}
          </CardTitle>
          <div className='flex items-center space-x-1 text-sm text-muted-foreground mt-2'>
            <Calendar className='h-4 w-4' />
            <span>{formatDate(resource.created_at)}</span>
          </div>
        </CardHeader>
        <CardContent className='prose prose-sm md:prose-base max-w-none'>
          {resource.type === 'VIDEO' ? (
            <div className='w-full space-y-4'>
              <div className='aspect-video'>
                <video controls preload="metadata" className='w-full h-full rounded-lg shadow-lg'>
                  <source src={JSON.parse(resource.content).video_url} type="video/mp4" />
                  Tu navegador no soporta el elemento de video.
                </video>
              </div>
              <div className='text-base leading-relaxed'>
                <p>{JSON.parse(resource.content).description}</p>
              </div>
            </div>
          ) : resource.type === 'AUDIO' ? (
            <div className='w-full space-y-4'>
              <div className='text-base leading-relaxed'>
                <p>{JSON.parse(resource.content).description}</p>
              </div>
              <audio controls preload="metadata" className='w-full'>
                <source src={JSON.parse(resource.content).audio_url} type="audio/mpeg" />
                Tu navegador no soporta el elemento de audio.
              </audio>
            </div>
          ) : (
            <div className='text-base leading-relaxed'>
              {parse(resource.content, { replace: replacePlaceholdersWithComponents })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}