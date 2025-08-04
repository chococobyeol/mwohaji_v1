// Service Worker for Mwohaji - Background Notifications
const CACHE_NAME = 'mwohaji-v1.4';
const NOTIFICATION_TAG = 'mwohaji-notification';

// Service Worker 설치
self.addEventListener('install', (event) => {
    console.log('[SW] Service Worker 설치됨');
    console.log('[SW] 설치 시간:', new Date().toISOString());
    self.skipWaiting();
});

// Service Worker 활성화
self.addEventListener('activate', (event) => {
    console.log('[SW] Service Worker 활성화됨');
    console.log('[SW] 활성화 시간:', new Date().toISOString());
    event.waitUntil(self.clients.claim());
});

// Service Worker가 비활성화되지 않도록 keep-alive 메커니즘
let keepAliveInterval;
function startKeepAlive() {
    if (keepAliveInterval) {
        clearInterval(keepAliveInterval);
    }
    keepAliveInterval = setInterval(() => {
        console.log('[SW] Keep-alive ping:', new Date().toISOString());
        // 현재 저장된 타이머들 확인
        if (self.notificationTimers) {
            console.log('[SW] 현재 활성 타이머들:', Object.keys(self.notificationTimers));
        }
    }, 30000); // 30초마다
}

// Service Worker 시작 시 keep-alive 시작
startKeepAlive();

// 메시지 처리 (메인 스크립트로부터 알림 요청 받기)
self.addEventListener('message', (event) => {
    console.log('[SW] 메시지 수신:', event.data);
    console.log('[SW] 메시지 수신 시간:', new Date().toISOString());
    console.log('[SW] 메시지 출처:', event.source);
    console.log('[SW] Service Worker 버전: v1.4');
    
    if (event.data.type === 'SCHEDULE_NOTIFICATION' || event.data.type === 'test' || event.data.type === 'start' || event.data.type === 'due' || event.data.type === 'repeat-start' || event.data.type === 'repeat-due') {
        console.log('[SW] 알림 예약 메시지 처리 시작');
        console.log('[SW] 메시지 타입:', event.data.type);
        const { todoId, type, title, message, scheduledTime, hasSound } = event.data;
        console.log('[SW] 알림 정보:', { todoId, type, title, message, scheduledTime, hasSound });
        scheduleNotification(todoId, type, title, message, scheduledTime, hasSound);
    } else if (event.data.type === 'CANCEL_NOTIFICATION') {
        console.log('[SW] 알림 취소 메시지 처리');
        const { todoId, type } = event.data;
        cancelNotification(todoId, type);
        // 반복 알림도 함께 취소
        if (type === 'start' || type === 'due') {
            cancelNotification(todoId, `repeat-${type}`);
        }
    } else if (event.data.type === 'CANCEL_ALL_NOTIFICATIONS') {
        console.log('[SW] 모든 알림 취소 메시지 처리');
        cancelAllNotifications();
    } else {
        console.log('[SW] 알 수 없는 메시지 타입:', event.data.type);
    }
});

// 알림 스케줄링
function scheduleNotification(todoId, type, title, message, scheduledTime, hasSound) {
    const timeoutKey = `${todoId}-${type}`;
    const now = new Date().getTime();
    const targetTime = new Date(scheduledTime).getTime();
    const delay = Math.max(0, targetTime - now);
    
    console.log(`[SW] 알림 예약: ${title} - ${delay}ms 후 (${delay/1000}초)`);
    console.log(`[SW] 현재 시간: ${new Date(now).toISOString()}, 목표 시간: ${new Date(targetTime).toISOString()}`);
    console.log(`[SW] 타이머 키: ${timeoutKey}`);
    console.log(`[SW] 시간 차이: ${targetTime - now}ms (${(targetTime - now)/1000}초)`);
    
    // 기존 타이머가 있으면 취소
    if (self.notificationTimers && self.notificationTimers[timeoutKey]) {
        clearTimeout(self.notificationTimers[timeoutKey]);
        console.log(`[SW] 기존 타이머 취소: ${timeoutKey}`);
    }
    
    // 타이머 설정
    const timeoutId = setTimeout(() => {
        console.log(`[SW] 타이머 콜백 실행 시작: ${title} - ${todoId}-${type}`);
        console.log(`[SW] 타이머 실행 시간: ${new Date().toISOString()}`);
        showNotification(title, message, hasSound, todoId, type);
        // 타이머 정리
        if (self.notificationTimers) {
            console.log(`[SW] 타이머 실행 완료: ${title} - ${todoId}-${type}`);
            delete self.notificationTimers[timeoutKey];
        }
    }, delay);
    
    // 타이머 저장
    if (!self.notificationTimers) {
        self.notificationTimers = {};
    }
    self.notificationTimers[timeoutKey] = timeoutId;
    console.log(`[SW] 타이머 저장됨: ${timeoutKey} = ${timeoutId}`);
    console.log(`[SW] 현재 저장된 타이머들:`, Object.keys(self.notificationTimers));
}

// 알림 취소
function cancelNotification(todoId, type) {
    const timeoutKey = `${todoId}-${type}`;
    
    if (self.notificationTimers && self.notificationTimers[timeoutKey]) {
        clearTimeout(self.notificationTimers[timeoutKey]);
        delete self.notificationTimers[timeoutKey];
        console.log(`[SW] 알림 취소: ${timeoutKey}`);
    }
}

// 모든 알림 취소
function cancelAllNotifications() {
    if (self.notificationTimers) {
        Object.values(self.notificationTimers).forEach(timeoutId => {
            clearTimeout(timeoutId);
        });
        self.notificationTimers = {};
        console.log('[SW] 모든 알림 취소됨');
    }
}

// 알림 표시
async function showNotification(title, message, hasSound, todoId, type) {
    console.log(`[SW] 알림 표시 시작: ${title} - ${message}`);
    console.log(`[SW] 알림 표시 시간: ${new Date().toISOString()}`);
    console.log(`[SW] 알림 권한 상태: ${Notification.permission}`);
    console.log(`[SW] Service Worker registration:`, self.registration);
    
    try {
        // 알림 권한 확인
        if (Notification.permission !== 'granted') {
            console.log('[SW] 알림 권한이 없습니다');
            return;
        }
        
        // 알림 옵션 설정
        const options = {
            body: message,
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            tag: `${NOTIFICATION_TAG}-${todoId}-${type}`,
            requireInteraction: false,
            silent: !hasSound,
            data: {
                todoId,
                type,
                timestamp: Date.now()
            }
        };
        
        console.log('[SW] 알림 옵션:', options);
        
        // 알림 표시
        const notification = await self.registration.showNotification(title, options);
        console.log('[SW] 알림이 성공적으로 표시됨:', notification);
        
        // 메인 스크립트에 알림 발생 알림 (앱 내부 모달 표시 및 소리 재생)
        notifyMainScript('NOTIFICATION_SHOWN', { todoId, type, title, message });
        
        // 소리 재생 (hasSound가 true인 경우)
        if (hasSound) {
            try {
                console.log('[SW] 알림 소리 재생 시도');
                // 메인 스크립트에 소리 재생 요청
                notifyMainScript('PLAY_NOTIFICATION_SOUND', { todoId, type });
            } catch (soundError) {
                console.error('[SW] 소리 재생 실패:', soundError);
            }
        }
        
    } catch (error) {
        console.error('[SW] 알림 표시 실패:', error);
        console.error('[SW] 에러 상세:', error.message, error.stack);
    }
}

// 알림 클릭 처리
self.addEventListener('notificationclick', (event) => {
    console.log('[SW] 알림 클릭됨:', event.notification);
    
    event.notification.close();
    
    // 메인 스크립트에 알림 클릭 알림
    const data = event.notification.data;
    notifyMainScript('NOTIFICATION_CLICKED', data);
    
    // 브라우저 창/탭 포커스
    event.waitUntil(
        self.clients.matchAll().then((clients) => {
            if (clients.length > 0) {
                // 기존 창/탭이 있으면 포커스
                console.log('[SW] 기존 클라이언트 발견, 포커스:', clients.length, '개');
                return clients[0].focus();
            } else {
                // 새 창 열기
                console.log('[SW] 기존 클라이언트 없음, 새 창 열기');
                return self.clients.openWindow('/');
            }
        })
    );
});

// 알림 닫기 처리
self.addEventListener('notificationclose', (event) => {
    console.log('[SW] 알림 닫힘:', event.notification);
    
    const data = event.notification.data;
    notifyMainScript('NOTIFICATION_CLOSED', data);
});

// 메인 스크립트에 메시지 전송
function notifyMainScript(type, data) {
    self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
            client.postMessage({
                type: type,
                data: data,
                timestamp: Date.now()
            });
        });
    });
}

// 주기적 작업 (필요시)
self.addEventListener('periodicsync', (event) => {
    console.log('[SW] 주기적 동기화:', event);
});

// 백그라운드 동기화
self.addEventListener('sync', (event) => {
    console.log('[SW] 백그라운드 동기화:', event);
}); 