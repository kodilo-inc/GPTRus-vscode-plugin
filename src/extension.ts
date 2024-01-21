import * as vscode from 'vscode';

const chatState: { role: string; text: string }[] = [];

export function activate(context: vscode.ExtensionContext) {
    const provider = new ColorsViewProvider(
        context.extensionUri,
        context.globalState
    );

    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            ColorsViewProvider.viewType,
            provider
        )
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('calicoColors.updateChat', (resp) => {
            provider.updateChat(resp);
        })
    );
    context.subscriptions.push(
        vscode.commands.registerCommand('calicoColors.initView', (resp) => {
            provider.initView(resp);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('calicoColors.askApiKey', (resp) => {
            provider.askApiKey();
        })
    );
}

class ColorsViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'calicoColors.colorsView';

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
                case 'askUserForApiToken': {
                    await this.askApiKey();
                    break;
                }
                case 'controllerOnLoaded': {
                    vscode.commands.executeCommand(
                        'calicoColors.initView',
                        this.globalState.get('yandex-gpt-api-key')
                            ? 'chat'
                            : 'home'
                    );
                    vscode.commands.executeCommand(
                        'calicoColors.updateChat',
                        chatState
                    );
                    break;
                }
                case 'sendMessage': {
                    const requestData = { ...data.message };
                    chatState.push(requestData.messages[0]);
                    vscode.commands.executeCommand(
                        'calicoColors.updateChat',
                        chatState
                    );
                    requestData.messages = chatState;

                    fetch(
                        'https://d5dqa8btt79oqqp2j9hf.apigw.yandexcloud.net/gpt',
                        {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                Authorization: `${this.globalState.get(
                                    'yandex-gpt-api-key'
                                )}`,
                            },
                            body: JSON.stringify(requestData),
                        }
                    )
                        .then((response) => response.json())
                        .then(({ result }) => {
                            chatState.push(result.alternatives[0].message);
                            console.log('chatState after response', chatState);
                            vscode.commands.executeCommand(
                                'calicoColors.updateChat',
                                chatState
                            );
                        });
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

    public async askApiKey() {
        const result = await vscode.window.showInputBox({
            placeHolder: 'Введите API ключ для YandexGPT',
        });
        await this.globalState.update('yandex-gpt-api-key', result);
        vscode.window.showInformationMessage(`API key сохранен`);
        vscode.commands.executeCommand(
            'calicoColors.initView',
            result ? 'chat' : 'home'
        );
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
			<html lang="en">
			<head>
				<meta charset="UTF-8">
		

				<meta http-equiv="Content-Security-Policy" Content-Security-Policy: default-src "self"; connect-src "self" https://llm.api.cloud.yandex.net; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">

				<meta name="viewport" content="width=device-width, initial-scale=1.0">

				<link href="${styleResetUri}" rel="stylesheet">
				<link href="${styleVSCodeUri}" rel="stylesheet">
				<link href="${styleMainUri}" rel="stylesheet">

				<title>Cat Colors</title>
			</head>
			<body>
				<div id="chat-area" class="hide">
                    <div id="response-box" class="chat-box"></div>
                    <textarea id="input" class="user-input" rows="5" cols="33" placeholder="Пиши сюда"></textarea>

                    <button id="send-btn" class="base-btn">Отправить</button>
                </div>
				<button id="set-api-token" class="base-btn hide">Set API token</button>
                <div id="progress-bar" class="progress-bar hide">
                    <div class="progress-bar-value"></div>
                </div>

                

                <script nonce="${nonce}" src="${scriptUri}"></script>


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
