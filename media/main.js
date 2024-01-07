// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.
(function () {
    // eslint-disable-next-line no-undef
    const vscode = acquireVsCodeApi();

    document.getElementById('set-api-token').addEventListener('click', () => {
        vscode.postMessage({ type: 'askUserForApiToken' });
    });

    document
        .querySelector('.add-color-button')
        ?.addEventListener('click', () => {
            sendMessage();
        });

    // Handle messages sent from the extension to the webview
    window.addEventListener('message', (event) => {
        const message = event.data; // The json data that the extension sent
        switch (message.type) {
            case 'showMessageFromGpt': {
                document.getElementById('response-box').textContent =
                    message.message.alternatives?.[0]?.message?.text;
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
