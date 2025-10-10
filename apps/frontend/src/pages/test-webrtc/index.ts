import type { ElComponent } from "../../factory/componentFactory";
import { componentFactory } from "../../factory/componentFactory";

interface SignalingMessage {
  type: string;
  roomId?: string;
  playerId?: string;
  data?: Record<string, unknown>;
}

class WebRTCClient {
  private ws: WebSocket | null = null;
  private pc: RTCPeerConnection | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private playerId: string | null = null;
  private roomId: string;
  private isInitiator = false;

  constructor(roomId: string) {
    this.roomId = roomId;
  }

  async connect(): Promise<void> {
    // WebSocket接続
    this.ws = new WebSocket(`ws://localhost:3000/signaling/${this.roomId}`);
    
    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.joinRoom();
    };

    this.ws.onmessage = (event) => {
      const message: SignalingMessage = JSON.parse(event.data);
      this.handleSignalingMessage(message);
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
    };
  }

  private joinRoom(): void {
    if (!this.ws) return;
    
    this.ws.send(JSON.stringify({
      type: 'join-room',
      data: {
        userId: 1,
        playerName: 'TestPlayer'
      }
    }));
  }

  private async handleSignalingMessage(message: SignalingMessage): Promise<void> {
    console.log('Received signaling message:', message);

    switch (message.type) {
      case 'joined':
        this.playerId = message.data?.playerId as string;
        console.log('Joined room with player ID:', this.playerId);
        break;

      case 'player-joined':
        console.log('Another player joined');
        if (!this.pc) {
          await this.createPeerConnection();
          this.isInitiator = true;
          await this.createOffer();
        }
        break;

      case 'offer':
        await this.handleOffer(message.data as unknown as RTCSessionDescriptionInit);
        break;

      case 'answer':
        await this.handleAnswer(message.data as unknown as RTCSessionDescriptionInit);
        break;

      case 'ice-candidate':
        await this.handleIceCandidate(message.data as unknown as RTCIceCandidateInit);
        break;

      case 'connected':
        console.log('Connected to signaling server');
        break;

      case 'error':
        console.error('Signaling error:', message.data?.message);
        break;
    }
  }

  private async createPeerConnection(): Promise<void> {
    this.pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    // ICE候補の処理
    this.pc.onicecandidate = (event) => {
      if (event.candidate && this.ws) {
        this.ws.send(JSON.stringify({
          type: 'ice-candidate',
          data: event.candidate
        }));
      }
    };

    // データチャンネルの設定（イニシエーターのみ）
    if (this.isInitiator) {
      this.dataChannel = this.pc.createDataChannel('messages');
      this.setupDataChannel(this.dataChannel);
    } else {
      this.pc.ondatachannel = (event) => {
        this.dataChannel = event.channel;
        this.setupDataChannel(this.dataChannel);
      };
    }

    console.log('Peer connection created');
  }

  private setupDataChannel(channel: RTCDataChannel): void {
    channel.onopen = () => {
      console.log('Data channel opened');
      this.updateStatus('Connected! You can send messages.');
    };

    channel.onmessage = (event) => {
      console.log('Received message:', event.data);
      this.displayMessage('Peer', event.data);
    };

    channel.onclose = () => {
      console.log('Data channel closed');
      this.updateStatus('Disconnected');
    };
  }

  private async createOffer(): Promise<void> {
    if (!this.pc || !this.ws) return;

    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);

    this.ws.send(JSON.stringify({
      type: 'offer',
      data: offer
    }));

    console.log('Offer created and sent');
  }

  private async handleOffer(offer: RTCSessionDescriptionInit): Promise<void> {
    if (!this.pc) {
      await this.createPeerConnection();
    }

    if (!this.pc || !this.ws) return;

    await this.pc.setRemoteDescription(offer);
    const answer = await this.pc.createAnswer();
    await this.pc.setLocalDescription(answer);

    this.ws.send(JSON.stringify({
      type: 'answer',
      data: answer
    }));

    console.log('Answer created and sent');
  }

  private async handleAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
    if (!this.pc) return;

    await this.pc.setRemoteDescription(answer);
    console.log('Answer received and set');
  }

  private async handleIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    if (!this.pc) return;

    await this.pc.addIceCandidate(candidate);
    console.log('ICE candidate added');
  }

  sendMessage(message: string): void {
    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      this.dataChannel.send(message);
      this.displayMessage('You', message);
    } else {
      console.warn('Data channel not ready');
    }
  }

  private displayMessage(sender: string, message: string): void {
    const messagesEl = document.getElementById('messages');
    if (messagesEl) {
      const messageEl = document.createElement('div');
      messageEl.className = 'p-2 border-b';
      messageEl.innerHTML = `<strong>${sender}:</strong> ${message}`;
      messagesEl.appendChild(messageEl);
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }
  }

  private updateStatus(status: string): void {
    const statusEl = document.getElementById('status');
    if (statusEl) {
      statusEl.textContent = status;
    }
  }

  disconnect(): void {
    if (this.dataChannel) {
      this.dataChannel.close();
    }
    if (this.pc) {
      this.pc.close();
    }
    if (this.ws) {
      this.ws.close();
    }
  }
}

export function TestWebRTC(): ElComponent {
  const el = document.createElement('div');
  el.className = 'min-h-screen bg-gray-100 p-8';
  
  el.innerHTML = `
    <div class="max-w-4xl mx-auto">
      <h1 class="text-3xl font-bold mb-8 text-center">WebRTC Test</h1>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <!-- Connection Control -->
        <div class="bg-white p-6 rounded-lg shadow">
          <h2 class="text-xl font-semibold mb-4">Connection</h2>
          
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">Room ID:</label>
            <input 
              type="text" 
              id="roomId" 
              value="test-room-123"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div class="mb-4">
            <button 
              id="connectBtn" 
              class="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Connect
            </button>
          </div>
          
          <div class="mb-4">
            <button 
              id="disconnectBtn" 
              disabled
              class="w-full bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
            >
              Disconnect
            </button>
          </div>
          
          <div class="text-sm">
            <strong>Status:</strong> <span id="status" class="text-gray-600">Disconnected</span>
          </div>
        </div>

        <!-- Message Area -->
        <div class="bg-white p-6 rounded-lg shadow">
          <h2 class="text-xl font-semibold mb-4">Messages</h2>
          
          <div 
            id="messages" 
            class="h-64 border border-gray-300 rounded p-4 mb-4 overflow-y-auto bg-gray-50"
          >
            <!-- Messages will appear here -->
          </div>
          
          <div class="flex gap-2">
            <input 
              type="text" 
              id="messageInput" 
              placeholder="Type a message..."
              class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button 
              id="sendBtn" 
              disabled
              class="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </div>
      </div>

      <!-- Instructions -->
      <div class="mt-8 bg-white p-6 rounded-lg shadow">
        <h2 class="text-xl font-semibold mb-4">Instructions</h2>
        <ol class="list-decimal list-inside space-y-2 text-sm">
          <li>Open this page in two different browser tabs or windows</li>
          <li>Use the same Room ID in both tabs</li>
          <li>Click "Connect" in both tabs</li>
          <li>Once connected, you can send messages between the tabs via WebRTC</li>
          <li>Check the browser console for detailed logs</li>
        </ol>
      </div>
    </div>
  `;

  // JavaScript functionality
  let client: WebRTCClient | null = null;

  const setupEventListeners = () => {
    const connectBtn = el.querySelector('#connectBtn') as HTMLButtonElement;
    const disconnectBtn = el.querySelector('#disconnectBtn') as HTMLButtonElement;
    const sendBtn = el.querySelector('#sendBtn') as HTMLButtonElement;
    const roomIdInput = el.querySelector('#roomId') as HTMLInputElement;
    const messageInput = el.querySelector('#messageInput') as HTMLInputElement;

    connectBtn.addEventListener('click', async () => {
      const roomId = roomIdInput.value.trim();
      if (!roomId) {
        alert('Please enter a room ID');
        return;
      }

      try {
        client = new WebRTCClient(roomId);
        await client.connect();
        
        connectBtn.disabled = true;
        disconnectBtn.disabled = false;
        roomIdInput.disabled = true;
        
        // Update status
        const statusEl = el.querySelector('#status');
        if (statusEl) {
          statusEl.textContent = 'Connecting...';
        }
      } catch (error) {
        console.error('Connection failed:', error);
        alert('Connection failed. Check console for details.');
      }
    });

    disconnectBtn.addEventListener('click', () => {
      if (client) {
        client.disconnect();
        client = null;
      }
      
      connectBtn.disabled = false;
      disconnectBtn.disabled = true;
      sendBtn.disabled = true;
      roomIdInput.disabled = false;
      
      const statusEl = el.querySelector('#status');
      if (statusEl) {
        statusEl.textContent = 'Disconnected';
      }
    });

    sendBtn.addEventListener('click', () => {
      const message = messageInput.value.trim();
      if (client && message) {
        client.sendMessage(message);
        messageInput.value = '';
      }
    });

    messageInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        sendBtn.click();
      }
    });

    // Enable send button when connected
    const checkConnection = setInterval(() => {
      if (client?.['dataChannel']?.readyState === 'open') {
        sendBtn.disabled = false;
      } else {
        sendBtn.disabled = true;
      }
    }, 1000);

    // Cleanup interval when component is removed
    el.addEventListener('beforeRemove', () => {
      clearInterval(checkConnection);
      if (client) {
        client.disconnect();
      }
    });
  };

  // Setup event listeners after DOM is ready
  setTimeout(setupEventListeners, 0);

  return componentFactory(el);
}