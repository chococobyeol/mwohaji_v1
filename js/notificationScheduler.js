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

    // 알림 모달 표시 함수
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

    // 개별 알림을 스케줄링하는 함수 (일반 할 일용)
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
            todoManager.markNotified(todo.id, type);
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
        // 시스템 시간 변경을 강제로 반영하기 위해 Date 객체를 새로 생성
        // 브라우저 캐시 무시를 위해 시간을 다시 설정
        const now = new Date(new Date().getTime());
        console.log(`[RepeatAlarm] 현재 시간 확인: ${now}`);
        let base = new Date(todo.schedule[type === 'start' ? 'startTime' : 'dueTime']);
        if (!todo.repeat) { 
            console.log('[RepeatAlarm] repeat 없음, 예약 불가'); 
            return null; 
        }
        
        // base가 유효한 Date 객체인지 확인
        if (!(base instanceof Date) || isNaN(base.getTime())) {
            console.error('[RepeatAlarm] 잘못된 base 시간:', base);
            return null;
        }
        
        if (todo.repeat.type === 'daily') {
            // 현재 시간을 기준으로 다음 알림 시간 계산
            const interval = todo.repeat.interval || 1;
            const baseHours = base.getHours();
            const baseMinutes = base.getMinutes();
            
            // base 시간부터 시작해서 현재 시간 이후의 다음 알림 시간 찾기
            let nextTime = new Date(base);
            
            console.log(`[RepeatAlarm] daily 초기 계산: base=${base}, now=${now}, nextTime=${nextTime}, interval=${interval}`);
            
            // base 시간이 현재 시간보다 이전이면 interval만큼 증가
            let iteration = 0;
            while (nextTime < now && iteration < 100) { // 무한 루프 방지 (<= 대신 < 사용)
                nextTime = new Date(nextTime.getTime() + (interval * 24 * 60 * 60 * 1000));
                iteration++;
                console.log(`[RepeatAlarm] daily 반복 계산 ${iteration}: nextTime=${nextTime} (interval=${interval}일)`);
            }
            
            if (iteration >= 100) {
                console.error('[RepeatAlarm] daily 무한 루프 방지, 계산 중단');
                return null;
            }
            
            console.log(`[RepeatAlarm] daily 최종: base=${base}, now=${now}, nextTime=${nextTime}`);
            return nextTime;
        }
        
        if (todo.repeat.type === 'weekly') {
            let days = todo.repeat.days || [];
            if (days.length === 0) { 
                console.log('[RepeatAlarm] weekly, days 없음'); 
                return null; 
            }
            
            // 오늘 포함하여 앞으로 28일 동안 확인
            for (let i = 0; i < 28; i++) {
                let candidate = new Date(now);
                candidate.setDate(candidate.getDate() + i);
                candidate.setHours(base.getHours(), base.getMinutes(), 0, 0);
                
                let candidateDay = candidate.getDay();
                let candidateDayAdjusted = candidateDay === 0 ? 7 : candidateDay;
                
                if (days.includes(candidateDayAdjusted) && candidate > now) {
                    console.log(`[RepeatAlarm] weekly, nextTime: ${candidate} (요일: ${candidateDayAdjusted})`);
                    return candidate;
                }
            }
            console.log('[RepeatAlarm] weekly, 다음 알림 시간을 찾을 수 없음');
            return null;
        }
        
        if (todo.repeat.type === 'monthly') {
            let dates = todo.repeat.dates || [];
            if (dates.length === 0) { 
                console.log('[RepeatAlarm] monthly, dates 없음'); 
                return null; 
            }
            
            // 현재 월부터 3개월까지 확인
            for (let monthOffset = 0; monthOffset < 3; monthOffset++) {
                let candidateMonth = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
                
                for (let date of dates) {
                    let candidate = new Date(candidateMonth);
                    candidate.setDate(date);
                    candidate.setHours(base.getHours(), base.getMinutes(), 0, 0);
                    
                    if (candidate > now) {
                        console.log(`[RepeatAlarm] monthly, nextTime: ${candidate} (날짜: ${date}일)`);
                        return candidate;
                    }
                }
            }
            console.log('[RepeatAlarm] monthly, 다음 알림 시간을 찾을 수 없음');
            return null;
        }
        
        console.log('[RepeatAlarm] 알 수 없는 repeat type');
        return null;
    }

    // 반복 알림 스케줄링 함수
    const scheduleRepeatNotification = (todo, type) => {
        if (!todo.repeat) { 
            console.log('[RepeatAlarm] repeat 없음, 예약 스킵'); 
            return; 
        }
        
        const timeProperty = type === 'start' ? 'startTime' : 'dueTime';
        const modalProperty = type === 'start' ? 'startModal' : 'dueModal';
        const notificationProperty = type === 'start' ? 'startNotification' : 'dueNotification';
        const titlePrefix = type === 'start' ? '시작 알림' : '마감 알림';
        
        if (!todo.schedule || !todo.schedule[timeProperty]) { 
            console.log('[RepeatAlarm] schedule/timeProperty 없음, 예약 스킵'); 
            return; 
        }
        
        const nextTime = getNextRepeatTime(todo, type);
        if (!nextTime) { 
            console.log('[RepeatAlarm] nextTime 없음, 예약 스킵'); 
            return; 
        }
        
        console.log(`[RepeatAlarm] 계산된 nextTime: ${nextTime}`);
        console.log(`[RepeatAlarm] 계산 시점의 현재 시간: ${new Date()}`);
        
        // nextTime이 현재 시간보다 미래인지 다시 한번 확인
        const now = new Date(new Date().getTime()); // getNextRepeatTime과 동일한 방식
        const diff = nextTime.getTime() - now.getTime();
        
        console.log(`[RepeatAlarm] 시간 차이 확인: nextTime=${nextTime}, now=${now}, diff=${diff}ms`);
        
        if (diff < 0) { 
            console.log(`[RepeatAlarm] nextTime이 과거(${nextTime}), 예약 스킵 - diff=${diff}ms`);
            console.log(`[RepeatAlarm] 현재 시간이 ${Math.abs(diff/1000/60)}분 더 늦음`);
            return; 
        }
        
        // 디버깅: 예약 전 최종 확인
        console.log(`[RepeatAlarm] 최종 예약 확인: ${todo.text} (${type}) - ${nextTime}까지 ${Math.round(diff/1000)}초 남음`);
        
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
            // 다음 알림만 예약 (알람이 울린 시점 기준으로 계산)
            const alarmTriggerTime = new Date(new Date().getTime()); // 강제 시간 동기화
            console.log(`[RepeatAlarm] 알람 울림 시점: ${alarmTriggerTime}`);
            console.log(`[RepeatAlarm] 다음 알림 예약 시작 - 알람 울림 시점 기준`);
            scheduleRepeatNotification(todo, type);
        }, diff);
        
        scheduledTimeouts.set(timeoutKey, timeoutId);
    };

    // 모든 할 일의 알림을 재스케줄링하는 함수
    const rescheduleAllNotifications = (todos) => {
        console.log('[NotificationScheduler] 모든 알림 재스케줄링 시작');
        
        // 기존 타이머 모두 취소
        scheduledTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
        scheduledTimeouts.clear();
        
        todos.forEach(todo => {
            // 완료된 할 일은 알림 스케줄링하지 않음
            if (todo.completed) {
                console.log(`[NotificationScheduler] 완료된 할 일 스킵: ${todo.text}`);
                return;
            }
            
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
        
        console.log('[NotificationScheduler] 모든 알림 재스케줄링 완료');
        
        // UI 업데이트를 위해 renderTodos 호출
        if (window.app && window.app.renderTodos) {
            console.log('[NotificationScheduler] UI 업데이트 트리거');
            window.app.renderTodos();
        }
    };

    // 초기화 함수
    const initScheduler = () => {
        console.log('[NotificationScheduler] 스케줄러 초기화 시작');
        
        // todoManager의 todos 변경 이벤트 구독
        todoManager.onTodosChange(rescheduleAllNotifications);
        
        // 초기 로드 시 한 번 스케줄링
        rescheduleAllNotifications(todoManager.getTodos());
        
        console.log('[NotificationScheduler] 스케줄러 초기화 완료');
    };

    return {
        initScheduler,
        getNextRepeatTime,
        rescheduleAllNotifications
    };
})();

window.notificationScheduler = notificationScheduler; 