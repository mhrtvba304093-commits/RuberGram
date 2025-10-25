// Пример серверного кода (Node.js + Express)
const webpush = require('web-push');

// Настройки VAPID
const vapidKeys = {
    publicKey: 'BLx1q...',
    privateKey: '...'
};

webpush.setVapidDetails(
    'mailto:your-email@example.com',
    vapidKeys.publicKey,
    vapidKeys.privateKey
);

// Сохранение подписки
app.post('/api/save-subscription', async (req, res) => {
    try {
        const subscription = req.body;
        // Сохраните subscription в базу данных
        // ...
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Отправка уведомления
app.post('/api/send-push-notification', async (req, res) => {
    try {
        const { userId, notification } = req.body;
        
        // Получите подписку пользователя из базы данных
        const userSubscription = await getUserSubscription(userId);
        
        if (userSubscription) {
            await webpush.sendNotification(
                userSubscription,
                JSON.stringify({
                    title: notification.title,
                    body: notification.body,
                    url: `/?chat=${notification.chatId}`,
                    chatId: notification.chatId,
                    icon: '/icon-192x192.png'
                })
            );
        }
        
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});