import { useEffect, useState } from "react";
import SpotifyWebApi from "spotify-web-api-node";

import { ChevronLeft } from "lucide-react";

const Player = ({ spotifyApi }: { spotifyApi: SpotifyWebApi }) => {
  const [track, setTrack] = useState<SpotifyApi.TrackObjectFull | undefined>();

  useEffect(() => {
    spotifyApi
      .getMyCurrentPlayingTrack()
      .then(({ body }: { body: SpotifyApi.CurrentlyPlayingResponse }) => {
        if (body.item && "album" in body.item) {
          setTrack(body.item);
        }
      });
  }, []);

  return (
    <div className="flex flex-col items-center w-full h-full">
      <div className="flex flex-col items-center">
        <img
          src={track?.album.images[0].url}
          alt="Album Art"
          className="w-52 h-52"
        />
        <h1 className="text-2xl font-bold">{track?.name}</h1>
        <p className="text-lg">
          {track?.artists.map((artist) => artist.name).join(", ")}
        </p>
      </div>
    </div>
  );
};

export default Player;
