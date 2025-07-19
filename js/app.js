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
            todoListContainer.innerHTML = `<p class="empty-message">첫 할 일을 추가해보세요!</p>`;
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
                <span>${cat.name}</span>
                ${cat.id !== 'default' ? `<button class="cat-delete-btn icon-btn" data-id="${cat.id}">×</button>` : ''}
            `;
            categoryList.appendChild(li);
        });
    };

    const createTodoElement = (todo) => {
        const todoItem = document.createElement('div');
        todoItem.className = 'todo-item';
        todoItem.dataset.id = todo.id;
        if (todo.completed) todoItem.classList.add('completed');
        todoItem.innerHTML = `
            <input type="checkbox" ${todo.completed ? 'checked' : ''}>
            <span class="todo-text">${todo.text}</span>
            <div class="meta-info">
                <span class="category-tag">${todo.category}</span>
            </div>
            <button class="delete-btn icon-btn" title="삭제">×</button>
        `;
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
        } else if (target.classList.contains('delete-btn')) {
            if (confirm('정말로 이 할 일을 삭제하시겠습니까?')) {
                todoManager.deleteTodo(id);
                renderTodos();
            }
        }
    };
    
    const handleListDoubleClick = (event) => {
        const target = event.target;
        if (!target.classList.contains('todo-text')) return;
        const todoItem = target.closest('.todo-item');
        const id = Number(todoItem.dataset.id);
        const originalText = target.textContent;
        const input = document.createElement('input');
        input.type = 'text';
        input.value = originalText;
        input.className = 'edit-input';
        target.replaceWith(input);
        input.focus();
        const saveChanges = () => {
            todoManager.updateTodoText(id, input.value);
            renderTodos();
        };
        input.addEventListener('blur', saveChanges);
        input.addEventListener('keypress', (e) => e.key === 'Enter' && input.blur());
    };

    // INITIALIZATION
    const init = () => {
        todoManager.setTodos(storage.getTodos());
        todoManager.setCategories(storage.getCategories());
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
        if (e.target.classList.contains('cat-delete-btn')) {
            const id = e.target.dataset.id;
            if (confirm('카테고리를 삭제하면 해당 카테고리의 할 일은 "일반"으로 변경됩니다. 계속하시겠습니까?')) {
                todoManager.deleteCategory(id);
                render();
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
