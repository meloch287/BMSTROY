/**
 * Property-based tests for useOptimistic hook
 * 
 * **Feature: admin-enhancements**
 * 
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi } from 'vitest';
import fc from 'fast-check';
import { renderHook, act } from '@testing-library/react';
import { useOptimistic } from './useOptimistic';

// ============ Generators ============

// Generate simple data objects
const dataArb = fc.record({
  id: fc.integer({ min: 1, max: 10000 }),
  name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
  status: fc.constantFrom('active', 'pending', 'completed'),
});

// Generate arrays of data
const dataArrayArb = fc.array(dataArb, { minLength: 0, maxLength: 20 });

// Generate error messages
const errorMessageArb = fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0);

// ============ Property Tests ============

describe('useOptimistic Hook', () => {
  /**
   * **Feature: admin-enhancements, Property 8: Optimistic update rollback**
   * 
   * *For any* optimistic state update followed by an async operation that fails,
   * the state should be rolled back to the previous value and error should be set.
   * 
   * **Validates: Requirements 4.2**
   */
  describe('Property 8: Optimistic update rollback', () => {
    it('should rollback to previous state when async operation fails', async () => {
      await fc.assert(
        fc.asyncProperty(
          dataArrayArb,
          dataArrayArb,
          errorMessageArb,
          async (initialData, optimisticData, errorMessage) => {
            const onError = vi.fn();
            
            const { result } = renderHook(() => 
              useOptimistic(initialData, { onError })
            );

            // Initial state should match
            expect(result.current.data).toEqual(initialData);
            expect(result.current.isPending).toBe(false);
            expect(result.current.error).toBeNull();

            // Create a failing async function
            const failingAsyncFn = vi.fn().mockRejectedValue(new Error(errorMessage));

            // Perform optimistic update that will fail
            await act(async () => {
              await result.current.setOptimistic(optimisticData, failingAsyncFn);
            });

            // After failure, state should be rolled back to initial
            expect(result.current.data).toEqual(initialData);
            expect(result.current.isPending).toBe(false);
            expect(result.current.error).not.toBeNull();
            expect(result.current.error?.message).toBe(errorMessage);
            
            // onError callback should have been called with error and rollback data
            expect(onError).toHaveBeenCalledWith(
              expect.any(Error),
              initialData
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should rollback to previous state even with non-Error rejections', async () => {
      await fc.assert(
        fc.asyncProperty(
          dataArrayArb,
          dataArrayArb,
          fc.string({ minLength: 1, maxLength: 50 }),
          async (initialData, optimisticData, errorString) => {
            const { result } = renderHook(() => useOptimistic(initialData));

            // Create async function that rejects with a string
            const failingAsyncFn = vi.fn().mockRejectedValue(errorString);

            await act(async () => {
              await result.current.setOptimistic(optimisticData, failingAsyncFn);
            });

            // State should be rolled back
            expect(result.current.data).toEqual(initialData);
            expect(result.current.error).not.toBeNull();
            // Error should be converted to Error object
            expect(result.current.error).toBeInstanceOf(Error);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve rollback data across multiple failed updates', async () => {
      await fc.assert(
        fc.asyncProperty(
          dataArrayArb,
          fc.array(dataArrayArb, { minLength: 2, maxLength: 5 }),
          async (initialData, optimisticUpdates) => {
            const { result } = renderHook(() => useOptimistic(initialData));

            // Perform multiple failing updates
            for (const optimisticData of optimisticUpdates) {
              const failingAsyncFn = vi.fn().mockRejectedValue(new Error('fail'));

              await act(async () => {
                await result.current.setOptimistic(optimisticData, failingAsyncFn);
              });

              // After each failure, should rollback to the last successful state
              // Since all fail, it should always be initialData
              expect(result.current.data).toEqual(initialData);
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * **Feature: admin-enhancements, Property 9: Optimistic update lifecycle**
   * 
   * *For any* optimistic update operation, isPending should be true during
   * the async operation and false after completion (success or failure).
   * 
   * **Validates: Requirements 4.3, 4.4**
   */
  describe('Property 9: Optimistic update lifecycle', () => {
    it('should set isPending to true during async operation and false after success', async () => {
      await fc.assert(
        fc.asyncProperty(
          dataArrayArb,
          dataArrayArb,
          dataArrayArb,
          async (initialData, optimisticData, serverData) => {
            const onSuccess = vi.fn();
            
            const { result } = renderHook(() => 
              useOptimistic(initialData, { onSuccess })
            );

            // Initial state
            expect(result.current.isPending).toBe(false);

            // Create a controlled async function
            let resolvePromise: (value: typeof serverData) => void;
            const asyncFn = vi.fn().mockImplementation(() => 
              new Promise<typeof serverData>((resolve) => {
                resolvePromise = resolve;
              })
            );

            // Start the optimistic update
            let updatePromise: Promise<void>;
            act(() => {
              updatePromise = result.current.setOptimistic(optimisticData, asyncFn);
            });

            // During async operation, isPending should be true
            expect(result.current.isPending).toBe(true);
            // Data should be optimistically updated
            expect(result.current.data).toEqual(optimisticData);

            // Resolve the promise
            await act(async () => {
              resolvePromise!(serverData);
              await updatePromise!;
            });

            // After completion, isPending should be false
            expect(result.current.isPending).toBe(false);
            // Data should be synced with server response (Requirement 4.4)
            expect(result.current.data).toEqual(serverData);
            expect(result.current.error).toBeNull();
            
            // onSuccess should have been called
            expect(onSuccess).toHaveBeenCalledWith(serverData);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should set isPending to false after failure', async () => {
      await fc.assert(
        fc.asyncProperty(
          dataArrayArb,
          dataArrayArb,
          async (initialData, optimisticData) => {
            const { result } = renderHook(() => useOptimistic(initialData));

            // Create a controlled async function that will reject
            let rejectPromise: (error: Error) => void;
            const asyncFn = vi.fn().mockImplementation(() => 
              new Promise<typeof initialData>((_, reject) => {
                rejectPromise = reject;
              })
            );

            // Start the optimistic update
            let updatePromise: Promise<void>;
            act(() => {
              updatePromise = result.current.setOptimistic(optimisticData, asyncFn);
            });

            // During async operation, isPending should be true
            expect(result.current.isPending).toBe(true);

            // Reject the promise
            await act(async () => {
              rejectPromise!(new Error('test error'));
              await updatePromise!;
            });

            // After failure, isPending should be false
            expect(result.current.isPending).toBe(false);
            expect(result.current.error).not.toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should clear error on new successful update', async () => {
      await fc.assert(
        fc.asyncProperty(
          dataArrayArb,
          dataArrayArb,
          dataArrayArb,
          async (initialData, failData, successData) => {
            const { result } = renderHook(() => useOptimistic(initialData));

            // First, perform a failing update
            const failingAsyncFn = vi.fn().mockRejectedValue(new Error('fail'));
            await act(async () => {
              await result.current.setOptimistic(failData, failingAsyncFn);
            });

            // Error should be set
            expect(result.current.error).not.toBeNull();

            // Now perform a successful update
            const successAsyncFn = vi.fn().mockResolvedValue(successData);
            await act(async () => {
              await result.current.setOptimistic(successData, successAsyncFn);
            });

            // Error should be cleared
            expect(result.current.error).toBeNull();
            expect(result.current.data).toEqual(successData);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should immediately update UI before async completes (Requirement 4.1)', async () => {
      await fc.assert(
        fc.asyncProperty(
          dataArrayArb,
          dataArrayArb,
          async (initialData, optimisticData) => {
            const { result } = renderHook(() => useOptimistic(initialData));

            // Create a never-resolving promise to check immediate update
            const neverResolve = vi.fn().mockImplementation(() => new Promise(() => {}));

            // Start the update (don't await)
            act(() => {
              result.current.setOptimistic(optimisticData, neverResolve);
            });

            // UI should be immediately updated (Requirement 4.1)
            expect(result.current.data).toEqual(optimisticData);
            expect(result.current.isPending).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
