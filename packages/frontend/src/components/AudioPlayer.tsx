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
  const [isDownloading, setIsDownloading] = useState(false); // Track download state
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Use mutateAsync for promise-based handling and get isPending state
  // Define expected type for the mutation result, allowing null
  type GetAudioResult = { url: string } | null;

  const {
    data: audioData,
    mutateAsync: loadAudio,
    isPending: isLoadingAudio,
  } = useMutation<
    GetAudioResult, // Success return type
    Error, // Error type
    { articleId: string } // Variables type
  >({
    ...useOrpc.getAudio.mutationOptions(),
  });

  const initAudio = useCallback(
    (url?: string) => {
      const audioUrl = url || audioData?.url;
      // Prevent re-initialization if audioRef already exists and URL hasn't changed
      if (audioRef.current && audioRef.current.src === audioUrl) {
        return audioRef.current;
      }
      // Clean up previous instance if exists
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeEventListener("ended", () =>
          setIsPlaying(false)
        );
        audioRef.current.removeEventListener("loadedmetadata", () =>
          setDuration(audioRef.current?.duration ?? null)
        );
        audioRef.current = null;
      }

      if (audioUrl) {
        const audio = new Audio(audioUrl);
        audio.addEventListener("ended", () => {
          setIsPlaying(false);
        });
        audio.addEventListener("loadedmetadata", () => {
          setDuration(audio.duration);
        });
        audioRef.current = audio;
        return audio;
      }
      return null;
    },
    [audioData?.url]
  ); // Dependency on audioData.url ensures re-run if URL changes

  useEffect(() => {
    // Initialize audio if data is already available (e.g., from cache)
    if (audioData?.url) {
      initAudio(audioData.url);
    }
  }, [audioData?.url, initAudio]);

  useEffect(() => {
    // Cleanup function: pause audio and remove listeners when component unmounts
    return () => {
      if (audioRef.current) {
        const currentAudio = audioRef.current; // Capture current ref
        currentAudio.pause();
        // Ensure listeners are removed from the correct instance
        currentAudio.removeEventListener("ended", () => setIsPlaying(false));
        currentAudio.removeEventListener("loadedmetadata", () =>
          setDuration(currentAudio?.duration ?? null)
        );
        audioRef.current = null; // Clear the ref
      }
    };
  }, []); // Empty dependency array ensures this runs only on unmount

  const play = useCallback(async () => {
    let currentAudioDataUrl = audioData?.url;
    let audio = audioRef.current;

    // If no audio element or URL, fetch the data
    if (!audio || !currentAudioDataUrl) {
      try {
        const result = await loadAudio({ articleId: id });
        currentAudioDataUrl = result?.url;
        if (currentAudioDataUrl) {
          // Initialize audio with the newly fetched URL
          audio = initAudio(currentAudioDataUrl);
        }
      } catch (error) {
        console.error("Error loading audio for playback:", error);
        return; // Stop if loading failed
      }
    }

    if (!audio) {
      console.error("Audio element could not be initialized.");
      return; // Stop if audio couldn't be initialized
    }

    try {
      await audio.play();
      setIsPlaying(true);
    } catch (error) {
      // Ignore AbortError which can happen if play is interrupted
      if ((error as DOMException).name !== "AbortError") {
        console.error("Error playing audio:", error);
      }
    }
  }, [audioData?.url, loadAudio, id, initAudio]);

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
      // Check if audio exists and duration is a valid number > 0
      if (audio && typeof duration === "number" && duration > 0) {
        const newTime = Math.max(0, audio.currentTime + seconds);
        audio.currentTime = Math.min(newTime, duration);
      } else if (audio) {
        // If duration is not yet loaded, maybe try to load/play first?
        // Or simply do nothing / disable seek buttons until ready.
        console.warn("Seek attempted before audio duration was loaded.");
      }
    },
    [duration] // Depend on duration
  );

  const handleDownload = useCallback(async () => {
    setIsDownloading(true);
    try {
      let urlToDownload = audioData?.url;
      // If URL isn't available, fetch it
      if (!urlToDownload) {
        console.log("No URL found, fetching for download...");
        const result = await loadAudio({ articleId: id });
        urlToDownload = result?.url;
        console.log("Fetched URL:", urlToDownload);
      }

      if (urlToDownload) {
        // Create a temporary link to trigger the download (Reverted to avoid CORS)
        const link = document.createElement("a");
        link.href = urlToDownload;
        // Suggest a filename (browser might override)
        link.download = `audio_${id}.mp3`;
        document.body.appendChild(link); // Append link to body
        link.click(); // Programmatically click the link
        document.body.removeChild(link); // Remove link from body
        console.log("Download triggered for:", urlToDownload);
      } else {
        console.error("Failed to get audio URL for download");
        // TODO: Optionally show an error message to the user via notification/toast
      }
    } catch (error) {
      console.error("Error downloading audio:", error);
      // TODO: Optionally show an error message to the user
    } finally {
      setIsDownloading(false); // Ensure loader stops even if there's an error
    }
  }, [audioData?.url, loadAudio, id]); // Dependencies for the download handler

  // Determine if controls should be disabled (during initial load or download)
  const controlsDisabled = isLoadingAudio || isDownloading || !duration; // Also disable seek if duration unknown
  const playPauseDisabled = isLoadingAudio || isDownloading;

  return (
    <Group gap="xs">
      {/* Seek Backward Button */}
      <ActionIcon
        size="input-xs"
        variant="outline"
        onClick={() => seek(-10)}
        disabled={controlsDisabled}
      >
        <RotateCcwIcon size="1rem" />
      </ActionIcon>

      {/* Play/Pause Button */}
      {!isPlaying ? (
        <ActionIcon
          size="input-xs"
          onClick={play}
          loading={isLoadingAudio} // Simplified: Show loader only when mutation is pending
          disabled={playPauseDisabled}
        >
          <PlayIcon size="1rem" />
        </ActionIcon>
      ) : (
        <ActionIcon
          size="input-xs"
          onClick={pause}
          disabled={playPauseDisabled}
        >
          <PauseIcon size="1rem" />
        </ActionIcon>
      )}

      {/* Stop Button */}
      <ActionIcon
        size="input-xs"
        variant="outline"
        onClick={stop}
        disabled={controlsDisabled || !isPlaying}
      >
        <SquareIcon size="1rem" />
      </ActionIcon>

      {/* Seek Forward Button */}
      <ActionIcon
        size="input-xs"
        variant="outline"
        onClick={() => seek(10)}
        disabled={controlsDisabled}
      >
        <RotateCwIcon size="1rem" />
      </ActionIcon>

      {/* Download Button - Always visible */}
      <ActionIcon
        size="input-xs"
        variant="outline"
        onClick={handleDownload}
        loading={isDownloading} // Show loader specific to download action
        disabled={isLoadingAudio} // Disable if initial audio load is happening
        title="Download audio" // Add tooltip
      >
        {/* Conditionally render Loader based on isDownloading state */}
        {isDownloading ? <Loader size="xs" /> : <DownloadIcon size="1rem" />}
      </ActionIcon>
    </Group>
  );
}
