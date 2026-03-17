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

function AuthenticatedApp() {
  const {
    data: profile,
    isLoading: isLoadingProfile,
    isError: isProfileError,
    refetch: refetchProfile,
  } = useProfile();

  const { clear } = useInternetIdentity();

  const hasProfile = profile?.username;

  if (isLoadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isProfileError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-destructive">Failed to load profile.</p>
          <Button
            variant="link"
            onClick={() => refetchProfile()}
            className="mt-2 text-sm text-muted-foreground"
          >
            Refresh
          </Button>
          <Button
            variant="outline"
            onClick={clear}
            className="mt-2 block mx-auto"
          >
            Log out and try again
          </Button>
        </div>
      </div>
    );
  }

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
