const notificationScheduler = (() => {
    let currentPlayingAudio = null; // 현재 재생 중인 알림 소리 Audio 객체
    const scheduledTimeouts = new Map(); // 할 일 ID별 setTimeout ID를 저장
    const repeatCounts = new Map(); // 할 일 ID별 반복 횟수 추적

    // 알림 사운드 재생 함수
    const playNotificationSound = () => {
        if (currentPlayingAudio) {
            currentPlayingAudio.pause();
            currentPlayingAudio.currentTime = 0;
            currentPlayingAudio = null; // 참조 제거
        }
        const audio = new Audio('assets/sounds/notification.mp3');
        audio.play().catch(e => console.error('알림 소리 재생 실패:', e));
        currentPlayingAudio = audio; // 현재 재생 중인 오디오 객체 저장
        
        // 오디오 재생 완료 후 참조 정리
        audio.addEventListener('ended', () => {
            if (currentPlayingAudio === audio) {
                currentPlayingAudio = null;
            }
        });
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
        if (diff <= 0) {
            // 과거의 알람은 울리지 않고 notified 상태를 true로 설정하여 다시 울리지 않도록 함
            todoManager.markNotified(todo.id, type);
            console.log(`[NotificationScheduler] 과거 알림 스킵: '${todo.text}' (${titlePrefix}) - 이미 ${Math.abs(diff) / 1000}초 지남.`);
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
            console.log(`    >>> ${titlePrefix} 트리거: '${todo.text}' (예약된 시간: ${targetTime}, 실제 트리거 시간: ${new Date()})`);
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
            
            // 알람이 울린 후 즉시 UI 업데이트
            if (window.app && window.app.renderTodos) {
                console.log('[Notification] 알람 울림 후 UI 즉시 업데이트');
                window.app.renderTodos();
            }

        }, diff);

        scheduledTimeouts.set(timeoutKey, timeoutId);
        console.log(`[NotificationScheduler] ${titlePrefix} 예약: '${todo.text}' - ${diff / 1000}초 후`);
    };

    // 시간 기반 카운트 계산 함수
    const calculateTimeBasedCount = (todo, type) => {
        if (!todo.repeat || todo.repeat.type !== 'interval' || !todo.repeat.limit) {
            return;
        }
        
        const now = new Date(Date.now());
        const base = new Date(todo.schedule[type === 'start' ? 'startTime' : 'dueTime']);
        const interval = todo.repeat.interval || 30;
        const limit = todo.repeat.limit;
        
        const countKey = `${todo.id}-${type}`;
        const timeDiff = now.getTime() - base.getTime();
        const minutesDiff = Math.floor(timeDiff / (60 * 1000));
        
        // 음수 시간 차이는 아직 시작하지 않은 경우
        if (minutesDiff < 0) {
            console.log(`[RepeatAlarm] 아직 시작하지 않은 알림: ${todo.text} (${type}) - ${minutesDiff}분 남음`);
            return;
        }
        
        const expectedCount = Math.floor(minutesDiff / interval) + 1; // +1은 첫 번째 알림
        const actualCount = Math.min(expectedCount, limit);
        
        // 기존 카운트와 비교하여 더 큰 값으로 설정
        const currentCount = repeatCounts.get(countKey) || 0;
        
        // 실제로 알림이 발생했을 때만 카운트를 증가시킴
        // 현재 시간이 base 시간보다 이후이고, 아직 완료되지 않은 경우에만
        if (actualCount > currentCount && actualCount > 0) {
            repeatCounts.set(countKey, actualCount);
            console.log(`[RepeatAlarm] 시간 기반 카운트 업데이트: ${todo.text} (${type}) - ${actualCount}/${limit} (${minutesDiff}분 경과, ${interval}분 간격)`);
            
            // 완료 상태 동기화 (실제로 limit에 도달했을 때만)
            if (actualCount >= limit) {
                if (type === 'start') {
                    todo.repeat.startCompleted = true;
                } else if (type === 'due') {
                    todo.repeat.dueCompleted = true;
                }
                console.log(`[RepeatAlarm] 완료 상태 설정: ${todo.text} (${type}) - ${limit}회 완료`);
            }
        }
    };

    // 반복 알림의 다음 알림 시각 계산 함수
    function getNextRepeatTime(todo, type) {
        // 브라우저 캐싱을 우회하여 실제 시스템 시간 강제 가져오기
        const now = new Date(Date.now());
        console.log(`[RepeatAlarm] 현재 시간 확인: ${now.toLocaleString('ko-KR')} (${now.toISOString()}) [Timestamp: ${Date.now()}]`);
        
        // 사용자가 설정한 최신 시간을 base로 사용 (수정된 시간이 우선)
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
        
        console.log(`[RepeatAlarm] 사용자 설정 시간 (base): ${base.toLocaleString('ko-KR')} (${base.toISOString()})`);
        
        if (todo.repeat.type === 'daily') {
            // 현재 시간을 기준으로 다음 알림 시간 계산
            const interval = todo.repeat.interval || 1;
            
            // base 시간의 시/분을 추출 (사용자가 설정한 정확한 시간)
            const baseHours = base.getHours();
            const baseMinutes = base.getMinutes();
            
            console.log(`[RepeatAlarm] daily 설정된 시간: ${baseHours}시 ${baseMinutes}분`);
            
            // 사용자가 설정한 날짜에 설정된 시간을 적용 (오늘 날짜가 아님!)
            let nextTime = new Date(base);
            nextTime.setHours(baseHours, baseMinutes, 0, 0);
            
            console.log(`[RepeatAlarm] daily 초기 계산: base=${base.toLocaleString('ko-KR')}, now=${now.toLocaleString('ko-KR')}, nextTime=${nextTime.toLocaleString('ko-KR')}, interval=${interval}`);
            
            // nextTime이 현재 시간보다 이전이거나 같으면 다음 날로 이동
            let iteration = 0;
            let skippedCount = 0;
            while (nextTime <= now && iteration < 100) {
                const previousTime = new Date(nextTime);
                nextTime = new Date(nextTime.getTime() + (interval * 24 * 60 * 60 * 1000));
                iteration++;
                skippedCount++;
                console.log(`[RepeatAlarm] daily 반복 계산 ${iteration}: ${previousTime.toLocaleString('ko-KR')} 스킵 → ${nextTime.toLocaleString('ko-KR')} (interval=${interval}일)`);
            }
            
            if (iteration >= 100) {
                console.error('[RepeatAlarm] daily 무한 루프 방지, 계산 중단');
                return null;
            }
            
            if (skippedCount > 0) {
                console.log(`[RepeatAlarm] daily 스킵된 알림: ${skippedCount}개, 다음 알림: ${nextTime.toLocaleString('ko-KR')}`);
            }
            
            console.log(`[RepeatAlarm] daily 최종: base=${base.toLocaleString('ko-KR')}, now=${now.toLocaleString('ko-KR')}, nextTime=${nextTime.toLocaleString('ko-KR')}`);
            return nextTime;
        }
        
        if (todo.repeat.type === 'weekly') {
            let days = todo.repeat.days || [];
            if (days.length === 0) { 
                console.log('[RepeatAlarm] weekly, days 없음'); 
                return null; 
            }
            
            // base 시간의 시/분을 추출
            const baseHours = base.getHours();
            const baseMinutes = base.getMinutes();
            
            console.log(`[RepeatAlarm] weekly 설정된 시간: ${baseHours}시 ${baseMinutes}분`);
            
            // 사용자가 설정한 날짜부터 시작하여 앞으로 28일 동안 확인
            let startDate = new Date(base);
            for (let i = 0; i < 365; i++) {
                let candidate = new Date(startDate);
                candidate.setDate(candidate.getDate() + i);
                candidate.setHours(baseHours, baseMinutes, 0, 0);
                
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
            
            // base 시간의 시/분을 추출
            const baseHours = base.getHours();
            const baseMinutes = base.getMinutes();
            
            console.log(`[RepeatAlarm] monthly 설정된 시간: ${baseHours}시 ${baseMinutes}분`);
            
            // 사용자가 설정한 월부터 3개월까지 확인
            let startMonth = new Date(base.getFullYear(), base.getMonth(), 1);
            for (let monthOffset = 0; monthOffset < 12; monthOffset++) {
                let candidateMonth = new Date(startMonth);
                candidateMonth.setMonth(candidateMonth.getMonth() + monthOffset);
                
                for (let date of dates) {
                    let candidate = new Date(candidateMonth);
                    candidate.setDate(date);
                    candidate.setHours(baseHours, baseMinutes, 0, 0);
                    
                    if (candidate > now) {
                        console.log(`[RepeatAlarm] monthly, nextTime: ${candidate} (날짜: ${date}일)`);
                        return candidate;
                    }
                }
            }
            console.log('[RepeatAlarm] monthly, 다음 알림 시간을 찾을 수 없음');
            return null;
        }
        
        if (todo.repeat.type === 'interval') {
            const interval = todo.repeat.interval || 30; // 기본값 30분
            const limit = todo.repeat.limit; // 사용자 설정 반복 횟수 제한
            console.log(`[RepeatAlarm] interval 설정된 간격: ${interval}분, 제한: ${limit || '없음'}`);
            
            // base 시간의 시/분을 추출 (사용자가 설정한 정확한 시간)
            const baseHours = base.getHours();
            const baseMinutes = base.getMinutes();
            
            console.log(`[RepeatAlarm] interval 설정된 시간: ${baseHours}시 ${baseMinutes}분`);
            
            // 사용자가 설정한 시간을 기준으로 다음 알림 시간 계산
            let nextTime = new Date(base);
            nextTime.setHours(baseHours, baseMinutes, 0, 0);
            
            console.log(`[RepeatAlarm] interval 초기 계산: base=${base.toLocaleString('ko-KR')}, now=${now.toLocaleString('ko-KR')}, nextTime=${nextTime.toLocaleString('ko-KR')}, interval=${interval}분`);
            
            // nextTime이 현재 시간보다 이전이거나 같으면 interval분씩 더해서 미래 시간으로 이동
            let iteration = 0;
            let skippedCount = 0;
            const maxIterations = limit || 10000; // 사용자 설정 제한 또는 기본값 10000회
            
            while (nextTime <= now && iteration < maxIterations) {
                const previousTime = new Date(nextTime);
                nextTime = new Date(nextTime.getTime() + (interval * 60 * 1000));
                iteration++;
                skippedCount++;
                console.log(`[RepeatAlarm] interval 반복 계산 ${iteration}: ${previousTime.toLocaleString('ko-KR')} 스킵 → ${nextTime.toLocaleString('ko-KR')} (interval=${interval}분)`);
            }
            
            // 시간 기반 카운트 계산은 별도 함수로 분리 (getNextRepeatTime에서는 제거)
            
            if (iteration >= maxIterations) {
                console.error('[RepeatAlarm] interval 반복 제한에 도달');
                if (limit) {
                    console.warn(`[RepeatAlarm] 사용자 설정 반복 횟수(${limit}회)에 도달했습니다. 반복이 종료됩니다.`);
                } else {
                    console.warn(`[RepeatAlarm] 기본 반복 제한(${maxIterations}회)에 도달했습니다. 반복 설정을 확인해주세요.`);
                }
                return null;
            }
            
            if (skippedCount > 0) {
                console.log(`[RepeatAlarm] interval 스킵된 알림: ${skippedCount}개, 다음 알림: ${nextTime.toLocaleString('ko-KR')}`);
            }
            
            console.log(`[RepeatAlarm] interval 최종: base=${base.toLocaleString('ko-KR')}, now=${now.toLocaleString('ko-KR')}, nextTime=${nextTime.toLocaleString('ko-KR')}`);
            return nextTime;
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
        
        // 해당 타입의 반복이 이미 완료되었는지 확인
        if (type === 'start' && todo.repeat.startCompleted) {
            console.log('[RepeatAlarm] 시작 알림 반복 완료됨, 예약 스킵');
            return;
        }
        if (type === 'due' && todo.repeat.dueCompleted) {
            console.log('[RepeatAlarm] 마감 알림 반복 완료됨, 예약 스킵');
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
        const now = new Date(Date.now());
        const diff = nextTime.getTime() - now.getTime();
        
        console.log(`[RepeatAlarm] 시간 차이 확인: nextTime=${nextTime.toLocaleString('ko-KR')}, now=${now.toLocaleString('ko-KR')}, diff=${diff}ms [Timestamp: ${Date.now()}]`);
        
        if (diff <= 0) { 
            console.log(`[RepeatAlarm] nextTime이 과거 또는 현재(${nextTime}), 예약 스킵 - diff=${diff}ms`);
            if (diff < 0) {
                console.log(`[RepeatAlarm] 현재 시간이 ${Math.abs(diff/1000/60)}분 더 늦음`);
            }
            // 스킵된 경우에도 다음 알림을 재계산해보기 (최대 3회까지만)
            const retryKey = `${todo.id}-${type}-retry`;
            const retryCount = parseInt(sessionStorage.getItem(retryKey) || '0');
            
            if (retryCount < 3) {
                console.log(`[RepeatAlarm] 스킵된 알림에 대해 다음 알림 재계산 시도 (${retryCount + 1}/3)`);
                sessionStorage.setItem(retryKey, (retryCount + 1).toString());
                setTimeout(() => {
                    scheduleRepeatNotification(todo, type);
                }, 1000); // 1초 후 재시도
            } else {
                console.log(`[RepeatAlarm] 최대 재시도 횟수 초과, 알림 스킵`);
                sessionStorage.removeItem(retryKey);
            }
            return; 
        }
        
        // 성공적으로 예약되면 재시도 카운터 초기화
        const retryKey = `${todo.id}-${type}-retry`;
        sessionStorage.removeItem(retryKey);
        
        // 디버깅: 예약 전 최종 확인
        console.log(`[RepeatAlarm] 최종 예약 확인: ${todo.text} (${type}) - ${nextTime}까지 ${Math.round(diff/1000)}초 남음`);
        
        const timeoutKey = `${todo.id}-repeat-${type}`;
        if (scheduledTimeouts.has(timeoutKey)) {
            clearTimeout(scheduledTimeouts.get(timeoutKey));
            scheduledTimeouts.delete(timeoutKey);
        }
        
        console.log(`[RepeatAlarm] 예약: ${todo.text} (${type}), ${nextTime}까지 ${Math.round(diff/1000)}초 남음`);
        
        const timeoutId = setTimeout(() => {
            console.log(`[RepeatAlarm] 트리거: ${todo.text} (${type}), 예약된 시간: ${nextTime}, 실제 트리거 시간: ${new Date()}`);
            
            // 반복 횟수 추적 (시간 간격 반복인 경우)
            if (todo.repeat && todo.repeat.type === 'interval') {
                const countKey = `${todo.id}-${type}`;
                const currentCount = repeatCounts.get(countKey) || 0;
                const newCount = currentCount + 1;
                repeatCounts.set(countKey, newCount);
                console.log(`[RepeatAlarm] 반복 횟수 증가: ${todo.text} (${type}) - ${newCount}회`);
                
                // 반복 제한에 도달했는지 확인 (해당 타입만)
                if (todo.repeat.limit && newCount >= todo.repeat.limit) {
                    console.log(`[RepeatAlarm] 반복 제한에 도달: ${todo.text} (${type}) - ${todo.repeat.limit}회 완료`);
                    
                    // 해당 타입의 반복만 비활성화 (반복 설정에서 제거하지 않음)
                    if (type === 'start') {
                        todo.repeat.startCompleted = true;
                    } else if (type === 'due') {
                        todo.repeat.dueCompleted = true;
                    }
                    
                    // 할 일 데이터 저장
                    if (window.todoManager) {
                        window.todoManager.saveTodos();
                    }
                }
            }
            
            // 알림 표시 및 소리 재생
            if (todo.schedule[modalProperty] !== false) {
                showNotificationModal(titlePrefix, `'${todo.text}' (반복)`);
            }
            if (todo.schedule[notificationProperty]) {
                playNotificationSound();
            }
            
            // 알람이 울린 후 즉시 UI 업데이트
            if (window.app && window.app.renderTodos) {
                console.log('[RepeatAlarm] 알람 울림 후 UI 즉시 업데이트');
                window.app.renderTodos();
            }
            
            // 반복 알림에서는 다음 알림을 즉시 예약 (반복이 아직 유효한 경우)
            if (todo.repeat) {
                setTimeout(() => {
                    console.log(`[RepeatAlarm] 다음 알림 예약 시작 - 알람 울림 시점 기준`);
                    scheduleRepeatNotification(todo, type);
                    
                    // 다음 알람 예약 후에도 UI 업데이트
                    if (window.app && window.app.renderTodos) {
                        console.log('[RepeatAlarm] 다음 알람 예약 후 UI 업데이트');
                        window.app.renderTodos();
                    }
                }, 100);
            }
        }, diff);
        
        scheduledTimeouts.set(timeoutKey, timeoutId);
    };

    // 모든 할 일의 알림을 재스케줄링하는 함수
    const rescheduleAllNotifications = (todos) => {
        console.log('[NotificationScheduler] 모든 알림 재스케줄링 시작');
        const now = new Date(Date.now());
        console.log(`[NotificationScheduler] 현재 시간: ${now.toLocaleString('ko-KR')} (${now.toISOString()}) [Timestamp: ${Date.now()}]`);
        
        // 기존 타이머 모두 취소
        scheduledTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
        scheduledTimeouts.clear();
        
        let scheduledCount = 0;
        let skippedCount = 0;
        
        todos.forEach(todo => {
            // 완료된 할 일은 알림 스케줄링하지 않음
            if (todo.completed) {
                console.log(`[NotificationScheduler] 완료된 할 일 스킵: ${todo.text}`);
                skippedCount++;
                return;
            }
            
            if (todo.schedule && todo.schedule.startTime) {
                if (todo.repeat) {
                    // 반복 할 일은 반복 알림만 사용
                    // 시간 기반 횟수 계산 (새로고침 시 동기화)
                    if (todo.repeat.type === 'interval') {
                        calculateTimeBasedCount(todo, 'start');
                    }
                    scheduleRepeatNotification(todo, 'start');
                    scheduledCount++;
                } else {
                    // 일반 할 일은 일반 알림 사용
                    scheduleNotification(todo, 'start');
                    scheduledCount++;
                }
            }
            
            if (todo.schedule && todo.schedule.dueTime) {
                if (todo.repeat) {
                    // 반복 할 일은 반복 알림만 사용
                    // 시간 기반 횟수 계산 (새로고침 시 동기화)
                    if (todo.repeat.type === 'interval') {
                        calculateTimeBasedCount(todo, 'due');
                    }
                    scheduleRepeatNotification(todo, 'due');
                    scheduledCount++;
                } else {
                    // 일반 할 일은 일반 알림 사용
                    scheduleNotification(todo, 'due');
                    scheduledCount++;
                }
            }
        });
        
        console.log(`[NotificationScheduler] 모든 알림 재스케줄링 완료 - 예약: ${scheduledCount}개, 스킵: ${skippedCount}개`);
        
        // UI 업데이트를 위해 renderTodos 호출
        if (window.app && window.app.renderTodos) {
            console.log('[NotificationScheduler] UI 업데이트 트리거');
            window.app.renderTodos();
        }
    };

    // 초기화 함수
    const initScheduler = () => {
        console.log('[NotificationScheduler] 스케줄러 초기화 시작');
        
        // 반복 횟수 로드
        loadRepeatCounts();
        
        // todoManager의 todos 변경 이벤트 구독
        todoManager.onTodosChange(rescheduleAllNotifications);
        
        // 초기 로드 시 한 번 스케줄링
        rescheduleAllNotifications(todoManager.getTodos());
        
        console.log('[NotificationScheduler] 스케줄러 초기화 완료');
    };

    // 반복 횟수 저장
    const saveRepeatCounts = () => {
        try {
            const countsData = {};
            repeatCounts.forEach((count, key) => {
                countsData[key] = count;
            });
            localStorage.setItem('mwohaji-repeat-counts', JSON.stringify(countsData));
            console.log('[NotificationScheduler] 반복 횟수 저장 완료');
        } catch (e) {
            console.error('[NotificationScheduler] 반복 횟수 저장 실패:', e);
        }
    };

    // 반복 횟수 데이터 가져오기 (백업용)
    const getRepeatCountsData = () => {
        const countsData = {};
        repeatCounts.forEach((count, key) => {
            countsData[key] = count;
        });
        return countsData;
    };

    // 반복 횟수 로드
    const loadRepeatCounts = () => {
        try {
            const countsData = localStorage.getItem('mwohaji-repeat-counts');
            if (countsData) {
                const counts = JSON.parse(countsData);
                repeatCounts.clear();
                Object.entries(counts).forEach(([key, count]) => {
                    repeatCounts.set(key, count);
                });
                console.log('[NotificationScheduler] 반복 횟수 로드 완료:', counts);
            } else {
                console.log('[NotificationScheduler] 저장된 반복 횟수 데이터가 없습니다.');
            }
        } catch (e) {
            console.error('[NotificationScheduler] 반복 횟수 로드 실패:', e);
        }
    };

    // 정리 함수 (앱 종료 시 호출)
    const cleanupScheduler = () => {
        console.log('[NotificationScheduler] 스케줄러 정리 시작');
        
        // 반복 횟수 저장
        saveRepeatCounts();
        
        // 모든 타이머 취소
        scheduledTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
        scheduledTimeouts.clear();
        
        // 현재 재생 중인 오디오 정리
        if (currentPlayingAudio) {
            currentPlayingAudio.pause();
            currentPlayingAudio.currentTime = 0;
            currentPlayingAudio = null;
        }
        
        console.log('[NotificationScheduler] 스케줄러 정리 완료');
    };

    // 모든 알림 초기화
    const clearAllNotifications = () => {
        console.log('[NotificationScheduler] 모든 알림 초기화 시작');
        
        // 모든 타이머 취소
        scheduledTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
        scheduledTimeouts.clear();
        
        // 반복 횟수 초기화
        repeatCounts.clear();
        
        // 현재 재생 중인 오디오 정리
        if (currentPlayingAudio) {
            currentPlayingAudio.pause();
            currentPlayingAudio.currentTime = 0;
            currentPlayingAudio = null;
        }
        
        // localStorage에서 반복 횟수 데이터 삭제
        try {
            localStorage.removeItem('mwohaji-repeat-counts');
        } catch (e) {
            console.error('[NotificationScheduler] 반복 횟수 데이터 삭제 실패:', e);
        }
        
        console.log('[NotificationScheduler] 모든 알림 초기화 완료');
    };

    return {
        initScheduler,
        cleanupScheduler,
        clearAllNotifications,
        scheduleNotification, // 추가
        getNextRepeatTime,
        rescheduleAllNotifications,
        getRepeatCount: (key) => repeatCounts.get(key) || 0,
        setRepeatCount: (key, count) => {
            repeatCounts.set(key, count);
            console.log(`[NotificationScheduler] 카운트 설정: ${key} = ${count}`);
        },
        resetRepeatCount: (key) => {
            repeatCounts.delete(key);
            console.log(`[NotificationScheduler] 카운트 리셋: ${key}`);
        },
        calculateTimeBasedCount: calculateTimeBasedCount,
        getRepeatCountsData: getRepeatCountsData
    };
})();

window.notificationScheduler = notificationScheduler; 