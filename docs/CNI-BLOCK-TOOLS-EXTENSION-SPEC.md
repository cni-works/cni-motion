# CNI Motion Block Tools 拡張仕様

## 位置付け

- `docs/CNI-MOTION-SPEC.md`はCNI Motion v1.0のMaster Specificationとして維持する。
- 本書はBlock Toolsの拡張仕様とする。
- CNI Blocks、Otter、Theme本体は変更しない。
- Otter Migration / Legacy Compatibilityは今回および本書のScope外とする。

## 最重要共存条件

- Otterが有効でもCNI MotionのCustom CSSとVisibilityを利用できる。
- Otterの保存データ、属性、class、CSS、設定を読み取らない。
- Otterのデータを変更、削除、変換、移行しない。
- CNI側は独自属性と`cni-` Prefixの独自classだけを使用する。
- 同一BlockへOtter CSSとCNI CSSが設定された場合は通常のCSS Cascadeが適用される。
- Otterを検出しないため、Otter併用警告は今回実装しない。

## Module設定

`cni_motion_settings`へ独立したModule設定を追加する。

- Custom CSS: Default OFF
- Visibility: Default OFF

`cniCustomCss`、`cniCssId`、`cniVisibility`のAttribute SchemaはModule OFF時も常時登録する。OFF時はInspector、CSS処理、Visibility判定等の実処理だけを停止し、保存済み属性を保持する。

## Support Matrix

Custom CSSとVisibilityは別々のSupport Matrixを持ち、EditorとPHPで同じ判定を使用する。

対象Namespace：

- `core/*`
- `cni-blocks/*`

初期除外：

- `core/html`
- `core/shortcode`
- `core/template-part`
- `core/query`
- `core/post-template`
- `core/navigation`
- `core/block`
- Legacy / Widget系Block

## Visibility

属性：`cniVisibility`

- `all`: 常に表示
- `logged-in`: ログインユーザーのみ
- `logged-out`: 非ログインユーザーのみ

FrontendのPHP描画時に`is_user_logged_in()`で判定し、対象外ではBlock HTML自体を出力しない。Editorでは条件にかかわらず表示する。

Visibilityは表示制御であり、メディアURL、REST API、秘匿情報を保護するアクセス制御ではない。ログイン状態別HTMLを混在させるFull Page Cache設定を使用しない。

## Custom CSS

属性：`cniCustomCss`、`cniCssId`

対象Blockには`cni-block-xxxxxxxx`形式の独自classを付与する。Otterの属性名やclass名は使用しない。

未入力時の`cniCustomCss`は空文字列とする。Textarea上は`selector {\n\n\n}`を入力済みテンプレートとして表示するが、未編集または空Ruleのままなら属性値は空文字列を維持し、ID発行、CSS出力、投稿データ追加を行わない。

編集権限は原則`unfiltered_html`を基準とする。

初期版で対応する記法：

- `selector {}`
- `selector:hover`
- `selector::before` / `selector::after`
- `selector .child`
- `selector > .child`
- カンマ区切り
- `@media`
- CSSコメント

初期版で禁止する記法：

- `@import`
- `@font-face`
- `@namespace`
- `@keyframes`
- `:root`、`html`、`body`等のGlobal Selector
- `selector`を含まないRule
- Scope外へ作用するSelector
- `</style`
- `expression()`
- `javascript:`

`selector`は文字列・コメント・Declaration内を置換せず、Selector Preludeだけを解析して変換する。各Selectorは`selector`から始まるものに限定し、対象Blockの一意class配下へ閉じ込める。

CSS一括集約は初期版の必須条件としない。Synced Pattern、Dynamic Block等でも確実に評価されることを優先し、対象Block直前へScope済み`style`を出力してよい。

Custom CSSはFrontend JSを使用しない。空CSS、Module OFF、非対応Block、権限外UI、解析不能CSSではclassやstyleを出力しない。

### Editor Preview

- Custom CSS ModuleがONで、編集権限を持つユーザーが対象Blockを選択している間だけ有効にする。
- 保存前のTextarea入力を公開画面と同じ許可記法で解析し、選択Blockへ一時的にScopeしてリアルタイム反映する。
- iframe形式のBlock Canvasでは、選択Blockの`ownerDocument`へPreview用`style`を挿入する。
- Block選択解除、CSS変更、無効CSS、Component破棄時にはPreview用styleと一時classを必ず除去する。
- PreviewはBlock Attributeを追加変更せず、`cniCustomCss`とStable IDの通常編集以外で投稿をdirtyにしない。
- VisibilityはEditor PreviewでBlockを非表示にせず、Inspector上で設定状態だけを表示する。

### Responsive CSS Template

- 通常Rule用の`selector {}`、スマホ用、タブレット用、PC用の4種類をClipboardへコピーできるButtonをTextarea下へ表示する。
- ButtonはTextareaやBlock Attributeを変更せず、コピー後に短い結果Feedbackを表示する。
- ユーザーが任意の位置へ貼り付ける方式とし、通常Ruleと複数のMedia Queryを自由に組み合わせられるようにする。
- Breakpointはスマホ`max-width: 480px`、タブレット`481px–959px`、PC`min-width: 960px`とする。

## Stable ID

- CSSを初めて入力した時だけIDを発行する。
- 保存後もIDを維持する。
- Block複製時のID重複をEditorで検出し、複製側へ新IDを発行する。
- Frontendでも重複IDを安全に分離する。
- Custom CSS未使用Blockへclassを付与しない。

## 実装順序

1. Settings Schema / Module基盤
2. Visibility
3. Custom CSS

## 最重要Regression

`Otter ON + Custom CSS OFF + Visibility OFF`で、導入前と比較してFrontendのHTML、CSS、JS、投稿データが変化しないこと。

加えて次を確認する。

- Module OFF後に投稿を再保存してもCNI属性が保持される。
- Otter属性、class、CSSを検索・変更しない。
- Visibility対象外ではHTMLを出力しない。
- EditorではVisibility Blockを消さない。
- Custom CSSが対象Block外へ作用しない。
- Block複製でID競合しない。
- 不正CSSをFrontendへ出力しない。
