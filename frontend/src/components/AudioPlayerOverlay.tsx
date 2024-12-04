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
        left: 0,
        right: 0,
        bottom: 0,
        borderTop: "1px solid #ccc",
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
