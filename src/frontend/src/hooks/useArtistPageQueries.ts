import type { Principal } from "@icp-sdk/core/principal";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { ExternalBlob } from "../backend";
import type { FullBackendInterface } from "../types/extendedBackend";
import { useActor } from "./useActor";
import { useInternetIdentity } from "./useInternetIdentity";

const DEFAULT_PAGE_SIZE = 20n;

/** Cast actor to the full interface (includes social methods beyond the generated d.ts) */
function fullActor(
  actor: ReturnType<typeof useActor>["actor"],
): FullBackendInterface {
  return actor as unknown as FullBackendInterface;
}

/** Normalize a website URL: add https:// if no protocol is present */
function normalizeWebsite(website: string | null): string | null {
  if (!website || !website.trim()) return null;
  const trimmed = website.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function useArtistPage() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery({
    queryKey: ["artistPage", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not ready");
      const result = await actor.getArtistPage();
      return result ?? null;
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

export function useArtistPageByPrincipal(principal: Principal | null) {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ["artistPageByPrincipal", principal?.toString()],
    queryFn: async () => {
      if (!actor || !principal) return null;
      const result = await actor.getArtistPageByPrincipal(principal);
      return result ?? null;
    },
    enabled: !!actor && !isFetching && !!principal,
  });
}

export function useArtistPageByUsername(username: string) {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ["artistPageByUsername", username],
    queryFn: async () => {
      if (!actor) return null;
      const result = await actor.getArtistPageByUsername(username);
      return result ?? null;
    },
    enabled: !!actor && !isFetching && !!username,
  });
}

export function useCreateOrUpdateArtistPage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async ({
      username,
      bandName,
      genre,
      bio,
      musicLinks,
      location,
      website,
    }: {
      username: string;
      bandName: string;
      genre: string;
      bio: string;
      musicLinks: string[];
      location?: string | null;
      website?: string | null;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      // Normalize website: add https:// if no protocol present
      const normalizedWebsite = normalizeWebsite(website ?? null);
      await actor.createOrUpdateArtistPage(
        username,
        bandName,
        genre,
        bio,
        musicLinks,
        null,
        location ?? null,
        normalizedWebsite,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["artistPage", identity?.getPrincipal().toString()],
      });
      queryClient.invalidateQueries({ queryKey: ["artistPageByPrincipal"] });
      queryClient.invalidateQueries({ queryKey: ["artistPageByUsername"] });
    },
  });
}

export function useArtistFeed(principal: Principal | null) {
  const { actor, isFetching } = useActor();

  return useInfiniteQuery({
    queryKey: ["artistFeed", principal?.toString()],
    queryFn: async ({ pageParam }) => {
      if (!actor || !principal) throw new Error("Actor not ready");
      // getArtistFeed(principal, cursor, limit) → maps to getArtistPosts in backend
      return fullActor(actor).getArtistFeed(
        principal,
        pageParam,
        DEFAULT_PAGE_SIZE,
      );
    },
    initialPageParam: null as bigint | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!actor && !isFetching && !!principal,
  });
}

export function useArtistHomeFeed() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useInfiniteQuery({
    queryKey: ["artistHomeFeed"],
    queryFn: async ({ pageParam }) => {
      if (!actor || !identity) throw new Error("Actor not ready");
      // getArtistHomeFeed(cursor, limit) → maps to getArtistFeed in backend (caller-based)
      return fullActor(actor).getArtistHomeFeed(pageParam, DEFAULT_PAGE_SIZE);
    },
    initialPageParam: null as bigint | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!actor && !isFetching && !!identity,
    refetchInterval: 15000,
  });
}

export function useArtistFollowers(principal: Principal | null) {
  const { actor, isFetching } = useActor();

  return useInfiniteQuery({
    queryKey: ["artistFollowers", principal?.toString()],
    queryFn: async ({ pageParam }) => {
      if (!actor || !principal) throw new Error("Actor not ready");
      return fullActor(actor).getArtistFollowers(
        principal,
        pageParam,
        DEFAULT_PAGE_SIZE,
      );
    },
    initialPageParam: 0n,
    getNextPageParam: (lastPage) => lastPage.nextOffset ?? undefined,
    enabled: !!actor && !isFetching && !!principal,
  });
}

export function useArtistFollowing(principal: Principal | null) {
  const { actor, isFetching } = useActor();

  return useInfiniteQuery({
    queryKey: ["artistFollowing", principal?.toString()],
    queryFn: async ({ pageParam }) => {
      if (!actor || !principal) throw new Error("Actor not ready");
      return fullActor(actor).getArtistFollowing(
        principal,
        pageParam,
        DEFAULT_PAGE_SIZE,
      );
    },
    initialPageParam: 0n,
    getNextPageParam: (lastPage) => lastPage.nextOffset ?? undefined,
    enabled: !!actor && !isFetching && !!principal,
  });
}

export function useFollowArtist() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (artistPrincipal: Principal) => {
      if (!actor) throw new Error("Actor not ready");
      await fullActor(actor).followArtist(artistPrincipal);
    },
    onSettled: (_data, _err, artistPrincipal) => {
      queryClient.invalidateQueries({
        queryKey: ["artistPageByPrincipal", artistPrincipal.toString()],
      });
      queryClient.invalidateQueries({ queryKey: ["artistPageByUsername"] });
    },
  });
}

export function useUnfollowArtist() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (artistPrincipal: Principal) => {
      if (!actor) throw new Error("Actor not ready");
      await fullActor(actor).unfollowArtist(artistPrincipal);
    },
    onSettled: (_data, _err, artistPrincipal) => {
      queryClient.invalidateQueries({
        queryKey: ["artistPageByPrincipal", artistPrincipal.toString()],
      });
      queryClient.invalidateQueries({ queryKey: ["artistPageByUsername"] });
    },
  });
}

export function useUpdateArtistProfilePicture() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async (pictureHash: ExternalBlob | null) => {
      if (!actor) throw new Error("Actor not ready");
      await actor.updateArtistProfilePicture(pictureHash);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["artistPage", identity?.getPrincipal().toString()],
      });
      queryClient.invalidateQueries({ queryKey: ["artistPageByPrincipal"] });
      queryClient.invalidateQueries({ queryKey: ["artistPageByUsername"] });
    },
  });
}

export function useUpdateArtistHeaderImage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async (headerImageHash: ExternalBlob | null) => {
      if (!actor) throw new Error("Actor not ready");
      await actor.updateArtistHeaderImage(headerImageHash);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["artistPage", identity?.getPrincipal().toString()],
      });
      queryClient.invalidateQueries({ queryKey: ["artistPageByPrincipal"] });
      queryClient.invalidateQueries({ queryKey: ["artistPageByUsername"] });
    },
  });
}
