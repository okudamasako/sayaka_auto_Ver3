import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { fetchRecentPosts } from '@/lib/notion'

type TimeSlotKey = 'morning' | 'noon' | 'evening' | 'night' | 'other'

function detectTimeSlotKey(timeSlot?: string): TimeSlotKey {
  const value = String(timeSlot || '').trim().toLowerCase()

  if (value.includes('12') || value.includes('昼') || value.includes('noon') || value.includes('lunch')) {
    return 'noon'
  }
  if (value.includes('7') || value.includes('朝') || value.includes('morning')) {
    return 'morning'
  }
  if (value.includes('18') || value.includes('夕') || value.includes('evening')) {
    return 'evening'
  }
  if (value.includes('21') || value.includes('夜') || value.includes('night')) {
    return 'night'
  }

  return 'other'
}

function formatRecentPosts(recentPosts: any[]) {
  return recentPosts.length > 0
    ? recentPosts.map((p: any) => `- テーマ: ${p.theme}\n  投稿日: ${p.postedAt}\n  1行目: ${p.usedHook}\n  締め文: ${p.usedClosing}\n  リール文: ${p.reelText}\n  タグ: ${p.hashtags}`).join('\n')
    : '過去の投稿データはありません。'
}

function buildBaseJsonRule() {
  return `
【出力形式（JSON厳守）】
説明文やMarkdownを付けず、必ず以下のJSONだけを返してください。

{
  "threadsPost": "Threads用の投稿本文。ハッシュタグは含めない。URLも含めない。",
  "instagramPost": "Instagram用の投稿本文。Threadsをベースに改行と余白を増やす。URLもハッシュタグも含めない。",
  "reelText": "リール用テキスト。10文字以内×4行。改行区切り。",
  "bgm": "CapCut検索用BGM候補5つ。カンマ区切り。",
  "imagePrompt": "画像生成用プロンプト。英語。文字なし。",
  "hashtags": ["タグ1", "タグ2", "タグ3", "タグ4", "タグ5"],
  "usedHook": "今回使用した1行目フック",
  "usedClosing": "今回使用した締め文"
}

【JSON共通ルール】
- threadsPost と instagramPost にはURLを入れない。
- hashtags は必ず5個。
- hashtags の各要素には # を付けない。
- usedHook は threadsPost の1行目と一致させる。
- usedClosing は threadsPost の最後の一文と一致させる。
`
}

function buildCommonRules() {
  return `
あなたはSNS運用アシスタント「Sayaka Angel」です。
少し疲れている大人女性に向けて、静かで余白のある投稿文を作ります。

【基本トーン】
- 売り込み・説教・上から目線は禁止。
- 「おすすめ」「試してみて」「〜してみてね」は禁止。
- 幼い話し方（「〜なんだ」「〜だよ」）は禁止。
- 煽り、断言、マーケティング臭は禁止。
- 文章は短く区切り、改行で余白を作る。
- 抽象語より、実際の行動・音・温度・手触り・光・匂いを優先する。

【重複回避】
- 過去と同じ1行目を使わない。
- 過去と同じ締め文を使わない。
- 過去と同じリール文を使わない。
- 直近2日以内と似た空気感・単語・構図を避ける。

【曜日テーマの扱い】
- テーマに曜日が入っていても、本文やタグに曜日名を固定で入れない。
- #月曜日 #火曜日 #水曜日 #木曜日 #金曜日 #土曜日 #日曜日 は禁止。
- #週末 #平日 #休日 も多用しない。

【頻出ワード禁止】
以下を量産しない。特に1行目・締め文・リール文では避ける。
- 静かな
- やさしい
- 穏やかな
- 今日をほどく
- 深呼吸
- 光が差し込む
- 窓辺
- 余白
- 夜更け
- 朝の光
- 静かな朝
- 静かな昼
- 静かな夜
- 静かな時間

【商品ルール】
- 商品名や商品特徴がある場合も、機能説明ではなく生活の中の感覚として扱う。
- 商品を擬人化しない。
- 「心に寄り添う」「そっと寄り添う」「暮らしを整える」「大切な時間を支える」は禁止。
`
}

function buildNoonPrompt() {
  return `
${buildCommonRules()}

あなたはこれから【12時投稿】だけを作ります。
12時投稿は、他の時間帯のルールと完全に分離します。
7時・18時・21時の「ひとり時間」「暮らし」「癒し」「整える」方向には絶対に寄せないでください。

【12時投稿の核】
- テーマは「大切な人との時間」。
- 恋人、夫婦、家族、友人など、自分以外の誰かとの関係を描く。
- ただし「好き」「愛」「大切」「幸せ」などの感情語で説明しない。
- 情景、会話、仕草、距離感、沈黙、視線、手元、歩幅、声の温度だけで描く。
- 読者に意味を説明せず、情景だけで終わる。

【12時本文構成】
1. 1行目：人との距離感が見える情景で始める。
2. 2〜4行目：短い会話、仕草、同じ景色、沈黙、歩幅などを描く。
3. 最後：意味説明をせず、場面の余韻だけで終える。

【12時で絶対に禁止する構成】
- 「じつは、〜」を使わない。
- 気づき、解決、教訓を書かない。
- 読者への提案を書かない。
- 「〜かもしれません」を使わない。
- 「〜ことがあります」を使わない。
- 「〜してくれる」を使わない。
- 「〜を与えてくれる」を使わない。
- 「日常を豊かに」系の締めを書かない。

【12時で絶対に禁止する単語】
以下の語は本文・リール文・ハッシュタグに絶対に入れない。
窓、窓辺、花、花瓶、カップ、マグカップ、テーブル、ノート、彩り、豊か、喜び、嬉しさ、幸せ、癒し、心、気持ち、日常、暮らし、穏やか、気づく、整える、特別、大切な時間、温まる、満たされる

【12時で使ってよい描写要素】
- 駅のホーム
- バス停
- 横断歩道
- 並んだ靴
- 片方だけ早い歩幅
- 何気ない会話
- 短い返事
- 目が合わないまま笑う
- 手渡された飲み物
- 同じ看板を見る
- 肩が少し触れる距離
- スマホ画面を一緒にのぞく
- 返事の前の沈黙
- 食器の音
- ドアを押さえる手
- 改札前の数秒

【12時画像プロンプト】
- 人物なし。
- ただし「ふたりがいた気配」は出してよい。
- 例：駅のベンチに並んだ荷物、並んだ靴、テイクアウトの紙袋が2つ、ベンチに置かれた2枚のチケット。
- 禁止：窓、花、花瓶、カップ、マグカップ、テーブル、ノート。
- 文字を入れない。

${buildBaseJsonRule()}
`
}

function buildNonNoonPrompt(slotKey: TimeSlotKey) {
  const slotRule = slotKey === 'morning'
    ? `
【7時投稿】
- 今日を始める前の空気。
- ひとりの朝を描く。
- 恋愛、ふたり、誰かとの親密な関係は主題にしない。
- 強い励ましではなく、ゆっくり立ち上がる感覚にする。
`
    : slotKey === 'evening'
      ? `
【18時投稿】
- 一日の緊張がゆるむ時間。
- 服・小物・美容などの商品がある場合は、説明ではなく身につけた時の質感で描く。
- 恋愛、ふたり、誰かとの親密な関係は主題にしない。
`
      : slotKey === 'night'
        ? `
【21時投稿】
- 一日の終わり、眠りと回復に向かう時間。
- 親密な恋愛描写は禁止。
- ひとりで眠る前の安心感を描く。
`
        : `
【通常投稿】
- 指定された時間帯の空気感に合わせる。
- 恋愛やふたりの関係は、12時以外では主題にしない。
`

  return `
${buildCommonRules()}

${slotRule}

【12時以外の禁止】
- 恋人、夫婦、ふたり、大切な人、隣にいる人、同じ景色を見る、共にいる、など恋愛を想起させる表現は禁止。
- 12時専用の恋愛・関係性描写を混ぜない。

【本文構成】
1. 1行目：静かな共感、情景、違和感、小さな感覚で始める。
2. その時間帯の空気感を描く。
3. 必要な場合のみ「じつは、〜」で小さな気づきを入れてよい。
4. 商品がある場合は、生活の中に自然に置く。
5. やさしく静かに締める。

【禁止表現】
小さな道具、その存在、心に寄り添う、そっと寄り添う、暮らしを整える、大切な時間を支える、〇〇のひとつ、特別な時間、自分らしい時間、幸せが漂う、優しく包み込む

【画像プロンプト】
- 人物なし。
- 文字なし。
- 毎回同じ構図を避ける。
- 窓辺、カーテン、テーブル、マグカップ、ベッド、ソファ、読書、花瓶、朝日、夜景を連続使用しない。
- 洗面台、廊下、玄関、雨上がり、キッチン、木漏れ日、バスタイム後、白いシーツ、古い本、小さな照明、街の灯り、靴を脱いだ瞬間、湯気、柔らかい布、曇ったガラス、夕方の影などから分散する。

${buildBaseJsonRule()}
`
}

function buildUserPrompt(params: {
  platform: string
  timeSlot: string
  theme: string
  productName?: string
  productFeatures?: string
  productUrl?: string
  tone?: string
  pastContext: string
  slotKey: TimeSlotKey
}) {
  const {
    platform,
    timeSlot,
    theme,
    productName,
    productFeatures,
    productUrl,
    tone,
    pastContext,
    slotKey,
  } = params

  const noonReminder = slotKey === 'noon'
    ? `
【12時最終確認】
今回の投稿は12時投稿です。
以下が1つでも入ったら失敗です。
- じつは
- 窓
- 花
- 花瓶
- カップ
- テーブル
- ノート
- 心
- 気持ち
- 豊か
- 彩り
- 嬉しさ
- 喜び
- 暮らし
- 日常
- 穏やか
- 〜かもしれません
- 〜ことがあります
- 〜してくれる
- 意味説明
- 感情説明
- 教訓
`
    : ''

  return `
以下の条件で投稿文を生成してください。

プラットフォーム: ${platform}
投稿時間帯: ${timeSlot}
テーマ: ${theme}
商品名: ${productName || 'なし'}
商品特徴: ${productFeatures || 'なし'}
商品URL: ${productUrl || '未入力'}
文体: ${tone || 'Sayaka Angel'}

${noonReminder}

【過去の投稿データ】
これらと重複させないでください。
${pastContext}
`
}

function normalizeHashtags(rawHashtags: unknown): string[] {
  const hashtagsArray: string[] = Array.isArray(rawHashtags)
    ? rawHashtags.map(String)
    : typeof rawHashtags === 'string'
      ? rawHashtags.split(/[\s,、　]+/).filter(Boolean)
      : []

  return hashtagsArray
    .map((h: string) => h.replace(/^#/, '').trim())
    .filter(Boolean)
    .slice(0, 5)
}

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
      timeSlot,
    } = body

    if (!theme || !platform) {
      return NextResponse.json({ error: 'テーマとプラットフォームは必須です' }, { status: 400 })
    }

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'OpenAI APIキーが設定されていません' }, { status: 500 })
    }

    const recentPosts = await fetchRecentPosts(30)
    const pastContext = formatRecentPosts(recentPosts)

    const openai = new OpenAI({ apiKey })
    const modelName = process.env.OPENAI_MODEL || 'gpt-4o-mini'
    const slotKey = detectTimeSlotKey(timeSlot)

    const systemPrompt = slotKey === 'noon'
      ? buildNoonPrompt()
      : buildNonNoonPrompt(slotKey)

    const userPrompt = buildUserPrompt({
      platform,
      timeSlot,
      theme,
      productName,
      productFeatures,
      productUrl,
      tone,
      pastContext,
      slotKey,
    })

    console.log('=== Sayaka prompt debug ===')
    console.log('timeSlot:', timeSlot)
    console.log('slotKey:', slotKey)
    console.log('systemPrompt includes noon strict rules:', systemPrompt.includes('12時最終確認') || systemPrompt.includes('12時投稿の核'))
    console.log('=== End Sayaka prompt debug ===')

    const completion = await openai.chat.completions.create({
      model: modelName,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: slotKey === 'noon' ? 0.55 : 0.75,
      response_format: { type: 'json_object' },
    })

    const raw = completion.choices[0].message.content || '{}'
    const result = JSON.parse(raw)

    const hashtagsArray = normalizeHashtags(result.hashtags)
    const isDuplicate = recentPosts.some((p: any) => p.usedHook === result.usedHook)

    const formattedHashtags = hashtagsArray.map((h: string) => `#${h}`).join('\n')
    const displayUrl = productUrl?.trim() || 'URL未入力'

    const threadsPost = String(result.threadsPost || '').trim()
    const instagramPost = String(result.instagramPost || '').trim()
    const fullText = `${threadsPost}\n\n${displayUrl}\n\n${formattedHashtags}`

    const now = new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })

    return NextResponse.json({
      success: true,
      isDuplicate,
      post: threadsPost,
      instagramPost,
      reelText: result.reelText || '',
      bgm: result.bgm || '',
      imagePrompt: result.imagePrompt || '',
      hashtags: hashtagsArray,
      usedHook: result.usedHook || '',
      usedClosing: result.usedClosing || '',
      fullText,
      tips: `【Instagram本文】\n${instagramPost}\n\n${displayUrl}\n\n【リール文】\n${result.reelText || ''}\n\n【BGM候補】\n${result.bgm || ''}\n\n【画像生成プロンプト】\n${result.imagePrompt || ''}\n\n【Instagramハッシュタグ】\n${formattedHashtags}`,
      meta: {
        theme,
        platform,
        tone: tone || 'Sayaka Angel',
        timeSlot,
        slotKey,
        generatedAt: now,
        charCount: fullText.length,
      },
    })
  } catch (error: any) {
    console.error('Generate API error details:', error)
    const message = error?.message || '不明なエラー'
    return NextResponse.json({ error: `生成に失敗しました: ${message}` }, { status: 500 })
  }
}
