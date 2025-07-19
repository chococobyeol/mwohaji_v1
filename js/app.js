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

    // 일정 설정 모달 관련 DOM Elements
    const scheduleModal = document.getElementById('schedule-modal');
    const closeScheduleModalBtn = document.getElementById('close-schedule-modal-btn');
    const scheduleTodoTitle = document.getElementById('schedule-todo-title');
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

    // App State
    let currentView = 'project';
    let selectedCategoryId = 'default';
    let currentEditingTodoId = null;

    // RENDER FUNCTIONS
    const render = () => {
        renderTodos();
        renderCategorySelector();
        renderCategoryList();
    };

    // 일정 정보 렌더링 함수
    const renderScheduleInfo = (todo) => {
        if (!todo.schedule) return '';
        
        let scheduleHTML = '';
        
        // 시작 시간 표시
        if (todo.schedule.startTime) {
            const startDate = new Date(todo.schedule.startTime);
            const formattedStart = utils.formatDateTime(startDate);
            const startIcon = icons.get('clock', 14);
            const modalIcon = todo.schedule.startModal !== false ? 
                icons.get('bell', 12) : icons.get('bellOff', 12);
            const soundIcon = todo.schedule.startNotification ? 
                icons.get('volume', 12) : icons.get('volumeX', 12);
            
            scheduleHTML += `<span class="schedule-info start-time">${startIcon} 시작: ${formattedStart} <span class="schedule-icon-clickable" data-todo-id="${todo.id}" data-type="start-modal" title="시작 모달 토글">${modalIcon}</span> <span class="schedule-icon-clickable" data-todo-id="${todo.id}" data-type="start-sound" title="시작 소리 토글">${soundIcon}</span></span>`;
        }
        
        // 마감 시간 표시
        if (todo.schedule.dueTime) {
            const dueDate = new Date(todo.schedule.dueTime);
            const formattedDue = utils.formatDateTime(dueDate);
            const dueIcon = icons.get('clock', 14);
            const modalIcon = todo.schedule.dueModal !== false ? 
                icons.get('bell', 12) : icons.get('bellOff', 12);
            const soundIcon = todo.schedule.dueNotification ? 
                icons.get('volume', 12) : icons.get('volumeX', 12);
            
            scheduleHTML += `<span class="schedule-info due-time">${dueIcon} 마감: ${formattedDue} <span class="schedule-icon-clickable" data-todo-id="${todo.id}" data-type="due-modal" title="마감 모달 토글">${modalIcon}</span> <span class="schedule-icon-clickable" data-todo-id="${todo.id}" data-type="due-sound" title="마감 소리 토글">${soundIcon}</span></span>`;
        }
        
        return scheduleHTML;
    };

    const renderTodos = () => {
        const todos = todoManager.getTodos();
        todoListContainer.innerHTML = '';
        projectViewBtn.classList.toggle('active', currentView === 'project');
        allViewBtn.classList.toggle('active', currentView === 'all');
        if (todos.length === 0) {
            todoListContainer.innerHTML = `<p class="empty-message">첫 할 일을 추가해보세요...</p>`;
            return;
        }
        if (currentView === 'project') renderProjectView(todos);
        else renderAllView(todos);
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

    const createTodoElement = (todo) => {
        const todoItem = document.createElement('div');
        todoItem.className = 'todo-item';
        todoItem.dataset.id = todo.id;
        if (todo.completed) todoItem.classList.add('completed');
        todoItem.innerHTML = `
            <input type="checkbox" ${todo.completed ? 'checked' : ''}>
            <div class="todo-content">
                <span class="todo-text">${security.escapeHtml(todo.text)}</span>
            </div>
            <div class="todo-right">
                <div class="meta-info">
                    <span class="category-tag">${security.escapeHtml(todo.category)}</span>
                    ${renderScheduleInfo(todo)}
                    ${todo.recurring ? `<span class="recurring-info">(${security.escapeHtml(todo.recurring)})</span>` : ''}
                </div>
                <div class="todo-buttons">
                    <button class="schedule-btn icon-btn" title="일정 설정"></button>
                    <button class="delete-btn icon-btn" title="삭제"></button>
                </div>
            </div>
        `;
        
        // 아이콘 설정
        const scheduleBtn = todoItem.querySelector('.schedule-btn');
        const deleteBtn = todoItem.querySelector('.delete-btn');
        
        icons.setButtonIcon(scheduleBtn, 'calendar', '일정 설정', 16);
        icons.setButtonIcon(deleteBtn, 'trash', '삭제', 16);
        
        return todoItem;
    };

    const renderProjectView = (todos) => {
        const groupedTodos = todos.reduce((acc, todo) => {
            const category = todo.category || '일반';
            if (!acc[category]) acc[category] = [];
            acc[category].push(todo);
            return acc;
        }, {});
        for (const category in groupedTodos) {
            const groupContainer = document.createElement('div');
            groupContainer.className = 'project-group';
            const categoryTitle = document.createElement('h3');
            categoryTitle.className = 'project-title';
            categoryTitle.textContent = category;
            groupContainer.appendChild(categoryTitle);
            groupedTodos[category].forEach(todo => groupContainer.appendChild(createTodoElement(todo)));
            todoListContainer.appendChild(groupContainer);
        }
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
            todoManager.toggleTodoStatus(id);
            renderTodos();
        } else if (target.classList.contains('delete-btn') || target.closest('.delete-btn')) {
            if (confirm('정말로 이 할 일을 삭제하시겠습니까?')) {
                todoManager.deleteTodo(id);
                renderTodos();
            }
        } else if (target.classList.contains('schedule-btn') || target.closest('.schedule-btn')) {
            openScheduleModal(id);
        } else if (target.classList.contains('schedule-icon-clickable') || target.closest('.schedule-icon-clickable')) {
            event.preventDefault(); // 기본 동작 방지
            event.stopPropagation(); // 이벤트 버블링 방지
            
            const clickableElement = target.classList.contains('schedule-icon-clickable') ? 
                target : target.closest('.schedule-icon-clickable');
            
            if (!clickableElement) {
                console.log('clickableElement를 찾을 수 없음');
                return;
            }
            
            const type = clickableElement.dataset.type;
            const todoId = Number(clickableElement.dataset.todoId);
            
            if (!type || !todoId) {
                console.log('type 또는 todoId가 없음:', type, todoId);
                return;
            }
            
            console.log('Schedule icon clicked:', type, todoId); // 디버깅용
            toggleScheduleSetting(todoId, type);
        }
    };
    
    const handleListDoubleClick = (event) => {
        const target = event.target;
        if (!target.classList.contains('todo-text')) return;
        const todoItem = target.closest('.todo-item');
        const id = Number(todoItem.dataset.id);
        const todo = todoManager.getTodos().find(t => t.id === id);
        if (!todo) return;

        // 텍스트 입력 필드 생성
        const textInput = document.createElement('input');
        textInput.type = 'text';
        textInput.value = todo.text;
        textInput.className = 'edit-input';
        
        // 카테고리 선택 드롭다운 생성
        const categorySelect = document.createElement('select');
        categorySelect.className = 'edit-category-select';
        const categories = todoManager.getCategories();
        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.id;
            option.textContent = cat.name;
            option.selected = cat.name === todo.category;
            categorySelect.appendChild(option);
        });
        
        // 기존 요소들 교체
        const todoContent = todoItem.querySelector('.todo-content');
        const metaInfo = todoItem.querySelector('.meta-info');
        
        todoContent.innerHTML = '';
        todoContent.appendChild(textInput);
        
        metaInfo.innerHTML = '';
        metaInfo.appendChild(categorySelect);
        textInput.focus();
        
        const saveChanges = () => {
            const newText = textInput.value.trim();
            const selectedCategoryId = categorySelect.value;
            const selectedCategory = categories.find(c => c.id === selectedCategoryId);
            
            if (newText) {
                todoManager.updateTodoText(id, newText);
                if (selectedCategory && selectedCategory.name !== todo.category) {
                    todoManager.updateTodoCategory(id, selectedCategory.name);
                }
            }
            renderTodos();
        };
        
        textInput.addEventListener('blur', saveChanges);
        textInput.addEventListener('keypress', (e) => e.key === 'Enter' && saveChanges());
        categorySelect.addEventListener('change', saveChanges);
    };

    // 일정 설정 모달 관련 함수들
    const openScheduleModal = (todoId) => {
        const todo = todoManager.getTodos().find(t => t.id === todoId);
        if (!todo) return;

        currentEditingTodoId = todoId;
        scheduleTodoTitle.textContent = todo.text;

        // 기존 일정 데이터 로드
        const schedule = todo.schedule;
        
        if (schedule && schedule.startTime) {
            startTimeEnabled.checked = true;
            const startDateTime = new Date(schedule.startTime);
            startDate.value = startDateTime.toISOString().split('T')[0];
            startTime.value = startDateTime.toTimeString().slice(0, 5);
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
            dueDate.value = dueDateTime.toISOString().split('T')[0];
            dueTime.value = dueDateTime.toTimeString().slice(0, 5);
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

        const scheduleData = {};

        // 시작 시간 처리
        if (startTimeEnabled.checked && startDate.value && startTime.value) {
            const startDateTime = new Date(`${startDate.value}T${startTime.value}`);
            scheduleData.startTime = startDateTime.toISOString();
            scheduleData.startModal = startModalBtn.dataset.enabled === 'true';
            scheduleData.startNotification = startNotificationBtn.dataset.enabled === 'true';
        } else {
            scheduleData.startTime = null;
            scheduleData.startModal = true;
            scheduleData.startNotification = true;
        }

        // 마감 시간 처리
        if (dueTimeEnabled.checked && dueDate.value && dueTime.value) {
            const dueDateTime = new Date(`${dueDate.value}T${dueTime.value}`);
            scheduleData.dueTime = dueDateTime.toISOString();
            scheduleData.dueModal = dueModalBtn.dataset.enabled === 'true';
            scheduleData.dueNotification = dueNotificationBtn.dataset.enabled === 'true';
        } else {
            scheduleData.dueTime = null;
            scheduleData.dueModal = true;
            scheduleData.dueNotification = true;
        }

        todoManager.updateTodoSchedule(currentEditingTodoId, scheduleData);
        closeScheduleModal();
        render();
    };

    // 일정 설정 토글 함수
    const toggleScheduleSetting = (todoId, type) => {
        console.log('toggleScheduleSetting 호출:', todoId, type);
        const todo = todoManager.getTodos().find(t => t.id === todoId);
        if (!todo || !todo.schedule) {
            console.log('할 일을 찾을 수 없거나 일정이 없음:', todo);
            return;
        }

        const scheduleData = { ...todo.schedule };
        console.log('현재 schedule 데이터:', scheduleData);

        switch (type) {
            case 'start-modal':
                scheduleData.startModal = !scheduleData.startModal;
                console.log('start-modal 토글:', scheduleData.startModal);
                break;
            case 'start-sound':
                scheduleData.startNotification = !scheduleData.startNotification;
                console.log('start-sound 토글:', scheduleData.startNotification);
                break;
            case 'due-modal':
                scheduleData.dueModal = !scheduleData.dueModal;
                console.log('due-modal 토글:', scheduleData.dueModal);
                break;
            case 'due-sound':
                scheduleData.dueNotification = !scheduleData.dueNotification;
                console.log('due-sound 토글:', scheduleData.dueNotification);
                break;
            default:
                console.log('알 수 없는 type:', type);
                return;
        }

        console.log('업데이트할 schedule 데이터:', scheduleData);
        const updateResult = todoManager.updateTodoSchedule(todoId, scheduleData);
        console.log('updateTodoSchedule 결과:', updateResult);
        render();
    };

    // 아이콘 초기화
    const initIcons = () => {
        // 헤더 버튼들
        icons.setButtonIcon(settingsBtn, 'settings', '카테고리 관리');
        icons.setButtonIcon(importBtn, 'upload', '가져오기');
        icons.setButtonIcon(exportBtn, 'download', '내보내기');
        icons.setButtonIcon(closeModalBtn, 'close', '닫기');
        icons.setButtonIcon(closeScheduleModalBtn, 'close', '닫기');
    };

    // INITIALIZATION
    const init = () => {
        todoManager.setTodos(storage.getTodos());
        todoManager.setCategories(storage.getCategories());
        initIcons();
        render();
    };

    // EVENT LISTENERS
    addTodoBtn.addEventListener('click', handleAddTodo);
    todoInput.addEventListener('keypress', (e) => e.key === 'Enter' && handleAddTodo());
    categorySelector.addEventListener('click', handleCategorySelect);
    todoListContainer.addEventListener('click', handleListClick);
    todoListContainer.addEventListener('dblclick', handleListDoubleClick);
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
        const id = e.target.dataset.id;
        
        if (e.target.classList.contains('cat-delete-btn')) {
            if (confirm('카테고리를 삭제하면 해당 카테고리의 할 일은 "일반"으로 변경됩니다. 계속하시겠습니까?')) {
                todoManager.deleteCategory(id);
                render();
            }
        } else if (e.target.classList.contains('cat-edit-btn')) {
            const categoryName = todoManager.getCategories().find(c => c.id === id)?.name;
            if (categoryName) {
                const newName = prompt('새 카테고리 이름을 입력하세요:', categoryName);
                if (newName && newName.trim() && newName.trim() !== categoryName) {
                    todoManager.updateCategory(id, newName.trim());
                    render();
                }
            }
        }
    });
    exportBtn.addEventListener('click', () => {
        fileHandler.exportToFile(todoManager.getTodos(), todoManager.getCategories());
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
                storage.saveTodos(data.todos);
                storage.saveCategories(data.categories);
                init();
                alert('데이터를 성공적으로 가져왔습니다.');
            } catch (error) {
                alert(error.message);
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

    // 일정 설정 모달 이벤트 리스너들
    closeScheduleModalBtn.addEventListener('click', closeScheduleModal);
    cancelScheduleBtn.addEventListener('click', closeScheduleModal);
    saveScheduleBtn.addEventListener('click', saveSchedule);

    // 체크박스 변경 시 입력 필드 활성화/비활성화
    startTimeEnabled.addEventListener('change', (e) => {
        if (e.target.checked) {
            startTimeInputs.classList.add('enabled');
            // 현재 날짜/시간으로 기본값 설정
            if (!startDate.value) {
                const now = new Date();
                startDate.value = now.toISOString().split('T')[0];
                startTime.value = now.toTimeString().slice(0, 5);
            }
        } else {
            startTimeInputs.classList.remove('enabled');
        }
    });

    dueTimeEnabled.addEventListener('change', (e) => {
        if (e.target.checked) {
            dueTimeInputs.classList.add('enabled');
            // 현재 날짜/시간으로 기본값 설정
            if (!dueDate.value) {
                const now = new Date();
                now.setHours(now.getHours() + 1); // 1시간 후로 설정
                dueDate.value = now.toISOString().split('T')[0];
                dueTime.value = now.toTimeString().slice(0, 5);
            }
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
    });

    init();
});
