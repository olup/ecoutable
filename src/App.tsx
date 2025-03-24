import React, { useEffect, useState } from "react";
import { trpc } from "./lib/trpc";
import {
  Container,
  Title,
  Card,
  Stack,
  Text,
  Button,
  Group,
  Badge,
} from "@mantine/core";
import { inferProcedureOutput } from "@trpc/server";
import { AppRouter } from "../functions/trpc/router";

type Article = inferProcedureOutput<
  AppRouter["_def"]["procedures"]["listArticles"]
>["articles"][number];

function App() {
  const [articles, setArticles] = useState<Article[]>([]);

  useEffect(() => {
    // Add paste event listener
    const handlePaste = async (e: ClipboardEvent) => {
      const text = e.clipboardData?.getData("text");
      if (text?.startsWith("https://")) {
        try {
          await trpc.addArticle.mutate(text);
          // Refresh articles list
          const response = await trpc.listArticles.query();
          setArticles(response.articles);
        } catch (error) {
          console.error("Failed to add article:", error);
        }
      }
    };

    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, []);

  useEffect(() => {
    trpc.listArticles.query().then((response) => {
      setArticles(response.articles);
    });
  }, []);

  return (
    <Container>
      <Stack>
        <Title order={2}>Articles</Title>
        <Group>
          <Button>Add bookmark to browser</Button>
        </Group>
        {articles.map((article) => (
          <Card key={article.uuid} shadow="sm" padding="lg" withBorder>
            <Title order={3}>{article.title}</Title>
            <Text size="sm" c="dimmed">
              {article.url}
            </Text>
            <Badge size="sm" radius="sm">
              {article.status}
            </Badge>
            {article.summary && (
              <Text mt="sm" size="sm" c="dimmed">
                {article.summary}
              </Text>
            )}
            {article.fullLengthAudioUrl && (
              <audio src={"/files/" + article.fullLengthAudioUrl} controls />
            )}
          </Card>
        ))}
      </Stack>
    </Container>
  );
}

export default App;
