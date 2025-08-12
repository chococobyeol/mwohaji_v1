const serviceWorkerManager = (() => {
    let swRegistration = null;
    let isInitialized = false;
    let notificationPermission = 'default';

    // Service Worker 등록
    const registerServiceWorker = async () => {
        if (!('serviceWorker' in navigator)) {
            console.warn('[SWManager] Service Worker가 지원되지 않습니다');
            return false;
        }

        try {
            console.log('[SWManager] Service Worker 등록 시도...');
            swRegistration = await navigator.serviceWorker.register('sw.js', {
                updateViaCache: 'none'
            });
            console.log('[SWManager] Service Worker 등록 성공:', swRegistration);
            console.log('[SWManager] Service Worker 상태:', swRegistration.active ? 'active' : 'inactive');
            console.log('[SWManager] Service Worker scope:', swRegistration.scope);
            
            // Service Worker 상태 변화 모니터링
            if (swRegistration.installing) {
                console.log('[SWManager] Service Worker 설치 중...');
                swRegistration.installing.addEventListener('statechange', () => {
                    console.log('[SWManager] Service Worker 상태 변화:', swRegistration.installing.state);
                });
            }
            
            if (swRegistration.waiting) {
                console.log('[SWManager] Service Worker 대기 중...');
            }
            
            if (swRegistration.active) {
                console.log('[SWManager] Service Worker 활성 상태');
            }
            
            // Service Worker 업데이트 확인
            swRegistration.addEventListener('updatefound', () => {
                const newWorker = swRegistration.installing;
                console.log('[SWManager] 새로운 Service Worker 발견');
                newWorker.addEventListener('statechange', () => {
                    console.log('[SWManager] 새 Service Worker 상태 변화:', newWorker.state);
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        console.log('[SWManager] 새로운 Service Worker가 설치되었습니다');
                    }
                });
            });

            // 즉시 업데이트 확인
            await swRegistration.update();
            console.log('[SWManager] Service Worker 업데이트 확인 완료');

            return true;
        } catch (error) {
            console.error('[SWManager] Service Worker 등록 실패:', error);
            return false;
        }
    };

    // 알림 권한 요청
    const requestNotificationPermission = async () => {
        if (!('Notification' in window)) {
            console.warn('[SWManager] Notification API가 지원되지 않습니다');
            return false;
        }

        try {
            const permission = await Notification.requestPermission();
            notificationPermission = permission;
            console.log('[SWManager] 알림 권한:', permission);
            return permission === 'granted';
        } catch (error) {
            console.error('[SWManager] 알림 권한 요청 실패:', error);
            return false;
        }
    };

    // 알림 권한 확인
    const checkNotificationPermission = () => {
        if (!('Notification' in window)) {
            return false;
        }
        notificationPermission = Notification.permission;
        return notificationPermission === 'granted';
    };

    // Service Worker에 알림 예약 요청
    const scheduleNotification = (todoId, type, title, message, scheduledTime, hasSound) => {
        console.log(`[SWManager] 알림 예약 시도: ${title} - ${scheduledTime}`);
        console.log(`[SWManager] Service Worker 상태: registration=${!!swRegistration}, active=${swRegistration ? !!swRegistration.active : false}`);
        
        if (!swRegistration || !swRegistration.active) {
            console.warn('[SWManager] Service Worker가 활성화되지 않았습니다');
            return false;
        }

        try {
            swRegistration.active.postMessage({
                type: 'SCHEDULE_NOTIFICATION',
                todoId,
                type,
                title,
                message,
                scheduledTime,
                hasSound
            });
            console.log(`[SWManager] 알림 예약 요청 성공: ${title} - ${scheduledTime}`);
            return true;
        } catch (error) {
            console.error('[SWManager] 알림 예약 요청 실패:', error);
            return false;
        }
    };

    // Service Worker에 알림 취소 요청
    const cancelNotification = (todoId, type) => {
        if (!swRegistration || !swRegistration.active) {
            return false;
        }

        try {
            swRegistration.active.postMessage({
                type: 'CANCEL_NOTIFICATION',
                todoId,
                type
            });
            console.log(`[SWManager] 알림 취소 요청: ${todoId}-${type}`);
            return true;
        } catch (error) {
            console.error('[SWManager] 알림 취소 요청 실패:', error);
            return false;
        }
    };

    // 모든 알림 취소
    const cancelAllNotifications = () => {
        if (!swRegistration || !swRegistration.active) {
            return false;
        }

        try {
            swRegistration.active.postMessage({
                type: 'CANCEL_ALL_NOTIFICATIONS'
            });
            console.log('[SWManager] 모든 알림 취소 요청');
            return true;
        } catch (error) {
            console.error('[SWManager] 모든 알림 취소 요청 실패:', error);
            return false;
        }
    };

    // Service Worker로부터 메시지 수신 처리
    const handleServiceWorkerMessage = (event) => {
        console.log('[SWManager] Service Worker 메시지 수신:', event.data);
        
        const { type, data } = event.data;
        
        switch (type) {
            case 'NOTIFICATION_SHOWN':
                handleNotificationShown(data);
                break;
            case 'NOTIFICATION_CLICKED':
                handleNotificationClicked(data);
                break;
            case 'NOTIFICATION_CLOSED':
                handleNotificationClosed(data);
                break;
            case 'PLAY_NOTIFICATION_SOUND':
                handlePlayNotificationSound(data);
                break;
            default:
                console.log('[SWManager] 알 수 없는 메시지 타입:', type);
        }
    };

    // 알림 표시 처리
    const handleNotificationShown = (data) => {
        console.log('[SWManager] 알림 표시됨:', data);
        
        // 앱 내부 모달 표시 및 소리 재생
        if (window.notificationScheduler) {
            const { title, message } = data;
            // 모달 표시
            if (window.notificationScheduler.showNotificationModal) {
                console.log('[SWManager] 알림 모달 표시 시도:', title);
                window.notificationScheduler.showNotificationModal(title, message);
            } else {
                console.warn('[SWManager] showNotificationModal 함수를 찾을 수 없습니다');
            }
            // 소리 재생 (별도로 처리됨)
        } else {
            console.warn('[SWManager] notificationScheduler를 찾을 수 없습니다');
        }
        
        // 메인 앱에 알림 발생 알림
        if (window.app && window.app.handleNotificationShown) {
            console.log('[SWManager] 메인 앱에 알림 표시 알림 전송');
            window.app.handleNotificationShown(data);
        } else {
            console.warn('[SWManager] window.app.handleNotificationShown을 찾을 수 없습니다');
        }
    };

    // 알림 클릭 처리
    const handleNotificationClicked = (data) => {
        console.log('[SWManager] 알림 클릭됨:', data);
        
        // 메인 앱에 알림 클릭 알림
        if (window.app && window.app.handleNotificationClicked) {
            window.app.handleNotificationClicked(data);
        } else {
            console.warn('[SWManager] window.app.handleNotificationClicked를 찾을 수 없습니다');
        }
    };

    // 알림 닫기 처리
    const handleNotificationClosed = (data) => {
        console.log('[SWManager] 알림 닫힘:', data);
        
        // 메인 앱에 알림 닫기 알림
        if (window.app && window.app.handleNotificationClosed) {
            window.app.handleNotificationClosed(data);
        } else {
            console.warn('[SWManager] window.app.handleNotificationClosed를 찾을 수 없습니다');
        }
    };

    // 알림 소리 재생 처리
    const handlePlayNotificationSound = (data) => {
        console.log('[SWManager] 알림 소리 재생 요청:', data);
        try {
            // 메인 앱의 소리 재생 함수 호출
            if (window.app && window.app.playNotificationSound) {
                console.log('[SWManager] window.app.playNotificationSound 호출');
                window.app.playNotificationSound();
            } else if (window.notificationScheduler && window.notificationScheduler.playNotificationSound) {
                console.log('[SWManager] notificationScheduler.playNotificationSound 호출');
                window.notificationScheduler.playNotificationSound();
            } else {
                console.warn('[SWManager] 소리 재생 함수를 찾을 수 없습니다');
                // 직접 소리 재생 시도
                const audio = new Audio('assets/sounds/notification.mp3');
                audio.play().catch(e => {
                    console.error('[SWManager] 직접 소리 재생 실패:', e);
                });
            }
        } catch (error) {
            console.error('[SWManager] 소리 재생 실패:', error);
            // 에러 발생 시에도 직접 소리 재생 시도
            try {
                const audio = new Audio('assets/sounds/notification.mp3');
                audio.play().catch(e => {
                    console.error('[SWManager] 직접 소리 재생 실패 (에러 후):', e);
                });
            } catch (e) {
                console.error('[SWManager] 직접 소리 재생 시도 실패:', e);
            }
        }
    };

    // Service Worker 사용 여부 확인
    const isUsingServiceWorker = () => {
        if (!swRegistration || !swRegistration.active) {
            return false;
        }
        
        // Notification API 사용 설정 확인
        if (window.storage && window.storage.getNotificationApiEnabled) {
            const notificationEnabled = window.storage.getNotificationApiEnabled();
            if (!notificationEnabled) {
                return false;
            }
        }
        
        // 알림 권한 확인
        return checkNotificationPermission();
    };

    // 초기화
    const init = async () => {
        if (isInitialized) {
            console.log('[SWManager] 이미 초기화되어 있습니다');
            return;
        }

        console.log('[SWManager] 초기화 시작');

        // Service Worker 등록
        const swRegistered = await registerServiceWorker();
        
        // 알림 권한 확인
        const hasPermission = checkNotificationPermission();
        
        if (swRegistered && hasPermission) {
            console.log('[SWManager] Service Worker와 알림 권한이 모두 준비되었습니다');
        } else if (swRegistered && !hasPermission) {
            console.log('[SWManager] Service Worker는 등록되었지만 알림 권한이 필요합니다');
        } else {
            console.log('[SWManager] Service Worker 등록 또는 알림 권한에 문제가 있습니다');
        }

        // Service Worker 메시지 리스너 등록
        if (navigator.serviceWorker) {
            navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
        }

        isInitialized = true;
        console.log('[SWManager] 초기화 완료');
    };

    // 정리
    const cleanup = () => {
        if (navigator.serviceWorker) {
            navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
        }
        isInitialized = false;
        console.log('[SWManager] 정리 완료');
    };

    return {
        init,
        cleanup,
        registerServiceWorker,
        requestNotificationPermission,
        checkNotificationPermission,
        scheduleNotification,
        cancelNotification,
        cancelAllNotifications,
        isInitialized: () => isInitialized,
        hasPermission: () => checkNotificationPermission(),
        getPermission: () => notificationPermission,
        isUsingServiceWorker
    };
})();

window.serviceWorkerManager = serviceWorkerManager; 