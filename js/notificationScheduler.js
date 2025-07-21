const notificationScheduler = (() => {
    let currentPlayingAudio = null; // 현재 재생 중인 알림 소리 Audio 객체
    const scheduledTimeouts = new Map(); // 할 일 ID별 setTimeout ID를 저장

    // 알림 사운드 재생 함수
    const playNotificationSound = () => {
        if (currentPlayingAudio) {
            currentPlayingAudio.pause();
            currentPlayingAudio.currentTime = 0;
        }
        const audio = new Audio('assets/sounds/notification.mp3');
        audio.play().catch(e => console.error('알림 소리 재생 실패:', e));
        currentPlayingAudio = audio; // 현재 재생 중인 오디오 객체 저장
    };

    // 알림 모달 표시 함수 (기존과 동일)
    const showNotificationModal = (title, message) => {
        const modalId = 'notification-alert-modal';
        let modal = document.getElementById(modalId);
        if (!modal) {
            modal = document.createElement('div');
            modal.id = modalId;
            modal.className = 'modal-wrapper';
            modal.innerHTML = `
                <div class="modal-content" style="max-width: 350px;">
                    <div class="modal-header">
                        <h2 id="notification-alert-title"></h2>
                        <button id="close-notification-alert-modal" class="icon-btn"></button>
                    </div>
                    <div class="modal-body" style="text-align: center; padding: 20px;">
                        <p id="notification-alert-message"></p>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            const closeBtn = modal.querySelector('#close-notification-alert-modal');
            closeBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
            closeBtn.setAttribute('aria-label', '닫기');
            
            const closeAndStopSound = () => {
                modal.style.display = 'none';
                if (currentPlayingAudio) {
                    currentPlayingAudio.pause();
                    currentPlayingAudio.currentTime = 0;
                    currentPlayingAudio = null;
                }
            };

            closeBtn.addEventListener('click', closeAndStopSound);
            modal.addEventListener('click', (e) => {
                if (e.target === modal) closeAndStopSound();
            });
        }

        modal.querySelector('#notification-alert-title').textContent = title;
        modal.querySelector('#notification-alert-message').textContent = message;
        modal.style.display = 'flex';
    };

    // 개별 알림을 스케줄링하는 함수
    const scheduleNotification = (todo, type) => {
        const timeProperty = type === 'start' ? 'startTime' : 'dueTime';
        const modalProperty = type === 'start' ? 'startModal' : 'dueModal';
        const notificationProperty = type === 'start' ? 'startNotification' : 'dueNotification';
        const notifiedProperty = type === 'start' ? 'notifiedStart' : 'notifiedDue';
        const titlePrefix = type === 'start' ? '시작 알림' : '마감 알림';

        // 이미 알림이 발생했거나 (notified true), 알림 시간이 없는 경우 스케줄링 안함
        if (!todo.schedule || !todo.schedule[timeProperty] || todo.schedule[notifiedProperty]) {
            return;
        }

        const targetTime = new Date(todo.schedule[timeProperty]);
        const now = new Date();
        let diff = targetTime.getTime() - now.getTime(); // 밀리초 단위 차이

        // 알람 시간이 이미 지난 경우 (음수 diff)
        if (diff < 0) {
            // 과거의 알람은 울리지 않고 notified 상태를 true로 설정하여 다시 울리지 않도록 함
            // todoManager.markNotified(todo.id, type); // 이 부분은 호출하지 않음 (로드 시점 처리)
            console.log(`[NotificationScheduler] 과거 알림 스킵: '${todo.text}' (${titlePrefix}) - 이미 ${-diff / 1000}초 지남.`);
            return;
        }

        // 기존 타이머가 있으면 취소
        const timeoutKey = `${todo.id}-${type}`;
        if (scheduledTimeouts.has(timeoutKey)) {
            clearTimeout(scheduledTimeouts.get(timeoutKey));
            scheduledTimeouts.delete(timeoutKey);
        }
        
        // setTimeout으로 알림 예약
        const timeoutId = setTimeout(() => {
            // 알림이 트리거될 때 실제 알림을 띄우고 소리를 재생
            console.log(`    >>> ${titlePrefix} 트리거: '${todo.text}'`);
            if (todo.schedule[modalProperty] !== false) {
                showNotificationModal(titlePrefix, `'${todo.text}'`);
            }
            if (todo.schedule[notificationProperty]) {
                playNotificationSound();
            }
            // 알림 발생 상태로 변경
            todoManager.markNotified(todo.id, type);
            // 예약된 타이머 목록에서 제거
            scheduledTimeouts.delete(timeoutKey);

        }, diff);

        scheduledTimeouts.set(timeoutKey, timeoutId);
        console.log(`[NotificationScheduler] ${titlePrefix} 예약: '${todo.text}' - ${diff / 1000}초 후`);
    };

    // 모든 할 일의 알림을 재스케줄링하는 함수
    const rescheduleAllNotifications = (todos) => {
        // 기존 모든 타이머 취소
        scheduledTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
        scheduledTimeouts.clear();

        todos.forEach(todo => {
            if (todo.completed) return; // 완료된 할 일은 알림 스킵

            // 시작 시간 알림 스케줄링
            if (todo.schedule && todo.schedule.startTime) {
                scheduleNotification(todo, 'start');
            }

            // 마감 시간 알림 스케줄링
            if (todo.schedule && todo.schedule.dueTime) {
                scheduleNotification(todo, 'due');
            }
        });
    };

    // 초기화 함수
    const initScheduler = () => {
        // todoManager의 todos 변경 이벤트 구독
        todoManager.onTodosChange(rescheduleAllNotifications);
        // 초기 로드 시 한 번 스케줄링
        rescheduleAllNotifications(todoManager.getTodos());
    };

    return {
        initScheduler
    };
})(); 