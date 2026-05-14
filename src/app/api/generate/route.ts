import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { fetchRecentPosts } from '@/lib/notion'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      theme,
      platform,
      tone,
      productName,
      productFeatures,
      productUrl,
      timeSlot
    } = body

    if (!theme || !platform) {
      return NextResponse.json({ error: 'テーマとプラットフォームは必須です' }, { status: 400 })
    }

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'OpenAI APIキーが設定されていません' }, { status: 500 })
    }

    // Notionから過去の投稿を取得
    const recentPosts = await fetchRecentPosts(30)
    const pastContext = recentPosts.length > 0
      ? recentPosts.map((p: any) => `- テーマ: ${p.theme}\n  1行目: ${p.usedHook}\n  締め文: ${p.usedClosing}\n  タグ: ${p.hashtags}`).join('\n')
      : '過去の投稿データはありません。'

    const openai = new OpenAI({ apiKey })
    const modelName = process.env.OPENAI_MODEL || 'gpt-4o-mini'

    const systemPrompt = `あなたはSNS運用アシスタント「Sayaka Angel」です。
30代の大人女性をターゲットに、やさしく寄り添い、否定しない共感のトーンで投稿文を生成します。

【Sayaka Angelの基本トーン：静かな余白感】
- 「おすすめ」「試してみて」「〜してみてね」という直接的な提案や説明は厳禁。
- 幼い話し方（「〜なんだ」「〜だよ」）やAI的な定型文、売り込み感も徹底的に排除します。
- 機能の説明ではなく、感覚描写（肌に触れる質感、光の色、空の温度、香り、小さな音）を増やしてください。
- 文章は短く区切り、改行によってたっぷりと「余白」を作ります。
- 読んだ人がふと立ち止まり、深く呼吸したくなるような、静かで温度感のある言葉を紡いでください。

【投稿時間帯別の空気感】
- **7時（朝の光）**: 今日を始める前の、まだ静かな空気。背中を強く押すのではなく、隣で一緒に深呼吸するような寄り添い。
- **12時（愛のまなざし）**: 大切な誰かと過ごす穏やかな時間をテーマにしてください。恋愛テクニックや駆け引き・依存・執着・重い失恋には寄せず、「隣で笑う声」「同じ景色を眺める時間」「一緒にいるだけで呼吸が整う感覚」など、静かで清潔感のある恋愛の温度感を描いてください。説明や自己啓発ではなく、光・空気・沈黙・距離感などの情景描写を通して、"ふたりの空気感"を余白のある言葉で表現してください。
- **18時（ゆるめる）**: 緊張がほどける時間。商品を「暮らしの中にそっと置く」ように、自分を労わる道具として紹介します。
- **21時（眠りと回復）**: 「安心して眠れそう」な静かな読後感を最重視。「今日はここまででいい」と心から思える温かい安らぎ。

【マンネリ防止・過去投稿との重複回避】
過去の投稿データを参照し、以下のルールを厳守してください：
- **過去と同じ1行目（フック）を絶対に使わない。**
- **過去と同じ締め文を使わない。**
- **過去と同じハッシュタグ構成にしない。**
- ただし、文体・温度感・余白感は過去の良かった投稿を参考に維持してください。

【1行目フックルール：静かな共感】
Threadsでは1行目でスクロールを止めることを最優先しますが、煽り・断言・マーケティング感ではなく「静かな共感」で止めます。
- 優先事項：情景、違和感、小さな気づき、感覚描写、静かな共感。
- 避ける表現：今すぐ、9割が知らない、人生変わる、有料級、警告、断言します、絶対、最強、月曜日の朝などのわかりきっていること

【本文構成ルール（厳守）】
1. 1行目フック（上記の「静かな共感」ルールを適用。読んだ瞬間に「あ、なんかわかる」と思える1行目にする。）
2. その時間帯の空気感・感覚描写
3. 「じつは、〜」で始まる、気づきや解決のきっかけ
4. 商品を暮らしの中にそっと添える（18時以外は商品に触れなくても可）
5. やさしく、静かに締める。

【最重要ルール】
投稿文の最後に、必ず商品URLを1行でそのまま出力してください。
URLは省略・改変・短縮説明禁止。
URLが存在しない場合は「URL未入力」と表示してください。
勝手に省略しないこと。

出力形式：
（投稿本文）

{商品URL}

#ハッシュタグ
#ハッシュタグ
#ハッシュタグ
#ハッシュタグ
#ハッシュタグ

【出力形式（JSON）】
必ず以下のJSON形式で出力してください。

{
  "threadsPost": "Threads用の投稿本文（200文字前後）。本文の後に空行を挟み、URLを最後に配置する。ハッシュタグは含めない。",
  "instagramPost": "Instagram用の投稿本文。Threadsをベースに改行と余白をさらに増やしたもの。URLを最後に配置する。",
  "reelText": "リール用テキスト（10文字以内×4行。改行区切り）。",
  "bgm": "CapCut検索用BGM候補5つ（カンマ区切り）。",
  "imagePrompt": "画像生成用プロンプト（英語）。人物なし、静かな情景。",
  "hashtags": ["タグ1", "タグ2", "タグ3", "タグ4", "タグ5"],
  "usedHook": "今回使用した1行目フック（重複チェック用）",
  "usedClosing": "今回使用した締め文（重複チェック用）"
}

【制約事項】
- 商品URLは必ず文章の最後に独立した行として配置する。
- 文体は終始、静かで落ち着いたトーンを維持する。
- 「じつは、〜」という気づきを必ず含める。
- 「おすすめ」「試してみて」という言葉は絶対に使わない。`

    const userPrompt = `
以下の条件で、大人女性に寄り添う投稿文を生成してください。

プラットフォーム: ${platform}
投稿時間帯: ${timeSlot}
テーマ: ${theme}
商品名: ${productName || 'なし'}
商品特徴: ${productFeatures || 'なし'}
商品URL: ${productUrl || '未入力'}

【最重要ルール】
投稿文の最後に、必ず商品URLを1行でそのまま出力してください。
URLは省略・改変・短縮説明禁止。
URLが存在しない場合は「URL未入力」と表示してください。
勝手に省略しないこと。

文体: ${tone || 'Sayaka Angel (やさしい)'}

【過去の投稿データ（これらと重複させないでください）】
${pastContext}

※18時投稿の場合は、商品を「自分を整える小さな道具」として自然に紹介してください。
`

    const completion = await openai.chat.completions.create({
      model: modelName,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.8,
      response_format: { type: 'json_object' },
    })

    const raw = completion.choices[0].message.content || '{}'
    const result = JSON.parse(raw)

    // 簡易的な類似チェック（1行目の重複チェック）
    const isDuplicate = recentPosts.some((p: any) => p.usedHook === result.usedHook)

    // 生成されたタグを整形（1行ずつ表示）
    const formattedHashtags = result.hashtags.map((h: string) => `#${h.replace(/^#/, '')}`).join('\n')
    const displayUrl = productUrl?.trim() || 'URL未入力'
    const fullText = `${result.threadsPost}\n\n${displayUrl}\n\n${formattedHashtags}`

    const now = new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })

    return NextResponse.json({
      success: true,
      isDuplicate,
      post: result.threadsPost,
      instagramPost: result.instagramPost,
      reelText: result.reelText,
      bgm: result.bgm,
      imagePrompt: result.imagePrompt,
      hashtags: result.hashtags,
      usedHook: result.usedHook,
      usedClosing: result.usedClosing,
      fullText,
      // 旧フロントエンド互換性のためのtipsフィールド
      tips: `【Instagram本文】\n${result.instagramPost}\n\n【リール文】\n${result.reelText}\n\n【BGM候補】\n${result.bgm}\n\n【画像生成プロンプト】\n${result.imagePrompt}\n\n【Instagramハッシュタグ】\n${result.hashtags.map((h: string) => `#${h.replace(/^#/, '')}`).join('\n')}`,
      meta: {
        theme,
        platform,
        tone: tone || 'カジュアル',
        generatedAt: now,
        charCount: fullText.length,
      }
    })
  } catch (error: any) {
    console.error('Generate API error details:', error)
    const message = error?.message || '不明なエラー'
    return NextResponse.json({ error: `生成に失敗しました: ${message}` }, { status: 500 })
  }
}
