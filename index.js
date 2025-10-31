import { WebSocketServer } from "ws";
import { v4 as uuidv4 } from "uuid";

const PORT = process.env.PORT || 10000;
const wss = new WebSocketServer({ port: PORT });

let clients = {}; // { id: { ws, role } }
let gameState = {};

function broadcast(msg, roles) {
  const data = JSON.stringify(msg);
  for (const [_, c] of Object.entries(clients)) {
    if (roles.includes(c.role)) c.ws.send(data);
  }
}

wss.on("connection", (ws) => {
  const id = uuidv4();
  clients[id] = { ws, role: "unknown" };
  ws.send(JSON.stringify({ type: "init", clientId: id }));

  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message);

      if (data.type === "register") clients[id].role = data.role;

      if (data.type === "controllerInput") {
        broadcast({ type: "controllerInput", from: id, payload: data.payload }, ["host", "view"]);
      }

      if (data.type === "hostCommand") {
        gameState = { ...gameState, ...data.payload };
        broadcast({ type: "gameUpdate", gameState }, ["controller", "view"]);
      }
    } catch (err) {
      console.error(err);
    }
  });

  ws.on("close", () => delete clients[id]);
});

console.log(`✅ WebSocket server running on port ${PORT}`);
