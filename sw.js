// sw.js
self.addEventListener('push', function(event) {
    if (!event.data) return;
    
    const data = event.data.json();
    
    const options = {
        body: data.body,
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        vibrate: [100, 50, 100],
        data: {
            url: data.url,
            chatId: data.chatId
        },
        actions: [
            {
                action: 'open',
                title: 'Открыть чат',
                icon: '/icons/chat-icon.png'
            },
            {
                action: 'close',
                title: 'Закрыть',
                icon: '/icons/close-icon.png'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    
    if (event.action === 'open') {
        const chatId = event.notification.data.chatId;
        event.waitUntil(
            clients.openWindow(`/?chat=${chatId}`)
        );
    } else if (event.action === 'close') {
        // Просто закрыть уведомление
    } else {
        // Клик по самому уведомлению
        const chatId = event.notification.data.chatId;
        event.waitUntil(
            clients.openWindow(`/?chat=${chatId}`)
        );
    }
});

self.addEventListener('pushsubscriptionchange', function(event) {
    event.waitUntil(
        self.registration.pushManager.subscribe(event.oldSubscription.options)
        .then(function(subscription) {
            // Отправить новую подписку на сервер
            return fetch('/api/update-subscription', {
                method: 'POST',
                body: JSON.stringify({
                    old_subscription: event.oldSubscription,
                    new_subscription: subscription
                }),
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        })
    );
});