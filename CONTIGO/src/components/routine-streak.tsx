'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { Flame } from 'lucide-react';

interface RoutineStreakProps {
  routineId: string;
  childId: string;
  className?: string;
}

export function RoutineStreak({
  routineId,
  childId,
  className = '',
}: RoutineStreakProps) {
  const [streak, setStreak] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStreak = async () => {
      try {
        const supabase = createBrowserClient();
        const { data, error } = await supabase.rpc('get_routine_streak', {
          p_routine_id: routineId,
          p_child_id: childId,
        });

        if (error) {
          console.error('Error fetching routine streak:', error);
          setStreak(0);
        } else {
          setStreak(data || 0);
        }
      } catch (error) {
        console.error('Error:', error);
        setStreak(0);
      } finally {
        setLoading(false);
      }
    };

    fetchStreak();
  }, [routineId, childId]);

  if (loading) {
    return null;
  }

  if (streak === 0) {
    return null;
  }

  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 bg-orange-50 border border-orange-200 rounded-lg ${className}`}
    >
      <Flame className='h-5 w-5 text-orange-500' />
      <div>
        <p className='text-sm font-bold text-orange-700'>
          {streak} {streak === 1 ? 'día' : 'días'} seguidos
        </p>
        <p className='text-xs text-orange-600'>¡Sigue así!</p>
      </div>
    </div>
  );
}
