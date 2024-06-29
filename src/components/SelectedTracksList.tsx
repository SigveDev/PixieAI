import { Trash } from "lucide-react";

const SelectedTracksList = ({
  startPlaying,
  stopPlaying,
  getPlaying,
  removeSelectedTrack,
  getSelectedTracks,
  clearSelectedTracks,
  toggleRecommend,
  getRecommend,
}: {
  startPlaying: () => void;
  stopPlaying: () => void;
  getPlaying: () => boolean;
  removeSelectedTrack: (trackId: string) => void;
  getSelectedTracks: () => SpotifyApi.TrackObjectFull[];
  clearSelectedTracks: () => void;
  toggleRecommend: () => void;
  getRecommend: () => boolean;
}) => {
  return (
    <div className="flex flex-col w-full h-full gap-6 px-4 py-3 border rounded-lg backdrop-blur-sm border-white/5">
      <div className="flex flex-col w-full gap-4 h-fit">
        <button
          className={`border-2 ${
            getPlaying()
              ? "border-red-600"
              : getSelectedTracks().length > 0
              ? "border-[#1ed760]"
              : "border-slate-600"
          } bg-black rounded-full px-4 py-2 text-white`}
          onClick={() => {
            if (getPlaying()) {
              stopPlaying();
            } else {
              if (getSelectedTracks().length > 0) {
                startPlaying();
              }
            }
          }}
        >
          {getPlaying() ? "Stop" : "Start"} Playing
        </button>
        {getPlaying() === false && (
          <div className="grid w-full grid-cols-4 gap-4 h-fit">
            <div className="flex flex-row items-center justify-between w-full col-span-3 px-4 bg-black border rounded-full border-white/10">
              <p>Recommend new songs: </p>
              <label className="relative inline-flex items-center ml-2 cursor-pointer w-fit">
                <input
                  type="checkbox"
                  value=""
                  className="sr-only peer"
                  onChange={() => {
                    toggleRecommend();
                  }}
                  checked={getRecommend()}
                />
                <div className="w-11 h-6 peer-focus:outline-none rounded-full peer bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            <button
              className="flex items-center justify-center w-full px-4 py-2 text-sm text-white bg-black border-2 border-red-600 rounded-full"
              onClick={clearSelectedTracks}
            >
              <Trash size={20} />
            </button>
          </div>
        )}
        <h2 className="text-2xl font-bold">
          {getPlaying() ? "Queue" : "Selected Tracks"}{" "}
          <span className="text-sm font-normal text-slate-400">
            {getSelectedTracks().length} of 50 tracks
          </span>
        </h2>
      </div>
      <div
        className="flex flex-col w-full gap-2 pr-2 overflow-x-hidden overflow-y-scroll custom-scrollbar"
        style={{ height: getPlaying() ? "32rem" : "29rem" }}
      >
        {getSelectedTracks().map((track) => {
          if (!track) return null;
          if (track.type !== "track") return null;
          return (
            <div key={track.id} className="flex flex-row w-full gap-2 h-fit">
              <div className="min-w-16">
                <img
                  src={track.album.images[0].url}
                  alt="Album Art"
                  className="w-16 rounded-lg aspect-square"
                />
              </div>
              <div>
                <p className="text-sm">{track.name}</p>
                <p className="text-xs text-slate-400">
                  {track.artists.map((artist) => artist.name).join(", ")}
                </p>
              </div>
              <div className="flex items-center justify-end grow">
                {track !== null && (
                  <label className="relative inline-flex items-center ml-2 cursor-pointer w-fit">
                    <input
                      type="checkbox"
                      value=""
                      className="sr-only peer"
                      onChange={() => {
                        if (track) {
                          if (getSelectedTracks().includes(track)) {
                            removeSelectedTrack(track.id);
                          }
                        }
                      }}
                      checked={getSelectedTracks().includes(track)}
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
  );
};

export default SelectedTracksList;
