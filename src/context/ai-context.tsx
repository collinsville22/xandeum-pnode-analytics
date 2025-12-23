'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface AIContextType {
  isAiOpen: boolean;
  toggleAi: () => void;
  openAi: () => void;
  closeAi: () => void;
}

const AIContext = createContext<AIContextType | undefined>(undefined);

export function AIProvider({ children }: { children: ReactNode }) {
  const [isAiOpen, setIsAiOpen] = useState(false);

  const toggleAi = () => setIsAiOpen((prev) => !prev);
  const openAi = () => setIsAiOpen(true);
  const closeAi = () => setIsAiOpen(false);

  return (
    <AIContext.Provider value={{ isAiOpen, toggleAi, openAi, closeAi }}>
      {children}
    </AIContext.Provider>
  );
}

export function useAI() {
  const context = useContext(AIContext);
  if (context === undefined) {
    throw new Error('useAI must be used within an AIProvider');
  }
  return context;
}
