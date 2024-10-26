import { Server } from 'ws';

const wss = new Server({ noServer: true });

// Хранилище для клиентов и их соединений
const connections = new Map();

wss.on('connection', (ws, req) => {
    // Получаем метку из URL
    const isServer = req.url.includes('server');
    const clientId = Date.now(); // Уникальный идентификатор клиента

    if (isServer) {
        console.log("Подключен Google Colab (server)");
        connections.set('server', ws);

        ws.on('message', (message) => {
            console.log("Сообщение от Google Colab:", message);
            // Обработка сообщений от Google Colab (если нужно)
        });

        ws.on('close', () => {
            console.log("Google Colab отключился");
            connections.delete('server');
        });
    } else {
        console.log("Подключен пользователь (client)", clientId);
        connections.set(clientId, ws);

        // Перенаправляем сообщения от пользователя к Google Colab
        ws.on('message', (message) => {
            console.log("Сообщение от клиента:", message);
            const serverSocket = connections.get('server');
            if (serverSocket) {
                serverSocket.send(message); // Отправляем сообщение к Google Colab
            }
        });

        ws.on('close', () => {
            console.log("Пользователь отключился", clientId);
            connections.delete(clientId);
        });
    }
});

// Обработчик для подключения к WebSocket
export default function handler(req, res) {
    if (req.method === 'GET') {
        res.socket.server.on('upgrade', (request, socket, head) => {
            wss.handleUpgrade(request, socket, head, (ws) => {
                wss.emit('connection', ws, request);
            });
        });
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('WebSocket server is running');
    } else {
        res.status(405).end(); // Метод не разрешен
    }
}
