# CNI Motion 開発仕様書 v1.0 Complete

**Document:** Codex Implementation Specification  
**Plugin:** CNI Motion  
**Version:** v1.0 Complete  
**Status:** Implementation Ready  
**Language:** Japanese UI / i18n対応  
**旧仕様書:** 本書によってすべて置き換える

---

## 0. Codexへの最重要指示

本書を **CNI Motion v1.0の唯一の実装仕様（Master Specification）** とする。

以前作成した仕様書・旧CSS・旧JavaScriptを前提にせず、本書に基づいて新規設計すること。

旧実装の以下のような方式は移植しない。

```text
.slide-up1
.slide-up2
.slide-up3
.anm
.v
.active
.appear
.fadeout
#splash
.splashbg1
.splashbg2
```

旧実装とのクラス互換性は不要。

また以下は禁止する。

- jQuery
- `window` の `scroll` イベントごとの全DOM走査
- 汎用的な `.active` `.visible` `.appear` 等のクラス
- 外部Animation Libraryへの必須依存
- Lightning固有実装
- CNI Blocksへの必須依存
- JavaScript失敗時にコンテンツが永久に非表示になる設計
- Loaderが永久に残る設計
- Otterのコード・CSS・名称体系のコピー

Otterは機能要求の参考であり、CNI Motionは独自実装とする。

このファイル `docs/CNI-MOTION-SPEC.md` はユーザーの明示的な指示なしに変更しないこと。

---

## 1. プラグイン概要

### 1.1 名称

**Plugin Name:** CNI Motion

### 1.2 Slug

```text
cni-motion
```

### 1.3 Text Domain

```text
cni-motion
```

### 1.4 PHP Namespace

推奨：

```text
CNI\Motion
```

---

## 2. CNI Motionの目的

CNI MotionはWordPress Gutenberg / Block Editorを対象とした「サイトモーション統合管理プラグイン」とする。

従来、サイト制作のたびにSimple Custom CSS and JS等へ記述していた、

- Fade
- Slide
- Zoom
- Blur
- Reveal
- Mask Reveal
- Stagger
- Bounce
- Swing
- Tada
- Jello
- Flip
- Page Loader
- Hero / First View

などをGUIから設定可能にする。

目標は単なるスクロールアニメーションプラグインではない。

> **WordPressサイトの「動き」を、ブロック・First View・Loaderまで一元管理するMotion Toolkit**

とする。

---

## 3. 既存ワークフローを置き換える目標

CNI Motion v1は以下の作業を可能な限り不要にする。

### Simple Custom CSS and JS

サイトごとにアニメーションCSS / JSをコピーする作業。

### Otter Animations

現在Otterを利用している理由のうち、少なくとも以下のMotion用途をCNI Motionで代替する。

- Bouncing
- Fading
- Zooming
- Flipping
- Jello
- Tada
- Swing
- Delay
- Speed
- Hover Trigger
- Trigger Offset
- Editor Replay

Otter全機能の互換プラグインを目指すものではない。

---

## 4. CNIシリーズ内での位置付け

CNI Motionは独立プラグインとする。

```text
CNI
│
├─ CNI Blocks
│  └─ 独自ブロック集
│
├─ My Block Launcher
│  └─ よく使うブロック呼び出し
│
└─ CNI Motion
   └─ ブロック・ページ・LoaderのMotion
```

以下は必須依存にしない。

```text
CNI Blocks
Lightning
Lightning Child Theme
Otter
```

CNI Blocksが存在する場合のみIntegrationを有効化する。

---

## 5. 対応環境

v1基準：

```text
WordPress     6.7以上
PHP           8.0以上
Editor        Gutenberg / Block Editor
JavaScript    Vanilla JavaScript
CSS           CSS Transition / Animation
Observer      IntersectionObserver
Build         @wordpress/scripts 推奨
```

最新安定版WordPressでもテストすること。

---

## 6. 基本設計思想

CNI Motionは必ず以下を分離する。

```text
Effect
+
Trigger
+
Timing
+
Sequence
+
Global Motion
```

### Effect

「何が起こるか」。

例：

```text
Fade
Fade Up
Zoom
Blur Zoom
Bounce
Tada
Reveal
```

### Trigger

「いつ始まるか」。

```text
Auto
Site Ready
Scroll
Hover
Immediate
```

### Timing

「どのくらい待ち、どのくらいの時間で動くか」。

```text
Duration / Speed
Delay
Easing
Distance
Trigger Offset
```

### Sequence

複数要素を連続して表示する機能。

```text
Stagger
Child Interval
```

### Global Motion

サイト全体を制御する。

```text
Page Loader
Site Ready
First View
Hero Sequence
```

---

## 7. 最重要アーキテクチャ

以下のように組み合わせられること。

```text
Fade + Scroll

Fade + Site Ready

Tada + Hover

Tada + Scroll

Mask Reveal + Site Ready

Blur Zoom + Scroll
```

Effect側にTriggerロジックを直接書かない。  
Trigger側にEffect固有コードを書かない。

---

## 8. Effectカテゴリ

v1ではEffectを3カテゴリに分類する。

```text
1. Entrance
2. Reveal
3. Emphasis
```

### Entrance

非表示・変形状態から通常表示へ登場するMotion。

主用途：

- 通常コンテンツ
- Hero
- First View
- Scroll Animation

### Reveal

表示領域・マスクを使ってコンテンツを露出するMotion。

主用途：

- 画像
- Hero
- Cover
- セクション
- 大きなビジュアル

### Emphasis

すでに表示されている要素を動かして強調するMotion。

例：

```text
Tada
Swing
Jello
Bounce
```

Entranceとは別カテゴリとする。

---

## 9. Gutenberg Inspector UI

対応ブロック選択時、右サイドバーへ以下を追加する。

```text
▼ CNI Motion

アニメーション
[ なし ▼ ]

発火
[ 自動 ▼ ]

速度
[ 推奨 ▼ ]

遅延
[ なし ▼ ]

表示タイミング
[ 標準 ▼ ]

詳細設定
[ 開く ]

一度だけ再生
[ ON ]

モバイル
[ ON ]

モバイルでは遅延なし
[ ON ]

[ アニメーションを再生 ]
```

Effectが `None` の場合、不要な設定は隠す。

---

## 10. Effect選択UI

カテゴリ分けする。

```text
アニメーション

よく使う
 ├─ フェードイン
 ├─ フェードアップ
 ├─ ズームイン
 ├─ ブラーズーム
 └─ リビール

Entrance
 ├─ Fade
 ├─ Slide
 ├─ Zoom
 ├─ Bounce In
 ├─ Flip In
 └─ Blur

Reveal
 ├─ Clip Reveal
 └─ Mask Reveal

Emphasis
 ├─ Bounce
 ├─ Pulse
 ├─ Swing
 ├─ Tada
 ├─ Jello
 ├─ Rubber Band
 ├─ Wobble
 ├─ Shake X
 └─ Shake Y
```

最も使用頻度の高い **Fade Inを最上位** に置く。

---

## 11. CNI MotionのMotionデザイン原則

CNI Motionは派手さより実制作での使いやすさを優先する。

特にFade系について、

> **標準状態では移動距離を小さくする。**

長距離から飛び込んでくるFadeを標準にしない。

---

## 12. Entrance Effect仕様

### 12.1 Fade

Slug：

```text
fade
```

開始：

```css
opacity: 0;
```

終了：

```css
opacity: 1;
```

移動なし。

Default：

```text
Duration   800ms
Easing     ease-in-out
```

Motion Design実機調整により、Plain Fadeは移動やScaleを加えず、Opacityのみを滑らかに補間する。

---

### 12.2 Fade Up

Slug：

```text
fade-up
```

開始：

```text
opacity: 0
translateY: +16px
```

終了：

```text
opacity: 1
translateY: 0
```

Default：

```text
Distance   16px
Duration   600ms
Easing     ease-out
```

### 12.3 Fade Down

```text
opacity: 0
translateY: -16px
```

から通常状態へ。

### 12.4 Fade Left

右から左へ。

```text
opacity: 0
translateX: +16px
```

### 12.5 Fade Right

左から右へ。

```text
opacity: 0
translateX: -16px
```

---

### 12.6 Slide系

Fade Directionalよりやや大きく動く。

v1：

```text
slide-up
slide-down
slide-left
slide-right
```

Default Distance：

```text
32px
```

開始時は基本的に `opacity: 0` も併用する。

---

### 12.7 Zoom In

Slug：

```text
zoom-in
```

開始：

```text
opacity: 0
scale: 0.86
```

終了：

```text
opacity: 1
scale: 1
```

Default：

```text
Duration         700ms
Easing           ease-out
Transform Origin center center
```

Motion Design実機調整により、過度に派手にならない範囲でZoom感を明確にする。

### 12.8 Zoom Out

開始：

```text
opacity: 0
scale: 1.10
```

終了：

```text
opacity: 1
scale: 1
```

---

### 12.9 Blur

開始：

```text
opacity: 0
filter: blur(5px)
```

終了：

```text
opacity: 1
filter: blur(0)
```

Default：

```text
Duration 800ms
```

---

### 12.10 Blur Zoom Out

旧 `.anm` の見た目をCNI Motionとして再設計したもの。

Slug：

```text
blur-zoom-out
```

標準開始：

```text
opacity: 0
filter: blur(5px)
scale: 1.12
```

終了：

```text
opacity: 1
filter: blur(0)
scale: 1
```

Default：

```text
Blur       5px
Scale      1.12
Duration   800ms
Easing     ease-out
```

#### Strong Blur Zoom

旧実装の強さを再現したい場合のIntensity設定として、

```text
scale 1.20
blur 5px
```

を選択可能にする。

標準値は `1.12` とし、過剰なZoomを避ける。

---

### 12.11 Blur Zoom In

開始：

```text
opacity: 0
filter: blur(5px)
scale: 0.92
```

終了：

```text
opacity: 1
filter: blur(0)
scale: 1
```

---

### 12.12 Bounce In

Slug：

```text
bounce-in
```

中央位置からBounceしながら出現。

Default Duration：

```text
800ms
```

Directional：

```text
bounce-in-up
bounce-in-down
bounce-in-left
bounce-in-right
```

移動量は大きくしすぎない。

標準最大距離目安：

```text
30～40px
```

巨大な画面外移動を標準にしない。

---

### 12.13 Flip In

v1：

```text
flip-in-x
flip-in-y
```

Default：

```text
Duration 800ms
```

Perspectiveを必要以上に強くしない。

---

## 13. Emphasis Effect仕様

### 13.1 Bounce

Slug：

```text
bounce
```

表示済みの要素がその場でBounceする。

コンテンツを初期非表示にしない。

Motion Design実機調整後のRecommended：

```text
Duration         900ms
Transform Origin center bottom

通常位置
→ 約18px上昇（scaleY 1.03〜1.05）
→ 接地（scaleY 0.96〜0.98）
→ 約9px上昇
→ 接地
→ 約3px上昇
→ 通常位置
```

接地を基準に3段階で自然に減衰し、単に浮くMotionにはしない。

### 13.2 Pulse

```text
scale 1
→ 1.05
→ 1
```

程度の控えめな強調。

### 13.3 Swing

Slug：

```text
swing
```

Transform Origin：

```text
top center
```

左右へ小さく振る。

Default Duration：

```text
800ms
```

### 13.4 Tada

Slug：

```text
tada
```

小さなScale + Rotationを組み合わせた強調。

Motion Design実機調整後のRecommended：

```text
Duration         1000ms
Easing           ease-in-out
Transform Origin center center
Initial Scale    0.92
Emphasis Scale   1.08
Rotation         ±3deg
```

縮む、拡大する、左右へ小刻みに振る、通常状態へ戻る、という構造を維持する。

Default Duration：

```text
1000ms
```

### 13.5 Jello

Slug：

```text
jello
```

Skewを使った弾性的なMotion。

Motion Design実機調整後は、center centerを基準に次の約7段階で弾性減衰させる。

```text
22%  -10deg
33%  +5deg
44%  -2.5deg
55%  +1.25deg
66%  -0.6deg
77%  +0.3deg
88%  -0.15deg
100% 0deg
```

Default Duration：

```text
1100ms
```

### 13.6 Rubber Band

Slug：

```text
rubber-band
```

Scale X/Yの変化による強調。

Motion Design実機調整後のRecommended：

```text
Duration         950ms
Transform Origin center center
30%  scale3d(1.20, 0.80, 1)
42%  scale3d(0.82, 1.18, 1)
54%  scale3d(1.12, 0.88, 1)
66%  scale3d(0.96, 1.04, 1)
78%  scale3d(1.03, 0.97, 1)
100% scale3d(1, 1, 1)
```

X/Yの伸縮を交互に小さくしながら通常状態へ収束させる。

### 13.7 Wobble

Slug：

```text
wobble
```

要素全体の左右移動 + Rotation。

Motion Design実機調整後のRecommended：

```text
Duration         1000ms
Easing           ease-in-out
Transform Origin center center
15%  translateX(-20px) rotate(-5deg)
30%  translateX(16px)  rotate(3deg)
45%  translateX(-12px) rotate(-3deg)
60%  translateX(8px)   rotate(2deg)
75%  translateX(-4px)  rotate(-1deg)
100% translateX(0)     rotate(0)
```

左、右、左、右、左、中央と必ず方向転換しながら減衰させる。上端固定でRotation主体のSwingとは区別する。

### 13.8 Shake

v1：

```text
shake-x
shake-y
```

短い距離で振動。過剰な移動を避ける。

---

## 14. Revealカテゴリ

v1：

```text
Clip Reveal
Mask Reveal
```

### 14.1 Clip Reveal

対象自身の表示領域を広げる。

実装候補：

```text
clip-path: inset()
```

v1：

```text
clip-reveal-left
clip-reveal-right
clip-reveal-up
clip-reveal-down
```

Default：

```text
Duration 800ms
Easing ease-out
```

UIでは方向を曖昧にしない。

例：

```text
左から表示
右から表示
上から表示
下から表示
```

---

### 14.2 Mask Reveal

対象上に色付きマスクを表示し、そのマスクが退場することで対象を露出する。

方向：

```text
Left → Right
Right → Left
Top → Bottom
Bottom → Top
```

Mask Color：

```text
白
黒
カスタムカラー
```

将来的にTheme Palette / Global Styles連携を追加可能にする。

実装は可能な限り擬似要素を利用する。

不要なWrapperを保存HTMLへ追加しない。

テーマの擬似要素と衝突する可能性が高いブロックには無条件で提供しない。

v1推奨Allow List：

```text
core/image
core/group
core/cover
core/media-text
CNI Container系
```

テキストにはClip Revealを優先する。

---

## 15. Effect Definition Registry

Effectをswitch文へ大量に直書きしない。

Effect Registryとして一元定義する。

概念例：

```js
{
    slug: 'fade-up',
    category: 'entrance',
    label: 'フェードアップ',

    defaultDuration: 600,
    defaultEasing: 'ease-out',

    supports: {
        distance: true,
        blur: false,
        maskColor: false
    },

    triggers: [
        'auto',
        'site-ready',
        'scroll',
        'immediate'
    ],

    reducedMotionFallback: 'fade'
}
```

Emphasis例：

```js
{
    slug: 'tada',
    category: 'emphasis',
    defaultDuration: 1000,
    defaultEasing: 'ease-in-out',

    triggers: [
        'auto',
        'site-ready',
        'scroll',
        'hover',
        'immediate'
    ],

    reducedMotionFallback: 'none'
}
```

Effect追加時にMotion Engine全体を書き換えないこと。

---

## 16. Trigger Compatibility

### Entrance

```text
Auto
Site Ready
Scroll
Immediate
```

原則Hover不可。

### Reveal

```text
Auto
Site Ready
Scroll
Immediate
```

原則Hover不可。

### Emphasis

```text
Auto
Site Ready
Scroll
Hover
Immediate
```

Effect選択後、そのEffectで使用可能なTriggerだけ表示する。

無効な組み合わせをユーザーに選ばせない。

---

## 17. Auto Trigger

デフォルト。

基本判定：

```text
ページ初期表示領域内
↓
Site Ready

初期表示領域外
↓
Scroll
```

Heroをユーザーが意識せずSite Readyで発火できるようにする。

レイアウトが確定する前に位置判定しない。

Site Ready準備処理後に `getBoundingClientRect()` 等で初期位置を判定する。

---

## 18. Site Ready

Hero / First View用Trigger。

共通イベント：

```js
document.dispatchEvent(
    new CustomEvent('cni:site-ready')
);
```

### 発火条件

ページにつき **必ず1回だけ**。

以下すべてで成立すること。

```text
Loaderあり
Loaderなし
Loader Skip
Loaderエラー
Storageエラー
Loader最大待機Timeout
```

Loaderあり：

```text
Page Loader
↓
Content Exit
↓
Site Reveal
↓
Loader DOM Removal
↓
cni:site-ready
↓
Hero Motion
```

Loaderなし：

```text
DOM Ready
↓
初期スタイルセット
↓
requestAnimationFrame
↓
requestAnimationFrame
↓
cni:site-ready
```

初期状態が描画される前に最終状態へ切り替えない。

---

## 19. Scroll Trigger

IntersectionObserverを使用する。

禁止：

```js
window.addEventListener('scroll', ...)
```

で全Motion要素を毎回走査する実装。

---

## 20. Trigger Offset

Otterで便利だったTrigger Offset相当を正式搭載する。

UI：

```text
表示タイミング

早め
標準
遅め
カスタム
```

内部値例：

```text
Early   0%
Normal  12%
Late    25%
```

意味：

画面下端からどれだけ内側に入った位置で発火させるか。

例：

```text
Normal
rootMargin:
0px 0px -12% 0px
```

Custom：

```text
0 ～ 50%
```

`threshold` や `rootMargin` という技術用語を通常UIに出さない。

---

## 21. Hover Trigger

Emphasis系で使用。

発火対象：

```text
pointerenter
focusin
```

マウスだけでなくキーボードFocusでも発火可能にする。

### Hover Replay

Hover Triggerは基本的に再Hover可能。

Motion実行中に連続発火して状態が破綻しないよう、v1は「実行中は再発火を無視」でよい。

Touch DeviceではHoverを主要操作にしない。

---

## 22. Immediate

Motion Engine準備後に即発火。

特殊用途。

通常はAutoまたはSite Readyを推奨。

---

## 23. Once / Repeat

### Once

標準：

```text
ON
```

完了後、Scroll Observerから解除する。

### Repeat

要素が画面外へ出たら開始状態へ戻し、再度入った際に再生。

Entrance系でのみ意味を持つ。

---

## 24. Speed / Duration

SpeedとDelayは完全に分離する。

UI：

```text
速度

推奨
速い
標準
ゆっくり
かなりゆっくり
カスタム
```

Preset：

```text
推奨             Effectごとの値
速い             400ms
標準             600ms
ゆっくり         800ms
かなりゆっくり   1200ms
```

Custom：

```text
100 ～ 5000ms
```

範囲外はClampする。

### Effect推奨Duration

| Effect | Default |
|---|---:|
| Fade | 800ms |
| Fade Direction | 600ms |
| Slide | 600ms |
| Zoom In | 700ms |
| Zoom Out | 600ms |
| Blur | 800ms |
| Blur Zoom | 800ms |
| Bounce In | 800ms |
| Flip In | 800ms |
| Clip Reveal | 800ms |
| Mask Reveal | 800ms |
| Bounce | 900ms |
| Pulse | 700ms |
| Swing | 800ms |
| Tada | 1000ms |
| Jello | 1100ms |
| Rubber Band | 950ms |
| Wobble | 1000ms |
| Shake | 600ms |

---

## 25. Delay

UI：

```text
なし
0.1秒
0.2秒
0.3秒
0.4秒
0.5秒
0.6秒
0.8秒
1.0秒
カスタム
```

Custom：

```text
0 ～ 10000ms
```

内部値はms。

---

## 26. Distance

Directional Motionのみ表示。

```text
移動距離

極小
小
標準
大
カスタム
```

値：

```text
極小    8px
小      16px
標準    24px
大      40px
```

Effect独自Defaultを優先できる。

Fade Directional Default：

```text
16px
```

Slide Default：

```text
32px
```

Custom：

```text
0 ～ 200px
```

大きすぎる移動をUIでは推奨しない。

---

## 27. Easing

UI：

```text
推奨
Ease Out
Ease In Out
Ease
Linear
```

Effect推奨値をDefaultにする。

カスタムCubic Bezier Editorはv1では不要。

---

## 28. Mobile Motion

各ブロック：

```text
モバイルでMotion
ON / OFF
```

Default：

```text
ON
```

Mobile Delay：

```text
モバイルで遅延
ON / OFF
```

Default：

```text
OFF
```

つまりMotionは残すが、スマートフォンでは不要な待機時間を減らす。

Breakpoint Default：

```text
768px
```

グローバル設定から変更可能。

安全範囲：

```text
480 ～ 1200px
```

---

## 29. Stagger

親ブロックの子要素を順番に表示する。

主目的：

旧、

```text
slide-up1
slide-up2
slide-up3
slide-up4
```

を不要にする。

### UI

```text
▼ CNI Motion

子要素を順番に表示
[ ON ]

エフェクト
[ Fade Up ]

間隔
[ 0.2秒 ]

開始遅延
[ なし ]

順序
[ 通常 ]
```

Interval Preset：

```text
0.05秒
0.1秒
0.15秒
0.2秒
0.3秒
0.4秒
カスタム
```

Default：

```text
0.15秒
```

### 対象

v1：

```text
直下の子ブロックのみ
```

再帰的に孫以下へ適用しない。

### 優先順位

子ブロック自身に個別CNI Motionが設定されている場合：

```text
個別設定 > 親Stagger
```

### 対応候補

```text
core/group
core/columns
CNI Container
CNI Grid
CNI Cards
```

Block Adapter方式で対応する。

### Mobile

Default：

```text
Mobile Delay OFF
```

つまりSPではStagger間隔を0にしてよい。

---

## 30. Editor Preview

OtterのReplay相当を正式搭載する。

Inspector：

```text
[ アニメーションを再生 ]
```

ルール：

- 保存不要で確認可能
- 編集画面で無限自動再生しない
- 選択ブロックのみ再生
- 実際のDuration / Delayを反映
- Loader Previewとは別機能

---

## 31. Page Loader

Page Loaderはブロック設定ではなく、

```text
WordPress管理画面
→ CNI Motion
→ Page Loader
```

で設定する。

---

## 32. CNI Motion管理画面

構成：

```text
CNI Motion
│
├─ 基本設定
├─ Motion Defaults
├─ Page Loader
└─ Advanced
```

### 基本設定

```text
CNI Motion全体
ON / OFF

Reduced Motion対応
ON

アンインストール時に設定削除
OFF
```

### Motion Defaults

```text
Default Speed
[ 推奨 ]

Default Delay
[ なし ]

Mobile Motion
[ ON ]

Mobile Delay
[ OFF ]

Mobile Breakpoint
[ 768px ]

Default Trigger Offset
[ 標準 ]
```

ブロック個別設定はGlobal Defaultを上書きする。

---

## 33. Page Loader基本UI

```text
CNI Motion / Page Loader

ローダー
[ ON ]

■ 表示条件

表示対象
[ トップページのみ ]

表示頻度
[ セッションごとに1回 ]

管理者
[ 表示しない ]

■ Loader Content

種類
[ サイトロゴ ]

■ Content Motion

Enter
[ Fade ]

保持
[ 700ms ]

Exit
[ Fade Out ]

■ Background

背景色
[ #ffffff ]

■ Site Reveal

[ Split Horizontal ]

■ Safety

最大待機
[ 3000ms ]

[ Loaderをプレビュー ]

[ このブラウザの表示履歴をリセット ]
```

---

## 34. Loader表示対象

v1：

```text
トップページのみ
全ページ
```

将来：

```text
指定ページ
指定投稿タイプ
除外ページ
```

v1では実装必須ではない。

---

## 35. Loader Frequency

v1必須：

```text
毎回
セッションごとに1回
初回訪問のみ
```

### Always

内部：

```text
always
```

対象ページを開くたびに表示。

### Session Once

内部：

```text
session
```

`sessionStorage` を利用。

例：

```text
cni_motion_loader_session_v1
```

同一ブラウザセッション中は再表示しない。

### First Visit Only

内部：

```text
first-visit
```

`localStorage` を利用。

例：

```text
cni_motion_loader_seen_v1
```

同一ブラウザでは基本1回のみ。

Cookie・WordPressユーザー単位ではない。

### Storage Error

Storageアクセスに失敗してもJSエラーにしない。

必ず `try/catch` する。

Storageが利用できない場合：

```text
Loader表示
↓
通常完了
```

を優先する。

### Future Frequency

将来：

```text
1時間に1回
24時間に1回
7日に1回
Custom Duration
```

v1では不要。

---

## 36. Loader Content Type

v1：

```text
Site Logo
Custom Image
Site Title
Custom Text
Line
Dots
None
```

### Site Logo

WordPressのSite Logoを自動取得。

設定：

```text
Desktop Width
Mobile Width
```

Default：

```text
Desktop 300px
Mobile  180px
```

Range：

```text
50 ～ 800px
```

画像比率を維持する。

### Custom Image

Media LibraryからLoader専用画像を選択。

例：

```text
通常ロゴ = 黒
Loader背景 = 黒
Loaderロゴ = 白
```

### Site Title

WordPress Site Titleを使用。

設定：

```text
Desktop Font Size
Mobile Font Size
Font Weight
Letter Spacing
Text Color
```

### Custom Text

Plain Textのみ。

HTMLは禁止。

例：

```text
WELCOME
CNI
BRAND NAME
```

### Line Loader

ロゴがない場合のMinimal Loader。

中央に短いラインを表示し、左右または一方向へ伸縮。

これは **実際のファイル読込進捗率ではない**。

装飾Animationであること。

### Dots Loader

シンプルな複数ドットMotion。

Reduced Motion時は静止表示または非表示。

### None

中央コンテンツなし。

背景Revealのみを実行可能。

---

## 37. Loader Content Motion

ContentとBackground Exitを分離する。

Loader Sequence：

```text
1. Content Enter
2. Hold / Ready Wait
3. Content Exit
4. Site Reveal
5. Loader Remove
6. Site Ready
```

### Content Enter

v1：

```text
None
Fade
Fade Up
Zoom In
Blur In
Clip Reveal
```

Default Duration：

```text
400ms
```

### Hold

Loader Contentを最低限表示する時間。

Default：

```text
700ms
```

Range：

```text
0 ～ 5000ms
```

---

## 38. Page Ready Gate

Loaderは単純な固定Timerだけで閉じない。

以下を考慮する。

```text
Content Minimum Hold
+
Page Ready
```

Page Ready標準：

```text
window.load
```

ただしMaximum Waitを必ず持つ。

Content Exitは以下の両方を満たしたら開始する。

```text
A. Minimum Hold完了
B. window.load または Maximum Wait到達
```

つまり概念上：

```text
Exit Start = max(Hold End, Ready Gate)
```

とする。

---

## 39. Maximum Wait

Default：

```text
3000ms
```

意味：

ページロード完了待機の最大時間。

Maximum Waitを超えたら、

```text
強制的にExit Sequenceへ進む
```

Loaderを永久表示しない。

---

## 40. Content Exit

v1：

```text
None
Fade Out
Zoom Out
Blur Out
Slide Up
```

Default：

```text
Fade Out
400ms
```

---

## 41. Loader Background

v1：

```text
Solid Color
```

Default：

```text
#ffffff
```

Color Pickerを使用。

将来：

```text
Gradient
Image
Theme Palette
```

---

## 42. Site Reveal

中央コンテンツ終了後、Loader背景を退場させてサイトを表示する。

v1：

```text
Fade
Split Horizontal
Split Vertical
Wipe Left
Wipe Right
Wipe Up
Wipe Down
Circle Reveal
```

---

## 43. Classic Split

現在よく使用しているLoaderの後継Preset。

設定：

```text
Content           Site Logo
Desktop Width     300px
Mobile Width      180px

Enter             None / Fade
Hold              700ms

Content Exit      Fade Out
Exit Duration     400ms

Background        #ffffff

Site Reveal       Split Horizontal
Reveal Duration   500ms
```

Preset名：

```text
Classic Split
```

### Split Horizontal

```text
██████│██████

        ↓

←████    ████→

        ↓

       SITE
```

Duration Default：

```text
500ms
```

### Split Vertical

```text
上半分 → 上
下半分 → 下
```

### Wipe

```text
wipe-left
wipe-right
wipe-up
wipe-down
```

### Circle Reveal

中央から円状にサイトを露出。

実装候補：

```text
clip-path: circle()
```

非対応・Reduced Motion時はFadeへFallback。

---

## 44. Loader Presets

v1：

```text
Classic Split
Minimal Fade
Brand Wipe
Circle
```

### Minimal Fade

```text
Logo Fade In
Hold
Logo Fade Out
Background Fade
```

### Brand Wipe

```text
Logo Blur In
Hold
Logo Fade Out
Wipe Right
```

### Circle

```text
Logo Zoom In
Hold
Logo Fade Out
Circle Reveal
```

Preset適用後も各設定を変更可能。

Presetを選んだ瞬間に各値を読み込み、その後は通常設定値として保持する。

---

## 45. Loader Preview

管理画面：

```text
[ Loaderをプレビュー ]
```

Frequencyを無視する。  
Admin Skipを無視する。

v1では管理画面上のFullscreen Preview Overlayでも可。

保存前プレビューが理想。

難しい場合、

```text
保存
↓
Preview
```

でもv1成立とする。

---

## 46. Loader History Reset

管理画面：

```text
[ このブラウザのLoader履歴をリセット ]
```

削除対象：

```text
CNI Motion自身のsessionStorage Key
CNI Motion自身のlocalStorage Key
```

禁止：

```js
localStorage.clear()
sessionStorage.clear()
```

---

## 47. Admin Skip

設定：

```text
ログイン中の管理者にはLoaderを表示しない
```

Default：

```text
ON
```

---

## 48. Loader Scroll Lock

Loader表示中に裏側ページがスクロールしないよう制御する。

例：

```text
html.cni-loader-lock
```

Loader完了・エラー時には必ず解除。

---

## 49. Loader Accessibility

Loaderは装飾的UIとして扱う。

原則：

```html
aria-hidden="true"
```

LoaderのためにScreen Readerから本文を隠さない。

Focus Trapは行わない。

---

## 50. Loader DOM Output

基本：

```text
wp_body_open
```

でbody開始直後に出力。

Loaderが無効ならHTMLを出力しない。

`wp_body_open` 非対応Theme等でLoader DOMが存在しない場合、

```text
Loaderなし
↓
Site Ready
```

として動作する。

Loaderがないことによってページを止めない。

---

## 51. Loader State Machine

内部状態：

```text
idle

→ active

→ waiting

→ content-exit

→ site-reveal

→ complete

→ site-ready
```

状態をTimerの乱立だけで管理しない。

Custom Events：

```text
cni:loader-start
cni:loader-content-exit
cni:loader-reveal
cni:loader-complete
cni:site-ready
```

---

## 52. Site ReadyとHero

Hero側はLoaderの存在を知らない。

禁止：

```text
Heroコード
↓
Loaderがあるか確認
↓
Loader Storageを確認
```

Heroは、

```text
cni:site-ready
```

だけを見る。

Hero例：

```text
Loader Logo
↓
Split Open
↓
Site Ready
↓
Hero Background
↓
Heading Mask/Clip Reveal
↓
Paragraph Fade Up
↓
Button Fade Up
```

Hero Background Slow Zoomはv1では専用Effectとして必須にしない。

将来追加可能な構造にする。

---

## 53. Block Attributes

Prefix：

```text
cniMotion
```

v1：

```text
cniMotionEnabled

cniMotionEffect
cniMotionTrigger

cniMotionSpeedMode
cniMotionDuration

cniMotionDelayMode
cniMotionDelay

cniMotionEasing

cniMotionDistanceMode
cniMotionDistance

cniMotionTriggerOffsetMode
cniMotionTriggerOffset

cniMotionOnce

cniMotionMobile
cniMotionMobileDelay

cniMotionStagger
cniMotionStaggerEffect
cniMotionStaggerInterval

cniMotionMaskColor
```

不要なAttributeはEffectに応じて無視する。

保存例：

```json
{
  "cniMotionEnabled": true,
  "cniMotionEffect": "fade-up",
  "cniMotionTrigger": "auto",
  "cniMotionSpeedMode": "recommended",
  "cniMotionDuration": 600,
  "cniMotionDelayMode": "preset",
  "cniMotionDelay": 200,
  "cniMotionEasing": "recommended",
  "cniMotionDistanceMode": "effect-default",
  "cniMotionDistance": 16,
  "cniMotionTriggerOffsetMode": "normal",
  "cniMotionTriggerOffset": 12,
  "cniMotionOnce": true,
  "cniMotionMobile": true,
  "cniMotionMobileDelay": false
}
```

---

## 54. Attribute登録

対応ブロックのAttributeをWordPress Block Registration段階で追加する。

サーバー側をSource of Truthとする。

Editor側拡張と矛盾しないこと。

---

## 55. InspectorControls

Editor拡張はWordPress Block Editorの標準Filter/HOC方式を使用する。

既存Blockのedit/save関数を直接書き換えない。

---

## 56. 保存HTML

Motion用のHTMLをブロックsave()へ過剰に焼き込まない。

Block Attributeとして保存し、Frontend Rendering時にMotion属性を追加する設計を優先する。

---

## 57. Frontend Rendering

`render_block` 系Filterを利用。

HTML加工にはWordPress HTML APIを使用する。

正規表現によるHTMLタグ書き換えを避ける。

Frontend HTML例：

```html
<div
    class="cni-motion"
    data-cni-motion="fade-up"
    data-cni-trigger="scroll"
    data-cni-duration="600"
    data-cni-delay="200"
    data-cni-offset="12"
>
```

CSS Custom Properties例：

```css
--cni-motion-duration: 600ms;
--cni-motion-delay: 200ms;
--cni-motion-distance: 16px;
--cni-motion-mask-color: #ffffff;
```

既存inline styleを破壊しない。

---

## 58. Motion Element State

共通State：

```text
cni-motion--pending
cni-motion--running
cni-motion--complete
```

禁止：

```text
active
visible
appear
```

等の汎用クラス。

---

## 59. Transform競合対策

CNI MotionのTransformはMotion実行中のみ適用する。

Once完了後は不要なMotion Transformを残さない。

テーマや他プラグインが持つ通常Transformを永久に上書きしない。

Tada / Swing等もAnimation完了後に元のElement状態へ戻す。

Animation Fill ModeによってTransform状態を永久保持しない。

---

## 60. IntersectionObserver Registry

要素ごとに無条件でObserverを新規生成しない。

同じTrigger Offsetを持つ要素は可能な限りObserverを共有する。

例：

```text
Observer Early
Observer Normal
Observer Late
```

Custom Offsetは必要に応じて別Registry。

Once Motionは完了後 `unobserve()` する。

---

## 61. Motion Events

予約：

```text
cni:motion-ready
cni:motion-start
cni:motion-complete
```

CustomEvent `detail` には必要に応じて、

```text
element
effect
trigger
```

等を含められる設計とする。

---

## 62. Fail Safe

最重要。

以下のCSSは禁止。

```css
[data-cni-motion] {
    opacity: 0;
}
```

をJS状態に関係なく適用してはならない。

Motion初期状態は例えば、

```text
html.cni-motion-js
```

等が存在する場合のみ有効化する。

必要ならHeadで非常に小さなBootstrapを使用し、

```text
cni-motion-js
```

を早期付与する。

ただしMain Engineが起動しなかった場合に解除するFallbackを必ず設ける。

最終原則：

```text
JS成功
→ Motion

JS失敗
→ 通常表示
```

Loaderも同様：

```text
Loader成功
→ 演出して表示

Loader失敗
→ 即サイト表示
```

Loaderはサイト表示の必須条件ではない。

---

## 63. Reduced Motion

OSの、

```text
prefers-reduced-motion: reduce
```

を尊重する。

### Entrance

以下を大幅に削減またはFadeへFallback。

```text
Slide
Bounce
Flip
Zoom
Blur
```

### Emphasis

```text
Tada
Jello
Swing
Bounce
Wobble
Shake
```

は原則実行しない。

### Reveal

Clip / Mask Revealは、

```text
短いFade
または即表示
```

へFallback。

### Loader

以下は使わない。

```text
Split
Wipe
Circle
Zoom
```

代わりに、

```text
即表示
または非常に短いFade
```

とする。

目安：

```text
150ms以下
```

---

## 64. Performance原則

優先：

```text
opacity
transform
```

必要時のみ：

```text
filter
clip-path
```

Blur Default：

```text
5px
```

程度に留める。

極端なBlur値を標準Presetにしない。

`will-change` はページ全体へ恒久的に設定しない。

必要なMotion実行直前のみ利用し、完了後に解除する。

Motion対象がないページで重い初期化を行わない。

Page Loader OFFならLoader専用処理を可能な限り読み込まない。

---

## 65. CSS分離

推奨：

```text
motion.css
effects.css
loader.css
admin.css
editor.css
```

必要性に応じてBuild時統合してもよいが、責務は分離する。

---

## 66. 対応Core Blocks v1

正式対象：

```text
core/paragraph
core/heading
core/image
core/group
core/cover
core/columns
core/column
core/buttons
core/button
core/media-text
core/list
core/list-item
```

初期除外：

```text
core/html
core/shortcode
core/template-part
core/query
core/post-template
```

安全性を確認してから追加する。

---

## 67. Effect Block Support Matrix

すべてのEffectをすべてのBlockへ出さない。

例：

### Paragraph

```text
Entrance   YES
Emphasis   YES
Clip       YES
Mask       NO
Stagger    NO
```

### Image

```text
Entrance   YES
Emphasis   YES
Clip       YES
Mask       YES
```

### Group

```text
Entrance   YES
Emphasis   YES
Clip       YES
Mask       YES
Stagger    YES
```

### Columns

```text
Entrance   YES
Stagger    YES
```

Registryで管理する。

---

## 68. CNI Blocks Integration

CNI Blocksが存在する場合のみ追加。

独立ファイル例：

```text
integrations/cni-blocks.php
```

CNI Blocksは必須依存にしない。

禁止：

```text
CNI Motionを使うにはCNI Blocks必須
```

逆も禁止。

Integration例：

```text
CNI Grid → Stagger
CNI Cards → Stagger
CNI Container → Reveal
```

等を最適化。

---

## 69. Settings Storage

Option：

```text
cni_motion_settings
```

原則1Option。

Schema例：

```json
{
  "schemaVersion": 1,
  "general": {},
  "defaults": {},
  "loader": {},
  "accessibility": {}
}
```

将来設定構造が変わることを想定し、

```text
schemaVersion
```

を必ず持つ。

Plugin VersionとSettings Schema Versionを混同しない。

---

## 70. Loader Settings例

```json
{
  "enabled": true,
  "scope": "front-page",
  "frequency": "session",

  "skipAdmin": true,

  "preset": "classic-split",

  "contentType": "site-logo",

  "logoDesktopWidth": 300,
  "logoMobileWidth": 180,

  "contentEnter": "fade",
  "contentEnterDuration": 400,

  "holdDuration": 700,

  "contentExit": "fade-out",
  "contentExitDuration": 400,

  "backgroundColor": "#ffffff",

  "siteReveal": "split-horizontal",
  "siteRevealDuration": 500,

  "maxWait": 3000
}
```

---

## 71. Security

Settings capability：

```text
manage_options
```

を基本とする。

Sanitize必須：

```text
Color       → sanitize
Text        → plain text sanitize
Media ID    → integer
Duration    → integer + range
Delay       → integer + range
Distance    → integer + range
Preset      → allow list
Effect      → allow list
Trigger     → allow list
Easing      → allow list
```

ユーザーから自由なCSS文字列を入力させない。

v1 Customは、

```text
数値
色
```

等の安全な値に限定。

---

## 72. Naming Rules

### CSS Class

必ずPrefix。

```text
.cni-motion
.cni-motion--pending
.cni-motion--running
.cni-motion--complete

.cni-loader
.cni-loader__content
.cni-loader__panel
.cni-loader--active
.cni-loader--exiting

.cni-site-ready
```

### Storage Key

必ず：

```text
cni_motion_
```

Prefix。

### Event

必ず：

```text
cni:
```

Prefix。

---

## 73. 推奨ファイル構成

```text
cni-motion/
│
├─ AGENTS.md
├─ cni-motion.php
├─ uninstall.php
├─ readme.txt
├─ package.json
│
├─ docs/
│  ├─ CNI-MOTION-SPEC.md
│  └─ IMPLEMENTATION-STATUS.md
│
├─ includes/
│  ├─ class-plugin.php
│  ├─ class-assets.php
│  ├─ class-settings.php
│  ├─ class-block-attributes.php
│  ├─ class-block-renderer.php
│  ├─ class-loader.php
│  ├─ class-compatibility.php
│  └─ helpers.php
│
├─ src/
│  │
│  ├─ editor/
│  │  ├─ index.js
│  │  ├─ inspector.js
│  │  ├─ preview.js
│  │  ├─ block-support.js
│  │  │
│  │  ├─ controls/
│  │  │  ├─ EffectControl.js
│  │  │  ├─ TriggerControl.js
│  │  │  ├─ SpeedControl.js
│  │  │  ├─ DelayControl.js
│  │  │  ├─ DistanceControl.js
│  │  │  ├─ OffsetControl.js
│  │  │  └─ StaggerControl.js
│  │  │
│  │  └─ presets/
│  │     ├─ effects.js
│  │     └─ block-support.js
│  │
│  ├─ frontend/
│  │  ├─ index.js
│  │  ├─ engine.js
│  │  ├─ observer.js
│  │  ├─ triggers.js
│  │  ├─ site-ready.js
│  │  ├─ stagger.js
│  │  ├─ hover.js
│  │  └─ loader.js
│  │
│  └─ admin/
│     ├─ index.js
│     ├─ settings.js
│     └─ loader-preview.js
│
├─ assets/
│  ├─ css/
│  │  ├─ motion.css
│  │  ├─ effects.css
│  │  ├─ loader.css
│  │  ├─ editor.css
│  │  └─ admin.css
│  │
│  └─ images/
│
└─ integrations/
   └─ cni-blocks.php
```

Codexは必要に応じてファイル数を合理化してよい。

責務分離は維持すること。

---

## 74. AGENTS.md 推奨ルール

ルートの `AGENTS.md` には最低限以下を記載すること。

```md
# CNI Motion Development Rules

CNI Motion の Master Specification は以下です。

docs/CNI-MOTION-SPEC.md

実装・修正・レビューを行う前に必ずこの仕様書を確認してください。

仕様書と既存コードが矛盾している場合、
独自判断で仕様を変更せず、矛盾点を報告してください。

CNI-MOTION-SPEC.md はユーザーの明示的な指示なしに変更しないでください。

CNI Blocks、Lightning、他プラグインのコードは、
明示的な指示なしに変更しないでください。
```

---

## 75. IMPLEMENTATION-STATUS.md

仕様書とは別に、Codexが実装進捗を管理する。

例：

```text
Phase 1 ✅
Phase 2 🚧
Phase 3 未着手

未実装：
- Mask Reveal
- Circle Loader

Known Issues：
- ...
```

`CNI-MOTION-SPEC.md` に進捗メモを書かない。

---

## 76. Otterとの共存

CNI MotionはOtterを自動停止・変更しない。

両方が有効でもPlugin Errorを起こさない。

ただし同一Blockに複数Animation Systemを重ねた場合のTransform競合は保証しない。

v1ではOtter Animationの自動移行は実装しない。

---

## 77. Legacy CSSとの互換

以下の旧ClassをCNI Motionが自動解釈する機能はv1では不要。

```text
slide-up1
slide-up2
slide-left3
anm
v
```

既存サイトの移行は手動。

---

## 78. v1で実装しないもの

以下はv1 Scope外。

```text
1文字ずつText Animation
Word単位Animation
Line単位Text Split
GSAP
Parallax
Mouse Follow
Scroll Progress
Scroll Scrub
Complex Timeline Editor
Real Loading Percentage
User Custom Keyframes
Arbitrary CSS Editor
24時間Frequency
7日Frequency
Page Builder専用対応
Otter Animation自動変換
```

---

## 79. Future候補

v1以降：

```text
Text Reveal
Character Animation
Background Slow Zoom
Parallax
Custom Preset Save
Timeline
Advanced Loader
Typography Loader
Theme Palette Integration
Conditional Loader
Scroll-linked Motion
```

---

## 80. v1必須Effect一覧

### Entrance

```text
Fade
Fade Up
Fade Down
Fade Left
Fade Right

Slide Up
Slide Down
Slide Left
Slide Right

Zoom In
Zoom Out

Blur
Blur Zoom In
Blur Zoom Out

Bounce In
Bounce In Up
Bounce In Down
Bounce In Left
Bounce In Right

Flip In X
Flip In Y
```

### Reveal

```text
Clip Reveal Left
Clip Reveal Right
Clip Reveal Up
Clip Reveal Down

Mask Reveal Left → Right
Mask Reveal Right → Left
Mask Reveal Top → Bottom
Mask Reveal Bottom → Top
```

### Emphasis

```text
Bounce
Pulse
Swing
Tada
Jello
Rubber Band
Wobble
Shake X
Shake Y
```

---

## 81. v1必須Trigger

```text
Auto
Site Ready
Scroll
Hover
Immediate
```

EffectごとのCompatibilityを守る。

---

## 82. v1必須Timing

```text
Recommended Speed
Speed Presets
Custom Duration

Delay Presets
Custom Delay

Distance Presets
Custom Distance

Trigger Offset Presets
Custom Trigger Offset

Easing
```

---

## 83. v1必須Responsive

```text
Mobile Motion ON/OFF
Mobile Delay ON/OFF
Global Breakpoint
```

---

## 84. v1必須Stagger

```text
Group
Columns
CNI Integration可能部分

直下Child
Interval
Individual Override
Mobile Delay Handling
```

---

## 85. v1必須Editor

```text
Inspector Panel
Effectカテゴリ
Dynamic Controls
Replay Button
```

---

## 86. v1必須Page Loader

```text
ON / OFF

Front Page
All Pages

Always
Session Once
First Visit Only

Site Logo
Custom Image
Site Title
Custom Text
Line
Dots
None

Desktop Logo Size
Mobile Logo Size

Content Enter
Hold
Content Exit

Solid Background Color

Fade
Split Horizontal
Split Vertical
Wipe 4 Direction
Circle Reveal

Maximum Wait
Admin Skip
Preview
Storage Reset
```

---

## 87. v1必須Global Integration

```text
Loader → Site Ready

Loader Skip → Site Ready

Loader Failure → Site Ready

No Loader → Site Ready

Site Ready → Hero Motion
```

---

## 88. Site Logo Missing

`contentType = site-logo` なのにSite Logoが存在しない場合：

Fallback：

```text
Site Title
```

を推奨。

Site Titleも空なら：

```text
None
```

へFallback。

Fatal/Errorを起こさない。

---

## 89. QA：Motion

各Effectについて確認：

```text
Frontend動作
Editor Replay
Speed
Delay
Reduced Motion
Mobile
Once
Repeat
```

---

## 90. QA：Trigger

確認：

```text
Hero initial viewport
Below fold
Scroll backward
Repeat
Hover mouse
Hover keyboard focus
Immediate
```

---

## 91. QA：Trigger Offset

```text
Early
Normal
Late
Custom 0
Custom 50
```

---

## 92. QA：Stagger

```text
Group 3 children
Group 10 children
Columns
Child override
Mobile no-delay
Nested group
```

Nestedは直下のみ適用されること。

---

## 93. QA：Loader

確認：

```text
Front Page only
All Pages

Always
Session
First Visit

Storage unavailable

Fast connection
Slow connection
window.load never/late

Max Wait

Admin Skip

Preview

Storage Reset
```

---

## 94. QA：Loader Content

```text
Site Logo exists
Site Logo missing
Custom Image
Site Title
Custom Text
Line
Dots
None
```

---

## 95. QA：Loader Hero

確認：

```text
Loader表示
→ Hero発火

Loader Skip
→ Hero発火

Loader OFF
→ Hero発火

Loader Error
→ Hero発火
```

Hero MotionがLoader裏で先に終了しないこと。

---

## 96. QA：Fail Safe

意図的にFrontend Main JSを停止。

期待：

```text
本文が読める
Motion対象が透明のまま残らない
```

---

## 97. QA：Loader Fail Safe

Loader JSへ意図的な失敗を発生。

期待：

```text
Loaderが消える
Scroll Lock解除
サイト表示
```

---

## 98. QA：Accessibility

```text
prefers-reduced-motion
Keyboard Focus
Screen Reader DOM
Loader aria-hidden
```

Motionが情報取得の必須条件になっていないこと。

---

## 99. QA：Performance

大量要素テスト：

```text
50 Motion Blocks
100 Motion Blocks
20 Blur Motion
Stagger 20 children
```

スクロール時に毎Frame全DOM走査しないこと。

---

## 100. QA：Theme

最低限：

```text
WordPress Default Theme
Lightning
Lightning Child Theme
```

で確認。

---

## 101. QA：Plugins

最低限：

```text
CNI Blocks OFF
CNI Blocks ON

Otter OFF
Otter ON
```

Plugin Fatalを起こさない。

---

## 102. Development Phase 1 — Core Foundation

```text
Plugin Bootstrap
Settings
Assets
Attributes
Inspector
Frontend Renderer
Effect Registry
```

---

## 103. Development Phase 2 — Motion Engine

```text
Fade
Directional Fade
Slide
Zoom
Blur
Observer
Site Ready
Speed
Delay
Offset
```

---

## 104. Development Phase 3 — Advanced Entrance / Emphasis

```text
Bounce
Flip
Swing
Tada
Jello
Pulse
Rubber Band
Wobble
Shake
Hover
```

---

## 105. Development Phase 4 — Reveal

```text
Clip Reveal
Mask Reveal
Block Compatibility
```

---

## 106. Development Phase 5 — Stagger

```text
Group
Columns
Child Override
Mobile
```

---

## 107. Development Phase 6 — Loader Core

```text
Settings
Frequency
Storage
Content
Classic Split
Fade
Wipe
Site Ready
Fail Safe
```

---

## 108. Development Phase 7 — Loader Extended

```text
Split Vertical
Circle Reveal
Line
Dots
Preview
Reset
```

---

## 109. Development Phase 8 — CNI Integration

```text
CNI Blocks detection
Adapters
Stagger
Reveal compatibility
```

---

## 110. Development Phase 9 — QA / Stabilization

```text
Performance
Accessibility
Theme compatibility
Mobile
Failure testing
```

---

## 111. Codex実装時の作業ルール

一度に全機能を巨大な単一ファイルへ実装しない。

Phase単位で実装する。

各Phase完了時に、

```text
変更ファイル
実装内容
Known Issues
次Phase
```

を報告する。

---

## 112. Codexは既存ファイルを最初に調査する

もし `cni-motion` ディレクトリが既に存在する場合、

```text
構成確認
↓
既存コード確認
↓
本仕様とのConflict確認
↓
実装
```

とする。

ユーザーの明示許可なく他Pluginへ変更を入れない。

---

## 113. CNI Blocks変更禁止

CNI Blocksとの連携が必要な場合でも、

原則：

```text
cni-motion側のintegration
```

で対応する。

CNI Blocks本体を変更する必要が生じた場合は勝手に変更せず報告する。

---

## 114. Lightning変更禁止

Lightning Child ThemeへCNI Motion用CSS/JSを書かない。

CNI Motion内で完結させる。

---

## 115. Simple Custom CSS and JS依存禁止

CNI Motionが動作するために、

```text
Simple Custom CSS and JS
```

のコードを必要としないこと。

---

## 116. Old Code不要

開発開始時に旧CSS / JavaScriptを要求しない。

本仕様書の数値・挙動を基準に実装する。

旧コードは必要になった場合のみQA比較資料として使用する。

---

## 117. 旧挙動の重要参考値

コードそのものではなく以下のみ仕様値として維持する。

### Classic Slide

```text
Direction Motion
20px前後
600ms
```

ただしCNI標準Fade Directionは16pxへ改善する。

### Blur Zoom旧挙動

```text
Blur 5px
Scale 1.2
800ms
```

CNI標準はScale 1.12。

Strong設定で1.2を再現可能。

### Classic Loader

```text
Logo Hold      700ms
Logo Fade      400ms
Split          500ms
White BG
```

---

## 118. Acceptance Criteria

CNI Motion v1.0は以下を満たした場合に完成とする。

### A

Simple Custom CSS and JSへFade / Slide / Blur Zoom / Loaderコードを書かなくても同等用途を実現できる。

### B

Otterをアニメーション目的だけで使用していた主要用途、

```text
Fade
Bounce
Zoom
Flip
Jello
Tada
Swing
Delay
Speed
Hover
Offset
Replay
```

をCNI Motionで代替できる。

### C

HeroがLoader裏で先にアニメーション終了しない。

### D

Loaderの表示頻度を、

```text
毎回
セッション1回
初回訪問のみ
```

から選択できる。

### E

ロゴがなくても、

```text
Site Title
Custom Text
Line
Dots
None
```

でLoaderが成立する。

### F

JSが壊れても本文が読める。

### G

Loaderが壊れてもサイトへ入れる。

### H

Mobile Delayを簡単に無効化できる。

### I

Group等で子要素をStagger表示できる。

### J

Reduced Motionを尊重する。

---

## 119. CNI Motionの最終コンセプト

CNI Motionは「Animationをたくさん持つPlugin」で終わらせない。

目指すもの：

> **制作現場で繰り返し使う“動き”を、コードを書かず、派手すぎず、サイトごとに細かく調整できるWordPress Motion System**

特に、

```text
Fade Inを使いやすく
移動距離は控えめ
SpeedとDelayは独立
PresetとCustomを両立
HeroとLoaderを正しく連携
Revealを実用的に
Staggerで連番Classを不要に
Emphasis Motionも利用可能
MobileとAccessibilityを最初から考慮
```

をCNI Motion固有の設計方針とする。

---

## 120. 最終優先順位

実装判断に迷った場合は、以下の順番で優先する。

```text
1. コンテンツが確実に表示される
2. WordPressを壊さない
3. 操作が簡単
4. 実制作で使いやすい
5. Performance
6. Accessibility
7. 見た目の派手さ
8. Effect数
```

Effect数を増やすために品質を落としてはならない。

---

# END

**CNI Motion Development Specification v1.0 Complete**

この文書をCNI Motion v1.0開発のMaster Specificationとする。
