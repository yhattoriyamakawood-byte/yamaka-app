# ヤマカ木材 育成アプリ — ファイル構成

## ファイル一覧

| ファイル | 役割 | 目安サイズ |
|---|---|---|
| `index.html` | HTML構造（画面レイアウト・ナビ） | ～約 30KB |
| `styles.css` | スタイル定義（デザイン全体） | ～約 15KB |
| `quiz-data.js` | 問題データ（QUIZ_DATA / CASE_STUDY_DATA / GENRE_QUIZ_DATA） | ～約 30KB |
| `app.js` | ロジック（画面遷移・クイズ制御） | ～約 10KB |

合計 ≒ 85KB（元の20万文字 HTML 1ファイルから大幅に分割）

## Coworkで開く手順

1. 4ファイルをすべて同じフォルダに置く
2. `index.html` をブラウザで開くか、Cowork のファイル操作でフォルダごと渡す
3. ブラッシュアップしたいファイルだけを Cowork に投げて指示

## ブラッシュアップのヒント

- **問題追加** → `quiz-data.js` の `QUIZ_DATA` / `CASE_STUDY_DATA` に配列要素を追記するだけ
- **デザイン変更** → `styles.css` の CSS 変数（`:root` ブロック）を変えるだけで全体に反映
- **ロジック追加**（例：進捗保存）→ `app.js` を編集
- **自社商品カテゴリ** → `QUIZ_DATA.product` 配列と `GENRE_QUIZ_DATA.product` オブジェクトを追記

## データ構造（問題1件のフォーマット）

```js
{
  tag: "建築・構造",          // タグ表示用
  q: "問題文",
  choices: ["A", "B", "C", "D"],
  correct: 1,               // 正解のインデックス（0始まり）
  exp: "解説文"
}
```
