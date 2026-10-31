# 学内 VM：Nginx による /api/chat のレート制限設定例

学内 VM（Ubuntu 24.04 / Nginx / PM2 単一プロセス）で `/api/chat` を保護するための Nginx 設定例です。
Nginx の設定ファイル自体はリポジトリ外（VM 上の `/etc/nginx/`）にあるため、ここでは追記する内容だけを示します。

アプリ側にも IP 単位のメモリ内レート制限（`src/lib/chatGuard.ts`、既定は 60 秒に 20 回）があります。
Nginx の `limit_req` は、Node.js プロセスに届く前に過剰なリクエストを落とす「外側の防御」として併用します。

## 1. `http` ブロックにゾーンを定義する

`/etc/nginx/nginx.conf` の `http { ... }` 内（または `/etc/nginx/conf.d/chat-ratelimit.conf`）に追記します。

```nginx
# クライアント IP ごとに /api/chat のリクエスト数を数えるゾーン（10MB で約 16 万 IP 分）
# rate=10r/m：平均 1 分あたり 10 リクエスト（6 秒に 1 回）まで
limit_req_zone $binary_remote_addr zone=chat_api:10m rate=10r/m;

# 制限超過時のステータスコード（既定の 503 ではなく 429 を返す）
limit_req_status 429;
limit_req_log_level warn;
```

## 2. `server` ブロックに `/api/chat` 用の location を追加する

既存の `location / { ... }`（Next.js へのプロキシ）より前に置きます。
`proxy_buffering off` は AI ストリーミングに必須なので、この location にも必ず書きます。

```nginx
location = /api/chat {
    # 短時間の連続送信（プリセットチップの連打など）は burst=5 まで遅延なしで許可し、
    # それを超えた分は 429 で即座に拒否する
    limit_req zone=chat_api burst=5 nodelay;

    # リクエストボディの上限（アプリ側の上限：メッセージ 40 件・context 32KB に対して十分な値）
    client_max_body_size 1m;

    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;

    # クライアント IP をアプリに渡す。
    # $proxy_add_x_forwarded_for はクライアントが送った X-Forwarded-For の後ろに追記するため、
    # アプリ（先頭の値を IP として使う）で偽装されてしまう。必ず $remote_addr で上書きする。
    proxy_set_header X-Forwarded-For $remote_addr;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-Proto $scheme;

    # AI ストリーミング応答のために必須
    proxy_buffering off;
    proxy_cache off;
    proxy_read_timeout 60s;
}
```

> 既存の `location /` で `X-Forwarded-For` に `$proxy_add_x_forwarded_for` を使っている場合も、
> `/api/chat` 以外のページには影響しませんが、統一して `$remote_addr` にしておくと安全です。

## 3. 反映と確認

```bash
sudo nginx -t                 # 構文チェック
sudo systemctl reload nginx   # 反映（接続は切れない）
```

連続でリクエストを送り、429 が返ることを確認します（`<host>` は VM のホスト名）。

```bash
for i in $(seq 1 10); do
  curl -s -o /dev/null -w "%{http_code}\n" -X POST https://<host>/api/chat \
    -H 'content-type: application/json' -d '{"messages":[]}'
done
# 最初の数件は 400（空メッセージのためアプリ側の入力検証で拒否）、burst を超えると 429
```

制限された記録は `/var/log/nginx/error.log` に `limiting requests` として出力されます。

## 値の調整の目安

| 設定 | 例の値 | 考え方 |
|---|---|---|
| `rate` | `10r/m` | 1 人が質問を読みながら送る通常の速度を十分に上回る値 |
| `burst` | `5` | プリセットチップを続けて押した程度は許容する |
| アプリ側 `CHAT_RATE_LIMIT_MAX` / `CHAT_RATE_LIMIT_WINDOW_SEC` | `20` / `60` | Nginx より緩くしておき、Nginx を通らない経路（Vercel など）での最後の防御にする |

学内ネットワークで NAT により多くの利用者が同じ IP になる場合は、`rate` と `burst` を大きめにしてください。
