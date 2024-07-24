import { useEffect, useState } from "react";
import SpotifyWebApi from "spotify-web-api-node";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { generateSpeech } from "../functions/GenerateSpeech";
import { Play, Pause, SkipForward, Volume1, VolumeX } from "lucide-react";

const Player = ({
  accessToken,
  spotifyApi,
  getSelectedTracks,
  getRecommendedTracks,
  recommend,
  stopPlaying,
  setUniversalPlayer,
}: {
  accessToken: string | undefined;
  spotifyApi: SpotifyWebApi;
  getSelectedTracks: () => SpotifyApi.TrackObjectFull[];
  getRecommendedTracks: () => SpotifyApi.TrackObjectFull[];
  recommend: boolean;
  stopPlaying: () => void;
  setUniversalPlayer: (player: Spotify.Player) => void;
}) => {
  const [track, setTrack] = useState<SpotifyApi.TrackObjectFull | undefined>();
  const [talking, setTalking] = useState<boolean>(true);
  const [runIn, setRunIn] = useState<number | undefined>();
  const [player, setPlayer] = useState<Spotify.Player>();
  const [currentPlaying, setCurrentPlaying] = useState<HTMLAudioElement>();
  const [loading, setLoading] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.5);
  const [preVolume, setPreVolume] = useState<number>(0.5);
  const [paused, setPaused] = useState<boolean>(false);
  const [skipping, setSkipping] = useState<boolean>(false);

  const openai = createOpenAI({
    apiKey: import.meta.env.VITE_OPENAI_API_KEY as string,
  });

  useEffect(() => {
    if (!accessToken) return;
    const script = document.createElement("script");
    script.src = "https://sdk.scdn.co/spotify-player.js";
    script.async = true;

    document.body.appendChild(script);

    window.onSpotifyWebPlaybackSDKReady = () => {
      const player = new Spotify.Player({
        name: "PixieAI Player",
        getOAuthToken: (cb) => {
          cb(accessToken);
        },
        volume: 0.5,
      });

      player.addListener("initialization_error", ({ message }) => {
        console.error("initialization_error", message);
      });
      player.addListener("authentication_error", ({ message }) => {
        console.error("authentication_error", message);
      });
      player.addListener("account_error", ({ message }) => {
        console.error("account_error", message);
      });
      player.addListener("playback_error", ({ message }) => {
        console.error("playback_error", message);
      });

      player.addListener("ready", ({ device_id }) => {
        console.log("Ready with Device ID", device_id);

        spotifyApi.pause().finally(() => {
          spotifyApi.transferMyPlayback([device_id]).finally(() => {
            console.log("Playback transferred to PixieAI Player");
            player.pause();
          });
        });
      });

      player.addListener("not_ready", ({ device_id }) => {
        console.log("Device ID has gone offline", device_id);
      });

      setPlayer(player);
      setUniversalPlayer(player);
    };

    return () => {
      if (player) {
        player.disconnect();
        console.log("Player disconnected");

        player.removeListener("initialization_error");
        player.removeListener("authentication_error");
        player.removeListener("account_error");
        player.removeListener("playback_error");
        player.removeListener("ready");
        player.removeListener("not_ready");
        player.removeListener("player_state_changed");

        setPlayer(undefined);

        const script = document.querySelector(
          "script[src='https://sdk.scdn.co/spotify-player.js']"
        );
        script?.parentNode?.removeChild(script);
      }
    };
  }, [accessToken, spotifyApi]);

  useEffect(() => {
    let isMounted = true;
    let audio: HTMLAudioElement;

    const handleStart = async () => {
      if (getSelectedTracks().length === 0) {
        return;
      }
      if (recommend && getRecommendedTracks().length === 0) {
        return;
      }
      if (!player) {
        return;
      }

      player.connect().then((success) => {
        if (success) {
          console.log(
            "The Web Playback SDK successfully connected to Spotify!"
          );
        }
      });
      setLoading(true);
      const fetchedAudio = await startRadio(getSelectedTracks()[0]);
      if (!fetchedAudio || !isMounted) {
        return;
      }
      audio = fetchedAudio;
      setCurrentPlaying(audio);
      audio.play().finally(() => {
        setLoading(false);
      });
      spotifyApi.setShuffle(false);
      audio.onended = () => {
        if (!isMounted) return;
        setTalking(false);
        setTrack(getSelectedTracks()[0]);
        spotifyApi
          .play({
            uris: getSelectedTracks().map((track) => track.uri),
          })
          .finally(() => {
            setRunIn(getSelectedTracks()[0].duration_ms);
          });
      };
    };

    handleStart();

    return () => {
      isMounted = false;

      if (audio) {
        audio.pause();
        audio.onended = null;
      }
    };
  }, [getSelectedTracks(), getRecommendedTracks(), player]);

  useEffect(() => {
    let isMounted = true;
    if (runIn && track) {
      let audio: HTMLAudioElement;
      const initialTrack = track;
      const timeout = setTimeout(async () => {
        if (initialTrack !== track) {
          return;
        }

        if (!skipping) {
          const currentState = await player?.getCurrentState();
          if (
            currentState &&
            track.duration_ms - currentState?.position > 800
          ) {
            if (runIn === track.duration_ms - currentState.position) {
              setRunIn(track.duration_ms - currentState.position - 1);
            } else {
              setRunIn(track.duration_ms - currentState.position);
            }
            return;
          }
        } else {
          setSkipping(false);
        }

        player?.pause();
        setTalking(true);
        const nextTrack =
          getSelectedTracks()[getSelectedTracks().indexOf(track) + 1];
        if (!nextTrack) {
          stopPlaying();
          return;
        }
        setLoading(true);
        const fetchedAudio = await getSoundfile(
          nextTrack as SpotifyApi.TrackObjectFull
        );
        if (!fetchedAudio || !isMounted) {
          return;
        }
        audio = fetchedAudio;
        setCurrentPlaying(audio);
        audio.play().finally(() => {
          setLoading(false);
        });
        spotifyApi.setShuffle(false);
        audio.onended = () => {
          if (!isMounted) return;
          setTalking(false);
          setTrack(nextTrack);
          player?.nextTrack().finally(() => {
            setRunIn(nextTrack.duration_ms);
          });
        };
      }, runIn);
      return () => {
        isMounted = false;
        clearTimeout(timeout);

        if (audio) {
          audio.pause();
          audio.onended = null;
        }
      };
    }
    return () => {
      isMounted = false;
    };
  }, [runIn, track]);

  useEffect(() => {
    if (player) {
      player.setVolume(volume);
    }
    if (currentPlaying) {
      currentPlaying.volume = volume;
    }
  }, [volume, player, currentPlaying]);

  const startRadio = async (track: SpotifyApi.TrackObjectFull) => {
    const result = await generateText({
      model: openai.chat("gpt-4o"),
      system: `You are an AI DJ named PixieAI. Introduce yourself and the song you are about to play. Give a short sentance with a referance to teh lyric of the song i give you. Add a last sentance introducing the song like you are a radio host.`,
      prompt: `${track.name} - ${track.artists
        .map((artist) => artist.name)
        .join(", ")}`,
    });

    const text = result.text;
    const audioUrl = await generateSpeech(text);

    const audio = new Audio(audioUrl);
    return audio;
  };

  const getSoundfile = async (track: SpotifyApi.TrackObjectFull) => {
    const result = await generateText({
      model: openai.chat("gpt-4o"),
      system: `Give a short sentance or two with a fun fact about the artist or song I'm providing you, but don't announce it as a fact. Randomely give me a news header if its something new, but keep it short. Add a last sentance introducing the song like you are a radio host.`,
      prompt: `${track.name} - ${track.artists
        .map((artist) => artist.name)
        .join(", ")}`,
    });

    const text = result.text;
    const audioUrl = await generateSpeech(text);
    const audio = new Audio(audioUrl);

    return audio;
  };

  return (
    <div className="flex flex-col items-center justify-center w-full h-full">
      {talking ? (
        <div className="flex flex-col items-center gap-8 h-fit w-fit">
          <img
            src="/icon.svg"
            alt="PixieAI"
            className="w-4/5 rounded-lg aspect-square"
          />
          <div className="flex flex-col items-center text-center">
            <h1 className="text-3xl font-bold">PixieAI</h1>
            <p className="text-lg">{loading ? "Loading..." : "Talking..."}</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-8 h-fit w-fit">
          <img
            src={track?.album.images[0].url}
            alt="Album Art"
            className="w-4/5 rounded-lg aspect-square"
          />
          <div className="flex flex-col items-center text-center">
            <h1 className="text-3xl font-bold">{track?.name}</h1>
            <p className="text-lg">
              {track?.artists.map((artist) => artist.name).join(", ")}
            </p>
          </div>
        </div>
      )}
      <div className="flex flex-row gap-6 w-fit">
        <button
          className={`p-2 ${
            talking ? "text-slate-600" : "text-white"
          } bg-black rounded-lg`}
          onClick={() => {
            if (talking) {
              return;
            }
            if (paused) {
              player?.resume();
              setPaused(false);
            } else {
              player?.pause();
              setPaused(true);
            }
          }}
        >
          {paused ? (
            <Play size={20} strokeWidth={3} />
          ) : (
            <Pause size={20} strokeWidth={3} />
          )}
        </button>
        <button
          className={`p-2 ${
            talking ? "text-slate-600" : "text-white"
          } bg-black rounded-lg`}
          onClick={async () => {
            if (talking) {
              return;
            }
            setSkipping(true);
            setRunIn(5);
          }}
        >
          <SkipForward size={20} strokeWidth={3} />
        </button>
        <div className="flex items-center justify-center w-fit h-fit">
          <button
            className="p-2 text-white bg-black rounded-lg"
            onClick={() => {
              if (volume === 0) {
                setVolume(preVolume);
              } else {
                setPreVolume(volume);
                setVolume(0);
              }
            }}
          >
            {volume === 0 ? (
              <VolumeX size={20} strokeWidth={3} />
            ) : (
              <Volume1 size={20} strokeWidth={3} />
            )}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => {
              setVolume(Number(e.target.value));
            }}
            className="w-40 h-4"
          />
        </div>
      </div>
    </div>
  );
};

export default Player;
