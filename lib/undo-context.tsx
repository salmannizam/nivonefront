'use client';

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

const UNDO_TIMEOUT_MS = 8000;

interface UndoableAction {
  id: string;
  finalize: () => Promise<void>;
}

interface UndoContextValue {
  pendingActionId: string | null;
  scheduleUndoableAction: (actionId: string, finalize: () => Promise<void>) => void;
  undo: () => void;
}

const UndoContext = createContext<UndoContextValue | null>(null);

export function UndoProvider({ children }: { children: ReactNode }) {
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);
  const pendingActionRef = useRef<UndoableAction | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const finalizePendingAction = useCallback(() => {
    const action = pendingActionRef.current;
    if (!action) return;
    pendingActionRef.current = null;
    setPendingActionId(null);
    clearTimer();
    void action.finalize().catch((error) => {
      console.error('Failed to finalize undoable action', error);
    });
  }, [clearTimer]);

  const scheduleUndoableAction = useCallback(
    (actionId: string, finalize: () => Promise<void>) => {
      finalizePendingAction();
      const action: UndoableAction = { id: actionId, finalize };
      pendingActionRef.current = action;
      setPendingActionId(actionId);
      timerRef.current = setTimeout(() => {
        finalizePendingAction();
      }, UNDO_TIMEOUT_MS);
    },
    [finalizePendingAction]
  );

  const undo = useCallback(() => {
    clearTimer();
    pendingActionRef.current = null;
    setPendingActionId(null);
  }, [clearTimer]);

  useEffect(() => {
    return () => {
      finalizePendingAction();
    };
  }, [finalizePendingAction]);

  return (
    <UndoContext.Provider value={{ pendingActionId, scheduleUndoableAction, undo }}>
      {children}
    </UndoContext.Provider>
  );
}

export function useUndo(): UndoContextValue {
  const context = useContext(UndoContext);
  if (!context) {
    throw new Error('useUndo must be used within an UndoProvider');
  }
  return context;
}
