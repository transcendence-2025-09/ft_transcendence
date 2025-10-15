## game serverの実装

### 処理の大まかなプロセス

- frontでクラスが呼ばれたらwsの通信を確立して、frontとgameの間で通信を確立する
- 基本的にはgame側でゲームに関するデータは保持しておく。front側で行うのはあくまで描画の処理だけ。
- websocketに関してはfastify/web-socketのpluginを使う。

### PongGameクラス (front)

### PongLogicクラス (game)
