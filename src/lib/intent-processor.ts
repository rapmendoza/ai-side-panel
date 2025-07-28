import { Category } from '@/types/category';
import { ClarificationContext, ProcessedIntent } from '@/types/conversation';
import { ContactInfo, Payee } from '@/types/payee';
import {
  createCategory,
  deleteCategory,
  getAllCategories,
  getCategoryById,
  getCategoryTree,
  searchCategories,
  updateCategory,
} from './database/category-service';
import {
  createPayee,
  deletePayee,
  getAllPayees,
  getPayeeById,
  searchPayees,
  updatePayee,
} from './database/payee-service';
import { isValidUUID, sanitizeInput } from './database/utils';
import { classifyIntent, generateResponse } from './openai';

export interface IntentProcessorResult {
  success: boolean;
  data?: unknown;
  response: string;
  needsClarification: boolean;
  clarificationContext?: ClarificationContext;
  error?: string;
}

interface OperationData {
  name?: string;
  description?: string;
  type?: 'income' | 'expense';
  search_term?: string;
  id?: string;
  contact_info?: ContactInfo;
  parent_category_id?: string;
  entity?: string;
  tree?: boolean;
}

// More flexible type to handle various database operation return types
type OperationResult =
  | Payee
  | Category
  | Payee[]
  | Category[]
  | { success: boolean }
  | null;

export async function processUserIntent(
  userMessage: string,
  clarificationContext?: ClarificationContext
): Promise<IntentProcessorResult> {
  try {
    // If we have clarification context, handle the follow-up
    if (clarificationContext) {
      return await handleClarificationResponse(
        userMessage,
        clarificationContext
      );
    }

    // Classify the user's intent
    const intent: ProcessedIntent = await classifyIntent(userMessage);

    // If clarification is needed, return early
    if (intent.needsClarification) {
      const clarificationCtx: ClarificationContext = {
        originalIntent: intent,
        clarificationStep: 1,
        collectedData: intent.data || {},
        pendingQuestions: intent.clarificationQuestions || [],
      };

      return {
        success: false,
        response:
          intent.clarificationQuestions?.[0] ||
          'I need more information to help you.',
        needsClarification: true,
        clarificationContext: clarificationCtx,
      };
    }

    // Process the intent based on action and entity
    return await executeIntent(intent, userMessage);
  } catch (error) {
    console.error('Error processing user intent:', error);
    return {
      success: false,
      response:
        'I encountered an error processing your request. Please try again.',
      needsClarification: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function executeIntent(
  intent: ProcessedIntent,
  userMessage: string
): Promise<IntentProcessorResult> {
  const { action, entity, data } = intent;

  try {
    let operationResult: OperationResult;

    switch (entity) {
      case 'payee':
        operationResult = await executePayeeOperation(action, data);
        break;
      case 'category':
        operationResult = await executeCategoryOperation(action, data);
        break;
      default:
        return {
          success: false,
          response:
            'I can only help with payees and categories. What would you like to do?',
          needsClarification: false,
        };
    }

    // Generate a natural language response
    const response = await generateResponse(
      userMessage,
      `Performed ${action} operation on ${entity}`,
      operationResult
    );

    // Determine success based on the result
    const success =
      operationResult !== null &&
      (typeof operationResult === 'object'
        ? 'success' in operationResult
          ? operationResult.success !== false
          : true
        : true);

    return {
      success,
      data: operationResult,
      response,
      needsClarification: false,
    };
  } catch (error) {
    console.error('Error executing intent:', error);
    return {
      success: false,
      response: `I encountered an error while trying to ${action} the ${entity}. Please try again.`,
      needsClarification: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function executePayeeOperation(
  action: string,
  data: OperationData
): Promise<OperationResult> {
  switch (action) {
    case 'create':
      if (!data.name) {
        throw new Error('Payee name is required for creation');
      }
      return await createPayee({
        name: sanitizeInput(data.name),
        description: data.description
          ? sanitizeInput(data.description)
          : undefined,
        contact_info: data.contact_info,
      });

    case 'read':
      if (data.id && isValidUUID(data.id)) {
        return await getPayeeById(data.id);
      } else if (data.search_term) {
        return await searchPayees(sanitizeInput(data.search_term));
      } else {
        return await getAllPayees();
      }

    case 'update':
      if (!data.id || !isValidUUID(data.id)) {
        throw new Error('Valid payee ID is required for updates');
      }
      const updateData: Record<string, unknown> = {};
      if (data.name) updateData.name = sanitizeInput(data.name);
      if (data.description)
        updateData.description = sanitizeInput(data.description);
      if (data.contact_info) updateData.contact_info = data.contact_info;
      return await updatePayee(data.id, updateData);

    case 'delete':
      if (!data.id || !isValidUUID(data.id)) {
        throw new Error('Valid payee ID is required for deletion');
      }
      return await deletePayee(data.id);

    default:
      throw new Error(`Unsupported payee action: ${action}`);
  }
}

async function executeCategoryOperation(
  action: string,
  data: OperationData
): Promise<OperationResult> {
  switch (action) {
    case 'create':
      if (!data.name) {
        throw new Error('Category name is required for creation');
      }
      if (!data.type || !['income', 'expense'].includes(data.type)) {
        throw new Error('Category type must be either "income" or "expense"');
      }
      return await createCategory({
        name: sanitizeInput(data.name),
        type: data.type,
        description: data.description
          ? sanitizeInput(data.description)
          : undefined,
        parent_category_id: data.parent_category_id,
      });

    case 'read':
      if (data.id && isValidUUID(data.id)) {
        return await getCategoryById(data.id);
      } else if (data.search_term) {
        return await searchCategories(sanitizeInput(data.search_term));
      } else if (data.tree === true) {
        return await getCategoryTree();
      } else {
        return await getAllCategories();
      }

    case 'update':
      if (!data.id || !isValidUUID(data.id)) {
        throw new Error('Valid category ID is required for updates');
      }
      const updateData: Record<string, unknown> = {};
      if (data.name) updateData.name = sanitizeInput(data.name);
      if (data.type && ['income', 'expense'].includes(data.type))
        updateData.type = data.type;
      if (data.description)
        updateData.description = sanitizeInput(data.description);
      if (data.parent_category_id)
        updateData.parent_category_id = data.parent_category_id;
      return await updateCategory(data.id, updateData);

    case 'delete':
      if (!data.id || !isValidUUID(data.id)) {
        throw new Error('Valid category ID is required for deletion');
      }
      return await deleteCategory(data.id);

    default:
      throw new Error(`Unsupported category action: ${action}`);
  }
}

async function handleClarificationResponse(
  userMessage: string,
  context: ClarificationContext
): Promise<IntentProcessorResult> {
  // Update collected data based on the clarification response
  const updatedData = { ...context.collectedData };

  // Simple entity extraction for clarification responses
  const lowerMessage = userMessage.toLowerCase();

  // Determine what information was provided
  if (
    lowerMessage.includes('payee') ||
    lowerMessage.includes('vendor') ||
    lowerMessage.includes('supplier')
  ) {
    updatedData.entity = 'payee';
  } else if (
    lowerMessage.includes('category') ||
    lowerMessage.includes('expense') ||
    lowerMessage.includes('income')
  ) {
    updatedData.entity = 'category';
    if (lowerMessage.includes('expense')) updatedData.type = 'expense';
    if (lowerMessage.includes('income')) updatedData.type = 'income';
  }

  // Extract name if not already provided
  if (!updatedData.name) {
    // Try to extract quoted strings or capitalize words that look like names
    const quotedMatch = userMessage.match(/"([^"]+)"/);
    if (quotedMatch) {
      updatedData.name = quotedMatch[1];
    } else {
      // Simple heuristic: take the longest word that's not a common word
      const words = userMessage
        .split(' ')
        .filter(
          (word) =>
            word.length > 2 &&
            ![
              'the',
              'and',
              'for',
              'with',
              'want',
              'add',
              'create',
              'new',
            ].includes(word.toLowerCase())
        );
      if (words.length > 0) {
        updatedData.name = words[0];
      }
    }
  }

  // Check if we have enough information to proceed
  const hasRequiredInfo = updatedData.entity && updatedData.name;

  if (!hasRequiredInfo) {
    const nextQuestion =
      context.pendingQuestions[context.clarificationStep] ||
      'Could you provide more details about what you want to create?';

    return {
      success: false,
      response: nextQuestion,
      needsClarification: true,
      clarificationContext: {
        ...context,
        clarificationStep: context.clarificationStep + 1,
        collectedData: updatedData,
      },
    };
  }

  // We have enough information, execute the original intent
  const updatedIntent: ProcessedIntent = {
    ...context.originalIntent,
    entity: updatedData.entity as 'payee' | 'category',
    data: updatedData,
    needsClarification: false,
  };

  return await executeIntent(updatedIntent, userMessage);
}
