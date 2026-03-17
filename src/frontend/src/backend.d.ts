import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface TrendingHashtag {
    tag: string;
    count: bigint;
}
export type Time = bigint;
export interface ArtistPageResponse {
    bio: string;
    postCount: bigint;
    principal: Principal;
    createdAt: Time;
    tier: string;
    bandName: string;
    updatedAt: Time;
    genre: string;
    musicLinks: Array<string>;
    followerCount: bigint;
    headerImageHash?: ExternalBlob;
    followingCount: bigint;
    isFollowedByCurrentUser: boolean;
    profilePictureHash?: ExternalBlob;
}
export type PostType = {
    __kind__: "repost";
    repost: bigint;
} | {
    __kind__: "quote";
    quote: bigint;
} | {
    __kind__: "original";
    original: null;
} | {
    __kind__: "reply";
    reply: bigint;
};
export interface PaginatedPosts {
    hasMore: boolean;
    posts: Array<PostResponse>;
    nextCursor?: bigint;
}
export interface PaginatedNotifications {
    hasMore: boolean;
    notifications: Array<Notification>;
    nextCursor?: bigint;
}
export interface UserProfileResponse {
    bio: string;
    isBlockedByCurrentUser: boolean;
    principal: Principal;
    username: string;
    displayName: string;
    isMutedByCurrentUser: boolean;
    followersCount: bigint;
    createdAt: Time;
    updatedAt: Time;
    headerImageHash?: ExternalBlob;
    followingCount: bigint;
    isFollowedByCurrentUser: boolean;
    profilePictureHash?: ExternalBlob;
    postsCount: bigint;
}
export type NotificationType = {
    __kind__: "repost";
    repost: bigint;
} | {
    __kind__: "like";
    like: bigint;
} | {
    __kind__: "quote";
    quote: bigint;
} | {
    __kind__: "mention";
    mention: bigint;
} | {
    __kind__: "reply";
    reply: bigint;
} | {
    __kind__: "follow";
    follow: null;
};
export interface FollowUserResponse {
    principal: Principal;
    username: string;
    displayName: string;
    profilePictureHash?: ExternalBlob;
}
export interface Notification {
    id: bigint;
    notificationType: NotificationType;
    createdAt: Time;
    isRead: boolean;
    actorUsername: string;
    actorPrincipal: Principal;
}
export interface PostResponse {
    id: bigint;
    postType: PostType;
    authorUsername: string;
    likeCount: bigint;
    isRepostedByCurrentUser: boolean;
    authorProfilePictureHash?: ExternalBlob;
    repostCount: bigint;
    createdAt: Time;
    text: string;
    author: Principal;
    mediaHash?: ExternalBlob;
    replyCount: bigint;
    authorIdentity: AuthorIdentity;
    mediaType?: string;
    editedAt?: Time;
    authorDisplayName: string;
    isLikedByCurrentUser: boolean;
}
export interface UserProfile {
    bio: string;
    username: string;
    displayName: string;
    createdAt: Time;
    updatedAt: Time;
    headerImageHash?: ExternalBlob;
    profilePictureHash?: ExternalBlob;
}
export interface PaginatedFollows {
    nextOffset?: bigint;
    hasMore: boolean;
    users: Array<FollowUserResponse>;
}
export enum AuthorIdentity {
    fan = "fan",
    artist = "artist"
}
export interface backendInterface {
    blockUser(user: Principal): Promise<void>;
    checkUsernameAvailability(username: string): Promise<boolean>;
    createOrUpdateArtistPage(bandName: string, genre: string, bio: string, musicLinks: Array<string>, tier: string | null): Promise<void>;
    createPost(text: string, mediaHash: ExternalBlob | null, mediaType: string | null, isArtistPost: boolean): Promise<PostResponse>;
    createReply(parentPostId: bigint, text: string, mediaHash: ExternalBlob | null, mediaType: string | null): Promise<PostResponse>;
    deletePost(postId: bigint): Promise<void>;
    editPost(postId: bigint, text: string): Promise<PostResponse>;
    followArtist(artistPrincipal: Principal): Promise<void>;
    followUser(user: Principal): Promise<void>;
    getArtistFeed(principal: Principal, cursor: bigint | null, limit: bigint): Promise<PaginatedPosts>;
    getArtistFollowers(principal: Principal, offset: bigint, limit: bigint): Promise<PaginatedFollows>;
    getArtistFollowing(principal: Principal, offset: bigint, limit: bigint): Promise<PaginatedFollows>;
    getArtistPage(): Promise<ArtistPageResponse | null>;
    getArtistPageByPrincipal(principal: Principal): Promise<ArtistPageResponse | null>;
    getArtistPageByUsername(username: string): Promise<ArtistPageResponse | null>;
    getFollowers(username: string, offset: bigint, limit: bigint): Promise<PaginatedFollows>;
    getFollowing(username: string, offset: bigint, limit: bigint): Promise<PaginatedFollows>;
    getGlobalFeed(cursor: bigint | null, limit: bigint): Promise<PaginatedPosts>;
    getHomeFeed(cursor: bigint | null, limit: bigint): Promise<PaginatedPosts>;
    getNotifications(cursor: bigint | null, limit: bigint): Promise<PaginatedNotifications>;
    getPost(postId: bigint): Promise<PostResponse | null>;
    getPostsByHashtag(tag: string, cursor: bigint | null, limit: bigint): Promise<PaginatedPosts>;
    getPostsByPrincipal(user: Principal, cursor: bigint | null, limit: bigint): Promise<PaginatedPosts>;
    getPostsByUsername(username: string, cursor: bigint | null, limit: bigint): Promise<PaginatedPosts>;
    getPrincipalByUsername(username: string): Promise<Principal | null>;
    getProfile(): Promise<UserProfile | null>;
    getProfileByUsername(username: string): Promise<UserProfileResponse | null>;
    getReplies(postId: bigint, cursor: bigint | null, limit: bigint): Promise<PaginatedPosts>;
    getTrendingHashtags(limit: bigint): Promise<Array<TrendingHashtag>>;
    getUnreadNotificationCount(): Promise<bigint>;
    getUserProfile(user: Principal): Promise<UserProfileResponse | null>;
    likePost(postId: bigint): Promise<void>;
    markAllNotificationsRead(): Promise<void>;
    markNotificationRead(notifId: bigint): Promise<void>;
    muteUser(user: Principal): Promise<void>;
    quotePost(postId: bigint, text: string, mediaHash: ExternalBlob | null, mediaType: string | null): Promise<PostResponse>;
    repostPost(postId: bigint): Promise<PostResponse>;
    searchPosts(searchText: string, cursor: bigint | null, limit: bigint): Promise<PaginatedPosts>;
    searchUsers(searchText: string, limit: bigint): Promise<Array<UserProfileResponse>>;
    setProfile(username: string, displayName: string, bio: string): Promise<void>;
    unblockUser(user: Principal): Promise<void>;
    undoRepost(postId: bigint): Promise<void>;
    unfollowArtist(artist: Principal): Promise<void>;
    unfollowUser(user: Principal): Promise<void>;
    unlikePost(postId: bigint): Promise<void>;
    unmuteUser(user: Principal): Promise<void>;
    updateArtistHeaderImage(headerImageHash: ExternalBlob | null): Promise<void>;
    updateArtistProfilePicture(pictureHash: ExternalBlob | null): Promise<void>;
    updateHeaderImage(headerImageHash: ExternalBlob | null): Promise<void>;
    updateProfilePicture(pictureHash: ExternalBlob | null): Promise<void>;
}
