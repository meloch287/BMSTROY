'use client';
import { useState, useCallback, useRef } from 'react';

/**
 * Options for the useOptimistic hook
 */
export interface UseOptimisticOptions<T> {
  /** Called when the async operation fails, receives error and rollback data */
  onError?: (error: Error, rollbackData: T) => void;
  /** Called when the async operation succeeds */
  onSuccess?: (data: T) => void;
}

/**
 * Return type for the useOptimistic hook
 */
export interface UseOptimisticReturn<T> {
  /** Current data state */
  data: T;
  /** Function to perform optimistic update with async operation */
  setOptimistic: (newData: T, asyncFn: () => Promise<T>) => Promise<void>;
  /** Whether an async operation is in progress */
  isPending: boolean;
  /** Error from the last failed operation, null if no error */
  error: Error | null;
}

/**
 * Hook for optimistic UI updates with automatic rollback on error.
 * 
 * Implements Requirements 4.1, 4.2, 4.3, 4.4:
 * - 4.1: Immediately updates UI before server response
 * - 4.2: Rolls back to previous state on server error
 * - 4.3: Tracks isPending state during async operation
 * - 4.4: Syncs local state with server response on success
 * 
 * @param initialData - Initial state value
 * @param options - Optional callbacks for error and success handling
 * @returns Object with data, setOptimistic, isPending, and error
 */
export function useOptimistic<T>(
  initialData: T,
  options?: UseOptimisticOptions<T>
): UseOptimisticReturn<T> {
  const [data, setData] = useState<T>(initialData);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Store previous data for rollback
  const previousDataRef = useRef<T>(initialData);

  const setOptimistic = useCallback(
    async (newData: T, asyncFn: () => Promise<T>): Promise<void> => {
      // Store current data for potential rollback
      previousDataRef.current = data;
      
      // Optimistically update UI immediately (Requirement 4.1)
      setData(newData);
      setIsPending(true);
      setError(null);

      try {
        // Execute async operation
        const serverData = await asyncFn();
        
        // Sync with server response (Requirement 4.4)
        setData(serverData);
        setIsPending(false);
        
        // Call success callback if provided
        options?.onSuccess?.(serverData);
      } catch (err) {
        // Rollback to previous state on error (Requirement 4.2)
        const rollbackData = previousDataRef.current;
        setData(rollbackData);
        
        const errorObj = err instanceof Error ? err : new Error(String(err));
        setError(errorObj);
        setIsPending(false);
        
        // Call error callback if provided
        options?.onError?.(errorObj, rollbackData);
      }
    },
    [data, options]
  );

  return {
    data,
    setOptimistic,
    isPending,
    error,
  };
}
