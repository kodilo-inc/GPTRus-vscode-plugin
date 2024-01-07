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

    function sendMessage() {
        console.log('message sent');

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

        fetch('https://d5dqa8btt79oqqp2j9hf.apigw.yandexcloud.net/gpt', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(newPost),
        })
            .then((response) => response.json())
            .then(({ result }) => {
                console.log(result);
                document.getElementById('response-box').textContent =
                    result?.alternatives?.[0]?.message?.text;
            });
    }
})();
