import ReactMarkdown from "react-markdown";
import { useLocation, useParams } from "wouter";
import { trpc } from "../lib/trpc";
import { Box, Button, Container, Text } from "@mantine/core";
import { ReactNode } from "react";
import { IconArrowLeft } from "@tabler/icons-react";

const P = ({ children }: { children?: ReactNode }) => (
  <Text size="lg" lh={1.5} mb={25}>
    {children}
  </Text>
);

export function ArticleView() {
  const { uuid } = useParams();
  const { data: article } = trpc.article.getOne.useQuery({ uuid: uuid! });
  const [, navigate] = useLocation();

  return (
    <Container py={40}>
      <Button
        variant="outline"
        leftSection={<IconArrowLeft size="1rem" />}
        onClick={() => navigate("/")}
        mb={40}
      >
        Go Back
      </Button>
      <Box p={40} bg="white">
        <h1>{article?.title}</h1>
        <ReactMarkdown
          components={{
            p: (props) => <P {...props} />,
            img: (props) => (
              <img
                {...props}
                style={{ maxHeight: "500px", margin: "0 auto" }}
              />
            ),
          }}
        >
          {article?.markdownContent}
        </ReactMarkdown>
      </Box>
    </Container>
  );
}
