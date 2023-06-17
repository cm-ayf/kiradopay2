# [Kiradopay 2](https://kiradopay2.vercel.app/)

同人誌即売会用のレジアプリです．[Kiradopay](https://github.com/takemar/kiradopay)を原型としています．  

## 更新点

- カスタムサーバーを排除
  - Kiradopayでは，WebSocketを利用するためにカスタムサーバーが必要でした．
  - Vercelでのデプロイを想定し，Next.jsのAPI Routeを利用することで，カスタムサーバーを排除しました．
- 認証機能を導入
  - Kiradopayでは，認証は行われていませんでした．
  - DiscordのOAuth2機能を利用し，認証機能を導入しました．
  - Discordを選定した理由は以下の通りです：
    - 招待制である
    - OAuth2に対応している
    - 東京大学きらら同好会は基幹コミュニティとしてDiscordを利用している
    - 同好会内での権限管理をロールで行うことができる
- イベント情報・商品情報を管理するUIを実装
  - Kiradopayでは，イベント情報・商品情報を管理するUIは存在しませんでした．
    - そのため，データベースに直接アクセスする必要がありました．
  - 適切なUIとAPIを実装し，イベント情報・商品情報を簡単に管理することができるようになりました．

## 技術スタック

- [TypeScript](https://www.typescriptlang.org/)
- [Next.js](https://nextjs.org/)：フロントエンドおよびバックエンド
- [React](https://reactjs.org/)：フロントエンド
- [MUI](https://mui.com/)：UIフレームワーク
- [TypeBox](https://github.com/sinclairzx81/typebox)：実行時型検査
- [Prisma](https://www.prisma.io/)：ORM

## 開発

- 準備
  - Node.jsをインストールしてください．
  - `npm install`を実行してください．
  - [環境変数の項](#環境変数)を参照して`.env.local`を作成してください．
- 実行：`npm run dev`を実行してください．

## デプロイ

### ホスティング
ホスティングには[Vercel](https://vercel.com/)を利用することを想定しています．  
デプロイ方法については[公式ドキュメント](https://vercel.com/docs/concepts/deployments/overview)を参照してください．

また，Next.jsのSSRおよびAPI Routeが動作する他のプラットフォームでも動作すると考えられます．

### データベース
データベースには[Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)を利用することを想定しています．  
デプロイ方法については[公式ドキュメント](https://vercel.com/docs/storage/vercel-postgres/quickstart)を参照してください．

また，[Prismaスキーマ](prisma/schema.prisma)を変更することで，他のデータベースでも動作すると考えられます．スキーマはVercel Postgres向けに調整されていることに注意してください．

### 認証

認証には[Discord](https://discord.com/)を利用します．  
通常のDiscordボットとは異なり，Client IDとClient Secretを利用してOAuth2認証を行います．  
[Discord Developer Portal](https://discord.com/developers/applications)でアプリケーションを用意してください．

## 環境変数

Vercel上で設定し，[Vercel CLI](https://vercel.com/docs/cli)でダウンロードすることを想定しています．

### 設定する

データベースの接続情報はVercel Postgresにより自動的に設定されます．

- `HOST`：OAuth2認証に利用するホスト名です．スキーマとホスト名を含んでください．
  - Vercel上では，ProductionおよびPreview環境ではVercelのホスト名を，Development環境では`http://localhost:3000`を指定してください．
- `DISCORD_CLIENT_ID`：DiscordのOAuth2認証に利用します．
- `DISCORD_CLIENT_SECRET`：DiscordのOAuth2認証に利用します．
- `JWT_SECRET`：JWTの署名・検証に利用する共通鍵です．
  - `crypto.randomBytes(64).toString('base64')`などとして生成してください．
- `DISCORD_GUILD_ID`：サインインを許可するDiscordサーバーのIDです．
- `DISCORD_ROLE_ID`（省略可）：サインインを許可するロールのIDです．
  - 省略した場合，そのサーバーの全てのユーザーがサインインできます．

### ダウンロードする

- `vercel login`が完了していることを確認してください．
- `vercel link`を実行してください．
- `vercel env pull`を実行してください．

## ライセンス

[MIT License](LICENSE)

- icons: [UTKiraraCircle](https://github.com/UTKiraraCircle)
