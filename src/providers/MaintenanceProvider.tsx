
import React, { createContext, useContext, useState } from "react";

interface MaintenanceContextType {
  maintenanceMode: boolean;
  toggleMaintenanceMode: () => void;
}

const MaintenanceContext = createContext<MaintenanceContextType | undefined>(undefined);

export function MaintenanceProvider({ children }: { children: React.ReactNode }) {
  const [maintenanceMode, setMaintenanceMode] = useState<boolean>(false);

  const toggleMaintenanceMode = () => {
    setMaintenanceMode((prev) => !prev);
  };

  return (
    <MaintenanceContext.Provider value={{ maintenanceMode, toggleMaintenanceMode }}>
      {children}
    </MaintenanceContext.Provider>
  );
}

export function useMaintenance() {
  const context = useContext(MaintenanceContext);
  if (context === undefined) {
    throw new Error("useMaintenance must be used within a MaintenanceProvider");
  }
  return context;
}
