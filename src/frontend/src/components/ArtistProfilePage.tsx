import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getRouteApi } from "@tanstack/react-router";
import { Camera, Loader2, Music } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useActiveProfile } from "../contexts/ActiveProfileContext";
import {
  useArtistFeed,
  useArtistPage,
  useArtistPageByUsername,
  useFollowArtist,
  useUnfollowArtist,
  useUpdateArtistHeaderImage,
  useUpdateArtistProfilePicture,
} from "../hooks/useArtistPageQueries";
import { useInfiniteScroll } from "../hooks/useInfiniteScroll";
import { useMediaUpload } from "../hooks/useMediaUpload";
import { getInitials } from "../utils/formatting";
import { BackButton } from "./BackButton";
import { EditArtistProfileDialog } from "./EditArtistProfileDialog";
import { FeedSkeleton } from "./FeedSkeleton";
import { PostCard } from "./PostCard";

const artistRouteApi = getRouteApi("/artist/$username");

export function ArtistProfilePage() {
  const { username } = artistRouteApi.useParams();
  const { data: myArtistPage } = useArtistPage();
  const { activeProfile } = useActiveProfile();
  const {
    data: artistPage,
    isLoading,
    isError,
  } = useArtistPageByUsername(username);

  const isOwner =
    !!myArtistPage &&
    myArtistPage.username.toLowerCase() === username.toLowerCase();

  const {
    data: feedData,
    isLoading: isFeedLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useArtistFeed(artistPage?.principal ?? null);

  const { mutate: followArtist, isPending: isFollowPending } =
    useFollowArtist();
  const { mutate: unfollowArtist, isPending: isUnfollowPending } =
    useUnfollowArtist();
  const { mutate: updateProfilePicture, isPending: isUploadingPicture } =
    useUpdateArtistProfilePicture();
  const { mutate: updateHeaderImage, isPending: isUploadingHeader } =
    useUpdateArtistHeaderImage();

  const {
    file: avatarFile,
    selectMedia: selectAvatarImage,
    removeMedia: removeAvatarImage,
    createBlob: createAvatarBlob,
    MediaInput: AvatarImageInput,
  } = useMediaUpload("image");

  const {
    file: headerFile,
    selectMedia: selectHeaderImage,
    removeMedia: removeHeaderImage,
    createBlob: createHeaderBlob,
    MediaInput: HeaderImageInput,
  } = useMediaUpload("image");

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [avatarUploadProgress, setAvatarUploadProgress] = useState<
    number | null
  >(null);
  const [headerUploadProgress, setHeaderUploadProgress] = useState<
    number | null
  >(null);

  const isUploadingAvatar = isUploadingPicture || avatarUploadProgress !== null;
  const isUploadingHeaderImage =
    isUploadingHeader || headerUploadProgress !== null;

  useEffect(() => {
    if (!avatarFile) return;
    let cancelled = false;
    async function upload() {
      try {
        setAvatarUploadProgress(0);
        const blob = await createAvatarBlob((pct) =>
          setAvatarUploadProgress(pct),
        );
        if (cancelled || !blob) return;
        updateProfilePicture(blob, {
          onSuccess: () => {
            toast.success("Profile picture updated");
            setAvatarUploadProgress(null);
            removeAvatarImage();
          },
          onError: (error) => {
            toast.error(error.message || "Failed to update profile picture");
            setAvatarUploadProgress(null);
            removeAvatarImage();
          },
        });
      } catch {
        if (!cancelled) {
          toast.error("Failed to upload image");
          setAvatarUploadProgress(null);
          removeAvatarImage();
        }
      }
    }
    upload();
    return () => {
      cancelled = true;
    };
  }, [avatarFile, createAvatarBlob, updateProfilePicture, removeAvatarImage]);

  useEffect(() => {
    if (!headerFile) return;
    let cancelled = false;
    async function upload() {
      try {
        setHeaderUploadProgress(0);
        const blob = await createHeaderBlob((pct) =>
          setHeaderUploadProgress(pct),
        );
        if (cancelled || !blob) return;
        updateHeaderImage(blob, {
          onSuccess: () => {
            toast.success("Banner updated");
            setHeaderUploadProgress(null);
            removeHeaderImage();
          },
          onError: (error) => {
            toast.error(error.message || "Failed to update banner");
            setHeaderUploadProgress(null);
            removeHeaderImage();
          },
        });
      } catch {
        if (!cancelled) {
          toast.error("Failed to upload banner");
          setHeaderUploadProgress(null);
          removeHeaderImage();
        }
      }
    }
    upload();
    return () => {
      cancelled = true;
    };
  }, [headerFile, createHeaderBlob, updateHeaderImage, removeHeaderImage]);

  const posts = feedData?.pages.flatMap((p) => p.posts) ?? [];

  const sentinelRef = useInfiniteScroll({
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  });

  if (isLoading) {
    return (
      <div data-ocid="artist-profile.loading_state">
        <div className="sticky top-0 z-10 flex h-12 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur">
          <BackButton />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-36 w-full" />
        <div className="px-4 pb-4">
          <Skeleton className="mt-3 h-16 w-16 rounded-full" />
          <Skeleton className="mt-3 h-5 w-40" />
          <Skeleton className="mt-2 h-4 w-24" />
        </div>
        <FeedSkeleton />
      </div>
    );
  }

  if (isError || !artistPage) {
    return (
      <div data-ocid="artist-profile.error_state">
        <div className="sticky top-0 z-10 flex h-12 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur">
          <BackButton />
          <span className="font-semibold">Artist Profile</span>
        </div>
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center px-4">
          <Music className="h-10 w-10 text-muted-foreground" />
          <p className="font-semibold">Artist page not found</p>
          <p className="text-sm text-muted-foreground">
            This user hasn't created an artist page yet.
          </p>
        </div>
      </div>
    );
  }

  const profilePictureUrl =
    artistPage.profilePictureHash?.getDirectURL() ?? null;
  const headerImageUrl = artistPage.headerImageHash?.getDirectURL() ?? null;
  // Used for aria-label fallback
  void getInitials(artistPage.bandName);

  return (
    <div data-ocid="artist-profile.page">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 flex h-12 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur">
        <BackButton />
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold leading-tight">
            {artistPage.bandName}
          </p>
          <p className="text-xs text-muted-foreground">
            {artistPage.postCount.toString()} posts
          </p>
        </div>
      </div>

      {/* Banner */}
      <div
        className="relative w-full bg-muted"
        style={{ paddingTop: "33.33%" }}
        onClick={isOwner ? selectHeaderImage : undefined}
        onKeyDown={
          isOwner
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") selectHeaderImage();
              }
            : undefined
        }
        role={isOwner ? "button" : undefined}
        tabIndex={isOwner ? 0 : undefined}
        aria-label={isOwner ? "Change banner image" : undefined}
        data-ocid={isOwner ? "artist-profile.upload_button" : undefined}
      >
        {headerImageUrl ? (
          <img
            src={headerImageUrl}
            alt="Band banner"
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5" />
        )}
        {isOwner && (
          <div
            className={`absolute inset-0 flex items-center justify-center transition-opacity ${
              isUploadingHeaderImage
                ? "opacity-100"
                : "opacity-0 hover:opacity-100"
            } bg-black/40 cursor-pointer`}
          >
            {isUploadingHeaderImage ? (
              <div className="flex flex-col items-center gap-1">
                <Loader2 className="h-6 w-6 animate-spin text-white" />
                {headerUploadProgress !== null && (
                  <span className="text-xs text-white">
                    {Math.round(headerUploadProgress)}%
                  </span>
                )}
              </div>
            ) : (
              <Camera className="h-6 w-6 text-white" />
            )}
          </div>
        )}
        <HeaderImageInput />
      </div>

      {/* Profile info */}
      <div className="px-4 pb-3">
        <div className="flex items-end justify-between">
          {/* Avatar */}
          <div
            className="relative -mt-8 h-16 w-16"
            onClick={isOwner ? selectAvatarImage : undefined}
            onKeyDown={
              isOwner
                ? (e) => {
                    if (e.key === "Enter" || e.key === " ") selectAvatarImage();
                  }
                : undefined
            }
            role={isOwner ? "button" : undefined}
            tabIndex={isOwner ? 0 : undefined}
            aria-label={isOwner ? "Change profile picture" : undefined}
          >
            <Avatar
              className={`h-16 w-16 ring-4 ring-background ${isOwner ? "cursor-pointer" : ""}`}
            >
              {profilePictureUrl && (
                <AvatarImage
                  src={profilePictureUrl}
                  alt={artistPage.bandName}
                  className="object-cover"
                />
              )}
              <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
                <Music className="h-6 w-6" />
              </AvatarFallback>
            </Avatar>
            {isOwner && (
              <div
                className={`absolute inset-0 flex items-center justify-center rounded-full transition-opacity ${
                  isUploadingAvatar
                    ? "opacity-100"
                    : "opacity-0 hover:opacity-100"
                } bg-black/50 cursor-pointer`}
              >
                {isUploadingAvatar ? (
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                ) : (
                  <Camera className="h-4 w-4 text-white" />
                )}
              </div>
            )}
            <AvatarImageInput />
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 pt-3">
            {isOwner && activeProfile === "artist" ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditOpen(true)}
                data-ocid="artist-profile.edit_button"
              >
                Edit Profile
              </Button>
            ) : !isOwner && artistPage.isFollowedByCurrentUser ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => unfollowArtist(artistPage.principal)}
                disabled={isUnfollowPending}
                data-ocid="artist-profile.secondary_button"
              >
                {isUnfollowPending && (
                  <Loader2 className="h-3 w-3 animate-spin" />
                )}
                Following
              </Button>
            ) : !isOwner ? (
              <Button
                size="sm"
                onClick={() => followArtist(artistPage.principal)}
                disabled={isFollowPending}
                data-ocid="artist-profile.primary_button"
              >
                {isFollowPending && (
                  <Loader2 className="h-3 w-3 animate-spin" />
                )}
                Follow
              </Button>
            ) : null}
          </div>
        </div>

        {/* Band name + genre */}
        <div className="mt-3">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold leading-tight">
              {artistPage.bandName}
            </h1>
            <Badge variant="secondary" className="text-xs">
              {artistPage.genre}
            </Badge>
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">@{username}</p>
        </div>

        {artistPage.bio && (
          <p className="mt-3 whitespace-pre-wrap text-sm">{artistPage.bio}</p>
        )}

        {/* Follower/following counts */}
        <div className="mt-3 flex gap-4 text-sm">
          <span>
            <span className="font-semibold">
              {artistPage.followingCount.toString()}
            </span>
            <span className="ml-1 text-muted-foreground">Following</span>
          </span>
          <span>
            <span className="font-semibold">
              {artistPage.followerCount.toString()}
            </span>
            <span className="ml-1 text-muted-foreground">Followers</span>
          </span>
        </div>

        {/* Music links */}
        {artistPage.musicLinks.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {artistPage.musicLinks.map((link, i) => {
              let label = link;
              try {
                const url = new URL(link);
                label = url.hostname.replace(/^www\./, "");
              } catch {
                // keep original
              }
              return (
                <a
                  // biome-ignore lint/suspicious/noArrayIndexKey: stable index
                  key={i}
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                  data-ocid={`artist-profile.link.${i + 1}`}
                >
                  {label}
                </a>
              );
            })}
          </div>
        )}
      </div>

      <div className="border-t" />

      {/* Posts feed */}
      {isFeedLoading ? (
        <FeedSkeleton />
      ) : posts.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-16 gap-3 text-center px-4"
          data-ocid="artist-profile.empty_state"
        >
          <Music className="h-8 w-8 text-muted-foreground" />
          <p className="font-semibold">No posts yet</p>
          <p className="text-sm text-muted-foreground">
            {isOwner
              ? "Switch to your artist profile and post something!"
              : "This artist hasn't posted yet."}
          </p>
        </div>
      ) : (
        <div>
          {posts.map((post, idx) => (
            <PostCard
              key={post.id.toString()}
              post={post}
              data-ocid={`artist-profile.item.${idx + 1}`}
            />
          ))}
          <div ref={sentinelRef} className="h-4" />
          {isFetchingNextPage && (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
      )}
      {isOwner && artistPage && (
        <EditArtistProfileDialog
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
          artistPage={artistPage}
        />
      )}
    </div>
  );
}
