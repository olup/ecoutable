import { ActionIcon, Group } from "@mantine/core";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  PauseIcon,
  PlayIcon,
  SquareIcon,
  RotateCcwIcon,
  RotateCwIcon,
  DownloadIcon,
} from "lucide-react";

interface AudioPlayerProps {
  id: string;
}

export function AudioPlayer({ id }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const initAudio = useCallback(() => {
    if (!audioRef.current) {
      const audio = new Audio(`/audio/${id}`);
      audio.addEventListener("ended", () => {
        setIsPlaying(false);
      });
      audio.addEventListener("loadedmetadata", () => {
        setDuration(audio.duration);
      });
      audioRef.current = audio;
    }
    return audioRef.current;
  }, [id]);

  useEffect(() => {
    // Initialize audio on mount to load metadata
    initAudio();
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [initAudio]);

  const play = useCallback(async () => {
    const audio = initAudio();
    try {
      await audio.play();
      setIsPlaying(true);
    } catch (error) {
      console.error("Error playing audio:", error);
    }
  }, [initAudio]);

  const pause = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      setIsPlaying(false);
    }
  }, []);

  const stop = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      setIsPlaying(false);
    }
  }, []);

  const seek = useCallback(
    (seconds: number) => {
      const audio = audioRef.current;
      if (audio && duration) {
        const newTime = Math.max(0, audio.currentTime + seconds);
        audio.currentTime = Math.min(newTime, duration);
      }
    },
    [duration]
  );

  return (
    <Group gap="xs">
      <ActionIcon size="input-xs" variant="outline" onClick={() => seek(-10)}>
        <RotateCcwIcon size="1rem" />
      </ActionIcon>

      {!isPlaying ? (
        <ActionIcon size="input-xs" onClick={play}>
          <PlayIcon size="1rem" />
        </ActionIcon>
      ) : (
        <ActionIcon size="input-xs" onClick={pause}>
          <PauseIcon size="1rem" />
        </ActionIcon>
      )}

      <ActionIcon size="input-xs" variant="outline" onClick={stop}>
        <SquareIcon size="1rem" />
      </ActionIcon>

      <ActionIcon size="input-xs" variant="outline" onClick={() => seek(10)}>
        <RotateCwIcon size="1rem" />
      </ActionIcon>

      <ActionIcon
        size="input-xs"
        variant="outline"
        component="a"
        href={`/audio/${id}`}
        download
      >
        <DownloadIcon size="1rem" />
      </ActionIcon>
    </Group>
  );
}
