import { processUserIntent } from '@/lib/intent-processor';
import { ClarificationContext } from '@/types/conversation';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, clarificationContext } = body;

    // Validate the request
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required and must be a string' },
        { status: 400 }
      );
    }

    // Process the user's intent
    const result = await processUserIntent(
      message,
      clarificationContext as ClarificationContext | undefined
    );

    return NextResponse.json({
      success: result.success,
      response: result.response,
      data: result.data,
      needsClarification: result.needsClarification,
      clarificationContext: result.clarificationContext,
      error: result.error,
    });
  } catch (error) {
    console.error('Error in AI chat endpoint:', error);
    return NextResponse.json(
      {
        success: false,
        response: 'I apologize, but I encountered an error. Please try again.',
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
