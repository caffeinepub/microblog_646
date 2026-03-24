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

function getInitialProfile(): ActiveProfile {
  // If the URL hash contains /artist/, we're on an artist page after a profile switch reload
  const hash = window.location.hash;
  if (hash.includes("/artist/")) return "artist";
  return "fan";
}

export function ActiveProfileProvider({
  children,
}: { children: React.ReactNode }) {
  const [activeProfile, setActiveProfileState] =
    useState<ActiveProfile>(getInitialProfile);

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
