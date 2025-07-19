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

    // App State
    let currentView = 'project';
    let selectedCategoryId = 'default';

    // RENDER FUNCTIONS
    const render = () => {
        renderTodos();
        renderCategorySelector();
        renderCategoryList();
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
                    ${todo.notificationTime ? `<span class="notification-time">@notify: ${utils.formatDateTime(todo.notificationTime)}</span>` : ''}
                    ${todo.recurring ? `<span class="recurring-info">(${security.escapeHtml(todo.recurring)})</span>` : ''}
                </div>
                <div class="todo-buttons">
                    <button class="sound-toggle-btn icon-btn" data-sound="${todo.soundEnabled !== false ? 'on' : 'off'}" title="${todo.soundEnabled !== false ? '소리 끄기' : '소리 켜기'}"></button>
                    <button class="delete-btn icon-btn" title="삭제"></button>
                </div>
            </div>
        `;
        
        // 아이콘 설정
        const soundBtn = todoItem.querySelector('.sound-toggle-btn');
        const deleteBtn = todoItem.querySelector('.delete-btn');
        
        if (todo.soundEnabled !== false) {
            icons.setButtonIcon(soundBtn, 'volume', '소리 끄기', 16);
        } else {
            icons.setButtonIcon(soundBtn, 'volumeX', '소리 켜기', 16);
        }
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
        } else if (target.classList.contains('sound-toggle-btn') || target.closest('.sound-toggle-btn')) {
            const soundBtn = target.closest('.sound-toggle-btn') || target;
            const currentSound = soundBtn.dataset.sound;
            const newSound = currentSound === 'on' ? 'off' : 'on';
            
            // 소리 설정 토글 (현재 미구현 기능이지만 UI는 동작)
            soundBtn.dataset.sound = newSound;
            if (newSound === 'on') {
                icons.setButtonIcon(soundBtn, 'volume', '소리 끄기', 16);
            } else {
                icons.setButtonIcon(soundBtn, 'volumeX', '소리 켜기', 16);
            }
            
            // 실제 데이터 업데이트 (향후 알림 기능 구현 시 사용)
            // todoManager.updateTodoSoundEnabled(id, newSound === 'on');
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

    // 아이콘 초기화
    const initIcons = () => {
        // 헤더 버튼들
        icons.setButtonIcon(settingsBtn, 'settings', '카테고리 관리');
        icons.setButtonIcon(importBtn, 'upload', '가져오기');
        icons.setButtonIcon(exportBtn, 'download', '내보내기');
        icons.setButtonIcon(closeModalBtn, 'close', '닫기');
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
    window.addEventListener('click', (e) => {
        if (e.target === categoryModal) categoryModal.style.display = 'none';
    });
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

    init();
});
