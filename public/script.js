let webSocket;
let userRole = null;
const solutions = {
    'Async Case': 'const fetchData = async () => {\n    const response = await fetch("https://api.example.com/data");\n    const data = await response.json();\n    console.log(data);\n};',
    'Closure Example': 'function createCounter() {\n    let count = 0;\n    return function() {\n        count++;\n        return count;\n    };\n}',
    'Event Loop': 'console.log("Start");\nsetTimeout(() => {\n    console.log("Middle");\n}, 0);\nconsole.log("End");',
    'Promise Chain': 'fetch("https://api.example.com/data")\n    .then(response => response.json())\n    .then(data => console.log(data))\n    .catch(error => console.error(error));'
};

const problemDescriptions = {
    'Async Case': 'Write a function that fetches data from an API and logs the response. Use async/await syntax.',
    'Closure Example': 'Create a counter function that uses closures to keep track of a count variable.',
    'Event Loop': 'Demonstrate the JavaScript event loop by logging messages to the console with different timing.',
    'Promise Chain': 'Fetch data from an API and log the result using promise chaining. Handle any errors that occur.'
};

function openCodeBlock(codeName) {
    // Push the new state into history
    history.pushState({ codeName: codeName }, '', `#${codeName}`);
    loadCodeBlock(codeName);
}

function loadCodeBlock(codeName) {
    // Hide lobby page and show code block page
    document.getElementById('lobbyPage').style.display = 'none';
    document.getElementById('codeBlockPage').style.display = 'block';

    // Close existing WebSocket connection if it exists
    if (webSocket) {
        webSocket.close();
        console.log('Closed existing WebSocket connection');
    }

    // Connect to WebSocket server
    webSocket = new WebSocket('ws://localhost:3000');

    webSocket.onopen = function() {
        console.log('WebSocket connected');
        // Send initial message with the selected code block name
        webSocket.send(JSON.stringify({ type: 'codeBlock', codeName: codeName }));
    };

    webSocket.onmessage = function(event) {
        const message = JSON.parse(event.data);

        if (message.type === 'role') {
            userRole = message.role;
            console.log(`User role: ${userRole}`);
            const roleMessage = document.getElementById('roleMessage');
            const codeEditor = document.getElementById('codeEditor');

            if (userRole === 'mentor') {
                codeEditor.setAttribute('contenteditable', 'false');
                roleMessage.textContent = "You are in mentor view - therefore you cannot type anything in the board.";
            } else {
                codeEditor.setAttribute('contenteditable', 'true');
                roleMessage.textContent = "You are in student view - you can type in the board.";
                codeEditor.removeEventListener('input', handleCodeEditorInput);
                codeEditor.addEventListener('input', handleCodeEditorInput);
            }
        } else if (message.type === 'code') {
            const codeEditor = document.getElementById('codeEditor');
            codeEditor.innerText = message.content || '';
            highlightSyntax();
            console.log(`Received message from server: ${message.content}`);

            // Check if the code matches the solution
            if (message.content.trim() === solutions[codeName].trim()) {
                document.getElementById('smiley').style.display = 'block';
                console.log('Code matches the solution! Showing smiley face.');
            } else {
                document.getElementById('smiley').style.display = 'none';
                console.log('Code does not match the solution. Hiding smiley face.');
            }
        }
    };

    webSocket.onclose = function(event) {
        console.log('WebSocket connection closed');
    };

    document.getElementById('codeBlockName').textContent = codeName;
    document.getElementById('problemDescription').textContent = problemDescriptions[codeName] || '';
    document.getElementById('codeEditor').innerText = '';  // Ensure the editor is empty when loaded
}

function handleCodeEditorInput() {
    const codeEditor = document.getElementById('codeEditor');
    const code = codeEditor.innerText; // Use innerText to get the content
    const codeName = document.getElementById('codeBlockName').textContent;
    webSocket.send(JSON.stringify({ type: 'code', content: code, codeName: codeName }));
    console.log(`Sent message to server: ${code}`);

    // Move the cursor to the end of the content
    moveCursorToEnd(codeEditor);

    // Check if the code matches the solution
    if (code.trim() === solutions[codeName].trim()) {
        document.getElementById('smiley').style.display = 'block';
        console.log('Code matches the solution! Showing smiley face.');
    } else {
        document.getElementById('smiley').style.display = 'none';
        console.log('Code does not match the solution. Hiding smiley face.');
    }

    // Highlight syntax
    highlightSyntax();
}

function moveCursorToEnd(element) {
    const range = document.createRange();
    const selection = window.getSelection();
    range.selectNodeContents(element);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
}

function highlightSyntax() {
    const codeBlock = document.getElementById('codeEditor');
    const code = codeBlock.innerText; // Use innerText to get the content
    codeBlock.innerHTML = hljs.highlightAuto(code).value;
    console.log('Highlighted syntax');

    // Move cursor to the end after highlighting to ensure correct position
    moveCursorToEnd(codeBlock);
}

function goBack() {
    history.pushState({}, '', '/');
    document.getElementById('codeBlockPage').style.display = 'none';
    document.getElementById('lobbyPage').style.display = 'block';
}

// Initialize Highlight.js
document.addEventListener('DOMContentLoaded', function() {
    hljs.highlightAll();
    console.log('Page loaded');

    // Handle back button in browser
    window.addEventListener('popstate', function(event) {
        if (event.state && event.state.codeName) {
            loadCodeBlock(event.state.codeName);
        } else {
            goBack();
        }
    });
});
