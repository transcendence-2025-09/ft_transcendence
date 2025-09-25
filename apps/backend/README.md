# backend

```
// 起動
pnpm dev

// ビルド&実行
pnpm build
pnpm start

// typecheck
pnpm typecheck
```

feature-based architectureを書いてみた

```
backend > tree
.
├── README.md
├── package.json
├── src
│   ├── auth # 認証処理
│   ├── buildApp.ts # Fastifyインスタンス作成+route登録
│   ├── games # ゲーム処理
│   ├── health # healthチェック(example)
│   │   ├── health.route.ts # healthに関連するroute
│   │   └── index.ts # バレルファイル
│   ├── index.ts # サーバ起動
│   └── shared # DB(SQLite)処理
└── tsconfig.json
```
