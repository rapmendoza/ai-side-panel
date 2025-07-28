import { EntityExtractor } from '@/lib/ai/entity-extractor';
import { IntentClassifier } from '@/lib/ai/intent-classifier';
import { AIServiceError } from '@/lib/ai/openai';
import { ResponseGenerator } from '@/lib/ai/response-generator';
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

const intentClassifier = new IntentClassifier();
const entityExtractor = new EntityExtractor();
const responseGenerator = new ResponseGenerator();

export async function POST(request: NextRequest) {
  try {
    const { message, conversationId, context } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required and must be a string' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get context data for better AI processing
    const [payeesResult, categoriesResult] = await Promise.all([
      supabase.from('payees').select('id, name').limit(20),
      supabase.from('categories').select('id, name').limit(50),
    ]);

    const contextData = {
      ...context,
      existingPayees: payeesResult.data || [],
      existingCategories: categoriesResult.data || [],
    };

    // Step 1: Classify Intent
    const classification = await intentClassifier.classifyIntent(
      message,
      contextData
    );

    // Step 2: Extract Entities
    const extraction = await entityExtractor.extractEntities(
      message,
      classification.intent,
      contextData
    );

    // Step 3: Check if clarification is needed
    if (
      classification.requiresClarification ||
      extraction.missingRequiredFields.length > 0
    ) {
      const clarificationMessage =
        await responseGenerator.generateClarificationResponse(
          message,
          extraction.missingRequiredFields,
          extraction.ambiguousEntities
        );

      return NextResponse.json({
        type: 'clarification',
        message: clarificationMessage,
        classification,
        extraction,
        needsClarification: true,
      });
    }

    // Step 4: Generate Response with Actions
    const response = await responseGenerator.generateResponse(
      message,
      classification,
      extraction,
      contextData
    );

    // Step 5: Execute actions if confidence is high and no confirmation needed
    let executedActions: any[] = [];
    if (response.confidence > 0.8 && !response.requiresConfirmation) {
      executedActions = await executeActions(response.actions, supabase);
    }

    return NextResponse.json({
      type: 'response',
      message: response.message,
      classification,
      extraction,
      suggestedActions: response.actions,
      executedActions,
      requiresConfirmation: response.requiresConfirmation,
      confidence: response.confidence,
      conversationId,
    });
  } catch (error) {
    console.error('AI chat error:', error);

    if (error instanceof AIServiceError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error processing AI request' },
      { status: 500 }
    );
  }
}

async function executeActions(actions: any[], supabase: any) {
  const results = [];

  for (const action of actions) {
    try {
      let result;

      switch (action.type) {
        case 'create':
          if (action.entity === 'payee') {
            const { data, error } = await supabase
              .from('payees')
              .insert([action.data])
              .select()
              .single();

            result = { success: !error, data, error: error?.message };
          } else if (action.entity === 'category') {
            const { data, error } = await supabase
              .from('categories')
              .insert([action.data])
              .select()
              .single();

            result = { success: !error, data, error: error?.message };
          }
          break;

        case 'update':
          if (action.entity === 'payee') {
            const { data, error } = await supabase
              .from('payees')
              .update(action.data)
              .eq('id', action.data.id)
              .select()
              .single();

            result = { success: !error, data, error: error?.message };
          } else if (action.entity === 'category') {
            const { data, error } = await supabase
              .from('categories')
              .update(action.data)
              .eq('id', action.data.id)
              .select()
              .single();

            result = { success: !error, data, error: error?.message };
          }
          break;

        case 'delete':
          if (action.entity === 'payee') {
            const { error } = await supabase
              .from('payees')
              .delete()
              .eq('id', action.data.id);

            result = { success: !error, error: error?.message };
          } else if (action.entity === 'category') {
            const { error } = await supabase
              .from('categories')
              .delete()
              .eq('id', action.data.id);

            result = { success: !error, error: error?.message };
          }
          break;

        case 'read':
          if (action.entity === 'payee') {
            const { data, error } = await supabase
              .from('payees')
              .select('*')
              .ilike('name', `%${action.data.query || ''}%`)
              .limit(20);

            result = {
              success: !error,
              data,
              count: data?.length || 0,
              error: error?.message,
            };
          } else if (action.entity === 'category') {
            const { data, error } = await supabase
              .from('categories')
              .select('*')
              .ilike('name', `%${action.data.query || ''}%`)
              .limit(20);

            result = {
              success: !error,
              data,
              count: data?.length || 0,
              error: error?.message,
            };
          }
          break;

        default:
          result = { success: false, error: 'Unknown action type' };
      }

      results.push({
        actionId: action.id,
        type: action.type,
        entity: action.entity,
        result,
      });
    } catch (error) {
      console.error(`Failed to execute action ${action.id}:`, error);
      results.push({
        actionId: action.id,
        type: action.type,
        entity: action.entity,
        result: {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    }
  }

  return results;
}

// Handle streaming responses
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
    const stream = responseGenerator.generateStreamingResponse(message);

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (error) {
    console.error('Streaming error:', error);
    return NextResponse.json(
      { error: 'Failed to create streaming response' },
      { status: 500 }
    );
  }
}
