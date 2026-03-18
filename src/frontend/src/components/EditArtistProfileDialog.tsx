import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Camera, Loader2, Music, Plus, X } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { ArtistPageResponse } from "../backend";
import {
  useCreateOrUpdateArtistPage,
  useUpdateArtistHeaderImage,
  useUpdateArtistProfilePicture,
} from "../hooks/useArtistPageQueries";
import { useMediaUpload } from "../hooks/useMediaUpload";

interface EditArtistProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  artistPage: ArtistPageResponse;
}

export function EditArtistProfileDialog({
  open,
  onOpenChange,
  artistPage,
}: EditArtistProfileDialogProps) {
  const [bandName, setBandName] = useState("");
  const [bio, setBio] = useState("");
  const [genre, setGenre] = useState("");
  const [musicLinks, setMusicLinks] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const { mutateAsync: createOrUpdateArtistPage } =
    useCreateOrUpdateArtistPage();
  const { mutateAsync: updateProfilePicture } = useUpdateArtistProfilePicture();
  const { mutateAsync: updateHeaderImage } = useUpdateArtistHeaderImage();

  const {
    file: avatarFile,
    previewUrl: avatarPreviewUrl,
    selectMedia: selectAvatarImage,
    removeMedia: removeAvatarImage,
    createBlob: createAvatarBlob,
    MediaInput: AvatarImageInput,
  } = useMediaUpload("image");

  const {
    file: headerFile,
    previewUrl: headerPreviewUrl,
    selectMedia: selectHeaderImage,
    removeMedia: removeHeaderImage,
    createBlob: createHeaderBlob,
    MediaInput: HeaderImageInput,
  } = useMediaUpload("image");

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally omit remove callbacks
  useEffect(() => {
    if (open) {
      setBandName(artistPage.bandName);
      setBio(artistPage.bio);
      setGenre(artistPage.genre);
      setMusicLinks(
        artistPage.musicLinks.length > 0 ? [...artistPage.musicLinks] : [""],
      );
      setError("");
      removeAvatarImage();
      removeHeaderImage();
    }
  }, [
    open,
    artistPage.bandName,
    artistPage.bio,
    artistPage.genre,
    artistPage.musicLinks,
  ]);

  const currentAvatarUrl =
    artistPage.profilePictureHash?.getDirectURL() ?? null;
  const currentHeaderUrl = artistPage.headerImageHash?.getDirectURL() ?? null;
  const previewAvatarUrl = avatarPreviewUrl ?? currentAvatarUrl;
  const previewHeaderUrl = headerPreviewUrl ?? currentHeaderUrl;

  const canSubmit =
    bandName.trim().length > 0 &&
    genre.trim().length > 0 &&
    bio.length <= 500 &&
    !isSaving;

  const handleAddMusicLink = () => {
    if (musicLinks.length < 5) {
      setMusicLinks([...musicLinks, ""]);
    }
  };

  const handleRemoveMusicLink = (idx: number) => {
    setMusicLinks(musicLinks.filter((_, i) => i !== idx));
  };

  const handleMusicLinkChange = (idx: number, value: string) => {
    const updated = [...musicLinks];
    updated[idx] = value;
    setMusicLinks(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setError("");
    setIsSaving(true);

    try {
      if (avatarFile) {
        const blob = await createAvatarBlob();
        if (blob) {
          await updateProfilePicture(blob);
        }
      }

      if (headerFile) {
        const blob = await createHeaderBlob();
        if (blob) {
          await updateHeaderImage(blob);
        }
      }

      const filteredLinks = musicLinks.filter((l) => l.trim().length > 0);
      await createOrUpdateArtistPage({
        username: artistPage.username,
        bandName: bandName.trim(),
        genre: genre.trim(),
        bio: bio.trim(),
        musicLinks: filteredLinks,
      });

      toast.success("Artist profile updated");
      onOpenChange(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update artist profile",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenChange = (value: boolean) => {
    if (isSaving) return;
    onOpenChange(value);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit artist profile</DialogTitle>
          <DialogDescription>
            Update your band info, bio, and images.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Header image */}
          <div>
            <Label>Banner image</Label>
            <div className="relative mt-1 overflow-hidden rounded-lg">
              <AspectRatio ratio={3 / 1}>
                {previewHeaderUrl ? (
                  <img
                    src={previewHeaderUrl}
                    alt="Banner preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-primary/20 to-primary/5" />
                )}
              </AspectRatio>
              <button
                type="button"
                className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity hover:opacity-100"
                onClick={selectHeaderImage}
                disabled={isSaving}
              >
                <Camera className="h-5 w-5 text-white" />
              </button>
              <HeaderImageInput />
            </div>
            {headerPreviewUrl && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-1"
                onClick={removeHeaderImage}
                disabled={isSaving}
              >
                <X className="h-4 w-4" />
                Remove new image
              </Button>
            )}
          </div>

          {/* Profile picture */}
          <div>
            <Label>Profile picture</Label>
            <div className="mt-1 flex items-center gap-3">
              <div className="relative">
                <Avatar className="h-16 w-16">
                  {previewAvatarUrl ? (
                    <AvatarImage
                      src={previewAvatarUrl}
                      alt="Profile preview"
                      className="object-cover"
                    />
                  ) : null}
                  <AvatarFallback className="bg-primary/10 text-primary text-lg">
                    <Music className="h-6 w-6" />
                  </AvatarFallback>
                </Avatar>
                <button
                  type="button"
                  className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity hover:opacity-100"
                  onClick={selectAvatarImage}
                  disabled={isSaving}
                >
                  <Camera className="h-4 w-4 text-white" />
                </button>
                <AvatarImageInput />
              </div>
              {avatarPreviewUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={removeAvatarImage}
                  disabled={isSaving}
                >
                  <X className="h-4 w-4" />
                  Remove new
                </Button>
              )}
            </div>
          </div>

          {/* Username (read-only) */}
          <div className="space-y-2">
            <Label>Username</Label>
            <Input
              value={`@${artistPage.username}`}
              disabled
              className="text-muted-foreground"
            />
            <p className="text-xs text-muted-foreground">
              Username cannot be changed.
            </p>
          </div>

          {/* Band name */}
          <div className="space-y-2">
            <Label htmlFor="editBandName">Band name *</Label>
            <Input
              id="editBandName"
              value={bandName}
              onChange={(e) => setBandName(e.target.value)}
              placeholder="Your band name"
              maxLength={100}
              disabled={isSaving}
              data-ocid="artist-edit.input"
            />
          </div>

          {/* Genre */}
          <div className="space-y-2">
            <Label htmlFor="editGenre">Genre *</Label>
            <Input
              id="editGenre"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              placeholder="e.g. Rock, Jazz, Electronic"
              maxLength={50}
              disabled={isSaving}
            />
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="editArtistBio">Bio</Label>
            <Textarea
              id="editArtistBio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell fans about your band..."
              maxLength={500}
              rows={4}
              disabled={isSaving}
              data-ocid="artist-edit.textarea"
            />
            <p className="text-xs text-muted-foreground text-right">
              {bio.length}/500
            </p>
          </div>

          {/* Music links */}
          <div className="space-y-2">
            <Label>Music links</Label>
            {musicLinks.map((link, idx) => (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: stable index in controlled list
                key={idx}
                className="flex gap-2"
              >
                <Input
                  value={link}
                  onChange={(e) => handleMusicLinkChange(idx, e.target.value)}
                  placeholder="https://open.spotify.com/..."
                  disabled={isSaving}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveMusicLink(idx)}
                  disabled={isSaving}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {musicLinks.length < 5 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddMusicLink}
                disabled={isSaving}
              >
                <Plus className="h-4 w-4" />
                Add link
              </Button>
            )}
          </div>

          {error && (
            <p
              className="text-sm text-destructive"
              data-ocid="artist-edit.error_state"
            >
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
              data-ocid="artist-edit.cancel_button"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!canSubmit}
              data-ocid="artist-edit.save_button"
            >
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {isSaving ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
