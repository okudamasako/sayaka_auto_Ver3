export interface NotionPageData {
  theme: string
  threadsPost: string
  instagramPost: string
  reelText: string
  bgm: string
  imagePrompt: string
  hashtags: string
  productName: string
  productFeatures: string
  productUrl: string
  timeSlot: string
  evaluation?: string
  usedHook?: string
  usedClosing?: string
}

export async function saveToNotion(data: NotionPageData) {
  const apiKey = process.env.NOTION_API_KEY
  const databaseId = process.env.NOTION_DATABASE_ID

  if (!apiKey || !databaseId) {
    throw new Error('Notion API Key or Database ID is missing')
  }

  const now = new Date().toISOString()

  const response = await fetch('https://api.notion.com/v1/pages', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Notion-Version': '2022-06-28',
    },
    body: JSON.stringify({
      parent: { database_id: databaseId },
      properties: {
        'Name': {
          title: [{ text: { content: `${data.theme} (${data.timeSlot})` } }]
        },
        '投稿日時': {
          date: { start: now }
        },
        '投稿テーマ': {
          rich_text: [{ text: { content: data.theme } }]
        },
        'Threads投稿文': {
          rich_text: [{ text: { content: data.threadsPost } }]
        },
        'Instagram投稿文': {
          rich_text: [{ text: { content: data.instagramPost } }]
        },
        'Instagramリール文': {
          rich_text: [{ text: { content: data.reelText } }]
        },
        'BGM候補': {
          rich_text: [{ text: { content: data.bgm } }]
        },
        '画像生成プロンプト': {
          rich_text: [{ text: { content: data.imagePrompt } }]
        },
        'ハッシュタグ': {
          rich_text: [{ text: { content: data.hashtags } }]
        },
        '商品名': {
          rich_text: [{ text: { content: data.productName } }]
        },
        '商品URL': {
          url: data.productUrl || null
        },
        '投稿時間帯': {
          select: { name: data.timeSlot }
        },
        '評価メモ': {
          rich_text: [{ text: { content: data.evaluation || '' } }]
        },
        '使用済みフック': {
          rich_text: [{ text: { content: data.usedHook || '' } }]
        },
        '使用済み締め文': {
          rich_text: [{ text: { content: data.usedClosing || '' } }]
        }
      }
    })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Notion saving failed')
  }

  return await response.json()
}

/**
 * Notionから直近の投稿を取得する
 * @param limit 取得件数（デフォルト30件）
 */
export async function fetchRecentPosts(limit: number = 30) {
  const apiKey = process.env.NOTION_API_KEY
  const databaseId = process.env.NOTION_DATABASE_ID

  if (!apiKey || !databaseId) {
    console.error('Notion API Key or Database ID is missing')
    return []
  }

  try {
    const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({
        page_size: limit,
        sorts: [
          {
            property: '投稿日時',
            direction: 'descending'
          }
        ]
      })
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('Notion fetch error:', error)
      return []
    }

    const data = await response.json()
    
    // 必要なデータのみ抽出して返す
    return data.results.map((page: any) => {
      const props = page.properties
      return {
        theme: props['投稿テーマ']?.rich_text?.[0]?.plain_text || '',
        timeSlot: props['投稿時間帯']?.select?.name || '',
        threadsPost: props['Threads投稿文']?.rich_text?.[0]?.plain_text || '',
        hashtags: props['ハッシュタグ']?.rich_text?.[0]?.plain_text || '',
        usedHook: props['使用済みフック']?.rich_text?.[0]?.plain_text || '',
        usedClosing: props['使用済み締め文']?.rich_text?.[0]?.plain_text || '',
      }
    })
  } catch (error) {
    console.error('Notion fetch error:', error)
    return []
  }
}
