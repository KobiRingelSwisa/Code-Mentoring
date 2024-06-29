const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const sqlite3 = require('sqlite3').verbose(); // Import SQLite3

// Initialize Express and HTTP server
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, '..', 'public')));

// Serve index.html on the root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Initialize the SQLite database
const db = new sqlite3.Database(':memory:'); // Use in-memory database for simplicity

db.serialize(() => {
    db.run("CREATE TABLE code_blocks (title TEXT, code TEXT)"); // Create code_blocks table

    // Insert initial code blocks
    const stmt = db.prepare("INSERT INTO code_blocks VALUES (?, ?)");
    stmt.run('Async Case', 'const fetchData = async () => {\n    const response = await fetch("https://api.example.com/data");\n    const data = await response.json();\n    console.log(data);\n};');
    stmt.run('Closure Example', 'function createCounter() {\n    let count = 0;\n    return function() {\n        count++;\n        return count;\n    };\n}');
    stmt.run('Event Loop', 'console.log("Start");\nsetTimeout(() => {\n    console.log("Middle");\n}, 0);\nconsole.log("End");');
    stmt.run('Promise Chain', 'fetch("https://api.example.com/data")\n    .then(response => response.json())\n    .then(data => console.log(data))\n    .catch(error => console.error(error));');
    stmt.finalize();
});

let codeContent = {};
let mentorAssigned = false;

wss.on('connection', (ws) => {
    console.log('New client connected');

    let userRole = mentorAssigned ? 'student' : 'mentor';
    mentorAssigned = true;

    ws.send(JSON.stringify({ type: 'role', role: userRole }));

    ws.on('message', (message) => {
        const parsedMessage = JSON.parse(message);

        if (parsedMessage.type === 'code') {
            codeContent[parsedMessage.codeName] = parsedMessage.content;
            wss.clients.forEach((client) => {
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({ type: 'code', content: codeContent[parsedMessage.codeName] }));
                }
            });
        } else if (parsedMessage.type === 'codeBlock') {
            const codeName = parsedMessage.codeName;
            if (!codeContent[codeName]) {
                codeContent[codeName] = ''; // Ensure the content is empty the first time
            }
            ws.send(JSON.stringify({ type: 'code', content: codeContent[codeName] }));
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

const port = process.env.PORT || 3000; // Use the port provided by Railway or default to 3000
server.listen(port, () => {
    console.log(`Server is listening on http://localhost:${port}`);
});

