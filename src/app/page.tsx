'use client'

import { useState } from 'react'
import styles from './page.module.css'

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 固定記念日データ（Phase1 MVP）
// 将来は /api/anniversary から取得可能な構造
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const anniversaryData: Record<string, string[]> = {
  '1-1':  ['元日', '世界平和の日', '神戸港記念日'],
  '1-2':  ['初荷', '書き初め', '月ロケットの日'],
  '1-3':  ['駆け落ちの日', '瞳の日', 'ひとみの日'],
  '1-4':  ['石の日', '冷凍食品の日'],
  '1-5':  ['紐の日', '囲碁の日'],
  '1-6':  ['色の日', '仕事始め'],
  '1-7':  ['七草', '人日の節句'],
  '1-8':  ['勝負の日', '平成スタートの日'],
  '1-9':  ['とんちの日', '風邪の日'],
  '1-10': ['110番の日', '明太子の日'],
  '1-11': ['鏡開き', '蔵開き'],
  '1-12': ['スキーの日', '桜島の日'],
  '1-13': ['ピースの日', 'たばこの日'],
  '1-14': ['愛と希望と勇気の日', '成人の日'],
  '1-15': ['小正月', '半成人の日'],
  '1-16': ['禁酒の日', 'ヒーローの日'],
  '1-17': ['防災とボランティアの日', 'おむすびの日'],
  '1-18': ['118番の日', '都バス記念日'],
  '1-19': ['のど自慢の日', '家庭消火器点検の日'],
  '1-20': ['大寒', '玉の輿の日'],
  '1-21': ['料理番組の日', 'ライバルが手を結ぶ日'],
  '1-22': ['カレーの日', 'ジャズの日'],
  '1-23': ['電子メールの日', '八甲田山の日'],
  '1-24': ['郵便制度施行記念日', 'ゴールドラッシュの日'],
  '1-25': ['中華まんの日', '日本最低気温の日'],
  '1-26': ['コラーゲンの日', '有料駐車場の日'],
  '1-27': ['国旗制定記念日', '求婚の日'],
  '1-28': ['コピーライターの日', 'データプライバシーの日'],
  '1-29': ['タウン情報の日', '世界救らいの日'],
  '1-30': ['3分間電話の日', '孤独と向き合う日'],
  '1-31': ['愛妻の日', '五つ子誕生の日'],
  '2-1':  ['テレビ放送記念日', '重役の日', 'フリーランスの日'],
  '2-2':  ['夫婦の日', '交番設置記念日'],
  '2-3':  ['節分', '大岡越前の日'],
  '2-4':  ['立春', '西の日'],
  '2-5':  ['笑顔の日', 'プロ野球の日'],
  '2-6':  ['海苔の日', '抹茶の日'],
  '2-7':  ['北方領土の日', 'フナの日'],
  '2-8':  ['にわとりの日', '事始め'],
  '2-9':  ['服の日', '漫画の日'],
  '2-10': ['ニットの日', '左利きグッズの日'],
  '2-11': ['建国記念の日', '万歳三唱の日'],
  '2-12': ['ボブスレーの日', 'レトルトカレーの日'],
  '2-13': ['苗字制定記念日', '地球兄弟の日'],
  '2-14': ['バレンタインデー', '聖バレンタインの日'],
  '2-15': ['涅槃会', 'お菓子の日'],
  '2-16': ['天気図記念日', '寒天の日'],
  '2-17': ['天使のささやきの日', '仏壇の日'],
  '2-18': ['嫌煙運動の日', 'エアメールの日'],
  '2-19': ['雨水', 'プロレスの日'],
  '2-20': ['旅券の日', '普通選挙の日'],
  '2-21': ['国際母語デー', 'まんだいの日'],
  '2-22': ['猫の日', '竹島の日'],
  '2-23': ['天皇誕生日', '富士山の日'],
  '2-24': ['月光仮面登場の日', 'クロスカントリーの日'],
  '2-25': ['夕刊フジ創刊の日', '箱根用水完成記念日'],
  '2-26': ['血液銀行開業記念日', '弐六の日'],
  '2-27': ['冬の恋人の日', 'ハンバーグの日'],
  '2-28': ['ビスケットの日', '二八そばの日'],
  '2-29': ['閏日', '宝島の日'],
  '3-1':  ['春一番名付けの日', '婦人運動家設立の日', 'マヨネーズの日'],
  '3-2':  ['ミニの日', '遠山の金さんの日'],
  '3-3':  ['ひな祭り', '耳の日', '桃の節句'],
  '3-4':  ['サッシの日', '三姉妹の日'],
  '3-5':  ['スチュワーデスの日', '珊瑚の日'],
  '3-6':  ['世界一周記念日', '弟の日'],
  '3-7':  ['消防記念日', '花粉症の日'],
  '3-8':  ['国際女性デー', '三板の日'],
  '3-9':  ['雑穀の日', 'ありがとうの日'],
  '3-10': ['東京大空襲の日', '農山漁村女性の日'],
  '3-11': ['東日本大震災の日', 'くしの日'],
  '3-12': ['サンデーホリデーの日', 'モスの日'],
  '3-13': ['サンドイッチデー', '漁業法記念日'],
  '3-14': ['ホワイトデー', '国際数学デー（円周率の日）'],
  '3-15': ['靴の記念日', 'そろばんの日'],
  '3-16': ['国立公園指定記念日', '財務の日'],
  '3-17': ['漫画週刊誌の日', 'みんなで考えるSDGsの日'],
  '3-18': ['点字ブロックの日', 'ウィルスの日'],
  '3-19': ['ミュージックの日', '自然の甘み・みりんの日'],
  '3-20': ['春分の日', '国際幸福デー'],
  '3-21': ['国際ノウロウズデー', '春分の日（振替）'],
  '3-22': ['放送記念日', '世界水の日'],
  '3-23': ['世界気象デー', '旅の日の前日'],
  '3-24': ['壇ノ浦の戦いの日', '世界結核デー'],
  '3-25': ['電気記念日', '笈の日'],
  '3-26': ['カチューシャの歌の日', '楽聖の日'],
  '3-27': ['さくらの日', 'グミの日'],
  '3-28': ['シルクロードの日', '三ツ矢サイダーの日'],
  '3-29': ['マリモの日', '八百屋お七の日'],
  '3-30': ['零戦の日', '国立競技場落成記念日'],
  '3-31': ['エッフェル塔完成記念日', '山菜の日'],
  '4-1':  ['エイプリルフール', '新年度始まり'],
  '4-2':  ['国際子どもの本の日', '週刊少年マガジンの日'],
  '4-3':  ['いんげん豆の日', 'シーサーの日'],
  '4-4':  ['猫の寝る日', '寝床の日'],
  '4-5':  ['ヘアカットの日', '横山大観忌'],
  '4-6':  ['城の日', 'コンビーフの日'],
  '4-7':  ['世界保健デー', 'タイムカプセルの日'],
  '4-8':  ['花まつり（仏の誕生日）', '裁判所の日'],
  '4-9':  ['フォークソングの日', '大仏の日'],
  '4-10': ['女性の日', 'ヨットの日'],
  '4-11': ['ガッツポーズの日', 'メートル法公布記念日'],
  '4-12': ['パンの記念日', '世界宇宙飛行の日'],
  '4-13': ['喫茶店の日', '水産デー'],
  '4-14': ['タイタニック号の日', '柔道の日'],
  '4-15': ['よいこの日', '世界芸術デー'],
  '4-16': ['チャップリンの日', '国民年金の日'],
  '4-17': ['ハイビジョンの日', 'なすびの日'],
  '4-18': ['世界アマチュア無線の日', '発明の日'],
  '4-19': ['乗馬の日', '地図の日'],
  '4-20': ['郵政記念日', '穀雨'],
  '4-21': ['民放の日', '創造性と文化的多様性促進の日'],
  '4-22': ['地球の日（アースデー）', 'ナポレオンの日'],
  '4-23': ['世界本の日（サン・ジョルディの日）', '子ども読書の日'],
  '4-24': ['植物学の日', '日本ダービー記念日'],
  '4-25': ['拾得物の日', '国連記念日'],
  '4-26': ['世界知的財産デー', '置き薬の日'],
  '4-27': ['哲学の日', 'クリケットの日'],
  '4-28': ['国際勤労者デー前日', '基本法記念日'],
  '4-29': ['昭和の日', '羊肉の日'],
  '4-30': ['図書館記念日', '国際ジャズデー'],
  '5-1':  ['メーデー', '語彙の日'],
  '5-2':  ['交通広告の日', '郵便貯金の日'],
  '5-3':  ['憲法記念日', '世界報道自由デー'],
  '5-4':  ['みどりの日', '競艇の日'],
  '5-5':  ['こどもの日', '端午の節句', '国際助産師の日'],
  '5-6':  ['コロッケの日', '国際ノーダイエットデー'],
  '5-7':  ['コナモンの日', '粉の日'],
  '5-8':  ['世界赤十字デー', '松の日'],
  '5-9':  ['アイスクリームの日', 'ゴクウの日'],
  '5-10': ['日本気象協会創立記念日', '愛鳥週間'],
  '5-11': ['長良川鵜飼開きの日', '虫歯予防デー前日'],
  '5-12': ['ナイチンゲールの日', '看護の日'],
  '5-13': ['愛犬の日', 'メタルの日'],
  '5-14': ['種痘記念日', 'マーブルチョコの日'],
  '5-15': ['国際家族デー', 'ストッキングの日', '沖縄本土復帰記念日'],
  '5-16': ['旅の日', '光の記念日'],
  '5-17': ['世界電気通信の日', 'パックマンの日'],
  '5-18': ['国際博物館の日', '名刺の日'],
  '5-19': ['ボクシングの日', 'ロゴマークの日'],
  '5-20': ['世界計量記念日', 'ローマ字の日'],
  '5-21': ['小学校開校の日', '対話と発展のための世界文化多様性デー', 'リンドバーグ翼の日'],
  '5-22': ['国際生物多様性の日', 'ガリレオ・ガリレイ記念日'],
  '5-23': ['世界亀の日', '恋文の日'],
  '5-24': ['伊達巻の日', '世界統合失調症の日'],
  '5-25': ['広辞苑記念日', '食堂車の日'],
  '5-26': ['東名高速全通記念日', '源泉かけ流しの日'],
  '5-27': ['百人一首の日', '日本海海戦記念日'],
  '5-28': ['花火の日', '国際アムネスティの日'],
  '5-29': ['エベレスト登頂記念日', '呉服の日'],
  '5-30': ['ゴミゼロの日', '消費者の日'],
  '5-31': ['世界禁煙デー', '保険外交員の日'],
  '6-1':  ['電波の日', '気象記念日', '写真の日'],
  '6-2':  ['路地の日', '横浜港開港記念日'],
  '6-3':  ['測量の日', '雲仙普賢岳大火砕流の日'],
  '6-4':  ['虫歯予防デー', '蒸し風呂の日'],
  '6-5':  ['世界環境デー', '熱気球記念日'],
  '6-6':  ['楽器の日', '補聴器の日'],
  '6-7':  ['母親大会記念日', '緑内障を考える日'],
  '6-8':  ['世界海洋デー', '成層圏発見の日'],
  '6-9':  ['ロックの日', '圧巻の日'],
  '6-10': ['時の記念日', '路面電車の日'],
  '6-11': ['国立銀行設立の日', '傘の日'],
  '6-12': ['日記の日', 'エスペラントの日'],
  '6-13': ['小さな親切の日', 'はやぶさ帰還の日'],
  '6-14': ['世界献血者デー', '手羽先記念日'],
  '6-15': ['生姜の日', '県民の日（栃木など）'],
  '6-16': ['無重力の日', '麦とろの日'],
  '6-17': ['世界砂漠化および干ばつと戦う日', 'おまわりさんの日'],
  '6-18': ['海外移住の日', '念仏の口開け'],
  '6-19': ['朗読の日', 'ベースボールの日'],
  '6-20': ['世界難民デー', 'ペパーミントの日'],
  '6-21': ['夏至', 'スナックの日'],
  '6-22': ['ボウリングの日', '日曜日の昼下がり記念日'],
  '6-23': ['沖縄慰霊の日', '国連パブリックサービスデー'],
  '6-24': ['国際UFOデー', '聖ヨハネの日'],
  '6-25': ['住宅デー', '天覧試合の日'],
  '6-26': ['雷記念日', '国連国際薬物乱用・不正取引防止デー'],
  '6-27': ['メディアリテラシーの日', 'ちらし寿司の日'],
  '6-28': ['パフェの日', '貿易記念日'],
  '6-29': ['ビートルズ来日の日', '佃煮の日'],
  '6-30': ['ハーフタイムデー', '集団疎開の日'],
  '7-1':  ['国民安全の日', '郵便番号記念日', '建設記念日'],
  '7-2':  ['たわしの日', 'ユネスコ加盟記念日'],
  '7-3':  ['波の日', 'ソフトクリームの日'],
  '7-4':  ['アメリカ独立記念日', '梨の日'],
  '7-5':  ['ビキニスタイルの日', '農林水産省発足記念日'],
  '7-6':  ['ゼリーの日', 'サラダ記念日'],
  '7-7':  ['七夕', '川の日', '笹の節句'],
  '7-8':  ['質屋の日', '那覇の日'],
  '7-9':  ['ジェットコースターの日', '泡盛の日'],
  '7-10': ['納豆の日', '四万六千日'],
  '7-11': ['世界人口デー', 'ロールケーキの日'],
  '7-12': ['ラジオ本放送の日', '洋食器の日'],
  '7-13': ['お盆', '盆迎え火'],
  '7-14': ['フランス革命記念日（バスティーユデー）', 'ゴールデンウィーク後の自分を見つめ直す日'],
  '7-15': ['お盆（中日）', '中元節'],
  '7-16': ['虹の日', '駅弁記念日'],
  '7-17': ['漫画の日', '東京の日'],
  '7-18': ['光化学スモッグの日', '海の月間'],
  '7-19': ['サイボーグ009の日', '女性大臣の日'],
  '7-20': ['海の日', '月面着陸の日'],
  '7-21': ['日本三景の日', 'Natural Dayの日'],
  '7-22': ['ナッツの日', '下駄の日'],
  '7-23': ['大暑', '文月ふみの日'],
  '7-24': ['劇画の日', '地蔵盆'],
  '7-25': ['かき氷の日', '天神祭'],
  '7-26': ['幽霊の日', 'ポツダム宣言記念日'],
  '7-27': ['スイカの日', '政治を考える日'],
  '7-28': ['世界肝炎デー', '地名の日'],
  '7-29': ['アマチュア無線の日', 'ふみの日'],
  '7-30': ['明治生命保険相互会社創業記念日', 'プロレスの日'],
  '7-31': ['蓄音機の日', '産業カウンセラーの日'],
  '8-1':  ['水の日', '世界母乳育児週間'],
  '8-2':  ['カレーうどんの日', 'ビーズ細工の日'],
  '8-3':  ['ハチミツの日', '自由と平和の日'],
  '8-4':  ['ビヤホールの日', '橋の日'],
  '8-5':  ['ハコの日', '世界のビールの日'],
  '8-6':  ['広島平和記念日', '原爆の日'],
  '8-7':  ['鼻の日', 'バナナの日'],
  '8-8':  ['世界猫の日', 'たこの日'],
  '8-9':  ['長崎原爆の日', 'ハグの日'],
  '8-10': ['道の日', '焼き鳥の日'],
  '8-11': ['山の日', 'きのこの日（山の日関連）'],
  '8-12': ['世界象の日', '国際青年の日前日'],
  '8-13': ['お盆迎え火', '剣道の日'],
  '8-14': ['裸足の記念日', '専売特許の日'],
  '8-15': ['終戦記念日', 'お盆'],
  '8-16': ['女子大生の日', 'エルビス・プレスリーの日'],
  '8-17': ['パイナップルの日', '国際左利きの日'],
  '8-18': ['高校野球記念日', '米の日'],
  '8-19': ['俳句の日', 'バイクの日'],
  '8-20': ['蚊の日', 'チーズの日前日'],
  '8-21': ['噴水の日', '献血記念日'],
  '8-22': ['チンチン電車の日', '天の川の日'],
  '8-23': ['処暑', '白虎隊の日'],
  '8-24': ['ラグビーの日', '愛酒の日'],
  '8-25': ['東京国際映画祭の日', '即席ラーメン記念日'],
  '8-26': ['人権宣言記念日', 'バーグの日'],
  '8-27': ['男はつらいよの日', '寅さんの日'],
  '8-28': ['バイオリンの日', 'テレビCMの日'],
  '8-29': ['文化財保護法施行記念日', 'ゴルフ場記念日'],
  '8-30': ['冒険家の日', 'ハッピーサンシャインデー'],
  '8-31': ['野菜の日', '夏休み最終日（学校が多い）'],
  '9-1':  ['防災の日', '関東大震災の日', '二百十日'],
  '9-2':  ['宝くじの日', '靴の日'],
  '9-3':  ['草野球の日', 'ホームラン記念日'],
  '9-4':  ['クラシック音楽の日', '供物の日'],
  '9-5':  ['国民栄誉賞の日', '石炭の日'],
  '9-6':  ['黒の日', '妹の日'],
  '9-7':  ['クリーナーの日', '制憲節（ブラジル）'],
  '9-8':  ['国際識字デー', 'サンフランシスコ平和条約調印記念日'],
  '9-9':  ['重陽の節句（菊の節句）', '世界救急の日'],
  '9-10': ['下水道の日', '屋外広告の日'],
  '9-11': ['警察相談の日', 'たんぱく質の日'],
  '9-12': ['水路記念日', 'マラソンの日'],
  '9-13': ['世界法の支配の日', '月見'],
  '9-14': ['メンズバレンタインデー', 'コスモスの日'],
  '9-15': ['老人の日', '動物虐待防止の日'],
  '9-16': ['競馬の日', 'ハイビスカスの日'],
  '9-17': ['牧水忌', 'キュートな笑顔の日'],
  '9-18': ['かいわれ大根の日', 'シェフの日'],
  '9-19': ['苗字の日', '遠距離恋愛の日'],
  '9-20': ['空の日', 'バスの日'],
  '9-21': ['国際平和デー', 'ファッションショーの日'],
  '9-22': ['秋分の日', '孤独と向き合う日'],
  '9-23': ['秋分の日（振替）', '動物の愛護と管理に関する法律施行記念日'],
  '9-24': ['畳の日', '清掃の日'],
  '9-25': ['藤ノ木古墳記念日', '10円カレーの日'],
  '9-26': ['ワープロの日', '台風の特異日'],
  '9-27': ['世界観光の日', '女性ドライバーの日'],
  '9-28': ['孔子忌', 'パソコンの日'],
  '9-29': ['招き猫の日', 'クリーニングの日'],
  '9-30': ['クレジットの日', '交通事故死ゼロを目指す日'],
  '10-1': ['国際音楽の日', '日本酒の日', '衣替え'],
  '10-2': ['望遠鏡の日', '豆腐の日'],
  '10-3': ['登山の日', 'ドイツ統一記念日'],
  '10-4': ['イワシの日', '宇宙開発記念日'],
  '10-5': ['レモンの日', '折り紙の日'],
  '10-6': ['国際協力の日', '役所改革の日'],
  '10-7': ['ミステリー記念日', 'Cotton Day（コットンの日）'],
  '10-8': ['足りないものを探す日', '骨と関節の日'],
  '10-9': ['塾の日', '世界郵便デー'],
  '10-10': ['目の愛護デー', '体育の日'],
  '10-11': ['ウィンクの日', 'リビングの日'],
  '10-12': ['コロンブスデー', '芋煮会フェスティバル'],
  '10-13': ['サツマイモの日', '豆乳の日'],
  '10-14': ['鉄道の日', '世界標準の日'],
  '10-15': ['たすけあいの日', '世界手洗いデー'],
  '10-16': ['世界食糧デー', 'ボスの日'],
  '10-17': ['貯蓄の日', '神嘗祭'],
  '10-18': ['冷凍食品の日', '統計の日'],
  '10-19': ['日ソ共同宣言調印記念日', 'バーゲンの日'],
  '10-20': ['新聞広告の日', 'リサイクルの日'],
  '10-21': ['国際反戦デー', 'あかりの日'],
  '10-22': ['平安遷都の日', 'ドリップコーヒーの日'],
  '10-23': ['電信電話記念日', '津軽弁の日'],
  '10-24': ['国際連合の日', '霜降'],
  '10-25': ['世界パスタデー', '民間航空記念日'],
  '10-26': ['原子炉の日', 'サーカスの日'],
  '10-27': ['テディベアの日', '世界可聴覚デー'],
  '10-28': ['速記記念日', 'おだしの日'],
  '10-29': ['ホームビデオ記念日', '宝塚歌劇団レビュー記念日'],
  '10-30': ['マナーの日', 'たまごの日'],
  '10-31': ['ハロウィン', '世界都市デー'],
  '11-1': ['すしの日', '計量記念日'],
  '11-2': ['キッチン・バスの日', '書道の日'],
  '11-3': ['文化の日', 'アニメの日'],
  '11-4': ['ユネスコ憲章記念日', 'かき（柿）の日'],
  '11-5': ['津波防災の日', '電報の日'],
  '11-6': ['アパート記念日', 'お見合い記念日'],
  '11-7': ['立冬', 'ドラフトの日'],
  '11-8': ['いい歯の日', '刃物の日'],
  '11-9': ['119番の日', 'ベルリンの壁崩壊記念日'],
  '11-10': ['エレベーターの日', '断酒宣言の日'],
  '11-11': ['ポッキー&プリッツの日', '介護の日', '電池の日'],
  '11-12': ['洋服記念日', '皮膚の日'],
  '11-13': ['うるしの日', '基督教記念日'],
  '11-14': ['世界糖尿病デー', 'いい石の日'],
  '11-15': ['七五三', '昆布の日'],
  '11-16': ['幼稚園記念日', '録音文化の日'],
  '11-17': ['蓮根の日', '将棋の日'],
  '11-18': ['土木の日', 'いい家の日'],
  '11-19': ['農業協同組合法施行記念日', 'ペレの誕生日'],
  '11-20': ['世界子どもの日', '求人広告の日'],
  '11-21': ['世界漁業の日', '任天堂設立記念日'],
  '11-22': ['いい夫婦の日', '和歌山県ふるさと誕生日'],
  '11-23': ['勤労感謝の日', '手袋の日'],
  '11-24': ['和食の日', '進化の日'],
  '11-25': ['OLの日', 'ハイビジョンの日'],
  '11-26': ['ペンの日', 'いい風呂の日'],
  '11-27': ['ノーベル賞制定記念日', 'ハンドメイドの日'],
  '11-28': ['フランスパンの日', '洗濯機の日'],
  '11-29': ['いい肉の日', '議会開設記念日'],
  '11-30': ['本みりんの日', '絵本の日'],
  '12-1': ['映画の日', 'カイロプラクティックの日'],
  '12-2': ['日本人宇宙飛行記念日', '原子炉の日'],
  '12-3': ['国際障がい者デー', 'みかんの日'],
  '12-4': ['人権週間', 'E.T.の日'],
  '12-5': ['国際ボランティアデー', 'アルバムの日'],
  '12-6': ['姉の日', '音の日'],
  '12-7': ['大雪', '神戸開港記念日'],
  '12-8': ['成道会', '太平洋戦争開戦記念日'],
  '12-9': ['しそ焼酎・鮎の日', '漱石忌'],
  '12-10': ['世界人権デー', 'ノーベル賞受賞式'],
  '12-11': ['百円玉記念日', '胃腸の日'],
  '12-12': ['漢字の日', 'バッテリーの日'],
  '12-13': ['正月事始め', '煤払い'],
  '12-14': ['討ち入りの日（赤穂浪士）', '南極の日'],
  '12-15': ['年賀郵便特別扱い開始日', 'ゴム手袋の日'],
  '12-16': ['電話の日', '紙の記念日'],
  '12-17': ['飛行機の日', 'モチーフの日'],
  '12-18': ['国連加盟記念日', '東京駅完成記念日'],
  '12-19': ['日本初飛行の日', '乙女の日'],
  '12-20': ['ブリの日', '道路交通法施行記念日'],
  '12-21': ['冬至', 'バスケットボールの日'],
  '12-22': ['労働組合法制定記念日', '改正民法公布記念日'],
  '12-23': ['テレコムの日', '天覧柔道の日'],
  '12-24': ['クリスマスイブ', '学校給食記念日'],
  '12-25': ['クリスマス', 'スケートの日'],
  '12-26': ['プロ野球誕生の日', 'ジャイアントパンダの日'],
  '12-27': ['ピーターパンの日', '浅草仲見世記念日'],
  '12-28': ['官公庁仕事納め', '身体検査の日'],
  '12-29': ['福の日', '肉の日'],
  '12-30': ['地下鉄記念日', 'サバの日'],
  '12-31': ['大晦日', '除夜の鐘'],
}

const PLATFORMS = ['Threads', 'Instagram', 'X (Twitter)']
const TONES = ['Sayaka Angel (やさしい)', 'カジュアル', 'ビジネス']
const TIMESLOT_OPTIONS = [
  { value: '7',  label: '7:00',  note: '恋愛・自己肯定・やさしい関係性' },
  { value: '12', label: '12:00', note: '価値観・暮らしの気づき・仕事観' },
  { value: '18', label: '18:00', note: '商品紹介枠' },
  { value: '21', label: '21:00', note: '商品紹介枠' },
]

type TimeslotType = '7' | '12' | '18' | '21'

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

// 今日の日付を YYYY-MM-DD 形式で返す
function getTodayString() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export default function Home() {
  // ── 日付・記念日 ──
  const [selectedDate, setSelectedDate] = useState(getTodayString())
  const [anniversaries, setAnniversaries] = useState<string[]>([])
  const [anniversaryFetched, setAnniversaryFetched] = useState(false)
  const [selectedAnniversary, setSelectedAnniversary] = useState('')
  const [convertedThemes, setConvertedThemes] = useState<string[]>([])
  const [selectedTheme, setSelectedTheme] = useState('')
  const [themesLoading, setThemesLoading] = useState(false)

  // ── 時間帯 ──
  const [timeslot, setTimeslot] = useState<TimeslotType>('7')

  // ── 商品情報 ──
  const [productName, setProductName] = useState('')
  const [productFeatures, setProductFeatures] = useState('')
  const [productUrl, setProductUrl] = useState('')

  // ── プラットフォーム / 文体 ──
  const [platform, setPlatform] = useState('Threads')
  const [tone, setTone] = useState('Sayaka Angel (やさしい)')

  // ── 評価メモ ──
  const [evaluation, setEvaluation] = useState('')

  // ── 結果 ──
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Result | null>(null)
  const [editedPost, setEditedPost] = useState('')
  const [editedTips, setEditedTips] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  // ── Notion ──
  const [notionSaving, setNotionSaving] = useState(false)
  const [notionSaved, setNotionSaved] = useState(false)

  // ── フォールバック：手入力テーマ ──
  const [manualTheme, setManualTheme] = useState('')
  const [useManualTheme, setUseManualTheme] = useState(false)

  // ──────────────────────────────────────
  // 記念日取得（Phase1: 固定データから）
  // 将来は /api/anniversary に差し替え可能
  // ──────────────────────────────────────
  const fetchAnniversaries = () => {
    setError('')
    const d = new Date(selectedDate)
    const key = `${d.getMonth() + 1}-${d.getDate()}`
    const data = anniversaryData[key] || []

    if (data.length === 0) {
      setError('この日の記念日データがありません。手入力テーマをご使用ください。')
      setUseManualTheme(true)
      return
    }
    setAnniversaries(data)
    setAnniversaryFetched(true)
    setSelectedAnniversary(data[0])
    setConvertedThemes([])
    setSelectedTheme('')
    setUseManualTheme(false)
  }

  // ──────────────────────────────────────
  // AI変換テーマ生成
  // ──────────────────────────────────────
  const convertToThemes = async () => {
    if (!selectedAnniversary) return
    setThemesLoading(true)
    setError('')

    const isProductSlot = timeslot === '18' || timeslot === '21'
    const slotLabel =
      timeslot === '7'  ? '7:00'  :
      timeslot === '12' ? '12:00' :
      timeslot === '18' ? '18:00' : '21:00'

    const systemPrompt = `
あなたはSNSクリエイター「Sayaka Angel」です。
30代女性に向けた、やさしく余白のある投稿テーマを提案します。
曜日名は一切使用しないでください。
JSONのみ返答してください。前置きや説明は不要です。
`
    const userPrompt = isProductSlot
      ? `
投稿時間帯: ${slotLabel}（商品紹介枠）
記念日: ${selectedAnniversary}

【注意】商品紹介枠では記念日を直接テーマに使いません。
「暮らし」「季節感」「使用シーン」を感じさせる投稿テーマを3つ提案してください。
記念日は参照してもよいですが、説明しないでください。

JSON形式で返答:
{"themes": ["テーマ1", "テーマ2", "テーマ3"]}
`
      : `
投稿時間帯: ${slotLabel}
記念日: ${selectedAnniversary}

以下の方針でSayaka Angelらしい投稿テーマを3つ提案してください。
・7:00 → 恋愛・自己肯定・距離感・やさしい関係性
・12:00 → 価値観・人間関係・仕事観・暮らしの気づき
・記念日の名前をそのまま使わず、感情や暮らしへ自然に変換する
・曜日は絶対に使わない

JSON形式で返答:
{"themes": ["テーマ1", "テーマ2", "テーマ3"]}
`

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          _action: 'convert_themes',
          systemPrompt,
          userPrompt,
        }),
      })
      const data = await res.json()

      // テーマ変換専用レスポンスを想定
      // 既存のAPIが対応していない場合のフォールバック
      const themes: string[] = data.themes || [
        `${selectedAnniversary}から感じる、やさしい気づき`,
        `${selectedAnniversary}の日に思うこと`,
        `暮らしの中の小さな変化`,
      ]
      setConvertedThemes(themes)
      setSelectedTheme(themes[0])
    } catch {
      // APIエラー時はシンプルなフォールバック
      const fallback = [
        `${selectedAnniversary}から感じる余白`,
        `暮らしのなかの小さな気づき`,
        `自分に寄り添う時間`,
      ]
      setConvertedThemes(fallback)
      setSelectedTheme(fallback[0])
    } finally {
      setThemesLoading(false)
    }
  }

  // ──────────────────────────────────────
  // 投稿文生成
  // ──────────────────────────────────────
  const generate = async () => {
    const isProductSlot = timeslot === '18' || timeslot === '21'
    const finalTheme = useManualTheme
      ? manualTheme
      : isProductSlot
      ? productName || manualTheme
      : selectedTheme

    if (!finalTheme.trim()) {
      setError(isProductSlot ? '商品名を入力してください' : 'テーマを選択または入力してください')
      return
    }

    setLoading(true)
    setError('')
    setResult(null)
    setEditedPost('')
    setEditedTips('')
    setNotionSaved(false)
    setEvaluation('')

    const d = new Date(selectedDate)
    const slotLabel =
      timeslot === '7'  ? '7:00'  :
      timeslot === '12' ? '12:00' :
      timeslot === '18' ? '18:00' : '21:00'

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theme: finalTheme,
          platform,
          tone,
          productName,
          productFeatures,
          productUrl,
          timeSlot: slotLabel,
          // 7:00・12:00のみ記念日情報を渡す
          ...((!isProductSlot && !useManualTheme) ? {
            selectedDate: `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`,
            anniversaryList: anniversaries,
            selectedTheme: finalTheme,
          } : {}),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || '生成に失敗しました')
        return
      }
      setResult(data)
      setEditedPost(data.fullText)
      setEditedTips(data.tips)
    } catch {
      setError('ネットワークエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  // ──────────────────────────────────────
  // Notion保存
  // ──────────────────────────────────────
  const saveToNotion = async () => {
    if (!result) return
    setNotionSaving(true)
    setError('')

    const d = new Date(selectedDate)
    const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
    const slotLabel =
      timeslot === '7'  ? '7:00'  :
      timeslot === '12' ? '12:00' :
      timeslot === '18' ? '18:00' : '21:00'

    try {
      const res = await fetch('/api/save-notion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // 新規追加項目
          postDate: dateStr,
          usedAnniversary: selectedAnniversary,
          convertedTheme: selectedTheme,
          appliedTimeSlot: slotLabel,
          // 既存項目
          theme: selectedTheme || manualTheme,
          threadsPost: editedPost,
          instagramPost: editedTips,
          reelText: result.reelText,
          bgm: result.bgm,
          imagePrompt: result.imagePrompt,
          hashtags: result.hashtags.join(' '),
          productName,
          productFeatures,
          productUrl,
          timeSlot: slotLabel,
          evaluation,
          usedHook: result.usedHook,
          usedClosing: result.usedClosing,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Notion保存に失敗しました')
        return
      }
      setNotionSaved(true)
    } catch {
      setError('Notion接続エラーが発生しました')
    } finally {
      setNotionSaving(false)
    }
  }

  const copyToClipboard = () => {
    if (!result) return
    navigator.clipboard.writeText(editedPost)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const isProductSlot = timeslot === '18' || timeslot === '21'
  const useAnniversary = (timeslot === '7' || timeslot === '12') && !useManualTheme

  // ──────────────────────────────────────
  // JSX
  // ──────────────────────────────────────
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

        {/* ━━━━━━ STEP 01 ━━━━━━ */}
        <section className={styles.card}>
          <div className={styles.cardLabel}>STEP 01 — 日付・時間帯</div>

          {/* 投稿日 */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              投稿日 <span className={styles.required}>必須</span>
            </label>
            <input
              className={styles.input}
              type="date"
              value={selectedDate}
              onChange={e => {
                setSelectedDate(e.target.value)
                setAnniversaryFetched(false)
                setAnniversaries([])
                setConvertedThemes([])
                setSelectedTheme('')
                setSelectedAnniversary('')
              }}
            />
          </div>

          {/* 時間帯選択 */}
          <div className={styles.formGroup}>
            <label className={styles.label}>投稿時間帯</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginTop: '8px' }}>
              {TIMESLOT_OPTIONS.map(opt => {
                const isActive = timeslot === opt.value
                return (
                  <button
                    key={opt.value}
                    onClick={() => setTimeslot(opt.value as TimeslotType)}
                    type="button"
                    style={{
                      padding: '12px 6px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      textAlign: 'center' as const,
                      display: 'flex',
                      flexDirection: 'column' as const,
                      alignItems: 'center',
                      gap: '4px',
                      background: isActive ? 'rgba(180,140,255,0.28)' : 'rgba(255,255,255,0.05)',
                      border: isActive ? '2px solid #b48cff' : '1px solid rgba(255,255,255,0.12)',
                      color: isActive ? '#e0d0ff' : '#777',
                      fontWeight: isActive ? 700 : 400,
                      boxShadow: isActive ? '0 0 14px rgba(180,140,255,0.4)' : 'none',
                    }}
                  >
                    <span style={{ fontSize: '0.95rem', letterSpacing: '0.03em' }}>
                      {isActive ? '✓ ' : ''}{opt.label}
                    </span>
                    <span style={{ fontSize: '0.63rem', opacity: 0.72, lineHeight: 1.3 }}>
                      {opt.note}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* 時間帯の説明 */}
            <p style={{
              marginTop: '10px', fontSize: '0.78rem', color: '#888',
              lineHeight: 1.5, padding: '8px 12px',
              background: 'rgba(255,255,255,0.03)', borderRadius: '6px',
              borderLeft: '2px solid rgba(180,140,255,0.4)',
            }}>
              {isProductSlot
                ? '💼 商品紹介枠：商品名・季節感・使用シーンを優先します。記念日は使用しません。'
                : timeslot === '7'
                ? '💫 7:00枠：恋愛・自己肯定・やさしい関係性テーマへ変換します。'
                : '💫 12:00枠：価値観・暮らしの気づき・仕事観テーマへ変換します。'}
            </p>
          </div>

          {/* 手動テーマ切り替えリンク */}
          <div style={{ marginBottom: '12px' }}>
            <button
              className={styles.linkBtn}
              onClick={() => setUseManualTheme(!useManualTheme)}
              type="button"
            >
              {useManualTheme ? '← 記念日から生成する' : '✏️ テーマを手入力する'}
            </button>
          </div>
        </section>

        {/* ━━━━━━ STEP 02: 記念日（7・12時のみ） ━━━━━━ */}
        {useAnniversary && (
          <section className={styles.card}>
            <div className={styles.cardLabel}>STEP 02 — 今日は何の日</div>

            <button
              className={`${styles.btn} ${styles.btnSecondary}`}
              onClick={fetchAnniversaries}
              type="button"
            >
              <span className={styles.btnInner}>
                <span className={styles.btnIcon}>📅</span>
                {selectedDate} の記念日を取得
              </span>
            </button>

            {anniversaryFetched && anniversaries.length > 0 && (
              <>
                <div className={styles.formGroup} style={{ marginTop: '16px' }}>
                  <label className={styles.label}>記念日一覧（使用する記念日を選択）</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                    {anniversaries.map(a => {
                      const isActive = selectedAnniversary === a
                      return (
                        <button
                          key={a}
                          onClick={() => {
                            setSelectedAnniversary(a)
                            setConvertedThemes([])
                            setSelectedTheme('')
                          }}
                          type="button"
                          style={{
                            padding: isActive ? '11px 14px 11px 12px' : '11px 16px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            textAlign: 'left' as const,
                            fontSize: '0.88rem',
                            background: isActive ? 'rgba(255,200,100,0.2)' : 'rgba(255,255,255,0.04)',
                            border: isActive ? '2px solid #ffc864' : '1px solid rgba(255,255,255,0.1)',
                            borderLeft: isActive ? '4px solid #ffc864' : '1px solid rgba(255,255,255,0.1)',
                            color: isActive ? '#ffe0a0' : '#999',
                            fontWeight: isActive ? 700 : 400,
                            boxShadow: isActive ? '0 0 10px rgba(255,200,100,0.25)' : 'none',
                          }}
                        >
                          {isActive ? '▶ ' : ''}{a}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {selectedAnniversary && (
                  <button
                    className={`${styles.btn} ${styles.btnSecondary} ${themesLoading ? styles.btnLoading : ''}`}
                    onClick={convertToThemes}
                    disabled={themesLoading}
                    type="button"
                    style={{ marginTop: '12px' }}
                  >
                    <span className={styles.btnInner}>
                      {themesLoading ? (
                        <><span className={styles.spinner} /> AIがテーマを変換中...</>
                      ) : (
                        <><span className={styles.btnIcon}>✦</span> Sayaka向けテーマへ変換</>
                      )}
                    </span>
                  </button>
                )}

                {convertedThemes.length > 0 && (
                  <div className={styles.formGroup} style={{ marginTop: '16px' }}>
                    <label className={styles.label}>AI変換テーマ（使用するテーマを選択）</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                      {convertedThemes.map(t => {
                        const isActive = selectedTheme === t
                        return (
                          <button
                            key={t}
                            onClick={() => setSelectedTheme(t)}
                            type="button"
                            style={{
                              padding: '12px 16px',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              textAlign: 'left' as const,
                              fontSize: '0.88rem',
                              lineHeight: 1.6,
                              background: isActive ? 'rgba(100,200,255,0.22)' : 'rgba(100,200,255,0.04)',
                              border: isActive ? '2px solid #64c8ff' : '1px solid rgba(100,200,255,0.1)',
                              color: isActive ? '#c0eaff' : '#888',
                              fontWeight: isActive ? 700 : 400,
                              boxShadow: isActive ? '0 0 14px rgba(100,200,255,0.3)' : 'none',
                            }}
                          >
                            {isActive ? '✦ ' : ''}{t}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </section>
        )}

        {/* ━━━━━━ 手入力テーマ ━━━━━━ */}
        {useManualTheme && (
          <section className={styles.card}>
            <div className={styles.cardLabel}>テーマ手入力</div>
            <div className={styles.formGroup}>
              <label className={styles.label}>
                投稿テーマ <span className={styles.required}>必須</span>
              </label>
              <input
                className={styles.input}
                type="text"
                placeholder="例: 梅雨前の空気感"
                value={manualTheme}
                onChange={e => setManualTheme(e.target.value)}
              />
            </div>
          </section>
        )}

        {/* ━━━━━━ STEP 03: 商品・投稿設定 ━━━━━━ */}
        <section className={styles.card}>
          <div className={styles.cardLabel}>
            {useAnniversary ? 'STEP 03' : 'STEP 02'} — 商品・投稿設定
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.label}>
                商品名{isProductSlot && <span className={styles.required}> 必須</span>}
              </label>
              <input
                className={styles.input}
                type="text"
                placeholder="例: シリコン磁気ネックレス"
                value={productName}
                onChange={e => setProductName(e.target.value)}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>プラットフォーム</label>
              <select className={styles.select} value={platform} onChange={e => setPlatform(e.target.value)}>
                {PLATFORMS.map(p => <option key={p}>{p}</option>)}
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

          <div className={styles.formRow}>
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
            type="button"
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

        {/* ━━━━━━ 結果 ━━━━━━ */}
        {result && (
          <section className={`${styles.card} ${styles.resultCard}`}>
            <div className={styles.cardLabel}>結果 — 編集・保存</div>

            {result.isDuplicate && (
              <div className={styles.error} style={{
                background: 'rgba(255, 100, 100, 0.1)',
                border: '1px solid #ff6b6b',
                marginBottom: '20px',
                padding: '15px'
              }}>
                ⚠️ <strong>注意:</strong> このフック（1行目）は過去の投稿で使用されている可能性があります。
              </div>
            )}

            <div className={styles.resultMeta}>
              <span className={styles.metaBadge}>{result.meta.platform}</span>
              <span className={styles.metaBadge}>{result.meta.tone}</span>
              {selectedAnniversary && (
                <span className={styles.metaBadge} style={{ background: 'rgba(255,200,100,0.15)', color: '#ffc864' }}>
                  📅 {selectedAnniversary}
                </span>
              )}
              <span className={styles.metaTime}>{result.meta.generatedAt}</span>
            </div>

            <div className={styles.postBox}>
              <h3 style={{ fontSize: '0.9rem', color: '#888', marginBottom: '10px' }}>
                Threads投稿文 <span style={{ fontSize: '0.75rem', color: '#666' }}>（編集できます）</span>
              </h3>
              <textarea
                className={styles.input}
                style={{ minHeight: '220px', background: 'rgba(255,255,255,0.05)', fontSize: '0.9rem', lineHeight: '1.8', whiteSpace: 'pre-wrap' }}
                value={editedPost}
                onChange={e => setEditedPost(e.target.value)}
              />
            </div>

            <div className={styles.postBox} style={{ border: 'none', background: 'rgba(255,255,255,0.03)', marginTop: '10px' }}>
              <h3 style={{ fontSize: '0.9rem', color: '#888', marginBottom: '10px' }}>
                Instagram/リール用詳細 <span style={{ fontSize: '0.75rem', color: '#666' }}>（編集できます）</span>
              </h3>
              <textarea
                className={styles.input}
                style={{ minHeight: '260px', background: 'rgba(255,255,255,0.05)', fontSize: '0.85rem', lineHeight: '1.8', whiteSpace: 'pre-wrap' }}
                value={editedTips}
                onChange={e => setEditedTips(e.target.value)}
              />
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
              <button className={styles.copyBtn} onClick={copyToClipboard} style={{ flex: 1 }} type="button">
                {copied ? '✓ コピーしました！' : '全文をコピー'}
              </button>

              <button
                className={styles.btn}
                style={{ background: notionSaved ? '#43e97b' : '#333', flex: 2 }}
                onClick={saveToNotion}
                disabled={notionSaving || notionSaved}
                type="button"
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
          <p>Sayaka Angel Auto Post System · Calendar Edition</p>
        </footer>
      </div>
    </main>
  )
}
