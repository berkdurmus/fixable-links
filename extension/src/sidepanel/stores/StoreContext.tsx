import React, { createContext, useContext, ReactNode } from 'react';
import { RootStore, IRootStore } from './RootStore';

const rootStore = RootStore.create({
  changes: [],
  repositories: [],
  branches: [],
  pullRequests: [],
  aiComments: [],
  ui: {
    activeTab: 'design',
    isLoading: false,
    isAnalyzing: false,
  },
});

const StoreContext = createContext<IRootStore | null>(null);

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return <StoreContext.Provider value={rootStore}>{children}</StoreContext.Provider>;
};

export const useStore = (): IRootStore => {
  const store = useContext(StoreContext);
  if (!store) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return store;
};

export { rootStore };
