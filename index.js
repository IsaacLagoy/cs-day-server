// index.js
import http from "http";
import { WebSocketServer } from "ws";
import { v4 as uuidv4 } from "uuid";

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("✅ WebSocket server is running.\n");
});

const wss = new WebSocketServer({ server });

let clients = {};

wss.on("connection", (ws) => {
  const id = uuidv4();
  clients[id] = ws;
  ws.send(JSON.stringify({ type: "init", clientId: id }));

  ws.on("message", (msg) => {
    console.log("Received:", msg.toString());
    // Broadcast to all other clients
    for (const [cid, sock] of Object.entries(clients)) {
      if (cid !== id && sock.readyState === ws.OPEN) {
        sock.send(msg.toString());
      }
    }
  });

  ws.on("close", () => {
    delete clients[id];
  });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => console.log(`✅ Listening on port ${PORT}`));
