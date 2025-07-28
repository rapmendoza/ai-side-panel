import { EntityExtractor } from '@/lib/ai/entity-extractor';
import { IntentClassifier } from '@/lib/ai/intent-classifier';
import { AIServiceError } from '@/lib/ai/openai';
import { ResponseGenerator } from '@/lib/ai/response-generator';
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

const responseGenerator = new ResponseGenerator();
const intentClassifier = new IntentClassifier();
const entityExtractor = new EntityExtractor();

export async function POST(request: NextRequest) {
  try {
    const {
      originalMessage,
      clarificationResponses,
      actionId,
      confirmAction = false,
    } = await request.json();

    if (!originalMessage || typeof originalMessage !== 'string') {
      return NextResponse.json(
        { error: 'Original message is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // If this is an action confirmation
    if (confirmAction && actionId) {
      return await handleActionConfirmation(actionId, supabase);
    }

    // Build enhanced message with clarification responses
    let enhancedMessage = originalMessage;
    if (clarificationResponses && Array.isArray(clarificationResponses)) {
      const additionalInfo = clarificationResponses
        .map((resp: any) => `${resp.question}: ${resp.response}`)
        .join('. ');

      enhancedMessage = `${originalMessage}. Additional details: ${additionalInfo}`;
    }

    // Re-process with enhanced information
    const [payeesResult, categoriesResult] = await Promise.all([
      supabase.from('payees').select('id, name').limit(20),
      supabase.from('categories').select('id, name').limit(50),
    ]);

    const intentContextData = {
      recentPayees: payeesResult.data || [],
      categories: categoriesResult.data || [],
    };

    const entityContextData = {
      existingPayees: payeesResult.data || [],
      existingCategories: categoriesResult.data || [],
    };

    // Re-run the AI pipeline with additional context
    const classification = await intentClassifier.classifyIntent(
      enhancedMessage,
      intentContextData
    );
    const extraction = await entityExtractor.extractEntities(
      enhancedMessage,
      classification.intent,
      entityContextData
    );

    // Check if we still need clarification
    if (extraction.missingRequiredFields.length > 0) {
      const clarificationMessage =
        await responseGenerator.generateClarificationResponse(
          enhancedMessage,
          extraction.missingRequiredFields,
          extraction.ambiguousEntities
        );

      return NextResponse.json({
        type: 'clarification',
        message: clarificationMessage,
        classification,
        extraction,
        stillNeedsClarification: true,
        missingFields: extraction.missingRequiredFields,
      });
    }

    // Generate final response with actions
    const response = await responseGenerator.generateResponse(
      enhancedMessage,
      classification,
      extraction,
      entityContextData
    );

    // Execute actions if confidence is high enough
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
      enhancedMessage,
    });
  } catch (error) {
    console.error('Clarification processing error:', error);

    if (error instanceof AIServiceError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error processing clarification' },
      { status: 500 }
    );
  }
}

async function handleActionConfirmation(actionId: string, supabase: any) {
  try {
    // In a real implementation, you'd retrieve the stored action details
    // For now, we'll return a success confirmation
    return NextResponse.json({
      type: 'confirmation',
      message: 'Action confirmed and will be executed.',
      actionId,
      confirmed: true,
    });
  } catch (error) {
    console.error('Action confirmation error:', error);
    return NextResponse.json(
      { error: 'Failed to confirm action' },
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
