---
name: quality-check
description: |
  このリポジトリでコードをコミット・PR作成する前に必ず使う。フロントエンド(ESLint)・
  バックエンド(Checkstyle/SpotBugs)・Terraform(fmt/validate)の品質チェックを
  一通り実行する手順をまとめたもの。「品質チェックして」「PRを作る前に確認して」
  「コミットする前にチェックして」と言われたときに参照する。
---

# 品質チェック手順

コミット・PR作成前に、変更のあった領域ごとに以下を実行する。

## フロントエンド（`src/` 配下を変更した場合）

```bash
npm run lint
```

[eslint.config.js](../../../eslint.config.js) のflat configによるチェック。エラーが出たら修正してから再実行する。

## バックエンド（`backend/` 配下を変更した場合）

```bash
cd backend
mvn -q -B clean compile
```

[backend/pom.xml](../../../backend/pom.xml) に設定済みのCheckstyle([checkstyle.xml](../../../backend/checkstyle.xml))・SpotBugs([spotbugs-exclude.xml](../../../backend/spotbugs-exclude.xml))がビルドの一部として走り、違反があるとビルド自体が失敗する(`failOnViolation`/`failOnError`が`true`)。テストも合わせて実行する場合は`clean compile`ではなく`clean test`を使う。

## Terraform（`infra/terraform/` 配下を変更した場合）

```bash
cd infra/terraform
terraform fmt -check -diff
terraform validate
```

- `fmt -check -diff`: フォーマット崩れがあれば差分付きで検出する。崩れていたら`terraform fmt`（`-check`無し）で自動整形してから再チェックする。
- `validate`: 構文・設定の妥当性を検証する（実際にAWSへリソースを作成する`plan`/`apply`はここでは行わない）。`terraform init`が未実行の場合は先に実行しておく。

## 適用範囲

PRを作る前、および「品質チェックして」と依頼されたときは、変更されたディレクトリに対応するチェックをすべて実行する。複数領域にまたがる変更(例: フロント+バックエンド+Terraform)では、該当するチェックをすべて行う。
