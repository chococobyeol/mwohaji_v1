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

    // 반복 알림의 다음 알림 시각 계산 함수
    function getNextRepeatTime(todo, type) {
        const now = new Date();
        let base = new Date(todo.schedule[type === 'start' ? 'startTime' : 'dueTime']);
        if (!todo.repeat) { console.log('[RepeatAlarm] repeat 없음, 예약 불가'); return null; }
        
        // base가 유효한 Date 객체인지 확인
        if (!(base instanceof Date) || isNaN(base.getTime())) {
            console.error('[RepeatAlarm] 잘못된 base 시간:', base);
            return null;
        }
        
        if (todo.repeat.type === 'daily') {
            while (base <= now) base.setDate(base.getDate() + (todo.repeat.interval || 1));
            console.log(`[RepeatAlarm] daily, nextTime: ${base}`);
            return base;
        }
        if (todo.repeat.type === 'weekly') {
            let days = todo.repeat.days || [];
            if (days.length === 0) { console.log('[RepeatAlarm] weekly, days 없음'); return null; }
            let minDiff = Infinity, next = null;
            for (let i = 0; i < 14; i++) {
                let candidate = new Date(base);
                candidate.setDate(candidate.getDate() + i);
                if (candidate > now) {
                    let dow = candidate.getDay();
                    let myDow = dow === 0 ? 7 : dow;
                    if (days.includes(myDow)) {
                        if (candidate - now < minDiff) {
                            minDiff = candidate - now;
                            next = candidate;
                        }
                    }
                }
            }
            console.log(`[RepeatAlarm] weekly, nextTime: ${next}`);
            return next;
        }
        if (todo.repeat.type === 'monthly') {
            let dates = todo.repeat.dates || [];
            if (dates.length === 0) { console.log('[RepeatAlarm] monthly, dates 없음'); return null; }
            let nowY = now.getFullYear(), nowM = now.getMonth();
            let candidates = [];
            for (let m = 0; m < 2; m++) {
                let y = nowY, mon = nowM + m;
                if (mon > 11) { y++; mon -= 12; }
                dates.forEach(d => {
                    let candidate = new Date(base);
                    candidate.setFullYear(y);
                    candidate.setMonth(mon);
                    candidate.setDate(d);
                    candidate.setHours(base.getHours(), base.getMinutes(), 0, 0);
                    if (candidate > now) candidates.push(candidate);
                });
            }
            if (candidates.length === 0) { console.log('[RepeatAlarm] monthly, 후보 없음'); return null; }
            candidates.sort((a, b) => a - b);
            console.log(`[RepeatAlarm] monthly, nextTime: ${candidates[0]}`);
            return candidates[0];
        }
        console.log('[RepeatAlarm] 알 수 없는 repeat type');
        return null;
    }

    // 반복 알림 스케줄링 함수
    const scheduleRepeatNotification = (todo, type) => {
        if (!todo.repeat) { console.log('[RepeatAlarm] repeat 없음, 예약 스킵'); return; }
        const timeProperty = type === 'start' ? 'startTime' : 'dueTime';
        const modalProperty = type === 'start' ? 'startModal' : 'dueModal';
        const notificationProperty = type === 'start' ? 'startNotification' : 'dueNotification';
        const titlePrefix = type === 'start' ? '시작 알림' : '마감 알림';
        if (!todo.schedule || !todo.schedule[timeProperty]) { console.log('[RepeatAlarm] schedule/timeProperty 없음, 예약 스킵'); return; }
        const nextTime = getNextRepeatTime(todo, type);
        if (!nextTime) { console.log('[RepeatAlarm] nextTime 없음, 예약 스킵'); return; }
        const now = new Date();
        const diff = nextTime.getTime() - now.getTime();
        if (diff < 0) { console.log(`[RepeatAlarm] nextTime이 과거(${nextTime}), 예약 스킵`); return; }
        const timeoutKey = `${todo.id}-repeat-${type}`;
        if (scheduledTimeouts.has(timeoutKey)) {
            clearTimeout(scheduledTimeouts.get(timeoutKey));
            scheduledTimeouts.delete(timeoutKey);
        }
        console.log(`[RepeatAlarm] 예약: ${todo.text} (${type}), ${nextTime}까지 ${Math.round(diff/1000)}초 남음`);
        const timeoutId = setTimeout(() => {
            console.log(`[RepeatAlarm] 트리거: ${todo.text} (${type}), ${nextTime}`);
            if (todo.schedule[modalProperty] !== false) {
                showNotificationModal(titlePrefix, `'${todo.text}' (반복)`);
            }
            if (todo.schedule[notificationProperty]) {
                playNotificationSound();
            }
            // 반복 알림에서는 notified 상태를 업데이트하지 않음 (반복이므로)
            // 다음 알림만 예약
            scheduleRepeatNotification(todo, type);
        }, diff);
        scheduledTimeouts.set(timeoutKey, timeoutId);
    };

    // 모든 할 일의 알림을 재스케줄링하는 함수
    const rescheduleAllNotifications = (todos) => {
        scheduledTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
        scheduledTimeouts.clear();
        todos.forEach(todo => {
            if (todo.completed) return;
            if (todo.schedule && todo.schedule.startTime) {
                if (todo.repeat) {
                    // 반복 할 일은 반복 알림만 사용
                    scheduleRepeatNotification(todo, 'start');
                } else {
                    // 일반 할 일은 일반 알림 사용
                    scheduleNotification(todo, 'start');
                }
            }
            if (todo.schedule && todo.schedule.dueTime) {
                if (todo.repeat) {
                    // 반복 할 일은 반복 알림만 사용
                    scheduleRepeatNotification(todo, 'due');
                } else {
                    // 일반 할 일은 일반 알림 사용
                    scheduleNotification(todo, 'due');
                }
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
        initScheduler,
        getNextRepeatTime
    };
})();

window.notificationScheduler = notificationScheduler; 