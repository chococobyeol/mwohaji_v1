const todoManager = (() => {
    let todos = [];
    let categories = [];
    let onTodosChangeCallback = null;

    const onTodosChange = (callback) => {
        onTodosChangeCallback = callback;
    };

    const triggerChange = () => {
        if (onTodosChangeCallback) {
            onTodosChangeCallback(todos);
        }
    };

    const setTodos = (newTodos) => {
        todos = newTodos;
    };

    const getTodos = () => {
        return todos;
    };

    const setCategories = (newCategories) => {
        categories = newCategories;
    };

    const getCategories = () => {
        return categories;
    };

    // F-01: 할 일 생성 (변경된 방식)
    const addTodo = (text, categoryId = 'default') => {
        if (!text || !text.trim()) {
            return null;
        }

        const categoryName = categories.find(c => c.id === categoryId)?.name || '일반';

        const newTodo = {
            id: Date.now(),
            text: text.trim(),
            category: categoryName, // 카테고리 이름을 저장
            completed: false,
            createdAt: new Date().toISOString(),
            // notificationTime, recurring, soundEnabled, notified 속성 제거
        };

        todos.push(newTodo);
        storage.saveTodos(todos);
        triggerChange(); // 변경 알림
        return newTodo;
    };

    // F-08: 카테고리 관리
    const addCategory = (name) => {
        if (!name || !name.trim()) return null;
        if (categories.some(c => c.name.toLowerCase() === name.trim().toLowerCase())) {
            alert('이미 존재하는 카테고리입니다.');
            return null;
        }
        const newCategory = { id: `cat-${Date.now()}`, name: name.trim() };
        categories.push(newCategory);
        storage.saveCategories(categories);
        return newCategory;
    };

    const updateCategory = (id, newName) => {
        const category = categories.find(c => c.id === id);
        if (!category) return;

        const oldName = category.name;
        category.name = newName.trim();
        storage.saveCategories(categories);

        // 해당 카테고리를 사용하는 모든 할 일 업데이트
        todos.forEach(todo => {
            if (todo.category === oldName) {
                todo.category = newName.trim();
            }
        });
        storage.saveTodos(todos);
        triggerChange();
    };

    const deleteCategory = (id) => {
        if (id === 'default') {
            alert('기본 카테고리는 삭제할 수 없습니다.');
            return;
        }
        const categoryToDelete = categories.find(c => c.id === id);
        if (!categoryToDelete) return;

        categories = categories.filter(c => c.id !== id);
        storage.saveCategories(categories);

        // 해당 카테고리의 할 일을 '일반'으로 변경
        todos.forEach(todo => {
            if (todo.category === categoryToDelete.name) {
                todo.category = '일반';
            }
        });
        storage.saveTodos(todos);
        triggerChange();
    };

    // markAsNotified, updateTodoNotificationTime 함수 완전 삭제

    const updateTodoText = (id, newText) => {
        const todo = todos.find(todo => todo.id === id);
        if (todo && newText.trim()) {
            todo.text = newText.trim();
            storage.saveTodos(todos);
            triggerChange();
        }
    };

    const updateTodoCategory = (id, newCategory) => {
        const todo = todos.find(todo => todo.id === id);
        if (todo && newCategory.trim()) {
            todo.category = newCategory.trim();
            storage.saveTodos(todos);
            triggerChange();
        }
    };

    // F-02: 할 일 상태 변경
    const toggleTodoStatus = (id) => {
        const todo = todos.find(todo => todo.id === id);
        if (todo) {
            todo.completed = !todo.completed;
            storage.saveTodos(todos);
            triggerChange();
        }
    };

    // F-04: 할 일 삭제
    const deleteTodo = (id) => {
        todos = todos.filter(todo => todo.id !== id);
        storage.saveTodos(todos);
        triggerChange();
    };

    return {
        onTodosChange,
        setTodos,
        getTodos,
        setCategories,
        getCategories,
        addTodo,
        addCategory,
        updateCategory,
        deleteCategory,
        updateTodoText,
        updateTodoCategory,
        toggleTodoStatus,
        deleteTodo
    };
})();
