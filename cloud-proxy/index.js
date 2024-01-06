module.exports.handler = async function (event, context) {
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

    const resp = await fetch(
        'https://llm.api.cloud.yandex.net/foundationModels/v1/completion',
        {
            method: 'POST', // Здесь так же могут быть GET, PUT, DELETE
            body: JSON.stringify(newPost), // Тело запроса в JSON-формате
            headers: {
                // Добавляем необходимые заголовки
                'content-type': 'application/json',
                Authorization: `Api-Key ${process.env.API_KEY}`,
                'x-folder-id': `${process.env.FOLDER_ID}`,
            },
        }
    );

    return {
        statusCode: 200,
        body: await resp.json(),
    };
};
