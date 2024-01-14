module.exports.handler = async function (event, context) {
    const resp = await fetch(
        'https://llm.api.cloud.yandex.net/foundationModels/v1/completion',
        {
            method: 'POST', // Здесь так же могут быть GET, PUT, DELETE
            body: event.body, // Тело запроса в JSON-формате
            headers: {
                // Добавляем необходимые заголовки
                'content-type': 'application/json',
                Authorization: `Api-Key ${event.headers.Authorization}`,
                'x-folder-id': `${process.env.FOLDER_ID}`,
            },
        }
    );

    return {
        statusCode: 200,
        body: await resp.json(),
    };
};
