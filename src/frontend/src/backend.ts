/* eslint-disable */

// @ts-nocheck

// Extended to include all social backend methods.

import { Actor, HttpAgent, type HttpAgentOptions, type ActorConfig, type Agent, type ActorSubclass } from "@icp-sdk/core/agent";
import type { Principal } from "@icp-sdk/core/principal";
import { idlFactory, type _SERVICE } from "./declarations/backend.did";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
function some<T>(value: T): Some<T> {
    return {
        __kind__: "Some",
        value: value
    };
}
function none(): None {
    return {
        __kind__: "None"
    };
}
function isNone<T>(option: Option<T>): option is None {
    return option.__kind__ === "None";
}
function isSome<T>(option: Option<T>): option is Some<T> {
    return option.__kind__ === "Some";
}
function unwrap<T>(option: Option<T>): T {
    if (isNone(option)) {
        throw new Error("unwrap: none");
    }
    return option.value;
}
function candid_some<T>(value: T): [T] {
    return [
        value
    ];
}
function candid_none<T>(): [] {
    return [];
}
function record_opt_to_undefined<T>(arg: T | null): T | undefined {
    return arg == null ? undefined : arg;
}
export class ExternalBlob {
    _blob?: Uint8Array<ArrayBuffer> | null;
    directURL: string;
    onProgress?: (percentage: number) => void = undefined;
    private constructor(directURL: string, blob: Uint8Array<ArrayBuffer> | null){
        if (blob) {
            this._blob = blob;
        }
        this.directURL = directURL;
    }
    static fromURL(url: string): ExternalBlob {
        return new ExternalBlob(url, null);
    }
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob {
        const url = URL.createObjectURL(new Blob([
            new Uint8Array(blob)
        ], {
            type: 'application/octet-stream'
        }));
        return new ExternalBlob(url, blob);
    }
    public async getBytes(): Promise<Uint8Array<ArrayBuffer>> {
        if (this._blob) {
            return this._blob;
        }
        const response = await fetch(this.directURL);
        const blob = await response.blob();
        this._blob = new Uint8Array(await blob.arrayBuffer());
        return this._blob;
    }
    public getDirectURL(): string {
        return this.directURL;
    }
    public withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob {
        this.onProgress = onProgress;
        return this;
    }
}
export type Time = bigint;
export interface ArtistPageResponse {
    bio: string;
    postCount: bigint;
    principal: Principal;
    username: string;
    createdAt: Time;
    tier: string;
    bandName: string;
    website?: string;
    updatedAt: Time;
    genre: string;
    musicLinks: Array<string>;
    followerCount: bigint;
    headerImageHash?: ExternalBlob;
    followingCount: bigint;
    isFollowedByCurrentUser: boolean;
    profilePictureHash?: ExternalBlob;
    location?: string;
}
export interface _CaffeineStorageRefillInformation {
    proposed_top_up_amount?: bigint;
}
export interface _CaffeineStorageCreateCertificateResult {
    method: string;
    blob_hash: string;
}
export interface UserProfile {
    bio: string;
    username: string;
    displayName: string;
    createdAt: Time;
    website?: string;
    updatedAt: Time;
    headerImageHash?: ExternalBlob;
    profilePictureHash?: ExternalBlob;
    location?: string;
}
export interface _CaffeineStorageRefillResult {
    success?: boolean;
    topped_up_amount?: bigint;
}
export interface backendInterface {
    _caffeineStorageBlobIsLive(hash: Uint8Array): Promise<boolean>;
    _caffeineStorageBlobsToDelete(): Promise<Array<Uint8Array>>;
    _caffeineStorageConfirmBlobDeletion(blobs: Array<Uint8Array>): Promise<void>;
    _caffeineStorageCreateCertificate(blobHash: string): Promise<_CaffeineStorageCreateCertificateResult>;
    _caffeineStorageRefillCashier(refillInformation: _CaffeineStorageRefillInformation | null): Promise<_CaffeineStorageRefillResult>;
    _caffeineStorageUpdateGatewayPrincipals(): Promise<void>;
    checkUsernameAvailability(username: string): Promise<boolean>;
    createOrUpdateArtistPage(username: string, bandName: string, genre: string, bio: string, musicLinks: Array<string>, tier: string | null, location: string | null, website: string | null): Promise<void>;
    getArtistPage(): Promise<ArtistPageResponse | null>;
    getArtistPageByPrincipal(principal: Principal): Promise<ArtistPageResponse | null>;
    getArtistPageByUsername(username: string): Promise<ArtistPageResponse | null>;
    getPrincipalByUsername(username: string): Promise<Principal | null>;
    getProfile(): Promise<UserProfile | null>;
    setProfile(username: string, displayName: string, bio: string, location: string | null, website: string | null): Promise<void>;
    updateArtistHeaderImage(headerImageHash: ExternalBlob | null): Promise<void>;
    updateArtistProfilePicture(pictureHash: ExternalBlob | null): Promise<void>;
    updateHeaderImage(headerImageHash: ExternalBlob | null): Promise<void>;
    updateProfilePicture(pictureHash: ExternalBlob | null): Promise<void>;
}
import type { ArtistPageResponse as _ArtistPageResponse, ExternalBlob as _ExternalBlob, Time as _Time, UserProfile as _UserProfile, _CaffeineStorageRefillInformation as __CaffeineStorageRefillInformation, _CaffeineStorageRefillResult as __CaffeineStorageRefillResult } from "./declarations/backend.did.d.ts";

// ── Type conversion helpers ───────────────────────────────────────────────────

/**
 * Safely download an optional blob. Returns undefined instead of throwing if
 * the hash is stale, unreachable, or otherwise invalid. This prevents a single
 * bad image from crashing an entire feed or profile page load.
 */
async function downloadOptBlob(downloadFile, optBlob) {
    if (!optBlob || optBlob.length === 0) return undefined;
    try {
        return await downloadFile(optBlob[0]);
    } catch {
        return undefined;
    }
}

function optText(opt) {
    if (!opt || opt.length === 0) return undefined;
    return opt[0];
}

function optBigint(opt) {
    if (!opt || opt.length === 0) return undefined;
    return opt[0];
}

async function convertPostResponse(downloadFile, p) {
    return {
        id: p.id,
        author: p.author,
        authorIdentity: p.authorIdentity,
        authorUsername: p.authorUsername,
        authorDisplayName: p.authorDisplayName,
        authorProfilePictureHash: await downloadOptBlob(downloadFile, p.authorProfilePictureHash),
        text: p.text,
        mediaHash: await downloadOptBlob(downloadFile, p.mediaHash),
        mediaType: optText(p.mediaType),
        postType: p.postType,
        createdAt: p.createdAt,
        editedAt: optBigint(p.editedAt),
        likeCount: p.likeCount,
        replyCount: p.replyCount,
        repostCount: p.repostCount,
        isLikedByCurrentUser: p.isLikedByCurrentUser,
        isRepostedByCurrentUser: p.isRepostedByCurrentUser,
    };
}

async function convertPaginatedPosts(downloadFile, result) {
    const posts = await Promise.all(result.posts.map(p => convertPostResponse(downloadFile, p)));
    return {
        posts,
        nextCursor: optBigint(result.nextCursor),
        hasMore: result.hasMore,
    };
}

async function convertUserProfileResponse(downloadFile, r) {
    return {
        principal: r.principal,
        username: r.username,
        displayName: r.displayName,
        bio: r.bio,
        profilePictureHash: await downloadOptBlob(downloadFile, r.profilePictureHash),
        headerImageHash: await downloadOptBlob(downloadFile, r.headerImageHash),
        location: optText(r.location),
        website: optText(r.website),
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        followersCount: r.followersCount,
        followingCount: r.followingCount,
        postsCount: r.postsCount,
        isFollowedByCurrentUser: r.isFollowedByCurrentUser,
        isBlockedByCurrentUser: r.isBlockedByCurrentUser,
        isMutedByCurrentUser: r.isMutedByCurrentUser,
    };
}

async function convertFollowUserResponse(downloadFile, r) {
    return {
        principal: r.principal,
        username: r.username,
        displayName: r.displayName,
        profilePictureHash: await downloadOptBlob(downloadFile, r.profilePictureHash),
    };
}

async function convertPaginatedFollows(downloadFile, result) {
    const users = await Promise.all(result.users.map(u => convertFollowUserResponse(downloadFile, u)));
    return {
        users,
        nextOffset: optBigint(result.nextOffset),
        hasMore: result.hasMore,
    };
}

function convertNotification(n) {
    return {
        id: n.id,
        notificationType: n.notificationType,
        actorPrincipal: n.actorPrincipal,
        actorUsername: n.actorUsername,
        createdAt: n.createdAt,
        isRead: n.isRead,
    };
}

function convertPaginatedNotifications(result) {
    return {
        notifications: result.notifications.map(convertNotification),
        nextCursor: optBigint(result.nextCursor),
        hasMore: result.hasMore,
    };
}

// ── Backend class ─────────────────────────────────────────────────────────────

export class Backend implements backendInterface {
    constructor(private actor: ActorSubclass<_SERVICE>, private _uploadFile: (file: ExternalBlob) => Promise<Uint8Array>, private _downloadFile: (file: Uint8Array) => Promise<ExternalBlob>, private processError?: (error: unknown) => never){}

    private async _safeDownloadFile(bytes: Uint8Array): Promise<import('./backend').ExternalBlob | undefined> {
        try {
            return await this._downloadFile(bytes);
        } catch {
            return undefined;
        }
    }

    private async _call(fn) {
        if (this.processError) {
            try {
                return await fn();
            } catch (e) {
                this.processError(e);
                throw new Error("unreachable");
            }
        }
        return await fn();
    }

    async _caffeineStorageBlobIsLive(arg0: Uint8Array): Promise<boolean> {
        return this._call(() => this.actor._caffeineStorageBlobIsLive(arg0));
    }
    async _caffeineStorageBlobsToDelete(): Promise<Array<Uint8Array>> {
        return this._call(() => this.actor._caffeineStorageBlobsToDelete());
    }
    async _caffeineStorageConfirmBlobDeletion(arg0: Array<Uint8Array>): Promise<void> {
        return this._call(() => this.actor._caffeineStorageConfirmBlobDeletion(arg0));
    }
    async _caffeineStorageCreateCertificate(arg0: string): Promise<_CaffeineStorageCreateCertificateResult> {
        return this._call(() => this.actor._caffeineStorageCreateCertificate(arg0));
    }
    async _caffeineStorageRefillCashier(arg0: _CaffeineStorageRefillInformation | null): Promise<_CaffeineStorageRefillResult> {
        return this._call(async () => {
            const candid = arg0 === null ? [] : [{ proposed_top_up_amount: arg0.proposed_top_up_amount ? [arg0.proposed_top_up_amount] : [] }];
            const result = await this.actor._caffeineStorageRefillCashier(candid);
            return {
                success: result.success.length > 0 ? result.success[0] : undefined,
                topped_up_amount: result.topped_up_amount.length > 0 ? result.topped_up_amount[0] : undefined,
            };
        });
    }
    async _caffeineStorageUpdateGatewayPrincipals(): Promise<void> {
        return this._call(() => this.actor._caffeineStorageUpdateGatewayPrincipals());
    }
    async checkUsernameAvailability(arg0: string): Promise<boolean> {
        return this._call(() => this.actor.checkUsernameAvailability(arg0));
    }
    async createOrUpdateArtistPage(arg0: string, arg1: string, arg2: string, arg3: string, arg4: Array<string>, arg5: string | null, arg6: string | null, arg7: string | null): Promise<void> {
        return this._call(() => this.actor.createOrUpdateArtistPage(
            arg0, arg1, arg2, arg3, arg4,
            arg5 === null ? [] : [arg5],
            arg6 === null ? [] : [arg6],
            arg7 === null ? [] : [arg7],
        ));
    }
    async getArtistPage(): Promise<ArtistPageResponse | null> {
        return this._call(async () => {
            const result = await this.actor.getArtistPage();
            if (result.length === 0) return null;
            return this._convertArtistPageResponse(result[0]);
        });
    }
    async getArtistPageByPrincipal(arg0: Principal): Promise<ArtistPageResponse | null> {
        return this._call(async () => {
            const result = await this.actor.getArtistPageByPrincipal(arg0);
            if (result.length === 0) return null;
            return this._convertArtistPageResponse(result[0]);
        });
    }
    async getArtistPageByUsername(arg0: string): Promise<ArtistPageResponse | null> {
        return this._call(async () => {
            const result = await this.actor.getArtistPageByUsername(arg0);
            if (result.length === 0) return null;
            return this._convertArtistPageResponse(result[0]);
        });
    }
    async getPrincipalByUsername(arg0: string): Promise<Principal | null> {
        return this._call(async () => {
            const result = await this.actor.getPrincipalByUsername(arg0);
            return result.length === 0 ? null : result[0];
        });
    }
    async getProfile(): Promise<UserProfile | null> {
        return this._call(async () => {
            const result = await this.actor.getProfile();
            if (result.length === 0) return null;
            const r = result[0];
            return {
                bio: r.bio,
                username: r.username,
                displayName: r.displayName,
                createdAt: r.createdAt,
                website: (r.website && r.website.length > 0) ? r.website[0] : undefined,
                updatedAt: r.updatedAt,
                headerImageHash: (r.headerImageHash && r.headerImageHash.length > 0) ? await this._safeDownloadFile(r.headerImageHash[0]) : undefined,
                profilePictureHash: (r.profilePictureHash && r.profilePictureHash.length > 0) ? await this._safeDownloadFile(r.profilePictureHash[0]) : undefined,
                location: (r.location && r.location.length > 0) ? r.location[0] : undefined,
            };
        });
    }
    async setProfile(arg0: string, arg1: string, arg2: string, arg3: string | null, arg4: string | null): Promise<void> {
        return this._call(() => this.actor.setProfile(
            arg0, arg1, arg2,
            arg3 === null ? [] : [arg3],
            arg4 === null ? [] : [arg4],
        ));
    }
    async updateArtistHeaderImage(arg0: ExternalBlob | null): Promise<void> {
        return this._call(async () => {
            const candid = arg0 === null ? [] : [await this._uploadFile(arg0)];
            return this.actor.updateArtistHeaderImage(candid);
        });
    }
    async updateArtistProfilePicture(arg0: ExternalBlob | null): Promise<void> {
        return this._call(async () => {
            const candid = arg0 === null ? [] : [await this._uploadFile(arg0)];
            return this.actor.updateArtistProfilePicture(candid);
        });
    }
    async updateHeaderImage(arg0: ExternalBlob | null): Promise<void> {
        return this._call(async () => {
            const candid = arg0 === null ? [] : [await this._uploadFile(arg0)];
            return this.actor.updateHeaderImage(candid);
        });
    }
    async updateProfilePicture(arg0: ExternalBlob | null): Promise<void> {
        return this._call(async () => {
            const candid = arg0 === null ? [] : [await this._uploadFile(arg0)];
            return this.actor.updateProfilePicture(candid);
        });
    }

    // ── Social methods ────────────────────────────────────────────────────────

    async createPost(text, mediaHash, mediaType, isArtistPost) {
        return this._call(async () => {
            const mediaCandid = mediaHash === null ? [] : [await this._uploadFile(mediaHash)];
            const mediaTypeCandid = mediaType === null ? [] : [mediaType];
            const postType = { original: null };
            const authorIdentity = isArtistPost ? { artist: null } : { fan: null };
            return this.actor.createPost(text, mediaCandid, mediaTypeCandid, postType, authorIdentity);
        });
    }

    async editPost(postId, text) {
        return this._call(() => this.actor.editPost(postId, text));
    }

    async deletePost(postId) {
        return this._call(() => this.actor.deletePost(postId));
    }

    async getPost(postId) {
        return this._call(async () => {
            const result = await this.actor.getPost(postId);
            if (result.length === 0) return null;
            return convertPostResponse(this._downloadFile.bind(this), result[0]);
        });
    }

    // Home feed for fans (getFeed uses caller to filter by follows)
    async getHomeFeed(cursor, limit) {
        return this._call(async () => {
            const cursorCandid = cursor === null ? [] : [cursor];
            const result = await this.actor.getFeed(cursorCandid, limit);
            return convertPaginatedPosts(this._downloadFile.bind(this), result);
        });
    }

    // Global/explore feed
    async getGlobalFeed(cursor, limit) {
        return this._call(async () => {
            const cursorCandid = cursor === null ? [] : [cursor];
            const result = await this.actor.getExplorePosts(cursorCandid, limit);
            return convertPaginatedPosts(this._downloadFile.bind(this), result);
        });
    }

    // Artist home feed (getArtistFeed uses caller's followed artists)
    async getArtistHomeFeed(cursor, limit) {
        return this._call(async () => {
            const cursorCandid = cursor === null ? [] : [cursor];
            const result = await this.actor.getArtistFeed(cursorCandid, limit);
            return convertPaginatedPosts(this._downloadFile.bind(this), result);
        });
    }

    // Artist profile posts (shows a specific artist's posts)
    async getArtistFeed(principal, cursor, limit) {
        return this._call(async () => {
            const cursorCandid = cursor === null ? [] : [cursor];
            const result = await this.actor.getArtistPosts(principal, cursorCandid, limit);
            return convertPaginatedPosts(this._downloadFile.bind(this), result);
        });
    }

    async getPostsByPrincipal(user, cursor, limit) {
        return this._call(async () => {
            const cursorCandid = cursor === null ? [] : [cursor];
            const result = await this.actor.getUserPosts(user, cursorCandid, limit);
            return convertPaginatedPosts(this._downloadFile.bind(this), result);
        });
    }

    async getPostsByUsername(username, cursor, limit) {
        return this._call(async () => {
            const principalResult = await this.actor.getPrincipalByUsername(username);
            if (principalResult.length === 0) return { posts: [], nextCursor: undefined, hasMore: false };
            const cursorCandid = cursor === null ? [] : [cursor];
            const result = await this.actor.getUserPosts(principalResult[0], cursorCandid, limit);
            return convertPaginatedPosts(this._downloadFile.bind(this), result);
        });
    }

    async getReplies(postId, cursor, limit) {
        return this._call(async () => {
            const cursorCandid = cursor === null ? [] : [cursor];
            const result = await this.actor.getPostReplies(postId, cursorCandid, limit);
            return convertPaginatedPosts(this._downloadFile.bind(this), result);
        });
    }

    async getUserProfile(principal) {
        return this._call(async () => {
            const result = await this.actor.getProfileByPrincipal(principal);
            if (result.length === 0) return null;
            return convertUserProfileResponse(this._downloadFile.bind(this), result[0]);
        });
    }

    async getProfileByUsername(username) {
        return this._call(async () => {
            const result = await this.actor.getProfileByUsername(username);
            if (result.length === 0) return null;
            return convertUserProfileResponse(this._downloadFile.bind(this), result[0]);
        });
    }

    async getFollowers(username, offset, limit) {
        return this._call(async () => {
            const principalResult = await this.actor.getPrincipalByUsername(username);
            if (principalResult.length === 0) return { users: [], nextOffset: undefined, hasMore: false };
            const result = await this.actor.getFollowers(principalResult[0], offset, limit);
            return convertPaginatedFollows(this._downloadFile.bind(this), result);
        });
    }

    async getFollowing(username, offset, limit) {
        return this._call(async () => {
            const principalResult = await this.actor.getPrincipalByUsername(username);
            if (principalResult.length === 0) return { users: [], nextOffset: undefined, hasMore: false };
            const result = await this.actor.getFollowing(principalResult[0], offset, limit);
            return convertPaginatedFollows(this._downloadFile.bind(this), result);
        });
    }

    async getArtistFollowers(principal, offset, limit) {
        return this._call(async () => {
            const result = await this.actor.getArtistFollowers(principal, offset, limit);
            return convertPaginatedFollows(this._downloadFile.bind(this), result);
        });
    }

    async getArtistFollowing(principal, offset, limit) {
        return this._call(async () => {
            const result = await this.actor.getArtistFollowing(principal, offset, limit);
            return convertPaginatedFollows(this._downloadFile.bind(this), result);
        });
    }

    async followUser(user) {
        return this._call(() => this.actor.followUser(user));
    }

    async unfollowUser(user) {
        return this._call(() => this.actor.unfollowUser(user));
    }

    async followArtist(principal) {
        return this._call(() => this.actor.followArtist(principal));
    }

    async unfollowArtist(principal) {
        return this._call(() => this.actor.unfollowArtist(principal));
    }

    async blockUser(user) {
        return this._call(() => this.actor.blockUser(user));
    }

    async unblockUser(user) {
        return this._call(() => this.actor.unblockUser(user));
    }

    async muteUser(user) {
        return this._call(() => this.actor.muteUser(user));
    }

    async unmuteUser(user) {
        return this._call(() => this.actor.unmuteUser(user));
    }

    async likePost(postId) {
        return this._call(() => this.actor.likePost(postId));
    }

    async unlikePost(postId) {
        return this._call(() => this.actor.unlikePost(postId));
    }

    async repostPost(postId) {
        return this._call(async () => {
            // The backend requires text.size() > 0 for all post types.
            // Reposts store a single space as placeholder text; the UI
            // renders a repost by showing the original post, not this text.
            return this.actor.createPost(" ", [], [], { repost: postId }, { fan: null });
        });
    }

    async undoRepost(_postId) {
        // No direct undo-repost in backend; no-op to avoid crashes
        return Promise.resolve();
    }

    async quotePost(postId, text, mediaHash, mediaType) {
        return this._call(async () => {
            const mediaCandid = mediaHash === null ? [] : [await this._uploadFile(mediaHash)];
            const mediaTypeCandid = mediaType === null ? [] : [mediaType];
            return this.actor.createPost(text, mediaCandid, mediaTypeCandid, { quote: postId }, { fan: null });
        });
    }

    async createReply(parentPostId, text, mediaHash, mediaType) {
        return this._call(async () => {
            const mediaCandid = mediaHash === null ? [] : [await this._uploadFile(mediaHash)];
            const mediaTypeCandid = mediaType === null ? [] : [mediaType];
            return this.actor.createPost(text, mediaCandid, mediaTypeCandid, { reply: parentPostId }, { fan: null });
        });
    }

    async getNotifications(cursor, limit) {
        return this._call(async () => {
            const cursorCandid = cursor === null ? [] : [cursor];
            const result = await this.actor.getNotifications(cursorCandid, limit);
            return convertPaginatedNotifications(result);
        });
    }

    async getUnreadNotificationCount() {
        return this._call(() => this.actor.getUnreadNotificationCount());
    }

    async markNotificationRead(notifId) {
        return this._call(() => this.actor.markNotificationRead(notifId));
    }

    async markAllNotificationsRead() {
        return this._call(() => this.actor.markAllNotificationsRead());
    }

    async searchPosts(query, cursor, limit) {
        return this._call(async () => {
            const cursorCandid = cursor === null ? [] : [cursor];
            const result = await this.actor.searchPosts(query, cursorCandid, limit);
            return convertPaginatedPosts(this._downloadFile.bind(this), result);
        });
    }

    async searchUsers(query, _limit) {
        return this._call(async () => {
            const results = await this.actor.searchUsers(query);
            return Promise.all(results.map(r => convertUserProfileResponse(this._downloadFile.bind(this), r)));
        });
    }

    async searchArtists(query) {
        return this._call(async () => {
            const results = await this.actor.searchArtists(query);
            return Promise.all(results.map(r => this._convertArtistPageResponse(r)));
        });
    }

    async getPostsByHashtag(tag, cursor, limit) {
        return this._call(async () => {
            const cursorCandid = cursor === null ? [] : [cursor];
            const result = await this.actor.getPostsByHashtag(tag, cursorCandid, limit);
            return convertPaginatedPosts(this._downloadFile.bind(this), result);
        });
    }

    async getTrendingHashtags(limit) {
        return this._call(async () => {
            const results = await this.actor.getTrendingHashtags(limit);
            // Convert [TrendingHashtag] to Array<[string, bigint]> for frontend compatibility
            return results.map(t => [t.tag, t.count]);
        });
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private async _convertArtistPageResponse(r) {
        return {
            bio: r.bio,
            postCount: r.postCount,
            principal: r.principal,
            username: r.username,
            createdAt: r.createdAt,
            tier: r.tier,
            bandName: r.bandName,
            website: (r.website && r.website.length > 0) ? r.website[0] : undefined,
            updatedAt: r.updatedAt,
            genre: r.genre,
            musicLinks: r.musicLinks,
            followerCount: r.followerCount,
            headerImageHash: (r.headerImageHash && r.headerImageHash.length > 0) ? await this._safeDownloadFile(r.headerImageHash[0]) : undefined,
            followingCount: r.followingCount,
            isFollowedByCurrentUser: r.isFollowedByCurrentUser,
            profilePictureHash: (r.profilePictureHash && r.profilePictureHash.length > 0) ? await this._safeDownloadFile(r.profilePictureHash[0]) : undefined,
            location: (r.location && r.location.length > 0) ? r.location[0] : undefined,
        };
    }
}

export interface CreateActorOptions {
    agent?: Agent;
    agentOptions?: HttpAgentOptions;
    actorOptions?: ActorConfig;
    processError?: (error: unknown) => never;
}
export function createActor(canisterId: string, _uploadFile: (file: ExternalBlob) => Promise<Uint8Array>, _downloadFile: (file: Uint8Array) => Promise<ExternalBlob>, options: CreateActorOptions = {}): Backend {
    const agent = options.agent || HttpAgent.createSync({
        ...options.agentOptions
    });
    if (options.agent && options.agentOptions) {
        console.warn("Detected both agent and agentOptions passed to createActor. Ignoring agentOptions and proceeding with the provided agent.");
    }
    const actor = Actor.createActor<_SERVICE>(idlFactory, {
        agent,
        canisterId: canisterId,
        ...options.actorOptions
    });
    return new Backend(actor, _uploadFile, _downloadFile, options.processError);
}
