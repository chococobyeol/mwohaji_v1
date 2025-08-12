const timer = (() => {
    // 상태 변수
    let isStopwatchRunning = false;
    let isTimerRunning = false;
    let stopwatchInterval = null;
    let timerInterval = null;
    let stopwatchStartTime = 0;
    let stopwatchElapsedTime = 0;
    let timerEndTime = 0;
    let timerDuration = 0;
    let isInitialized = false;

    // 타이머 UI 초기화 함수
    const initTimerUI = () => {
        if (isInitialized) {
            console.log('[Timer] 이미 초기화되어 있음, 건너뛰기');
            return;
        }

        console.log('[Timer] 타이머 UI 초기화 시작');

        // 기존 타이머 버튼에 아이콘 설정 (아이콘 시스템으로 통일)
        const timerBtn = document.getElementById('timer-btn');
        if (timerBtn) {
            // 원래 사용하던 인라인 SVG를 그대로 사용하여 기존 스타일을 1:1 유지
            timerBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2h12v6l-4 4 4 4v6H6v-6l4-4-4-4V2z"></path></svg>';
            timerBtn.setAttribute('aria-label', '타이머/스톱워치');
            timerBtn.style.display = 'flex';
            timerBtn.style.alignItems = 'center';
            timerBtn.style.justifyContent = 'center';
        }

        // CSS 스타일 추가
        const style = document.createElement('style');
        style.textContent = `
            .timer-toggle-btn svg {
                display: block;
                color: #6b7280;
            }

            .timer-sidebar-overlay {
                z-index: 2000;
                transition: opacity 0.3s ease;
            }

            .tab-button {
                transition: all 0.2s ease;
            }

            .tab-button:hover {
                background-color: #e5e7eb !important;
                color: #374151 !important;
            }

            .tab-button.active {
                background-color: #1a1a1a !important;
                color: #fff !important;
            }

            .tab-button.inactive {
                background-color: transparent !important;
                color: #6b7280 !important;
            }

            .timer-preset:hover {
                background-color: #e5e7eb !important;
                border-color: #9ca3af !important;
            }

            .timer-input:focus {
                outline: none;
                border-color: #1a1a1a !important;
                box-shadow: 0 0 0 3px rgba(26, 26, 26, 0.1);
            }

            #lap-times li {
                display: flex;
                justify-content: space-between;
                padding: 12px 16px;
                margin: 0;
                border-bottom: 1px solid #f3f4f6;
                font-size: 14px;
                color: #374151;
            }

            #lap-times li:last-child {
                border-bottom: none;
            }

            .lap-label {
                font-weight: 500;
                color: #6b7280;
            }

            .lap-time {
                font-family: 'Courier New', monospace;
                font-weight: 600;
                color: #1a1a1a;
            }

            .mini-timer {
                position: fixed;
                left: 80px;
                top: 20px;
                background-color: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 8px 15px;
                border-radius: 20px;
                font-family: 'Courier New', monospace;
                font-size: 18px;
                z-index: 100;
                box-shadow: 0 3px 10px rgba(0, 0, 0, 0.3);
                cursor: pointer;
                user-select: none;
                transition: all 0.2s ease;
            }

            .mini-timer:hover {
                background-color: rgba(0, 0, 0, 0.9);
                transform: scale(1.05);
            }

            .time-ending {
                color: #ef4444 !important;
                animation: pulse 1s infinite;
            }

            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.7; }
            }

            #stopwatch-start-stop:hover,
            #timer-start-stop:hover {
                background-color: #374151 !important;
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(26, 26, 26, 0.3);
            }

            #stopwatch-reset:hover,
            #timer-reset:hover {
                background-color: #4b5563 !important;
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(107, 114, 128, 0.3);
            }
        `;
        
        document.head.appendChild(style);

        // 이벤트 리스너 설정
        setupEventListeners();
        
        isInitialized = true;
        console.log('[Timer] 타이머 UI 초기화 완료');
    };

    // 이벤트 리스너 설정
    const setupEventListeners = () => {
        const closeBtn = document.getElementById('close-timer-sidebar');
        const overlay = document.querySelector('.timer-sidebar-overlay');
        const miniTimer = document.getElementById('mini-timer');

        if (closeBtn) {
            closeBtn.addEventListener('click', closeTimerSidebar);
        }
        if (overlay) {
            overlay.addEventListener('click', closeTimerSidebar);
        }
        if (miniTimer) {
            miniTimer.addEventListener('click', openTimerSidebar);
        }
        
        // 탭 전환 이벤트 바인딩
        const stopwatchTab = document.getElementById('stopwatch-tab');
        const timerTab = document.getElementById('timer-tab');
        if (stopwatchTab) {
            stopwatchTab.addEventListener('click', () => switchTab('stopwatch'));
        }
        if (timerTab) {
            timerTab.addEventListener('click', () => switchTab('timer'));
        }
        
        // 스톱워치 컨트롤 바인딩
        const stopwatchStartStop = document.getElementById('stopwatch-start-stop');
        const stopwatchReset = document.getElementById('stopwatch-reset');
        if (stopwatchStartStop) {
            stopwatchStartStop.addEventListener('click', toggleStopwatch);
        }
        if (stopwatchReset) {
            stopwatchReset.addEventListener('click', resetStopwatch);
        }
        
        // 타이머 컨트롤 바인딩
        const timerStartStop = document.getElementById('timer-start-stop');
        const timerReset = document.getElementById('timer-reset');
        if (timerStartStop) {
            timerStartStop.addEventListener('click', toggleTimer);
        }
        if (timerReset) {
            timerReset.addEventListener('click', resetTimer);
        }
        
        // 타이머 프리셋 버튼 바인딩
        document.querySelectorAll('.timer-preset').forEach(button => {
            button.addEventListener('click', function() {
                const minutes = parseInt(this.getAttribute('data-minutes')) || 0;
                const hours = parseInt(this.getAttribute('data-hours')) || 0;
                const hoursInput = document.getElementById('timer-hours');
                const minutesInput = document.getElementById('timer-minutes');
                const secondsInput = document.getElementById('timer-seconds');
                if (hoursInput) hoursInput.value = hours;
                if (minutesInput) minutesInput.value = minutes;
                if (secondsInput) secondsInput.value = 0;
                updateTimerDisplay();
            });
        });

        // 타이머 입력 필드 이벤트
        const timerInputs = ['timer-hours', 'timer-minutes', 'timer-seconds'];
        timerInputs.forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                input.addEventListener('input', updateTimerDisplay);
                input.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        toggleTimer();
                    }
                });
            }
        });

        // 초기 탭 설정
        setTimeout(() => {
            switchTab('stopwatch');
        }, 100);
    };

    // 타이머 사이드바 열기
    const openTimerSidebar = () => {
        console.log('[Timer] 사이드바 열기 시도');
        const sidebar = document.getElementById('timer-sidebar');
        const overlay = document.querySelector('.timer-sidebar-overlay');
        
        if (sidebar && overlay) {
            console.log('[Timer] 사이드바와 오버레이 찾음');
            sidebar.style.display = 'flex';
            overlay.style.display = 'block';
            setTimeout(() => {
                sidebar.style.left = '0';
                overlay.style.opacity = '1';
            }, 10);
        } else {
            console.error('[Timer] 사이드바 또는 오버레이를 찾을 수 없음');
        }
    };

    // 타이머 사이드바 닫기
    const closeTimerSidebar = () => {
        console.log('[Timer] 사이드바 닫기 시도');
        const sidebar = document.getElementById('timer-sidebar');
        const overlay = document.querySelector('.timer-sidebar-overlay');
        
        if (sidebar && overlay) {
            sidebar.style.left = '-360px';
            overlay.style.opacity = '0';
            setTimeout(() => {
                sidebar.style.display = 'none';
                overlay.style.display = 'none';
            }, 300);
        }
    };

    // 탭 전환
    const switchTab = (tab) => {
        const stopwatchTab = document.getElementById('stopwatch-tab');
        const timerTab = document.getElementById('timer-tab');
        const stopwatchContent = document.getElementById('stopwatch-content');
        const timerContent = document.getElementById('timer-content');
        
        if (!stopwatchTab || !timerTab || !stopwatchContent || !timerContent) return;
        
        if (tab === 'stopwatch') {
            // 스톱워치 탭 활성화
            stopwatchTab.classList.add('active');
            stopwatchTab.classList.remove('inactive');
            stopwatchTab.style.backgroundColor = '#1a1a1a';
            stopwatchTab.style.color = '#fff';
            
            timerTab.classList.remove('active');
            timerTab.classList.add('inactive');
            timerTab.style.backgroundColor = 'transparent';
            timerTab.style.color = '#6b7280';
            
            stopwatchContent.style.display = 'flex';
            timerContent.style.display = 'none';
        } else {
            // 타이머 탭 활성화
            stopwatchTab.classList.remove('active');
            stopwatchTab.classList.add('inactive');
            stopwatchTab.style.backgroundColor = 'transparent';
            stopwatchTab.style.color = '#6b7280';
            
            timerTab.classList.add('active');
            timerTab.classList.remove('inactive');
            timerTab.style.backgroundColor = '#1a1a1a';
            timerTab.style.color = '#fff';
            
            stopwatchContent.style.display = 'none';
            timerContent.style.display = 'flex';
        }
    };

    // 스톱워치 기능
    const toggleStopwatch = () => {
        const btn = document.getElementById('stopwatch-start-stop');
        const resetBtn = document.getElementById('stopwatch-reset');
        if (!btn || !resetBtn) return;
        
        if (isStopwatchRunning) {
            clearInterval(stopwatchInterval);
            btn.textContent = '재개';
            btn.style.background = '#1a1a1a';
            resetBtn.textContent = '리셋';
            isStopwatchRunning = false;
        } else {
            if (stopwatchElapsedTime === 0) {
                stopwatchStartTime = Date.now();
            } else {
                stopwatchStartTime = Date.now() - stopwatchElapsedTime;
            }
            stopwatchInterval = setInterval(updateStopwatch, 10);
            btn.textContent = '중지';
            btn.style.background = '#ef4444';
            resetBtn.textContent = '랩';
            isStopwatchRunning = true;
        }
    };

    const resetStopwatch = () => {
        const resetBtn = document.getElementById('stopwatch-reset');
        const startBtn = document.getElementById('stopwatch-start-stop');
        if (!resetBtn || !startBtn) return;
        
        if (isStopwatchRunning) {
            // 랩 추가
            const lapsList = document.getElementById('lap-times');
            if (lapsList) {
                const lapItem = document.createElement('li');
                const current = formatStopwatchTime(stopwatchElapsedTime);
                const lapNumber = lapsList.children.length + 1;
                lapItem.innerHTML = `<span class="lap-label">랩 ${lapNumber}</span><span class="lap-time">${current}</span>`;
                lapsList.prepend(lapItem);
            }
        } else {
            // 리셋
            clearInterval(stopwatchInterval);
            stopwatchElapsedTime = 0;
            const disp = document.getElementById('stopwatch-display');
            const lapsList = document.getElementById('lap-times');
            if (disp) disp.textContent = '00:00.00';
            if (startBtn) {
                startBtn.textContent = '시작';
                startBtn.style.background = '#1a1a1a';
            }
            if (resetBtn) {
                resetBtn.textContent = '리셋';
            }
            if (lapsList) lapsList.innerHTML = '';
            isStopwatchRunning = false;
        }
    };

    const updateStopwatch = () => {
        const disp = document.getElementById('stopwatch-display');
        if (!disp) {
            clearInterval(stopwatchInterval);
            return;
        }
        const now = Date.now();
        stopwatchElapsedTime = now - stopwatchStartTime;
        disp.textContent = formatStopwatchTime(stopwatchElapsedTime);
    };

    const formatStopwatchTime = (ms) => {
        const m = Math.floor(ms / 60000);
        const s = Math.floor((ms % 60000) / 1000);
        const cs = Math.floor((ms % 1000) / 10);
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
    };

    // 타이머 기능
    const toggleTimer = () => {
        const btn = document.getElementById('timer-start-stop');
        const disp = document.getElementById('timer-display');
        const mini = document.getElementById('mini-timer');
        if (!btn || !disp || !mini) return;
        
        if (isTimerRunning) {
            clearInterval(timerInterval);
            btn.textContent = '재개';
            btn.style.background = '#1a1a1a';
            isTimerRunning = false;
            timerDuration = timerEndTime - Date.now();
        } else {
            if (timerEndTime === 0) {
                const h = parseInt(document.getElementById('timer-hours')?.value) || 0;
                const mi = parseInt(document.getElementById('timer-minutes')?.value) || 0;
                const s = parseInt(document.getElementById('timer-seconds')?.value) || 0;
                timerDuration = (h * 3600 + mi * 60 + s) * 1000;
                if (timerDuration <= 0) {
                    alert('시간을 설정해주세요.');
                    return;
                }
                window.lastTimerSettings = { hours: h, minutes: mi, seconds: s };
            }
            timerEndTime = Date.now() + timerDuration;
            timerInterval = setInterval(updateTimer, 500);
            btn.textContent = '일시정지';
            btn.style.background = '#ef4444';
            isTimerRunning = true;
            mini.style.display = 'block';
        }
    };

    const updateTimer = () => {
        const disp = document.getElementById('timer-display');
        const mini = document.getElementById('mini-timer');
        const startBtn = document.getElementById('timer-start-stop');
        if (!disp || !mini || !startBtn) {
            clearInterval(timerInterval);
            return;
        }
        
        const rem = timerEndTime - Date.now();
        if (rem <= 0) {
            clearInterval(timerInterval);
            disp.textContent = '00:00:00';
            startBtn.textContent = '시작';
            startBtn.style.background = '#1a1a1a';
            mini.style.display = 'none';
            isTimerRunning = false;
            timerEndTime = 0;
            timerDuration = 0;
            showTimerCompleteNotification();
            return;
        }
        
        const ft = formatTimerTime(rem);
        disp.textContent = ft;
        mini.textContent = ft;
        
        if (rem < 60000) {
            disp.classList.add('time-ending');
            mini.classList.add('time-ending');
        } else {
            disp.classList.remove('time-ending');
            mini.classList.remove('time-ending');
        }
    };

    const resetTimer = () => {
        clearInterval(timerInterval);
        timerEndTime = 0;
        timerDuration = 0;
        const disp = document.getElementById('timer-display');
        const btn = document.getElementById('timer-start-stop');
        const mini = document.getElementById('mini-timer');
        
        if (disp) {
            disp.textContent = '00:00:00';
            disp.classList.remove('time-ending');
        }
        if (btn) {
            btn.textContent = '시작';
            btn.style.background = '#1a1a1a';
        }
        if (mini) {
            mini.style.display = 'none';
            mini.classList.remove('time-ending');
        }
        isTimerRunning = false;
        updateTimerDisplay();
    };

    const updateTimerDisplay = () => {
        const hI = document.getElementById('timer-hours');
        const mI = document.getElementById('timer-minutes');
        const sI = document.getElementById('timer-seconds');
        const disp = document.getElementById('timer-display');
        if (!disp) return;
        
        const h = parseInt(hI?.value) || 0;
        const m = parseInt(mI?.value) || 0;
        const s = parseInt(sI?.value) || 0;
        disp.textContent = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    const formatTimerTime = (ms) => {
        const h = Math.floor(ms / 3600000);
        const m = Math.floor((ms % 3600000) / 60000);
        const s = Math.floor((ms % 60000) / 1000);
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    const showTimerCompleteNotification = () => {
        // 기존 알림 모달 재활용
        let desc = '설정한 시간이 끝났습니다.';
        if (window.lastTimerSettings) {
            const { hours, minutes, seconds } = window.lastTimerSettings;
            const parts = [];
            if (hours > 0) parts.push(`${hours}시간`);
            if (minutes > 0) parts.push(`${minutes}분`);
            if (seconds > 0 || (!hours && !minutes)) parts.push(`${seconds}초`);
            desc = `${parts.join(' ')} 타이머가 완료되었습니다.`;
        }
        
        // 기존 알림 모달과 소리 재생 함수 사용
        if (window.notificationScheduler) {
            window.notificationScheduler.playNotificationSound();
            window.notificationScheduler.showNotificationModal('타이머 완료', desc);
        } else {
            // fallback: 간단한 alert
            alert(`타이머 완료\n${desc}`);
        }
    };

    // 초기화 함수
    const init = () => {
        console.log('[Timer] 타이머 모듈 초기화 시작');
        initTimerUI();
    };

    return {
        init,
        openTimerSidebar,
        closeTimerSidebar
    };
})();

// 전역에서 접근 가능하도록 window 객체에 할당
window.timer = timer; 