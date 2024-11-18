import React, { useEffect, useState } from 'react'
import { trpc } from './lib/trpc'
import { Container, Title, Card, Stack, Text, Button } from '@mantine/core'
import { Route, Switch, useLocation } from 'wouter'

function ArticleList() {
  const [articles, setArticles] = useState<any[]>([])

  useEffect(() => {
    trpc.listArticles.query().then(setArticles)
  }, [])

  return (
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
  )
}

function ShareRoute() {
  const [, setLocation] = useLocation()
  const [url, setUrl] = useState(() => {
    const params = new URLSearchParams(window.location.search)
    return params.get('url') || ''
  })

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const urlParam = params.get('url')
    if (urlParam) {
      trpc.addArticle.mutate(urlParam)
        .then(() => setLocation('/'))
    }
  }, [setLocation])

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText()
      setUrl(text)
      trpc.addArticle.mutate(text)
        .then(() => setLocation('/'))
    } catch (err) {
      console.error('Failed to read clipboard:', err)
    }
  }

  return (
    <Stack align="center" gap="md">
      <Text>Paste a URL to process it</Text>
      <Button onClick={handlePaste}>Paste URL</Button>
    </Stack>
  )
}

function App() {
  return (
    <Container>
      <Title order={1}>Articles</Title>
      <Switch>
        <Route path="/share" component={ShareRoute} />
        <Route path="/" component={ArticleList} />
      </Switch>
    </Container>
  )
}

export default App
