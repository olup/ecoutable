import { useKindeAuth } from "@kinde-oss/kinde-auth-react";
import {
  Box,
  Button,
  Center,
  Container,
  CopyButton,
  Group,
  Modal,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import {
  IconCopy,
  IconHandFinger,
  IconPlus,
  IconSpeakerphone,
} from "@tabler/icons-react";
import { useEffect, useState } from "react";
import Article from "../components/Article";
import { AudioPlayerOverlay } from "../components/AudioPlayerOverlay";
import { trpc } from "../lib/trpc";

export const HomeView = () => {
  const { logout } = useKindeAuth();

  const [addUrl, setAddUrl] = useState("");
  const [showAddUrlModal, setShowAddUrlModalOpen] = useState(false);
  const [showBookmarkUrlModal, setShowBookmarkUrlModalOpen] = useState(false);

  const {
    data: articles,
    isFetching: isLoading,
    refetch,
  } = trpc.article.list.useQuery();

  const { mutate: add, isPending: isAdding } = trpc.article.add.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const { data } = trpc.user.getUserRssFeedUuid.useQuery();

  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const text = e.clipboardData?.getData("text");
      if (text?.startsWith("https://")) {
        setAddUrl(text);
        setShowAddUrlModalOpen(true);
      }
    };
    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, []);

  // check url param
  useEffect(() => {
    const urlParam = new URLSearchParams(window.location.search).get("url");
    if (urlParam) {
      setAddUrl(urlParam);
      setShowAddUrlModalOpen(true);
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  const onAddArticle = async () => {
    if (addUrl) await add({ url: addUrl });
    setShowAddUrlModalOpen(false);
    setAddUrl("");
  };

  return (
    <Container p={40}>
      <Stack gap={40}>
        <Center>
          <Title order={1}>
            Ecoutable
            <IconSpeakerphone
              size="1.4rem"
              style={{ transform: "translateY(-7px)" }}
            />
          </Title>
        </Center>
        <Center>
          <Group>
            <Button
              rightSection={<IconPlus size="1rem" />}
              onClick={() => setShowAddUrlModalOpen(true)}
            >
              Add article
            </Button>
            <Button onClick={() => setShowBookmarkUrlModalOpen(true)}>
              Link shortcut
            </Button>
            <CopyButton
              value={import.meta.env.VITE_API_URL + "rss/" + data?.rssFeedUuid}
            >
              {({ copied, copy }) => (
                <Button
                  onClick={copy}
                  color={copied ? "teal" : "blue"}
                  rightSection={<IconCopy size="1rem" />}
                >
                  {copied ? "Copied" : "Copy RSS Feed"}
                </Button>
              )}
            </CopyButton>
            <Button onClick={logout}>Logout</Button>
          </Group>
        </Center>

        {articles?.map((article) => (
          <Article key={article.uuid} article={article} />
        ))}
        {(isLoading || isAdding) && <Center>Loading</Center>}
      </Stack>

      <Modal
        opened={showAddUrlModal}
        onClose={() => {
          setAddUrl("");
          setShowAddUrlModalOpen(false);
        }}
        title="Add article"
      >
        <Stack>
          <TextInput
            value={addUrl}
            onChange={(e) => setAddUrl(e.target.value)}
            label="URL"
            placeholder="https://example.com"
          />
          <Group justify="right">
            <Button
              rightSection={<IconPlus size="1rem" />}
              onClick={onAddArticle}
            >
              Add
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Modal
        opened={showBookmarkUrlModal}
        onClose={() => {
          setShowBookmarkUrlModalOpen(false);
        }}
      >
        <Stack>
          <Box>
            <Text>Add a browser shortcut to save articles in ecoutable</Text>
            <Text>
              Simply <b>drag and drop</b> this link into your bookmarks
            </Text>
          </Box>
          <a
            href={`javascript:(function(){var currentUrl = window.location.href; var baseUrl = "${window.location.origin}"; var newUrl = baseUrl + '?url=' + encodeURIComponent(currentUrl); window.location.href = newUrl; })();`}
            target="_blank"
            style={{ textDecoration: "none" }}
          >
            <Button rightSection={<IconHandFinger size="1rem" />}>
              Listen to this article
            </Button>
          </a>
          <Text>Then just click on it while on an article page</Text>
        </Stack>
      </Modal>

      <AudioPlayerOverlay />
    </Container>
  );
};
