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
      ? recentPosts.map((p: any) => `- テーマ: ${p.theme}\n  投稿日: ${p.postedAt}\n  1行目: ${p.usedHook}\n  締め文: ${p.usedClosing}\n  リール文: ${p.reelText}\n  タグ: ${p.hashtags}`).join('\n')
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
- **12時（愛のまなざし）**: この時間帯は必ず「家族や身近な人との記憶や関係性」を扱います。テーマは「同じ景色を見る」「一緒に笑う」「言葉が少なくても落ち着く」「自然と優しくなれる」など、ふたりの空気感を情景で描くこと。【厳禁】自分磨き・ひとり時間・自己啓発・自分を整える・周囲の人々・一般論。説明せず、情景だけで恋愛の温度感を伝えてください。
- **18時（ゆるめる）**: 緊張がほどける時間。商品の説明ではなく、身につけたとき・使ったときの感覚や空気感を描写する。
- **21時（眠りと回復）**: 「安心して眠れそう」な静かな読後感を最重視。「今日はここまででいい」と心から思える温かい安らぎ。

【テーマの扱いルール】
入力されたテーマは、
空気感・情景・温度感として反映してください。
テーマの単語そのものを、
本文やハッシュタグへ直接入れる必要はありません。
特に「土曜日」「日曜日」「金曜日」など曜日テーマの場合、
文章冒頭やハッシュタグに曜日を固定的に使用しないこと。
曜日は、
「少しゆっくりした空気」
「静かな昼」
「時間を気にしない午後」
など、情景描写で自然に表現してください。

【12時投稿 文体ルール（厳守）】
12時投稿は感情を一切"説明"しません。情景描写だけで感じさせることを最優先にします。

▼ 禁止ワード（12時では絶対に使わない）
「幸せ」「特別」「癒し」「心が温まる」「満たされる」「豊かになる」「大切な時間」「心を整える」「〜してみるのもいいかもしれません」

▼ 12時投稿 追加禁止事項（最重要）
12時投稿では、
「〜する時間」
「〜かもしれません」
「〜なのです」
「心が〜」
「気持ちが〜」
など、感情や意味を説明する文章を書かない。
読者に解釈を委ね、
情景だけで終わらせること。
特に以下は禁止：
- 心を穏やかにする
- 小さな喜び
- 特別な時間
- 心の声
- 癒し
- 幸せ
- 温かい気持ち
- 大切な時間

▼ 12時以外のルール（7時・18時・21時）
- 恋愛・パートナー・ふたりの関係性を主題にしない。
- 「ふたり」「隣にいる人」「大切な人」「共にいる」「同じ景色を見る」など、恋愛を想起させる表現は使用しない。
- 7時・18時・21時は、「ひとりの静かな時間」「暮らし」「自分を労わる感覚」を中心に描写する。
- 特に21時投稿では、眠り・安心感・静かな回復を最優先し、親密な恋愛描写を入れない。

▼ 使用してよい描写要素（12時のみ）
光・沈黙・距離感・視線・呼吸・声の温度・同じ景色・隣に座る感覚・小さな仕草。
これらの要素で"ふたりの空気感"を描き、感情は読者が自然に感じ取れるよう余白に委ねること。

【マンネリ防止・過去投稿との重複回避】
過去の投稿データを参照し、以下のルールを厳守してください：
- **過去と同じ1行目（フック）を絶対に使わない。**
- **過去と同じ締め文を使わない。**
- **過去と同じハッシュタグ構成にしない。**
- **過去と同じリール文（またはほぼ同じ4行構成・キーワード）を使わない。**
- **直近2日以内に使用したリール文・キーワード・空気感と似た表現を避ける。**（投稿日を参照すること）
- ただし、文体・温度感・余白感は過去の良かった投稿を参考に維持してください。

【1行目フックルール：静かな共感】
Threadsでは1行目でスクロールを止めることを最優先しますが、煽り・断言・マーケティング感ではなく「静かな共感」で止めます。
- 優先事項：情景、違和感、小さな気づき、感覚描写、静かな共感。
- 避ける表現：今すぐ、9割が知らない、人生変わる、有料級、警告、断言します、絶対、最強、月曜日の朝などのわかりきっていること

【曜日テーマの扱い】
「土曜日」「金曜日」など曜日がテーマに含まれていても、
文章の1行目を「土曜日の朝」「金曜日の夜」など、
曜日説明から始めないこと。
曜日は空気感・生活感・温度として自然ににじませる。
例：
- 少しゆっくり流れる朝
- 窓を開けたくなる空気
- 平日より静かな駅
- 時計を気にしない午後
など、情景で曜日感を表現する。
また、ハッシュタグの先頭を毎回「#土曜日」「#金曜日」に固定しないこと。

【本文構成ルール（厳守）】
1. 1行目フック（上記の「静かな共感」ルールを適用。読んだ瞬間に「あ、なんかわかる」と思える1行目にする。）
2. その時間帯の空気感・感覚描写
3. 「じつは、〜」で始まる、気づきや解決のきっかけ
4. 商品を暮らしの中にそっと添える（18時以外は商品に触れなくても可）
5. やさしく、静かに締める。

【禁止表現（最重要）】
以下の表現は使用禁止。

・小さな道具
・その存在
・心に寄り添う
・そっと寄り添う
・暮らしを整える
・大切な時間を支える
・〇〇のひとつ
・特別な時間
・自分らしい時間
・幸せが漂う
・優しく包み込む

商品の擬人化は禁止。
抽象的なポエム表現より、
実際の行動・感覚・気持ちを優先すること。

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

【タイトル・情景ワード重複防止ルール（最重要）】
以下の単語を、投稿タイトル・1行目・リール文で連続使用しないこと。

禁止頻出ワード：

* 静かな
* やさしい
* 穏やかな
* 今日をほどく
* 深呼吸
* 光が差し込む
* 窓辺
* 余白
* 夜更け
* 朝の光

特に「静かな◯◯」形式は禁止。
例：

* 静かな朝
* 静かな昼
* 静かな夜
* 静かな時間

これらを量産しない。

同じ空気感でも、
別の切り口・別の感覚描写へ言い換えること。

例：

* レースカーテンが揺れる
* 白い湯気
* ページをめくる音
* テーブルに残る夕方の光
* 柔らかい毛布
* 小さな灯り
* 雨上がりの空気
* 指先の温度
* 遠くの電車の音

【曜日ハッシュタグ禁止ルール（最重要）】
ハッシュタグに以下を絶対に含めない：

#月曜日
#火曜日
#水曜日
#木曜日
#金曜日
#土曜日
#日曜日

また、
「#週末」「#平日」「#休日」など、
曜日連想系タグも多用しない。

ハッシュタグは、
感情説明ではなく、
空気感・光・温度・暮らし・夜・呼吸・静けさ・柔らかさ
などを中心に構成すること。

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
  
【imagePrompt 多様化ルール】
毎回同じ構図を使用しないこと。

以下の要素が連続しないよう分散する：

* 窓辺
* カーテン
* テーブル
* マグカップ
* ベッド
* ソファ
* 読書
* 花瓶
* 朝日
* 夜景

また、
同じ視点・同じ構図・同じ部屋感を避ける。

情景は以下からランダムに広げる：

* 洗面台
* 廊下
* 玄関
* 雨上がり
* キッチン
* 木漏れ日
* バスタイム後
* 白いシーツ
* 古い本
* 小さな照明
* 街の灯り
* 靴を脱いだ瞬間
* 湯気
* 柔らかい布
* 書きかけのノート
* 風に揺れる植物
* 曇ったガラス
* 夕方の影

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

※18時投稿の場合は、
商品の機能説明ではなく、
使用したときの感覚や気持ちの変化を情景描写で表現してください。
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

    // hashtags が配列でない場合（文字列や undefined）を安全に正規化
    const rawHashtags = result.hashtags
    const hashtagsArray: string[] = Array.isArray(rawHashtags)
      ? rawHashtags
      : typeof rawHashtags === 'string'
        ? rawHashtags.split(/[\s,　]+/).filter(Boolean)
        : []

    // 簡易的な類似チェック（1行目の重複チェック）
    const isDuplicate = recentPosts.some((p: any) => p.usedHook === result.usedHook)

    // 生成されたタグを整形（1行ずつ表示）
    const formattedHashtags = hashtagsArray.map((h: string) => `#${h.replace(/^#/, '')}`).join('\n')
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
      hashtags: hashtagsArray,
      usedHook: result.usedHook,
      usedClosing: result.usedClosing,
      fullText,
      tips: `【Instagram本文】\n${result.instagramPost}\n\n【リール文】\n${result.reelText}\n\n【BGM候補】\n${result.bgm}\n\n【画像生成プロンプト】\n${result.imagePrompt}\n\n【Instagramハッシュタグ】\n${hashtagsArray.map((h: string) => `#${h.replace(/^#/, '')}`).join('\n')}`,
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