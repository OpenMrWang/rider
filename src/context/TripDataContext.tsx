import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { useTripData } from '../hooks/useTripData';
import type { TripData, DayRecord } from '../types';

interface TripDataContextType {
  tripData: TripData;
  handleImport: (jsonString: string) => boolean;
  handleExport: () => string;
  handleAddDay: (day: DayRecord) => void;
  handleUpdateDay: (dayIndex: number, day: Partial<DayRecord>) => void;
  handleDeleteDay: (dayIndex: number) => void;
  handleReset: () => void;
}

const TripDataContext = createContext<TripDataContextType | undefined>(undefined);

export function TripDataProvider({ children }: { children: ReactNode }) {
  const tripDataHook = useTripData();

  return (
    <TripDataContext.Provider value={tripDataHook}>
      {children}
    </TripDataContext.Provider>
  );
}

export function useTripDataContext() {
  const context = useContext(TripDataContext);
  if (context === undefined) {
    throw new Error('useTripDataContext 必须在 TripDataProvider 内使用');
  }
  return context;
}

