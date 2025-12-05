'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Star, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { HabitState } from '../types';

interface HabitItemProps {
  habit: HabitState;
  habitTitle: string;
  isSubmitting: boolean;
  onToggle: (checked: boolean) => void;
}

export function HabitItem({
  habit,
  habitTitle,
  isSubmitting,
  onToggle,
}: HabitItemProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between p-3 rounded-lg border transition-all duration-200',
        habit.isCompleted
          ? 'bg-green-50 border-green-200'
          : 'bg-gray-50 hover:bg-gray-100'
      )}
    >
      <div className='flex items-center space-x-3 flex-1'>
        <Checkbox
          id={habit.routineHabitId}
          checked={habit.isCompleted}
          onCheckedChange={onToggle}
          disabled={isSubmitting}
          className={cn(
            'h-5 w-5',
            habit.isCompleted && 'text-green-600 border-green-600'
          )}
        />
        <div className='flex-1'>
          <label
            htmlFor={habit.routineHabitId}
            className={cn(
              'font-medium cursor-pointer',
              habit.isCompleted
                ? 'text-green-700 line-through'
                : 'text-foreground'
            )}
          >
            {habitTitle}
          </label>
          {habit.pointsEarned != null && habit.pointsEarned > 0 && (
            <div className='flex items-center space-x-1 mt-1'>
              <Star className='h-4 w-4 text-yellow-500' />
              <span className='text-sm text-yellow-600 font-medium'>
                {habit.pointsEarned} puntos
              </span>
            </div>
          )}
        </div>
      </div>
      <div className='flex items-center space-x-2'>
        {habit.isCompleted ? (
          <CheckCircle2 className='h-5 w-5 text-green-600' />
        ) : (
          <div className='h-5 w-5' />
        )}
      </div>
    </div>
  );
}
