## 2FA関連のAPI概要
- `GET /api/auth/2fa/generate`：2FA用シークレットの生成とQRコード発行
- `POST /api/auth/2fa/enable`：ワンタイムコード検証による2FA有効化
- `POST /api/auth/2fa/remove`：ワンタイムコード検証による2FA無効化
- `POST /api/auth/2fa/validate`：MFAチケット＋TOTP検証後にセッショントークン発行

## 2FA設定フロー
1. ログイン済みユーザーが `GET /api/auth/2fa/generate` を呼び出すと、
   - 一時的な2FAシークレットをサーバーが生成
   - QRコードと `otpauth://` URLをレスポンスで返却
   - シークレットは HttpOnly Cookie (`TemporaryTwoFactorSecret`) として10分間保持
2. ユーザーはAuthenticatorアプリでQRコードを読み取り、ワンタイムコードを取得
3. 取得したコードを `POST /api/auth/2fa/enable` に送信し、Cookie内シークレットと照合
   一致すればユーザーの `two_factor_secret` を永続化し、2FAを有効化
   検証後は一時シークレットCookieを削除
4. 2FAを無効化したい場合は、現在のワンタイムコードを添えて `POST /api/auth/2fa/remove` を呼び出し、検証成功時に `two_factor_secret` を削除

## 2FA認証フロー
1. `POST /api/auth/login` は、ユーザーの 2FA 有効状態を確認
   - 無効な場合：セッショントークンを発行して完了
   - 有効な場合：セッショントークンの代わりに10分有効のMFAチケット (`mfaTicket` Cookie) を発行し、`needTwoFactor: true` を返す
2. クライアントは `POST /api/auth/2fa/validate` に TOTP コードを送信
   - リクエストのCookieにMFAチケットがある前提で、TOTPを検証
   - 成功時にセッショントークンを発行し、MFAチケットを破棄
   - 失敗時は `passed: false` を返し、セッションは確立されない
