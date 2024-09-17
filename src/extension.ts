import * as vscode from 'vscode';

let chatState: { role: string; text: string }[] = [];
type settings = {
    token: string;
    catalogueId: string;
};

export function activate(context: vscode.ExtensionContext) {
    const provider = new ChatViewProvider(
        context.extensionUri,
        context.globalState
    );

    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            ChatViewProvider.viewType,
            provider
        )
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('GPTRus.updateChat', (resp) => {
            provider.updateChat(resp);
        })
    );
    context.subscriptions.push(
        vscode.commands.registerCommand('GPTRus.initView', (resp) => {
            provider.initView(resp);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('GPTRus.saveSettings', (resp) => {
            provider.saveSettingsInGlobalState(resp);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('GPTRus.clearChat', (resp) => {
            provider.clearChat();
        })
    );
    context.subscriptions.push(
        vscode.commands.registerCommand('GPTRus.goToSettings', () => {
            provider.goToSettings();
        })
    );
    context.subscriptions.push(
        vscode.commands.registerCommand('GPTRus.explainSelected', (data) => {
            provider.explainSelected();
        })
    );
}

class ChatViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'GPTRus.chatView';

    private _view?: vscode.WebviewView;

    constructor(
        private readonly _extensionUri: vscode.Uri,
        private globalState: vscode.ExtensionContext['globalState']
    ) {}

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            // Allow scripts in the webview
            enableScripts: true,

            localResourceRoots: [this._extensionUri],
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        webviewView.webview.onDidReceiveMessage(async (data) => {
            switch (data.type) {
                case 'saveSettings': {
                    await this.saveSettingsInGlobalState(data.message);
                    break;
                }
                case 'controllerOnLoaded': {
                    vscode.commands.executeCommand(
                        'GPTRus.initView',
                        this.globalState.get('settings') ? 'chat' : 'home'
                    );
                    vscode.commands.executeCommand(
                        'GPTRus.updateChat',
                        chatState
                    );
                    break;
                }
                case 'sendMessage': {
                    this.sendMessage(data.message, data.model);
                    break;
                }
            }
        });
    }

    public updateChat(resp: string) {
        if (this._view) {
            this._view.webview.postMessage({
                type: 'updateChat',
                message: resp,
            });
        }
    }
    public initView(type: string) {
        if (this._view) {
            this._view.webview.postMessage({
                type: 'initView',
                message: type,
            });
        }
    }

    public async saveSettingsInGlobalState(settings: settings) {
        await this.globalState.update('settings', settings);
        vscode.window.showInformationMessage(`Настройки сохранены`);
        vscode.commands.executeCommand('GPTRus.initView', 'chat');
    }

    public clearChat() {
        chatState = [];
        vscode.commands.executeCommand('GPTRus.updateChat', chatState);
    }

    public goToSettings() {
        vscode.commands.executeCommand('GPTRus.initView', 'home');
    }

    public explainSelected() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }
        const selection = editor.document.getText(editor.selection);
        if (!selection) {
            return;
        }
        this.clearChat();
        chatState.push({
            role: 'system',
            text: 'Ты — опытный программист.',
        });
        vscode.commands.executeCommand('workbench.view.extension.GPTrus');
        this.sendMessage(
            'Объясни следующий код: \n\n ```\n' + selection + '\n```'
        );
    }

    public sendMessage(
        message: string,
        model: 'yandexgpt-lite' | 'yandexgpt' = 'yandexgpt-lite'
    ) {
        chatState.push({ role: 'user', text: message });
        vscode.commands.executeCommand('GPTRus.updateChat', chatState);

        const settings: settings | undefined = this.globalState.get('settings');

        const newPost = {
            modelUri: `gpt://${settings?.catalogueId}/${model}`,
            completionOptions: {
                stream: false,
                temperature: 0.6,
                maxTokens: '2000',
            },
            messages: chatState,
        };

        fetch(
            'https://llm.api.cloud.yandex.net/foundationModels/v1/completion',
            {
                method: 'POST',
                body: JSON.stringify(newPost),
                headers: {
                    'content-type': 'application/json',
                    Authorization: `Api-Key ${settings?.token}`,
                    'x-folder-id': `${settings?.catalogueId}`,
                },
            }
        )
            .then((response) => response.json())
            .then((response) => {
                const result = response.result;
                if (response.error) {
                    vscode.window.showErrorMessage(
                        `ОШИБКА ОТ GPTrus: ${JSON.stringify(response)}`
                    );
                }
                chatState.push(result?.alternatives[0].message);
                vscode.commands.executeCommand('GPTRus.updateChat', chatState);
            })
            .catch((err) => {
                console.log('error', err);
                vscode.window.showErrorMessage(
                    `ОШИБКА ОТ GPTrus: ${JSON.stringify(err)}`
                );
            });
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        console.log('_getHtmlForWebview');
        // Get the local path to main script run in the webview, then convert it to a uri we can use in the webview.
        const scriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'media', 'main.js')
        );

        // Do the same for the stylesheet.
        const styleResetUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'media', 'reset.css')
        );
        const styleVSCodeUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'media', 'vscode.css')
        );
        const styleMainUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'media', 'main.css')
        );

        // Use a nonce to only allow a specific script to be run.
        const nonce = getNonce();

        return `<!DOCTYPE html>
			<html lang="ru">
			<head>
				<meta charset="UTF-8">
		

				<meta http-equiv="Content-Security-Policy" Content-Security-Policy: default-src "self"; connect-src "self" https://llm.api.cloud.yandex.net; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">

				<meta name="viewport" content="width=device-width, initial-scale=1.0">

				<link href="${styleResetUri}" rel="stylesheet">
				<link href="${styleVSCodeUri}" rel="stylesheet">
				<link href="${styleMainUri}" rel="stylesheet">

				<title>Chat GPTRus</title>
			</head>
			<body>
				<div id="chat-area" class="hide">
                    <div id="response-box" class="chat-box"></div>
                    <textarea id="user-message-input" class="user-input" rows="5" cols="33" placeholder="Пиши сюда"></textarea>
                    <label for="ya-gpt-model">Модель: </label>
                    <select id="ya-gpt-model" class="model-select">
                        <option value="yandexgpt-lite">YandexGPT Lite</option>
                        <option value="yandexgpt">YandexGPT Pro</option>
                    </select>
                    <button id="send-btn" class="base-btn">Отправить</button>
                </div>
                <div id="home-block" class="hide"> 
                    
                    <label>API-токен
                        <input type="text" class="settings-input" id="api-token-input">
                    </label>
                    <label>Идентификатор каталога
                        <input type="text" class="settings-input" id="catalogue-id-input">
                    </label>
				    <button id="save-settings" class="base-btn">Сохранить настройки</button>
                    <p class="home-help-text small-text">
                        <a href="https://cloud.yandex.ru/ru/docs/iam/operations/api-key/create">Как получить API-ключ?</a></br>
                        </br>
                        <a href="https://cloud.yandex.ru/ru/docs/resource-manager/operations/folder/get-id">Как получить идентификатор каталога?</a>
                    </p>
                </div>
                <div id="progress-bar" class="progress-bar hide">
                    <div class="progress-bar-value"></div>
                </div>
                <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/dark.min.css">
                <script src="https://cdn.jsdelivr.net/npm/marked-highlight/lib/index.umd.js"></script>

                <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
                <script type="module" nonce="${nonce}" src="${scriptUri}"></script>

			</body>
			</html>`;
    }
}

function getNonce() {
    let text = '';
    const possible =
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
