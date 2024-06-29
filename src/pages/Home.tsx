import { useEffect, useState } from "react";
import useAuth from "../hooks/useAuth";
import SpotifyWebApi from "spotify-web-api-node";
import Player from "../components/Player";
import HomeComponent from "../components/HomeComponent";
import SelectedTracksList from "../components/SelectedTracksList";

const spotifyApi = new SpotifyWebApi({
  clientId: "8b945ef10ea24755b83ac50cede405a0",
});

const Home = ({ code }: { code: string }) => {
  const accessToken = useAuth(code);
  const [playing, setPlaying] = useState(false);
  const [accesstokenIsSet, setAccessTokenIsSet] = useState(false);
  const [selectedTrackIds, setSelectedTrackIds] = useState<
    SpotifyApi.TrackObjectFull[]
  >([]);
  const [recommend, setRecommend] = useState<boolean>(false);

  const stopPlaying = () => {
    setPlaying(false);
  };

  const startPlaying = () => {
    setPlaying(true);
  };

  const getPlaying = () => {
    return playing;
  };

  const addSelectedTrack = (track: SpotifyApi.PlaylistTrackObject) => {
    setSelectedTrackIds((prev) =>
      [...prev, track.track].filter(
        (t): t is SpotifyApi.TrackObjectFull => t !== null
      )
    );
  };

  const removeSelectedTrack = (trackId: string) => {
    setSelectedTrackIds((prev) => prev.filter((track) => track.id !== trackId));
  };

  const clearSelectedTracks = () => {
    setSelectedTrackIds([]);
  };

  const getSelectedTracks = () => {
    return selectedTrackIds;
  };

  const toggleRecommend = () => {
    setRecommend(!recommend);
  };

  const getRecommend = () => {
    return recommend;
  };

  useEffect(() => {
    if (!accessToken) return;
    spotifyApi.setAccessToken(accessToken);
    setAccessTokenIsSet(true);
  }, [accessToken]);

  return (
    <div className="relative flex items-center justify-center text-white w-dvw min-h-dvh">
      <div className="absolute h-full w-full bg-[radial-gradient(#161616_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>

      {accesstokenIsSet && (
        <div className="w-[80%] h-full flex gap-4">
          <div className="relative z-10 w-2/3 max-h-full mt-20">
            {!playing ? (
              <HomeComponent
                spotifyApi={spotifyApi}
                addSelectedTrack={addSelectedTrack}
                removeSelectedTrack={removeSelectedTrack}
                getSelectedTracks={getSelectedTracks}
              />
            ) : (
              <Player spotifyApi={spotifyApi} />
            )}
          </div>
          <div className="relative z-10 w-1/3 max-h-full mt-20">
            <SelectedTracksList
              startPlaying={startPlaying}
              stopPlaying={stopPlaying}
              getPlaying={getPlaying}
              removeSelectedTrack={removeSelectedTrack}
              getSelectedTracks={getSelectedTracks}
              clearSelectedTracks={clearSelectedTracks}
              toggleRecommend={toggleRecommend}
              getRecommend={getRecommend}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
