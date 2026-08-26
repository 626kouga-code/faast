# faast

Trello風のカンバンボードによるタスク管理アプリ。React製フロントエンドとJava/Spring Bootバックエンドで構成され、カードデータはPostgreSQLに保存する個人向けタスク管理ツールです。

> このリポジトリはもともと講義課題（Gitの基本操作の実践）としてスタートしましたが、要件定義に沿ってTrello風アプリの実装を進めています。課題の背景は[Issue #1](https://github.com/626kouga-code/faast/issues/1)を参照してください。

## 要件定義書

詳細な要件定義は以下に分割してあります。

1. [概要・目的・対象ユーザー](./docs/01_overview.md)
2. [非機能要件・機能要件](./docs/02_requirements.md)（技術スタックのバージョン一覧はこちら）
3. [データモデル・画面構成](./docs/03_design.md)
4. [スコープ外・拡張候補](./docs/04_scope.md)

## 技術スタック

詳細なバージョンは[非機能要件・機能要件](./docs/02_requirements.md#41-技術スタック)を参照してください。

| レイヤー | 主な技術 |
| --- | --- |
| フロントエンド | React + TypeScript + Vite、ドラッグ&ドロップに@dnd-kit、HTTP通信はFetch API |
| バックエンド | Java 21 + Spring Boot 3、Spring Data JPA（Hibernate）、REST API |
| データベース | PostgreSQL（Dockerコンテナ） |
| 永続化方針 | カード本体はバックエンドAPI経由でPostgreSQLに保存。ボード/リスト/ラベルはブラウザのlocalStorageで管理 |

## セットアップ・起動方法

### 前提

- Node.js（フロントエンド）
- Java 21 + Maven（バックエンド）
- Docker（PostgreSQL用）

### 1. データベース起動

```bash
docker compose up -d
```

`docker-compose.yml`により`postgres:16`イメージのコンテナが`localhost:5432`で起動します（DB名: `trello_app`、ユーザー: `trello_user`）。

### 2. バックエンド起動

```bash
cd backend
mvn spring-boot:run
```

`http://localhost:8080`でREST API（`/api/cards`）が起動します。ポートは固定のため、既に8080が使用中の場合は起動に失敗します（詳細は[.claude/skills/dev-server-ports/SKILL.md](.claude/skills/dev-server-ports/SKILL.md)）。

### 3. フロントエンド起動

```bash
npm install
npm run dev
```

`http://localhost:5173`でアプリが起動します。`/api`宛てのリクエストはViteの開発サーバーがバックエンド（8080）へプロキシします。

### ビルド

```bash
npm run build
```

## ディレクトリ構成

```
.
├── src/                 # フロントエンド（React + TypeScript）
│   ├── components/      # ボード・リスト・カード等のUIコンポーネント
│   ├── context/          # ボード状態管理（BoardContext, localStorage）
│   ├── hooks/            # バックエンドAPI連携フック（useBackendCards 等）
│   └── api/              # バックエンドAPIクライアント
├── backend/             # バックエンド（Java / Spring Boot）
│   └── src/main/java/com/example/trelloapp/card/  # カードのController/Service/Repository
├── docs/                # 要件定義書（4分割）
└── docker-compose.yml   # PostgreSQL起動用
```

## 開発ルール

Issue登録・ブランチ命名・PR運用等の開発ルールは[CLAUDE.md](./CLAUDE.md)にまとめています。

## Gitの基本操作（課題として学んだこと）

課題を通じて、以下のGitの一連の流れを実際に手を動かして体験しました。

| 操作 | コマンド例 | 補足 |
| --- | --- | --- |
| ブランチ作成 | `git checkout -b test` | `main`から分岐した新しいブランチが作られ、そこに切り替わる。以降のコミットは`main`に影響しない |
| 変更のコミット | `git add . && git commit -m "..."` | 変更内容をローカルのリポジトリに記録する。この時点ではリモートには反映されない |
| リモートへpush | `git push origin test` | ローカルのコミットをGitHub上の`test`ブランチに反映する。他の人からも見えるようになる |
| プルリクエスト作成 | `gh pr create --base main --head test` | `test`の変更を`main`に取り込むための提案(PR)を作成する。レビューを経てマージできる |
| mainへのマージ | PR経由、または `git merge test` | レビュー後、変更が`main`ブランチに統合される |

### 学んだこと

- 作業ブランチ(`test`)を切って作業することで、`main`ブランチを常に安定した状態に保てる
- コミットメッセージには変更内容と目的を書くことで、後から履歴を追いやすくなる
- プルリクエストを経由することで、変更内容をレビューしてからマージできる
- Issueとプルリクエストを紐付ける(`Closes #1`など)ことで、作業の進捗を追跡しやすくなる

### 今後の課題

- コンフリクトが発生した場合の解消方法(実際に体験して手順を追記する予定)
- レビューを受けてからマージするフロー
