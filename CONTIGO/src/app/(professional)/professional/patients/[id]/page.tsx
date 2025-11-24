import { createServerClient } from '@/lib/supabase/server';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { ClinicalCharts } from '@/components/professional/ClinicalCharts';

export default async function PatientReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createServerClient();
  const { id: childId } = await params;
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // 1. Fetch Child Details
  const { data: child, error: childError } = await supabase
    .from('children')
    .select('*')
    .eq('id', childId)
    .single();

  if (childError || !child) {
    return (
      <div className='p-8 text-center'>
        <h2 className='text-xl font-bold text-red-600'>Error</h2>
        <p>
          No se pudo cargar la información del paciente. Verifique que tiene
          acceso.
        </p>
      </div>
    );
  }

  // 2. Fetch Stats (Last 30 days)
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);
  const startDateStr = startDate.toISOString().split('T')[0];

  // Fetch Behaviors
  const { data: behaviors } = await supabase
    .from('behaviors')
    .select('id')
    .eq('child_id', childId);
  const behaviorIds = behaviors?.map((b) => b.id) || [];

  const { data: behaviorRecords } = await supabase
    .from('behavior_records')
    .select(
      `
      id,
      date,
      notes,
      behavior:behaviors (
        id,
        title,
        type
      )
    `
    )
    .in('behavior_id', behaviorIds)
    .gte('date', startDateStr);

  // Fetch Habits
  const { data: habits } = await supabase
    .from('habits')
    .select('id')
    .eq('child_id', childId);
  const habitIds = habits?.map((h) => h.id) || [];

  const { data: habitRecords } = await supabase
    .from('habit_records')
    .select(
      `
      id,
      date,
      value,
      habit:habits (
        id,
        title,
        target_frequency
      )
    `
    )
    .in('habit_id', habitIds)
    .gte('date', startDateStr);

  // Process Data for Charts
  const records = behaviorRecords || [];
  const positiveCount = records.filter(
    (r: any) => r.behavior?.type === 'POSITIVE'
  ).length;
  const negativeCount = records.filter(
    (r: any) => r.behavior?.type === 'NEGATIVE'
  ).length;

  const behaviorData = [
    { name: 'Positivos', value: positiveCount, fill: '#4ade80' },
    { name: 'Negativos', value: negativeCount, fill: '#f87171' },
  ];

  const topNegative = Object.entries(
    records
      .filter((r: any) => r.behavior?.type === 'NEGATIVE')
      .reduce((acc: any, r: any) => {
        const title = r.behavior?.title || 'Unknown';
        acc[title] = (acc[title] || 0) + 1;
        return acc;
      }, {})
  )
    .sort((a: any, b: any) => b[1] - a[1])
    .slice(0, 5)
    .map(([title, count]) => ({ name: title, value: count }));

  return (
    <div className='space-y-8 pb-10'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-4'>
          <Avatar className='h-16 w-16 border-2 border-primary/10'>
            <AvatarImage src={child.avatar_url} />
            <AvatarFallback className='text-xl'>
              {child.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className='text-3xl font-bold tracking-tight'>{child.name}</h1>
            <div className='flex items-center gap-2 text-muted-foreground'>
              <Badge variant='outline'>
                {child.adhd_type || 'Tipo no especificado'}
              </Badge>
              <span>•</span>
              <span>
                {new Date().getFullYear() -
                  new Date(child.birth_date).getFullYear()}{' '}
                años
              </span>
            </div>
          </div>
        </div>
        <div className='text-right'>
          <p className='text-sm text-muted-foreground'>Puntos Totales</p>
          <p className='text-3xl font-bold text-primary'>
            {child.points_balance}
          </p>
        </div>
      </div>

      <Alert>
        <Info className='h-4 w-4' />
        <AlertTitle>Reporte Clínico (Últimos 30 días)</AlertTitle>
        <AlertDescription>
          Este reporte agrega datos de comportamiento y hábitos para apoyar la
          toma de decisiones terapéuticas.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue='overview' className='space-y-4'>
        <TabsList>
          <TabsTrigger value='overview'>Resumen General</TabsTrigger>
          <TabsTrigger value='behaviors'>Comportamiento</TabsTrigger>
          <TabsTrigger value='habits'>Hábitos y Rutinas</TabsTrigger>
        </TabsList>

        <TabsContent value='overview' className='space-y-4'>
          <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>
                  Registros Totales
                </CardTitle>
                <Activity className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>{records.length}</div>
                <p className='text-xs text-muted-foreground'>
                  Comportamientos registrados
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>
                  Ratio Positivo
                </CardTitle>
                <TrendingUp className='h-4 w-4 text-green-500' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>
                  {records.length > 0
                    ? Math.round((positiveCount / records.length) * 100)
                    : 0}
                  %
                </div>
                <p className='text-xs text-muted-foreground'>
                  Del total de registros
                </p>
              </CardContent>
            </Card>
            {/* Add more summary stats */}
          </div>

          <div className='grid gap-4 md:grid-cols-2'>
            <Card className='col-span-1'>
              <CardHeader>
                <CardTitle>Balance de Comportamiento</CardTitle>
              </CardHeader>
              <CardContent className='pl-2'>
                <ClinicalCharts type='pie' data={behaviorData} />
              </CardContent>
            </Card>
            <Card className='col-span-1'>
              <CardHeader>
                <CardTitle>Principales Desafíos</CardTitle>
                <CardDescription>
                  Comportamientos negativos más frecuentes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ClinicalCharts type='bar' data={topNegative} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value='behaviors'>
          <Card>
            <CardHeader>
              <CardTitle>Detalle de Comportamientos</CardTitle>
            </CardHeader>
            <CardContent>
              {/* List of recent behaviors could go here */}
              <p className='text-muted-foreground'>
                Vista detallada en desarrollo.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='habits'>
          <Card>
            <CardHeader>
              <CardTitle>Cumplimiento de Hábitos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-muted-foreground'>
                Vista detallada en desarrollo.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
