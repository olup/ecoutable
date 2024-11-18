import { VercelRequest, VercelResponse } from '@vercel/node'
import { createArticle } from './services/article'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const url = req.query.url as string | undefined
  
  if (!url) {
    return res.status(400).json({ error: 'URL parameter is required' })
  }

  try {
    const article = await createArticle(url)
    return res.json({ success: true, articleId: article.id })
  } catch (error) {
    return res.status(500).json({ 
      error: 'Failed to process URL',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
