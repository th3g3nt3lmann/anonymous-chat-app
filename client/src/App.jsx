import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import {
  generateKeyPair,
  exportKey,
  importKey,
  deriveSharedSecret,
  encryptMessage,
  decryptMessage
} from './crypto';

const WEBSOCKET_URL = 'wss://anonymous-chat-app-6hdb.onrender.com';

function App() {
  const [status, setStatus] = useState('welcome'); // welcome, waiting, chatting
  const [displayName, setDisplayName] = useState('');
  const [peerName, setPeerName] = useState('');
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [is18, setIs18] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [theme, setTheme] = useState('dark'); // 'light' or 'dark'

  const ws = useRef(null);
  const keyPair = useRef(null);
  const sharedKey = useRef(null);
  const messagesEndRef = useRef(null);
  const stateRef = useRef({});

  stateRef.current = { displayName, peerName };

  useEffect(() => {
    document.body.className = `theme-${theme}`;
  }, [theme]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  const startChat = async () => {
    if (!displayName.trim() || !is18 || !agreedToTerms) {
      alert('Please fill in all fields and agree to the terms.');
      return;
    }

    setStatus('waiting');
    keyPair.current = await generateKeyPair();

    ws.current = new WebSocket(WEBSOCKET_URL);

    ws.current.onopen = () => {
      console.log('Connected to WebSocket server');
      ws.current.send(JSON.stringify({ type: 'start_chat', displayName }));
    };

    ws.current.onmessage = async (event) => {
      const data = JSON.parse(event.data);
      const { peerName: currentPeerName, displayName: currentDisplayName } = stateRef.current;

      switch (data.type) {
        case 'waiting':
          console.log('Waiting for a peer...');
          break;
        case 'match_found':
          setPeerName(data.peerName);
          setStatus('key_exchange');
          if (data.initiator) {
            const exportedPublicKey = await exportKey(keyPair.current.publicKey);
            ws.current.send(JSON.stringify({
              type: 'offer',
              publicKey: Array.from(new Uint8Array(exportedPublicKey))
            }));
          }
          break;
        case 'offer':
          setPeerName(data.peerName);
          const peerPublicKeyForOffer = await importKey(new Uint8Array(data.publicKey));
          sharedKey.current = await deriveSharedSecret(keyPair.current.privateKey, peerPublicKeyForOffer);
          setStatus('chatting');
          addMessage('System', `You are now chatting with ${data.peerName}.`);
          const exportedPublicKeyForAnswer = await exportKey(keyPair.current.publicKey);
          ws.current.send(JSON.stringify({
            type: 'answer',
            publicKey: Array.from(new Uint8Array(exportedPublicKeyForAnswer))
          }));
          break;
        case 'answer':
          const peerPublicKeyForAnswer = await importKey(new Uint8Array(data.publicKey));
          sharedKey.current = await deriveSharedSecret(keyPair.current.privateKey, peerPublicKeyForAnswer);
          setStatus('chatting');
          addMessage('System', `You are now chatting with ${currentPeerName}.`);
          break;
        case 'encrypted_message':
          if (!sharedKey.current) return;
          const decryptedMessage = await decryptMessage(sharedKey.current, data.message);
          addMessage(currentPeerName, decryptedMessage);
          break;
        case 'peer_disconnected':
          addMessage('System', 'Your peer has disconnected. Finding a new chat...');
          resetState();
          startChat();
          break;
      }
    };

    ws.current.onclose = () => {
      console.log('Disconnected from WebSocket server');
      if (status !== 'welcome') {
        addMessage('System', 'Connection lost. Please try starting a new chat.');
        resetState();
      }
    };
  };

  const addMessage = (sender, content) => {
    setMessages(prev => [...prev, { sender, content }]);
  };

  const sendMessage = async () => {
    if (inputValue.trim() && sharedKey.current) {
      const encrypted = await encryptMessage(sharedKey.current, inputValue);
      ws.current.send(JSON.stringify({
        type: 'encrypted_message',
        message: {
          ciphertext: Array.from(encrypted.ciphertext),
          iv: Array.from(encrypted.iv)
        }
      }));
      const { displayName: currentDisplayName } = stateRef.current;
      addMessage(currentDisplayName, inputValue);
      setInputValue('');
    }
  };

  const disconnect = () => {
    if (ws.current) {
      ws.current.send(JSON.stringify({ type: 'disconnect' }));
      ws.current.close();
    }
    resetState();
  };

  const resetState = () => {
    setStatus('welcome');
    setPeerName('');
    setMessages([]);
    ws.current = null;
    keyPair.current = null;
    sharedKey.current = null;
  }

  const canStart = displayName.trim() && is18 && agreedToTerms;

  const ThemeToggleButton = ({ className = '' }) => (
    <button onClick={toggleTheme} className={`theme-toggle ${className}`} title="Toggle theme">
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  );

  if (status === 'welcome') {
    return (
      <div className={`App theme-${theme}`}>
        <ThemeToggleButton className="is-absolute" />
        <div className="welcome-container">
          <h1>Anonymous Chat</h1>
          <input
            type="text"
            placeholder="Enter your display name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
          <div className="terms-container">
            <label>
              <input type="checkbox" checked={is18} onChange={() => setIs18(!is18)} />
              I confirm that I am 18 years or older.
            </label>
            <label>
              <input type="checkbox" checked={agreedToTerms} onChange={() => setAgreedToTerms(!agreedToTerms)} />
              I agree to the <a href="/TermsOfUse.md" target="_blank" rel="noopener noreferrer">Terms of Use</a> and <a href="/PrivacyPolicy.md" target="_blank" rel="noopener noreferrer">Privacy Policy</a>.
            </label>
          </div>
          <button onClick={startChat} disabled={!canStart}>Start Chat</button>
        </div>
      </div>
    );
  }

  if (status === 'waiting' || status === 'key_exchange') {
    return (
      <div className={`App theme-${theme}`}>
        <div className="loading-container">
          <div className="loader"></div>
          <p>Searching for a random stranger...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`App theme-${theme}`}>
      <div className="chat-header">
        <h2>Chatting with {peerName}</h2>
        <div className="header-controls">
          <button onClick={disconnect}>Disconnect</button>
          <ThemeToggleButton />
        </div>
      </div>
      <div className="messages">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.sender === displayName ? 'sent' : (msg.sender === 'System' ? 'status-message' : 'received')}`}>
            {msg.sender !== 'System' && <span className="message-sender">{msg.sender}</span>}
            <div className="message-content">{msg.content}</div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="input-container">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type an encrypted message..."
        />
        <button onClick={sendMessage} title="Send Message">➤</button>
      </div>
    </div>
  );
}

export default App;
