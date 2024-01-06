// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.
(function () {
    // eslint-disable-next-line no-undef
    const vscode = acquireVsCodeApi();

    // const oldState = vscode.getState() || { colors: [] };

    // /** @type {Array<{ value: string }>} */
    // let colors = oldState.colors;

    // updateColorList(colors);

    document
        .querySelector('.add-color-button')
        ?.addEventListener('click', () => {
            sendMessage();
        });

    // Handle messages sent from the extension to the webview
    window.addEventListener('message', (event) => {
        console.log('кнопка нажалась');

        const message = event.data; // The json data that the extension sent
        /* switch (message.type) {
            case 'addColor': {
                addColor();
                break;
            }
            case 'clearColors': {
                colors = [];
                updateColorList(colors);
                break;
            }
        } */
    });

    /**
     * @param {Array<{ value: string }>} colors
     */
    // function updateColorList(colors) {
    //     const ul = document.querySelector('.color-list');
    //     ul.textContent = '';
    //     for (const color of colors) {
    //         const li = document.createElement('li');
    //         li.className = 'color-entry';

    //         const colorPreview = document.createElement('div');
    //         colorPreview.className = 'color-preview';
    //         colorPreview.style.backgroundColor = `#${color.value}`;
    //         colorPreview.addEventListener('click', () => {
    //             onColorClicked(color.value);
    //         });
    //         li.appendChild(colorPreview);

    //         const input = document.createElement('input');
    //         input.className = 'color-input';
    //         input.type = 'text';
    //         input.value = color.value;
    //         input.addEventListener('change', (e) => {
    //             const value = e.target.value;
    //             if (!value) {
    //                 // Treat empty value as delete
    //                 colors.splice(colors.indexOf(color), 1);
    //             } else {
    //                 color.value = value;
    //             }
    //             updateColorList(colors);
    //         });
    //         li.appendChild(input);

    //         ul.appendChild(li);
    //     }

    //     // Update the saved state
    //     vscode.setState({ colors: colors });
    // }

    /**
     * @param {string} color
     */
    function onColorClicked(color) {
        vscode.postMessage({ type: 'colorSelected', value: color });
    }

    /**
     * @returns string
     */
    function getNewCalicoColor() {
        const colors = ['020202', 'f1eeee', 'a85b20', 'daab70', 'efcb99'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    function sendMessage() {
        console.log('message sent');

        const newPost = {
            modelUri: 'gpt://b1g1tt95jarp1kbk20vf/yandexgpt-lite',
            completionOptions: {
                stream: false,
                temperature: 0.6,
                maxTokens: '2000',
            },
            messages: [
                {
                    role: 'system',
                    text: 'Ты умный ассистент',
                },
                {
                    role: 'user',
                    text: 'Привет! Как мне подготовиться к экзаменам?',
                },
                {
                    role: 'assistant',
                    text: 'Привет! По каким предметам?',
                },
                {
                    role: 'user',
                    text: 'Математике и физике',
                },
            ],
        };

        fetch(
            'https://llm.api.cloud.yandex.net/foundationModels/v1/completion',
            {
                method: 'POST', // Здесь так же могут быть GET, PUT, DELETE
                body: JSON.stringify(newPost), // Тело запроса в JSON-формате
                headers: {
                    // Добавляем необходимые заголовки
                    'content-type': 'application/json',
                    Authorization:
                        'Api-Key AQVN2Vz25vE5ecbZhyC_ph69EzA18wPmakXH-Dyc',
                    'x-folder-id': 'b1g1tt95jarp1kbk20vf',
                },
            }
        )
            .then((response) => response.json())
            .then((data) => {
                console.log(data);
                // {title: "foo", body: "bar", userId: 1, id: 101}
            });
    }
})();
