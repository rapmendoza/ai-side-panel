'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ClarificationNeed, ClarificationResponse } from '@/lib/types/ai';
import { useAIStore } from '@/store/ai-store';
import { CheckCircle, HelpCircle } from 'lucide-react';
import { useState } from 'react';

interface ClarificationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  clarificationNeeds: ClarificationNeed[];
  onSubmit: (responses: ClarificationResponse[]) => void;
  originalMessage: string;
  suggestedActions?: any[];
}

export default function ClarificationDialog({
  isOpen,
  onClose,
  clarificationNeeds,
  onSubmit,
  originalMessage,
  suggestedActions = [],
}: ClarificationDialogProps) {
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { handleClarification } = useAIStore();

  const handleResponseChange = (needId: string, value: string) => {
    setResponses((prev) => ({
      ...prev,
      [needId]: value,
    }));
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      // Validate required fields
      const missingRequired = clarificationNeeds
        .filter((need) => need.required && !responses[need.id]?.trim())
        .map((need) => need.question);

      if (missingRequired.length > 0) {
        alert(`Please provide answers for: ${missingRequired.join(', ')}`);
        return;
      }

      // Convert responses to the expected format
      const clarificationResponses: ClarificationResponse[] = clarificationNeeds
        .filter((need) => responses[need.id]?.trim())
        .map((need) => ({
          need_id: need.id,
          response: responses[need.id],
        }));

      // Handle through AI store
      await handleClarification(clarificationResponses, originalMessage);

      // Reset and close
      setResponses({});
      onClose();

      // Also call the prop callback
      onSubmit(clarificationResponses);
    } catch (error) {
      console.error('Failed to submit clarification:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setResponses({});
    onClose();
  };

  const renderClarificationField = (need: ClarificationNeed) => {
    const value = responses[need.id] || '';

    switch (need.type) {
      case 'multiple_choice':
        return (
          <div key={need.id} className="space-y-2">
            <Label className="text-sm font-medium">
              {need.question}
              {need.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <div className="space-y-2">
              {need.options?.map((option, index) => (
                <label
                  key={index}
                  className="flex items-center space-x-2 cursor-pointer"
                >
                  <input
                    type="radio"
                    name={need.id}
                    value={option}
                    checked={value === option}
                    onChange={(e) =>
                      handleResponseChange(need.id, e.target.value)
                    }
                    className="text-blue-600"
                  />
                  <span className="text-sm">{option}</span>
                </label>
              ))}
            </div>
          </div>
        );

      case 'entity_selection':
        return (
          <div key={need.id} className="space-y-2">
            <Label className="text-sm font-medium">
              {need.question}
              {need.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <select
              value={value}
              onChange={(e) => handleResponseChange(need.id, e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
              required={need.required}
            >
              <option value="">Select an option...</option>
              {need.options?.map((option, index) => (
                <option key={index} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        );

      case 'confirmation':
        return (
          <div key={need.id} className="space-y-2">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-start space-x-2">
                <HelpCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-blue-800">
                    {need.question}
                  </div>
                  {suggestedActions.length > 0 && (
                    <div className="mt-2 text-xs text-blue-700">
                      Suggested actions:
                      <ul className="mt-1 space-y-1">
                        {suggestedActions.map((action, index) => (
                          <li
                            key={index}
                            className="flex items-center space-x-1"
                          >
                            <CheckCircle className="w-3 h-3" />
                            <span>{action.description}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex space-x-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name={need.id}
                  value="yes"
                  checked={value === 'yes'}
                  onChange={(e) =>
                    handleResponseChange(need.id, e.target.value)
                  }
                  className="text-blue-600"
                />
                <span className="text-sm">Yes, proceed</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name={need.id}
                  value="no"
                  checked={value === 'no'}
                  onChange={(e) =>
                    handleResponseChange(need.id, e.target.value)
                  }
                  className="text-blue-600"
                />
                <span className="text-sm">No, cancel</span>
              </label>
            </div>
          </div>
        );

      case 'text_input':
      default:
        return (
          <div key={need.id} className="space-y-2">
            <Label htmlFor={need.id} className="text-sm font-medium">
              {need.question}
              {need.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={need.id}
              value={value}
              onChange={(e) => handleResponseChange(need.id, e.target.value)}
              placeholder="Enter your response..."
              required={need.required}
              className="text-sm"
            />
          </div>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <HelpCircle className="w-5 h-5 text-blue-600" />
            <span>I need more information</span>
          </DialogTitle>
          <DialogDescription>
            I understand you want to: "{originalMessage}"
            <br />
            Please provide the following details to proceed:
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {clarificationNeeds.map(renderClarificationField)}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="min-w-[100px]"
          >
            {isSubmitting ? 'Processing...' : 'Continue'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Export as named export as well
export { ClarificationDialog };
