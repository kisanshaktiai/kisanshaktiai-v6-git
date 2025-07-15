
import React from 'react';
import { Check } from 'lucide-react';

interface OnboardingProgressProps {
  currentStep: number;
  totalSteps: number;
  steps: string[];
}

export const OnboardingProgress: React.FC<OnboardingProgressProps> = ({
  currentStep,
  totalSteps,
  steps
}) => {
  return (
    <div className="w-full max-w-md mx-auto mb-8">
      {/* Progress Bar */}
      <div className="flex items-center justify-between mb-4">
        {Array.from({ length: totalSteps }, (_, index) => (
          <React.Fragment key={index}>
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-medium ${
              index < currentStep 
                ? 'bg-green-500 text-white' 
                : index === currentStep 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-600'
            }`}>
              {index < currentStep ? (
                <Check className="w-4 h-4" />
              ) : (
                index + 1
              )}
            </div>
            {index < totalSteps - 1 && (
              <div className={`flex-1 h-1 mx-2 rounded ${
                index < currentStep ? 'bg-green-500' : 'bg-gray-200'
              }`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step Labels */}
      <div className="flex items-center justify-between text-xs text-gray-600">
        {steps.map((step, index) => (
          <span 
            key={index}
            className={`text-center ${
              index === currentStep ? 'text-blue-600 font-medium' : ''
            }`}
          >
            {step}
          </span>
        ))}
      </div>

      {/* Progress Percentage */}
      <div className="text-center mt-2">
        <span className="text-sm text-gray-500">
          {Math.round(((currentStep) / totalSteps) * 100)}% Complete
        </span>
      </div>
    </div>
  );
};
