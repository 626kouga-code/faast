variable "aws_region" {
  description = "デプロイ先のAWSリージョン"
  type        = string
  default     = "ap-northeast-1"
}

variable "project_name" {
  description = "リソース名のプレフィックスに使うプロジェクト名"
  type        = string
  default     = "trello-app"
}

variable "instance_type" {
  description = "バックエンド用EC2のインスタンスタイプ（このアカウントの無料枠対象はt3.micro/t4g.micro等。`aws ec2 describe-instance-types --filters Name=free-tier-eligible,Values=true`で要確認）"
  type        = string
  default     = "t3.micro"
}

variable "key_pair_name" {
  description = "EC2 SSH接続用の既存キーペア名（事前に `aws ec2 create-key-pair` などで作成しておく）"
  type        = string
}

variable "my_ip_cidr" {
  description = "SSH・アプリ(8080)へのアクセスを許可する自分のグローバルIP（例: 14.11.35.32/32）。IPが変わったら再度取得してterraform applyし直す必要がある"
  type        = string
}

variable "db_password" {
  description = "RDS PostgreSQLのマスターパスワード（tfvarsに直書きせず環境変数 TF_VAR_db_password で渡すこと）"
  type        = string
  sensitive   = true
}

variable "db_instance_class" {
  description = "RDSのインスタンスクラス（無料枠対象: db.t3.micro / db.t2.micro / db.t4g.micro のいずれか。アカウントによって対象が異なる）"
  type        = string
  default     = "db.t3.micro"
}
