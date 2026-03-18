import type { Principal } from "@icp-sdk/core/principal";
import {
  type InfiniteData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { ExternalBlob } from "../backend";
import type { FullBackendInterface } from "../types/extendedBackend";
import type { PaginatedPosts, Post, UserProfileResponse } from "../utils/types";
import { useActor } from "./useActor";
import { useInternetIdentity } from "./useInternetIdentity";

const DEFAULT_PAGE_SIZE = 20n;

/** Cast actor to the full interface (includes social methods beyond the generated d.ts) */
function fullActor(
  actor: ReturnType<typeof useActor>["actor"],
): FullBackendInterface {
  return actor as unknown as FullBackendInterface;
}

export function useProfile() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery({
    queryKey: ["profile", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not ready");
      const result = await actor.getProfile();
      return result ?? null;
    },
    enabled: !!actor && !isFetching && !!identity,
    retry: 5,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
  });
}

export function useCheckUsername(username: string) {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ["checkUsername", username],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not ready");
      return actor.checkUsernameAvailability(username);
    },
    enabled: !!actor && !isFetching && username.length >= 3,
  });
}

export function useSetProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async ({
      username,
      displayName,
      bio,
      location,
      website,
    }: {
      username: string;
      displayName: string;
      bio: string;
      location?: string | null;
      website?: string | null;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      // Normalize website: add https:// if no protocol present
      const normalizedWebsite = normalizeWebsite(website ?? null);
      await actor.setProfile(
        username,
        displayName,
        bio,
        location ?? null,
        normalizedWebsite,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["profile", identity?.getPrincipal().toString()],
      });
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
      queryClient.invalidateQueries({ queryKey: ["profileByUsername"] });
      queryClient.invalidateQueries({ queryKey: ["globalFeed"] });
      queryClient.invalidateQueries({ queryKey: ["homeFeed"] });
      queryClient.invalidateQueries({ queryKey: ["artistHomeFeed"] });
    },
  });
}

/** Normalize a website URL: add https:// if no protocol is present */
function normalizeWebsite(website: string | null): string | null {
  if (!website || !website.trim()) return null;
  const trimmed = website.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function useUpdateProfilePicture() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async (pictureHash: ExternalBlob | null) => {
      if (!actor) throw new Error("Actor not ready");
      await actor.updateProfilePicture(pictureHash);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["profile", identity?.getPrincipal().toString()],
      });
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
      queryClient.invalidateQueries({ queryKey: ["profileByUsername"] });
      queryClient.invalidateQueries({ queryKey: ["globalFeed"] });
      queryClient.invalidateQueries({ queryKey: ["homeFeed"] });
      queryClient.invalidateQueries({ queryKey: ["artistHomeFeed"] });
    },
  });
}

export function useUpdateHeaderImage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async (imageHash: ExternalBlob | null) => {
      if (!actor) throw new Error("Actor not ready");
      await actor.updateHeaderImage(imageHash);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["profile", identity?.getPrincipal().toString()],
      });
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
      queryClient.invalidateQueries({ queryKey: ["profileByUsername"] });
    },
  });
}

export function useCreatePost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      text,
      mediaHash,
      mediaType,
      isArtistPost = false,
    }: {
      text: string;
      mediaHash: ExternalBlob | null;
      mediaType: string | null;
      isArtistPost?: boolean;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      return fullActor(actor).createPost(
        text,
        mediaHash,
        mediaType,
        isArtistPost,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["globalFeed"] });
      queryClient.invalidateQueries({ queryKey: ["homeFeed"] });
      queryClient.invalidateQueries({ queryKey: ["artistHomeFeed"] });
      queryClient.invalidateQueries({ queryKey: ["userPosts"] });
    },
  });
}

export function useEditPost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, text }: { postId: bigint; text: string }) => {
      if (!actor) throw new Error("Actor not ready");
      return fullActor(actor).editPost(postId, text);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["globalFeed"] });
      queryClient.invalidateQueries({ queryKey: ["homeFeed"] });
      queryClient.invalidateQueries({ queryKey: ["artistHomeFeed"] });
      queryClient.invalidateQueries({ queryKey: ["userPosts"] });
      queryClient.invalidateQueries({
        queryKey: ["post", variables.postId.toString()],
      });
    },
  });
}

export function useDeletePost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: bigint) => {
      if (!actor) throw new Error("Actor not ready");
      await fullActor(actor).deletePost(postId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["globalFeed"] });
      queryClient.invalidateQueries({ queryKey: ["homeFeed"] });
      queryClient.invalidateQueries({ queryKey: ["artistHomeFeed"] });
      queryClient.invalidateQueries({ queryKey: ["userPosts"] });
    },
  });
}

export function usePost(postId: bigint | null) {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ["post", postId?.toString()],
    queryFn: async () => {
      if (!actor || postId === null) throw new Error("Actor not ready");
      const result = await fullActor(actor).getPost(postId);
      return result ?? null;
    },
    enabled: !!actor && !isFetching && postId !== null,
  });
}

export function useGlobalFeed() {
  const { actor, isFetching } = useActor();

  return useInfiniteQuery({
    queryKey: ["globalFeed"],
    queryFn: async ({ pageParam }) => {
      if (!actor) throw new Error("Actor not ready");
      return fullActor(actor).getGlobalFeed(pageParam, DEFAULT_PAGE_SIZE);
    },
    initialPageParam: null as bigint | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!actor && !isFetching,
    refetchInterval: 15_000,
  });
}

export function useUserPosts(user: Principal | null) {
  const { actor, isFetching } = useActor();

  return useInfiniteQuery({
    queryKey: ["userPosts", user?.toString()],
    queryFn: async ({ pageParam }) => {
      if (!actor || !user) throw new Error("Actor not ready");
      return fullActor(actor).getPostsByPrincipal(
        user,
        pageParam,
        DEFAULT_PAGE_SIZE,
      );
    },
    initialPageParam: null as bigint | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!actor && !isFetching && !!user,
  });
}

export function useHomeFeed() {
  const { actor, isFetching } = useActor();

  return useInfiniteQuery({
    queryKey: ["homeFeed"],
    queryFn: async ({ pageParam }) => {
      if (!actor) throw new Error("Actor not ready");
      return fullActor(actor).getHomeFeed(pageParam, DEFAULT_PAGE_SIZE);
    },
    initialPageParam: null as bigint | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!actor && !isFetching,
    refetchInterval: 15_000,
  });
}

export function useUserProfile(user: Principal | null) {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ["userProfile", user?.toString()],
    queryFn: async () => {
      if (!actor || !user) throw new Error("Actor not ready");
      const result = await fullActor(actor).getUserProfile(user);
      return result ?? null;
    },
    enabled: !!actor && !isFetching && !!user,
  });
}

export function useProfileByUsername(username: string) {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ["profileByUsername", username],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not ready");
      const result = await fullActor(actor).getProfileByUsername(username);
      return result ?? null;
    },
    enabled: !!actor && !isFetching && username.length > 0,
  });
}

export function useFollowers(username: string) {
  const { actor, isFetching } = useActor();

  return useInfiniteQuery({
    queryKey: ["followers", username],
    queryFn: async ({ pageParam }) => {
      if (!actor) throw new Error("Actor not ready");
      return fullActor(actor).getFollowers(
        username,
        pageParam,
        DEFAULT_PAGE_SIZE,
      );
    },
    initialPageParam: 0n,
    getNextPageParam: (lastPage) => lastPage.nextOffset ?? undefined,
    enabled: !!actor && !isFetching && username.length > 0,
  });
}

export function useFollowing(username: string) {
  const { actor, isFetching } = useActor();

  return useInfiniteQuery({
    queryKey: ["following", username],
    queryFn: async ({ pageParam }) => {
      if (!actor) throw new Error("Actor not ready");
      return fullActor(actor).getFollowing(
        username,
        pageParam,
        DEFAULT_PAGE_SIZE,
      );
    },
    initialPageParam: 0n,
    getNextPageParam: (lastPage) => lastPage.nextOffset ?? undefined,
    enabled: !!actor && !isFetching && username.length > 0,
  });
}

export function usePostsByUsername(username: string) {
  const { actor, isFetching } = useActor();

  return useInfiniteQuery({
    queryKey: ["postsByUsername", username],
    queryFn: async ({ pageParam }) => {
      if (!actor) throw new Error("Actor not ready");
      return fullActor(actor).getPostsByUsername(
        username,
        pageParam,
        DEFAULT_PAGE_SIZE,
      );
    },
    initialPageParam: null as bigint | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!actor && !isFetching && username.length > 0,
  });
}

export function useFollowUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (user: Principal) => {
      if (!actor) throw new Error("Actor not ready");
      await fullActor(actor).followUser(user);
    },
    onMutate: async (user) => {
      const userProfileKey = ["userProfile", user.toString()];
      await queryClient.cancelQueries({ queryKey: userProfileKey });
      await queryClient.cancelQueries({ queryKey: ["profileByUsername"] });

      const snapshots: Array<[readonly unknown[], unknown]> = [];
      const userProfileData = queryClient.getQueryData(userProfileKey);
      if (userProfileData !== undefined) {
        snapshots.push([userProfileKey, userProfileData]);
      }
      for (const entry of queryClient.getQueriesData({
        queryKey: ["profileByUsername"],
      })) {
        snapshots.push(entry);
      }

      queryClient.setQueryData(
        userProfileKey,
        (old: UserProfileResponse | undefined) => {
          if (!old) return old;
          return {
            ...old,
            followersCount: old.followersCount + 1n,
            isFollowedByCurrentUser: true,
          };
        },
      );
      queryClient.setQueriesData(
        { queryKey: ["profileByUsername"] },
        (old: UserProfileResponse | null | undefined) => {
          if (!old || old.principal.toString() !== user.toString()) return old;
          return {
            ...old,
            followersCount: old.followersCount + 1n,
            isFollowedByCurrentUser: true,
          };
        },
      );

      return { snapshots };
    },
    onError: (_err, _user, context) => {
      if (context?.snapshots) {
        restoreQuerySnapshots(queryClient, context.snapshots);
      }
    },
    onSettled: (_data, _err, user) => {
      queryClient.invalidateQueries({
        queryKey: ["userProfile", user.toString()],
      });
      queryClient.invalidateQueries({ queryKey: ["profileByUsername"] });
      queryClient.invalidateQueries({ queryKey: ["homeFeed"] });
      queryClient.invalidateQueries({ queryKey: ["artistHomeFeed"] });
    },
  });
}

export function useUnfollowUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (user: Principal) => {
      if (!actor) throw new Error("Actor not ready");
      await fullActor(actor).unfollowUser(user);
    },
    onMutate: async (user) => {
      const userProfileKey = ["userProfile", user.toString()];
      await queryClient.cancelQueries({ queryKey: userProfileKey });
      await queryClient.cancelQueries({ queryKey: ["profileByUsername"] });

      const snapshots: Array<[readonly unknown[], unknown]> = [];
      const userProfileData = queryClient.getQueryData(userProfileKey);
      if (userProfileData !== undefined) {
        snapshots.push([userProfileKey, userProfileData]);
      }
      for (const entry of queryClient.getQueriesData({
        queryKey: ["profileByUsername"],
      })) {
        snapshots.push(entry);
      }

      queryClient.setQueryData(
        userProfileKey,
        (old: UserProfileResponse | undefined) => {
          if (!old) return old;
          return {
            ...old,
            followersCount:
              old.followersCount > 0n ? old.followersCount - 1n : 0n,
            isFollowedByCurrentUser: false,
          };
        },
      );
      queryClient.setQueriesData(
        { queryKey: ["profileByUsername"] },
        (old: UserProfileResponse | null | undefined) => {
          if (!old || old.principal.toString() !== user.toString()) return old;
          return {
            ...old,
            followersCount:
              old.followersCount > 0n ? old.followersCount - 1n : 0n,
            isFollowedByCurrentUser: false,
          };
        },
      );

      return { snapshots };
    },
    onError: (_err, _user, context) => {
      if (context?.snapshots) {
        restoreQuerySnapshots(queryClient, context.snapshots);
      }
    },
    onSettled: (_data, _err, user) => {
      queryClient.invalidateQueries({
        queryKey: ["userProfile", user.toString()],
      });
      queryClient.invalidateQueries({ queryKey: ["profileByUsername"] });
      queryClient.invalidateQueries({ queryKey: ["homeFeed"] });
      queryClient.invalidateQueries({ queryKey: ["artistHomeFeed"] });
    },
  });
}

export function useBlockUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (user: Principal) => {
      if (!actor) throw new Error("Actor not ready");
      await fullActor(actor).blockUser(user);
    },
    onSettled: (_data, _err, user) => {
      queryClient.invalidateQueries({
        queryKey: ["userProfile", user.toString()],
      });
      queryClient.invalidateQueries({ queryKey: ["profileByUsername"] });
      queryClient.invalidateQueries({ queryKey: ["homeFeed"] });
      queryClient.invalidateQueries({ queryKey: ["artistHomeFeed"] });
      queryClient.invalidateQueries({ queryKey: ["globalFeed"] });
    },
  });
}

export function useUnblockUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (user: Principal) => {
      if (!actor) throw new Error("Actor not ready");
      await fullActor(actor).unblockUser(user);
    },
    onSettled: (_data, _err, user) => {
      queryClient.invalidateQueries({
        queryKey: ["userProfile", user.toString()],
      });
      queryClient.invalidateQueries({ queryKey: ["profileByUsername"] });
      queryClient.invalidateQueries({ queryKey: ["homeFeed"] });
      queryClient.invalidateQueries({ queryKey: ["artistHomeFeed"] });
      queryClient.invalidateQueries({ queryKey: ["globalFeed"] });
    },
  });
}

export function useMuteUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (user: Principal) => {
      if (!actor) throw new Error("Actor not ready");
      await fullActor(actor).muteUser(user);
    },
    onSettled: (_data, _err, user) => {
      queryClient.invalidateQueries({
        queryKey: ["userProfile", user.toString()],
      });
      queryClient.invalidateQueries({ queryKey: ["profileByUsername"] });
      queryClient.invalidateQueries({ queryKey: ["homeFeed"] });
      queryClient.invalidateQueries({ queryKey: ["artistHomeFeed"] });
    },
  });
}

export function useUnmuteUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (user: Principal) => {
      if (!actor) throw new Error("Actor not ready");
      await fullActor(actor).unmuteUser(user);
    },
    onSettled: (_data, _err, user) => {
      queryClient.invalidateQueries({
        queryKey: ["userProfile", user.toString()],
      });
      queryClient.invalidateQueries({ queryKey: ["profileByUsername"] });
      queryClient.invalidateQueries({ queryKey: ["homeFeed"] });
      queryClient.invalidateQueries({ queryKey: ["artistHomeFeed"] });
    },
  });
}

export function useReplies(postId: bigint | null) {
  const { actor, isFetching } = useActor();

  return useInfiniteQuery({
    queryKey: ["replies", postId?.toString()],
    queryFn: async ({ pageParam }) => {
      if (!actor || postId === null) throw new Error("Actor not ready");
      return fullActor(actor).getReplies(postId, pageParam, DEFAULT_PAGE_SIZE);
    },
    initialPageParam: null as bigint | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!actor && !isFetching && postId !== null,
  });
}

export function useCreateReply() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      parentPostId,
      text,
      mediaHash,
      mediaType,
    }: {
      parentPostId: bigint;
      text: string;
      mediaHash: ExternalBlob | null;
      mediaType: string | null;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      return fullActor(actor).createReply(
        parentPostId,
        text,
        mediaHash,
        mediaType,
      );
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["replies", variables.parentPostId.toString()],
      });
      queryClient.invalidateQueries({
        queryKey: ["post", variables.parentPostId.toString()],
      });
      // Update reply count in feed caches
      updatePostInFeedCache(queryClient, variables.parentPostId, (post) => ({
        ...post,
        replyCount: post.replyCount + 1n,
      }));
    },
  });
}

const POST_FEED_KEYS = [
  "globalFeed",
  "homeFeed",
  "userPosts",
  "postsByUsername",
  "postsByHashtag",
  "searchPosts",
  "replies",
];

async function cancelPostFeedQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  postId?: bigint,
) {
  await Promise.all([
    ...POST_FEED_KEYS.map((key) =>
      queryClient.cancelQueries({ queryKey: [key] }),
    ),
    ...(postId !== undefined
      ? [queryClient.cancelQueries({ queryKey: ["post", postId.toString()] })]
      : []),
  ]);
}

function snapshotPostFeedQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  postId?: bigint,
) {
  const entries: Array<[readonly unknown[], unknown]> = [];
  for (const key of POST_FEED_KEYS) {
    for (const entry of queryClient.getQueriesData({ queryKey: [key] })) {
      entries.push(entry);
    }
  }
  if (postId !== undefined) {
    const postData = queryClient.getQueryData(["post", postId.toString()]);
    if (postData !== undefined) {
      entries.push([["post", postId.toString()], postData]);
    }
  }
  return entries;
}

function restoreQuerySnapshots(
  queryClient: ReturnType<typeof useQueryClient>,
  snapshots: Array<[readonly unknown[], unknown]>,
) {
  for (const [key, data] of snapshots) {
    queryClient.setQueryData(key, data);
  }
}

function invalidatePostFeedQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  postId?: bigint,
) {
  for (const key of POST_FEED_KEYS) {
    queryClient.invalidateQueries({ queryKey: [key] });
  }
  if (postId !== undefined) {
    queryClient.invalidateQueries({
      queryKey: ["post", postId.toString()],
    });
  }
}

function updatePostInFeedCache(
  queryClient: ReturnType<typeof useQueryClient>,
  postId: bigint,
  updater: (post: Post) => Post,
) {
  for (const key of POST_FEED_KEYS) {
    queryClient.setQueriesData(
      { queryKey: [key] },
      (old: InfiniteData<PaginatedPosts, bigint | null> | undefined) => {
        if (!old?.pages) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            posts: page.posts.map((post) =>
              post.id === postId ? updater(post) : post,
            ),
          })),
        };
      },
    );
  }
  queryClient.setQueryData(
    ["post", postId.toString()],
    (old: Post | null | undefined) => {
      if (!old) return old;
      return updater(old);
    },
  );
}

export function useLikePost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: bigint) => {
      if (!actor) throw new Error("Actor not ready");
      await fullActor(actor).likePost(postId);
    },
    onMutate: async (postId) => {
      await cancelPostFeedQueries(queryClient, postId);
      const snapshots = snapshotPostFeedQueries(queryClient, postId);
      updatePostInFeedCache(queryClient, postId, (post) => ({
        ...post,
        likeCount: post.likeCount + 1n,
        isLikedByCurrentUser: true,
      }));
      return { snapshots };
    },
    onError: (_err, _postId, context) => {
      if (context?.snapshots) {
        restoreQuerySnapshots(queryClient, context.snapshots);
      }
    },
    onSettled: (_data, _err, postId) => {
      invalidatePostFeedQueries(queryClient, postId);
    },
  });
}

export function useUnlikePost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: bigint) => {
      if (!actor) throw new Error("Actor not ready");
      await fullActor(actor).unlikePost(postId);
    },
    onMutate: async (postId) => {
      await cancelPostFeedQueries(queryClient, postId);
      const snapshots = snapshotPostFeedQueries(queryClient, postId);
      updatePostInFeedCache(queryClient, postId, (post) => ({
        ...post,
        likeCount: post.likeCount > 0n ? post.likeCount - 1n : 0n,
        isLikedByCurrentUser: false,
      }));
      return { snapshots };
    },
    onError: (_err, _postId, context) => {
      if (context?.snapshots) {
        restoreQuerySnapshots(queryClient, context.snapshots);
      }
    },
    onSettled: (_data, _err, postId) => {
      invalidatePostFeedQueries(queryClient, postId);
    },
  });
}

export function useRepostPost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: bigint) => {
      if (!actor) throw new Error("Actor not ready");
      await fullActor(actor).repostPost(postId);
    },
    onMutate: async (postId) => {
      await cancelPostFeedQueries(queryClient, postId);
      const snapshots = snapshotPostFeedQueries(queryClient, postId);
      updatePostInFeedCache(queryClient, postId, (post) => ({
        ...post,
        repostCount: post.repostCount + 1n,
        isRepostedByCurrentUser: true,
      }));
      return { snapshots };
    },
    onError: (_err, _postId, context) => {
      if (context?.snapshots) {
        restoreQuerySnapshots(queryClient, context.snapshots);
      }
    },
    onSettled: (_data, _err, postId) => {
      invalidatePostFeedQueries(queryClient, postId);
    },
  });
}

export function useQuotePost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      postId,
      text,
      mediaHash,
      mediaType,
    }: {
      postId: bigint;
      text: string;
      mediaHash: ExternalBlob | null;
      mediaType: string | null;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      return fullActor(actor).quotePost(postId, text, mediaHash, mediaType);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["globalFeed"] });
      queryClient.invalidateQueries({ queryKey: ["homeFeed"] });
      queryClient.invalidateQueries({ queryKey: ["artistHomeFeed"] });
      queryClient.invalidateQueries({ queryKey: ["userPosts"] });
    },
  });
}

export function useSearchPosts(query: string) {
  const { actor, isFetching } = useActor();

  return useInfiniteQuery({
    queryKey: ["searchPosts", query],
    queryFn: async ({ pageParam }) => {
      if (!actor) throw new Error("Actor not ready");
      return fullActor(actor).searchPosts(query, pageParam, DEFAULT_PAGE_SIZE);
    },
    initialPageParam: null as bigint | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!actor && !isFetching && query.trim().length > 0,
  });
}

export function useSearchUsers(query: string) {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ["searchUsers", query],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not ready");
      return fullActor(actor).searchUsers(query, 20n);
    },
    enabled: !!actor && !isFetching && query.trim().length > 0,
  });
}

export function usePostsByHashtag(tag: string) {
  const { actor, isFetching } = useActor();

  return useInfiniteQuery({
    queryKey: ["postsByHashtag", tag],
    queryFn: async ({ pageParam }) => {
      if (!actor) throw new Error("Actor not ready");
      return fullActor(actor).getPostsByHashtag(
        tag,
        pageParam,
        DEFAULT_PAGE_SIZE,
      );
    },
    initialPageParam: null as bigint | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!actor && !isFetching && tag.trim().length > 0,
  });
}

export function useTrendingHashtags() {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ["trendingHashtags"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not ready");
      return fullActor(actor).getTrendingHashtags(10n);
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 60_000,
  });
}

export function useNotifications() {
  const { actor, isFetching } = useActor();

  return useInfiniteQuery({
    queryKey: ["notifications"],
    queryFn: async ({ pageParam }) => {
      if (!actor) throw new Error("Actor not ready");
      return fullActor(actor).getNotifications(pageParam, DEFAULT_PAGE_SIZE);
    },
    initialPageParam: null as bigint | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!actor && !isFetching,
  });
}

export function useUnreadNotificationCount() {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ["unreadNotificationCount"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not ready");
      return fullActor(actor).getUnreadNotificationCount();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30_000,
  });
}

export function useMarkNotificationRead() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notifId: bigint) => {
      if (!actor) throw new Error("Actor not ready");
      await fullActor(actor).markNotificationRead(notifId);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({
        queryKey: ["unreadNotificationCount"],
      });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor not ready");
      await fullActor(actor).markAllNotificationsRead();
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({
        queryKey: ["unreadNotificationCount"],
      });
    },
  });
}

export function useUndoRepost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: bigint) => {
      if (!actor) throw new Error("Actor not ready");
      await fullActor(actor).undoRepost(postId);
    },
    onMutate: async (postId) => {
      await cancelPostFeedQueries(queryClient, postId);
      const snapshots = snapshotPostFeedQueries(queryClient, postId);
      updatePostInFeedCache(queryClient, postId, (post) => ({
        ...post,
        repostCount: post.repostCount > 0n ? post.repostCount - 1n : 0n,
        isRepostedByCurrentUser: false,
      }));
      return { snapshots };
    },
    onError: (_err, _postId, context) => {
      if (context?.snapshots) {
        restoreQuerySnapshots(queryClient, context.snapshots);
      }
    },
    onSettled: (_data, _err, postId) => {
      invalidatePostFeedQueries(queryClient, postId);
    },
  });
}
