import {
  ActionIcon,
  Box,
  Button,
  Card,
  Container,
  Group,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AudioPlayer } from "./components/AudioPlayer";
import { useOrpc } from "./orpc";
import { TrashIcon } from "lucide-react";

function App() {
  const [url, setUrl] = useState("");

  const { mutateAsync: deleteArticle } = useMutation({
    ...useOrpc.deleteArticle.mutationOptions(),
    onSettled: () => refetch(),
  });

  const { mutateAsync: addArticle, isPending } = useMutation({
    ...useOrpc.addArticle.mutationOptions(),
    onSettled: () => {
      refetch();
      setUrl("");
    },
  });

  const { data, refetch } = useQuery({
    ...useOrpc.getArticles.queryOptions(),
    // Poll every 2 seconds while articles are being processed
    refetchInterval: isPending ? 2000 : false,
  });

  const onAddArticle = async () => {
    await addArticle({ url });
  };
  return (
    <Container my="md">
      <Stack>
        <Group>
          <TextInput
            placeholder="Article URL"
            flex={1}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <Button loading={isPending} onClick={onAddArticle}>
            Add
          </Button>
        </Group>

        <Stack>
          {data
            ?.sort(
              (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
            )
            .map((article) => (
              <Card withBorder key={article.id} shadow="xs">
                <Stack>
                  <Box>
                    <Group justify="space-between">
                      <Text flex={1}>{article.title}</Text>

                      <ActionIcon
                        color="red"
                        size="xs"
                        variant="subtle"
                        onClick={() => deleteArticle({ articleId: article.id })}
                      >
                        <TrashIcon size="1rem" />
                      </ActionIcon>
                    </Group>
                    <Text c="gray">{article.url}</Text>
                  </Box>
                  {article.status === "AUDIO_GENERATED" && (
                    <AudioPlayer id={article.id} />
                  )}
                </Stack>
              </Card>
            ))}
        </Stack>
      </Stack>
    </Container>
  );
}

export default App;
