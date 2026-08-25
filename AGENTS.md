# CNI Motion 作業ルール

## 対象と仕様

- このフォルダだけを独立したWordPressプラグインとして扱います。
- `docs/CNI-MOTION-SPEC.md` をCNI Motion v1.0の唯一のMaster Specificationとして扱います。
- ユーザーから明示的な指示がない限り、Master Specificationを変更しません。
- CNI Blocks、Lightning、Lightning Child Theme、Otter、その他のPluginやThemeは別Projectとして扱い、変更しません。

## 通常の変更

- 変更前に対象ファイルと変更内容を確認し、依頼範囲外の機能を変更しません。
- PHP、JavaScript、CSSなど、対象に応じた構文検査とRegression確認を行います。
- 通常変更ではPlugin Versionを上げません。
- 作業完了時に `build-release.ps1 -Force` で現在VersionのRelease ZIPを最新化します。
- Release ZIPの構造検証結果と生成先を報告します。
- Release ZIPは `build-release.ps1` 以外の方法で生成しません。
- ZIP構造検証に失敗した場合はCommitやPushへ進みません。

## Release

- Codexの判断だけでVersion、Git Tag、GitHub Release、Release Assetを作成しません。
- ユーザーが明示的に「リリースして」と指示した場合だけ、Version更新、Tag、GitHub Release、Release Assetへ進みます。
- Release前にPlugin Header Version、`CNI_MOTION_VERSION`、readmeのStable tag、Tag、ZIP名を一致させます。
- GitHub操作前にRepository、現在Branch、Git status、Diffを確認します。
- 正式Repositoryは `https://github.com/cni-works/cni-motion`、正式slugは `cni-motion` です。
