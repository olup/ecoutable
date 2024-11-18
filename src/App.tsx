import React, { useEffect, useState } from 'react'
import { trpc } from './lib/trpc'
import { Container, Title, Card, Stack, Text } from '@mantine/core'

function App() {
  const [articles, setArticles] = useState<any[]>([])

  useEffect(() => {
    trpc.listArticles.query().then(setArticles)
  }, [])

  return (
    <Container>
      <Title order={1}>Articles</Title>
      <Stack>
        {articles.map(article => (
          <Card key={article.id} shadow="sm" padding="lg">
            <Title order={3}>{article.url}</Title>
            <Text size="sm" c={article.status === 'error' ? 'red' : 'dimmed'}>
              Status: {article.status}
            </Text>
            {article.summary && (
              <Text mt="sm" size="sm" c="dimmed">
                {article.summary}
              </Text>
            )}
            {article.audioPath && (
              <audio controls src={article.audioPath} />
            )}
          </Card>
        ))}
      </Stack>
    </Container>
  )
}

export default App
