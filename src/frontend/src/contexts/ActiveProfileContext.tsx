import { createContext, useContext, useState } from "react";
import type React from "react";

type ActiveProfile = "fan" | "artist";

interface ActiveProfileContextValue {
  activeProfile: ActiveProfile;
  setActiveProfile: (profile: ActiveProfile) => void;
}

const ActiveProfileContext = createContext<ActiveProfileContextValue | null>(
  null,
);

const STORAGE_KEY = "bandspace_active_profile";

export function ActiveProfileProvider({
  children,
}: { children: React.ReactNode }) {
  const [activeProfile, setActiveProfileState] = useState<ActiveProfile>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "artist" || stored === "fan") return stored;
    } catch {
      // ignore
    }
    return "fan";
  });

  const setActiveProfile = (profile: ActiveProfile) => {
    setActiveProfileState(profile);
    try {
      localStorage.setItem(STORAGE_KEY, profile);
    } catch {
      // ignore
    }
  };

  return (
    <ActiveProfileContext.Provider value={{ activeProfile, setActiveProfile }}>
      {children}
    </ActiveProfileContext.Provider>
  );
}

export function useActiveProfile(): ActiveProfileContextValue {
  const ctx = useContext(ActiveProfileContext);
  if (!ctx) {
    throw new Error(
      "useActiveProfile must be used within ActiveProfileProvider",
    );
  }
  return ctx;
}
