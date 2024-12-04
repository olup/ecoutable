import ReactMarkdown from "react-markdown";
import { useParams } from "wouter";
import { trpc } from "../lib/trpc";
import { Container, Text } from "@mantine/core";
import { ReactNode } from "react";

const P = ({ children }: { children?: ReactNode }) => (
  <Text size="lg" c="dimmed" lh={1.5} mb={25}>
    {children}
  </Text>
);

export function ArticleView() {
  const { uuid } = useParams();
  const { data: article } = trpc.article.getOne.useQuery({ uuid: uuid! });

  console.log(article);

  return (
    <Container>
      <h1>{article?.title}</h1>
      <ReactMarkdown components={{ p: (props) => <P {...props} /> }}>
        {article?.markdownContent}
      </ReactMarkdown>
    </Container>
  );
}
