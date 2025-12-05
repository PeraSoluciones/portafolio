'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { HabitItem } from './HabitItem';
import type { RoutineWithHabits } from '../types';

interface RoutineCardProps {
  routine: RoutineWithHabits;
  isSubmitting: string | null;
  getHabitTitle: (habitId: string) => string;
  onToggleHabit: (
    routineHabitId: string,
    habitId: string,
    routineId: string,
    checked: boolean
  ) => void;
}

export function RoutineCard({
  routine,
  isSubmitting,
  getHabitTitle,
  onToggleHabit,
}: RoutineCardProps) {
  const completedCount = routine.habits.filter((h) => h.isCompleted).length;
  const totalCount = routine.habits.length;

  return (
    <Card className='border-t-4 border-t-chart-2'>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <div>
            <CardTitle className='text-xl text-foreground'>
              {routine.title}
            </CardTitle>
            <CardDescription className='text-muted-foreground'>
              {routine.time}
              {routine.description ? ` - ${routine.description}` : ''}
            </CardDescription>
          </div>
          <Badge variant='outline' className='text-chart-2 border-chart-2'>
            {completedCount}/{totalCount} completados
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className='space-y-2'>
          {routine.habits.map((habit) => (
            <HabitItem
              key={habit.routineHabitId}
              habit={habit}
              habitTitle={getHabitTitle(habit.habitId)}
              isSubmitting={isSubmitting === habit.routineHabitId}
              onToggle={(checked) =>
                onToggleHabit(
                  habit.routineHabitId,
                  habit.habitId,
                  habit.routineId,
                  checked
                )
              }
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
