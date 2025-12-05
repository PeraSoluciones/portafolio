'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PointsBadge } from '@/components/ui/points-badge';
import { Target, Award, Star, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import type { Child } from '@/types/database';

interface TodayStatsCardsProps {
  selectedChild: Child | null;
  completedHabitsCount: number;
  totalHabitsCount: number;
  totalPointsEarnedToday: number;
}

export function TodayStatsCards({
  selectedChild,
  completedHabitsCount,
  totalHabitsCount,
  totalPointsEarnedToday,
}: TodayStatsCardsProps) {
  const progressPercentage =
    totalHabitsCount > 0 ? (completedHabitsCount / totalHabitsCount) * 100 : 0;

  if (!selectedChild || totalHabitsCount === 0) {
    return null;
  }

  return (
    <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
      {/* Tarjeta de Progreso */}
      <Card className='border-t-4 border-t-primary'>
        <CardHeader>
          <div className='flex items-center space-x-3 mb-2'>
            <div className='text-primary'>
              <Target className='h-6 w-6' />
            </div>
            <CardTitle className='text-lg font-bold text-foreground'>
              Progreso del día
            </CardTitle>
          </div>
          <CardDescription className='text-sm text-muted-foreground'>
            Hábitos completados hoy
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='mb-4'>
            <div className='flex items-baseline'>
              <span className='text-3xl font-bold text-primary'>
                {completedHabitsCount}
              </span>
              <span className='text-xl text-muted-foreground ml-1'>
                /{totalHabitsCount}
              </span>
            </div>
            <p className='text-xs text-muted-foreground mt-1'>
              Hábitos completados
            </p>
          </div>
          <div className='w-full bg-primary/20 rounded-full h-2 mb-4'>
            <div
              className='bg-primary h-2 rounded-full transition-all duration-300'
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <p className='text-sm text-muted-foreground'>
            {Math.round(progressPercentage)}% completado
          </p>
        </CardContent>
      </Card>

      {/* Tarjeta de Puntos Ganados */}
      <Card className='border-t-4 border-t-secondary'>
        <CardHeader>
          <div className='flex items-center space-x-3 mb-2'>
            <div className='text-secondary'>
              <Award className='h-6 w-6' />
            </div>
            <CardTitle className='text-lg font-bold text-foreground'>
              Puntos Ganados
            </CardTitle>
          </div>
          <CardDescription className='text-sm text-muted-foreground'>
            Total acumulado hoy
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='mb-4'>
            <div className='flex items-baseline'>
              <span className='text-3xl font-bold text-secondary'>
                {totalPointsEarnedToday}
              </span>
              <Star className='h-5 w-5 text-secondary ml-2' />
            </div>
            <p className='text-xs text-muted-foreground mt-1'>
              Puntos obtenidos
            </p>
          </div>
          {totalPointsEarnedToday > 0 && (
            <div className='flex items-center space-x-1 text-sm text-secondary'>
              <CheckCircle className='h-4 w-4' />
              <span>¡Sigue así!</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tarjeta de Saldo Total */}
      <Card className='border-t-4 border-t-chart-1'>
        <CardHeader>
          <div className='flex items-center space-x-3 mb-2'>
            <div className='text-chart-1'>
              <Star className='h-6 w-6' />
            </div>
            <CardTitle className='text-lg font-bold text-foreground'>
              Saldo Total
            </CardTitle>
          </div>
          <CardDescription className='text-sm text-muted-foreground'>
            {selectedChild && selectedChild.points_balance < 0
              ? 'Puntos en déficit'
              : 'Puntos disponibles'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='mb-4'>
            <div className='flex items-baseline'>
              <PointsBadge
                points={selectedChild?.points_balance || 0}
                size='lg'
                variant='default'
              />
            </div>
          </div>
          <Link href='/rewards'>
            <Button variant='outline' size='sm' className='w-full'>
              Ver recompensas
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
