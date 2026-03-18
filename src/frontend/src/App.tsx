import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { ThemeProvider } from "next-themes";
import type React from "react";
import { useEffect } from "react";
import { Toaster } from "sonner";
import { LandingPage } from "./components/LandingPage";
import { ProfileSetupDialog } from "./components/ProfileSetupDialog";
import { ActiveProfileProvider } from "./contexts/ActiveProfileContext";
import { useActor } from "./hooks/useActor";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useProfile } from "./hooks/useQueries";
import { router } from "./router";

function LoadingProfileScreen({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-background">
      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      <p className="text-sm text-muted-foreground font-medium tracking-wide">
        Loading Profile
        <LoadingDots />
      </p>
      {onRetry && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onRetry}
          className="mt-2 text-xs text-muted-foreground"
        >
          Retry
        </Button>
      )}
    </div>
  );
}

function LoadingDots() {
  return (
    <span
      className="inline-flex gap-[2px] ml-[2px] align-middle"
      aria-hidden="true"
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-[3px] h-[3px] rounded-full bg-muted-foreground inline-block"
          style={{
            animation: "loadingDotPulse 1.2s ease-in-out infinite",
            animationDelay: `${i * 0.2}s`,
          }}
        />
      ))}
    </span>
  );
}

function AuthenticatedApp() {
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();
  const {
    data: profile,
    isLoading: isLoadingProfile,
    isError: isProfileError,
    isFetching: isFetchingProfile,
  } = useProfile();

  const hasProfile = profile?.username;

  const handleRetry = () => {
    queryClient.invalidateQueries({
      queryKey: ["profile", identity?.getPrincipal().toString()],
    });
  };

  // While loading or fetching for the first time, show loading screen
  if (isLoadingProfile || (isFetchingProfile && !profile)) {
    return <LoadingProfileScreen />;
  }

  // On error, show loading screen with retry -- NEVER show the create-profile form
  // An error means we couldn't confirm the profile state, not that it doesn't exist
  if (isProfileError) {
    return <LoadingProfileScreen onRetry={handleRetry} />;
  }

  // Only show the setup dialog if the backend confirmed there is no profile
  // (query succeeded but returned null/empty username)
  if (!hasProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <ProfileSetupDialog />
      </div>
    );
  }

  return (
    <ActiveProfileProvider>
      <RouterProvider router={router} />
    </ActiveProfileProvider>
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
    content = <LoadingProfileScreen />;
  } else {
    content = <AuthenticatedApp />;
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <style>{`
        @keyframes loadingDotPulse {
          0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1); }
        }
      `}</style>
      {content}
      <Toaster position="bottom-right" />
    </ThemeProvider>
  );
}
