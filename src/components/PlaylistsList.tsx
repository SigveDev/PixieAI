import { useEffect, useState } from "react";
import SpotifyWebApi from "spotify-web-api-node";
import ImageLoading from "./loading/imageLoading";
import TextLoading from "./loading/textLoading";
import LoadingWrapper from "./loading/loadingWrapper";
import { toast } from "react-toastify";

const PlaylistList = ({
  spotifyApi,
  addSelectedTrack,
  removeSelectedTrack,
  getSelectedTracks,
}: {
  spotifyApi: SpotifyWebApi;
  addSelectedTrack: (trackId: SpotifyApi.PlaylistTrackObject) => void;
  removeSelectedTrack: (trackId: string) => void;
  getSelectedTracks: () => SpotifyApi.TrackObjectFull[];
}) => {
  const [playlists, setPlaylists] = useState<
    SpotifyApi.PlaylistObjectSimplified[] | undefined
  >();
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<
    string | undefined
  >();
  const [selectedPlaylist, setSelectedPlaylist] = useState<
    SpotifyApi.PlaylistTrackResponse | undefined
  >();
  const [selectedPlaylistTracks, setSelectedPlaylistTracks] = useState<
    SpotifyApi.PlaylistTrackObject[]
  >([]);
  const [
    selectedPlaylistTrackAudioFetures,
    setSelectedPlaylistTrackAudioFetures,
  ] = useState<SpotifyApi.AudioFeaturesObject[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLoading, setSelectedLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    spotifyApi.getUserPlaylists().then(({ body }) => {
      setPlaylists(body.items);
      setLoading(false);
      setSelectedPlaylistId(body.items[0].id);
    });
  }, []);

  useEffect(() => {
    if (!selectedPlaylistId) {
      setSelectedPlaylist(undefined);
      return;
    }
    setSelectedLoading(true);
    spotifyApi
      .getPlaylistTracks(selectedPlaylistId, { offset: 0, limit: 100 })
      .then(({ body }) => {
        setSelectedPlaylist(body);
        setSelectedPlaylistTracks(
          body.items.filter((item) => item.track?.type === "track")
        );
        const trackIds = body.items
          .filter((item) => item.track !== null)
          .filter((item) => item.track?.type === "track")
          .map((item) => item.track!.id);
        if (trackIds.length > 0) {
          spotifyApi.getAudioFeaturesForTracks(trackIds).then(({ body }) => {
            setSelectedPlaylistTrackAudioFetures(body.audio_features);
          });
        }
        if (body.total > 100) {
          for (let i = 100; i < body.total; i += 100) {
            spotifyApi
              .getPlaylistTracks(selectedPlaylistId, { offset: i, limit: 100 })
              .then(({ body }) => {
                setSelectedPlaylistTracks((prev) => [
                  ...prev,
                  ...body.items.filter((item) => item.track?.type === "track"),
                ]);
                const trackIds = body.items
                  .filter((item) => item.track !== null)
                  .filter((item) => item.track?.type === "track")
                  .map((item) => item.track!.id);
                if (trackIds.length > 0) {
                  spotifyApi
                    .getAudioFeaturesForTracks(trackIds)
                    .then(({ body }) => {
                      setSelectedPlaylistTrackAudioFetures((prev) => [
                        ...prev,
                        ...body.audio_features,
                      ]);
                      setSelectedLoading(false);
                    });
                }
              });
          }
        } else {
          setSelectedLoading(false);
        }
      });
  }, [selectedPlaylistId]);

  return (
    <div className="flex flex-col w-full gap-4 h-fit">
      <div className="flex flex-row w-full gap-2 overflow-x-scroll overflow-y-hidden h-fit no-scrollbar">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="w-[640px] h-fit flex flex-col">
                <LoadingWrapper>
                  <ImageLoading />
                  <div className="w-full h-4 mt-2">
                    <TextLoading />
                  </div>
                </LoadingWrapper>
              </div>
            ))
          : playlists?.map((playlist) => (
              <div
                key={playlist.id}
                className="w-[640px] h-fit flex flex-col cursor-pointer"
                onClick={() => {
                  if (playlist.id !== selectedPlaylistId) {
                    setSelectedPlaylist();
                    setSelectedPlaylistTracks([]);
                    setSelectedPlaylistId(playlist.id);
                  }
                }}
              >
                {playlist.images !== null && (
                  <img
                    src={playlist.images[0].url}
                    alt="Playlist"
                    className="rounded-md max-w-32 max-h-32 min-h-32 min-w-32"
                  />
                )}

                <p className="text-center">
                  {playlist.name.substring(0, 24)}
                  {playlist.name.length > 24 && "..."}
                </p>
              </div>
            ))}
      </div>
      {selectedLoading ? (
        <div className="flex flex-col w-full gap-4 px-8 py-6 overflow-x-hidden overflow-y-scroll rounded-lg h-fit backdrop-blur-sm bg-white/5 max-h-96 custom-scrollbar">
          <div className="flex flex-col gap-2">
            <div className="w-32 h-6">
              <TextLoading />
            </div>
            <div className="h-4 w-72">
              <TextLoading />
            </div>
          </div>
          <div className="flex flex-col w-full gap-2 h-fit">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex flex-row gap-2 w-fit h-fit">
                <div className="w-16 rounded-lg aspect-square">
                  <ImageLoading />
                </div>
                <div className="flex flex-col gap-2">
                  <div className="w-32 h-6">
                    <TextLoading />
                  </div>
                  <div className="h-4 w-44">
                    <TextLoading />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        selectedPlaylist && (
          <div className="flex flex-col w-full gap-10 px-8 py-6 overflow-x-hidden overflow-y-scroll rounded-lg backdrop-blur-sm bg-white/5 h-96 custom-scrollbar">
            <div className="flex w-full h-fit">
              <div>
                <h1 className="text-2xl font-bold">
                  {
                    playlists?.find(
                      (playlist) => playlist.id === selectedPlaylistId
                    )?.name
                  }
                </h1>
                <p className="text-sm text-slate-400">
                  {
                    playlists?.find(
                      (playlist) => playlist.id === selectedPlaylistId
                    )?.description
                  }
                </p>
              </div>
              <div className="flex items-center justify-end h-full w-fit grow">
                <p className="mb-1 text-sm text-slate-400 w-fit text-nowrap">
                  {selectedPlaylistTracks.length} tracks
                </p>
                <label className="relative inline-flex items-center ml-2 cursor-pointer w-fit">
                  <input
                    type="checkbox"
                    value=""
                    className="sr-only peer"
                    onChange={(e) => {
                      let count = getSelectedTracks().length;
                      selectedPlaylistTracks.forEach((item) => {
                        if (item.track) {
                          if (e.target.checked) {
                            if (
                              getSelectedTracks().filter(
                                (track) => track.id === item.track?.id
                              ).length > 0
                            ) {
                              return;
                            }
                            if (count < 50) {
                              addSelectedTrack(item);
                              count++;
                            }
                          } else {
                            removeSelectedTrack(item.track.id);
                          }
                        }
                      });
                      if (e.target.checked) {
                        toast.success("All tracks added to queue");
                      } else {
                        toast.error("All tracks removed from queue");
                      }
                    }}
                    checked={selectedPlaylistTracks.every(
                      (item) =>
                        item.track &&
                        getSelectedTracks().filter(
                          (track) => track.id === item.track?.id
                        ).length > 0
                    )}
                  />
                  <div className="w-11 h-6 peer-focus:outline-none rounded-full peer bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
            <div className="flex flex-col w-full gap-2 h-fit">
              {selectedPlaylistTracks.map((item, index) => {
                if (!item.track) return null;
                const audioFeatures = selectedPlaylistTrackAudioFetures.find(
                  (audioFeature) => audioFeature.id === item.track?.id
                );
                return (
                  <div
                    key={item.track.id}
                    className={`flex flex-row gap-2 w-full h-fit ${
                      index === selectedPlaylistTracks.length - 1
                        ? ""
                        : "pb-2 border-b border-[#3a233f]"
                    }`}
                  >
                    <div className="min-w-16">
                      <img
                        src={item.track.album.images[0].url}
                        alt="Album Art"
                        className="w-16 rounded-lg aspect-square"
                      />
                    </div>
                    <div>
                      <p className="text-sm">{item.track.name}</p>
                      <p className="text-xs text-slate-400">
                        {item.track.artists
                          .map((artist) => artist.name)
                          .join(", ")}
                      </p>
                      <p className="text-xs text-slate-600">
                        Energy: {audioFeatures?.energy}, Tempo:{" "}
                        {audioFeatures?.tempo}
                      </p>
                    </div>
                    <div className="flex items-center justify-end grow">
                      {item.track !== null && (
                        <label className="relative inline-flex items-center ml-2 cursor-pointer w-fit">
                          <input
                            type="checkbox"
                            value=""
                            className="sr-only peer"
                            onChange={() => {
                              if (item.track) {
                                if (
                                  getSelectedTracks().filter(
                                    (track) => track.id === item.track?.id
                                  ).length > 0
                                ) {
                                  removeSelectedTrack(item.track.id);
                                  toast.error(
                                    `${item.track.name} removed from queue`
                                  );
                                } else {
                                  if (getSelectedTracks().length < 50) {
                                    addSelectedTrack(item);
                                    toast.success(
                                      `${item.track.name} added to queue`
                                    );
                                  }
                                }
                              }
                            }}
                            checked={
                              getSelectedTracks().filter(
                                (track) => track.id === item.track?.id
                              ).length > 0
                            }
                          />
                          <div className="w-11 h-6 peer-focus:outline-none rounded-full peer bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )
      )}
    </div>
  );
};

export default PlaylistList;
