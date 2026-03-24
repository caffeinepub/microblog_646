import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { ThemeProvider } from "next-themes";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { Toaster } from "sonner";
import { LandingPage } from "./components/LandingPage";
import { ProfileSetupDialog } from "./components/ProfileSetupDialog";
import { ActiveProfileProvider } from "./contexts/ActiveProfileContext";
import { useActor } from "./hooks/useActor";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useProfile } from "./hooks/useQueries";
import { router } from "./router";

function AuthenticatedApp() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();

  type LoadState = "loading" | "no-profile" | "error" | "ready";
  const [state, setState] = useState<LoadState>("loading");
  const retryCount = useRef(0);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (!actor || !identity) return;

    let cancelled = false;

    async function loadProfile() {
      if (!actor) return;
      try {
        const result = await actor.getProfile();
        if (cancelled) return;

        if (result?.username) {
          // Profile found — open the app
          setState("ready");
        } else {
          // Definitive null — no profile exists, show creation form
          setState("no-profile");
        }
      } catch (_err) {
        if (cancelled) return;

        // Error/timeout — could be cold start. Retry up to 2 times.
        if (retryCount.current < 2) {
          const delay = retryCount.current === 0 ? 600 : 1800;
          retryCount.current += 1;
          setTimeout(() => {
            if (!cancelled) loadProfile();
          }, delay);
        } else {
          // All retries exhausted — show Retry button
          setState("error");
        }
      }
    }

    if (!hasFetched.current) {
      hasFetched.current = true;
      loadProfile();
    }

    return () => {
      cancelled = true;
    };
  }, [actor, identity]);

  if (state === "ready") {
    return (
      <ActiveProfileProvider>
        <RouterProvider router={router} />
      </ActiveProfileProvider>
    );
  }

  if (state === "no-profile") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <ProfileSetupDialog />
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
        <p className="text-sm text-muted-foreground">Failed to load profile.</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            retryCount.current = 0;
            hasFetched.current = false;
            setState("loading");
          }}
        >
          Retry
        </Button>
      </div>
    );
  }

  // loading state
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-background">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Loading profile...</p>
    </div>
  );
}

export default function App() {
  const { identity, isInitializing } = useInternetIdentity();
  const { isFetching, actor } = useActor();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!identity) {
      queryClient.clear();
    }
  }, [identity, queryClient]);

  useEffect(() => {
    if (identity && window.location.hash.includes("caffeineAdminToken")) {
      window.location.hash = "#/";
    }
  }, [identity]);

  let content: React.ReactNode;

  if (isInitializing) {
    content = (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  } else if (!identity) {
    content = <LandingPage />;
  } else if (!actor || isFetching) {
    content = (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  } else {
    content = <AuthenticatedApp />;
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      {content}
      <Toaster position="bottom-right" />
    </ThemeProvider>
  );
}
