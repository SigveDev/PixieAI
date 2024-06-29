import { useEffect, useState } from "react";
import SpotifyWebApi from "spotify-web-api-node";
import PlaylistList from "./PlaylistsList";

const HomeComponent = ({
  spotifyApi,
  addSelectedTrack,
  removeSelectedTrack,
  getSelectedTracks,
}: {
  spotifyApi: SpotifyWebApi;
  addSelectedTrack: (track: SpotifyApi.PlaylistTrackObject) => void;
  removeSelectedTrack: (trackId: string) => void;
  getSelectedTracks: () => SpotifyApi.TrackObjectFull[];
}) => {
  const [me, setMe] = useState<
    SpotifyApi.CurrentUsersProfileResponse | undefined
  >();

  useEffect(() => {
    spotifyApi.getMe().then(({ body }) => {
      setMe(body);
    });
  }, []);

  return (
    <div className="flex flex-col w-full gap-4 h-fit">
      <div className="flex flex-row w-full h-fit">
        <div className="flex flex-col w-fit h-fit">
          <p className="text-xl">
            {me ? `Hello, ${me.display_name}` : "Hello, ..."}
          </p>
          <h1 className="text-4xl font-bold">Welcome to PixieAI</h1>
        </div>
      </div>
      <PlaylistList
        spotifyApi={spotifyApi}
        addSelectedTrack={addSelectedTrack}
        removeSelectedTrack={removeSelectedTrack}
        getSelectedTracks={getSelectedTracks}
      />
    </div>
  );
};

export default HomeComponent;
