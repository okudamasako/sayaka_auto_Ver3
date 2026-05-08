'use client'

import { useState } from 'react'
import styles from './page.module.css'

const PLATFORMS = ['Threads', 'Instagram', 'X (Twitter)']
const TONES = ['Sayaka Angel (やさしい)', 'カジュアル', 'ビジネス']
const TIMESLOTS = ['7時', '12時', '18時', '21時']

interface Result {
  success: boolean
  isDuplicate: boolean
  post: string
  instagramPost: string
  reelText: string
  bgm: string
  imagePrompt: string
  hashtags: string[]
  usedHook: string
  usedClosing: string
  fullText: string
  tips: string
  meta: {
    theme: string
    platform: string
    tone: string
    generatedAt: string
    charCount: number
  }
}

export default function Home() {
  // 既存の入力
  const [theme, setTheme] = useState('')
  const [platform, setPlatform] = useState('Threads')
  const [tone, setTone] = useState('Sayaka Angel (やさしい)')

  // 新規入力（Notion用）
  const [productName, setProductName] = useState('')
  const [productFeatures, setProductFeatures] = useState('')
  const [productUrl, setProductUrl] = useState('')
  const [timeSlot, setTimeSlot] = useState('18時')
  const [evaluation, setEvaluation] = useState('')

  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Result | null>(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  // Notion保存用ステータス
  const [notionSaving, setNotionSaving] = useState(false)
  const [notionSaved, setNotionSaved] = useState(false)

  const generate = async () => {
    if (!theme.trim()) { setError('テーマを入力してください'); return }
    setLoading(true)
    setError('')
    setResult(null)
    setNotionSaved(false)
    setEvaluation('')

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theme,
          platform,
          tone,
          productName,
          productFeatures,
          productUrl,
          timeSlot
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || '生成に失敗しました')
        return
      }
      setResult(data)
    } catch (e) {
      console.error('Fetch error:', e)
      setError('ネットワークエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  const saveToNotion = async () => {
    if (!result) return
    setNotionSaving(true)
    setError('')

    try {
      const res = await fetch('/api/save-notion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theme: theme,
          threadsPost: result.post,
          instagramPost: result.instagramPost,
          reelText: result.reelText,
          bgm: result.bgm,
          imagePrompt: result.imagePrompt,
          hashtags: result.hashtags.join(' '),
          productName,
          productFeatures,
          productUrl,
          timeSlot,
          evaluation,
          usedHook: result.usedHook,
          usedClosing: result.usedClosing
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Notion保存に失敗しました')
        return
      }
      setNotionSaved(true)
    } catch (e) {
      console.error('Notion error:', e)
      setError('Notion接続エラーが発生しました')
    } finally {
      setNotionSaving(false)
    }
  }

  const copyToClipboard = () => {
    if (!result) return
    navigator.clipboard.writeText(result.fullText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <main className={styles.main}>
      <div className={styles.bgGlow1} />
      <div className={styles.bgGlow2} />
      <div className={styles.bgGrid} />

      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.headerBadge}>SAYAKA ANGEL · AI POSTER</div>
          <h1 className={styles.title}>
            Sayaka Angel<br />
            <span className={styles.titleAccent}>Auto Post</span>
          </h1>
          <p className={styles.subtitle}>
            30代女性に寄り添うSNS投稿文を生成。<br />
            過去の投稿を参照し、重複のない新鮮な言葉を紡ぎます。
          </p>
        </header>

        <section className={styles.card}>
          <div className={styles.cardLabel}>STEP 01 — 入力</div>

          <div className={styles.formGroup}>
            <label className={styles.label}>投稿テーマ <span className={styles.required}>必須</span></label>
            <input
              className={styles.input}
              type="text"
              placeholder="例: GW明けの木曜日"
              value={theme}
              onChange={e => setTheme(e.target.value)}
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.label}>商品名</label>
              <input
                className={styles.input}
                type="text"
                placeholder="例: シリコン磁気ネックレス"
                value={productName}
                onChange={e => setProductName(e.target.value)}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>投稿時間帯</label>
              <select className={styles.select} value={timeSlot} onChange={e => setTimeSlot(e.target.value)}>
                {TIMESLOTS.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>商品特徴</label>
            <textarea
              className={styles.input}
              style={{ minHeight: '80px', paddingTop: '10px' }}
              placeholder="例: 首や肩まわりをやさしく整えて、夕方の重さを少し軽くしてくれる"
              value={productFeatures}
              onChange={e => setProductFeatures(e.target.value)}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>商品URL</label>
            <input
              className={styles.input}
              type="url"
              placeholder="https://a.r10.to/hYHSgz"
              value={productUrl}
              onChange={e => setProductUrl(e.target.value)}
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.label}>プラットフォーム</label>
              <select className={styles.select} value={platform} onChange={e => setPlatform(e.target.value)}>
                {PLATFORMS.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>文体</label>
              <select className={styles.select} value={tone} onChange={e => setTone(e.target.value)}>
                {TONES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <button
            className={`${styles.btn} ${loading ? styles.btnLoading : ''}`}
            onClick={generate}
            disabled={loading}
          >
            {loading ? (
              <span className={styles.btnInner}>
                <span className={styles.spinner} />
                過去投稿を参照して生成中...
              </span>
            ) : (
              <span className={styles.btnInner}>
                <span className={styles.btnIcon}>✦</span>
                投稿文を生成する
              </span>
            )}
          </button>
        </section>

        {result && (
          <section className={`${styles.card} ${styles.resultCard}`}>
            <div className={styles.cardLabel}>STEP 02 — 結果</div>

            {result.isDuplicate && (
              <div className={styles.error} style={{ background: 'rgba(255, 100, 100, 0.1)', border: '1px solid #ff6b6b', marginBottom: '20px', padding: '15px' }}>
                ⚠️ <strong>注意:</strong> このフック（1行目）は過去の投稿で使用されている可能性があります。
              </div>
            )}

            <div className={styles.resultMeta}>
              <span className={styles.metaBadge}>{result.meta.platform}</span>
              <span className={styles.metaBadge}>{result.meta.tone}</span>
              <span className={styles.metaTime}>{result.meta.generatedAt}</span>
            </div>

            <div className={styles.postBox}>
              <h3 style={{ fontSize: '0.9rem', color: '#888', marginBottom: '10px' }}>Threads投稿文</h3>
              <p className={styles.postText}>{result.fullText}</p>
            </div>

            <div className={styles.postBox} style={{ border: 'none', background: 'rgba(255,255,255,0.03)', marginTop: '10px' }}>
              <h3 style={{ fontSize: '0.9rem', color: '#888', marginBottom: '10px' }}>Instagram/リール用詳細</h3>
              <p className={styles.tipsText}>{result.tips}</p>
            </div>

            <div className={styles.formGroup} style={{ marginTop: '20px' }}>
              <label className={styles.label}>評価メモ (Notion保存用)</label>
              <textarea
                className={styles.input}
                style={{ minHeight: '60px', background: 'rgba(255,255,255,0.05)', fontSize: '0.9rem' }}
                placeholder="例: この表現は反応が良さそう、もう少し余白を増やすべきだった等"
                value={evaluation}
                onChange={e => setEvaluation(e.target.value)}
              />
            </div>

            <div className={styles.formRow} style={{ marginTop: '20px' }}>
              <button className={styles.copyBtn} onClick={copyToClipboard} style={{ flex: 1 }}>
                {copied ? '✓ コピーしました！' : '全文をコピー'}
              </button>

              <button
                className={styles.btn}
                style={{ background: notionSaved ? '#43e97b' : '#333', flex: 2 }}
                onClick={saveToNotion}
                disabled={notionSaving || notionSaved}
              >
                <span className={styles.btnInner}>
                  {notionSaving ? (
                    <><span className={styles.spinner} /> 保存中...</>
                  ) : notionSaved ? (
                    '✓ Notionに保存済み'
                  ) : (
                    '📄 Notionに保存する'
                  )}
                </span>
              </button>
            </div>
          </section>
        )}

        <footer className={styles.footer}>
          <p>Sayaka Angel Auto Post System · Notion Connect Edition</p>
        </footer>
      </div>
    </main>
  )
}
