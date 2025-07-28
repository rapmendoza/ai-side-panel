import { IntentClassifier } from '@/lib/ai/intent-classifier';
import { AIServiceError } from '@/lib/ai/openai';
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

const intentClassifier = new IntentClassifier();

export async function POST(request: NextRequest) {
  try {
    const { message, context } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required and must be a string' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get context data for better intent classification
    const [payeesResult, categoriesResult] = await Promise.all([
      supabase.from('payees').select('id, name').limit(20),
      supabase.from('categories').select('id, name').limit(50),
    ]);

    const contextData = {
      ...context,
      recentPayees: payeesResult.data || [],
      categories: categoriesResult.data || [],
    };

    const classification = await intentClassifier.classifyIntent(
      message,
      contextData
    );

    return NextResponse.json({
      success: true,
      classification,
      debug: {
        originalMessage: message,
        contextProvided: !!context,
        payeesCount: contextData.recentPayees.length,
        categoriesCount: contextData.categories.length,
      },
    });
  } catch (error) {
    console.error('Intent classification error:', error);

    if (error instanceof AIServiceError) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          code: error.code,
          debug: { originalError: error.details },
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error during intent classification',
      },
      { status: 500 }
    );
  }
}

// GET method for quick testing
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const message = searchParams.get('message');

  if (!message) {
    return NextResponse.json(
      { error: 'Message parameter is required' },
      { status: 400 }
    );
  }

  try {
    const classification = await intentClassifier.classifyIntent(message);

    return NextResponse.json({
      success: true,
      classification,
      debug: {
        originalMessage: message,
        method: 'GET',
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Intent classification error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
