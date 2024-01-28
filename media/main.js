// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.
(function () {
    // eslint-disable-next-line no-undef
    const vscode = acquireVsCodeApi();
    let isLoading = false;
    let chatState = [];
    const tokenInput = document.getElementById('api-token-input');
    const catalogueIdInput = document.getElementById('catalogue-id-input');

    tokenInput.addEventListener('input', () => {
        if (tokenInput.value) {
            tokenInput.classList.remove('settings-input__error');
        }
    });
    catalogueIdInput.addEventListener('input', () => {
        if (catalogueIdInput.value) {
            catalogueIdInput.classList.remove('settings-input__error');
        }
    });

    document.getElementById('save-settings').addEventListener('click', () => {
        let isValidationError = false;
        if (!tokenInput.value) {
            tokenInput.classList.add('settings-input__error');
            isValidationError = true;
        }
        if (!catalogueIdInput.value) {
            catalogueIdInput.classList.add('settings-input__error');
            isValidationError = true;
        }
        if (isValidationError) {
            return;
        }
        vscode.postMessage({
            type: 'saveSettings',
            message: {
                token: tokenInput.value,
                catalogueId: catalogueIdInput.value,
            },
        });
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
                        .getElementById('home-block')
                        .classList.remove('hide');
                    document
                        .getElementById('chat-area')
                        .classList.remove('hide');
                    document.getElementById('chat-area').classList.add('hide');
                } else if (message.message === 'chat') {
                    document
                        .getElementById('home-block')
                        .classList.remove('hide');
                    document
                        .getElementById('chat-area')
                        .classList.remove('hide');
                    document.getElementById('home-block').classList.add('hide');
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
