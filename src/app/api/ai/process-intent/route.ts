import { classifyIntent } from '@/lib/openai';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message } = body;

    // Validate the request
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required and must be a string' },
        { status: 400 }
      );
    }

    // Classify the user's intent
    const intent = await classifyIntent(message);

    return NextResponse.json({
      success: true,
      intent,
    });
  } catch (error) {
    console.error('Error in intent processing endpoint:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process intent',
      },
      { status: 500 }
    );
  }
}
