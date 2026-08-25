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
- 開発Folderを手動で圧縮してRelease ZIPを作成しません。

## 共通Git安全条件

- 正式Repositoryは `https://github.com/cni-works/cni-motion`、正式remote名は `origin`、正式Branchは `main` です。
- GitHub操作前に `git status`、`git remote -v`、`git branch --show-current`、Diffを確認します。
- `origin`のURLまたは現在Branchが正式値と完全一致しない場合は停止します。
- `git fetch origin` 後にahead / behindを確認し、非fast-forward、remote側のみのCommit、履歴分岐がある場合は停止します。
- Force Push、他Repository、他Branch、他Projectへの操作は禁止します。
- 機密情報、Release ZIP、`release/`、一時ファイルをCommit対象へ含めません。
- Credential、Token、PasswordをRepository、Source、`AGENTS.md`、Scriptへ保存しません。
- Build、構文検査、Regression、ZIP構造検証のいずれかが失敗した場合は後続のCommit、Push、Tag、GitHub Releaseへ進みません。

## 「バックアップして」

ユーザーが「バックアップして」と指示した場合は、次の順序で実行します。

1. `git status` を確認します。
2. `git remote -v` で `origin`が正式Repositoryと完全一致することを確認します。
3. `git branch --show-current` で`main`であることを確認します。
4. `git fetch origin` を実行します。
5. `main`と`origin/main`のahead / behindを確認します。
6. 対象に応じた構文検査とRegression確認を行います。
7. `build-release.ps1 -Force` を実行します。
8. `release/`へ現在Versionの`cni-motion-X.Y.Z.zip`を生成します。
9. ZIPの最上位Folder、必須Runtime、Version、Update URI、除外ファイル、Pathを検証します。
10. 必要なSourceだけをStageし、内容に合うCommitを作成します。
11. `main`を`origin/main`へ通常Pushします。
12. Push後にlocal HEADと`origin/main`のCommit SHAが一致することを確認します。

バックアップではVersion、`CNI_MOTION_VERSION`、Stable tagを変更せず、Tag、GitHub Release、Release Assetを作成しません。作業完了時点で`release/`内の現在Version ZIPを最新状態にします。

## 「リリースして」

ユーザーが「リリースして」または「X.Y.Zにしてリリースして」と指示した場合は、次の順序で実行します。

1. Repository、`origin`、`main`、作業Treeを確認します。
2. `git fetch origin` を実行します。
3. `main`と`origin/main`のahead / behindを確認します。
4. Release Versionを確定します。Version指定がない場合は変更内容に応じた案を提示し、ユーザー確認前にVersionを変更しません。
5. Plugin Header Versionを更新します。
6. `CNI_MOTION_VERSION`を更新します。
7. `readme.txt`のStable tagを更新します。
8. `readme.txt`のChangelogを更新します。
9. `package.json`にVersion metadataがある場合は更新します。既存lockfileがある場合だけ既存Version metadataを整合し、新しいlockfileは生成しません。
10. PHP、JavaScript、CSS、Registry metadata、Version整合、Updater、PowerShellの構文とRegressionを確認します。
11. `build-release.ps1 -Force` を実行します。
12. `release/cni-motion-X.Y.Z.zip`を生成します。
13. ZIP名、最上位Folder、必須Runtime、Version、Update URI、Updater、除外ファイル、二重Folder、Path separatorを検証します。
14. 必要なSourceだけをStageしてRelease Commitを作成します。Release ZIPはCommitしません。
15. `main`を`origin/main`へ通常Pushします。
16. Push後にlocal HEADと`origin/main`のCommit SHAが一致することを確認します。
17. Push済みCommitを指す注釈付き`vX.Y.Z` Tagを作成します。
18. Tagを`origin`へ通常Pushし、remote TagのCommit SHAを確認します。
19. GitHub CLIでDraftでもPre-releaseでもないStable GitHub Releaseを作成します。
20. `cni-motion-X.Y.Z.zip`を正式Release Assetとして添付します。
21. `gh release view`で`isDraft=false`を確認します。
22. `gh release view`で`isPrerelease=false`を確認します。
23. Release Asset名が`cni-motion-X.Y.Z.zip`と完全一致することを確認します。
24. `gh api repos/cni-works/cni-motion/releases/latest`でlatest ReleaseのTag、Asset、uploaded状態を確認します。

最終状態は、WordPressにインストールされた旧Versionから新Versionへの更新通知を出せる、公開済みStable Releaseとします。途中で失敗した場合は後続工程へ進まず、完了済み工程と安全な再開位置を報告します。

## GitHub CLI

- GitHub Release作成、確認、latest Release検証には`gh release create`、`gh release view`、`gh api`を使用します。
- Release開始前のPreflightで`gh --version`と`gh auth status`を確認し、利用不能な場合はVersion変更やCommitへ進む前に停止します。
- GitHub CLIはOS側の安全な認証を使用し、TokenやPasswordをRepositoryやファイルへ保存しません。
- GitHub Releaseは明示的なユーザー指示がある場合だけ作成します。

## Versionと公開の制限

- Codexの判断だけでVersion、Git Tag、GitHub Release、Release Assetを作成しません。
- ユーザーが明示的に「リリースして」と指示した場合だけ、Version更新、Tag、GitHub Release、Release Assetへ進みます。
- Release前にPlugin Header Version、`CNI_MOTION_VERSION`、readmeのStable tag、Tag、ZIP名を一致させます。
- 「バックアップして」ではVersion、Tag、GitHub Releaseを変更しません。
