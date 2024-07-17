import { useEffect, useState } from "react";
import SpotifyWebApi from "spotify-web-api-node";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { generateSpeech } from "../functions/GenerateSpeech";

const Player = ({
  spotifyApi,
  getSelectedTracks,
  getRecommendedTracks,
  recommend,
  player,
  stopPlaying,
}: {
  spotifyApi: SpotifyWebApi;
  getSelectedTracks: () => SpotifyApi.TrackObjectFull[];
  getRecommendedTracks: () => SpotifyApi.TrackObjectFull[];
  recommend: boolean;
  player: Spotify.Player | null;
  stopPlaying: () => void;
}) => {
  const [track, setTrack] = useState<SpotifyApi.TrackObjectFull | undefined>();
  const [talking, setTalking] = useState<boolean>(true);
  const [runIn, setRunIn] = useState<number | undefined>();

  const openai = createOpenAI({
    apiKey: import.meta.env.VITE_OPENAI_API_KEY as string,
  });

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

      const fetchedAudio = await startRadio(getSelectedTracks()[0]);
      if (!fetchedAudio || !isMounted) {
        return;
      }
      audio = fetchedAudio;
      audio.play();
      audio.onended = () => {
        if (!isMounted) return;
        setTalking(false);
        setTrack(getSelectedTracks()[0]);
        spotifyApi.play({
          uris: getSelectedTracks().map((track) => track.uri),
        });
        setRunIn(getSelectedTracks()[0].duration_ms);
      };
    };

    handleStart();

    return () => {
      isMounted = false;
      // Cleanup function to stop audio playback when component unmounts
      if (audio) {
        audio.pause();
        audio.onended = null;
      }
    };
  }, [getSelectedTracks(), getRecommendedTracks()]);

  useEffect(() => {
    let isMounted = true;
    if (runIn && track) {
      let audio: HTMLAudioElement;
      const timeout = setTimeout(async () => {
        player?.pause();
        setTalking(true);
        const nextTrack =
          getSelectedTracks()[getSelectedTracks().indexOf(track) + 1];
        if (!nextTrack) {
          stopPlaying();
          return;
        }
        const fetchedAudio = await getSoundfile(
          nextTrack as SpotifyApi.TrackObjectFull
        );
        if (!fetchedAudio || !isMounted) {
          return;
        }
        audio = fetchedAudio;
        audio.play();
        audio.onended = () => {
          if (!isMounted) return;
          setTalking(false);
          setTrack(nextTrack);
          player?.nextTrack();
          player?.resume();
          setRunIn(nextTrack.duration_ms);
        };
      }, runIn);
      return () => {
        isMounted = false;
        clearTimeout(timeout);

        // Cleanup function to stop audio playback when component unmounts
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
            src="/coconut.jpg"
            alt="PixieAI"
            className="w-4/5 rounded-lg aspect-square"
          />
          <h1 className="text-3xl font-bold">PixieAI</h1>
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
    </div>
  );
};

export default Player;
