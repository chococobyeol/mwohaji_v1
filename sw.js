// Service Worker for Mwohaji - Background Notifications
const CACHE_NAME = 'mwohaji-v1.5';
const NOTIFICATION_TAG = 'mwohaji-notification';

// 반복 알림의 다음 시간 계산 함수 (notificationScheduler.js의 getNextRepeatTime 로직 복사)
function getNextRepeatTime(todo, type) {
    const now = new Date(Date.now());
    let base = new Date(todo.schedule[type === 'start' ? 'startTime' : 'dueTime']);
    
    if (!todo.repeat) return null;
    
    if (todo.repeat.type === 'daily') {
        const interval = todo.repeat.interval || 1;
        const timeDiff = now.getTime() - base.getTime();
        const intervalMs = interval * 24 * 60 * 60 * 1000;
        
        if (timeDiff < 0) return base;
        
        const pastIterations = Math.ceil(timeDiff / intervalMs);
        const nextTime = new Date(base.getTime() + pastIterations * intervalMs);
        
        if (nextTime <= now) {
            nextTime.setTime(nextTime.getTime() + intervalMs);
        }
        
        return nextTime;
    }
    
    if (todo.repeat.type === 'weekly') {
        let days = todo.repeat.days || [];
        if (days.length === 0) return null;
        
        const baseHours = base.getHours();
        const baseMinutes = base.getMinutes();
        
        let startDate = new Date(base);
        for (let i = 0; i < 365; i++) {
            let candidate = new Date(startDate);
            candidate.setDate(candidate.getDate() + i);
            candidate.setHours(baseHours, baseMinutes, 0, 0);
            
            let candidateDay = candidate.getDay();
            let candidateDayAdjusted = candidateDay === 0 ? 7 : candidateDay;
            
            if (days.includes(candidateDayAdjusted) && candidate > now) {
                return candidate;
            }
        }
        return null;
    }
    
    if (todo.repeat.type === 'monthly') {
        let dates = todo.repeat.dates || [];
        if (dates.length === 0) return null;
        
        const baseHours = base.getHours();
        const baseMinutes = base.getMinutes();
        
        let startMonth = new Date(base.getFullYear(), base.getMonth(), 1);
        for (let monthOffset = 0; monthOffset < 12; monthOffset++) {
            let candidateMonth = new Date(startMonth);
            candidateMonth.setMonth(candidateMonth.getMonth() + monthOffset);
            
            for (let date of dates) {
                let candidate = new Date(candidateMonth);
                candidate.setDate(date);
                candidate.setHours(baseHours, baseMinutes, 0, 0);
                
                if (candidate > now) {
                    return candidate;
                }
            }
        }
        return null;
    }
    
    if (todo.repeat.type === 'interval') {
        let interval = todo.repeat.interval || 30;
        const limit = todo.repeat.limit;
        
        if (typeof interval !== 'number' || isNaN(interval) || interval <= 0) {
            interval = 30;
        }
        
        const timeDiff = now.getTime() - base.getTime();
        const intervalMs = interval * 60 * 1000;
        
        if (timeDiff < 0) return base;
        
        const pastIterations = Math.ceil(timeDiff / intervalMs);
        const nextTime = new Date(base.getTime() + pastIterations * intervalMs);
        
        if (nextTime <= now) {
            nextTime.setTime(nextTime.getTime() + intervalMs);
        }
        
        if (limit && pastIterations > limit) {
            return null;
        }
        
        return nextTime;
    }
    
    return null;
}

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
    console.log('[SW] Service Worker 버전: v1.5');
    
    if (event.data.type === 'SCHEDULE_NOTIFICATION' || event.data.type === 'test' || event.data.type === 'start' || event.data.type === 'due' || event.data.type === 'repeat-start' || event.data.type === 'repeat-due') {
        console.log('[SW] 알림 예약 메시지 처리 시작');
        console.log('[SW] 메시지 타입:', event.data.type);
        const { todoId, type, title, message, scheduledTime, hasSound, todo } = event.data;
        console.log('[SW] 알림 정보:', { todoId, type, title, message, scheduledTime, hasSound });
        
        // 반복 알림인 경우 todo 객체도 함께 전달받아야 함
        if (type.startsWith('repeat-')) {
            scheduleRepeatNotification(todoId, type, title, message, scheduledTime, hasSound, todo);
        } else {
            scheduleNotification(todoId, type, title, message, scheduledTime, hasSound);
        }
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
    
    // 기존 타이머가 있다면 취소
    if (self.notificationTimers && self.notificationTimers[timeoutKey]) {
        clearTimeout(self.notificationTimers[timeoutKey]);
    }
    
    // notificationTimers 객체 초기화
    if (!self.notificationTimers) {
        self.notificationTimers = {};
    }
    
    const scheduledDate = new Date(scheduledTime);
    const now = new Date();
    const diff = scheduledDate.getTime() - now.getTime();
    
    if (diff <= 0) {
        console.log(`[SW] 알림 시간이 이미 지남: ${scheduledDate}, 즉시 실행`);
        showNotification(todoId, type, title, message, hasSound);
        return;
    }
    
    console.log(`[SW] 알림 예약: ${title} - ${scheduledDate}까지 ${Math.round(diff/1000)}초 남음`);
    
    const timeoutId = setTimeout(() => {
        console.log(`[SW] 알림 트리거: ${title}`);
        showNotification(todoId, type, title, message, hasSound);
        
        // 타이머 완료 후 정리
        if (self.notificationTimers && self.notificationTimers[timeoutKey]) {
            delete self.notificationTimers[timeoutKey];
        }
    }, diff);
    
    self.notificationTimers[timeoutKey] = timeoutId;
}

// 반복 알림 스케줄링 (자체적으로 다음 알림 계산 및 예약)
function scheduleRepeatNotification(todoId, type, title, message, scheduledTime, hasSound, todo) {
    const timeoutKey = `${todoId}-${type}`;
    
    // 기존 타이머가 있다면 취소
    if (self.notificationTimers && self.notificationTimers[timeoutKey]) {
        clearTimeout(self.notificationTimers[timeoutKey]);
    }
    
    // notificationTimers 객체 초기화
    if (!self.notificationTimers) {
        self.notificationTimers = {};
    }
    
    const scheduledDate = new Date(scheduledTime);
    const now = new Date();
    const diff = scheduledDate.getTime() - now.getTime();
    
    if (diff <= 0) {
        console.log(`[SW] 반복 알림 시간이 이미 지남: ${scheduledDate}, 즉시 실행`);
        showNotification(todoId, type, title, message, hasSound);
        
        // 즉시 다음 반복 알림 예약
        if (todo && todo.repeat && !todo.repeat[`${type.replace('repeat-', '')}Completed`]) {
            scheduleNextRepeatNotification(todo, type.replace('repeat-', ''));
        }
        return;
    }
    
    console.log(`[SW] 반복 알림 예약: ${title} - ${scheduledDate}까지 ${Math.round(diff/1000)}초 남음`);
    
    const timeoutId = setTimeout(() => {
        console.log(`[SW] 반복 알림 트리거: ${title}`);
        showNotification(todoId, type, title, message, hasSound);
        
        // 타이머 완료 후 정리
        if (self.notificationTimers && self.notificationTimers[timeoutKey]) {
            delete self.notificationTimers[timeoutKey];
        }
        
        // 다음 반복 알림 즉시 예약
        if (todo && todo.repeat && !todo.repeat[`${type.replace('repeat-', '')}Completed`]) {
            scheduleNextRepeatNotification(todo, type.replace('repeat-', ''));
        }
    }, diff);
    
    self.notificationTimers[timeoutKey] = timeoutId;
}

// 다음 반복 알림 자동 예약 (Service Worker 내부에서 처리)
function scheduleNextRepeatNotification(todo, type) {
    try {
        console.log(`[SW] 다음 반복 알림 자동 예약 시작: ${todo.text} (${type})`);
        
        const nextTime = getNextRepeatTime(todo, type);
        if (!nextTime) {
            console.log(`[SW] 다음 반복 시간 계산 실패: ${todo.text} (${type})`);
            return;
        }
        
        const now = new Date();
        const diff = nextTime.getTime() - now.getTime();
        
        if (diff <= 0) {
            console.log(`[SW] 계산된 다음 시간이 과거: ${nextTime}, 재계산`);
            // 재귀적으로 다시 계산
            setTimeout(() => scheduleNextRepeatNotification(todo, type), 100);
            return;
        }
        
        console.log(`[SW] 다음 반복 알림 예약: ${todo.text} (${type}) - ${nextTime}까지 ${Math.round(diff/1000)}초 남음`);
        
        const timeoutKey = `${todo.id}-repeat-${type}`;
        const timeoutId = setTimeout(() => {
            console.log(`[SW] 다음 반복 알림 트리거: ${todo.text} (${type})`);
            
            // 알림 표시
            const title = type === 'start' ? '시작 알림' : '마감 알림';
            const message = `'${todo.text}' (반복)`;
            showNotification(todo.id, `repeat-${type}`, title, message, true);
            
            // 타이머 완료 후 정리
            if (self.notificationTimers && self.notificationTimers[timeoutKey]) {
                delete self.notificationTimers[timeoutKey];
            }
            
            // 또 다시 다음 알림 예약 (무한 반복)
            if (todo.repeat && !todo.repeat[`${type}Completed`]) {
                scheduleNextRepeatNotification(todo, type);
            }
        }, diff);
        
        if (!self.notificationTimers) {
            self.notificationTimers = {};
        }
        self.notificationTimers[timeoutKey] = timeoutId;
        
    } catch (error) {
        console.error('[SW] 다음 반복 알림 예약 실패:', error);
    }
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
async function showNotification(todoId, type, title, message, hasSound) {
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
            icon: 'favicon.ico',
            badge: 'favicon.ico',
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
        
        // 소리 재생은 항상 메인 스크립트에서 처리
        if (hasSound) {
            notifyMainScript('PLAY_NOTIFICATION_SOUND', { todoId, type });
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
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
            console.log('[SW] 발견된 클라이언트 수:', clients.length);
            
            // 현재 사이트의 클라이언트만 필터링
            const siteClients = clients.filter(client => 
                client.url.includes(self.location.origin)
            );
            console.log('[SW] 현재 사이트 클라이언트 수:', siteClients.length);
            
            // 활성화된 클라이언트 찾기 (visible 상태)
            const focusableClient = siteClients.find(client => typeof client.focus === 'function');
            if (focusableClient) {
                console.log('[SW] 포커스 가능한 클라이언트 발견, 포커스:', focusableClient.url);
                return focusableClient.focus();
            }
            // 클라이언트가 전혀 없으면 스코프 기준으로 새 창 열기
            console.log('[SW] 클라이언트 없음, 새 창 열기');
            return self.clients.openWindow(self.registration.scope || '/');
        }).catch(error => {
            console.error('[SW] 클라이언트 매칭 실패:', error);
            // 에러 발생 시 새 창 열기
            return self.clients.openWindow('/');
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
    console.log(`[SW] 메인 스크립트에 메시지 전송: ${type}`, data);
    
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
        console.log(`[SW] 메시지 전송 대상 클라이언트 수: ${clients.length}`);
        
        // 현재 사이트의 클라이언트만 필터링
        const siteClients = clients.filter(client => 
            client.url.includes(self.location.origin)
        );
        
        console.log(`[SW] 현재 사이트 클라이언트 수: ${siteClients.length}`);
        
        if (siteClients.length === 0) {
            console.warn('[SW] 메시지 전송할 클라이언트가 없습니다');
            return;
        }
        
        // 모든 클라이언트에 메시지 전송
        siteClients.forEach((client, index) => {
            try {
                client.postMessage({
                    type: type,
                    data: data,
                    timestamp: Date.now()
                });
                console.log(`[SW] 클라이언트 ${index + 1}에 메시지 전송 성공:`, client.url);
            } catch (error) {
                console.error(`[SW] 클라이언트 ${index + 1}에 메시지 전송 실패:`, error);
            }
        });
    }).catch(error => {
        console.error('[SW] 클라이언트 매칭 실패 (메시지 전송):', error);
    });
} 