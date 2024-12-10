import { useKindeAuth } from "@kinde-oss/kinde-auth-react";
import {
  Box,
  Button,
  Center,
  Code,
  Container,
  CopyButton,
  Group,
  Modal,
  Space,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import {
  IconBolt,
  IconCode,
  IconCopy,
  IconExternalLink,
  IconHandFinger,
  IconPlus,
  IconSpeakerphone,
  IconSwitch,
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
  const [showRssUrlModal, setShowRssUrlModalOpen] = useState(false);

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
    <>
      <Box bg="white" py={40}>
        <Container>
          <Group gap={0}>
            <Title order={1}>Ecoutable</Title>

            <Space flex={1} />

            <Button
              leftSection={<IconPlus size="1rem" />}
              onClick={() => setShowAddUrlModalOpen(true)}
              mr={8}
            >
              Add article
            </Button>
            <Button
              variant="subtle"
              leftSection={<IconBolt size="1rem" />}
              onClick={() => setShowBookmarkUrlModalOpen(true)}
            >
              Link shortcut
            </Button>

            <Button
              variant="subtle"
              onClick={() => setShowRssUrlModalOpen(true)}
              color={"blue"}
              leftSection={<IconCode size="1rem" />}
            >
              RSS Feed
            </Button>

            <Button
              variant="subtle"
              onClick={logout}
              leftSection={<IconSwitch size="1rem" />}
            >
              Logout
            </Button>
          </Group>
        </Container>
      </Box>
      <Space h={40} />
      <Container>
        <Stack gap={40}>
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

        <Modal
          opened={showRssUrlModal}
          onClose={() => setShowRssUrlModalOpen(false)}
        >
          <Stack>
            <Text>
              Use this url to add your articles to your{" "}
              <b>RSS reader or podcast app</b>
            </Text>
            <Code p={20}>
              {import.meta.env.VITE_API_URL + "rss/" + data?.rssFeedUuid}
            </Code>
            <Group grow>
              <CopyButton
                value={
                  import.meta.env.VITE_API_URL + "rss/" + data?.rssFeedUuid
                }
              >
                {({ copied, copy }) => (
                  <Button
                    flex={1}
                    onClick={copy}
                    leftSection={<IconCode size="1rem" />}
                  >
                    {copied ? "Copied" : "Copy"}
                  </Button>
                )}
              </CopyButton>
              <Button
                flex={1}
                variant="outline"
                leftSection={<IconExternalLink size="1rem" />}
              >
                Open feed
              </Button>
            </Group>
          </Stack>
        </Modal>

        <AudioPlayerOverlay />
      </Container>
    </>
  );
};
