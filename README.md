# Anonymous Web Chat Application

This is a complete, production-ready anonymous web chat application similar to Omegle. The app allows two users to be randomly matched and communicate via end-to-end encrypted text messages.

## Features

-   **Anonymous & Secure**: No registration required. All messages are end-to-end encrypted using the Web Crypto API (ECDH for key exchange, AES-GCM for encryption).
-   **No Message Storage**: Messages are not stored on the server. They are ephemeral and exist only during the chat session.
-   **Random Matchmaking**: Users are randomly paired for one-on-one chats.
-   **Minimalist UI**: A clean, simple, and responsive user interface.
-   **Legal Compliance**: Includes mandatory agreement to Terms of Use and Privacy Policy before chatting.

## Tech Stack

-   **Backend**: Node.js, Express, WebSockets (`ws`)
-   **Frontend**: React (Vite), Plain CSS
-   **Encryption**: Web Crypto API

## Project Structure

```
.
├── client/         # React Frontend
│   ├── public/
│   ├── src/
│   └── package.json
├── server/         # Node.js Backend
│   ├── index.js
│   └── package.json
└── README.md
```

## Setup and Running

### Prerequisites

-   Node.js (v14 or higher)
-   npm

### 1. Setup the Backend

Navigate to the `server` directory, install dependencies, and start the server.

```bash
cd server
npm install
npm start
```

The backend server will start on `http://localhost:3001`.

### 2. Setup the Frontend

In a new terminal, navigate to the `client` directory, install dependencies, and start the development server.

```bash
cd client
npm install
npm run dev
```

The frontend development server will start on `chttp://localhost:5173` (or another port if 5173 is busy).

### 3. Open the App

Open your web browser and go to the address provided by the Vite development server (e.g., `http://localhost:5173`).

Enter a display name, agree to the terms, and click "Start Chat" to find a partner. To test the chat functionality, you can open two browser tabs or windows.

## Security Considerations

-   **End-to-End Encryption**: The server acts only as a signaling and message-forwarding layer. It cannot decrypt user messages. The shared secret for encryption is derived independently by each client and is never transmitted over the network.
-   **Secure Transport**: For production deployment, it is crucial to run the application over HTTPS and use Secure WebSockets (WSS). This requires a reverse proxy like Nginx or using a hosting platform that provides SSL termination (e.g., Vercel, Netlify).
-   **Basic Protections**: The server uses `helmet` to set various security-related HTTP headers.

## Deployment

This application is designed to be easily deployable on platforms like Vercel, Netlify, or any VPS.

When deploying, ensure that you configure your environment to use `WSS`. The client-side WebSocket URL in `client/src/App.jsx` will need to be updated to point to your production WebSocket server address.

Example for production `App.jsx`:
```javascript
const WEBSOCKET_URL = 'wss://your-production-domain.com';
```

---

*This is a placeholder README. Feel free to update it with more specific details about your deployment environment or any further modifications you make.* 