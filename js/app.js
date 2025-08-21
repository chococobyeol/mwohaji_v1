document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const todoInput = document.getElementById('todo-input');
    const addTodoBtn = document.getElementById('add-todo-btn');
    const todoListContainer = document.getElementById('todo-list');
    const projectViewBtn = document.getElementById('view-project');
    const allViewBtn = document.getElementById('view-all');
    const settingsBtn = document.getElementById('settings-btn');
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const exportBtn = document.getElementById('export-btn');
    const importBtn = document.getElementById('import-btn');
    const categoryModal = document.getElementById('category-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const categorySelector = document.getElementById('category-selector');
    const categoryList = document.getElementById('category-list');
    const addCategoryBtn = document.getElementById('add-category-btn');
    const newCategoryInput = document.getElementById('new-category-input');
    const currentTimeElement = document.getElementById('current-time');
    const audioStatusBtn = document.getElementById('audio-status-btn');

    // 일정 설정 모달 관련 DOM Elements
    const scheduleModal = document.getElementById('schedule-modal');
    const closeScheduleModalBtn = document.getElementById('close-schedule-modal-btn');
    const editTodoText = document.getElementById('edit-todo-text');
    const editTodoCategory = document.getElementById('edit-todo-category');
    const startTimeEnabled = document.getElementById('start-time-enabled');
    const startTimeInputs = document.getElementById('start-time-inputs');
    const startDate = document.getElementById('start-date');
    const startTime = document.getElementById('start-time');
    const startModalBtn = document.getElementById('start-modal-btn');
    const startNotificationBtn = document.getElementById('start-notification-btn');
    const dueTimeEnabled = document.getElementById('due-time-enabled');
    const dueTimeInputs = document.getElementById('due-time-inputs');
    const dueDate = document.getElementById('due-date');
    const dueTime = document.getElementById('due-time');
    const dueModalBtn = document.getElementById('due-modal-btn');
    const dueNotificationBtn = document.getElementById('due-notification-btn');
    const saveScheduleBtn = document.getElementById('save-schedule-btn');
    const cancelScheduleBtn = document.getElementById('cancel-schedule-btn');

    // 반복 설정 모달 관련 DOM Elements (추가)
    let repeatModal = null;
    let repeatTypeSelect = null;
    let repeatIntervalInput = null;
    let saveRepeatBtn = null;
    let cancelRepeatBtn = null;
    let currentRepeatTodoId = null;

    // 카테고리 삭제 모달 관련 DOM Elements
    const categoryDeleteModal = document.getElementById('category-delete-modal');
    const closeCategoryDeleteModalBtn = document.getElementById('close-category-delete-modal-btn');
    const categoryDeleteMessage = document.getElementById('category-delete-message');
    const otherCategorySelect = document.getElementById('other-category-select');
    const targetCategorySelect = document.getElementById('target-category-select');
    const confirmCategoryDeleteBtn = document.getElementById('confirm-category-delete-btn');
    const cancelCategoryDeleteBtn = document.getElementById('cancel-category-delete-btn');
    let categoryToDelete = null;

    // 카테고리 편집 모달 관련 DOM Elements
    const categoryEditModal = document.getElementById('category-edit-modal');
    const closeCategoryEditModalBtn = document.getElementById('close-category-edit-modal-btn');
    const editCategoryName = document.getElementById('edit-category-name');
    const saveCategoryEditBtn = document.getElementById('save-category-edit-btn');
    const cancelCategoryEditBtn = document.getElementById('cancel-category-edit-btn');
    let categoryToEdit = null;

    // 카테고리 순서 편집 모달 관련 DOM Elements
    const categoryOrderModal = document.getElementById('category-order-modal');
    const closeCategoryOrderModalBtn = document.getElementById('close-category-order-modal-btn');
    const categoryOrderList = document.getElementById('category-order-list');
    const saveCategoryOrderBtn = document.getElementById('save-category-order-btn');
    const cancelCategoryOrderBtn = document.getElementById('cancel-category-order-btn');
    const editCategoryOrderBtn = document.getElementById('edit-category-order-btn');
    const sortSelect = document.getElementById('sort-select');
    const applySortBtn = document.getElementById('apply-sort-btn');
    let originalCategoryOrder = [];

    // App State
    let currentView = 'project';
    let selectedCategoryId = 'default';
    let currentEditingTodoId = null;
    let settings = { showCompleted: true, todoSortOrder: 'created-desc', collapsedCategories: {}, autoScrollToCategory: true }; // 설정 상태

    // 설정 사이드바 관련
    const globalSettingsBtn = document.getElementById('global-settings-btn');
    const settingsSidebar = document.getElementById('settings-sidebar');
    const closeSettingsSidebar = document.getElementById('close-settings-sidebar');
    const settingsSidebarOverlay = document.querySelector('.settings-sidebar-overlay');
    const mobileActionBar = document.getElementById('mobile-action-bar');
    
    // Service Worker 관련 설정 (동적으로 생성되는 요소들은 나중에 선언됨)
    
    // Service Worker 알림 처리 함수들
    const handleNotificationShown = (data) => {
        console.log('[App] Service Worker 알림 표시됨:', data);
        // 알림 발생 상태로 변경
        if (data.todoId && data.type) {
            const type = data.type.startsWith('repeat-') ? data.type.replace('repeat-', '') : data.type;
            todoManager.markNotified(data.todoId, type);
            // UI 업데이트
            renderTodos();
        }
    };

    // Service Worker로부터 받은 메시지 처리
    const handleServiceWorkerMessage = (event) => {
        const { type, data } = event.data;
        console.log('[App] Service Worker 메시지 수신:', type, data);
        
        switch (type) {
            case 'NOTIFICATION_SHOWN':
                handleNotificationShown(data);
                break;
            case 'PLAY_NOTIFICATION_SOUND':
                handlePlayNotificationSound(data);
                break;
            default:
                console.log('[App] 알 수 없는 Service Worker 메시지 타입:', type);
        }
    };

    // 알림 소리 재생 처리
    const handlePlayNotificationSound = (data) => {
        console.log('[App] 알림 소리 재생 요청:', data);
        
        if (window.notificationScheduler && window.notificationScheduler.playNotificationSound) {
            window.notificationScheduler.playNotificationSound();
        }
    };

    const handleNotificationClicked = (data) => {
        console.log('[App] Service Worker 알림 클릭됨:', data);
        // 브라우저 창/탭 포커스는 Service Worker에서 처리됨
    };

    const handleNotificationClosed = (data) => {
        console.log('[App] Service Worker 알림 닫힘:', data);
    };
    
    // 타이머 관련
    const timerBtn = document.getElementById('timer-btn');
    
    // 타이머 사이드바 열기
    function openTimerSidebar() {
        console.log('[App] 타이머 사이드바 열기 함수 호출');
        if (window.timer && window.timer.openTimerSidebar) {
            console.log('[App] 타이머 모듈의 openTimerSidebar 호출');
            window.timer.openTimerSidebar();
        } else {
            console.error('[App] 타이머 모듈 또는 openTimerSidebar 함수를 찾을 수 없음');
        }
    }

    // 설정 사이드바 열기
    function openSettingsSidebar() {
        settingsSidebar.style.display = 'flex';
        setTimeout(() => settingsSidebar.classList.add('open'), 10);
        settingsSidebarOverlay.classList.add('open');
        settingsSidebarOverlay.style.display = 'block';
    }
    function closeSettingsSidebarFn() {
        settingsSidebar.classList.remove('open');
        settingsSidebarOverlay.classList.remove('open');
        setTimeout(() => { settingsSidebar.style.display = 'none'; settingsSidebarOverlay.style.display = 'none'; }, 300);
    }

    // 모바일 전용 로직
    function isMobileWidth() { return window.innerWidth <= 980; }
    
    // AI 버튼 표시 상태 업데이트 함수
    function updateAiButtonVisibility() {
        const aiChatToggleBtn = document.getElementById('ai-chat-toggle-btn');
        if (aiChatToggleBtn) {
            const isAiEnabled = storage.getAiFeatureEnabled();
            const isMobile = window.innerWidth <= 980;
            
            if (isMobile) {
                aiChatToggleBtn.style.removeProperty('display');
            } else {
                aiChatToggleBtn.style.setProperty('display', isAiEnabled ? 'flex' : 'none', 'important');
            }
        }
    }
    
    function syncMobileButtonsVisibility() {
        console.log('[Mobile] sync visibility. width=', window.innerWidth, 'hasBtn=', !!mobileMenuBtn, 'hasBar=', !!mobileActionBar);
        if (!mobileMenuBtn || !mobileActionBar) return;
        
        if (isMobileWidth()) {
            mobileMenuBtn.style.display = 'inline-flex';
            // AI 버튼 상태도 함께 업데이트
            updateAiButtonVisibility();
        } else {
            mobileMenuBtn.style.display = 'none';
            mobileActionBar.classList.remove('open');
            mobileActionBar.style.display = 'none';
        }
    }
    function createClonedButton(srcBtn) {
        if (!srcBtn) return null;
        const clone = srcBtn.cloneNode(true);
        // id 충돌 방지
        clone.removeAttribute('id');
        // 기존 이벤트를 다시 위임
        clone.addEventListener('click', (e) => {
            const isTimer = srcBtn.id === 'timer-btn';
            const isGlobal = srcBtn.id === 'global-settings-btn';
            const isAi = srcBtn.id === 'ai-chat-toggle-btn';
            if (isTimer) openTimerSidebar();
            if (isGlobal) openSettingsSidebar();
            if (isAi && window.aiChat && window.aiChat.openSidebar) window.aiChat.openSidebar();
        });
        return clone;
    }

    function renderMobileActionBar() {
        if (!mobileActionBar) return;
        mobileActionBar.innerHTML = '';
        // 버튼들을 클론으로 렌더 (원본은 제자리에 유지)
        const timerButton = document.getElementById('timer-btn');
        const globalButton = document.getElementById('global-settings-btn');
        const aiToggle = document.getElementById('ai-chat-toggle-btn');
        const aiEnabled = storage.getAiFeatureEnabled();
        console.log('[Mobile] aiEnabled=', aiEnabled, 'hasAiToggle=', !!aiToggle);
        const timerClone = createClonedButton(timerButton);
        const globalClone = createClonedButton(globalButton);
        if (timerClone) mobileActionBar.appendChild(timerClone);
        if (globalClone) mobileActionBar.appendChild(globalClone);
        if (aiEnabled && aiToggle) {
            const aiClone = createClonedButton(aiToggle);
            if (aiClone) {
                mobileActionBar.appendChild(aiClone);
            }
        }
    }

    function toggleMobileActionBar() {
        if (!mobileActionBar) return;
        const isOpen = mobileActionBar.classList.contains('open');
        console.log('[Mobile] toggle action bar. currentlyOpen=', isOpen);
        if (isOpen) {
            mobileActionBar.classList.remove('open');
            mobileActionBar.style.display = 'none';
            mobileActionBar.innerHTML = '';
            return;
        }
        renderMobileActionBar();
        mobileActionBar.classList.add('open');
        mobileActionBar.style.display = 'flex';
    }

    // 실시간 시간 업데이트 함수
    const updateCurrentTime = () => {
        if (currentTimeElement) {
            // 브라우저 캐싱을 우회하여 실제 시스템 시간 강제 가져오기
            const now = new Date(Date.now());
            
            // 로그와 동일한 형식으로 시간 표시 (ISO 형식)
            const timeString = now.toISOString().replace('T', ' ').substring(0, 19);
            
            // 로컬 시간도 함께 표시
            const localTimeString = now.toLocaleString('ko-KR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            });
            
            // 시간대 정보 포함
            const timezoneOffset = now.getTimezoneOffset();
            const timezoneString = timezoneOffset === -540 ? 'KST' : 'UTC';
            
            currentTimeElement.textContent = `${localTimeString} (${timezoneString})`;
            currentTimeElement.title = `ISO: ${timeString}\nLocal: ${localTimeString}\nTimezone: ${timezoneString}\nTimestamp: ${Date.now()}`;
        }
    };

    // RENDER FUNCTIONS
    const render = () => {
        // 먼저 목록과 카테고리를 렌더해 사용자에게 핵심 UI를 즉시 보여준다
        renderCategorySelector();
        renderTodos();
        // 부가 영역(카테고리 관리 리스트)은 뒤에 렌더
        renderCategoryList();
    };

    // 일정 정보 렌더링 함수
    const renderScheduleInfo = (todo) => {
        if (!todo.schedule) return '';
        
        // 시작 시간이나 마감 시간이 하나라도 있는지 확인
        const hasSchedule = todo.schedule.startTime || todo.schedule.dueTime;
        if (!hasSchedule) return '';
        
        let startTimeHTML = '';
        let dueTimeHTML = '';
        
        // 반복 알림 모듈 import (전역)
        const getNextRepeatTime = window.notificationScheduler && window.notificationScheduler.getNextRepeatTime;
        
        // 시작 시간 표시
        if (todo.schedule.startTime) {
            let displayTime;
            if (todo.repeat && getNextRepeatTime) {
                // 현재 시간을 강제로 동기화한 후 다음 알림 시간 계산
                const next = getNextRepeatTime(todo, 'start');
                displayTime = next ? utils.formatDateTime(next) : utils.formatDateTime(new Date(todo.schedule.startTime));
            } else {
                displayTime = utils.formatDateTime(new Date(todo.schedule.startTime));
            }
            const startIcon = icons.get('clock', 14);
            const modalIcon = todo.schedule.startModal !== false ? 
                icons.get('bell', 14) : icons.get('bellOff', 14);
            const soundIcon = todo.schedule.startNotification ? 
                icons.get('volume', 14) : icons.get('volumeX', 14);
            startTimeHTML = `<span class="schedule-info start-time">${startIcon} ${displayTime} <span class="schedule-icon-clickable" data-todo-id="${todo.id}" data-type="start-modal" title="시작 모달 토글">${modalIcon}</span> <span class="schedule-icon-clickable" data-todo-id="${todo.id}" data-type="start-sound" title="시작 소리 토글">${soundIcon}</span></span>`;
        }
        
        // 마감 시간 표시
        if (todo.schedule.dueTime) {
            let displayTime;
            if (todo.repeat && getNextRepeatTime) {
                // 현재 시간을 강제로 동기화한 후 다음 알림 시간 계산
                const next = getNextRepeatTime(todo, 'due');
                displayTime = next ? utils.formatDateTime(next) : utils.formatDateTime(new Date(todo.schedule.dueTime));
            } else {
                displayTime = utils.formatDateTime(new Date(todo.schedule.dueTime));
            }
            const dueIcon = icons.get('clock', 14);
            const modalIcon = todo.schedule.dueModal !== false ? 
                icons.get('bell', 14) : icons.get('bellOff', 14);
            const soundIcon = todo.schedule.dueNotification ? 
                icons.get('volume', 14) : icons.get('volumeX', 14);
            dueTimeHTML = `<span class="schedule-info due-time">${dueIcon} ${displayTime} <span class="schedule-icon-clickable" data-todo-id="${todo.id}" data-type="due-modal" title="마감 모달 토글">${modalIcon}</span> <span class="schedule-icon-clickable" data-todo-id="${todo.id}" data-type="due-sound" title="마감 소리 토글">${soundIcon}</span></span>`;
        }
        
        return `<div class="schedule-times">${startTimeHTML}${dueTimeHTML}</div>`;
    };

    const renderTodos = () => {
        let allTodos = todoManager.getTodos();
        
        // 설정에 따라 완료된 할 일 필터링
        if (!settings.showCompleted) {
            allTodos = allTodos.filter(todo => !todo.completed);
        }
        
        // 디버그 로그 제거 (프로덕션 환경용)
        
        todoListContainer.innerHTML = '';
        projectViewBtn.classList.toggle('active', currentView === 'project');
        allViewBtn.classList.toggle('active', currentView === 'all');
        
        if (allTodos.length === 0) {
            const message = settings.showCompleted ? 
                '첫 할 일을 추가해보세요...' : 
                '완료되지 않은 할 일이 없습니다.';
            todoListContainer.innerHTML = `<p class="empty-message">${message}</p>`;
            return;
        }
        
        if (currentView === 'project') {
            renderProjectView(allTodos);
        } else {
            renderAllView(allTodos);
        }
    };

    const renderCategorySelector = () => {
        const categories = todoManager.getCategories();
        categorySelector.innerHTML = '';
        categories.forEach(cat => {
            const btn = document.createElement('button');
            btn.textContent = cat.name;
            btn.dataset.id = cat.id;
            btn.classList.toggle('selected', cat.id === selectedCategoryId);
            categorySelector.appendChild(btn);
        });
    };

    const renderCategoryList = () => {
        const categories = todoManager.getCategories();
        categoryList.innerHTML = '';
        categories.forEach(cat => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span class="category-name" data-id="${cat.id}">${cat.name}</span>
                <div class="category-actions">
                    ${cat.id !== 'default' ? `<button class="cat-edit-btn icon-btn" data-id="${cat.id}" title="수정"></button>` : ''}
                    ${cat.id !== 'default' ? `<button class="cat-delete-btn icon-btn" data-id="${cat.id}" title="삭제"></button>` : ''}
                </div>
            `;
            categoryList.appendChild(li);
            
            // 아이콘 설정
            if (cat.id !== 'default') {
                const editBtn = li.querySelector('.cat-edit-btn');
                const deleteBtn = li.querySelector('.cat-delete-btn');
                icons.setButtonIcon(editBtn, 'edit', '수정', 16);
                icons.setButtonIcon(deleteBtn, 'trash', '삭제', 16);
            }
        });
    };

    // 반복 설정 모달 생성 함수 (동적으로 생성)
    const createRepeatModal = () => {
        if (document.getElementById('repeat-modal')) return;
        repeatModal = document.createElement('div');
        repeatModal.id = 'repeat-modal';
        repeatModal.className = 'modal-wrapper';
        repeatModal.style.display = 'none'; // 항상 숨김으로 초기화
        repeatModal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>반복 설정</h2>
                    <button id="close-repeat-modal-btn" class="icon-btn"></button>
                </div>
                <div class="modal-body">
                    <div class="edit-row">
                        <label for="repeat-type">반복 주기:</label>
                        <select id="repeat-type">
                            <option value="none">없음</option>
                            <option value="daily">매일</option>
                            <option value="weekly">매주</option>
                            <option value="monthly">매월</option>
                            <option value="interval">시간 간격</option>
                        </select>
                    </div>
                    <div class="edit-row" id="repeat-daily-row">
                        <label for="repeat-interval">간격(일):</label>
                        <input type="number" id="repeat-interval" min="1" value="1">
                    </div>
                    <div class="edit-row" id="repeat-weekly-row" style="display:none;">
                        <label>요일:</label>
                        <div id="repeat-weekdays" class="weekday-buttons"></div>
                    </div>
                    <div class="edit-row" id="repeat-monthly-row" style="display:none;">
                        <label>날짜:</label>
                        <div id="repeat-monthdays" class="monthday-grid"></div>
                    </div>
                    <div class="edit-row" id="repeat-interval-row" style="display:none;">
                        <label for="repeat-interval-minutes">간격(분):</label>
                        <input type="number" id="repeat-interval-minutes" min="1" max="1440" value="30">
                    </div>
                    <div class="edit-row" id="repeat-interval-limit-row" style="display:none;">
                        <label for="repeat-interval-limit">반복 횟수 제한:</label>
                        <input type="number" id="repeat-interval-limit" min="1" max="10000" placeholder="제한 없음">
                        <span class="limit-hint">회 (비워두면 10000회)</span>
                    </div>
                </div>
                <div class="modal-actions">
                    <button id="save-repeat-btn" class="primary-btn">저장</button>
                    <button id="cancel-repeat-btn" class="secondary-btn">취소</button>
                </div>
            </div>
        `;
        document.body.appendChild(repeatModal);
        icons.setButtonIcon(document.getElementById('close-repeat-modal-btn'), 'close', '닫기', 16);
        repeatTypeSelect = document.getElementById('repeat-type');
        repeatIntervalInput = document.getElementById('repeat-interval');
        saveRepeatBtn = document.getElementById('save-repeat-btn');
        cancelRepeatBtn = document.getElementById('cancel-repeat-btn');
        const weeklyRow = document.getElementById('repeat-weekly-row');
        const monthlyRow = document.getElementById('repeat-monthly-row');
        const dailyRow = document.getElementById('repeat-daily-row');
        const intervalRow = document.getElementById('repeat-interval-row');
        const intervalLimitRow = document.getElementById('repeat-interval-limit-row');
        const weekdaysDiv = document.getElementById('repeat-weekdays');
        const monthdaysDiv = document.getElementById('repeat-monthdays');
        
        // 요일 버튼 생성 (월~일: 1~7)
        weekdaysDiv.innerHTML = '';
        ['월','화','수','목','금','토','일'].forEach((label, idx) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'weekday-btn';
            btn.dataset.value = (idx+1).toString();
            btn.textContent = label;
            btn.onclick = () => {
                btn.classList.toggle('active');
            };
            weekdaysDiv.appendChild(btn);
        });
        
        // 날짜 버튼 생성 (1~31, 달력 모양)
        monthdaysDiv.innerHTML = '';
        for(let i=1;i<=31;i++){
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'monthday-btn';
            btn.dataset.value = i.toString();
            btn.textContent = i;
            btn.onclick = () => {
                btn.classList.toggle('active');
            };
            monthdaysDiv.appendChild(btn);
        }
        
        // 반복 타입 변경 시 UI 표시 전환
        repeatTypeSelect.onchange = () => {
            if(repeatTypeSelect.value==='daily'){
                dailyRow.style.display='flex'; weeklyRow.style.display='none'; monthlyRow.style.display='none'; intervalRow.style.display='none'; intervalLimitRow.style.display='none';
            }else if(repeatTypeSelect.value==='weekly'){
                dailyRow.style.display='none'; weeklyRow.style.display='flex'; monthlyRow.style.display='none'; intervalRow.style.display='none'; intervalLimitRow.style.display='none';
            }else if(repeatTypeSelect.value==='monthly'){
                dailyRow.style.display='none'; weeklyRow.style.display='none'; monthlyRow.style.display='flex'; intervalRow.style.display='none'; intervalLimitRow.style.display='none';
            }else if(repeatTypeSelect.value==='interval'){
                dailyRow.style.display='none'; weeklyRow.style.display='none'; monthlyRow.style.display='none'; intervalRow.style.display='flex'; intervalLimitRow.style.display='flex';
            }else{
                dailyRow.style.display='none'; weeklyRow.style.display='none'; monthlyRow.style.display='none'; intervalRow.style.display='none'; intervalLimitRow.style.display='none';
            }
        };
        document.getElementById('close-repeat-modal-btn').onclick = closeRepeatModal;
        cancelRepeatBtn.onclick = closeRepeatModal;
        saveRepeatBtn.onclick = saveRepeat;
        repeatModal.addEventListener('click', (e) => {
            if (e.target === repeatModal) closeRepeatModal();
        });
    };
    const openRepeatModal = (todoId) => {
        createRepeatModal();
        currentRepeatTodoId = todoId;
        const todo = todoManager.getTodos().find(t => t.id === todoId);
        // 초기화
        repeatTypeSelect.value = 'none';
        repeatIntervalInput.value = 1;
        document.getElementById('repeat-interval-minutes').value = 30;
        document.getElementById('repeat-interval-limit').value = '';
        document.querySelectorAll('#repeat-weekdays .weekday-btn').forEach(btn=>btn.classList.remove('active'));
        document.querySelectorAll('#repeat-monthdays .monthday-btn').forEach(btn=>btn.classList.remove('active'));
        if (todo && todo.repeat) {
            // 기존 반복 설정에 startTime이 없는 경우 현재 일정 시간으로 설정
            if (!todo.repeat.startTime) {
                todo.repeat.startTime = todo.schedule?.startTime || todo.schedule?.dueTime || new Date().toISOString();
                todo.repeat.lastModified = new Date().toISOString();
                console.log(`[App] 기존 반복 설정에 startTime 추가: ${todo.repeat.startTime}`);
                storage.saveTodos(todoManager.getTodos());
            }
            
            if(todo.repeat.type==='daily'){
                repeatTypeSelect.value='daily';
                repeatIntervalInput.value=todo.repeat.interval||1;
            }else if(todo.repeat.type==='weekly'){
                repeatTypeSelect.value='weekly';
                (todo.repeat.days||[]).forEach(d=>{
                    const btn=document.querySelector(`#repeat-weekdays .weekday-btn[data-value="${d}"]`);
                    if(btn)btn.classList.add('active');
                });
            }else if(todo.repeat.type==='monthly'){
                repeatTypeSelect.value='monthly';
                (todo.repeat.dates||[]).forEach(d=>{
                    const btn=document.querySelector(`#repeat-monthdays .monthday-btn[data-value="${d}"]`);
                    if(btn)btn.classList.add('active');
                });
            }else if(todo.repeat.type==='interval'){
                repeatTypeSelect.value='interval';
                document.getElementById('repeat-interval-minutes').value=todo.repeat.interval||30;
                document.getElementById('repeat-interval-limit').value=todo.repeat.limit||'';
            }
        }
        repeatTypeSelect.onchange();
        repeatModal.style.display = 'flex';
    };
    const closeRepeatModal = () => {
        if (repeatModal) repeatModal.style.display = 'none';
        currentRepeatTodoId = null;
    };
    const saveRepeat = () => {
        if (currentRepeatTodoId == null) return;
        const type = repeatTypeSelect.value;
        const todo = todoManager.getTodos().find(t => t.id === currentRepeatTodoId);
        if (todo) {
            if (type === 'none') {
                todo.repeat = null;
                // 반복 설정 제거 시 카운트 리셋
                if (window.notificationScheduler) {
                    const startCountKey = `${todo.id}-start`;
                    const dueCountKey = `${todo.id}-due`;
                    window.notificationScheduler.resetRepeatCount(startCountKey);
                    window.notificationScheduler.resetRepeatCount(dueCountKey);
                    console.log(`[App] 반복 설정 제거 - 카운트 리셋: ${todo.text}`);
                }
            } else if(type==='daily'){
                const interval = parseInt(repeatIntervalInput.value,10)||1;
                todo.repeat = { 
                    type, 
                    interval,
                    startTime: todo.schedule?.startTime || new Date().toISOString(), // 반복 시작 시간 기록
                    lastModified: new Date().toISOString() // 마지막 수정 시간 기록
                };
            } else if(type==='weekly'){
                const days = Array.from(document.querySelectorAll('#repeat-weekdays .weekday-btn.active')).map(btn=>parseInt(btn.dataset.value, 10));
                todo.repeat = { 
                    type, 
                    days,
                    startTime: todo.schedule?.startTime || new Date().toISOString(), // 반복 시작 시간 기록
                    lastModified: new Date().toISOString() // 마지막 수정 시간 기록
                };
            } else if(type==='monthly'){
                const dates = Array.from(document.querySelectorAll('#repeat-monthdays .monthday-btn.active')).map(btn=>parseInt(btn.dataset.value, 10));
                todo.repeat = { 
                    type, 
                    dates,
                    startTime: todo.schedule?.startTime || new Date().toISOString(), // 반복 시작 시간 기록
                    lastModified: new Date().toISOString() // 마지막 수정 시간 기록
                };
            } else if(type==='interval'){
                const interval = parseInt(document.getElementById('repeat-interval-minutes').value, 10) || 30;
                const limitInput = document.getElementById('repeat-interval-limit').value;
                const limit = limitInput ? parseInt(limitInput, 10) : null;
                todo.repeat = { 
                    type, 
                    interval, 
                    limit,
                    startTime: todo.schedule?.startTime || new Date().toISOString(), // 반복 시작 시간 기록
                    lastModified: new Date().toISOString() // 마지막 수정 시간 기록
                };
                
                // 반복 설정 변경 시 카운트 리셋 후 시간 기반 계산
                if (window.notificationScheduler) {
                    const startCountKey = `${todo.id}-start`;
                    const dueCountKey = `${todo.id}-due`;
                    window.notificationScheduler.resetRepeatCount(startCountKey);
                    window.notificationScheduler.resetRepeatCount(dueCountKey);
                    // 새로운 설정으로 시간 기반 카운트 계산
                    window.notificationScheduler.calculateTimeBasedCount(todo, 'start');
                    window.notificationScheduler.calculateTimeBasedCount(todo, 'due');
                    console.log(`[App] 반복 설정 변경 - 카운트 리셋 및 재계산: ${todo.text}`);
                }
            }
            storage.saveTodos(todoManager.getTodos());
            
            // 반복 설정 변경 시 알림 스케줄러 재초기화
            if (window.notificationScheduler) {
                console.log('[App] 반복 설정 변경 - 알림 스케줄러 재초기화');
                window.notificationScheduler.rescheduleAllNotifications(todoManager.getTodos());
            }
            
            closeRepeatModal();
            renderTodos();
        }
    };

    // 카테고리 삭제 모달 관련 함수들
    const openCategoryDeleteModal = (categoryId) => {
        const category = todoManager.getCategories().find(c => c.id === categoryId);
        if (!category) return;

        categoryToDelete = category;
        
        // 해당 카테고리의 할 일 개수 계산
        const todosInCategory = todoManager.getTodos().filter(todo => todo.category === category.name);
        const todoCount = todosInCategory.length;
        
        // 메시지 설정
        categoryDeleteMessage.textContent = `'${category.name}' 카테고리를 삭제하시겠습니까? (${todoCount}개의 할 일이 포함되어 있습니다)`;
        
        // 다른 카테고리 선택 옵션 설정
        const otherCategories = todoManager.getCategories().filter(c => c.id !== categoryId && c.id !== 'default');
        targetCategorySelect.innerHTML = '';
        otherCategories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.name;
            option.textContent = cat.name;
            targetCategorySelect.appendChild(option);
        });
        
        // 라디오 버튼 이벤트 리스너
        document.querySelectorAll('input[name="delete-option"]').forEach(radio => {
            radio.addEventListener('change', handleDeleteOptionChange);
        });
        
        categoryDeleteModal.style.display = 'flex';
    };

    const closeCategoryDeleteModal = () => {
        categoryDeleteModal.style.display = 'none';
        categoryToDelete = null;
        otherCategorySelect.style.display = 'none';
        // 라디오 버튼 초기화
        document.querySelector('input[value="move-to-default"]').checked = true;
    };

    const handleDeleteOptionChange = (e) => {
        if (e.target.value === 'move-to-other') {
            otherCategorySelect.style.display = 'block';
        } else {
            otherCategorySelect.style.display = 'none';
        }
    };

    const confirmCategoryDelete = () => {
        if (!categoryToDelete) return;

        const selectedOption = document.querySelector('input[name="delete-option"]:checked').value;
        
        switch (selectedOption) {
            case 'move-to-default':
                todoManager.deleteCategory(categoryToDelete.id);
                break;
            case 'move-to-other':
                const targetCategory = targetCategorySelect.value;
                if (targetCategory) {
                    todoManager.deleteCategoryAndMoveTodos(categoryToDelete.id, targetCategory);
                } else {
                    todoManager.deleteCategory(categoryToDelete.id);
                }
                break;
            case 'delete-all':
                todoManager.deleteCategoryAndTodos(categoryToDelete.id);
                break;
        }
        
        closeCategoryDeleteModal();
        render();
    };

    // 카테고리 편집 모달 관련 함수들
    const openCategoryEditModal = (categoryId) => {
        const category = todoManager.getCategories().find(c => c.id === categoryId);
        if (!category) return;

        categoryToEdit = category;
        editCategoryName.value = category.name;
        editCategoryName.focus();
        editCategoryName.select(); // 텍스트 전체 선택
        
        categoryEditModal.style.display = 'flex';
    };

    const closeCategoryEditModal = () => {
        categoryEditModal.style.display = 'none';
        categoryToEdit = null;
        editCategoryName.value = '';
    };

    const saveCategoryEdit = () => {
        if (!categoryToEdit) return;

        const newName = editCategoryName.value.trim();
        if (!newName) {
            alert('카테고리 이름을 입력해주세요.');
            return;
        }

        if (newName === categoryToEdit.name) {
            closeCategoryEditModal();
            return;
        }

        // 중복 이름 체크
        const existingCategory = todoManager.getCategories().find(c => 
            c.id !== categoryToEdit.id && c.name.toLowerCase() === newName.toLowerCase()
        );
        if (existingCategory) {
            alert('이미 존재하는 카테고리 이름입니다.');
            return;
        }

        todoManager.updateCategory(categoryToEdit.id, newName);
        closeCategoryEditModal();
        render();
    };

    // 카테고리 순서 편집 관련 함수들
    const openCategoryOrderModal = () => {
        const categories = todoManager.getCategories();
        originalCategoryOrder = [...categories];
        
        // 현재 카테고리 순서가 어떤 정렬 방식에 해당하는지 확인
        const currentSortType = detectCurrentSortType(categories);
        sortSelect.value = currentSortType;
        
        renderCategoryOrderList();
        categoryOrderModal.style.display = 'flex';
    };

    const closeCategoryOrderModal = () => {
        categoryOrderModal.style.display = 'none';
        originalCategoryOrder = [];
        // 드래그 종료 시 참조 초기화
        draggedItem = null;
    };

    const renderCategoryOrderList = () => {
        const categories = todoManager.getCategories();
        categoryOrderList.innerHTML = '';
        
        categories.forEach((category, index) => {
            const li = document.createElement('li');
            li.className = 'category-order-item';
            li.dataset.id = category.id;
            li.dataset.index = index;
            li.dataset.categoryName = category.name;
            
            if (category.id === 'default') {
                li.classList.add('fixed');
            }
            
            li.innerHTML = `
                <span class="category-order-name">${category.name}</span>
                ${category.id === 'default' ? '<span class="category-order-badge">고정</span>' : ''}
            `;
            
            if (category.id !== 'default') {
                li.draggable = true;
                li.style.cursor = 'move';
                li.style.transition = 'transform 0.2s, box-shadow 0.2s';
                
                li.addEventListener('dragstart', handleDragStart);
                li.addEventListener('dragend', handleDragEnd);
            }
            
            categoryOrderList.appendChild(li);
        });
        
        // 컨테이너에 드래그 이벤트 리스너 추가
        categoryOrderList.addEventListener('dragover', handleDragOver);
        categoryOrderList.addEventListener('drop', handleDrop);
    };



    // 드래그 앤 드롭 변수
    let draggedItem = null;

    // 드래그 시작
    const handleDragStart = function(e) {
        draggedItem = this;
        setTimeout(() => this.style.opacity = '0.5', 0);
        this.style.boxShadow = '0 0 10px rgba(0,0,0,0.3)';
        
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', this.dataset.index);
    };

    // 드래그 종료
    const handleDragEnd = function(e) {
        this.style.opacity = '1';
        this.style.boxShadow = 'none';
        
        // 모든 카드의 스타일 초기화
        const items = document.querySelectorAll('.category-order-item');
        items.forEach(item => {
            item.style.borderTop = 'none';
            item.style.borderBottom = 'none';
        });
    };

    // 드래그 오버
    const handleDragOver = function(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        
        // 드래그 오버 중인 요소 찾기
        const item = e.target.closest('.category-order-item');
        if (!item || item === draggedItem || item.classList.contains('fixed')) return;
        
        // 드래그 방향 결정 (위/아래)
        const rect = item.getBoundingClientRect();
        const midY = rect.top + rect.height / 2;
        const isAbove = e.clientY < midY;
        
        // 이전 효과 제거
        const items = document.querySelectorAll('.category-order-item');
        items.forEach(i => {
            i.style.borderTop = 'none';
            i.style.borderBottom = 'none';
        });
        
        // 드랍 위치 표시
        if (isAbove) {
            item.style.borderTop = '2px solid var(--primary-text)';
        } else {
            item.style.borderBottom = '2px solid var(--primary-text)';
        }
    };

    // 드롭
    const handleDrop = function(e) {
        e.preventDefault();
        
        // 드랍 대상 요소 찾기
        const item = e.target.closest('.category-order-item');
        if (!item || item === draggedItem || item.classList.contains('fixed')) return;
        
        // 이동할 인덱스 가져오기
        const fromIndex = parseInt(draggedItem.dataset.index);
        const toIndex = parseInt(item.dataset.index);
        
        // 드래그 방향 결정 (위/아래)
        const rect = item.getBoundingClientRect();
        const midY = rect.top + rect.height / 2;
        const isAbove = e.clientY < midY;
        
        let newIndex = isAbove ? toIndex : toIndex + 1;
        // fromIndex가 newIndex보다 작으면 하나 빼기 (요소가 이미 제거되었기 때문)
        if (fromIndex < newIndex) {
            newIndex--;
        }
        
        // 배열에서 요소 재정렬
        const categories = [...todoManager.getCategories()];
        const movedCategory = categories.splice(fromIndex, 1)[0];
        categories.splice(newIndex, 0, movedCategory);
        
        // '일반' 카테고리를 항상 맨 위로
        const defaultIndex = categories.findIndex(c => c.id === 'default');
        if (defaultIndex > 0) {
            const [defaultCategory] = categories.splice(defaultIndex, 1);
            categories.unshift(defaultCategory);
        }
        
        todoManager.setCategories(categories);
        
        // 사용자가 직접 순서를 변경했으므로 드롭다운을 "사용자 정의 순서"로 변경
        sortSelect.value = 'custom';
        
        renderCategoryOrderList();
    };

    // 현재 카테고리 순서가 어떤 정렬 방식에 해당하는지 감지하는 함수
    const detectCurrentSortType = (categories) => {
        // '일반' 카테고리를 제외한 나머지 카테고리들만 확인
        const generalCategory = categories.find(cat => cat.name === '일반');
        const otherCategories = categories.filter(cat => cat.name !== '일반');
        
        if (otherCategories.length <= 1) {
            return 'custom'; // 카테고리가 1개 이하면 사용자 정의 순서
        }
        
        // 이름순 정렬인지 확인
        const nameSorted = [...otherCategories].sort((a, b) => a.name.localeCompare(b.name, 'ko'));
        const isNameSorted = JSON.stringify(nameSorted) === JSON.stringify(otherCategories);
        
        if (isNameSorted) {
            return 'name';
        }
        
        // 생성 날짜순 (최신순) 정렬인지 확인
        const createdSorted = [...otherCategories].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        const isCreatedSorted = JSON.stringify(createdSorted) === JSON.stringify(otherCategories);
        
        if (isCreatedSorted) {
            return 'created';
        }
        
        // 생성 날짜순 (오래된순) 정렬인지 확인
        const createdAscSorted = [...otherCategories].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        const isCreatedAscSorted = JSON.stringify(createdAscSorted) === JSON.stringify(otherCategories);
        
        if (isCreatedAscSorted) {
            return 'created-asc';
        }
        
        // 어떤 정렬 방식에도 해당하지 않으면 사용자 정의 순서
        return 'custom';
    };

    const applySort = () => {
        const sortType = sortSelect.value;
        const categories = todoManager.getCategories();
        
        if (sortType === 'custom') {
            // 사용자 정의 순서는 현재 드래그 앤 드롭 순서 유지
            return;
        }
        
        // '일반' 카테고리를 제외한 나머지 카테고리들만 정렬
        const generalCategory = categories.find(cat => cat.name === '일반');
        const otherCategories = categories.filter(cat => cat.name !== '일반');
        
        let sortedCategories;
        
        switch (sortType) {
            case 'name':
                // 이름순 정렬 (가나다순)
                sortedCategories = otherCategories.sort((a, b) => a.name.localeCompare(b.name, 'ko'));
                break;
            case 'created':
                // 생성 날짜순 (최신순)
                sortedCategories = otherCategories.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                break;
            case 'created-asc':
                // 생성 날짜순 (오래된순)
                sortedCategories = otherCategories.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
                break;
            default:
                return;
        }
        
        // '일반' 카테고리를 맨 앞에 추가
        const finalOrder = generalCategory ? [generalCategory, ...sortedCategories] : sortedCategories;
        
        // 카테고리 순서 업데이트
        todoManager.setCategories(finalOrder);
        
        // UI 업데이트
        renderCategoryOrderList();
    };

    const saveCategoryOrder = () => {
        const categories = todoManager.getCategories();
        storage.saveCategories(categories);
        closeCategoryOrderModal();
        render();
    };

    const cancelCategoryOrder = () => {
        // 원래 순서로 복원
        todoManager.setCategories(originalCategoryOrder);
        closeCategoryOrderModal();
    };

    // 반복 정보를 자세히 표시하는 함수
    const getDetailedRepeatInfo = (repeat, todo = null) => {
        if (!repeat) return '';
        
        let info = '';
        
        if (repeat.type === 'daily') {
            if (repeat.interval === 1) {
                info = '매일';
            } else {
                info = `${repeat.interval}일마다`;
            }
        } else if (repeat.type === 'weekly') {
            if (repeat.days && repeat.days.length > 0) {
                const dayNames = ['월', '화', '수', '목', '금', '토', '일'];
                const selectedDays = repeat.days.map(day => dayNames[day - 1]).sort((a, b) => {
                    const order = ['월', '화', '수', '목', '금', '토', '일'];
                    return order.indexOf(a) - order.indexOf(b);
                });
                info = `매주 ${selectedDays.join(', ')}`;
            } else {
                info = '매주';
            }
        } else if (repeat.type === 'monthly') {
            if (repeat.dates && repeat.dates.length > 0) {
                const sortedDates = repeat.dates.sort((a, b) => a - b);
                info = `매월 ${sortedDates.join(', ')}일`;
            } else {
                info = '매월';
            }
        } else if (repeat.type === 'interval') {
            const interval = repeat.interval || 30;
            let intervalText = '';
            if (interval < 60) {
                intervalText = `${interval}분마다`;
            } else if (interval === 60) {
                intervalText = '1시간마다';
            } else {
                const hours = Math.floor(interval / 60);
                const minutes = interval % 60;
                if (minutes === 0) {
                    intervalText = `${hours}시간마다`;
                } else {
                    intervalText = `${hours}시간 ${minutes}분마다`;
                }
            }
            
            if (repeat.limit) {
                // 남은 횟수 계산 (todo가 있는 경우에만)
                if (todo) {
                    // 실제 설정된 알림만 확인
                    const hasStartTime = todo.schedule && todo.schedule.startTime;
                    const hasDueTime = todo.schedule && todo.schedule.dueTime;
                    
                    // 시작 알림과 마감 알림 각각 확인
                    const startCountKey = `${todo.id}-start`;
                    const dueCountKey = `${todo.id}-due`;
                    
                    // notificationScheduler가 초기화되지 않은 경우를 대비한 안전장치
                    let startCount = 0;
                    let dueCount = 0;
                    
                    if (window.notificationScheduler && window.notificationScheduler.getRepeatCount) {
                        startCount = window.notificationScheduler.getRepeatCount(startCountKey) || 0;
                        dueCount = window.notificationScheduler.getRepeatCount(dueCountKey) || 0;
                    } else {
                        // notificationScheduler가 아직 초기화되지 않은 경우, storage에서 직접 로드
                        try {
                            const countsData = storage.getRepeatCounts();
                            if (countsData) {
                                startCount = countsData[startCountKey] || 0;
                                dueCount = countsData[dueCountKey] || 0;
                            }
                        } catch (e) {
                            console.warn('[App] storage에서 반복 횟수 로드 실패:', e);
                        }
                    }
                    
                    const startCompleted = repeat.startCompleted || startCount >= repeat.limit;
                    const dueCompleted = repeat.dueCompleted || dueCount >= repeat.limit;
                    
                    // 설정된 알림이 하나만 있는 경우
                    if (hasStartTime && !hasDueTime) {
                        // 시작 알림만 있는 경우
                        if (startCompleted) {
                            info = `${intervalText} 완료`;
                        } else {
                            info = `${intervalText} ${startCount}/${repeat.limit}`;
                        }
                    } else if (!hasStartTime && hasDueTime) {
                        // 마감 알림만 있는 경우
                        if (dueCompleted) {
                            info = `${intervalText} 완료`;
                        } else {
                            info = `${intervalText} ${dueCount}/${repeat.limit}`;
                        }
                    } else if (hasStartTime && hasDueTime) {
                        // 둘 다 있는 경우
                        if (startCompleted && dueCompleted) {
                            // 둘 다 완료
                            info = `${intervalText} 완료`;
                        } else {
                            // 각각 표시: "시작횟수/제한, 마감횟수/제한"
                            const startDisplay = startCompleted ? '완료' : `${startCount}/${repeat.limit}`;
                            const dueDisplay = dueCompleted ? '완료' : `${dueCount}/${repeat.limit}`;
                            info = `${intervalText} ${startDisplay}, ${dueDisplay}`;
                        }
                    } else {
                        // 알림이 없는 경우
                        info = intervalText;
                    }
                } else {
                    info = `${intervalText} 0/${repeat.limit}`;
                }
            } else {
                info = intervalText;
            }
        }
        
        return info;
    };

    const createTodoElement = (todo) => {
        const todoItem = document.createElement('div');
        todoItem.className = 'todo-item';
        todoItem.dataset.id = todo.id;
        if (todo.completed) todoItem.classList.add('completed');
        
        // 마크다운을 HTML로 변환 (보안 처리 포함)
        let renderedText = todo.text;
        try {
            // marked.js 옵션 설정 - 줄바꿈을 <br>로 변환
            marked.setOptions({
                breaks: true,  // 줄바꿈을 <br> 태그로 변환
                gfm: true      // GitHub Flavored Markdown 지원
            });
            
            // 줄바꿈을 <br>로 변환 (marked.js가 제대로 처리하지 않을 경우를 대비)
            let textWithBreaks = todo.text.replace(/\n/g, '<br>');
            
            // 이미지 사이즈 지정을 위한 커스텀 처리
            // ![alt](url){width=300,height=200} 또는 ![alt](url){width=300 height=200} 형식 지원
            textWithBreaks = textWithBreaks.replace(
                /!\[([^\]]*)\]\(([^)]+)\)\{([^}]+)\}/g,
                (match, alt, src, style) => {
                                const widthMatch = style.match(/width=(\d+)/);
            const heightMatch = style.match(/height=(\d+)/);
            const width = widthMatch ? widthMatch[1] : 'auto';
            const height = heightMatch ? heightMatch[1] : 'auto';
            // HTML img 태그로 직접 변환
            const result = `<img src="${src}" alt="${alt}" style="width:${width}px;height:${height}px;">`;
                    return result;
                }
            );
            
            // marked.js를 사용하여 마크다운을 HTML로 변환
            const rawHtml = marked.parse(textWithBreaks);
            // security.js의 sanitizeHtml을 사용하여 안전하게 처리
            renderedText = security.sanitizeHtml(rawHtml);
        } catch (e) {
            console.warn('마크다운 변환 실패:', e);
            // 변환 실패 시 원본 텍스트 사용 (이스케이프 처리)
            renderedText = security.escapeHtml(todo.text);
        }
        
        todoItem.innerHTML = `
            <input type="checkbox" ${todo.completed ? 'checked' : ''}>
            <button class="schedule-btn icon-btn" title="할 일 편집" ${todo.completed ? 'disabled' : ''}></button>
            <button class="repeat-btn icon-btn" title="반복 설정" ${todo.completed ? 'disabled' : ''}></button>
            <div class="todo-content">
                <div class="todo-main-line">
                    <span class="todo-text">${renderedText}</span>
                </div>
                <div class="todo-meta-line">
                    <span class="category-tag">${security.escapeHtml(todo.category)}</span>
                    ${todo.repeat ? `<span class="recurring-info">(${getDetailedRepeatInfo(todo.repeat, todo)})</span>` : ''}
                    ${todo.completedAt ? `<span class="completed-time-tag">완료: ${new Date(todo.completedAt).toLocaleString('ko-KR')}</span>` : ''}
                </div>
            </div>
            ${renderScheduleInfo(todo)}
            <button class="delete-btn icon-btn" title="삭제"></button>
        `;
        
        // 아이콘 설정
        const scheduleBtn = todoItem.querySelector('.schedule-btn');
        const repeatBtn = todoItem.querySelector('.repeat-btn');
        const deleteBtn = todoItem.querySelector('.delete-btn');
        
        icons.setButtonIcon(scheduleBtn, 'calendar', '할 일 편집', 16);
        icons.setButtonIcon(repeatBtn, 'repeat', '반복 설정', 16);
        icons.setButtonIcon(deleteBtn, 'trash', '삭제', 16);
        
        // 완료된 할 일이면 버튼 비활성화
        if (todo.completed) {
            scheduleBtn.style.opacity = '0.3';
            scheduleBtn.style.cursor = 'not-allowed';
            repeatBtn.style.opacity = '0.3';
            repeatBtn.style.cursor = 'not-allowed';
        }
        
        // 반복 아이콘 클릭 이벤트
        repeatBtn.onclick = (e) => {
            e.stopPropagation();
            if (todo.completed) {
                alert('완료된 할 일은 반복 설정을 변경할 수 없습니다.');
                return;
            }
            openRepeatModal(todo.id);
        };
        
        return todoItem;
    };



    // 할일 정렬 함수
    const sortTodos = (todos) => {
        const sortOrder = settings.todoSortOrder || 'created-desc';
        
        switch (sortOrder) {
            case 'created-desc':
                return [...todos].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            case 'created-asc':
                return [...todos].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            case 'text-asc':
                return [...todos].sort((a, b) => a.text.localeCompare(b.text, 'ko'));
            case 'text-desc':
                return [...todos].sort((a, b) => b.text.localeCompare(a.text, 'ko'));
            case 'completed-asc':
                return [...todos].sort((a, b) => {
                    if (a.completed === b.completed) {
                        return new Date(b.createdAt) - new Date(a.createdAt);
                    }
                    return a.completed ? 1 : -1;
                });
            case 'completed-desc':
                return [...todos].sort((a, b) => {
                    if (a.completed === b.completed) {
                        return new Date(b.createdAt) - new Date(a.createdAt);
                    }
                    return a.completed ? -1 : 1;
                });
            case 'start-time-asc':
                return [...todos].sort((a, b) => {
                    const aTime = a.schedule?.startTime ? new Date(a.schedule.startTime) : new Date(9999, 11, 31);
                    const bTime = b.schedule?.startTime ? new Date(b.schedule.startTime) : new Date(9999, 11, 31);
                    if (aTime.getTime() === bTime.getTime()) {
                        return new Date(b.createdAt) - new Date(a.createdAt);
                    }
                    return aTime.getTime() - bTime.getTime();
                });
            case 'start-time-desc':
                return [...todos].sort((a, b) => {
                    const aTime = a.schedule?.startTime ? new Date(a.schedule.startTime) : new Date(9999, 11, 31);
                    const bTime = b.schedule?.startTime ? new Date(b.schedule.startTime) : new Date(9999, 11, 31);
                    if (aTime.getTime() === bTime.getTime()) {
                        return new Date(b.createdAt) - new Date(a.createdAt);
                    }
                    return bTime.getTime() - aTime.getTime();
                });
            case 'due-time-asc':
                return [...todos].sort((a, b) => {
                    const aTime = a.schedule?.dueTime ? new Date(a.schedule.dueTime) : new Date(9999, 11, 31);
                    const bTime = b.schedule?.dueTime ? new Date(b.schedule.dueTime) : new Date(9999, 11, 31);
                    if (aTime.getTime() === bTime.getTime()) {
                        return new Date(b.createdAt) - new Date(a.createdAt);
                    }
                    return aTime.getTime() - bTime.getTime();
                });
            case 'due-time-desc':
                return [...todos].sort((a, b) => {
                    const aTime = a.schedule?.dueTime ? new Date(a.schedule.dueTime) : new Date(9999, 11, 31);
                    const bTime = b.schedule?.dueTime ? new Date(b.schedule.dueTime) : new Date(9999, 11, 31);
                    if (aTime.getTime() === bTime.getTime()) {
                        return new Date(b.createdAt) - new Date(a.createdAt);
                    }
                    return bTime.getTime() - aTime.getTime();
                });
            default:
                return [...todos].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }
    };

    const renderProjectView = (todos) => {
        const categories = todoManager.getCategories();
        const groupedTodos = todos.reduce((acc, todo) => {
            const category = todo.category || '일반';
            if (!acc[category]) acc[category] = [];
            acc[category].push(todo);
            return acc;
        }, {});
        
        // 카테고리 순서에 따라 정렬
        categories.forEach(cat => {
            const categoryName = cat.name;
            if (groupedTodos[categoryName]) {
                const groupContainer = document.createElement('div');
                groupContainer.className = 'project-group';
                
                // 카테고리 헤더 (기존 스타일 유지)
                const categoryHeader = document.createElement('div');
                categoryHeader.className = 'category-header';
                
                const categoryTitle = document.createElement('h3');
                categoryTitle.className = 'project-title';
                categoryTitle.textContent = categoryName;
                
                // 접기/펼치기 버튼 추가
                const toggleBtn = document.createElement('button');
                toggleBtn.className = 'category-toggle-btn';
                toggleBtn.innerHTML = `
                    <svg class="toggle-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="6,9 12,15 18,9"></polyline>
                    </svg>
                `;
                toggleBtn.title = '접기/펼치기';
                
                // 카테고리 접기 상태 확인
                const isCollapsed = settings.collapsedCategories && settings.collapsedCategories[categoryName];
                if (isCollapsed) {
                    groupContainer.classList.add('collapsed');
                    toggleBtn.classList.add('collapsed');
                }
                
                // 버튼 클릭 이벤트
                toggleBtn.addEventListener('click', () => handleCategoryToggle(categoryName));
                
                categoryHeader.appendChild(categoryTitle);
                categoryHeader.appendChild(toggleBtn);
                groupContainer.appendChild(categoryHeader);
                
                // 할일 목록 컨테이너
                const todosContainer = document.createElement('div');
                todosContainer.className = 'category-todos';
                
                // 각 카테고리 내에서 할일들을 설정된 정렬 순서로 정렬
                const sortedTodos = sortTodos(groupedTodos[categoryName]);
                
                sortedTodos.forEach(todo => todosContainer.appendChild(createTodoElement(todo)));
                groupContainer.appendChild(todosContainer);
                
                todoListContainer.appendChild(groupContainer);
            }
        });
    };

    const renderAllView = (todos) => {
        const sortedTodos = sortTodos(todos);
        sortedTodos.forEach(todo => todoListContainer.appendChild(createTodoElement(todo)));
    };



    // EVENT HANDLERS
    const handleAddTodo = () => {
        const text = todoInput.value;
        if (!text.trim()) return alert('할 일 내용을 입력해주세요.');
        todoManager.addTodo(text, selectedCategoryId);
        todoInput.value = '';
        render();
    };

    const handleCategorySelect = (event) => {
        if (event.target.tagName === 'BUTTON') {
            selectedCategoryId = event.target.dataset.id;
            renderCategorySelector();
            
            // 자동 스크롤 설정이 활성화된 경우 해당 카테고리로 스크롤
            if (settings.autoScrollToCategory && currentView === 'project') {
                setTimeout(() => {
                    const categoryName = event.target.textContent.trim();
                    const categoryGroup = Array.from(document.querySelectorAll('.project-group')).find(group => {
                        const title = group.querySelector('.project-title');
                        return title && title.textContent === categoryName;
                    });
                    
                    if (categoryGroup) {
                        // 부드러운 스크롤로 해당 위치로 이동 (접힌 상태 유지)
                        categoryGroup.scrollIntoView({ 
                            behavior: 'smooth', 
                            block: 'start',
                            inline: 'nearest'
                        });
                    }
                }, 100); // 렌더링 완료 후 스크롤
            }
        }
    };
    
    const handleListClick = (event) => {
        const target = event.target;
        const todoItem = target.closest('.todo-item');
        if (!todoItem) return;
        const id = Number(todoItem.dataset.id);
        
        if (target.type === 'checkbox') {
            // 완료된 반복 할 일인지 확인
            const completedRepeatTodos = todoManager.getCompletedRepeatTodos();
            const isCompletedRepeat = completedRepeatTodos.some(todo => todo.id === id);
            
            if (isCompletedRepeat) {
                // 완료된 반복 할 일이면 체크 해제 불가 (삭제만 가능)
                return;
            } else {
                // 일반 할 일이면 토글 가능
                todoManager.toggleTodoStatus(id);
                renderTodos();
            }
        } else if (target.classList.contains('delete-btn') || target.closest('.delete-btn')) {
            if (confirm('정말로 이 할 일을 삭제하시겠습니까?')) {
                // 완료된 반복 할 일인지 확인
                const completedRepeatTodos = todoManager.getCompletedRepeatTodos();
                const isCompletedRepeat = completedRepeatTodos.some(todo => todo.id === id);
                
                if (isCompletedRepeat) {
                    todoManager.deleteCompletedRepeatTodo(id);
                } else {
                    todoManager.deleteTodo(id);
                }
                renderTodos();
            }
        } else if (target.classList.contains('schedule-btn') || target.closest('.schedule-btn')) {
            // 완료된 할 일인지 확인
            const allTodos = todoManager.getTodos();
            const todo = allTodos.find(t => t.id === id);
            if (todo && todo.completed) {
                alert('완료된 할 일은 일정을 변경할 수 없습니다.');
                return;
            }
            openScheduleModal(id);
        } else if (target.classList.contains('schedule-icon-clickable') || target.closest('.schedule-icon-clickable')) {
            event.preventDefault(); // 기본 동작 방지
            event.stopPropagation(); // 이벤트 버블링 방지
            
            const clickableElement = target.classList.contains('schedule-icon-clickable') ? 
                target : target.closest('.schedule-icon-clickable');
            
            if (!clickableElement) return;
            
            const type = clickableElement.dataset.type;
            const todoId = Number(clickableElement.dataset.todoId);
            
            if (!type || !todoId) return;
            

            toggleScheduleSetting(todoId, type);
        } else if (target.classList.contains('repeat-btn') || target.closest('.repeat-btn')) {
            openRepeatModal(id);
        }
    };
    
    // 더블클릭으로 텍스트 수정 기능 제거 (일정 설정 모달에서 통합 관리)

    // 일정 설정 모달 관련 함수들
    const openScheduleModal = (todoId) => {
        const todo = todoManager.getTodos().find(t => t.id === todoId);
        if (!todo) return;

        currentEditingTodoId = todoId;
        
        // 텍스트와 카테고리 편집 필드 설정
        editTodoText.value = todo.text;
        
        // 카테고리 선택 드롭다운 설정
        const categories = todoManager.getCategories();
        editTodoCategory.innerHTML = '';
        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.id;
            option.textContent = cat.name;
            option.selected = cat.name === todo.category;
            editTodoCategory.appendChild(option);
        });

        // 기존 일정 데이터 로드
        const schedule = todo.schedule;
        
        if (schedule && schedule.startTime) {
            startTimeEnabled.checked = true;
            const startDateTime = new Date(schedule.startTime);

            // toLocaleDateString과 toLocaleTimeString을 사용하여 로컬 시간대 기반의 정확한 문자열 포맷팅
            const formattedStartDate = startDateTime.toLocaleDateString('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' });
            const formattedStartTime = startDateTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
            
            console.log(`[App] 로드된 시작 시간: ${startDateTime.toISOString()} -> 표시: ${formattedStartDate} ${formattedStartTime}`); // 디버그 로그 추가

            startDate.value = formattedStartDate;
            startTime.value = formattedStartTime;

            startModalBtn.dataset.enabled = schedule.startModal !== false ? 'true' : 'false';
            startNotificationBtn.dataset.enabled = schedule.startNotification ? 'true' : 'false';
            startTimeInputs.classList.add('enabled');
        } else {
            startTimeEnabled.checked = false;
            startDate.value = '';
            startTime.value = '';
            startModalBtn.dataset.enabled = 'true';
            startNotificationBtn.dataset.enabled = 'true';
            startTimeInputs.classList.remove('enabled');
        }

        if (schedule && schedule.dueTime) {
            dueTimeEnabled.checked = true;
            const dueDateTime = new Date(schedule.dueTime);

            // toLocaleDateString과 toLocaleTimeString을 사용하여 로컬 시간대 기반의 정확한 문자열 포맷팅
            const formattedDueDate = dueDateTime.toLocaleDateString('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' });
            const formattedDueTime = dueDateTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

            console.log(`[App] 로드된 마감 시간: ${dueDateTime.toISOString()} -> 표시: ${formattedDueDate} ${formattedDueTime}`); // 디버그 로그 추가

            dueDate.value = formattedDueDate;
            dueTime.value = formattedDueTime;

            dueModalBtn.dataset.enabled = schedule.dueModal !== false ? 'true' : 'false';
            dueNotificationBtn.dataset.enabled = schedule.dueNotification ? 'true' : 'false';
            dueTimeInputs.classList.add('enabled');
        } else {
            dueTimeEnabled.checked = false;
            dueDate.value = '';
            dueTime.value = '';
            dueModalBtn.dataset.enabled = 'true';
            dueNotificationBtn.dataset.enabled = 'true';
            dueTimeInputs.classList.remove('enabled');
        }

        updateNotificationButtons();
        scheduleModal.style.display = 'flex';
    };

    const closeScheduleModal = () => {
        scheduleModal.style.display = 'none';
        currentEditingTodoId = null;
    };

    const updateNotificationButtons = () => {
        // 시작 모달 버튼 아이콘 설정
        if (startModalBtn.dataset.enabled === 'true') {
            icons.setButtonIcon(startModalBtn, 'bell', '모달 끄기', 16);
        } else {
            icons.setButtonIcon(startModalBtn, 'bellOff', '모달 켜기', 16);
        }

        // 시작 알림 버튼 아이콘 설정
        if (startNotificationBtn.dataset.enabled === 'true') {
            icons.setButtonIcon(startNotificationBtn, 'volume', '소리 끄기', 16);
        } else {
            icons.setButtonIcon(startNotificationBtn, 'volumeX', '소리 켜기', 16);
        }

        // 마감 모달 버튼 아이콘 설정
        if (dueModalBtn.dataset.enabled === 'true') {
            icons.setButtonIcon(dueModalBtn, 'bell', '모달 끄기', 16);
        } else {
            icons.setButtonIcon(dueModalBtn, 'bellOff', '모달 켜기', 16);
        }

        // 마감 알림 버튼 아이콘 설정
        if (dueNotificationBtn.dataset.enabled === 'true') {
            icons.setButtonIcon(dueNotificationBtn, 'volume', '소리 끄기', 16);
        } else {
            icons.setButtonIcon(dueNotificationBtn, 'volumeX', '소리 켜기', 16);
        }
    };

    const saveSchedule = () => {
        if (currentEditingTodoId === null) return;

        console.log('=== saveSchedule 시작 ===');
        console.log('현재 편집 중인 할 일 ID:', currentEditingTodoId);

        // 텍스트와 카테고리 변경사항 저장
        const newText = editTodoText.value.trim();
        const selectedCategoryId = editTodoCategory.value;
        const selectedCategory = todoManager.getCategories().find(c => c.id === selectedCategoryId);
        
        console.log('텍스트:', newText);
        console.log('선택된 카테고리:', selectedCategory?.name);
        
        if (newText) {
            todoManager.updateTodoText(currentEditingTodoId, newText);
            if (selectedCategory) {
                todoManager.updateTodoCategory(currentEditingTodoId, selectedCategory.name);
            }
        }

        // 일정 데이터 처리
        const scheduleData = {};

        // 시작 시간 처리
        console.log('=== 시작 시간 처리 ===');
        console.log('startTimeEnabled.checked:', startTimeEnabled.checked);
        console.log('startDate.value:', startDate.value);
        console.log('startTime.value:', startTime.value);
        
        if (startTimeEnabled.checked && startDate.value && startTime.value) {
            // 로컬 날짜/시간을 Date 객체로 변환하여 전달
            scheduleData.startTime = new Date(`${startDate.value}T${startTime.value}:00`);
            scheduleData.startModal = startModalBtn.dataset.enabled === 'true';
            scheduleData.startNotification = startNotificationBtn.dataset.enabled === 'true';
            console.log('시작 시간 설정됨:', scheduleData.startTime);
        } else {
            scheduleData.startTime = null;
            scheduleData.startModal = true;
            scheduleData.startNotification = true;
            console.log('시작 시간 설정 안됨 (null)');
        }

        // 마감 시간 처리
        console.log('=== 마감 시간 처리 ===');
        console.log('dueTimeEnabled.checked:', dueTimeEnabled.checked);
        console.log('dueDate.value:', dueDate.value);
        console.log('dueTime.value:', dueTime.value);
        
        if (dueTimeEnabled.checked && dueDate.value && dueTime.value) {
            // 로컬 날짜/시간을 Date 객체로 변환하여 전달
            scheduleData.dueTime = new Date(`${dueDate.value}T${dueTime.value}:00`);
            scheduleData.dueModal = dueModalBtn.dataset.enabled === 'true';
            scheduleData.dueNotification = dueNotificationBtn.dataset.enabled === 'true';
            console.log('마감 시간 설정됨:', scheduleData.dueTime);
        } else {
            scheduleData.dueTime = null;
            scheduleData.dueModal = true;
            scheduleData.dueNotification = true;
            console.log('마감 시간 설정 안됨 (null)');
        }

        console.log('최종 scheduleData:', scheduleData);

        // 시간 검증: 마감시간이 시작시간보다 빠르지 않도록 확인
        if (scheduleData.startTime && scheduleData.dueTime) {
            if (scheduleData.dueTime <= scheduleData.startTime) {
                alert('마감시간은 시작시간보다 늦어야 합니다.');
                return; // 저장 중단
            }
        }

        todoManager.updateTodoSchedule(currentEditingTodoId, scheduleData);
        
        // 일정 변경 시 알림 스케줄러 재초기화
        if (window.notificationScheduler) {
            console.log('[App] 일정 변경 - 알림 스케줄러 재초기화');
            window.notificationScheduler.rescheduleAllNotifications(todoManager.getTodos());
        }
        
        closeScheduleModal();
        render();
        
        // 일정 변경 후 즉시 UI 업데이트
        console.log('[App] 일정 변경 후 즉시 UI 업데이트');
        renderTodos();
        
        console.log('=== saveSchedule 완료 ===');
    };

    // 일정 설정 토글 함수
    const toggleScheduleSetting = (todoId, type) => {
        const todo = todoManager.getTodos().find(t => t.id === todoId);
        if (!todo || !todo.schedule) return;

        const scheduleData = { ...todo.schedule };

        switch (type) {
            case 'start-modal':
                scheduleData.startModal = !scheduleData.startModal;
                break;
            case 'start-sound':
                scheduleData.startNotification = !scheduleData.startNotification;
                break;
            case 'due-modal':
                scheduleData.dueModal = !scheduleData.dueModal;
                break;
            case 'due-sound':
                scheduleData.dueNotification = !scheduleData.dueNotification;
                break;
            default:
                return;
        }

        todoManager.updateTodoSchedule(todoId, scheduleData);
        
        // 알림 설정 변경 시 알림 스케줄러 재초기화
        if (window.notificationScheduler) {
            console.log('[App] 알림 설정 변경 - 알림 스케줄러 재초기화');
            window.notificationScheduler.rescheduleAllNotifications(todoManager.getTodos());
        }
        
        render();
        
        // 알림 설정 변경 후 즉시 UI 업데이트
        console.log('[App] 알림 설정 변경 후 즉시 UI 업데이트');
        renderTodos();
    };

    // 설정 토글 이벤트 핸들러
    const handleShowCompletedToggle = () => {
        const showCompletedToggle = document.getElementById('show-completed-toggle');
        if (showCompletedToggle) {
            settings.showCompleted = showCompletedToggle.checked;
            storage.saveSettings(settings);
            renderTodos(); // 즉시 반영
        }
    };

    // 할일 정렬 변경 이벤트 핸들러
    const handleTodoSortChange = () => {
        const sortSelect = document.getElementById('todo-sort-select');
        if (sortSelect) {
            settings.todoSortOrder = sortSelect.value;
            storage.saveSettings(settings);
            renderTodos(); // 즉시 반영
        }
    };

    // 자동 스크롤 토글 이벤트 핸들러
    const handleAutoScrollToggle = () => {
        const autoScrollToggle = document.getElementById('auto-scroll-toggle');
        if (autoScrollToggle) {
            settings.autoScrollToCategory = autoScrollToggle.checked;
            storage.saveSettings(settings);
        }
    };

    // 전체 데이터 초기화 핸들러
    const handleResetAllData = async () => {
        const confirmMessage = `⚠️ 정말로 모든 데이터를 초기화하시겠습니까?\n\n` +
            `이 작업은 다음을 모두 삭제합니다:\n` +
            `• 모든 할일 목록\n` +
            `• 모든 카테고리\n` +
            `• 모든 설정\n` +
            `• 모든 알림 설정\n` +
            `• 반복 설정 및 기록\n\n` +
            `이 작업은 되돌릴 수 없습니다.`;
        
        if (confirm(confirmMessage)) {
            // 모든 데이터 초기화
            todoManager.clearAllData();
            storage.clearAllData();
            notificationScheduler.clearAllNotifications();
            
            // 설정 초기화
            settings = { showCompleted: true, todoSortOrder: 'created-desc', collapsedCategories: {}, autoScrollToCategory: true, notificationApiEnabled: false, aiFeatureEnabled: false, aiApiKey: '' };
            storage.saveSettings(settings);
            
            // AI 기능 상태도 초기화 (비활성화)
            storage.saveAiFeatureEnabled(false);
            
            // Notification API 상태도 초기화 (비활성화)
            storage.saveNotificationApiEnabled(false);
            
            // AI API 키도 초기화 (삭제)
            storage.clearAiApiKey();
            console.log('[App] 데이터 초기화: API 키 삭제됨');
            
            // AI 모듈에서도 API 키 초기화
            if (window.aiChat && window.aiChat.clearApiKey) {
                await window.aiChat.clearApiKey();
                console.log('[App] 설정 초기화: aiChat API 키 초기화됨');
            }
            if (window.geminiApi && window.geminiApi.clearApiKey) {
                await window.geminiApi.clearApiKey();
                console.log('[App] 설정 초기화: geminiApi API 키 초기화됨');
            }
            
            // Google Drive 로그인 상태 초기화
            if (window.googleDriveSync && window.googleDriveSync.signOut) {
                try {
                    await window.googleDriveSync.signOut();
                    console.log('[App] 데이터 초기화: Google Drive 로그아웃 완료');
                } catch (error) {
                    console.warn('[App] 데이터 초기화: Google Drive 로그아웃 실패:', error);
                }
            }
            // Google Drive 관련 localStorage 데이터도 제거
            try {
                localStorage.removeItem('mwohaji-gdrive-token');
                localStorage.removeItem('mwohaji-autoSyncEnabled');
                localStorage.removeItem('mwohaji-lastSyncTime');
                localStorage.removeItem('mwohaji-deletedItemIds');
                console.log('[App] 데이터 초기화: Google Drive 관련 데이터 제거 완료');
            } catch (error) {
                console.warn('[App] 데이터 초기화: Google Drive 데이터 제거 실패:', error);
            }
            
            // UI 새로고침
            render();
            
            // UI 토글들 즉시 업데이트 (설정 사이드바가 열려있는 경우)
            const dataResetAiToggle = document.getElementById('ai-feature-toggle');
            const dataResetNotificationToggle = document.getElementById('notification-api-toggle');
            const dataResetApiKeyInput = document.getElementById('ai-api-key-input');
            
            if (dataResetAiToggle) {
                dataResetAiToggle.checked = false;
                console.log('[App] 데이터 초기화: AI 기능 토글 OFF');
            }
            if (dataResetNotificationToggle) {
                dataResetNotificationToggle.checked = false;
                console.log('[App] 데이터 초기화: 백그라운드 알림 토글 OFF');
            }
            if (dataResetApiKeyInput) {
                dataResetApiKeyInput.value = '';
                dataResetApiKeyInput.type = 'text';
                console.log('[App] 데이터 초기화: API 키 입력 필드 초기화');
            }
            
            // Google Drive UI 업데이트
            if (window.updateGoogleDriveUI) {
                setTimeout(() => {
                    window.updateGoogleDriveUI();
                    console.log('[App] 데이터 초기화: Google Drive UI 업데이트 완료');
                }, 100);
            }
            
            // 알림 권한 상태 즉시 업데이트
            setTimeout(() => {
                updateNotificationPermissionStatus();
                console.log('[App] 데이터 초기화: 알림 권한 상태 업데이트 완료');
            }, 150);
            
            // 설정 사이드바가 열려있다면 완전히 다시 생성하여 UI 업데이트
            if (settingsSidebar.classList.contains('open')) {
                closeSettingsSidebarFn();
                setTimeout(() => {
                    openSettingsSidebar();
                    // 사이드바가 다시 열린 후 알림 권한 상태 업데이트
                    setTimeout(() => {
                        updateNotificationPermissionStatus();
                    }, 200);
                }, 100);
            }
            
            alert('모든 데이터가 초기화되었습니다.');
        }
    };

    // 카테고리 접기/펼치기 핸들러
    const handleCategoryToggle = (categoryName) => {
        if (!settings.collapsedCategories) {
            settings.collapsedCategories = {};
        }
        
        settings.collapsedCategories[categoryName] = !settings.collapsedCategories[categoryName];
        storage.saveSettings(settings);
        renderTodos(); // 즉시 반영
    };

    // 설정만 초기화 핸들러
    const handleResetSettings = async () => {
        const confirmMessage = `설정만 초기화하시겠습니까?\n\n` +
            `다음 설정이 기본값으로 초기화됩니다:\n` +
            `• 완료된 할일 표시 여부\n` +
            `• 할일 정렬 순서\n` +
            `• 카테고리 접기 상태\n` +
            `• 카테고리 자동 스크롤\n` +
            `• AI 기능 활성화 상태\n` +
            `• 백그라운드 알림 (Notification API) 사용 여부\n` +
            `• AI API 키\n\n` +
            `할일 데이터는 그대로 유지됩니다.`;
        
        if (confirm(confirmMessage)) {
            // 설정만 초기화
            settings = { showCompleted: true, todoSortOrder: 'created-desc', collapsedCategories: {}, autoScrollToCategory: true, notificationApiEnabled: false, aiFeatureEnabled: false, aiApiKey: '' };
            storage.saveSettings(settings);
            
            // AI 기능 상태도 초기화 (비활성화)
            storage.saveAiFeatureEnabled(false);
            
            // Notification API 상태도 초기화 (비활성화)
            storage.saveNotificationApiEnabled(false);
            
            // AI API 키도 초기화 (삭제)
            storage.clearAiApiKey();
            console.log('[App] 설정 초기화: API 키 삭제됨');
            
            // AI 모듈에서도 API 키 초기화
            if (window.aiChat && window.aiChat.clearApiKey) {
                await window.aiChat.clearApiKey();
                console.log('[App] 설정 초기화: aiChat API 키 초기화됨');
            }
            if (window.geminiApi && window.geminiApi.clearApiKey) {
                await window.geminiApi.clearApiKey();
                console.log('[App] 설정 초기화: geminiApi API 키 초기화됨');
            }
            
            // UI 업데이트 (동적으로 생성되는 요소들은 나중에 업데이트됨)
            const aiChatToggleBtn = document.getElementById('ai-chat-toggle-btn');
            
            if (aiChatToggleBtn) {
                aiChatToggleBtn.style.setProperty('display', 'none', 'important');
                console.log('[App] 설정 초기화: AI 채팅 버튼 강제 숨김');
            }
            
            // 알림 스케줄러 설정 업데이트
            if (window.notificationScheduler) {
                window.notificationScheduler.setUseServiceWorker(false);
                console.log('[App] 설정 초기화: Notification API 비활성화');
            }
            
            // UI 토글들 즉시 업데이트 (설정 사이드바가 열려있는 경우)
            const settingsResetAiToggle = document.getElementById('ai-feature-toggle');
            const settingsResetNotificationToggle = document.getElementById('notification-api-toggle');
            const settingsResetApiKeyInput = document.getElementById('ai-api-key-input');
            
            if (settingsResetAiToggle) {
                settingsResetAiToggle.checked = false;
                console.log('[App] 설정 초기화: AI 기능 토글 OFF');
            }
            if (settingsResetNotificationToggle) {
                settingsResetNotificationToggle.checked = false;
                console.log('[App] 설정 초기화: 백그라운드 알림 토글 OFF');
            }
            if (settingsResetApiKeyInput) {
                settingsResetApiKeyInput.value = '';
                settingsResetApiKeyInput.type = 'text';
                console.log('[App] 설정 초기화: API 키 입력 필드 초기화');
            }
            
            // 알림 권한 상태 즉시 업데이트
            setTimeout(() => {
                updateNotificationPermissionStatus();
                console.log('[App] 설정 초기화: 알림 권한 상태 업데이트 완료');
            }, 100);
            
            // 설정 사이드바가 열려있다면 다시 열어서 UI 업데이트
            if (settingsSidebar.classList.contains('open')) {
                // 설정 사이드바를 완전히 다시 생성하여 UI 업데이트
                closeSettingsSidebarFn();
                setTimeout(() => {
                    openSettingsSidebar();
                    // 사이드바가 다시 열린 후 알림 권한 상태 업데이트
                    setTimeout(() => {
                        updateNotificationPermissionStatus();
                    }, 200);
                }, 100);
            }
            

            
            renderTodos();
            
            alert('설정이 기본값으로 초기화되었습니다.');
        }
    };

    // 사용자 인터랙션 추적
    let hasUserInteracted = false;
    
    // 사용자 인터랙션 감지
    const trackUserInteraction = () => {
        if (!hasUserInteracted) {
            hasUserInteracted = true;
            console.log('[App] 사용자 인터랙션 감지됨 - 소리 상태 업데이트');
            // 500ms 후에 업데이트 (중복 방지)
            setTimeout(() => updateAudioStatus(), 500);
        }
    };
    
    // 사용자 인터랙션 이벤트 리스너
    ['click', 'touchstart', 'keydown'].forEach(eventType => {
        document.addEventListener(eventType, trackUserInteraction, { once: true });
    });

    // 소리 상태 확인 함수
    const checkAudioStatus = async () => {
        // 사용자 인터랙션이 없으면 무조건 suspended
        if (!hasUserInteracted) {
            console.log('[App] 사용자 인터랙션 없음 - suspended 상태');
            return 'suspended';
        }
        
        try {
            // 실제 오디오 파일로 재생 가능한지 테스트 (정상 볼륨)
            const testAudio = new Audio('assets/sounds/notification.wav');
            testAudio.volume = 0.0; // 볼륨 0으로 테스트
            
            // 실제 재생 여부를 확인하기 위한 Promise
            const actualPlayPromise = new Promise((resolve, reject) => {
                let hasPlayed = false;
                let hasTimeUpdate = false;
                
                // 재생 시작 이벤트
                testAudio.addEventListener('playing', () => {
                    console.log('[App] 실제 재생 시작됨');
                    hasPlayed = true;
                    checkCompletion();
                }, { once: true });
                
                // 시간 진행 이벤트 (실제 재생 확인)
                testAudio.addEventListener('timeupdate', () => {
                    if (testAudio.currentTime > 0) {
                        console.log('[App] 실제 재생 중 (시간 진행)');
                        hasTimeUpdate = true;
                        checkCompletion();
                    }
                }, { once: true });
                
                // 오류 이벤트
                testAudio.addEventListener('error', (e) => {
                    console.log('[App] 오디오 재생 오류:', e);
                    reject(new Error('audio_error'));
                }, { once: true });
                
                // 완료 확인 함수
                const checkCompletion = () => {
                    if (hasPlayed && hasTimeUpdate) {
                        resolve('actually_playing');
                    } else if (hasPlayed) {
                        // playing 이벤트는 있지만 시간 진행이 없으면 500ms 더 기다림
                        setTimeout(() => {
                            if (hasTimeUpdate) {
                                resolve('actually_playing');
                            } else {
                                resolve('playing_but_no_progress');
                            }
                        }, 500);
                    }
                };
                
                // 2초 타임아웃
                setTimeout(() => {
                    if (!hasPlayed && !hasTimeUpdate) {
                        reject(new Error('timeout'));
                    }
                }, 2000);
            });
            
            // play() Promise를 먼저 기다림
            const playPromise = testAudio.play();
            await playPromise;
            
            // 실제 재생 확인
            const playResult = await actualPlayPromise;
            
            // 테스트 완료 후 정리
            testAudio.pause();
            testAudio.currentTime = 0;
            
            if (playResult === 'actually_playing') {
                console.log('[App] 소리 재생 테스트 성공 (실제 재생 확인됨)');
                return 'ready';
            } else {
                console.log('[App] 소리 재생 시작되었지만 진행되지 않음');
                return 'not-ready';
            }
        } catch (error) {
            console.log('[App] 소리 재생 테스트 실패:', error.name, error.message);
            
            // 브라우저 자동재생 정책 관련 에러들
            if (error.name === 'NotAllowedError' || 
                error.message.includes('user activation') ||
                error.message.includes('autoplay') ||
                error.message.includes('gesture')) {
                return 'suspended'; // 브라우저 정책으로 차단됨
            } else if (error.name === 'NotSupportedError' || 
                       error.name === 'AbortError' ||
                       error.message.includes('fetch') ||
                       error.message.includes('load')) {
                return 'not-ready'; // 파일 없음 또는 로드 실패
            } else {
                return 'suspended'; // 기타 권한 관련 오류
            }
        }
    };

    // 소리 상태 업데이트 함수
    const updateAudioStatus = async () => {
        if (!audioStatusBtn) {
            console.error('[App] audioStatusBtn을 찾을 수 없습니다');
            return;
        }
        
        try {
            const status = await checkAudioStatus();
            const statusText = {
                'ready': '소리 재생 가능',
                'suspended': '소리 권한 필요',
                'not-ready': '소리 초기화 중'
            }[status] || '소리 상태 확인 중';
            
            // 기존 클래스 제거
            audioStatusBtn.classList.remove('ready', 'suspended', 'not-ready', 'testing');
            // 새 클래스 추가
            audioStatusBtn.classList.add(status);
            
            // 아이콘 설정 (상태별 정확한 아이콘)
            let iconName = 'volume';
            if (status === 'suspended' || status === 'not-ready') {
                iconName = 'volumeX'; // 재생 불가능한 모든 상태에서 X 아이콘
            }
            
            console.log('[App] 소리 상태 업데이트:', status, iconName);
            icons.setButtonIcon(audioStatusBtn, iconName, statusText, 18);
        } catch (error) {
            console.error('[App] 소리 상태 업데이트 실패:', error);
        }
    };

    // 소리 상태 버튼 클릭 핸들러 (소리 재생)
    const handleAudioStatusClick = async () => {
        if (!audioStatusBtn) return;
        
        // 테스트 중 상태로 변경
        audioStatusBtn.classList.remove('ready', 'suspended', 'not-ready');
        audioStatusBtn.classList.add('testing');
        icons.setButtonIcon(audioStatusBtn, 'volume', '소리 상태 확인 중...', 18);
        
        try {
            const status = await checkAudioStatus();
            
            if (status === 'ready') {
                // Notification API 설정에 따라 다른 방식으로 소리 테스트
                const useNotificationApi = storage.getNotificationApiEnabled();
                
                if (useNotificationApi && window.serviceWorkerManager && window.serviceWorkerManager.hasPermission()) {
                    // Notification API 사용: Service Worker를 통해 테스트
                    console.log('[App] Notification API를 통한 소리 테스트');
                    const testTime = new Date(Date.now() + 500); // 0.5초 후
                    window.serviceWorkerManager.scheduleNotification(
                        'sound-test-123',
                        'test',
                        '소리 테스트',
                        '소리가 재생됩니다.',
                        testTime.toISOString(),
                        true // 소리 포함
                    );
                } else {
                    // Notification API 미사용: 직접 소리 재생
                    console.log('[App] 직접 소리 테스트');
                    if (window.notificationScheduler) {
                        // 소리 재생
                        window.notificationScheduler.playNotificationSound();
                        // 알림 모달 표시
                        window.notificationScheduler.showNotificationModal('소리 테스트', '소리가 재생됩니다.');
                    }
                }
                
                audioStatusBtn.classList.remove('testing');
                audioStatusBtn.classList.add(status);
                icons.setButtonIcon(audioStatusBtn, 'volume', '소리 재생 중...', 18);
                
                // 2초 후 다시 업데이트
                setTimeout(() => {
                    updateAudioStatus();
                }, 2000);
            } else {
                audioStatusBtn.classList.remove('testing');
                audioStatusBtn.classList.add(status);
                icons.setButtonIcon(audioStatusBtn, 'volumeX', '소리 권한 필요', 18);
                
                setTimeout(() => {
                    updateAudioStatus();
                }, 2000);
            }
        } catch (error) {
            console.error('[App] 소리 상태 확인 실패:', error);
            updateAudioStatus();
        }
    };

    // AI 기능 토글 이벤트 핸들러
    const handleAiFeatureToggle = async () => {
        const aiChatToggleBtn = document.getElementById('ai-chat-toggle-btn');
        const aiFeatureToggle = document.getElementById('ai-feature-toggle');
        
        if (aiFeatureToggle) {
            const isEnabled = aiFeatureToggle.checked;
            
            // AI 기능을 활성화하려고 할 때 API 키가 있는지 확인
            if (isEnabled) {
                const apiKey = storage.getAiApiKey();
                if (!apiKey) {
                    alert('AI 기능을 사용하려면 API 키를 먼저 입력해주세요.');
                    aiFeatureToggle.checked = false;
                    return;
                }
            }
            
            // 두 저장소에 모두 저장하여 동기화
            storage.saveAiFeatureEnabled(isEnabled);
            settings.aiFeatureEnabled = isEnabled;
            storage.saveSettings(settings);
            
            // AI 채팅 버튼 표시/숨김 (데스크톱에서만), 모바일은 CSS 규칙 유지 + 액션시트 리렌더
            if (aiChatToggleBtn) {
                const isMobile = window.innerWidth <= 980;
                if (isMobile) {
                    aiChatToggleBtn.style.removeProperty('display');
                    if (mobileActionBar && mobileActionBar.classList.contains('open')) {
                        renderMobileActionBar();
                    }
                } else {
                    aiChatToggleBtn.style.setProperty('display', isEnabled ? 'flex' : 'none', 'important');
                }
            }
            
            // AI 기능이 활성화되면 AI 채팅 초기화
            if (isEnabled && window.aiChat && window.aiChat.init) {
                try {
                    await window.aiChat.init();
                    console.log('[App] AI 기능 활성화: AI 채팅 초기화 완료');
                } catch (error) {
                    console.error('[App] AI 기능 활성화: AI 채팅 초기화 실패:', error);
                }
            }
            
            console.log(`[App] AI 기능 ${isEnabled ? '활성화' : '비활성화'}`);
        }
    };

    // Notification API 토글 이벤트 핸들러
    const handleNotificationApiToggle = () => {
        const notificationApiToggle = document.getElementById('notification-api-toggle');
        
        if (notificationApiToggle) {
            const isEnabled = notificationApiToggle.checked;
            
            // 두 저장소에 모두 저장하여 동기화
            storage.saveNotificationApiEnabled(isEnabled);
            settings.notificationApiEnabled = isEnabled;
            storage.saveSettings(settings);
            
            // 알림 스케줄러에 Service Worker 사용 설정 업데이트
            if (window.notificationScheduler) {
                window.notificationScheduler.setUseServiceWorker(isEnabled);
                // 모든 알림 재스케줄링
                window.notificationScheduler.rescheduleAllNotifications(todoManager.getTodos());
            }
            
            // 권한 상태 UI 즉시 업데이트
            setTimeout(() => {
                updateNotificationPermissionStatus();
            }, 100);
            
            console.log(`[App] Notification API ${isEnabled ? '활성화' : '비활성화'}`);
        }
    };

    // 알림 권한 요청
    const handleNotificationPermissionRequest = async () => {
        if (!window.serviceWorkerManager) {
            console.warn('[App] Service Worker Manager가 없습니다');
            return;
        }

        try {
            const granted = await window.serviceWorkerManager.requestNotificationPermission();
            if (granted) {
                console.log('[App] 알림 권한이 허용되었습니다');
                // 권한 요청 후 약간의 지연을 두고 상태 업데이트
                setTimeout(() => {
                    updateNotificationPermissionStatus();
                }, 100);
                // 알림 스케줄러에 Service Worker 사용 설정 (저장된 토글 설정 고려)
                if (window.notificationScheduler) {
                    const savedUseServiceWorker = storage.getNotificationApiEnabled();
                    window.notificationScheduler.setUseServiceWorker(savedUseServiceWorker);
                    // 모든 알림 재스케줄링
                    window.notificationScheduler.rescheduleAllNotifications(todoManager.getTodos());
                }
            } else {
                console.log('[App] 알림 권한이 거부되었습니다');
                setTimeout(() => {
                    updateNotificationPermissionStatus();
                }, 100);
            }
        } catch (error) {
            console.error('[App] 알림 권한 요청 실패:', error);
        }
    };

    // 알림 권한 상태 업데이트
    const updateNotificationPermissionStatus = () => {
        const notificationPermissionStatus = document.getElementById('notification-permission-status');
        if (!notificationPermissionStatus) {
            console.log('[App] notification-permission-status 요소를 찾을 수 없습니다');
            return;
        }

        const permission = window.serviceWorkerManager ? window.serviceWorkerManager.getPermission() : 'default';
        const isUsingSW = window.notificationScheduler ? window.notificationScheduler.isUsingServiceWorker() : false;
        const notificationApiEnabled = storage.getNotificationApiEnabled();

        console.log('[App] 알림 권한 상태 업데이트:', {
            permission,
            isUsingSW,
            notificationApiEnabled
        });

        let statusText = '';
        let statusClass = '';

        // 실제 브라우저 권한 상태를 우선적으로 표시
        switch (permission) {
            case 'granted':
                if (notificationApiEnabled) {
                    statusText = isUsingSW ? '백그라운드 알림 활성화' : '알림 권한 허용됨';
                    statusClass = 'success';
                } else {
                    statusText = '알림 권한 허용됨 (앱에서 비활성화)';
                    statusClass = 'warning';
                }
                break;
            case 'denied':
                statusText = '알림 권한 거부됨';
                statusClass = 'error';
                break;
            case 'default':
            default:
                statusText = '알림 권한 요청 필요';
                statusClass = 'warning';
                break;
        }

        console.log('[App] 설정된 상태:', { statusText, statusClass });
        notificationPermissionStatus.textContent = statusText;
        notificationPermissionStatus.className = `status-text ${statusClass}`;
    };

    // 아이콘 초기화
    const initIcons = () => {
        // 헤더 버튼들 - 크기를 18px로 증가
        icons.setButtonIcon(settingsBtn, 'settings', '카테고리 관리', 18);
        icons.setButtonIcon(importBtn, 'upload', '가져오기', 18);
        icons.setButtonIcon(exportBtn, 'download', '내보내기', 18);
        icons.setButtonIcon(closeModalBtn, 'close', '닫기', 18);
        icons.setButtonIcon(closeScheduleModalBtn, 'close', '닫기', 18);
        icons.setButtonIcon(closeCategoryDeleteModalBtn, 'close', '닫기', 18);
        icons.setButtonIcon(closeCategoryEditModalBtn, 'close', '닫기', 18);
        icons.setButtonIcon(editCategoryOrderBtn, 'order-list', '순서 편집', 18);
        icons.setButtonIcon(closeCategoryOrderModalBtn, 'close', '닫기', 18);
        icons.setButtonIcon(globalSettingsBtn, 'settings-gear', '설정', 18);
        icons.setButtonIcon(closeSettingsSidebar, 'close', '닫기', 18);
        // showCompletedToggle은 동적으로 생성되므로 나중에 설정됨
        
        // 소리 상태 버튼 초기화 (적절한 간격으로)
        updateAudioStatus(); // 즉시 1번
        setTimeout(() => updateAudioStatus(), 1000); // 1초 후 1번만

        // 햄버거 아이콘 설정
        if (mobileMenuBtn) {
            mobileMenuBtn.innerHTML = icons.get('menu', 18);
            mobileMenuBtn.setAttribute('aria-label', '메뉴');
        }
    };

    // AI 대화 아이콘 초기화 (별도 함수)
    const initAiChatIcons = () => {
        console.log('[App] AI 대화 아이콘 초기화 시작');
        
        const aiChatToggleBtn = document.getElementById('ai-chat-toggle-btn');
        const closeAiChatSidebarBtn = document.getElementById('close-ai-chat-sidebar');
        const aiChatSendBtn = document.getElementById('ai-chat-send-btn');
        
        console.log('[App] AI 대화 버튼 요소:', aiChatToggleBtn);
        console.log('[App] AI 대화 닫기 버튼 요소:', closeAiChatSidebarBtn);
        console.log('[App] AI 대화 전송 버튼 요소:', aiChatSendBtn);
        
        if (aiChatToggleBtn) {
            console.log('[App] AI 대화 토글 버튼 아이콘 설정');
            // display 속성을 덮어쓰지 않도록 직접 SVG만 설정
            aiChatToggleBtn.innerHTML = icons.get('chat', 18);
            aiChatToggleBtn.setAttribute('aria-label', 'AI 대화');
        } else {
            console.error('[App] AI 대화 토글 버튼을 찾을 수 없습니다!');
        }
        
        if (closeAiChatSidebarBtn) {
            console.log('[App] AI 대화 닫기 버튼 아이콘 설정');
            icons.setButtonIcon(closeAiChatSidebarBtn, 'close', '닫기', 18);
        } else {
            console.error('[App] AI 대화 닫기 버튼을 찾을 수 없습니다!');
        }
        
        if (aiChatSendBtn) {
            console.log('[App] AI 대화 전송 버튼 아이콘 설정');
            icons.setButtonIcon(aiChatSendBtn, 'send', '전송', 16);
        } else {
            console.error('[App] AI 대화 전송 버튼을 찾을 수 없습니다!');
        }
        
        console.log('[App] AI 대화 아이콘 초기화 완료');
    };

    // AI 채팅 초기화 제외한 초기화 함수 (이제 AI 채팅 버튼 표시 시 AI 채팅 모듈도 초기화)
    const initWithoutAiChat = async () => {
        todoManager.setTodos(storage.getTodos());
        todoManager.setCategories(storage.getCategories());
        todoManager.setCompletedRepeatTodos(storage.getCompletedRepeatTodos());
        
        // 설정 로드
        settings = storage.getSettings();
        
        // 1) 첫 페인트를 위해 즉시 렌더 (카테고리/목록)
        render();
        
        // 2) 나머지 초기화는 페인트 이후로 지연
        requestAnimationFrame(() => {
            initIcons();
            initAiChatIcons();
            
            // 반복 모달 생성은 idle에 수행 (없으면 소폭 지연)
            const idle = (fn) => {
                if (window.requestIdleCallback) {
                    window.requestIdleCallback(fn, { timeout: 1000 });
                } else {
                    setTimeout(fn, 120);
                }
            };
            idle(() => {
                try { createRepeatModal(); } catch (e) { console.warn('[App] createRepeatModal 실패:', e); }
            });

            // 실시간 시간 업데이트 시작
            updateCurrentTime(); // 초기 시간 표시
            setInterval(updateCurrentTime, 1000); // 1초마다 업데이트
            // 모바일 초기화/이벤트
            syncMobileButtonsVisibility();
            window.addEventListener('resize', () => {
                syncMobileButtonsVisibility();
                // 설정 변경/리사이즈 시 액션시트 내용 최신화
                if (mobileActionBar && mobileActionBar.classList.contains('open')) {
                    renderMobileActionBar();
                }
                // AI 버튼 상태도 함께 업데이트
                updateAiButtonVisibility();
            });
            if (mobileMenuBtn) {
                mobileMenuBtn.addEventListener('click', toggleMobileActionBar);
            }
        });

        // 이벤트 리스너 추가
        saveScheduleBtn.addEventListener('click', saveSchedule);
        cancelScheduleBtn.addEventListener('click', closeScheduleModal);
        closeScheduleModalBtn.addEventListener('click', closeScheduleModal);
        scheduleModal.addEventListener('click', (e) => {
            if (e.target === scheduleModal) closeScheduleModal();
        });
        
        // 설정 토글 이벤트 리스너 (동적으로 생성되는 요소들은 나중에 추가됨)
        
        // 소리 상태 버튼 이벤트 리스너
        if (audioStatusBtn) {
            console.log('[App] 소리 상태 버튼 이벤트 리스너 추가');
            audioStatusBtn.addEventListener('click', handleAudioStatusClick);
        } else {
            console.error('[App] audioStatusBtn을 찾을 수 없어서 이벤트 리스너를 추가할 수 없습니다');
        }
        
        // 할일 정렬 변경 이벤트 리스너 (동적으로 추가된 요소이므로 나중에 추가)
        
        // 시스템 시간 변경 감지를 위한 이벤트 리스너 추가
        window.addEventListener('focus', () => {
            console.log('[App] 페이지 포커스 감지 - 알림 재스케줄링');
            const now = new Date(Date.now());
            console.log(`[App] 포커스 시 현재 시간: ${now.toLocaleString('ko-KR')} (${now.toISOString()}) [Timestamp: ${Date.now()}]`);
            notificationScheduler.rescheduleAllNotifications(todoManager.getTodos());
            updateAudioStatus(); // 소리 상태도 업데이트
        });
        
        // 페이지 가시성 변경 감지 (탭 전환 등)
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                console.log('[App] 페이지 가시성 변경 감지 - 알림 재스케줄링');
                const now = new Date(Date.now());
                console.log(`[App] 가시성 변경 시 현재 시간: ${now.toLocaleString('ko-KR')} (${now.toISOString()}) [Timestamp: ${Date.now()}]`);
                notificationScheduler.rescheduleAllNotifications(todoManager.getTodos());
                updateAudioStatus(); // 소리 상태도 업데이트
            } else {
                console.log('[App] 페이지가 숨겨짐 - 알림은 백그라운드에서 계속 작동');
            }
        });
        
        // 주기적인 시간 동기화 (5분마다)
        setInterval(() => {
            console.log('[App] 주기적 시간 동기화 실행');
            const now = new Date(Date.now());
            console.log(`[App] 주기적 동기화 시 현재 시간: ${now.toLocaleString('ko-KR')} (${now.toISOString()}) [Timestamp: ${Date.now()}]`);
            notificationScheduler.rescheduleAllNotifications(todoManager.getTodos());
        }, 5 * 60 * 1000); // 5분마다
        
        // 페이지 언로드 시 정리
        window.addEventListener('beforeunload', () => {
            console.log('[App] 페이지 언로드 - 스케줄러 정리');
            if (window.notificationScheduler && window.notificationScheduler.cleanupScheduler) {
                window.notificationScheduler.cleanupScheduler();
            }
        });
        
        // 설정 사이드바에 모든 항목을 정확한 순서로 동적 생성 (첫 페인트 이후로 지연)
        setTimeout(() => {
        const settingsSidebar = document.getElementById('settings-sidebar');
        const settingsContent = settingsSidebar.querySelector('.settings-sidebar-content');
        
        // 기존 설정 항목들 제거 (h2 제목 제외)
        const existingItems = settingsContent.querySelectorAll('.setting-item');
        existingItems.forEach(item => item.remove());
        
        // 1. 완료된 할 일 표시 설정
        const showCompletedSection = document.createElement('div');
        showCompletedSection.className = 'setting-item';
        showCompletedSection.innerHTML = `
            <div class="setting-row">
                <label for="show-completed-toggle" class="setting-label">완료된 할 일 표시</label>
                <div class="toggle-switch">
                    <input type="checkbox" id="show-completed-toggle" class="toggle-input">
                    <label for="show-completed-toggle" class="toggle-label"></label>
                </div>
            </div>
            <p class="setting-description">완료된 할 일을 목록에 표시할지 선택합니다.</p>
        `;
        settingsContent.appendChild(showCompletedSection);
        
        // 2. 카테고리 자동 스크롤 설정
        const autoScrollSection = document.createElement('div');
        autoScrollSection.className = 'setting-item';
        autoScrollSection.innerHTML = `
            <div class="setting-row">
                <label class="setting-label">카테고리 자동 스크롤</label>
                <label class="toggle-switch">
                    <input type="checkbox" id="auto-scroll-toggle" class="toggle-input">
                    <span class="toggle-label"></span>
                </label>
            </div>
            <p class="setting-description">카테고리 선택 시 해당 위치로 자동 스크롤합니다. 접힌 카테고리는 그대로 유지됩니다.</p>
        `;
        settingsContent.appendChild(autoScrollSection);
        
        // 3. 할일 정렬 순서 설정
        const todoSortSection = document.createElement('div');
        todoSortSection.className = 'setting-item';
        todoSortSection.innerHTML = `
            <div class="setting-row">
                <label class="setting-label">할일 정렬 순서</label>
            </div>
            <div class="setting-control">
                <select id="todo-sort-select" class="sort-select">
                    <option value="created-desc">생성일 최신순</option>
                    <option value="created-asc">생성일 오래된순</option>
                    <option value="text-asc">할일명 가나다순</option>
                    <option value="text-desc">할일명 역순</option>
                    <option value="completed-asc">미완료 우선</option>
                    <option value="completed-desc">완료 우선</option>
                    <option value="start-time-asc">시작시간 빠른순</option>
                    <option value="start-time-desc">시작시간 늦은순</option>
                    <option value="due-time-asc">마감시간 빠른순</option>
                    <option value="due-time-desc">마감시간 늦은순</option>
                </select>
            </div>
            <p class="setting-description">할일 목록의 정렬 순서를 설정합니다. 카테고리별 보기와 전체 보기 모두에 적용됩니다.</p>
        `;
        settingsContent.appendChild(todoSortSection);
        
        // 4. 알림시간 동기화 설정
        const timeSyncSection = document.createElement('div');
        timeSyncSection.className = 'setting-item';
        timeSyncSection.innerHTML = `
            <div class="setting-row">
                <label class="setting-label">알림시간 동기화</label>
                <button id="sync-time-btn" class="secondary-btn" style="padding: 8px 16px; font-size: 14px;">동기화</button>
            </div>
            <p class="setting-description">PC 시간이 변경되었을 때 알람 시간을 현재 시간에 맞춰 재계산합니다.</p>
        `;
        settingsContent.appendChild(timeSyncSection);
        
        // 5. 알림 설정 그룹
        const notificationGroupSection = document.createElement('div');
        notificationGroupSection.className = 'setting-item';
        notificationGroupSection.innerHTML = `
            <div class="setting-row">
                <label for="notification-api-toggle" class="setting-label">백그라운드 알림 (Notification API)</label>
                <div class="toggle-switch">
                    <input type="checkbox" id="notification-api-toggle" class="toggle-input">
                    <label for="notification-api-toggle" class="toggle-label"></label>
                </div>
            </div>
            <div class="setting-row" style="margin-top: 12px;">
                <label class="setting-label">알림 권한</label>
                <button id="notification-permission-toggle" class="secondary-btn">권한 요청</button>
            </div>
            <div class="setting-control">
                <div id="notification-permission-status" class="status-text warning">알림 권한 요청 필요</div>
            </div>
            <p class="setting-description">Notification API를 사용하여 백그라운드에서도 알림을 받을 수 있습니다. 탭이 비활성화되어 있어도 알림이 정상적으로 작동합니다. 백그라운드 알림을 사용하려면 알림 권한이 필요합니다.</p>
        `;
        settingsContent.appendChild(notificationGroupSection);
        
        // 6. AI 기능 설정 그룹
        const aiFeatureGroupSection = document.createElement('div');
        aiFeatureGroupSection.className = 'setting-item';
        aiFeatureGroupSection.innerHTML = `
            <div class="setting-row">
                <label for="ai-feature-toggle" class="setting-label">AI 기능 (Beta)</label>
                <div class="toggle-switch">
                    <input type="checkbox" id="ai-feature-toggle" class="toggle-input">
                    <label for="ai-feature-toggle" class="toggle-label"></label>
                </div>
            </div>
            <div class="setting-row" style="margin-top: 12px;">
                <label for="ai-api-key-input" class="setting-label">AI API 키</label>
            </div>
            <div class="setting-control" style="display: flex; gap: 8px; align-items: flex-start;">
                <input type="password" id="ai-api-key-input" class="api-key-input" placeholder="Gemini API 키 입력" style="flex: 1; margin-bottom: 0;">
                <button id="save-api-key-btn" class="secondary-btn" style="white-space: nowrap; padding: 10px 16px; height: 42px;">저장</button>
            </div>
            <p class="setting-description">AI 대화 기능을 활성화하거나 비활성화합니다. (Beta 기능) AI 대화 기능을 사용하려면 Google Gemini API 키가 필요합니다. <a href="https://makersuite.google.com/app/apikey" target="_blank">API 키 발급받기</a></p>
        `;
        settingsContent.appendChild(aiFeatureGroupSection);
        
        // 7. Google Drive 동기화 설정
        const googleDriveSection = document.createElement('div');
        googleDriveSection.className = 'setting-item';
        googleDriveSection.innerHTML = `
            <div class="setting-row">
                <label class="setting-label">Google Drive 동기화 (Beta)</label>
            </div>
            <div class="setting-row" style="margin-top: 12px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span id="gdrive-auth-status" class="status-text">초기화 중...</span>
                    <div id="gdrive-user-info" style="display: none;">
                        <img id="gdrive-user-avatar" style="width: 24px; height: 24px; border-radius: 50%;" src="" alt="">
                        <span id="gdrive-user-email" class="gdrive-user-email"></span>
                    </div>
                </div>
            </div>
            <div class="setting-control" style="display: flex; gap: 8px; margin-top: 12px;">
                <button id="gdrive-auth-btn" class="secondary-btn" disabled>초기화 중...</button>
                <button id="gdrive-sync-btn" class="secondary-btn" disabled style="display: none;">동기화</button>
            </div>
            <div class="setting-row" style="margin-top: 12px; display: none;" id="gdrive-auto-sync-row">
                <label class="setting-label">자동 동기화 (5분마다)</label>
                <label class="toggle-switch">
                    <input type="checkbox" id="gdrive-auto-sync-toggle" class="toggle-input">
                    <span class="toggle-label"></span>
                </label>
            </div>
            <div class="setting-row" style="margin-top: 12px; display: none;" id="gdrive-last-sync-row">
                <label class="setting-label">마지막 동기화</label>
                <span id="gdrive-last-sync-time" style="font-size: 12px; color: #6b7280; font-style: italic;">동기화 기록 없음</span>
            </div>
            <div id="gdrive-sync-progress" style="display: none; margin-top: 12px; padding: 12px; background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 6px;">
                <div style="display: flex; align-items: center; gap: 8px; font-size: 14px; color: #0369a1;">
                    동기화 진행 중...
                </div>
            </div>
            <p class="setting-description">Google Drive와 할 일 데이터를 동기화합니다. <strong>보안정책상 1시간 후 자동 로그아웃됩니다.</strong> 자동 동기화를 활성화하면 5분마다 백그라운드에서 동기화가 실행됩니다.</p>
        `;
        settingsContent.appendChild(googleDriveSection);
        
        // 8. 데이터 초기화 설정
        const dataResetSection = document.createElement('div');
        dataResetSection.className = 'setting-item';
        dataResetSection.innerHTML = `
            <div class="setting-row">
                <div>
                    <div class="setting-label">데이터 초기화</div>
                    <p class="setting-description">모든 데이터를 초기화합니다 (복구 불가)</p>
                </div>
            </div>
            <div class="setting-control">
                <button id="reset-all-data-btn" class="reset-btn danger">데이터 초기화</button>
                <button id="reset-settings-btn" class="reset-btn secondary">설정 초기화</button>
            </div>
        `;
        settingsContent.appendChild(dataResetSection);
        
        // 모든 설정 요소들의 이벤트 리스너와 초기화
        const todoSortSelect = document.getElementById('todo-sort-select');
        const autoScrollToggle = document.getElementById('auto-scroll-toggle');
        const showCompletedToggle = document.getElementById('show-completed-toggle');
        const aiFeatureToggle = document.getElementById('ai-feature-toggle');
        const notificationApiToggle = document.getElementById('notification-api-toggle');
        const notificationPermissionToggle = document.getElementById('notification-permission-toggle');
        const resetAllDataBtn = document.getElementById('reset-all-data-btn');
        const resetSettingsBtn = document.getElementById('reset-settings-btn');
        const syncTimeBtn = document.getElementById('sync-time-btn');
        const apiKeyInput = document.getElementById('ai-api-key-input');
        const saveApiKeyBtn = document.getElementById('save-api-key-btn');
        
        // Google Drive 동기화 관련 요소들
        const gdriveAuthBtn = document.getElementById('gdrive-auth-btn');
        const gdriveSyncBtn = document.getElementById('gdrive-sync-btn');

        const gdriveAutoSyncToggle = document.getElementById('gdrive-auto-sync-toggle');
        const gdriveAuthStatus = document.getElementById('gdrive-auth-status');
        const gdriveUserInfo = document.getElementById('gdrive-user-info');
        const gdriveUserAvatar = document.getElementById('gdrive-user-avatar');
        const gdriveUserEmail = document.getElementById('gdrive-user-email');
        const gdriveAutoSyncRow = document.getElementById('gdrive-auto-sync-row');
        const gdriveLastSyncRow = document.getElementById('gdrive-last-sync-row');
        const gdriveLastSyncTime = document.getElementById('gdrive-last-sync-time');
        const gdriveSyncProgress = document.getElementById('gdrive-sync-progress');

        // 할일 정렬 선택 초기화
        if (todoSortSelect) {
            // 설정이 없거나 유효하지 않은 경우 기본값으로 설정
            const currentSortOrder = settings.todoSortOrder;
            const validOptions = ['created-desc', 'created-asc', 'text-asc', 'text-desc', 'completed-asc', 'completed-desc', 'start-time-asc', 'start-time-desc', 'due-time-asc', 'due-time-desc'];
            
            if (!currentSortOrder || !validOptions.includes(currentSortOrder)) {
                settings.todoSortOrder = 'created-desc';
                storage.saveSettings(settings);
            }
            
            todoSortSelect.value = settings.todoSortOrder;
            todoSortSelect.removeEventListener('change', handleTodoSortChange);
            todoSortSelect.addEventListener('change', handleTodoSortChange);
        }

        // 자동 스크롤 토글 초기화
        if (autoScrollToggle) {
            autoScrollToggle.checked = settings.autoScrollToCategory !== false;
            autoScrollToggle.removeEventListener('change', handleAutoScrollToggle);
            autoScrollToggle.addEventListener('change', handleAutoScrollToggle);
        }

        // 완료된 할 일 표시 토글 초기화
        if (showCompletedToggle) {
            showCompletedToggle.checked = settings.showCompleted !== false;
            showCompletedToggle.removeEventListener('change', handleShowCompletedToggle);
            showCompletedToggle.addEventListener('change', handleShowCompletedToggle);
        }

        // AI 기능 토글 초기화
        if (aiFeatureToggle) {
            // 두 저장소의 상태를 동기화
            const savedAiState = storage.getAiFeatureEnabled();
            if (settings.aiFeatureEnabled !== savedAiState) {
                settings.aiFeatureEnabled = savedAiState;
                storage.saveSettings(settings);
            }
            aiFeatureToggle.checked = settings.aiFeatureEnabled === true;
            aiFeatureToggle.removeEventListener('change', handleAiFeatureToggle);
            aiFeatureToggle.addEventListener('change', handleAiFeatureToggle);
        }

            // 백그라운드 알림 토글 초기화
    if (notificationApiToggle) {
        // 두 저장소의 상태를 동기화
        const savedState = storage.getNotificationApiEnabled();
        if (settings.notificationApiEnabled !== savedState) {
            settings.notificationApiEnabled = savedState;
            storage.saveSettings(settings);
        }
        notificationApiToggle.checked = settings.notificationApiEnabled === true;
        notificationApiToggle.removeEventListener('change', handleNotificationApiToggle);
        notificationApiToggle.addEventListener('change', handleNotificationApiToggle);
    }

        // 알림 권한 버튼 초기화
        if (notificationPermissionToggle) {
            notificationPermissionToggle.removeEventListener('click', handleNotificationPermissionRequest);
            notificationPermissionToggle.addEventListener('click', handleNotificationPermissionRequest);
        }

        // 데이터 초기화 버튼 이벤트 리스너
        if (resetAllDataBtn) {
            resetAllDataBtn.removeEventListener('click', handleResetAllData);
            resetAllDataBtn.addEventListener('click', handleResetAllData);
        }
        if (resetSettingsBtn) {
            resetSettingsBtn.removeEventListener('click', handleResetSettings);
            resetSettingsBtn.addEventListener('click', handleResetSettings);
        }

        // 시간 동기화 버튼 이벤트 리스너
        if (syncTimeBtn) {
            syncTimeBtn.removeEventListener('click', () => {
                console.log('[App] 수동 시간 동기화 실행');
                const now = new Date(Date.now());
                console.log(`[App] 수동 동기화 시 현재 시간: ${now.toLocaleString('ko-KR')} (${now.toISOString()}) [Timestamp: ${Date.now()}]`);
                notificationScheduler.rescheduleAllNotifications(todoManager.getTodos());
            });
            syncTimeBtn.addEventListener('click', () => {
                console.log('[App] 수동 시간 동기화 실행');
                const now = new Date(Date.now());
                console.log(`[App] 수동 동기화 시 현재 시간: ${now.toLocaleString('ko-KR')} (${now.toISOString()}) [Timestamp: ${Date.now()}]`);
                notificationScheduler.rescheduleAllNotifications(todoManager.getTodos());
            });
        }

        // AI API 키 입력 및 저장 버튼 초기화
        if (apiKeyInput) {
            // 두 저장소의 상태를 동기화
            const savedApiKey = storage.getAiApiKey();
            if (settings.aiApiKey !== savedApiKey) {
                settings.aiApiKey = savedApiKey;
                storage.saveSettings(settings);
            }
            // API 키가 비어있거나 null인 경우 빈 문자열로 설정
            const apiKeyValue = settings.aiApiKey || savedApiKey || '';
            console.log('[App] API 키 입력 필드 초기화:', {
                settingsHasKey: !!settings.aiApiKey,
                savedHasKey: !!savedApiKey,
                hasValue: !!apiKeyValue
            });
            apiKeyInput.value = apiKeyValue;
            
            // API 키가 비어있는 경우 입력 필드를 완전히 초기화
            if (!apiKeyValue) {
                console.log('[App] API 키가 비어있음 - 입력 필드 완전 초기화');
                apiKeyInput.type = 'text';
                apiKeyInput.type = 'password';
                apiKeyInput.blur();
                apiKeyInput.focus();
            }
        }
        if (saveApiKeyBtn) {
            saveApiKeyBtn.removeEventListener('click', async () => {
                const apiKey = apiKeyInput.value.trim();
                if (apiKey) {
                    try {
                        // API 키 유효성 검증
                        if (window.aiChat && window.aiChat.setApiKey) {
                            await window.aiChat.setApiKey(apiKey);
                            // 두 저장소에 모두 저장하여 동기화
                            storage.saveAiApiKey(apiKey);
                            settings.aiApiKey = apiKey;
                            storage.saveSettings(settings);
                            console.log('[App] AI API 키 저장 및 검증 완료');
                            alert('API 키가 저장되고 검증되었습니다.');
                        } else {
                            // aiChat이 없는 경우 기본 저장
                            storage.saveAiApiKey(apiKey);
                            settings.aiApiKey = apiKey;
                            storage.saveSettings(settings);
                            console.log('[App] AI API 키 저장됨 (검증 생략)');
                            alert('API 키가 저장되었습니다.');
                        }
                    } catch (error) {
                        console.error('[App] API 키 검증 실패:', error);
                        alert('API 키 검증에 실패했습니다. 올바른 API 키인지 확인해주세요.');
                    }
                } else {
                    alert('API 키를 입력해주세요.');
                }
            });
            saveApiKeyBtn.addEventListener('click', async () => {
                const apiKey = apiKeyInput.value.trim();
                if (apiKey) {
                    try {
                        // API 키 유효성 검증
                        if (window.aiChat && window.aiChat.setApiKey) {
                            await window.aiChat.setApiKey(apiKey);
                            // 두 저장소에 모두 저장하여 동기화
                            storage.saveAiApiKey(apiKey);
                            settings.aiApiKey = apiKey;
                            storage.saveSettings(settings);
                            console.log('[App] AI API 키 저장 및 검증 완료');
                            alert('API 키가 저장되고 검증되었습니다.');
                        } else {
                            // aiChat이 없는 경우 기본 저장
                            storage.saveAiApiKey(apiKey);
                            settings.aiApiKey = apiKey;
                            storage.saveSettings(settings);
                            console.log('[App] AI API 키 저장됨 (검증 생략)');
                            alert('API 키가 저장되었습니다.');
                        }
                    } catch (error) {
                        console.error('[App] API 키 검증 실패:', error);
                        alert('API 키 검증에 실패했습니다. 올바른 API 키인지 확인해주세요.');
                    }
                } else {
                    alert('API 키를 입력해주세요.');
                }
            });
        }

        // Google Drive 동기화 초기화 및 이벤트 리스너
        if (gdriveAuthBtn && gdriveSyncBtn && gdriveAutoSyncToggle) {
            // Google Drive 동기화 버튼 텍스트만 설정
            gdriveSyncBtn.textContent = '동기화';
            
            // Google Drive API 초기화
            window.googleDriveSync.initialize()
                .then(() => {
                    console.log('Google Drive API 초기화 성공');
                    updateGoogleDriveUI();
                })
                .catch((error) => {
                    console.error('Google Drive API 초기화 실패:', error);
                    if (gdriveAuthStatus) {
                        gdriveAuthStatus.textContent = '초기화 실패 - .env 파일 확인 필요';
                        gdriveAuthStatus.style.color = '#ef4444';
                    }
                });

            // 인증 버튼 이벤트
            gdriveAuthBtn.addEventListener('click', async () => {
                try {
                    if (window.googleDriveSync.isSignedIn) {
                        await window.googleDriveSync.signOut();
                    } else {
                        await window.googleDriveSync.signIn();
                    }
                    updateGoogleDriveUI();
                } catch (error) {
                    console.error('Google Drive 인증 오류:', error);
                }
            });

            // 동기화 버튼 이벤트 (안전 처리)
            gdriveSyncBtn.addEventListener('click', async () => {
                try {
                    const result = await window.googleDriveSync.sync();
                    updateGoogleDriveUI();
                    // sync()가 이제 성공/실패 정보를 반환하므로 모든 알림은 내부에서 처리됨
                } catch (error) {
                    // 예외적인 경우에만 여기서 처리 (sync 함수가 throw하지 않도록 수정했으므로 거의 실행 안됨)
                    console.error('동기화 요청 오류:', error);
                    updateGoogleDriveUI();
                    utils.showToast('동기화 요청에 실패했습니다. 로컬 기능은 정상 동작합니다.', 'error');
                }
            });



            // 자동 동기화 토글 이벤트
            gdriveAutoSyncToggle.addEventListener('change', (e) => {
                if (e.target.checked) {
                    window.googleDriveSync.startAutoSync();
                } else {
                    window.googleDriveSync.stopAutoSync();
                }
                updateGoogleDriveUI();
            });
        }

        // Google Drive UI 업데이트 함수
        const updateGoogleDriveUI = () => {
            if (!window.googleDriveSync) {
                // 초기화되지 않았으면 사용자 정보는 무조건 숨김
                if (gdriveUserInfo) {
                    gdriveUserInfo.style.display = 'none';
                }
                if (gdriveUserAvatar) {
                    gdriveUserAvatar.style.display = 'none';
                    gdriveUserAvatar.removeAttribute('src'); // 깨진 이미지 방지
                }
                return;
            }

            // 토큰 만료 체크 후 실제 로그인 상태 결정
            let isSignedIn = window.googleDriveSync.isSignedIn;
            if (isSignedIn && window.googleDriveSync.isTokenExpired()) {
                console.log('토큰 만료됨, UI를 로그아웃 상태로 변경');
                // 실제 로그인 상태도 업데이트 (다음 호출부터 반영)
                window.googleDriveSync.markAsLoggedOut();
                isSignedIn = false; // 이번 UI 업데이트에서 즉시 반영
            }
            const syncInProgress = window.googleDriveSync.syncInProgress;
            const autoSyncEnabled = window.googleDriveSync.autoSyncEnabled;
            const lastSyncTime = window.googleDriveSync.lastSyncTime;

            // 인증 상태 업데이트
            if (gdriveAuthStatus) {
                gdriveAuthStatus.textContent = isSignedIn ? '로그인됨' : '로그인 필요';
                // CSS 클래스로 점과 텍스트 색상 모두 제어
                gdriveAuthStatus.className = 'status-text';
                if (isSignedIn) {
                    gdriveAuthStatus.classList.add('success');
                } else {
                    gdriveAuthStatus.classList.add('offline');
                }
            }

            // 인증 버튼 업데이트
            if (gdriveAuthBtn) {
                if (isSignedIn) {
                    gdriveAuthBtn.textContent = '로그아웃';
                } else {
                    gdriveAuthBtn.textContent = '로그인';
                }
                gdriveAuthBtn.disabled = false;
            }

            // 사용자 정보 업데이트
            if (isSignedIn) {
                const user = window.googleDriveSync.getCurrentUser();
                if (user && gdriveUserInfo && gdriveUserAvatar && gdriveUserEmail) {
                    // 안전한 이미지 URL 설정
                    const imageUrl = user.picture || user.imageUrl;
                    if (imageUrl && imageUrl !== 'undefined' && imageUrl.startsWith('http')) {
                        gdriveUserAvatar.src = imageUrl;
                        gdriveUserAvatar.style.display = 'inline-block';
                    } else {
                        gdriveUserAvatar.style.display = 'none';
                    }
                    
                    // 구글 계정만 표시 (도메인 제거)
                    const emailCandidate = user?.email || user?.name || '';
                    let displayName = emailCandidate;
                    
                    if (emailCandidate.includes('@')) {
                        // 이메일에서 도메인 제거 (username@gmail.com -> username)
                        displayName = emailCandidate.split('@')[0];
                    }
                    
                    // 길면 말줄임표로 표시
                    if (displayName.length > 15) {
                        displayName = displayName.substring(0, 15) + '...';
                    }
                    
                    gdriveUserEmail.textContent = displayName;
                    gdriveUserEmail.title = emailCandidate; // 전체 이메일을 툴팁으로 표시
                    gdriveUserInfo.style.display = 'block';
                } else {
                    // 로그인은 되어 있지만 사용자 정보가 없는 경우 (예: 토큰 만료 후)
                    if (gdriveUserInfo) {
                        gdriveUserInfo.style.display = 'none';
                    }
                    if (gdriveUserAvatar) {
                        gdriveUserAvatar.style.display = 'none';
                        gdriveUserAvatar.removeAttribute('src'); // 깨진 이미지 방지
                    }
                }
            } else {
                // 로그인 안했을 때는 사용자 정보 숨기고 아바타 src도 제거
                if (gdriveUserInfo) {
                    gdriveUserInfo.style.display = 'none';
                }
                if (gdriveUserAvatar) {
                    gdriveUserAvatar.style.display = 'none';
                    gdriveUserAvatar.removeAttribute('src'); // 깨진 이미지 방지
                }
            }

            // 동기화 관련 요소들 표시/숨김
            const shouldShowSyncControls = isSignedIn;
            if (gdriveSyncBtn) {
                gdriveSyncBtn.style.display = shouldShowSyncControls ? 'inline-flex' : 'none';
                gdriveSyncBtn.disabled = syncInProgress;
            }

            if (gdriveAutoSyncRow) {
                gdriveAutoSyncRow.style.display = shouldShowSyncControls ? 'flex' : 'none';
            }
            if (gdriveLastSyncRow) {
                gdriveLastSyncRow.style.display = shouldShowSyncControls ? 'flex' : 'none';
            }

            // 자동 동기화 토글 상태 업데이트
            if (gdriveAutoSyncToggle) {
                gdriveAutoSyncToggle.checked = autoSyncEnabled;
            }

            // 마지막 동기화 시간 업데이트
            if (gdriveLastSyncTime) {
                if (lastSyncTime) {
                    gdriveLastSyncTime.textContent = utils.getTimeAgo(lastSyncTime);
                } else {
                    gdriveLastSyncTime.textContent = '동기화 기록 없음';
                }
            }

            // 동기화 진행 상태 업데이트
            if (gdriveSyncProgress) {
                gdriveSyncProgress.style.display = syncInProgress ? 'block' : 'none';
            }
        };

        // Google Drive UI 업데이트 함수를 전역에 등록 (동기화 모듈에서 호출할 수 있도록)
        window.updateGoogleDriveUI = updateGoogleDriveUI;
        
        // 동기화 시간 실시간 업데이트 (1분마다)
        setInterval(() => {
            if (window.googleDriveSync && window.googleDriveSync.lastSyncTime && gdriveLastSyncTime) {
                gdriveLastSyncTime.textContent = utils.getTimeAgo(window.googleDriveSync.lastSyncTime);
            }
        }, 60000);

        // 알림 권한 상태 업데이트 (동적으로 생성된 요소들 이후)
        updateNotificationPermissionStatus();
        }, 0);
        
        // Service Worker 초기화 (알림 스케줄러보다 먼저) - 비차단 처리
        if (window.serviceWorkerManager) {
            console.log('[App] Service Worker Manager 초기화 시작');
            window.serviceWorkerManager.init()
                .then((swInitialized) => {
                    console.log('[App] Service Worker Manager 초기화 결과:', swInitialized);
                    setTimeout(() => {
                        if (navigator.serviceWorker && navigator.serviceWorker.controller) {
                            console.log('[App] Service Worker 컨트롤러 활성화 확인됨');
                        } else {
                            console.log('[App] Service Worker 컨트롤러 아직 활성화되지 않음');
                        }
                    }, 1000);
                })
                .catch((e) => {
                    console.warn('[App] Service Worker Manager 초기화 실패:', e);
                });
        } else {
            console.warn('[App] Service Worker Manager를 찾을 수 없습니다');
        }
        
        // 알림 스케줄러 초기화
        try {
            notificationScheduler.initScheduler();
            console.log('[App] 알림 스케줄러 초기화 완료');
        } catch (error) {
            console.error('[App] 알림 스케줄러 초기화 실패:', error);
        }
        

        
        // AI 대화 아이콘 초기화 (사이드바가 생성된 후, 약간의 지연 후)
        setTimeout(() => {
            initAiChatIcons();
        }, 100);
        
        // 일반 아이콘 초기화
        initIcons();
        
        // AI 채팅 버튼 초기화 (저장된 상태에 따라)
        const aiChatToggleBtn = document.getElementById('ai-chat-toggle-btn');
        if (aiChatToggleBtn) {
            const isAiEnabled = storage.getAiFeatureEnabled();
            const isMobile = window.innerWidth <= 980;
            console.log(`[App] AI 기능 상태 확인: enabled=${isAiEnabled}, mobile=${isMobile}`);

            // 모바일에서는 고정 버튼을 표시하지 않음(액션시트 전용). 인라인 스타일 제거해 CSS 규칙이 적용되도록 함.
            if (isMobile) {
                aiChatToggleBtn.style.removeProperty('display');
                // 액션시트가 열려 있다면 최신 상태로 리렌더
                if (mobileActionBar && mobileActionBar.classList.contains('open')) {
                    renderMobileActionBar();
                }
            } else {
                if (isAiEnabled) {
                    aiChatToggleBtn.style.setProperty('display', 'flex', 'important');
                } else {
                    aiChatToggleBtn.style.setProperty('display', 'none', 'important');
                }
            }

            if (isAiEnabled && window.aiChat && window.aiChat.init) {
                try {
                    await window.aiChat.init();
                    console.log('[App] AI 채팅 모듈 초기화 완료');
                } catch (error) {
                    console.error('[App] AI 채팅 모듈 초기화 실패:', error);
                }
            }
        }
        
        // UI는 이미 초기에 렌더됨
    };

    // 전체 초기화 함수 (AI 채팅 포함)
    const init = async () => {
        // Storage를 전역으로 설정 (Google Drive 동기화에서 사용)
        window.storage = storage;
        console.log('[App] Storage 전역 설정 완료');
        
        await initWithoutAiChat();
        
        // 알림 권한 상태 업데이트
        updateNotificationPermissionStatus();
        
        // Service Worker가 준비되면 알림 스케줄러에 설정 (저장된 설정 고려)
        if (window.serviceWorkerManager && window.serviceWorkerManager.hasPermission()) {
            const savedUseServiceWorker = storage.getNotificationApiEnabled();
            console.log(`[App] Service Worker 사용 설정: ${savedUseServiceWorker}`);
            window.notificationScheduler.setUseServiceWorker(savedUseServiceWorker);
        }
        
        // AI 채팅 초기화는 이제 initWithoutAiChat에서 처리됨 (AI 기능이 활성화된 경우에만)
        
        // 타이머 초기화
        if (window.timer && window.timer.init) {
            window.timer.init();
        }
        
        // Service Worker 준비 완료 후 반드시 알림 재스케줄링 실행
        await ensureNotificationsRescheduled();
    };

    // Service Worker 준비 완료 후 알림 재스케줄링 보장 함수
    const ensureNotificationsRescheduled = async () => {
        try {
            // Service Worker가 준비될 때까지 최대 5초 대기
            let attempts = 0;
            const maxAttempts = 50; // 100ms * 50 = 5초
            
            while (attempts < maxAttempts) {
                if (window.serviceWorkerManager && 
                    window.serviceWorkerManager.hasPermission() && 
                    window.serviceWorkerManager.isInitialized()) {
                    
                    console.log('[App] Service Worker 준비 완료, 알림 재스케줄링 실행');
                    
                    // notificationScheduler의 Service Worker 사용 설정 강제 업데이트
                    const savedUseServiceWorker = storage.getNotificationApiEnabled();
                    window.notificationScheduler.setUseServiceWorker(savedUseServiceWorker);
                    
                    // 잠시 대기 후 Service Worker 사용 여부 재확인
                    await new Promise(resolve => setTimeout(resolve, 100));
                    
                    if (window.notificationScheduler.isUsingServiceWorker()) {
                        console.log('[App] Service Worker 사용 설정 확인됨, 알림 재스케줄링 시작');
                        const todos = window.todoManager.getTodos();
                        window.notificationScheduler.rescheduleAllNotifications(todos);
                        console.log('[App] 알림 재스케줄링 완료');
                        return;
                    } else {
                        console.warn('[App] Service Worker 사용 설정이 false로 설정됨, 재시도');
                    }
                }
                
                attempts++;
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            // 최대 시도 횟수 초과 시 폴백으로 알림 재스케줄링
            console.warn('[App] Service Worker 준비 대기 시간 초과, 폴백으로 알림 재스케줄링');
            const todos = window.todoManager.getTodos();
            window.notificationScheduler.rescheduleAllNotifications(todos);
            
        } catch (error) {
            console.error('[App] 알림 재스케줄링 중 오류 발생:', error);
            // 에러 발생 시에도 폴백으로 알림 재스케줄링
            try {
                const todos = window.todoManager.getTodos();
                window.notificationScheduler.rescheduleAllNotifications(todos);
            } catch (fallbackError) {
                console.error('[App] 폴백 알림 재스케줄링도 실패:', fallbackError);
            }
        }
    };

    // 테스트용 알림 기능 추가 (개발 중에만 사용)
    window.testNotification = () => {
        if (window.serviceWorkerManager && window.serviceWorkerManager.hasPermission()) {
            const testTime = new Date(Date.now() + 10000); // 10초 후
            console.log('[App] 테스트 알림 예약:', testTime.toISOString());
            window.serviceWorkerManager.scheduleNotification(
                'test-123',
                'test',
                '테스트 알림',
                '이것은 테스트 알림입니다.',
                testTime.toISOString(),
                true
            );
        } else {
            console.log('[App] Service Worker 또는 알림 권한이 없습니다.');
        }
    };

    // Service Worker에서 호출할 수 있도록 소리 재생 함수를 전역으로 노출
    window.playNotificationSound = () => {
        console.log('[App] Service Worker에서 요청한 알림 소리 재생');
        if (window.notificationScheduler && window.notificationScheduler.playNotificationSound) {
            window.notificationScheduler.playNotificationSound();
        } else {
            console.warn('[App] notificationScheduler.playNotificationSound를 찾을 수 없습니다');
        }
    };

    // Service Worker 메시지 리스너 추가
    if (navigator.serviceWorker) {
        navigator.serviceWorker.addEventListener('message', (event) => {
            console.log('[App] Service Worker 메시지 수신:', event.data);
            
            const { type, data } = event.data;
            
            switch (type) {
                case 'NOTIFICATION_SHOWN':
                    console.log('[App] NOTIFICATION_SHOWN 처리 시작');
                    handleNotificationShown(data);
                    break;
                case 'NOTIFICATION_CLICKED':
                    console.log('[App] NOTIFICATION_CLICKED 처리 시작');
                    handleNotificationClicked(data);
                    break;
                case 'NOTIFICATION_CLOSED':
                    console.log('[App] NOTIFICATION_CLOSED 처리 시작');
                    handleNotificationClosed(data);
                    break;
                case 'PLAY_NOTIFICATION_SOUND':
                    console.log('[App] PLAY_NOTIFICATION_SOUND 처리 시작');
                    if (window.notificationScheduler && window.notificationScheduler.playNotificationSound) {
                        console.log('[App] notificationScheduler.playNotificationSound 호출');
                        window.notificationScheduler.playNotificationSound();
                    } else {
                        console.warn('[App] notificationScheduler.playNotificationSound를 찾을 수 없습니다');
                    }
                    break;
                case 'SCHEDULE_NEXT_REPEAT':
                    console.log('[App] SCHEDULE_NEXT_REPEAT 처리 시작 - 함수가 제거됨');
                    break;
                case 'SYNC_REPEAT_NOTIFICATIONS':
                    console.log('[App] SYNC_REPEAT_NOTIFICATIONS 처리 시작 - 함수가 제거됨');
                    break;
                default:
                    console.log('[App] 알 수 없는 Service Worker 메시지 타입:', type);
            }
        });
        
        // Service Worker 컨트롤러 상태 확인
        if (navigator.serviceWorker.controller) {
            console.log('[App] Service Worker 컨트롤러가 활성화되어 있습니다');
        } else {
            console.log('[App] Service Worker 컨트롤러가 아직 활성화되지 않았습니다');
        }
    }



    // textarea 키보드 이벤트 핸들러
    // 한글 입력 시 중복 입력 방지를 위한 keyup 이벤트 핸들러
    // 한글 입력 시 중복 입력 방지를 위한 keydown 이벤트 핸들러
    const handleTodoInputKeydown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault(); // Enter 키의 기본 동작 방지
        }
    };

    // 한글 입력 시 중복 입력 방지를 위한 keyup 이벤트 핸들러
    const handleTodoInputKeyup = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            // 한글 조합 상태 확인 (isComposing이 true이면 조합 중)
            if (!e.isComposing) {
                handleAddTodo();
            }
        }
    };

    // EVENT LISTENERS
    addTodoBtn.addEventListener('click', handleAddTodo);
    todoInput.addEventListener('keydown', handleTodoInputKeydown);
    todoInput.addEventListener('keyup', handleTodoInputKeyup);
    categorySelector.addEventListener('click', handleCategorySelect);
    todoListContainer.addEventListener('click', handleListClick);

    settingsBtn.addEventListener('click', () => categoryModal.style.display = 'flex');
    closeModalBtn.addEventListener('click', () => categoryModal.style.display = 'none');
    addCategoryBtn.addEventListener('click', () => {
        const name = newCategoryInput.value;
        if (todoManager.addCategory(name)) {
            newCategoryInput.value = '';
            render();
        }
    });
    categoryList.addEventListener('click', (e) => {
        // SVG 아이콘 클릭 시에도 올바른 버튼을 찾기 위해 closest 사용
        const deleteBtn = e.target.closest('.cat-delete-btn');
        const editBtn = e.target.closest('.cat-edit-btn');
        
        if (deleteBtn) {
            const id = deleteBtn.dataset.id;
            openCategoryDeleteModal(id);
        } else if (editBtn) {
            const id = editBtn.dataset.id;
            openCategoryEditModal(id);
        }
    });
    exportBtn.addEventListener('click', () => {
        fileHandler.exportToFile(
            todoManager.getTodos(), 
            todoManager.getCategories(),
            todoManager.getCompletedRepeatTodos()
        );
    });
    importBtn.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.txt';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file || !confirm('데이터를 가져오면 현재 모든 데이터가 덮어쓰여집니다. 계속하시겠습니까?')) return;
            try {
                const data = await fileHandler.importFromFile(file);
                console.log('가져온 데이터:', data);
                
                // 백업 데이터 검증
                const validationErrors = utils.validateBackupData(data);
                if (validationErrors.length > 0) {
                    throw new Error(`데이터 검증 실패:\n${validationErrors.join('\n')}`);
                }
                
                // 백업 데이터 통계 표시
                const stats = utils.getBackupStats(data);
                console.log('백업 데이터 통계:', stats);
                
                // 데이터 유효성 검사
                if (!data.todos || !Array.isArray(data.todos)) {
                    throw new Error('할 일 데이터가 올바르지 않습니다.');
                }
                if (!data.categories || !Array.isArray(data.categories)) {
                    throw new Error('카테고리 데이터가 올바르지 않습니다.');
                }
                
                // 기본 카테고리가 없는 경우 추가
                if (!data.categories.find(cat => cat.id === 'default')) {
                    data.categories.unshift({ id: 'default', name: '일반', createdAt: new Date('2020-01-01').toISOString() });
                }
                
                // 데이터 저장
                storage.saveTodos(data.todos);
                
                // 카테고리 순서 복원
                let finalCategories = data.categories;
                if (data.categoryOrder && data.categoryOrder.length > 0) {
                    // 백업된 순서대로 카테고리 재정렬
                    const orderedCategories = [];
                    data.categoryOrder.forEach(categoryId => {
                        const category = data.categories.find(c => c.id === categoryId);
                        if (category) {
                            orderedCategories.push(category);
                        }
                    });
                    // 순서에 없는 카테고리들도 추가
                    data.categories.forEach(category => {
                        if (!data.categoryOrder.includes(category.id)) {
                            orderedCategories.push(category);
                        }
                    });
                    finalCategories = orderedCategories;
                }
                storage.saveCategories(finalCategories);
                
                if (data.completedRepeatTodos) {
                    storage.saveCompletedRepeatTodos(data.completedRepeatTodos);
                }
                
                // 설정 복원
                if (data.settings) {
                    settings = { ...settings, ...data.settings };
                    storage.saveSettings(settings);
                    
                    // 개별 설정들도 별도로 저장하여 동기화
                    if (data.settings.notificationApiEnabled !== undefined) {
                        storage.saveNotificationApiEnabled(data.settings.notificationApiEnabled);
                    }
                    if (data.settings.aiFeatureEnabled !== undefined) {
                        storage.saveAiFeatureEnabled(data.settings.aiFeatureEnabled);
                    }
                    // API 키는 보안상 백업에서 제외하므로 복원하지 않음
                }
                
                // todoManager에 데이터 설정
                todoManager.setTodos(data.todos);
                todoManager.setCategories(finalCategories);
                todoManager.setCompletedRepeatTodos(data.completedRepeatTodos || []);
                
                // 반복 횟수 복원 및 완료 상태 동기화
                if (data.repeatCounts && window.notificationScheduler) {
                    console.log('[App] 반복 횟수 복원:', data.repeatCounts);
                    Object.entries(data.repeatCounts).forEach(([key, count]) => {
                        // repeatCounts Map에 직접 설정
                        window.notificationScheduler.setRepeatCount(key, count);
                    });
                    
                    // 완료 상태 동기화 (복원된 횟수와 반복 설정의 완료 상태 일치시키기)
                    data.todos.forEach(todo => {
                        if (todo.repeat && todo.repeat.type === 'interval' && todo.repeat.limit) {
                            const startCountKey = `${todo.id}-start`;
                            const dueCountKey = `${todo.id}-due`;
                            const startCount = data.repeatCounts[startCountKey] || 0;
                            const dueCount = data.repeatCounts[dueCountKey] || 0;
                            
                            // 완료 상태 업데이트
                            if (startCount >= todo.repeat.limit) {
                                todo.repeat.startCompleted = true;
                            }
                            if (dueCount >= todo.repeat.limit) {
                                todo.repeat.dueCompleted = true;
                            }
                            
                            console.log(`[App] 완료 상태 동기화: ${todo.text} - 시작:${startCount}/${todo.repeat.limit}(${todo.repeat.startCompleted ? '완료' : '진행'}), 마감:${dueCount}/${todo.repeat.limit}(${todo.repeat.dueCompleted ? '완료' : '진행'})`);
                        }
                    });
                }
                
                // 알림 스케줄러 재초기화 (데이터 복구 후)
                if (window.notificationScheduler) {
                    console.log('[App] 데이터 복구 후 알림 스케줄러 재초기화');
                    // 약간의 지연 후 재스케줄링 (데이터 로드 완료 보장)
                    setTimeout(() => {
                        window.notificationScheduler.rescheduleAllNotifications(todoManager.getTodos());
                        console.log('[App] 알림 스케줄러 재초기화 완료');
                    }, 100);
                }
                
                // UI 초기화 (AI 채팅 초기화 제외)
                initWithoutAiChat();
                
                // AI 채팅 재초기화 (중복 방지 로직 포함)
                if (window.aiChat && window.aiChat.clearHistory) {
                    window.aiChat.clearHistory();
                }
                if (window.aiChat && window.aiChat.init) {
                    window.aiChat.init();
                }
                
                // 성공 메시지에 통계 정보 포함
                const successMessage = `데이터를 성공적으로 가져왔습니다.\n\n` +
                    `📊 복구된 데이터:\n` +
                    `• 할 일: ${stats.totalTodos}개 (완료: ${stats.completedTodos}개)\n` +
                    `• 일정 설정: ${stats.todosWithSchedule}개\n` +
                    `• 반복 설정: ${stats.todosWithRepeat}개\n` +
                    `• 카테고리: ${stats.totalCategories}개\n` +
                    `• 완료된 반복 할 일: ${stats.completedRepeatTodos}개\n` +
                    `• 설정: ${data.settings ? '복원됨' : '기본값 사용'}`;
                
                alert(successMessage);
            } catch (error) {
                console.error('데이터 가져오기 실패:', error);
                alert(`데이터 가져오기에 실패했습니다:\n${error.message}`);
            }
        };
        input.click();
    });
    projectViewBtn.addEventListener('click', () => {
        currentView = 'project';
        renderTodos();
    });
    allViewBtn.addEventListener('click', () => {
        currentView = 'all';
        renderTodos();
    });
    globalSettingsBtn.addEventListener('click', openSettingsSidebar);
    closeSettingsSidebar.addEventListener('click', closeSettingsSidebarFn);
    settingsSidebarOverlay.addEventListener('click', closeSettingsSidebarFn);
    
    // 타이머 버튼 이벤트 리스너
    if (timerBtn) {
        timerBtn.addEventListener('click', openTimerSidebar);
    }

    // 설정 사이드바 내부 토글 이벤트 리스너 (동적으로 생성되는 요소들은 나중에 추가됨)
    


    // 카테고리 삭제 모달 이벤트 리스너
    closeCategoryDeleteModalBtn.addEventListener('click', closeCategoryDeleteModal);
    cancelCategoryDeleteBtn.addEventListener('click', closeCategoryDeleteModal);
    confirmCategoryDeleteBtn.addEventListener('click', confirmCategoryDelete);
    categoryDeleteModal.addEventListener('click', (e) => {
        if (e.target === categoryDeleteModal) closeCategoryDeleteModal();
    });

    // 카테고리 편집 모달 이벤트 리스너
    closeCategoryEditModalBtn.addEventListener('click', closeCategoryEditModal);
    cancelCategoryEditBtn.addEventListener('click', closeCategoryEditModal);
    saveCategoryEditBtn.addEventListener('click', saveCategoryEdit);
    categoryEditModal.addEventListener('click', (e) => {
        if (e.target === categoryEditModal) closeCategoryEditModal();
    });

    // 카테고리 순서 편집 모달 이벤트 리스너
    editCategoryOrderBtn.addEventListener('click', openCategoryOrderModal);
    closeCategoryOrderModalBtn.addEventListener('click', closeCategoryOrderModal);
    cancelCategoryOrderBtn.addEventListener('click', cancelCategoryOrder);
    saveCategoryOrderBtn.addEventListener('click', saveCategoryOrder);
    applySortBtn.addEventListener('click', applySort);
    categoryOrderModal.addEventListener('click', (e) => {
        if (e.target === categoryOrderModal) closeCategoryOrderModal();
    });
    
    // Enter 키로 저장
    editCategoryName.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            saveCategoryEdit();
        }
    });
    
    // 카테고리 추가 입력창에서 Enter 키로 추가
    newCategoryInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const name = newCategoryInput.value.trim();
            if (name && todoManager.addCategory(name)) {
                newCategoryInput.value = '';
                render();
            }
        }
    });

    // 일정 설정 모달 이벤트 리스너들
    closeScheduleModalBtn.addEventListener('click', closeScheduleModal);
    cancelScheduleBtn.addEventListener('click', closeScheduleModal);
    saveScheduleBtn.addEventListener('click', saveSchedule);

    // 체크박스 변경 시 입력 필드 활성화/비활성화
    startTimeEnabled.addEventListener('change', (e) => {
        if (e.target.checked) {
            startTimeInputs.classList.add('enabled');
            // 현재 날짜/시간으로 기본값 설정
            const now = new Date();
            // 로컬 타임존 기준으로 날짜와 시간 설정
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');

            startDate.value = `${year}-${month}-${day}`;
            startTime.value = `${hours}:${minutes}`;
        } else {
            startTimeInputs.classList.remove('enabled');
        }
    });

    dueTimeEnabled.addEventListener('change', (e) => {
        if (e.target.checked) {
            dueTimeInputs.classList.add('enabled');
            // 현재 날짜/시간으로 기본값 설정
            const now = new Date();
            now.setHours(now.getHours() + 1); // 1시간 후로 설정

            // 로컬 타임존 기준으로 날짜와 시간 설정
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');

            dueDate.value = `${year}-${month}-${day}`;
            dueTime.value = `${hours}:${minutes}`;
        } else {
            dueTimeInputs.classList.remove('enabled');
        }
    });

    // 알림 모달 토글 버튼들
    startModalBtn.addEventListener('click', () => {
        const currentEnabled = startModalBtn.dataset.enabled === 'true';
        startModalBtn.dataset.enabled = currentEnabled ? 'false' : 'true';
        updateNotificationButtons();
    });

    dueModalBtn.addEventListener('click', () => {
        const currentEnabled = dueModalBtn.dataset.enabled === 'true';
        dueModalBtn.dataset.enabled = currentEnabled ? 'false' : 'true';
        updateNotificationButtons();
    });

    // 알림 소리 토글 버튼들
    startNotificationBtn.addEventListener('click', () => {
        const currentEnabled = startNotificationBtn.dataset.enabled === 'true';
        startNotificationBtn.dataset.enabled = currentEnabled ? 'false' : 'true';
        updateNotificationButtons();
    });

    dueNotificationBtn.addEventListener('click', () => {
        const currentEnabled = dueNotificationBtn.dataset.enabled === 'true';
        dueNotificationBtn.dataset.enabled = currentEnabled ? 'false' : 'true';
        updateNotificationButtons();
    });

    // 모달 외부 클릭 시 닫기
    window.addEventListener('click', (e) => {
        if (e.target === categoryModal) categoryModal.style.display = 'none';
        if (e.target === scheduleModal) closeScheduleModal();
        if (e.target === repeatModal) closeRepeatModal();
        if (e.target === settingsSidebar) closeSettingsSidebarFn();
        if (e.target === settingsSidebarOverlay) closeSettingsSidebarFn();
    });

    // 주기적인 소리 상태 업데이트 (사용자 인터랙션 후에만, 10초마다)
    setInterval(() => {
        if (hasUserInteracted) { // 사용자가 인터랙션한 경우에만 주기적 확인
            updateAudioStatus();
        }
    }, 60 * 1000); // 60초마다
    
    // 사용자 클릭 시 소리 상태 즉시 업데이트 및 소리 멈추기
    let lastClickTime = 0;
    document.addEventListener('click', (e) => {
        const now = Date.now();
        
        // 소리 상태 버튼 클릭이 아닌 경우에만 소리 멈추기
        if (!e.target.closest('#audio-status-btn')) {
            // notificationScheduler의 소리 중지 (모달 닫기로 처리됨)
            console.log('[App] 소리 재생 중지');
            
            // 소리 상태 버튼이 아닌 클릭에서만 상태 확인 (중복 방지)
            if (now - lastClickTime > 2000) {
                lastClickTime = now;
                updateAudioStatus();
            }
        }
    }, { once: false });

    init();
    
    // 전역으로 렌더 함수 노출 (외부 모듈에서 UI 업데이트를 위해)
    window.app = {
        renderTodos: renderTodos,
        renderCategories: () => { renderCategorySelector(); renderCategoryList(); },
        
        // Service Worker 알림 처리 함수들
        handleNotificationShown: (data) => {
            console.log('[App] Service Worker 알림 표시됨:', data);
            // UI 업데이트
            renderTodos();
        },
        
        handleNotificationClicked: (data) => {
            console.log('[App] Service Worker 알림 클릭됨:', data);
            // 알림 클릭 시 특별한 처리 (필요시)
        },
        
        handleNotificationClosed: (data) => {
            console.log('[App] Service Worker 알림 닫힘:', data);
            // 알림 닫힘 시 특별한 처리 (필요시)
        },
        
        // Service Worker에서 호출할 수 있도록 소리 재생 함수를 전역으로 노출
        playNotificationSound: () => {
            console.log('[App] Service Worker에서 요청한 알림 소리 재생');
            if (window.notificationScheduler && window.notificationScheduler.playNotificationSound) {
                window.notificationScheduler.playNotificationSound();
            } else {
                console.warn('[App] notificationScheduler.playNotificationSound를 찾을 수 없습니다');
            }
        }
    };

    // Google Drive 동기화 모듈
    const googleDriveSync = (() => {
        let isSignedIn = false;
        let drive = null;
        let config = null;
        let autoSyncEnabled = false;
        let autoSyncInterval = null;
        let lastSyncTime = null;
        let syncInProgress = false;
        let deletedItemIds = new Set();
        let tokenClient = null; // GIS token client
        let currentUserInfo = null; // Store user profile info

        // 로컬 시간대 기준 날짜 문자열 생성
        const getLocalDateString = () => {
            const now = new Date();
            const utcDate = now.toISOString().split('T')[0];
            const localDate = new Date(now.getTime() - (now.getTimezoneOffset() * 60000));
            const localDateStr = localDate.toISOString().split('T')[0];
            
            console.log('🗓️ 시간대 정보:', {
                현재_로컬시간: now.toLocaleString('ko-KR'),
                UTC_날짜: utcDate,
                로컬_날짜: localDateStr,
                시간대_오프셋: `UTC${now.getTimezoneOffset() > 0 ? '-' : '+'}${Math.abs(now.getTimezoneOffset() / 60)}`
            });
            
            return localDateStr;
        };

        // 초기화
        const initialize = async () => {
            try {
                console.log('Google Drive 환경 변수 로드 시작...');
                config = await utils.loadGoogleDriveConfig();
                console.log('환경 변수 로드 결과:', {
                    ...config, 
                    apiKey: config.apiKey ? '[설정됨]' : '[누락]',
                    clientId: config.clientId ? config.clientId.substring(0, 10) + '***' : '[누락]'
                });
                if (!config) {
                    throw new Error('Google Drive 설정을 로드할 수 없습니다.');
                }

                console.log('Google Identity Services (GIS) 초기화 시작...');
                await loadGoogleIdentityServices();
                console.log('Google API 클라이언트 초기화 시작...');
                
                // Google API 클라이언트 초기화 (Drive API용)
                await new Promise((resolve, reject) => {
                    try {
                        if (!window.gapi || typeof window.gapi.load !== 'function') {
                            reject(new Error('Google API 객체가 사용할 수 없습니다.'));
                            return;
                        }
                        
                        window.gapi.load('client', async () => {
                            try {
                                console.log('gapi.client.init 호출...');
                                await window.gapi.client.init({
                                    apiKey: config.apiKey,
                                    discoveryDocs: config.discoveryDocs
                                });
                                
                                drive = window.gapi.client.drive;
                                console.log('Google Drive API 클라이언트 초기화 완료');
                                resolve();
                            } catch (error) {
                                console.error('Google API 클라이언트 초기화 오류:', error);
                                reject(error);
                            }
                        });
                    } catch (error) {
                        console.error('Google API load 호출 오류:', error);
                        reject(error);
                    }
                });

                // Google Identity Services 초기화
                if (window.google && window.google.accounts) {
                    console.log('Google Identity Services 초기화...');
                    console.log('[GoogleDrive] OAuth 설정 확인:', {
                        clientId: config.clientId ? '[설정됨]' : '[누락]',
                        scope: config.scope ? '[설정됨]' : '[누락]'
                    });
                    
                    // OAuth2 토큰 클라이언트 초기화
                    window.tokenClient = window.google.accounts.oauth2.initTokenClient({
                        client_id: config.clientId,
                        scope: config.scope,
                        callback: (response) => {
                            if (response.error) {
                                console.error('토큰 획득 실패:', response.error);
                                return;
                            }
                            console.log('액세스 토큰 획득 성공');
                            isSignedIn = true;
                            const tokenData = {
                                access_token: response.access_token,
                                expires_at: Date.now() + (response.expires_in || 3600) * 1000 // 만료 시간 저장
                            };
                            gapi.client.setToken(tokenData);
                            
                            // 토큰을 localStorage에 저장
                            try {
                                localStorage.setItem('mwohaji-gdrive-token', JSON.stringify(tokenData));
                                console.log(' 토큰 저장 완료');
                            } catch (error) {
                                console.warn('토큰 저장 실패:', error);
                            }
                            
                            // 사용자 정보 가져오기
                            fetchUserInfo().then(() => {
                                // 토큰 만료 스케줄링 시작
                                scheduleTokenExpiry();
                                onAuthStateChanged(true);
                            }).catch(error => {
                                console.warn('사용자 정보 가져오기 실패, 기본값으로 진행:', error);
                                // 토큰 만료 스케줄링 시작
                                scheduleTokenExpiry();
                                onAuthStateChanged(true);
                            });
                        }
                    });
                    
                    // 설정 로드 (토큰 복원 이전에 실행)
                    loadSettings();
                    console.log('⚙️ 설정 로드 완료, 이제 토큰 복원 시작...');
                    
                    // localStorage에서 저장된 토큰 복원
                    try {
                        const savedTokenStr = localStorage.getItem('mwohaji-gdrive-token');
                        if (savedTokenStr) {
                            const savedToken = JSON.parse(savedTokenStr);
                            console.log(' 저장된 토큰 발견');
                            
                            // 토큰 만료 시간 확인
                            if (savedToken.expires_at && Date.now() < savedToken.expires_at) {
                                console.log(' 저장된 토큰이 유효함, 복원 시도');
                                
                                // 토큰 설정
                                window.gapi.client.setToken({
                                    access_token: savedToken.access_token
                                });
                                
                                // 토큰 유효성 검증을 위해 사용자 정보 가져오기
                                try {
                                    const userInfoResponse = await fetch(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${savedToken.access_token}`);
                                    if (userInfoResponse.ok) {
                                        const userInfo = await userInfoResponse.json();
                                        window.currentUserInfo = userInfo;
                                        isSignedIn = true;
                                        console.log('토큰 복원 및 자동 로그인 성공');
                                        
                                        // 토큰 만료 스케줄링 시작
                                        scheduleTokenExpiry();
                                        console.log(' 자동 동기화 상태 확인:', {
                                            autoSyncEnabled: autoSyncEnabled,
                                            isSignedIn: isSignedIn
                                        });
                                        onAuthStateChanged(true);
                                    } else {
                                        console.log(' 저장된 토큰이 유효하지 않음, 제거');
                                        localStorage.removeItem('mwohaji-gdrive-token');
                                        window.gapi.client.setToken(null);
                                    }
                                } catch (error) {
                                    console.warn(' 저장된 토큰 검증 실패, 제거:', error);
                                    localStorage.removeItem('mwohaji-gdrive-token');
                                    window.gapi.client.setToken(null);
                                }
                            } else {
                                console.log(' 저장된 토큰이 만료됨, 제거');
                                localStorage.removeItem('mwohaji-gdrive-token');
                            }
                        } else {
                            console.log(' 저장된 토큰 없음');
                        }
                    } catch (error) {
                        console.log(' 저장된 토큰 확인 중 오류:', error.message);
                        localStorage.removeItem('mwohaji-gdrive-token');
                    }
                    
                } else {
                    throw new Error('Google Identity Services를 로드할 수 없습니다.');
                }

                return true;
            } catch (error) {
                console.error('Google Drive API 초기화 실패:', error);
                throw error;
            }
        };

        const loadGoogleAPI = () => {
            return new Promise((resolve, reject) => {
                if (window.gapi) {
                    resolve();
                    return;
                }

                const script = document.createElement('script');
                script.src = 'https://apis.google.com/js/api.js';
                script.onload = () => {
                    // gapi 객체가 사용가능할 때까지 기다림 (최대 10초)
                    let attempts = 0;
                    const maxAttempts = 100; // 10초 (100ms * 100회)
                    const checkGapi = () => {
                        if (window.gapi && typeof window.gapi.load === 'function') {
                            console.log('Google API 스크립트 로드 완료');
                            resolve();
                        } else if (attempts < maxAttempts) {
                            attempts++;
                            setTimeout(checkGapi, 100);
                        } else {
                            reject(new Error('Google API 객체 로드 시간 초과'));
                        }
                    };
                    checkGapi();
                };
                script.onerror = () => reject(new Error('Google API 스크립트 로드 실패'));
                document.head.appendChild(script);
            });
        };

        const loadGoogleIdentityServices = () => {
            return new Promise((resolve, reject) => {
                // Google API 먼저 로드
                loadGoogleAPI().then(() => {
                    // Google Identity Services 스크립트 로드
                    if (window.google && window.google.accounts) {
                        resolve();
                        return;
                    }

                    const gisScript = document.createElement('script');
                    gisScript.src = 'https://accounts.google.com/gsi/client';
                    gisScript.onload = () => {
                        let attempts = 0;
                        const maxAttempts = 100;
                        const checkGIS = () => {
                            if (window.google && window.google.accounts && window.google.accounts.oauth2) {
                                console.log('Google Identity Services 로드 완료');
                                resolve();
                            } else if (attempts < maxAttempts) {
                                attempts++;
                                setTimeout(checkGIS, 100);
                            } else {
                                reject(new Error('Google Identity Services 로드 시간 초과'));
                            }
                        };
                        checkGIS();
                    };
                    gisScript.onerror = () => reject(new Error('Google Identity Services 스크립트 로드 실패'));
                    document.head.appendChild(gisScript);
                }).catch(reject);
            });
        };

        const onAuthStateChanged = (signedIn) => {
            isSignedIn = signedIn;
            if (signedIn) {
                console.log('🔄 [onAuthStateChanged] Google Drive에 로그인되었습니다.');
                console.log('🔄 [onAuthStateChanged] 자동 동기화 상태 확인:', {
                    autoSyncEnabled: autoSyncEnabled,
                    autoSyncInterval: autoSyncInterval ? 'active' : 'inactive'
                });
                if (autoSyncEnabled) {
                    console.log('🔄 [onAuthStateChanged] 자동 동기화 시작 호출...');
                    startAutoSync();
                } else {
                    console.log('🔄 [onAuthStateChanged] 자동 동기화가 비활성화되어 있음');
                }
            } else {
                console.log('🔄 [onAuthStateChanged] Google Drive에서 로그아웃되었습니다.');
                stopAutoSync();
            }
            if (window.updateGoogleDriveUI) {
                window.updateGoogleDriveUI();
            }
        };

        const signIn = async () => {
            try {
                if (!window.tokenClient) {
                    throw new Error('Google Identity Services가 초기화되지 않았습니다.');
                }
                
                // 완전한 토큰 정리 및 캐시 제거
                console.log('[GoogleDrive] 완전한 토큰 정리 시작...');
                
                // 1. 기존 gapi 토큰 제거
                const existingToken = window.gapi.client.getToken();
                if (existingToken && existingToken.access_token) {
                    console.log('[GoogleDrive] 기존 토큰 무효화...');
                    try {
                        window.google.accounts.oauth2.revoke(existingToken.access_token, () => {
                            console.log('[GoogleDrive] 토큰 무효화 완료');
                        });
                    } catch (revokeError) {
                        console.warn('[GoogleDrive] 토큰 무효화 실패 (무시):', revokeError);
                    }
                    window.gapi.client.setToken(null);
                }
                
                // 2. 브라우저 캐시 완전 정리
                try {
                    // Google 관련 localStorage 항목 제거
                    Object.keys(localStorage).forEach(key => {
                        if (key.includes('google') || key.includes('gapi') || key.includes('oauth')) {
                            localStorage.removeItem(key);
                            console.log('[GoogleDrive] localStorage 제거:', key);
                        }
                    });
                    
                    // Google 관련 sessionStorage 항목 제거  
                    Object.keys(sessionStorage).forEach(key => {
                        if (key.includes('google') || key.includes('gapi') || key.includes('oauth')) {
                            sessionStorage.removeItem(key);
                            console.log('[GoogleDrive] sessionStorage 제거:', key);
                        }
                    });
                } catch (storageError) {
                    console.warn('[GoogleDrive] 스토리지 정리 실패 (무시):', storageError);
                }
                
                // 3. 사용자 정보 초기화
                window.currentUserInfo = null;
                isSignedIn = false;
                
                console.log('[GoogleDrive] 토큰 정리 완료');
                
                return new Promise(async (resolve, reject) => {
                    try {
                        // 토큰 요청
                        window.tokenClient.callback = async (response) => {
                            if (response.error) {
                                console.error('토큰 획득 실패:', response.error);
                                reject(new Error('로그인에 실패했습니다.'));
                                return;
                            }
                            
                            console.log('[GoogleDrive] 액세스 토큰 획득 성공!');
                            console.log('[GoogleDrive] 토큰 응답 상세:', {
                                hasAccessToken: !!response.access_token,
                                scope: response.scope,
                                hasUserinfoEmail: response.scope?.includes('userinfo.email'),
                                hasUserinfoProfile: response.scope?.includes('userinfo.profile'),
                                hasDriveFile: response.scope?.includes('drive.file'),
                                tokenType: response.token_type,
                                expiresIn: response.expires_in
                            });
                            
                            if (!response.scope?.includes('userinfo.email')) {
                                console.error('[GoogleDrive] 오류: 토큰에 userinfo.email 권한이 없습니다!');
                                console.log('[GoogleDrive] 받은 scope:', response.scope);
                                console.log('[GoogleDrive] 필요한 scope: userinfo.email, userinfo.profile');
                            }
                            
                            // 토큰 데이터 준비 및 저장
                            const tokenData = {
                                access_token: response.access_token,
                                expires_at: Date.now() + (response.expires_in || 3600) * 1000 // 만료 시간 저장
                            };
                            
                            window.gapi.client.setToken(tokenData);
                            
                            // 토큰을 localStorage에 저장
                            try {
                                localStorage.setItem('mwohaji-gdrive-token', JSON.stringify(tokenData));
                                console.log(' 토큰 저장 완료');
                            } catch (error) {
                                console.warn('토큰 저장 실패:', error);
                            }
                            
                            // userinfo API로 사용자 정보 가져오기
                            
                            // 실제 사용자 정보 가져오기
                            try {
                                await fetchUserInfo();
                                isSignedIn = true;
                                // 토큰 만료 스케줄링 시작
                                scheduleTokenExpiry();
                                onAuthStateChanged(true);
                                resolve(true);
                            } catch (userInfoError) {
                                console.error('[GoogleDrive] 사용자 정보 가져오기 실패, 기본값으로 진행:', userInfoError);
                                // 사용자 정보 가져오기 실패해도 로그인은 성공으로 처리
                                isSignedIn = true;
                                // 토큰 만료 스케줄링 시작
                                scheduleTokenExpiry();
                                onAuthStateChanged(true);
                                resolve(true);
                            }
                        };
                        
                        // 완전히 새로운 권한으로 토큰 요청
                        console.log('[GoogleDrive] 새로운 userinfo 권한으로 토큰 요청 시작...');
                        
                        // 새로운 tokenClient 생성 (최신 scope 적용)
                        const config = await utils.loadGoogleDriveConfig();
                        console.log('[GoogleDrive] 최신 scope 설정:', config.scope);
                        
                        window.tokenClient = window.google.accounts.oauth2.initTokenClient({
                            client_id: config.clientId,
                            scope: config.scope,
                            callback: window.tokenClient.callback  // 현재 콜백 유지
                        });
                        
                        // 강제 권한 재요청
                        window.tokenClient.requestAccessToken({ 
                            prompt: 'select_account consent',  // 계정 선택 + 권한 재동의 강제
                            include_granted_scopes: false,    // 기존 권한 무시
                            enable_granular_consent: true     // 세분화된 권한 동의
                        });
                    } catch (error) {
                        reject(error);
                    }
                });
            } catch (error) {
                console.error('로그인 실패:', error);
                utils.showToast('로그인에 실패했습니다.', 'error');
                throw error;
            }
        };

        const signOut = async () => {
            try {
                const token = window.gapi.client.getToken();
                if (token) {
                    window.google.accounts.oauth2.revoke(token.access_token, () => {
                        console.log('토큰 해제 완료');
                    });
                    window.gapi.client.setToken(null);
                }
                
                // localStorage에서 토큰 제거
                try {
                    localStorage.removeItem('mwohaji-gdrive-token');
                    console.log(' 저장된 토큰 제거 완료');
                } catch (error) {
                    console.warn('저장된 토큰 제거 실패:', error);
                }
                
                window.currentUserInfo = null;
                isSignedIn = false;
                onAuthStateChanged(false);
                return true;
            } catch (error) {
                console.error('로그아웃 실패:', error);
                utils.showToast('로그아웃에 실패했습니다.', 'error');
                throw error;
            }
        };

        // Google userinfo API로 사용자 정보 가져오기
        const fetchUserInfo = async () => {
            try {
                console.log('[GoogleDrive] 사용자 정보 가져오기 시작...');
                
                const token = window.gapi.client.getToken();
                if (!token || !token.access_token) {
                    throw new Error('액세스 토큰이 없습니다.');
                }
                
                // 토큰의 실제 권한 확인
                try {
                    console.log('[GoogleDrive] 토큰 권한 확인...');
                    const tokenInfoResponse = await fetch(`https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${token.access_token}`);
                    if (tokenInfoResponse.ok) {
                        const tokenInfo = await tokenInfoResponse.json();
                        console.log('[GoogleDrive] 토큰 실제 권한:', {
                            scope: tokenInfo.scope,
                            hasUserinfoEmail: tokenInfo.scope?.includes('userinfo.email'),
                            hasUserinfoProfile: tokenInfo.scope?.includes('userinfo.profile')
                        });
                        
                        if (!tokenInfo.scope?.includes('userinfo.email')) {
                            throw new Error('토큰에 userinfo.email 권한이 없습니다. 재로그인이 필요합니다.');
                        }
                    }
                } catch (tokenInfoError) {
                    console.error('[GoogleDrive] 토큰 정보 확인 오류:', tokenInfoError);
                }
                
                // Google userinfo API 호출
                console.log('[GoogleDrive] userinfo API 호출...');
                const response = await fetch('https://www.googleapis.com/oauth2/v1/userinfo?alt=json', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token.access_token}`
                    }
                });
                
                if (!response.ok) {
                    throw new Error(`userinfo API 요청 실패: ${response.status} ${response.statusText}`);
                }
                
                const userInfo = await response.json();
                console.log('[GoogleDrive] 사용자 정보 수신 성공:', {
                    id: userInfo.id,
                    email: userInfo.email,
                    name: userInfo.name,
                    picture: userInfo.picture ? '[있음]' : '[없음]'
                });
                
                // 전역 사용자 정보 설정
                window.currentUserInfo = {
                    id: userInfo.id,
                    email: userInfo.email,
                    name: userInfo.name,
                    picture: userInfo.picture
                };
                
                return userInfo;
            } catch (error) {
                console.error('[GoogleDrive] 사용자 정보 가져오기 실패:', error);
                // 폴백: 기본값 설정  
                window.currentUserInfo = {
                    id: 'google_user',
                    email: '로그인됨',
                    name: 'Google 사용자',
                    picture: ''
                };
                throw error;
            }
        };

        const getCurrentUser = () => {
            if (!isSignedIn || !window.currentUserInfo) return null;
            
            return {
                id: window.currentUserInfo.id,
                name: window.currentUserInfo.name,
                email: window.currentUserInfo.email,
                imageUrl: window.currentUserInfo.picture
            };
        };

        const sync = async () => {
            if (syncInProgress) {
                console.log('동기화가 이미 진행 중입니다.');
                return;
            }

            if (!isSignedIn) {
                throw new Error('Google Drive에 로그인이 필요합니다.');
            }

            syncInProgress = true;
            if (window.updateGoogleDriveUI) {
                window.updateGoogleDriveUI();
            }

            try {
                console.log('🔄 [Google Drive 동기화] 시작...');
                
                console.log('📥 [단계 1] 로컬 데이터 읽기...');
                const localData = await getLocalData();
                console.log('📥 로컬 데이터:', {
                    todosCount: localData.todos.length,
                    categoriesCount: localData.categories?.length || 0,
                    deletedItemsCount: localData.metadata.deletedItemIds.length,
                    lastModified: localData.metadata.lastModified
                });
                
                console.log('☁️ [단계 2] 원격 데이터 읽기...');
                const remoteData = await getRemoteData();
                console.log('☁️ 원격 데이터:', {
                    todosCount: remoteData.todos.length,
                    categoriesCount: remoteData.categories?.length || 0,
                    deletedItemsCount: remoteData.metadata.deletedItemIds.length,
                    lastModified: remoteData.metadata.lastModified
                });
                
                console.log('🔀 [단계 3] 데이터 병합 시작...');
                const syncResult = performSync(localData, remoteData);
                console.log('🔀 병합 결과:', {
                    localChanges: syncResult.localChanges.length,
                    remoteChanges: syncResult.remoteChanges.length,
                    totalMergedTodos: syncResult.mergedData.todos.length,
                    totalMergedCategories: syncResult.mergedData.categories?.length || 0
                });
                
                if (syncResult.localChanges.length > 0) {
                    console.log('💾 [단계 4] 로컬 데이터 저장...');
                    await saveLocalData(syncResult.mergedData);
                    console.log('💾 로컬 저장 완료');
                }
                
                // 동기화가 발생했으면 항상 원격에도 저장 (최신 상태 유지)
                if (syncResult.localChanges.length > 0 || syncResult.remoteChanges.length > 0) {
                    console.log('☁️ [단계 5] 원격 데이터 저장...');
                    await saveRemoteData(syncResult.mergedData);
                    console.log('☁️ 원격 저장 완료');
                } else {
                    console.log('☁️ 변경사항 없음, 원격 저장 건너뜀');
                }
                
                lastSyncTime = new Date();
                // 마지막 동기화 시간을 localStorage에 저장
                try {
                    localStorage.setItem('mwohaji-lastSyncTime', lastSyncTime.toISOString());
                    console.log('✅ 마지막 동기화 시간 저장:', lastSyncTime.toISOString());
                } catch (error) {
                    console.warn('마지막 동기화 시간 저장 실패:', error);
                }
                
                console.log(`✅ [동기화 완료] 로컬 ${syncResult.localChanges.length}개, 원격 ${syncResult.remoteChanges.length}개 변경`);
                console.log('✅ 마지막 동기화 시간:', lastSyncTime.toISOString());
                utils.showToast('동기화가 완료되었습니다.', 'success');
                
            } catch (error) {
                console.error('❌ [동기화 실패]:', error);
                console.error('❌ 오류 상세:', {
                    message: error.message,
                    stack: error.stack
                });
                
                // 동기화 실패해도 앱은 계속 동작 (로컬 기능은 독립적)
                const userMessage = error.message?.includes('로그인') 
                    ? '동기화에 실패했습니다. Google Drive 연결을 확인해주세요.'
                    : '동기화에 실패했습니다. 로컬에서는 정상 동작합니다.';
                    
                utils.showToast(userMessage, 'error');
                
                // 동기화 실패는 앱 전체를 중단시키지 않음
                return { success: false, error: error.message };
            } finally {
                syncInProgress = false;
                if (window.updateGoogleDriveUI) {
                    window.updateGoogleDriveUI();
                }
            }
        };

        const getLocalData = async () => {
            try {
                console.log('💾 로컬 데이터 읽기 시작...');
                
                // todoManager와 storage 모두에서 확인
                let todos = [];
                
                // 1차: todoManager에서 가져오기 (현재 메모리 상태)
                if (window.todoManager && window.todoManager.getTodos) {
                    todos = window.todoManager.getTodos() || [];
                    console.log('💾 todoManager에서 todos 읽기:', todos.length + '개');
                }
                
                // 2차: storage에서 가져오기 (빈 경우)
                if (todos.length === 0) {
                    try {
                        todos = storage.getTodos() || [];
                        console.log('💾 storage에서 todos 읽기:', todos.length + '개');
                    } catch (error) {
                        console.warn('💾 Storage에서 todos 읽기 실패:', error);
                        todos = [];
                    }
                }
                
                console.log('💾 최종 로컬 todos:', todos.length + '개');
                if (todos.length > 0) {
                    console.log('💾 첫 번째 todo 샘플:', {
                        id: todos[0].id,
                        text: todos[0].text.substring(0, 30) + '...',
                        category: todos[0].category
                    });
                }
                
                // 카테고리 정보도 함께 가져오기
                let categories = [];
                if (window.todoManager && window.todoManager.getCategories) {
                    categories = window.todoManager.getCategories() || [];
                    console.log('💾 로컬 카테고리:', categories.length + '개');
                } else {
                    try {
                        categories = storage.getCategories() || [];
                        console.log('💾 storage에서 카테고리 읽기:', categories.length + '개');
                    } catch (error) {
                        console.warn('💾 카테고리 읽기 실패:', error);
                        categories = [];
                    }
                }
                
                const metadata = {
                    lastModified: new Date().toISOString(),
                    version: '1.0',
                    deletedItemIds: Array.from(deletedItemIds)
                };
                
                console.log('💾 로컬 데이터 준비 완료:', {
                    todosCount: todos.length,
                    categoriesCount: categories.length,
                    deletedItemsCount: metadata.deletedItemIds.length
                });
                
                return { todos, categories, metadata };
            } catch (error) {
                console.error('로컬 데이터 읽기 실패:', error);
                return { todos: [], categories: [], metadata: { lastModified: new Date().toISOString(), version: '1.0', deletedItemIds: [] } };
            }
        };

        // 토큰 만료 체크만 (자동 갱신 시도 안함)
        const isTokenExpired = () => {
            try {
                const savedTokenStr = localStorage.getItem('mwohaji-gdrive-token');
                if (!savedTokenStr) return true;
                
                const savedToken = JSON.parse(savedTokenStr);
                const currentTime = Date.now();
                const tokenExpiresAt = savedToken.expires_at || 0;
                
                return currentTime >= tokenExpiresAt;
            } catch (error) {
                return true;
            }
        };
        

        
        // API 호출 시 오류 자동 재시도 래퍼 함수 (개선된 버전)
        const executeApiWithRetry = async (apiCall, maxRetries = 2) => {
            let lastError = null;
            
            for (let attempt = 0; attempt <= maxRetries; attempt++) {
                try {
                    return await apiCall();
                } catch (error) {
                    lastError = error;
                    const errorStatus = error.status || error.code;
                    
                    console.log(`❌ API 호출 오류 (시도 ${attempt + 1}/${maxRetries + 1}):`, {
                        status: errorStatus,
                        message: error.message,
                        details: error.result?.error || error
                    });
                    
                    // 401 Unauthorized - 토큰 만료, 재로그인 필요
                    if (errorStatus === 401) {
                        console.log(' 401 오류: 토큰 만료됨, 재로그인 필요');
                        throw new Error('토큰이 만료되었습니다. 다시 로그인해주세요.');
                    }
                    
                    // 429 Too Many Requests - 지수 백오프로 재시도
                    if (errorStatus === 429 && attempt < maxRetries) {
                        const delayMs = Math.min(1000 * Math.pow(2, attempt), 8000); // 최대 8초
                        console.log(`⏳ 429 오류: ${delayMs}ms 대기 후 재시도...`);
                        await new Promise(resolve => setTimeout(resolve, delayMs));
                        continue;
                    }
                    
                    // 500/502/503 Server Error - 짧은 대기 후 재시도
                    if ((errorStatus >= 500 && errorStatus <= 503) && attempt < maxRetries) {
                        const delayMs = 1000 + Math.random() * 1000; // 1~2초 랜덤 대기
                        console.log(`⏳ ${errorStatus} 서버 오류: ${delayMs.toFixed(0)}ms 대기 후 재시도...`);
                        await new Promise(resolve => setTimeout(resolve, delayMs));
                        continue;
                    }
                    
                    // 403 Forbidden - 권한 문제, 재시도 불가
                    if (errorStatus === 403) {
                        console.error('❌ 권한 오류: API 접근 권한이 없습니다.');
                        throw new Error('API 접근 권한이 없습니다. Google Cloud Console에서 권한을 확인해주세요.');
                    }
                    
                    // 네트워크 오류 또는 타임아웃 - 재시도
                    if ((error.message?.includes('fetch') || 
                         error.message?.includes('network') || 
                         error.message?.includes('timeout') ||
                         error.code === 'NetworkError') && attempt < maxRetries) {
                        const delayMs = 2000 + Math.random() * 2000; // 2~4초 랜덤 대기
                        console.log(`⏳ 네트워크 오류: ${delayMs.toFixed(0)}ms 대기 후 재시도...`);
                        await new Promise(resolve => setTimeout(resolve, delayMs));
                        continue;
                    }
                    
                    // 기타 오류는 재시도하지 않음
                    throw error;
                }
            }
            
            throw lastError;
        };

        const getRemoteData = async () => {
            try {
                // 토큰 만료 체크 (만료되면 바로 실패)
                if (isTokenExpired()) {
                    throw new Error('토큰이 만료되었습니다. 다시 로그인해주세요.');
                }
                
                // 고정된 파일명 사용 (날짜별 분리하지 않음)
                const fileName = 'mwohaji_sync.json';
                console.log('원격 파일 검색:', fileName);
                
                const response = await executeApiWithRetry(() => 
                    window.gapi.client.drive.files.list({
                        q: `name='${fileName}' and trashed=false`,
                        spaces: 'drive',
                        fields: 'files(id, name)'
                    })
                );

                if (!response.result.files || response.result.files.length === 0) {
                    console.log('원격 파일 없음, 빈 데이터 반환');
                    return { todos: [], categories: [], metadata: { lastModified: new Date().toISOString(), version: '1.0', deletedItemIds: [] } };
                }

                const fileId = response.result.files[0].id;
                console.log('원격 파일 발견, 내용 읽기:', fileId);
                
                const fileResponse = await executeApiWithRetry(() => 
                    window.gapi.client.drive.files.get({
                        fileId: fileId,
                        alt: 'media'
                    })
                );

                const rawData = JSON.parse(fileResponse.body);
                console.log('원격 파일 파싱 완료:', {
                    todosCount: rawData.todos?.length || 0,
                    hasMetadata: !!rawData.metadata
                });
                
                // 안전한 데이터 구조 보장
                const safeData = {
                    todos: rawData.todos || [],
                    categories: rawData.categories || [],
                    metadata: {
                        lastModified: rawData.metadata?.lastModified || new Date().toISOString(),
                        version: rawData.metadata?.version || '1.0',
                        deletedItemIds: rawData.metadata?.deletedItemIds || []
                    }
                };
                
                console.log('☁️ 원격 데이터 구조 확인:', {
                    todosCount: safeData.todos.length,
                    categoriesCount: safeData.categories.length,
                    hasMetadata: !!safeData.metadata
                });
                
                return safeData;
            } catch (error) {
                console.error('원격 데이터 읽기 실패:', error);
                return { todos: [], categories: [], metadata: { lastModified: new Date().toISOString(), version: '1.0', deletedItemIds: [] } };
            }
        };

        const performSync = (localData, remoteData) => {
            const localTodos = new Map(localData.todos.map(todo => [todo.id, todo]));
            const remoteTodos = new Map(remoteData.todos.map(todo => [todo.id, todo]));
            const mergedTodos = new Map();
            const localChanges = [];
            const remoteChanges = [];
            
            const allDeletedIds = new Set([
                ...(localData.metadata?.deletedItemIds || []),
                ...(remoteData.metadata?.deletedItemIds || [])
            ]);

            const allIds = new Set([...localTodos.keys(), ...remoteTodos.keys()]);

            for (const id of allIds) {
                if (allDeletedIds.has(id)) {
                    continue;
                }

                const localTodo = localTodos.get(id);
                const remoteTodo = remoteTodos.get(id);

                if (localTodo && remoteTodo) {
                    const localTime = new Date(localTodo.updatedAt || localTodo.createdAt);
                    const remoteTime = new Date(remoteTodo.updatedAt || remoteTodo.createdAt);
                    
                    if (localTime >= remoteTime) {
                        mergedTodos.set(id, localTodo);
                        if (localTime > remoteTime) {
                            remoteChanges.push({ type: 'update', todo: localTodo });
                        }
                    } else {
                        mergedTodos.set(id, remoteTodo);
                        localChanges.push({ type: 'update', todo: remoteTodo });
                    }
                } else if (localTodo) {
                    mergedTodos.set(id, localTodo);
                    remoteChanges.push({ type: 'add', todo: localTodo });
                } else if (remoteTodo) {
                    mergedTodos.set(id, remoteTodo);
                    localChanges.push({ type: 'add', todo: remoteTodo });
                }
            }

            deletedItemIds = allDeletedIds;
            if (window.storage && typeof window.storage.saveData === 'function') {
                window.storage.saveData('deletedItemIds', Array.from(deletedItemIds));
            }

            // 카테고리 병합 (로컬 우선, 원격에서 추가)
            const localCategories = new Map((localData.categories || []).map(cat => [cat.id, cat]));
            const remoteCategories = new Map((remoteData.categories || []).map(cat => [cat.id, cat]));
            const mergedCategories = new Map();
            
            // 로컬 카테고리 우선 추가
            for (const [id, category] of localCategories) {
                mergedCategories.set(id, category);
            }
            
            // 원격에만 있는 카테고리 추가
            for (const [id, category] of remoteCategories) {
                if (!mergedCategories.has(id)) {
                    mergedCategories.set(id, category);
                }
            }
            
            console.log('🔀 카테고리 병합 완료:', {
                localCategories: localCategories.size,
                remoteCategories: remoteCategories.size,
                mergedCategories: mergedCategories.size
            });

            const mergedData = {
                todos: Array.from(mergedTodos.values()),
                categories: Array.from(mergedCategories.values()),
                metadata: {
                    lastModified: new Date().toISOString(),
                    version: '1.0',
                    deletedItemIds: Array.from(allDeletedIds)
                }
            };

            return { mergedData, localChanges, remoteChanges };
        };

        const saveLocalData = async (data) => {
            try {
                console.log('💾 로컬 데이터 저장 시작...', data.todos.length + '개 항목');
                
                if (data.todos.length > 0) {
                    console.log('💾 저장할 데이터 샘플:', {
                        id: data.todos[0].id,
                        text: data.todos[0].text.substring(0, 30) + '...',
                        category: data.todos[0].category,
                        completed: data.todos[0].completed
                    });
                    
                    // 카테고리별 통계
                    const categoryStats = {};
                    data.todos.forEach(todo => {
                        const cat = todo.category || 'default';
                        categoryStats[cat] = (categoryStats[cat] || 0) + 1;
                    });
                    console.log('💾 카테고리별 할 일 수:', categoryStats);
                }
                
                // 1. storage에 저장
                storage.saveTodos(data.todos);
                console.log('💾 로컬 todos storage 저장 완료');
                
                if (data.categories && data.categories.length > 0) {
                    storage.saveCategories(data.categories);
                    console.log('💾 로컬 categories storage 저장 완료:', data.categories.length + '개');
                }
                
                // 2. todoManager 업데이트
                if (window.todoManager) {
                    window.todoManager.setTodos(data.todos);
                    console.log('💾 todoManager todos 업데이트 완료');
                    
                    // 카테고리도 함께 저장
                    if (data.categories && data.categories.length > 0) {
                        window.todoManager.setCategories(data.categories);
                        console.log('💾 todoManager categories 업데이트 완료:', data.categories.length + '개');
                    }
                } else {
                    console.warn('💾 todoManager를 찾을 수 없음');
                }
                
                // 3. 강력한 UI 업데이트
                try {
                    // 전체 렌더링 함수 호출
                    if (typeof render === 'function') {
                        render();
                        console.log('💾 전체 UI 렌더링 완료');
                    }
                    
                    // DOM 이벤트 트리거 (todoManager의 변경 이벤트)
                    const customEvent = new CustomEvent('todosUpdated', { 
                        detail: { todos: data.todos, source: 'googleDriveSync' }
                    });
                    document.dispatchEvent(customEvent);
                    console.log('💾 todosUpdated 이벤트 발생');
                    
                    // 약간의 지연 후 다시 렌더링 (확실히 하기 위해)
                    setTimeout(() => {
                        if (typeof render === 'function') {
                            render();
                            console.log('💾 지연 렌더링 완료');
                        }
                    }, 100);
                    
                } catch (renderError) {
                    console.error('💾 UI 렌더링 오류:', renderError);
                }
                
            } catch (error) {
                console.error('로컬 데이터 저장 실패:', error);
                throw error;
            }
        };

        const saveRemoteData = async (data) => {
            try {
                // 토큰 만료 체크 (만료되면 바로 실패)
                if (isTokenExpired()) {
                    throw new Error('토큰이 만료되었습니다. 다시 로그인해주세요.');
                }
                
                if (!drive) {
                    throw new Error('Google Drive API가 초기화되지 않았습니다.');
                }
                
                // 고정된 파일명 사용 (getRemoteData와 동일)
                const fileName = 'mwohaji_sync.json';
                const fileContent = JSON.stringify(data, null, 2);
                
                console.log('구글드라이브에 파일 저장 시도:', fileName);
                
                // 기존 파일 검색
                const searchResponse = await executeApiWithRetry(() => 
                    window.gapi.client.drive.files.list({
                        q: `name='${fileName}' and trashed=false`,
                        spaces: 'drive',
                        fields: 'files(id, name)'
                    })
                );

                if (searchResponse.result.files && searchResponse.result.files.length > 0) {
                    // 기존 파일 업데이트
                    const fileId = searchResponse.result.files[0].id;
                    console.log('기존 파일 업데이트:', fileId);
                    
                    const updateResponse = await executeApiWithRetry(() => 
                        window.gapi.client.request({
                            path: `https://www.googleapis.com/upload/drive/v3/files/${fileId}`,
                            method: 'PATCH',
                            params: {
                                uploadType: 'media'
                            },
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: fileContent
                        })
                    );
                    
                    console.log('파일 업데이트 완료:', updateResponse);
                } else {
                    // 새 파일 생성
                    console.log('새 파일 생성');
                    
                    const boundary = '-------314159265358979323846';
                    const delimiter = "\r\n--" + boundary + "\r\n";
                    const close_delim = "\r\n--" + boundary + "--";

                    const metadata = {
                        'name': fileName,
                        'mimeType': 'application/json'
                    };

                    const multipartRequestBody =
                        delimiter +
                        'Content-Type: application/json\r\n\r\n' +
                        JSON.stringify(metadata) +
                        delimiter +
                        'Content-Type: application/json\r\n\r\n' +
                        fileContent +
                        close_delim;

                    const createResponse = await executeApiWithRetry(() => 
                        window.gapi.client.request({
                            path: 'https://www.googleapis.com/upload/drive/v3/files',
                            method: 'POST',
                            params: {
                                uploadType: 'multipart'
                            },
                            headers: {
                                'Content-Type': 'multipart/related; boundary="' + boundary + '"'
                            },
                            body: multipartRequestBody
                        })
                    );
                    
                    console.log('새 파일 생성 완료:', createResponse);
                }
                
                console.log('구글드라이브 저장 성공');
            } catch (error) {
                console.error('원격 데이터 저장 실패:', error);
                throw error;
            }
        };

        const startAutoSync = () => {
            console.log('🔄 [startAutoSync] 호출됨');
            if (autoSyncInterval) {
                console.log('🔄 [startAutoSync] 기존 interval 중지 후 재시작');
                stopAutoSync();
            }
            
            autoSyncEnabled = true;
            autoSyncInterval = setInterval(() => {
                console.log('🔄 [자동 동기화] 5분 타이머 실행됨:', {
                    isSignedIn: isSignedIn,
                    syncInProgress: syncInProgress,
                    autoSyncEnabled: autoSyncEnabled,
                    currentTime: new Date().toLocaleString('ko-KR')
                });
                
                if (isSignedIn && !syncInProgress) {
                    console.log('🔄 [자동 동기화] 조건 충족, 동기화 시작...');
                    sync().catch(error => {
                        console.error('🔄 [자동 동기화] 실패:', error);
                    });
                } else {
                    console.log('🔄 [자동 동기화] 조건 불충족:', {
                        이유: !isSignedIn ? '로그인 안됨' : '동기화 진행중'
                    });
                }
            }, 5 * 60 * 1000);
            
            try {
                localStorage.setItem('mwohaji-autoSyncEnabled', 'true');
            } catch (error) {
                console.warn('자동 동기화 설정 저장 실패:', error);
            }
            console.log('🔄 [startAutoSync] 자동 동기화가 시작되었습니다. (5분 간격)');
            console.log('🔄 [startAutoSync] interval ID:', autoSyncInterval);
        };

        const stopAutoSync = () => {
            console.log('🔄 [stopAutoSync] 호출됨');
            if (autoSyncInterval) {
                console.log('🔄 [stopAutoSync] interval 중지:', autoSyncInterval);
                clearInterval(autoSyncInterval);
                autoSyncInterval = null;
            } else {
                console.log('🔄 [stopAutoSync] 중지할 interval 없음');
            }
            
            autoSyncEnabled = false;
            try {
                localStorage.setItem('mwohaji-autoSyncEnabled', 'false');
            } catch (error) {
                console.warn('자동 동기화 설정 저장 실패:', error);
            }
            console.log('🔄 [stopAutoSync] 자동 동기화가 중지되었습니다.');
        };

        const markAsDeleted = (todoId) => {
            deletedItemIds.add(todoId);
            try {
                localStorage.setItem('mwohaji-deletedItemIds', JSON.stringify(Array.from(deletedItemIds)));
                console.log('🗑️ 삭제된 항목 ID 저장:', todoId);
            } catch (error) {
                console.warn('삭제된 항목 ID 저장 실패:', error);
            }
        };

        const loadSettings = () => {
            try {
                console.log('⚙️ Google Drive 설정 로드 시작...');
                
                // 삭제된 항목 ID 로드
                try {
                    const deletedIdsStr = localStorage.getItem('mwohaji-deletedItemIds');
                    const deletedIds = deletedIdsStr ? JSON.parse(deletedIdsStr) : [];
                    deletedItemIds = new Set(deletedIds);
                    console.log('⚙️ 삭제된 항목 ID 로드:', deletedItemIds.size + '개');
                } catch (error) {
                    console.warn('삭제된 항목 ID 로드 실패:', error);
                    deletedItemIds = new Set();
                }
                
                // 마지막 동기화 시간 로드
                try {
                    const lastSyncStr = localStorage.getItem('mwohaji-lastSyncTime');
                    if (lastSyncStr) {
                        lastSyncTime = new Date(lastSyncStr);
                        console.log('⚙️ 마지막 동기화 시간 로드:', lastSyncTime.toISOString());
                    } else {
                        lastSyncTime = null;
                        console.log('⚙️ 마지막 동기화 시간 없음');
                    }
                } catch (error) {
                    console.warn('마지막 동기화 시간 로드 실패:', error);
                    lastSyncTime = null;
                }
                
                // 자동 동기화 설정 로드
                try {
                    const autoSyncStr = localStorage.getItem('mwohaji-autoSyncEnabled');
                    autoSyncEnabled = autoSyncStr === 'true';
                    console.log('⚙️ 자동 동기화 설정 로드:', autoSyncEnabled);
                    
                    // 자동 동기화 시작은 onAuthStateChanged에서 처리
                    console.log('⚙️ 자동 동기화 시작은 로그인 완료 후 처리됩니다.');
                } catch (error) {
                    console.warn('자동 동기화 설정 로드 실패:', error);
                    autoSyncEnabled = false;
                }
                
                console.log('⚙️ Google Drive 설정 로드 완료:', {
                    deletedItemsCount: deletedItemIds.size,
                    lastSyncTime: lastSyncTime ? lastSyncTime.toISOString() : null,
                    autoSyncEnabled
                });
            } catch (error) {
                console.error('설정 로드 중 오류:', error);
                // 오류가 발생해도 기본값으로 계속 진행
                deletedItemIds = new Set();
                lastSyncTime = null;
                autoSyncEnabled = false;
            }
        };

        // 페이지 언로드 시 리소스 정리
        const cleanup = () => {
            console.log('🧹 [Google Drive Sync] 리소스 정리 중...');
            
            // 자동 동기화 중지
            if (autoSyncInterval) {
                clearInterval(autoSyncInterval);
                autoSyncInterval = null;
            }
            

            
            console.log('🧹 [Google Drive Sync] 리소스 정리 완료');
        };
        

        
        // 페이지 언로드 이벤트 리스너 등록
        if (typeof window !== 'undefined') {
            window.addEventListener('beforeunload', cleanup);
            window.addEventListener('pagehide', cleanup);
        }

        // 토큰 만료로 인한 로그아웃 처리
        const markAsLoggedOut = () => {
            console.log('토큰 만료로 인한 로그아웃 처리');
            isSignedIn = false;
            
            // 사용자 정보 초기화
            window.currentUserInfo = null;
            
            // 자동 동기화 중지
            if (autoSyncInterval) {
                clearInterval(autoSyncInterval);
                autoSyncInterval = null;
                autoSyncEnabled = false;
            }
            
            // 토큰 제거
            try {
                localStorage.removeItem('mwohaji-gdrive-token');
            } catch (error) {
                console.warn('토큰 제거 실패:', error);
            }
            
            // 무한 루프 방지를 위해 updateAuthUI 대신 직접 호출하지 않음
            // updateGoogleDriveUI()에서 호출되므로 여기서는 생략
        };

        // 토큰 만료 스케줄링 함수 (외부에서 접근 가능하도록)
        const scheduleTokenExpiry = () => {
            try {
                const savedTokenStr = localStorage.getItem('mwohaji-gdrive-token');
                if (savedTokenStr && isSignedIn) {
                    const savedToken = JSON.parse(savedTokenStr);
                    const expiresAt = savedToken.expires_at;
                    const now = Date.now();
                    const timeUntilExpiry = expiresAt - now;
                    
                    if (timeUntilExpiry > 0) {
                        console.log('토큰 만료 예약:', new Date(expiresAt).toLocaleString(), `(${Math.round(timeUntilExpiry/60000)}분 후)`);
                        
                        // 정확한 만료 시점에 로그아웃 처리
                        setTimeout(() => {
                            console.log('토큰 만료 시점 도달, 자동 로그아웃');
                            if (typeof utils !== 'undefined' && utils.showToast) {
                                utils.showToast('Google Drive 로그인이 만료되었습니다. (1시간 제한)', 'warning');
                            }
                            markAsLoggedOut();
                            if (window.updateGoogleDriveUI) {
                                window.updateGoogleDriveUI();
                            }
                        }, timeUntilExpiry);
                    }
                }
            } catch (error) {
                console.warn('토큰 만료 스케줄링 실패:', error);
            }
        };

        return {
            initialize,
            signIn,
            signOut,
            sync,
            startAutoSync,
            stopAutoSync,
            markAsDeleted,
            getCurrentUser,
            markAsLoggedOut, // 토큰 만료 처리 함수 추가
            isTokenExpired, // 토큰 만료 체크 함수 추가
            scheduleTokenExpiry, // 토큰 만료 스케줄링 함수 추가
            get isSignedIn() { return isSignedIn; },
            get lastSyncTime() { return lastSyncTime; },
            get autoSyncEnabled() { return autoSyncEnabled; },
            get syncInProgress() { return syncInProgress; }
        };
    })();

    // 전역에서 접근 가능하도록 설정
    window.googleDriveSync = googleDriveSync;
});
