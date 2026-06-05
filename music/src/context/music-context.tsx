'use client';

import React, { createContext, useReducer, useContext, ReactNode } from 'react';

// State interface
interface MusicState {
  dataRefreshRequired: boolean;
}

// Action types
type MusicAction =
  | { type: 'SET_DATA_REFRESH_REQUIRED'; payload: boolean }
  | { type: 'RESET_STATE' };

// Initial state
const initialState: MusicState = {
  dataRefreshRequired: false,
};

// Reducer function
function musicReducer(state: MusicState, action: MusicAction): MusicState {
  switch (action.type) {
    case 'SET_DATA_REFRESH_REQUIRED':
      return { ...state, dataRefreshRequired: action.payload };
    case 'RESET_STATE':
      return initialState;

    default:
      return state;
  }
}

// Context interface
export interface MusicContextType {
  state: MusicState;
  dispatch: React.Dispatch<MusicAction>;
}

// Create context
const MusicContext = createContext<MusicContextType | undefined>(undefined);

// Provider component
interface MusicProviderProps {
  children: ReactNode;
  initialData?: Partial<MusicState>;
}

export function MusicProvider({ children, initialData }: MusicProviderProps) {
  const [state, dispatch] = useReducer(musicReducer, {
    ...initialState,
    ...initialData,
  });

  const contextValue: MusicContextType = {
    state,
    dispatch,
  };

  return (
    <MusicContext.Provider value={contextValue}>
      {children}
    </MusicContext.Provider>
  );
}

// Hook to use the music context
export function useMusicContext() {
  const context = useContext(MusicContext);

  if (context === undefined) {
    throw new Error('useMusicContext must be used within a MusicProvider');
  }

  return context;
}
