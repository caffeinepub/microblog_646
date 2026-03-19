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
  const {
    data: profile,
    isLoading: isLoadingProfile,
    isError: isProfileError,
    refetch,
  } = useProfile();

  type LoadState = "loading" | "no-profile" | "error" | "ready";
  const [state, setState] = useState<LoadState>("loading");

  const errorRetryCount = useRef(0);
  const hasProfile = !!profile?.username;

  // Profile found — go straight to app
  useEffect(() => {
    if (hasProfile) {
      errorRetryCount.current = 0;
      setState("ready");
    }
  }, [hasProfile]);

  // Clean null returned (not an error) — no profile exists, show form immediately
  useEffect(() => {
    if (isLoadingProfile || isProfileError || hasProfile) return;
    // profile is null/undefined and no error — definitive "no profile" signal
    setState("no-profile");
  }, [isLoadingProfile, isProfileError, hasProfile]);

  // Error/timeout (ambiguous) — retry up to 3 times with increasing delays
  useEffect(() => {
    if (!isProfileError || hasProfile) return;

    const delays = [500, 1500, 3000];
    const attempt = errorRetryCount.current;

    if (attempt >= delays.length) {
      setState("no-profile"); // all retries exhausted, treat as no profile
      return;
    }

    const timer = setTimeout(async () => {
      errorRetryCount.current += 1;
      await refetch();
    }, delays[attempt]);

    return () => clearTimeout(timer);
  }, [isProfileError, hasProfile, refetch]);

  if (state === "ready" && hasProfile) {
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
            errorRetryCount.current = 0;
            setState("loading");
            refetch();
          }}
        >
          Retry
        </Button>
      </div>
    );
  }

  // loading / retrying state
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
