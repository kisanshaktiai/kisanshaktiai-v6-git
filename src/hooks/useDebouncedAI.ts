
import { useState, useCallback, useRef } from 'react';
import { useAI } from '@/hooks/useAI';
import { AgentType, SupportedLanguage } from '@/types/ai';

interface DebouncedAIOptions {
  delay?: number;
  maxWait?: number;
}

export const useDebouncedAI = (options: DebouncedAIOptions = {}) => {
  const { delay = 300, maxWait = 1000 } = options;
  const { askAgent } = useAI();
  const [isDebouncing, setIsDebouncing] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const maxWaitRef = useRef<NodeJS.Timeout>();
  const lastExecutionRef = useRef<number>(0);

  const debouncedAskAgent = useCallback(
    async (query: string, agentType?: AgentType, language?: SupportedLanguage) => {
      const now = Date.now();
      
      // Clear existing timeouts
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (maxWaitRef.current) {
        clearTimeout(maxWaitRef.current);
      }

      setIsDebouncing(true);

      // Set up max wait timeout
      maxWaitRef.current = setTimeout(async () => {
        setIsDebouncing(false);
        lastExecutionRef.current = Date.now();
        return await askAgent(query, agentType, language);
      }, maxWait);

      // Set up regular debounce timeout
      return new Promise((resolve) => {
        timeoutRef.current = setTimeout(async () => {
          setIsDebouncing(false);
          lastExecutionRef.current = Date.now();
          
          // Clear max wait timeout since we're executing now
          if (maxWaitRef.current) {
            clearTimeout(maxWaitRef.current);
          }
          
          const result = await askAgent(query, agentType, language);
          resolve(result);
        }, delay);
      });
    },
    [askAgent, delay, maxWait]
  );

  const cancelDebounce = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (maxWaitRef.current) {
      clearTimeout(maxWaitRef.current);
    }
    setIsDebouncing(false);
  }, []);

  return {
    debouncedAskAgent,
    isDebouncing,
    cancelDebounce,
  };
};
