=== CNI Motion ===
Contributors: cni
Requires at least: 6.7
Tested up to: 7.1
Requires PHP: 8.0
Stable tag: 1.1.1
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

== Description ==
Gutenbergブロックのアニメーション、Stagger、First ViewとPage Loaderを一元管理します。

Effectごとの推奨値、Trigger、Once / Repeat、Mobile設定、Stagger、Editor Replay、安全なPage LoaderをWordPress標準UIから設定できます。

== Installation ==
1. プラグインを有効化します。
2. ブロック編集画面の「CNI Motion」でエフェクトを設定します。
3. 「設定 > CNI Motion」でPage Loaderを設定します。

== Changelog ==
= 1.1.1 =
* ブロック単位Custom CSSで、`selector img`や`selector .class`などの子孫セレクタが正しく適用されるよう修正しました。
* Gutenberg Editor Previewと公開画面で同じスコープCSS変換結果になるよう整合しました。

= 1.0.5 =
* 文字アクセント設定ポップアップのレイアウトと視認性を改善しました。
* CNI Blocksの見出し+で文字アクセントを利用する際の選択判定と互換性を改善しました。
* Page Loaderの表示開始と演出遷移をさらに安定化しました。

= 1.0.4 =
* 文字範囲へ単色・グラデーション・下線・ブラシのアクセントアニメーションを設定できるようにしました。
* 文字アクセントの編集ポップアップをコンパクト化し、見出し+の選択判定を改善しました。
* Page Loaderのロゴ表示準備とEnter開始タイミングを安定化しました。

= 1.0.3 =
* Character Animation、Text Marquee、対応ブロック限定のParallaxを追加しました。
* ブロック単位のVisibilityと安全にスコープされたCustom CSSを追加しました。
* Custom CSSをGutenberg編集画面でリアルタイムに確認できるようにしました。
* Otterの保存データやclassへ干渉せず共存できる独立実装としました。

= 1.0.2 =
* Page Loaderの初期表示、Fail Safe、画面遷移、Scrollbar復元を改善しました。
* Loader画像をテーマに依存せず設定でき、Desktop / Mobile幅を反映するよう改善しました。
* CNI Blocks連携対象を実在Blockへ拡張し、見出し+を含むBlockでMotion設定を利用できるようにしました。
* Mobile Staggerの連続表示とZoom Inの強度選択を追加しました。

= 1.0.1 =
* GitHub Release updaterと配布基盤の正式運用を開始しました。
* v1.0.0からPlugin機能の変更はありません。

= 1.0.0 =
* 初回リリース。
