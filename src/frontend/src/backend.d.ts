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
export interface backendInterface {
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
