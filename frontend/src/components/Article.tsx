import {
  ActionIcon,
  Button,
  Card,
  CardSection,
  Group,
  Space,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { IconPlayerPlay, IconTrash, IconWand } from "@tabler/icons-react";
import { useSetAtom } from "jotai";
import { FC } from "react";
import { useLocation } from "wouter";
import { trpc } from "../lib/trpc";
import { articlePlayingAtom } from "../store";
import { ArticleType } from "../types";

const Article: FC<{ article: ArticleType }> = ({ article }) => {
  const setArticlePlaying = useSetAtom(articlePlayingAtom);
  const utils = trpc.useUtils();
  const { mutate: generate, isPending: isGenerating } =
    trpc.article.audioGeneration.useMutation({
      onSuccess: () => {
        utils.article.list.invalidate();
      },
    });
  const { mutate: deleteArticle, isPending: isDeleting } =
    trpc.article.delete.useMutation({
      onSuccess: () => {
        utils.article.list.invalidate();
      },
    });

  const [, setLocation] = useLocation();

  return (
    <Card key={article.uuid} shadow="sm" padding="lg" radius="md">
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
              loading={isGenerating}
            >
              Generate Audio
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => setLocation("/article/" + article.uuid)}
          >
            Read
          </Button>
          <Space flex={1} />
          <ActionIcon
            size="input-sm"
            variant="subtle"
            color="red"
            onClick={() => deleteArticle({ id: article.uuid })}
            loading={isDeleting}
          >
            <IconTrash size="1rem" />
          </ActionIcon>
        </Group>
      </CardSection>
    </Card>
  );
};

export default Article;
