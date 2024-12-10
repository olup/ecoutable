import { ActionIcon, Box, Button, Group, Progress, Space } from "@mantine/core";
import {
  IconPlayerPause,
  IconPlayerPlay,
  IconPlayerSkipBack,
  IconPlayerSkipForward,
  IconPlayerStop,
  IconRewindBackward15,
  IconRewindForward15,
} from "@tabler/icons-react";
import { useState, useRef, FC, useEffect } from "react";

const AudioPlayer: FC<{ src: string; autoplay: Boolean }> = ({
  src,
  autoplay,
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  useEffect(() => {
    const updateProgress = () => {
      if (audioRef.current) {
        const currentTime = audioRef.current.currentTime;
        const duration = audioRef.current.duration || 0; // Avoid NaN
        setProgress((currentTime / duration) * 100); // Set progress as a percentage
      }
    };

    // Adding event listener for timeupdate
    const audioElement = audioRef.current;
    if (audioElement) {
      audioElement.addEventListener("timeupdate", updateProgress);
    }

    // Clean up the event listener on component unmount
    return () => {
      if (audioElement) {
        audioElement.removeEventListener("timeupdate", updateProgress);
      }
    };
  }, []);

  useEffect(() => {
    if (!autoplay || !audioRef || !src) return;
    audioRef.current?.play();
  }, [autoplay, audioRef, src]);

  const skipForward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.min(
        audioRef.current.duration,
        audioRef.current.currentTime + 10
      );
    }
  };

  const rewindBackward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(
        0,
        audioRef.current.currentTime - 10
      );
    }
  };

  return (
    <Box className="audio-player">
      <audio ref={audioRef} src={src} />
      <Group gap={2} align="center">
        <ActionIcon onClick={handlePlayPause}>
          {isPlaying ? (
            <IconPlayerPause size="1rem" />
          ) : (
            <IconPlayerPlay size="1rem" />
          )}
        </ActionIcon>
        <ActionIcon onClick={handleStop}>
          <IconPlayerStop size="1rem" />
        </ActionIcon>
        <Space w={10} />
        <ActionIcon onClick={rewindBackward}>
          <IconRewindBackward15 size="1rem" />
        </ActionIcon>
        <ActionIcon onClick={skipForward}>
          <IconRewindForward15 size="1rem" />
        </ActionIcon>
        <Space w={10} />
        <Progress value={progress} flex={1} radius={8} h={8} />
      </Group>
    </Box>
  );
};

export default AudioPlayer;
