import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle2,
  Loader2,
  Music,
  Plus,
  Trash2,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { ArtistPageResponse } from "../backend";
import { useActor } from "../hooks/useActor";
import {
  useArtistPage,
  useCreateOrUpdateArtistPage,
} from "../hooks/useArtistPageQueries";

type UsernameStatus = "idle" | "checking" | "available" | "taken" | "invalid";

function useUsernameAvailability(username: string, currentUsername?: string) {
  const { actor } = useActor();
  const [status, setStatus] = useState<UsernameStatus>("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const check = useCallback(
    async (value: string) => {
      if (!value || value.length < 3) {
        setStatus(value ? "invalid" : "idle");
        return;
      }
      if (!/^[a-zA-Z0-9_]+$/.test(value)) {
        setStatus("invalid");
        return;
      }
      // If editing and username hasn't changed, skip check
      if (currentUsername && value === currentUsername) {
        setStatus("available");
        return;
      }
      setStatus("checking");
      try {
        const available = await actor?.checkUsernameAvailability(value);
        setStatus(available ? "available" : "taken");
      } catch {
        setStatus("idle");
      }
    },
    [actor, currentUsername],
  );

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!username) {
      setStatus("idle");
      return;
    }
    timerRef.current = setTimeout(() => check(username), 400);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [username, check]);

  return status;
}

interface ArtistFormProps {
  artistPage?: ArtistPageResponse | null;
  onSuccess?: () => void;
  onCancel?: () => void;
  compact?: boolean;
}

export function ArtistForm({
  artistPage,
  onSuccess,
  onCancel,
  compact = false,
}: ArtistFormProps) {
  const { mutate: saveArtistPage, isPending } = useCreateOrUpdateArtistPage();
  const hasArtistPage = !!artistPage;

  const [username, setUsername] = useState(artistPage?.username ?? "");
  const [bandName, setBandName] = useState(artistPage?.bandName ?? "");
  const [genre, setGenre] = useState(artistPage?.genre ?? "");
  const [bio, setBio] = useState(artistPage?.bio ?? "");
  const [musicLinks, setMusicLinks] = useState<string[]>(
    artistPage && artistPage.musicLinks.length > 0
      ? [...artistPage.musicLinks]
      : [""],
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const usernameStatus = useUsernameAvailability(
    username,
    artistPage?.username,
  );

  function validate() {
    const newErrors: Record<string, string> = {};
    if (!username.trim()) newErrors.username = "Username is required";
    else if (username.length < 3) newErrors.username = "Min 3 characters";
    else if (!/^[a-zA-Z0-9_]+$/.test(username))
      newErrors.username = "Letters, numbers, underscores only";
    else if (usernameStatus === "taken")
      newErrors.username = "Username already taken";
    else if (usernameStatus === "checking")
      newErrors.username = "Checking availability...";
    if (!bandName.trim()) newErrors.bandName = "Band name is required";
    else if (bandName.trim().length > 100)
      newErrors.bandName = "Max 100 characters";
    if (!genre.trim()) newErrors.genre = "Genre is required";
    else if (genre.trim().length > 50) newErrors.genre = "Max 50 characters";
    if (bio.length > 500) newErrors.bio = "Max 500 characters";
    musicLinks.forEach((link, i) => {
      if (!link.trim()) return;
      try {
        new URL(link.trim());
      } catch {
        newErrors[`link_${i}`] = "Invalid URL";
      }
    });
    return newErrors;
  }

  function handleSave() {
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    const validLinks = musicLinks.filter((l) => l.trim());
    saveArtistPage(
      {
        username: username.trim().toLowerCase(),
        bandName: bandName.trim(),
        genre: genre.trim(),
        bio: bio.trim(),
        musicLinks: validLinks,
      },
      {
        onSuccess: () => {
          toast.success(
            hasArtistPage ? "Artist page updated" : "Artist page created",
          );
          onSuccess?.();
        },
        onError: (err) => {
          toast.error(err.message || "Failed to save artist page");
        },
      },
    );
  }

  function addLink() {
    if (musicLinks.length < 5) setMusicLinks([...musicLinks, ""]);
  }

  function removeLink(index: number) {
    setMusicLinks(musicLinks.filter((_, i) => i !== index));
  }

  function updateLink(index: number, value: string) {
    const updated = [...musicLinks];
    updated[index] = value;
    setMusicLinks(updated);
  }

  const fieldClass = "space-y-1.5";
  const labelClass = "text-xs font-medium";

  return (
    <div className="space-y-4" data-ocid="artist-page.panel">
      {/* Username */}
      <div className={fieldClass}>
        <Label htmlFor="artist-username" className={labelClass}>
          Artist Username <span className="text-destructive">*</span>
        </Label>
        <div className="relative">
          <Input
            id="artist-username"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value.toLowerCase());
              if (errors.username)
                setErrors((prev) => ({ ...prev, username: "" }));
            }}
            placeholder="e.g. thestrokesofficial"
            maxLength={30}
            disabled={hasArtistPage}
            className={hasArtistPage ? "opacity-60" : ""}
            data-ocid="artist-page.input"
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
            {usernameStatus === "checking" && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
            {usernameStatus === "available" && !hasArtistPage && (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            )}
            {(usernameStatus === "taken" || usernameStatus === "invalid") && (
              <XCircle className="h-4 w-4 text-destructive" />
            )}
          </div>
        </div>
        {hasArtistPage && (
          <p className="text-xs text-muted-foreground">
            Username cannot be changed after creation.
          </p>
        )}
        {!hasArtistPage && usernameStatus === "available" && username && (
          <p className="text-xs text-green-600">@{username} is available</p>
        )}
        {!hasArtistPage && usernameStatus === "taken" && (
          <p
            className="text-xs text-destructive"
            data-ocid="artist-page.error_state"
          >
            @{username} is already taken
          </p>
        )}
        {!hasArtistPage && usernameStatus === "invalid" && username && (
          <p className="text-xs text-destructive">
            Letters, numbers, and underscores only (min 3 chars)
          </p>
        )}
        {errors.username && (
          <p
            className="text-xs text-destructive"
            data-ocid="artist-page.error_state"
          >
            {errors.username}
          </p>
        )}
      </div>

      {/* Band Name */}
      <div className={fieldClass}>
        <Label htmlFor="artist-band-name" className={labelClass}>
          Band Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="artist-band-name"
          value={bandName}
          onChange={(e) => {
            setBandName(e.target.value);
            if (errors.bandName)
              setErrors((prev) => ({ ...prev, bandName: "" }));
          }}
          placeholder="Your band or artist name"
          maxLength={100}
          data-ocid="artist-page.input"
        />
        {errors.bandName && (
          <p
            className="text-xs text-destructive"
            data-ocid="artist-page.error_state"
          >
            {errors.bandName}
          </p>
        )}
      </div>

      {/* Genre */}
      <div className={fieldClass}>
        <Label htmlFor="artist-genre" className={labelClass}>
          Genre <span className="text-destructive">*</span>
        </Label>
        <Input
          id="artist-genre"
          value={genre}
          onChange={(e) => {
            setGenre(e.target.value);
            if (errors.genre) setErrors((prev) => ({ ...prev, genre: "" }));
          }}
          placeholder="e.g. Indie Rock, Jazz, Hip-Hop"
          maxLength={50}
          data-ocid="artist-page.select"
        />
        {errors.genre && (
          <p className="text-xs text-destructive">{errors.genre}</p>
        )}
      </div>

      {/* Bio */}
      <div className={fieldClass}>
        <div className="flex items-center justify-between">
          <Label htmlFor="artist-bio" className={labelClass}>
            Bio
          </Label>
          <span
            className={`text-xs ${
              bio.length > 500 ? "text-destructive" : "text-muted-foreground"
            }`}
          >
            {bio.length}/500
          </span>
        </div>
        <Textarea
          id="artist-bio"
          value={bio}
          onChange={(e) => {
            setBio(e.target.value);
            if (errors.bio) setErrors((prev) => ({ ...prev, bio: "" }));
          }}
          placeholder="Tell fans about your band..."
          rows={compact ? 2 : 3}
          data-ocid="artist-page.textarea"
        />
        {errors.bio && <p className="text-xs text-destructive">{errors.bio}</p>}
      </div>

      {/* Music Links — hidden in compact mode */}
      {!compact && (
        <div className={fieldClass}>
          <Label className={labelClass}>Music Links</Label>
          <p className="text-xs text-muted-foreground">
            Add up to 5 links (Spotify, SoundCloud, Bandcamp, etc.)
          </p>
          <div className="space-y-2">
            {musicLinks.map((link, index) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: stable index for music links
              <div key={index} className="space-y-1">
                <div className="flex items-center gap-2">
                  <Input
                    value={link}
                    onChange={(e) => {
                      updateLink(index, e.target.value);
                      if (errors[`link_${index}`])
                        setErrors((prev) => ({
                          ...prev,
                          [`link_${index}`]: "",
                        }));
                    }}
                    placeholder="https://"
                    type="url"
                    data-ocid={`artist-page.input.${index + 1}`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 shrink-0"
                    onClick={() => removeLink(index)}
                    data-ocid={`artist-page.delete_button.${index + 1}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                {errors[`link_${index}`] && (
                  <p className="text-xs text-destructive">
                    {errors[`link_${index}`]}
                  </p>
                )}
              </div>
            ))}
            {musicLinks.length < 5 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={addLink}
                className="h-8 text-xs"
                data-ocid="artist-page.secondary_button"
              >
                <Plus className="h-3 w-3" />
                Add link
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <Button
          size="sm"
          onClick={handleSave}
          disabled={
            isPending ||
            usernameStatus === "checking" ||
            usernameStatus === "taken"
          }
          data-ocid="artist-page.save_button"
        >
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {isPending
            ? "Saving..."
            : hasArtistPage
              ? "Save Changes"
              : "Create Artist Page"}
        </Button>
        {onCancel && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            data-ocid="artist-page.cancel_button"
          >
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}

export function ArtistPageSection() {
  const { data: artistPage, isLoading } = useArtistPage();
  const [isExpanded, setIsExpanded] = useState(false);

  const hasArtistPage = !!artistPage;

  if (isLoading) {
    return (
      <div
        className="flex items-center justify-center py-8"
        data-ocid="artist-page.loading_state"
      >
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="px-4 py-4">
      <Separator className="mb-4" />
      <div className="mb-3 flex items-center gap-2">
        <Music className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">Artist Page</h3>
        {hasArtistPage && (
          <Badge variant="secondary" className="text-xs">
            Active
          </Badge>
        )}
      </div>

      {!isExpanded && (
        <div>
          {hasArtistPage ? (
            <div className="space-y-2">
              <div className="text-sm">
                <span className="font-medium">{artistPage.bandName}</span>
                <span className="ml-2 text-xs text-muted-foreground">
                  @{artistPage.username}
                </span>
                <span className="ml-2 text-xs text-muted-foreground">
                  {artistPage.genre}
                </span>
              </div>
              {artistPage.bio && (
                <p className="line-clamp-2 text-xs text-muted-foreground">
                  {artistPage.bio}
                </p>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsExpanded(true)}
                data-ocid="artist-page.edit_button"
              >
                Edit Artist Page
              </Button>
            </div>
          ) : (
            <div>
              <p className="mb-3 text-sm text-muted-foreground">
                Create an artist page to showcase your band, music, and links to
                fans.
              </p>
              <Button
                variant="default"
                size="sm"
                onClick={() => setIsExpanded(true)}
                data-ocid="artist-page.open_modal_button"
              >
                <Plus className="h-4 w-4" />
                Create Artist Page
              </Button>
            </div>
          )}
        </div>
      )}

      {isExpanded && (
        <ArtistForm
          artistPage={artistPage}
          onSuccess={() => setIsExpanded(false)}
          onCancel={() => setIsExpanded(false)}
        />
      )}
    </div>
  );
}

interface ArtistPageCardProps {
  artistPage: ArtistPageResponse;
}

export function ArtistPageCard({ artistPage }: ArtistPageCardProps) {
  return (
    <div className="border-t px-4 py-4" data-ocid="artist-page.card">
      <div className="mb-2 flex items-center gap-2">
        <Music className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">{artistPage.bandName}</h3>
        <Badge variant="secondary" className="text-xs">
          {artistPage.genre}
        </Badge>
      </div>
      {artistPage.bio && (
        <p className="mb-3 whitespace-pre-wrap text-sm text-muted-foreground">
          {artistPage.bio}
        </p>
      )}
      {artistPage.musicLinks.length > 0 && (
        <div className="flex flex-wrap gap-2">
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
                className="text-xs text-primary hover:underline"
                data-ocid={`artist-page.link.${i + 1}`}
              >
                {label}
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
