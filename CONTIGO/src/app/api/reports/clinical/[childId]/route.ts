import { createServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ childId: string }> }
) {
  try {
    const supabase = await createServerClient();
    const { childId } = await params;
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Verify Access (RLS should handle this, but we can double check or just let RLS fail/return empty)
    // We'll rely on RLS. If the user can't see the child, the queries will return empty or error.

    // 2. Fetch Child Details
    const { data: child, error: childError } = await supabase
      .from('children')
      .select('*')
      .eq('id', childId)
      .single();

    if (childError || !child) {
      return NextResponse.json(
        { error: 'Child not found or access denied' },
        { status: 404 }
      );
    }

    // 3. Define date range (last 30 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    const startDateStr = startDate.toISOString().split('T')[0];

    // 4. Fetch Aggregated Data (Parallel)
    const [behaviorsResponse, habitsResponse, routinesResponse] =
      await Promise.all([
        // Behaviors: Count by type and top negative
        supabase
          .from('behaviors')
          .select('id')
          .eq('child_id', childId)
          .then(async ({ data: behaviors }) => {
            if (!behaviors || behaviors.length === 0) return { data: [] };
            const behaviorIds = behaviors.map((b) => b.id);
            return supabase
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
          }),

        // Habits: Compliance
        supabase
          .from('habits')
          .select('id')
          .eq('child_id', childId)
          .then(async ({ data: habits }) => {
            if (!habits || habits.length === 0) return { data: [] };
            const habitIds = habits.map((h) => h.id);
            return supabase
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
          }),

        // Routines
        Promise.resolve({ data: [] }),
      ]);

    // Process Behaviors
    const behaviorRecords = behaviorsResponse.data || [];
    const behaviorStats = {
      total: behaviorRecords.length,
      positive: behaviorRecords.filter(
        (r: any) => r.behavior?.type === 'POSITIVE'
      ).length,
      negative: behaviorRecords.filter(
        (r: any) => r.behavior?.type === 'NEGATIVE'
      ).length,
      topNegative: Object.entries(
        behaviorRecords
          .filter((r: any) => r.behavior?.type === 'NEGATIVE')
          .reduce((acc: any, r: any) => {
            const title = r.behavior?.title || 'Unknown';
            acc[title] = (acc[title] || 0) + 1;
            return acc;
          }, {})
      )
        .sort((a: any, b: any) => b[1] - a[1])
        .slice(0, 3)
        .map(([title, count]) => ({ title, count })),
    };

    // Process Habits
    const habitRecords = habitsResponse.data || [];
    const habitStats = {
      totalRecords: habitRecords.length,
      byHabit: Object.entries(
        habitRecords.reduce((acc: any, r: any) => {
          const title = r.habit?.title || 'Unknown';
          acc[title] = (acc[title] || 0) + 1;
          return acc;
        }, {})
      ).map(([title, count]) => ({ title, count })),
    };

    return NextResponse.json({
      child,
      period: { start: startDateStr, end: endDate.toISOString().split('T')[0] },
      stats: {
        behaviors: behaviorStats,
        habits: habitStats,
      },
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
