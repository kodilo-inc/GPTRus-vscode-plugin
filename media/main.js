// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.
(function () {
    // eslint-disable-next-line no-undef
    const vscode = acquireVsCodeApi();

    document.getElementById('set-api-token').addEventListener('click', () => {
        vscode.postMessage({ type: 'askUserForApiToken' });
    });

    document.getElementById('send-btn')?.addEventListener('click', () => {
        sendMessage();
    });

    // Handle messages sent from the extension to the webview
    window.addEventListener('message', (event) => {
        const message = event.data; // The json data that the extension sent
        console.log(1, 'message');
        switch (message.type) {
            case 'showMessageFromGpt': {
                document.getElementById('response-box').textContent =
                    message.message.alternatives?.[0]?.message?.text;
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
