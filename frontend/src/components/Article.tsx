import {
  Button,
  Card,
  CardSection,
  Group,
  Space,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { IconPlayerPlay, IconWand } from "@tabler/icons-react";
import { useAtom } from "jotai";
import { FC } from "react";
import { trpc } from "../lib/trpc";
import { articlePlayingAtom } from "../store";
import { ArticleType } from "../types";
import { useLocation } from "wouter";

const Article: FC<{ article: ArticleType }> = ({ article }) => {
  const [articlePlaying, setArticlePlaying] = useAtom(articlePlayingAtom);
  const utils = trpc.useUtils();
  const { mutate: generate, isLoading: isGenerating } =
    trpc.article.audioGeneration.useMutation({
      onSuccess: () => {
        utils.article.list.invalidate();
      },
    });

  const [, setLocation] = useLocation();

  return (
    <Card key={article.uuid} shadow="sm" padding="lg" withBorder>
      <Stack>
        <Title order={3}>{article.title}</Title>
        <Text size="sm" c="dimmed">
          {article.url}
        </Text>
      </Stack>
      <Space h={20} />
      <CardSection withBorder inheritPadding py="md">
        <Group>
          {article.textAudioUrl && (
            <Button
              onClick={() => setArticlePlaying(article)}
              leftSection={<IconPlayerPlay size="1rem" />}
            >
              Play
            </Button>
          )}

          {article.status === "processing" && (
            <Button onClick={() => setArticlePlaying(article)} disabled>
              Generating
            </Button>
          )}
          {article.status === "error" && (
            <>
              <Text color="red">Error generating audio</Text>
              <Button
                onClick={() => generate({ articleUuid: article.uuid })}
                rightSection={<IconWand size="1rem" />}
                variant="outline"
                color="yellow"
              >
                Retry
              </Button>
            </>
          )}
          {article.status === "pending" && (
            <Button
              onClick={() => generate({ articleUuid: article.uuid })}
              rightSection={<IconWand size="1rem" />}
            >
              Generate Audio
            </Button>
          )}
          <Button onClick={() => setLocation("/article/" + article.uuid)}>
            Read
          </Button>
        </Group>
      </CardSection>
    </Card>
  );
};

export default Article;
