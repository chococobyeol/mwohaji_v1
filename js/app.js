document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const todoInput = document.getElementById('todo-input');
    const addTodoBtn = document.getElementById('add-todo-btn');
    const todoListContainer = document.getElementById('todo-list');
    const projectViewBtn = document.getElementById('view-project');
    const allViewBtn = document.getElementById('view-all');
    const settingsBtn = document.getElementById('settings-btn');
    const exportBtn = document.getElementById('export-btn');
    const importBtn = document.getElementById('import-btn');
    const categoryModal = document.getElementById('category-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const categorySelector = document.getElementById('category-selector');
    const categoryList = document.getElementById('category-list');
    const addCategoryBtn = document.getElementById('add-category-btn');
    const newCategoryInput = document.getElementById('new-category-input');
    const currentTimeElement = document.getElementById('current-time');

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
    let settings = { showCompleted: true }; // 설정 상태

    // 설정 사이드바 관련
    const globalSettingsBtn = document.getElementById('global-settings-btn');
    const settingsSidebar = document.getElementById('settings-sidebar');
    const closeSettingsSidebar = document.getElementById('close-settings-sidebar');
    const settingsSidebarOverlay = document.querySelector('.settings-sidebar-overlay');
    const showCompletedToggle = document.getElementById('show-completed-toggle');

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
        renderTodos();
        renderCategorySelector();
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
                console.log(`[App] renderScheduleInfo - 시작 시간 계산 전 현재 시간: ${new Date()}`);
                const next = getNextRepeatTime(todo, 'start');
                console.log(`[App] renderScheduleInfo - 시작 시간 계산 결과: ${next}`);
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
                console.log(`[App] renderScheduleInfo - 마감 시간 계산 전 현재 시간: ${new Date()}`);
                const next = getNextRepeatTime(todo, 'due');
                console.log(`[App] renderScheduleInfo - 마감 시간 계산 결과: ${next}`);
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
        
        console.log('=== renderTodos 디버그 ===');
        console.log('모든 할 일:', allTodos);
        console.log('설정 - 완료된 할 일 표시:', settings.showCompleted);
        
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
                dailyRow.style.display='flex'; weeklyRow.style.display='none'; monthlyRow.style.display='none';
            }else if(repeatTypeSelect.value==='weekly'){
                dailyRow.style.display='none'; weeklyRow.style.display='flex'; monthlyRow.style.display='none';
            }else if(repeatTypeSelect.value==='monthly'){
                dailyRow.style.display='none'; weeklyRow.style.display='none'; monthlyRow.style.display='flex';
            }else{
                dailyRow.style.display='none'; weeklyRow.style.display='none'; monthlyRow.style.display='none';
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
        document.querySelectorAll('#repeat-weekdays .weekday-btn').forEach(btn=>btn.classList.remove('active'));
        document.querySelectorAll('#repeat-monthdays .monthday-btn').forEach(btn=>btn.classList.remove('active'));
        if (todo && todo.repeat) {
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
            } else if(type==='daily'){
                todo.repeat = { type, interval: parseInt(repeatIntervalInput.value,10)||1 };
            } else if(type==='weekly'){
                const days = Array.from(document.querySelectorAll('#repeat-weekdays .weekday-btn.active')).map(btn=>parseInt(btn.dataset.value, 10));
                todo.repeat = { type, days };
            } else if(type==='monthly'){
                const dates = Array.from(document.querySelectorAll('#repeat-monthdays .monthday-btn.active')).map(btn=>parseInt(btn.dataset.value, 10));
                todo.repeat = { type, dates };
            }
            storage.saveTodos(todoManager.getTodos());
            
            // 반복 설정 변경 시 알림 스케줄러 재초기화
            if (window.notificationScheduler) {
                console.log('[App] 반복 설정 변경 - 알림 스케줄러 재초기화');
                window.notificationScheduler.rescheduleAllNotifications(todoManager.getTodos());
            }
        }
        closeRepeatModal();
        render();
        
        // 반복 설정 변경 후 즉시 UI 업데이트
        console.log('[App] 반복 설정 변경 후 즉시 UI 업데이트');
        renderTodos();
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
        draggedElement = null;
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
    const getDetailedRepeatInfo = (repeat) => {
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
                    console.log('이미지 사이즈 처리:', { match, alt, src, style }); // 디버깅
                    const widthMatch = style.match(/width=(\d+)/);
                    const heightMatch = style.match(/height=(\d+)/);
                    const width = widthMatch ? widthMatch[1] : 'auto';
                    const height = heightMatch ? heightMatch[1] : 'auto';
                    // HTML img 태그로 직접 변환
                    const result = `<img src="${src}" alt="${alt}" style="width:${width}px;height:${height}px;">`;
                    console.log('변환 결과:', result); // 디버깅
                    return result;
                }
            );
            
            // marked.js를 사용하여 마크다운을 HTML로 변환
            const rawHtml = marked.parse(textWithBreaks);
            console.log('마크다운 변환 결과:', rawHtml); // 디버깅용
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
                    ${todo.repeat ? `<span class="recurring-info">(${getDetailedRepeatInfo(todo.repeat)})</span>` : ''}
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
                const categoryTitle = document.createElement('h3');
                categoryTitle.className = 'project-title';
                categoryTitle.textContent = categoryName;
                groupContainer.appendChild(categoryTitle);
                
                // 각 카테고리 내에서 할일들을 생성 날짜순으로 정렬
                const sortedTodos = groupedTodos[categoryName].sort((a, b) => 
                    new Date(b.createdAt) - new Date(a.createdAt)
                );
                
                sortedTodos.forEach(todo => groupContainer.appendChild(createTodoElement(todo)));
                todoListContainer.appendChild(groupContainer);
            }
        });
    };

    const renderAllView = (todos) => {
        const sortedTodos = [...todos].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
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
        settings.showCompleted = showCompletedToggle.checked;
        storage.saveSettings(settings);
        renderTodos(); // 즉시 반영
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
        icons.setButtonIcon(showCompletedToggle, 'check-circle', '완료된 할 일 표시', 18);
    };

    // INITIALIZATION
    const init = () => {
        todoManager.setTodos(storage.getTodos());
        todoManager.setCategories(storage.getCategories());
        todoManager.setCompletedRepeatTodos(storage.getCompletedRepeatTodos());
        
        // 설정 로드 및 UI 초기화
        settings = storage.getSettings();
        showCompletedToggle.checked = settings.showCompleted;
        
        initIcons();
        createRepeatModal();

        // 실시간 시간 업데이트 시작
        updateCurrentTime(); // 초기 시간 표시
        setInterval(updateCurrentTime, 1000); // 1초마다 업데이트

        // 이벤트 리스너 추가
        saveScheduleBtn.addEventListener('click', saveSchedule);
        cancelScheduleBtn.addEventListener('click', closeScheduleModal);
        closeScheduleModalBtn.addEventListener('click', closeScheduleModal);
        scheduleModal.addEventListener('click', (e) => {
            if (e.target === scheduleModal) closeScheduleModal();
        });
        
        // 설정 토글 이벤트 리스너
        showCompletedToggle.addEventListener('change', handleShowCompletedToggle);
        
        // 시스템 시간 변경 감지를 위한 이벤트 리스너 추가
        window.addEventListener('focus', () => {
            console.log('[App] 페이지 포커스 감지 - 알림 재스케줄링');
            const now = new Date(Date.now());
            console.log(`[App] 포커스 시 현재 시간: ${now.toLocaleString('ko-KR')} (${now.toISOString()}) [Timestamp: ${Date.now()}]`);
            notificationScheduler.rescheduleAllNotifications(todoManager.getTodos());
        });
        
        // 페이지 가시성 변경 감지 (탭 전환 등)
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                console.log('[App] 페이지 가시성 변경 감지 - 알림 재스케줄링');
                const now = new Date(Date.now());
                console.log(`[App] 가시성 변경 시 현재 시간: ${now.toLocaleString('ko-KR')} (${now.toISOString()}) [Timestamp: ${Date.now()}]`);
                notificationScheduler.rescheduleAllNotifications(todoManager.getTodos());
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
        
        // 설정 사이드바에 시간 동기화 버튼 추가
        const settingsSidebar = document.getElementById('settings-sidebar');
        const settingsContent = settingsSidebar.querySelector('.settings-sidebar-content');
        
        // 시간 동기화 섹션 추가
        const timeSyncSection = document.createElement('div');
        timeSyncSection.className = 'setting-item';
        timeSyncSection.innerHTML = `
            <div class="setting-row">
                <label class="setting-label">알람 시간 동기화</label>
                <button id="sync-time-btn" class="secondary-btn" style="padding: 8px 16px; font-size: 14px;">동기화</button>
            </div>
            <p class="setting-description">PC 시간이 변경되었을 때 알람 시간을 현재 시간에 맞춰 재계산합니다.</p>
        `;
        
        // 완료된 할 일 표시 설정 다음에 추가
        const showCompletedSection = settingsContent.querySelector('.setting-item');
        showCompletedSection.parentNode.insertBefore(timeSyncSection, showCompletedSection.nextSibling);
        
        // 시간 동기화 버튼 이벤트 리스너
        document.getElementById('sync-time-btn').addEventListener('click', () => {
            console.log('[App] 수동 시간 동기화 실행');
            const now = new Date(Date.now());
            console.log(`[App] 수동 동기화 시 현재 시간: ${now.toLocaleString('ko-KR')} (${now.toISOString()}) [Timestamp: ${Date.now()}]`);
            notificationScheduler.rescheduleAllNotifications(todoManager.getTodos());
        });
        
        render();
        // 알림 스케줄러 초기화
        notificationScheduler.initScheduler();
    };

    // textarea 키보드 이벤트 핸들러
    const handleTodoInputKeydown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleAddTodo();
        }
    };

    // EVENT LISTENERS
    addTodoBtn.addEventListener('click', handleAddTodo);
    todoInput.addEventListener('keydown', handleTodoInputKeydown);
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
                
                // todoManager에 데이터 설정
                todoManager.setTodos(data.todos);
                todoManager.setCategories(finalCategories);
                todoManager.setCompletedRepeatTodos(data.completedRepeatTodos || []);
                
                // 알림 스케줄러 재초기화 (데이터 복구 후)
                if (window.notificationScheduler) {
                    console.log('[App] 데이터 복구 후 알림 스케줄러 재초기화');
                    window.notificationScheduler.rescheduleAllNotifications(todoManager.getTodos());
                }
                
                // UI 초기화
                init();
                
                // 성공 메시지에 통계 정보 포함
                const successMessage = `데이터를 성공적으로 가져왔습니다.\n\n` +
                    `📊 복구된 데이터:\n` +
                    `• 할 일: ${stats.totalTodos}개 (완료: ${stats.completedTodos}개)\n` +
                    `• 일정 설정: ${stats.todosWithSchedule}개\n` +
                    `• 반복 설정: ${stats.todosWithRepeat}개\n` +
                    `• 카테고리: ${stats.totalCategories}개\n` +
                    `• 완료된 반복 할 일: ${stats.completedRepeatTodos}개`;
                
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
        console.log('=== 시작 시간 체크박스 변경 ===');
        console.log('체크박스 상태:', e.target.checked);
        
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
            console.log('시작 시간 필드 활성화 및 기본값 설정');
            console.log('설정된 날짜:', startDate.value);
            console.log('설정된 시간:', startTime.value);
        } else {
            startTimeInputs.classList.remove('enabled');
            console.log('시작 시간 필드 비활성화');
        }
    });

    dueTimeEnabled.addEventListener('change', (e) => {
        console.log('=== 마감 시간 체크박스 변경 ===');
        console.log('체크박스 상태:', e.target.checked);
        
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
            console.log('마감 시간 필드 활성화 및 기본값 설정');
            console.log('설정된 날짜:', dueDate.value);
            console.log('설정된 시간:', dueTime.value);
        } else {
            dueTimeInputs.classList.remove('enabled');
            console.log('마감 시간 필드 비활성화');
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

    init();
    
    // 전역으로 renderTodos 함수 노출 (notificationScheduler에서 UI 업데이트를 위해)
    window.app = {
        renderTodos: renderTodos
    };
});
