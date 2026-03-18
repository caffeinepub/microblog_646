/**
 * Extended backend interface that includes social networking methods
 * beyond the profile management methods in the generated backendInterface.
 * These methods exist in the deployed canister but are not in the
 * generated type declaration.
 */
import type { Principal } from "@icp-sdk/core/principal";
import type { ExternalBlob } from "../backend";
import type { backendInterface } from "../backend";
import type {
  PaginatedFollows,
  PaginatedPosts,
  Post,
  UserProfileResponse,
} from "./index";

export interface ArtistPageFeedPage {
  posts: Post[];
  nextCursor?: bigint;
  hasMore: boolean;
}

export interface ArtistFollowPage {
  users: Array<{
    principal: Principal;
    username: string;
    displayName?: string;
    profilePictureHash?: ExternalBlob;
  }>;
  nextOffset?: bigint;
  hasMore: boolean;
}

/** Full actor interface combining declared + social methods */
export interface FullBackendInterface extends backendInterface {
  // Posts
  createPost(
    text: string,
    mediaHash: ExternalBlob | null,
    mediaType: string | null,
    isArtistPost: boolean,
  ): Promise<bigint>;
  editPost(postId: bigint, text: string): Promise<void>;
  deletePost(postId: bigint): Promise<void>;
  getPost(postId: bigint): Promise<Post | null>;

  // Feeds
  getGlobalFeed(
    cursor: bigint | null,
    pageSize: bigint,
  ): Promise<PaginatedPosts>;
  getHomeFeed(cursor: bigint | null, pageSize: bigint): Promise<PaginatedPosts>;
  // Artist home feed (caller-based follows)
  getArtistHomeFeed(
    cursor: bigint | null,
    pageSize: bigint,
  ): Promise<PaginatedPosts>;
  // Specific artist's posts (used for profile page)
  getArtistFeed(
    principal: Principal,
    cursor: bigint | null,
    pageSize: bigint,
  ): Promise<PaginatedPosts>;
  getPostsByPrincipal(
    user: Principal,
    cursor: bigint | null,
    pageSize: bigint,
  ): Promise<PaginatedPosts>;
  getPostsByUsername(
    username: string,
    cursor: bigint | null,
    pageSize: bigint,
  ): Promise<PaginatedPosts>;
  getPostsByHashtag(
    tag: string,
    cursor: bigint | null,
    pageSize: bigint,
  ): Promise<PaginatedPosts>;

  // User profiles
  getUserProfile(principal: Principal): Promise<UserProfileResponse | null>;
  getProfileByUsername(username: string): Promise<UserProfileResponse | null>;

  // Follow / unfollow fans
  followUser(user: Principal): Promise<void>;
  unfollowUser(user: Principal): Promise<void>;
  blockUser(user: Principal): Promise<void>;
  unblockUser(user: Principal): Promise<void>;
  muteUser(user: Principal): Promise<void>;
  unmuteUser(user: Principal): Promise<void>;

  // Fan followers/following
  getFollowers(
    username: string,
    offset: bigint,
    pageSize: bigint,
  ): Promise<PaginatedFollows>;
  getFollowing(
    username: string,
    offset: bigint,
    pageSize: bigint,
  ): Promise<PaginatedFollows>;

  // Artist social
  getArtistFollowers(
    principal: Principal,
    offset: bigint,
    pageSize: bigint,
  ): Promise<PaginatedFollows>;
  getArtistFollowing(
    principal: Principal,
    offset: bigint,
    pageSize: bigint,
  ): Promise<PaginatedFollows>;
  followArtist(artistPrincipal: Principal): Promise<void>;
  unfollowArtist(artistPrincipal: Principal): Promise<void>;

  // Replies / interactions
  createReply(
    parentPostId: bigint,
    text: string,
    mediaHash: ExternalBlob | null,
    mediaType: string | null,
  ): Promise<bigint>;
  getReplies(
    postId: bigint,
    cursor: bigint | null,
    pageSize: bigint,
  ): Promise<PaginatedPosts>;
  likePost(postId: bigint): Promise<void>;
  unlikePost(postId: bigint): Promise<void>;
  repostPost(postId: bigint): Promise<void>;
  undoRepost(postId: bigint): Promise<void>;
  quotePost(
    postId: bigint,
    text: string,
    mediaHash: ExternalBlob | null,
    mediaType: string | null,
  ): Promise<bigint>;

  // Search
  searchPosts(
    query: string,
    cursor: bigint | null,
    pageSize: bigint,
  ): Promise<PaginatedPosts>;
  searchUsers(query: string, limit: bigint): Promise<UserProfileResponse[]>;

  // Trending
  getTrendingHashtags(limit: bigint): Promise<Array<[string, bigint]>>;

  // Notifications
  getNotifications(
    cursor: bigint | null,
    pageSize: bigint,
  ): Promise<{
    notifications: Array<{
      id: bigint;
      notificationType: Record<string, unknown>;
      actorPrincipal?: Principal;
      actorUsername?: string;
      postId?: bigint;
      createdAt: bigint;
      isRead: boolean;
    }>;
    nextCursor?: bigint;
    hasMore: boolean;
  }>;
  getUnreadNotificationCount(): Promise<bigint>;
  markNotificationRead(notifId: bigint): Promise<void>;
  markAllNotificationsRead(): Promise<void>;
}
