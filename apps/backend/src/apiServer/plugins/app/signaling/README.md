# WebRTC Signaling Server

## 概要

このシグナリングサーバーは、WebRTCを使用したP2P Pongゲーム用の通信を調整します。フロントエンド間のWebRTC接続確立をサポートし、サーバー負荷を軽減しながらリアルタイムゲームプレイを実現します。

## アーキテクチャ

### P2P通信モデル
- **フロントエンド**: 直接P2P通信でゲームロジックを実行
- **バックエンド**: WebRTCシグナリング調整のみ
- **利点**: サーバー負荷軽減、スケーラビリティ向上

### ファイル構成

```
signaling/
├── types.ts           # シグナリングメッセージとデータ構造の型定義
├── SignalingServer.ts # シグナリングサーバーのコアロジック
├── index.ts           # Fastifyプラグインエントリーポイント
└── README.md          # このドキュメント
```

## データ構造

### SignalingMessage
```typescript
interface SignalingMessage {
  type: 'join-room' | 'offer' | 'answer' | 'ice-candidate' | 'player-ready' | 'game-start' | 'error';
  data: Record<string, unknown>;
  roomId?: string;
  playerId?: string;
}
```

### SignalingRoom
```typescript
interface SignalingRoom {
  id: string;
  players: Map<string, SignalingPlayer>;
  gameState: 'waiting' | 'ready' | 'playing' | 'finished';
  createdAt: number;
  maxPlayers: number;
}
```

### SignalingPlayer
```typescript
interface SignalingPlayer {
  id: string;
  userId: number;
  name: string;
  socket: WebSocket;
  isReady: boolean;
}
```

## API エンドポイント

### WebSocket
```
GET /signaling/:roomId
```
WebRTC シグナリング用WebSocket接続

### HTTP
```
GET /signaling/stats           # サーバー統計情報
GET /signaling/:roomId/info    # ルーム情報取得
```

## シグナリングフロー

1. **接続確立**
   ```javascript
   // フロントエンドからWebSocket接続
   const ws = new WebSocket('ws://localhost:3000/signaling/room-123');
   ```

2. **ルーム参加**
   ```javascript
   ws.send(JSON.stringify({
     type: 'join-room',
     data: { userId: 1, playerName: 'Player1' }
   }));
   ```

3. **WebRTCシグナリング**
   ```javascript
   // Offer送信
   ws.send(JSON.stringify({
     type: 'offer',
     data: { sdp: offer }
   }));

   // Answer送信
   ws.send(JSON.stringify({
     type: 'answer',
     data: { sdp: answer }
   }));

   // ICE Candidate送信
   ws.send(JSON.stringify({
     type: 'ice-candidate',
     data: { candidate }
   }));
   ```

## 実装状況

### ✅ 完了
- [x] 型定義 (`types.ts`)
- [x] SignalingServerクラス (`SignalingServer.ts`)
- [x] Fastifyプラグイン実装 (`index.ts`)
- [x] WebSocket機能有効化
- [x] HTTPエンドポイント
- [x] ファイル構造整理

### 🔮 今後の実装
- [ ] 認証統合（JWTトークン）
- [ ] ルーム管理UI
- [ ] 詳細ログ機能
- [ ] パフォーマンス監視

## セットアップ

### 依存関係
すでにインストール済み：
- `@fastify/websocket`: WebSocket機能
- `ws`: WebSocketライブラリ
- `@types/ws`: WebSocket型定義

### サーバー起動
```bash
cd apps/backend
npm run dev
```

## 使用例

### フロントエンド統合例
```javascript
class PongGameSignaling {
  constructor(roomId) {
    this.roomId = roomId;
    this.ws = new WebSocket(`ws://localhost:3000/signaling/${roomId}`);
    this.setupWebSocket();
  }

  setupWebSocket() {
    this.ws.onopen = () => {
      console.log('Signaling server connected');
      this.joinRoom();
    };

    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.handleSignalingMessage(message);
    };
  }

  joinRoom() {
    this.ws.send(JSON.stringify({
      type: 'join-room',
      data: {
        userId: this.userId,
        playerName: this.playerName
      }
    }));
  }

  handleSignalingMessage(message) {
    switch (message.type) {
      case 'offer':
        // WebRTC Offer処理
        break;
      case 'answer':
        // WebRTC Answer処理
        break;
      case 'ice-candidate':
        // ICE Candidate処理
        break;
    }
  }
}
```

## トラブルシューティング

### WebSocketエラー
- 依存関係が正しくインストールされているか確認
- ファイアウォール設定をチェック

### 接続失敗
- ルームIDが正しいか確認
- サーバーが起動しているか確認

## 関連ドキュメント

- [WebRTC API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)
- [Fastify WebSocket Plugin](https://github.com/fastify/fastify-websocket)