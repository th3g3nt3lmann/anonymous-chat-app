const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
app.use(cors());
app.use(helmet());

app.get('/', (req, res) => {
    res.status(200).send('Server is running and healthy.');
});

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let waitingUser = null;
const userMap = new Map();

wss.on('connection', (ws) => {
    console.log('Client connected');

    ws.on('message', (message) => {
        const data = JSON.parse(message);

        switch (data.type) {
            case 'start_chat':
                ws.displayName = data.displayName;

                // Ensure the waiting user is still connected
                if (waitingUser && waitingUser.readyState !== WebSocket.OPEN) {
                    waitingUser = null;
                }

                if (waitingUser) {
                    // Match found
                    const peer = waitingUser;
                    waitingUser = null;

                    const roomId = `${ws._socket.remoteAddress}-${peer._socket.remoteAddress}`;
                    userMap.set(ws, peer);
                    userMap.set(peer, ws);

                    // ws is the new user, peer was the waiting user. Designate ws as the initiator.
                    peer.send(JSON.stringify({ type: 'match_found', peerName: ws.displayName, initiator: false }));
                    ws.send(JSON.stringify({ type: 'match_found', peerName: peer.displayName, initiator: true }));
                } else {
                    // No user waiting, become the waiting user
                    waitingUser = ws;
                    ws.send(JSON.stringify({ type: 'waiting' }));
                }
                break;

            case 'offer':
                const peerForOffer = userMap.get(ws);
                if (peerForOffer) {
                    peerForOffer.send(JSON.stringify({ ...data, peerName: ws.displayName }));
                }
                break;

            case 'answer':
            case 'ice_candidate':
                const peer = userMap.get(ws);
                if (peer) {
                    peer.send(JSON.stringify(data));
                }
                break;

            case 'encrypted_message':
                const peerForMessage = userMap.get(ws);
                if (peerForMessage) {
                    peerForMessage.send(JSON.stringify(data));
                }
                break;

            case 'disconnect':
                const peerToDisconnect = userMap.get(ws);
                if (peerToDisconnect) {
                    peerToDisconnect.send(JSON.stringify({ type: 'peer_disconnected' }));
                    userMap.delete(ws);
                    userMap.delete(peerToDisconnect);
                }
                if (waitingUser === ws) {
                    waitingUser = null;
                }
                break;
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
        const peer = userMap.get(ws);
        if (peer) {
            peer.send(JSON.stringify({ type: 'peer_disconnected' }));
            userMap.delete(ws);
            userMap.delete(peer);
        }
        if (waitingUser === ws) {
            waitingUser = null;
        }
    });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is listening on port ${PORT}`);
}); 