import { useAtomValue } from "jotai";
import { articlePlayingAtom } from "../store";
import { Box, Container, Flex, Text } from "@mantine/core";
import AudioPlayer from "./AudioPlayer";

export const AudioPlayerOverlay = () => {
  const articlePlaying = useAtomValue(articlePlayingAtom);

  if (!articlePlaying) {
    return null;
  }

  return (
    <Flex
      style={{
        position: "fixed",
        zIndex: 100,
        bottom: 10,
        borderRadius: 10,
        left: "50%",
        padding: 10,
        transform: "translateX(-50%)",
      }}
      bg="white"
      display="flex"
      justify="center"
    >
      <Box w={500} m={10}>
        <Text mb={10}>{articlePlaying.title}</Text>
        <AudioPlayer src={articlePlaying.textAudioUrl!} autoplay />
      </Box>
    </Flex>
  );
};
