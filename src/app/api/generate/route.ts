import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { fetchRecentPosts } from '@/lib/notion'

/* =========================================================
 * 型定義
 * =======================================================*/
type TimeSlotKey = 'morning' | 'noon' | 'evening' | 'night' | 'other'

/* =========================================================
 * 時間帯判定
 * =======================================================*/
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

/* =========================================================
 * 12時の禁止トークン（ハード）
 *  - 出力後に機械検査する。誤検知を避けるため
 *    多くは2文字以上のフレーズに限定し、単漢字(心/花/窓)は
 *    ソフト扱いとしてプロンプト側に任せる。
 * =======================================================*/
const NOON_HARD_BANNED: string[] = [
  'じつは',
  '気づき',
  '気づい',
  '気づく',
  '教訓',
  '学び',
  '癒し',
  '豊か',
  '彩り',
  '嬉しさ',
  '喜び',
  '幸せ',
  '大切な時間',
  '日常を彩',
  '日常を豊か',
  'かもしれません',
  'ことがあります',
  'してくれる',
  '与えてくれる',
]

/* =========================================================
 * 12時の情景モチーフ（プール）
 *  - 毎リクエストでシャッフルして部分集合だけ提示し、
 *    先頭固定アンカー（靴・洗濯物）への偏りを防ぐ。
 *  - 恒久的なモチーフ重複回避には Notion 側に sceneMotif 列を
 *    追加し、過去分を avoid リストへ渡すのが理想（後述）。
 * =======================================================*/
const NOON_MOTIF_POOL: string[] = [
  '玄関にそろえられた大小の靴',
  '半分だけ残された昼食',
  '廊下に置かれたままの荷物',
  '物干しに並んだ大小の洗濯物',
  '食べかけのまま伏せられた箸',
  '冷蔵庫に貼られた短いメモ',
  '階段の途中に置かれた本',
  '半分開いたふすまから差す影',
  '畳に並んだ二つの座布団',
  '留守番電話の短い伝言',
  '読みかけのまま置かれた新聞',
  '片づけ途中の食器の音',
  '畳まれずに重ねられた上着',
  '時計の秒針だけが響く室内',
  '誰かが入れたばかりの番茶の湯気',
  '帰り際に脱いだままの上着の形',
]

function pickNoonMotifs(count: number): string[] {
  const pool = [...NOON_MOTIF_POOL]
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  return pool.slice(0, Math.min(count, pool.length))
}

/* =========================================================
 * 過去投稿の整形（重複回避用）
 * =======================================================*/
function formatRecentPosts(recentPosts: any[]) {
  return recentPosts.length > 0
    ? recentPosts
        .map(
          (p: any) =>
            `- テーマ: ${p.theme}\n  投稿日: ${p.postedAt}\n  1行目: ${p.usedHook}\n  締め文: ${p.usedClosing}\n  リール文: ${p.reelText}\n  タグ: ${p.hashtags}`
        )
        .join('\n')
    : '過去の投稿データはありません。'
}

/* =========================================================
 * JSON出力ルール（全時間帯共通・出力形式は従来どおり維持）
 * =======================================================*/
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
- usedHook は threadsPost の1行目と一字一句一致させる。
- usedClosing は threadsPost の最後の一文と一字一句一致させる。
`
}

/* =========================================================
 * 共通ルール（全時間帯共通）
 *  - 本文構成「じつは／気づき」はここに含めない（時間帯側へ分離）。
 *  - 頻出ワードのソフト禁止は全時間帯で有効（前版で欠落していた分を復活）。
 * =======================================================*/
function buildCommonRules() {
  return `
あなたはSNS運用アシスタント「Sayaka Angel」です。
少し疲れている大人女性に向けて、余白のある投稿文を作ります。

【基本トーン】
- 売り込み・説教・上から目線は禁止。
- 「おすすめ」「試してみて」「〜してみてね」は禁止。
- 幼い話し方（「〜なんだ」「〜だよ」）は禁止。
- 煽り、断言、マーケティング臭は禁止。
- 文章は短く区切り、改行で余白を作る。
- 抽象語より、実際の行動・音・温度・手触り・光・匂いを優先する。

【頻出ワードのソフト禁止（多用しない）】
次の語を毎回のように使わない。特に1行目・締め文・リール文では避ける。
静かな / やさしい / 穏やかな / 今日をほどく / 深呼吸 / 光が差し込む / 余白 /
夜更け / 朝の光 / 静かな朝 / 静かな昼 / 静かな夜 / 静かな時間

【重複回避】
- 過去と同じ1行目を使わない。
- 過去と同じ締め文を使わない。
- 過去と同じリール文を使わない。
- 直近2日以内と似た空気感・単語・構図を避ける。

【曜日テーマの扱い】
- テーマに曜日が入っていても、本文やタグに曜日名を固定で入れない。
- #月曜日 #火曜日 #水曜日 #木曜日 #金曜日 #土曜日 #日曜日 は禁止。
- #週末 #平日 #休日 も多用しない。

【商品ルール（全時間帯共通）】
- 商品名や商品特徴がある場合も、機能説明ではなく生活の中の感覚として扱う。
- 商品を擬人化しない。
- 「心に寄り添う」「そっと寄り添う」「暮らしを整える」「大切な時間を支える」は禁止。
`
}

/* =========================================================
 * 12時専用ルール（完全分離・独立プロンプト）
 *  - 感情ではなく情景だけ。解釈は読者に委ねる。
 *  - 文体の参照を「短い散文」に固定し、恋愛文体を誘発しない。
 *  - モチーフは毎回ローテーションしたサブセットだけ提示。
 * =======================================================*/
function buildNoonRules(motifs: string[]) {
  const motifLines = motifs.map((m) => `- ${m}`).join('\n')

  return `
【12時投稿専用ルール】

12時投稿は「誰かと同じ景色を見ている場面」を描く。

7時・18時・21時のような、ひとり時間・暮らし・癒し・整える方向には絶対に寄せない。

本文では、感情や意味を説明しない。
書くのは、会話・仕草・歩幅・沈黙・視線・距離感だけ。

禁止：
じつは／気づき／教訓／提案／前向きな締め／〜かもしれません／〜してくれる／〜を与えてくれる

禁止語：
窓、窓辺、花、花瓶、カップ、マグカップ、テーブル、ノート、彩り、豊か、喜び、嬉しさ、幸せ、癒し、心、気持ち、日常、暮らし、穏やか、気づく、整える、特別、大切な時間、温まる、満たされる

画像：
人物なし。文字なし。
室内静物・物撮り禁止。
「ふたりが同じ景色を見ていたように見える道・駅前・海沿い・線路沿い・商店街・川沿い・横断歩道・バス停」などを使う。

最終判定：
ひとり時間に見えるものは12時投稿ではない。
感情説明があるものは12時投稿ではない。
誰かとの距離感がないものは12時投稿ではない。

`
}

/* =========================================================
 * 7時専用ルール
 * =======================================================*/
function buildMorningRules() {
  return `
【7時投稿】
- 今日を始める前の空気。
- ひとりの朝を描く。
- 恋愛、ふたり、誰かとの親密な関係は主題にしない。
- 強い励ましではなく、ゆっくり立ち上がる感覚にする。
`
}

/* =========================================================
 * 18時専用ルール
 * =======================================================*/
function buildEveningRules() {
  return `
【18時投稿】
- 一日の緊張がゆるむ時間。
- 服・小物・美容などの商品がある場合は、説明ではなく身につけた時の質感で描く。
- 恋愛、ふたり、誰かとの親密な関係は主題にしない。
`
}

/* =========================================================
 * 21時専用ルール
 * =======================================================*/
function buildNightRules() {
  return `
【21時投稿】
- 一日の終わり、眠りと回復に向かう時間。
- 親密な恋愛描写は禁止。
- ひとりで眠る前の安心感を描く。
`
}

/* =========================================================
 * その他の時間帯（フォールバック）
 * =======================================================*/
function buildOtherRules() {
  return `
【通常投稿】
- 指定された時間帯の空気感に合わせる。
- 恋愛やふたりの関係は、12時以外では主題にしない。
`
}

/* =========================================================
 * 非12時の関係性禁止ルール
 * =======================================================*/
function buildNonNoonRelationBan() {
  return `
【12時以外の関係性禁止】
- 恋人、夫婦、ふたり、大切な人、隣にいる人、同じ景色を見る、共にいる、など恋愛を想起させる表現は禁止。
- 12時専用の関係性描写を混ぜない。
`
}

/* =========================================================
 * 非12時の本文構成（気づき=「じつは」はここだけで許可・任意）
 *  - 7時・18時・21時のみ適用。12時には絶対に渡さない。
 * =======================================================*/
function buildReflectiveStructure() {
  return `
【本文構成（7時・18時・21時のみ）】
1. 1行目：静かな共感、情景、違和感、小さな感覚で始める。
2. その時間帯の空気感を描く。
3. 必要なときだけ「じつは、〜」で小さな気づきを入れてよい（任意。不要なら入れない）。
4. 商品がある場合は、生活の中に自然に置く。
5. やさしく静かに締める。

【禁止表現】
小さな道具、その存在、心に寄り添う、そっと寄り添う、暮らしを整える、大切な時間を支える、〇〇のひとつ、特別な時間、自分らしい時間、幸せが漂う、優しく包み込む
`
}

/* =========================================================
 * 非12時の画像プロンプトルール
 * =======================================================*/
function buildNonNoonImageRule() {
  return `
【画像プロンプト】
- 人物なし。
- 文字なし。
- 毎回同じ構図を避ける。
- 窓辺、カーテン、テーブル、マグカップ、ベッド、ソファ、読書、花瓶、朝日、夜景を連続使用しない。
- 洗面台、廊下、玄関、雨上がり、キッチン、木漏れ日、バスタイム後、白いシーツ、古い本、小さな照明、街の灯り、靴を脱いだ瞬間、湯気、柔らかい布、曇ったガラス、夕方の影などから分散する。
`
}

/* =========================================================
 * systemPrompt 組み立て
 *  - noon : 共通 + 12時専用(モチーフ注入) + JSON（気づき構造は含めない）
 *  - それ以外 : 共通 + 時間帯 + 関係性禁止 + 本文構成 + 画像 + JSON
 * =======================================================*/
function buildSystemPrompt(slotKey: TimeSlotKey, noonMotifs: string[]): string {
  if (slotKey === 'noon') {
    return [buildCommonRules(), buildNoonRules(noonMotifs), buildBaseJsonRule()].join('\n')
  }

  const slotRules =
    slotKey === 'morning'
      ? buildMorningRules()
      : slotKey === 'evening'
        ? buildEveningRules()
        : slotKey === 'night'
          ? buildNightRules()
          : buildOtherRules()

  return [
    buildCommonRules(),
    slotRules,
    buildNonNoonRelationBan(),
    buildReflectiveStructure(),
    buildNonNoonImageRule(),
    buildBaseJsonRule(),
  ].join('\n')
}

/* =========================================================
 * userPrompt 組み立て
 * =======================================================*/
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

  const hasProduct = Boolean((productName && productName.trim()) || (productFeatures && productFeatures.trim()))

  const noonReminder =
    slotKey === 'noon'
      ? `
【12時最終確認】
今回の投稿は12時投稿です。以下が1つでも入ったら失敗です。
- じつは / 気づき / 学び / 教訓 / 意味説明 / 感情説明 / オチ / まとめ
- 喜び / 嬉しさ / 幸せ / 豊か / 彩り / 癒し / 特別 / 大切な時間 / 日常を彩る
- 駅のホーム / 肩が触れる / 手をつなぐ / 夕日を見る / 同じ景色を見る / カフェデート
- 〜かもしれません / 〜ことがあります / 〜してくれる
情景だけを書き、説明せず途中で終えること。恋人を匂わせないこと。
${hasProduct ? '- 商品は、機能を語らず情景の中の「物」として一度だけ置く。商品名は本文に直接書かない。\n' : ''}`
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

/* =========================================================
 * ハッシュタグ正規化（+ 12時は禁止語タグを除去）
 * =======================================================*/
function normalizeHashtags(rawHashtags: unknown, slotKey: TimeSlotKey): string[] {
  const hashtagsArray: string[] = Array.isArray(rawHashtags)
    ? rawHashtags.map(String)
    : typeof rawHashtags === 'string'
      ? rawHashtags.split(/[\s,、　]+/).filter(Boolean)
      : []

  const cleaned = hashtagsArray
    .map((h: string) => h.replace(/^#/, '').trim())
    .filter(Boolean)

  const filtered =
    slotKey === 'noon'
      ? cleaned.filter((h) => !NOON_HARD_BANNED.some((b) => h.includes(b)))
      : cleaned

  return filtered.slice(0, 5)
}

/* =========================================================
 * 12時出力のハード禁止語検査
 * =======================================================*/
function findNoonViolations(text: string): string[] {
  const hits = new Set<string>()
  for (const word of NOON_HARD_BANNED) {
    if (text.includes(word)) hits.add(word)
  }
  return Array.from(hits)
}

/* =========================================================
 * OpenAI 呼び出しヘルパー
 * =======================================================*/
async function runCompletion(
  openai: OpenAI,
  modelName: string,
  systemPrompt: string,
  userPrompt: string,
  temperature: number
): Promise<any> {
  const completion = await openai.chat.completions.create({
    model: modelName,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature,
    response_format: { type: 'json_object' },
  })

  const raw = completion.choices[0].message.content || '{}'
  return JSON.parse(raw)
}

/* =========================================================
 * POST ハンドラ（APIレスポンス形式は従来どおり維持。meta は追記のみ）
 * =======================================================*/
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

    const noonMotifs = slotKey === 'noon' ? pickNoonMotifs(6) : []
    const systemPrompt = buildSystemPrompt(slotKey, noonMotifs)
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
    console.log('isNoonPrompt:', slotKey === 'noon')
    console.log('noonMotifs:', noonMotifs)
    console.log('systemPrompt includes noon-only rules:', systemPrompt.includes('12時投稿の目的'))
    console.log('systemPrompt includes reflective(じつは):', systemPrompt.includes('本文構成（7時・18時・21時のみ）'))
    console.log('=== End Sayaka prompt debug ===')

    // 初回生成
    let result = await runCompletion(
      openai,
      modelName,
      systemPrompt,
      userPrompt,
      slotKey === 'noon' ? 0.55 : 0.75
    )
    let attempts = 1

    // 12時のみ：ハード禁止語が出たら1回だけ温度を下げて再生成
    if (slotKey === 'noon') {
      const target = `${result.threadsPost || ''}\n${result.instagramPost || ''}\n${result.reelText || ''}`
      const violations = findNoonViolations(target)
      if (violations.length > 0) {
        console.warn('Noon hard-banned tokens detected, regenerating:', violations)
        const correction = `${userPrompt}\n\n【再生成の指示】\n前回の出力に次の禁止語が含まれていました：${violations.join('、')}。\nこれらを完全に取り除き、感情説明やまとめを一切入れず、情景だけで書き直してください。`
        result = await runCompletion(openai, modelName, systemPrompt, correction, 0.4)
        attempts = 2
      }
    }

    const hashtagsArray = normalizeHashtags(result.hashtags, slotKey)
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
        attempts,
        noonMotifs,
      },
    })
  } catch (error: any) {
    console.error('Generate API error details:', error)
    const message = error?.message || '不明なエラー'
    return NextResponse.json({ error: `生成に失敗しました: ${message}` }, { status: 500 })
  }
}
