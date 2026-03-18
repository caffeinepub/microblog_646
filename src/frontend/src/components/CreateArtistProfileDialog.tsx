import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArtistForm } from "./ArtistPageSection";

interface CreateArtistProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateArtistProfileDialog({
  open,
  onOpenChange,
}: CreateArtistProfileDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto sm:max-w-md"
        data-ocid="artist-profile.dialog"
      >
        <DialogHeader>
          <DialogTitle>Create Artist Profile</DialogTitle>
        </DialogHeader>
        <ArtistForm
          artistPage={null}
          onSuccess={() => onOpenChange(false)}
          onCancel={() => onOpenChange(false)}
          compact
        />
      </DialogContent>
    </Dialog>
  );
}

export function CreateArtistProfileButton({
  className,
}: { className?: string }) {
  return (
    <Button
      variant="outline"
      size="sm"
      className={className}
      data-ocid="artist-profile.open_modal_button"
    >
      Create Artist Profile
    </Button>
  );
}
