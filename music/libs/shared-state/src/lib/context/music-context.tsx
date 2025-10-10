'use client';

import React, { createContext, useReducer, ReactNode } from 'react';

// State interface
interface MusicState {
  // User preferences
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
  setDataRefreshRequired?: (required: boolean) => void;
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

  const setDataRefreshRequired = (required: boolean) => {
    dispatch({ type: 'SET_DATA_REFRESH_REQUIRED', payload: required });
  };

  const contextValue: MusicContextType = {
    state,
    dispatch,
    setDataRefreshRequired,
  };

  return (
    <MusicContext.Provider value={contextValue}>
      {children}
    </MusicContext.Provider>
  );
}

export { MusicContext };
