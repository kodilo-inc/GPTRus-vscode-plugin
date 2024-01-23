// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.
(function () {
    // eslint-disable-next-line no-undef
    const vscode = acquireVsCodeApi();
    let isLoading = false;
    let chatState = [];

    document.getElementById('set-api-token').addEventListener('click', () => {
        vscode.postMessage({ type: 'askUserForApiToken' });
    });

    document.getElementById('send-btn')?.addEventListener('click', () => {
        if (isLoading) {
            return;
        }
        isLoading = true;
        document.getElementById('progress-bar').classList.remove('hide');
        sendMessage();
        document.getElementById('input').value = '';
    });

    window.onload = () => {
        vscode.postMessage({ type: 'controllerOnLoaded' });
    };

    // Handle messages sent from the extension to the webview
    window.addEventListener('message', (event) => {
        const message = event.data; // The json data that the extension sent
        switch (message.type) {
            case 'updateChat': {
                chatState = message.message;
                console.log('received chatState from view', chatState);

                // create div and insert in inside element with id response-box
                const responseBox = document.getElementById('response-box');
                responseBox.replaceChildren();
                chatState.forEach((element) => {
                    const div = document.createElement('div');
                    div.classList.add(
                        element.role === 'assistant'
                            ? 'bot-message'
                            : 'user-message'
                    );
                    div.textContent = element.text;
                    responseBox.appendChild(div);
                });
                if (chatState[chatState.length - 1]?.role === 'assistant') {
                    document
                        .getElementById('progress-bar')
                        .classList.add('hide');
                }

                isLoading = false;
                break;
            }
            case 'initView': {
                if (message.message === 'home') {
                    document
                        .getElementById('set-api-token')
                        .classList.remove('hide');
                    document
                        .getElementById('chat-area')
                        .classList.remove('hide');
                    document.getElementById('chat-area').classList.add('hide');
                } else if (message.message === 'chat') {
                    document
                        .getElementById('set-api-token')
                        .classList.remove('hide');
                    document
                        .getElementById('chat-area')
                        .classList.remove('hide');
                    document
                        .getElementById('set-api-token')
                        .classList.add('hide');
                } else {
                    console.error('что-то не то пришло', message);
                }
                break;
            }
        }
    });

    function sendMessage() {
        const userMessage = document.getElementById('input')?.value;

        const newPost = {
            modelUri: 'gpt://b1g1tt95jarp1kbk20vf/yandexgpt-lite',
            completionOptions: {
                stream: false,
                temperature: 0.6,
                maxTokens: '2000',
            },
            messages: [
                {
                    role: 'user',
                    text: userMessage,
                },
            ],
        };

        vscode.postMessage({ type: 'sendMessage', message: newPost });
    }
})();
