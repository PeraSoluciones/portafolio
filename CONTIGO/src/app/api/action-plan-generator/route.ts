import { NextResponse } from 'next/server';
import { generateActionPlan } from '@/app/(dashboard)/resources/action-plan-generator/actions';

export async function POST(request: Request) {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages array is required' }, { status: 400 });
    }

    const result = await generateActionPlan(messages);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ reply: result.reply });
  } catch (error) {
    console.error('Error in action plan generator API route:', error);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}