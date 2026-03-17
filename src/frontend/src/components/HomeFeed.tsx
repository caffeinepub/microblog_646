import { Music, Users } from "lucide-react";
import { useActiveProfile } from "../contexts/ActiveProfileContext";
import {
  useArtistHomeFeed,
  useArtistPage,
} from "../hooks/useArtistPageQueries";
import { useHomeFeed } from "../hooks/useQueries";
import { FeedList } from "./FeedList";

function FanHomeFeed() {
  const query = useHomeFeed();
  return (
    <FeedList
      query={query}
      emptyIcon={<Users className="h-8 w-8 text-primary" />}
      emptyTitle="Your feed is empty"
      emptyDescription="Follow users to see their posts here."
    />
  );
}

function ArtistHomeFeed() {
  const query = useArtistHomeFeed();
  return (
    <FeedList
      query={query}
      emptyIcon={<Music className="h-8 w-8 text-primary" />}
      emptyTitle="Your artist feed is empty"
      emptyDescription="Follow artists to see their posts here."
    />
  );
}

export function HomeFeed() {
  const { activeProfile } = useActiveProfile();
  const { data: artistPage, isLoading: artistLoading } = useArtistPage();

  if (activeProfile === "artist" && !artistLoading && artistPage) {
    return <ArtistHomeFeed />;
  }
  return <FanHomeFeed />;
}
