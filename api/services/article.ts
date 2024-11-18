import { EdgeTTS } from 'node-edge-tts'
import { put } from '@vercel/blob'
import { readFile } from 'fs/promises'
import OpenAI from 'openai'
import { db } from '../db'
import { articles } from '../db/schema'
import { eq } from 'drizzle-orm'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function processArticle(url: string) {
  // Get markdown from Jina
  const jinaResponse = await fetch(`https://r.jina.ai/${url}`)
  if (!jinaResponse.ok) {
    throw new Error(`Jina API error: ${jinaResponse.statusText}`)
  }
  const markdown = await jinaResponse.text()

  // Get summary from OpenAI
  const completion = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      { role: "system", content: "Summarize the following text concisely:" },
      { role: "user", content: markdown }
    ]
  })
  const summary = completion.choices[0]?.message?.content || ''

  // Convert to speech
  const tts = new EdgeTTS()
  const tempPath = `/tmp/speech-${Date.now()}.mp3`
  await tts.ttsPromise(markdown, tempPath)
  const audioBuffer = await readFile(tempPath)

  // Store audio in Vercel Blob
  const blob = await put(`articles/${Date.now()}.mp3`, audioBuffer, {
    access: 'public',
    contentType: 'audio/mpeg'
  })

  return {
    url,
    markdown,
    audioPath: blob.url,
    summary
  }
}

export async function createArticle(url: string) {
  // Create article in pending state
  const [article] = await db.insert(articles).values({
    url,
    markdown: '',
    status: 'pending'
  }).returning()

  // Process article asynchronously
  processArticle(url).then(async (articleData) => {
    await db.update(articles)
      .set({
        ...articleData,
        status: 'processed'
      })
      .where(eq(articles.id, article.id))
  }).catch(async (error) => {
    await db.update(articles)
      .set({ status: 'error' })
      .where(eq(articles.id, article.id))
    console.error('Error processing article:', error)
  })

  return article
}
