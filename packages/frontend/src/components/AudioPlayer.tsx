import { ActionIcon, Group, Loader } from "@mantine/core";
import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useOrpc } from "../orpc";
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

  const { data: audioData, mutate: loadAudio } = useMutation({
    ...useOrpc.getAudio.mutationOptions(),
  });

  const initAudio = useCallback(() => {
    if (!audioRef.current && audioData?.url) {
      const audio = new Audio(audioData.url);
      audio.addEventListener("ended", () => {
        setIsPlaying(false);
      });
      audio.addEventListener("loadedmetadata", () => {
        setDuration(audio.duration);
      });
      audioRef.current = audio;
    }
    return audioRef.current;
  }, [audioData?.url]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const play = useCallback(async () => {
    if (!audioData?.url) {
      await loadAudio({ articleId: id });
    }
    const audio = initAudio();
    if (!audio) return;

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

      {audioData?.url ? (
        <ActionIcon
          size="input-xs"
          variant="outline"
          component="a"
          href={audioData.url}
          download
          onClick={async (e) => {
            if (!audioData.url) {
              e.preventDefault();
              await loadAudio({ articleId: id });
            }
          }}
        >
          <DownloadIcon size="1rem" />
        </ActionIcon>
      ) : (
        <Loader size="xs" />
      )}
    </Group>
  );
}
