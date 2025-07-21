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
        return todos; // 이 한 줄만 남겨주세요.
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
            schedule: { // schedule 객체 추가 및 초기화
                startTime: null,
                startModal: true,
                startNotification: true,
                dueTime: null,
                dueModal: true,
                dueNotification: true,
                notifiedStart: false,
                notifiedDue: false
            }
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

    // F-09: 일정 설정 관련 함수들
    const updateTodoSchedule = (id, scheduleData) => {
        const todo = todos.find(todo => todo.id === id);
        if (!todo) return false;

        console.log(`[updateTodoSchedule] Before update - Todo ID: ${id}, Current schedule:`, JSON.parse(JSON.stringify(todo.schedule)));
        console.log(`[updateTodoSchedule] Incoming scheduleData:`, scheduleData);

        // 기존 schedule 객체가 없으면 초기화
        if (!todo.schedule) {
            todo.schedule = {
                startTime: null,
                startModal: true,
                startNotification: true,
                dueTime: null,
                dueModal: true,
                dueNotification: true,
                notifiedStart: false,
                notifiedDue: false
            };
        }

        // 이전 startTime과 dueTime 값을 저장하여 비교
        const oldStartTime = todo.schedule.startTime;
        const oldDueTime = todo.schedule.dueTime;

        // 새로운 일정 데이터로 업데이트 (개별 속성 처리)
        // startTime 처리
        let newStartTimeDate = null;
        if (scheduleData.hasOwnProperty('startTime')) {
            if (scheduleData.startTime !== null) {
                newStartTimeDate = new Date(scheduleData.startTime);
                // Check if parsing was successful
                if (isNaN(newStartTimeDate.getTime())) {
                    console.error(`[updateTodoSchedule] Invalid startTime format: ${scheduleData.startTime}`);
                    newStartTimeDate = null; // Reset to null if invalid
                }
            }
            if ((oldStartTime instanceof Date ? oldStartTime.getTime() : null) !== (newStartTimeDate ? newStartTimeDate.getTime() : null)) {
                todo.schedule.startTime = newStartTimeDate;
                todo.schedule.notifiedStart = false;
                console.log(`[updateTodoSchedule] notifiedStart reset to false for todo ${id} (startTime changed)`);
            }
        }

        // startModal 처리
        if (scheduleData.hasOwnProperty('startModal')) {
            todo.schedule.startModal = scheduleData.startModal;
        }

        // startNotification 처리
        if (scheduleData.hasOwnProperty('startNotification')) {
            todo.schedule.startNotification = scheduleData.startNotification;
        }

        // dueTime 처리
        let newDueTimeDate = null;
        if (scheduleData.hasOwnProperty('dueTime')) {
            if (scheduleData.dueTime !== null) {
                newDueTimeDate = new Date(scheduleData.dueTime);
                // Check if parsing was successful
                if (isNaN(newDueTimeDate.getTime())) {
                    console.error(`[updateTodoSchedule] Invalid dueTime format: ${scheduleData.dueTime}`);
                    newDueTimeDate = null; // Reset to null if invalid
                }
            }
            if ((oldDueTime instanceof Date ? oldDueTime.getTime() : null) !== (newDueTimeDate ? newDueTimeDate.getTime() : null)) {
                todo.schedule.dueTime = newDueTimeDate;
                todo.schedule.notifiedDue = false;
                console.log(`[updateTodoSchedule] notifiedDue reset to false for todo ${id} (dueTime changed)`);
            }
        }

        // dueModal 처리
        if (scheduleData.hasOwnProperty('dueModal')) {
            todo.schedule.dueModal = scheduleData.dueModal;
        }

        // dueNotification 처리
        if (scheduleData.hasOwnProperty('dueNotification')) {
            todo.schedule.dueNotification = scheduleData.dueNotification;
        }

        // 시간이 null로 설정되면 해당 알림 상태도 초기화 (기존 로직 유지)
        // 이 부분은 위의 변경 감지 로직에 통합되어 중복될 수 있으므로, 제거하거나 명확히 분리해야 함.
        // 현재는 시간 변경으로 인해 null이 될 경우에도 notified가 false로 설정되므로 이 로직은 유지.
        if (todo.schedule.startTime === null) {
            todo.schedule.notifiedStart = false;
        }
        if (todo.schedule.dueTime === null) {
            todo.schedule.notifiedDue = false;
        }

        storage.saveTodos(todos);
        triggerChange();
        console.log(`[updateTodoSchedule] After update - Todo ID: ${id}, Updated schedule:`, JSON.parse(JSON.stringify(todo.schedule)));
        return true;
    };

    const getTodoSchedule = (id) => {
        const todo = todos.find(todo => todo.id === id);
        return todo?.schedule || null;
    };

    const clearTodoSchedule = (id) => {
        const todo = todos.find(todo => todo.id === id);
        if (!todo) return false;

        todo.schedule = {
            startTime: null,
            startModal: true,
            startNotification: true,
            dueTime: null,
            dueModal: true,
            dueNotification: true,
            notifiedStart: false,
            notifiedDue: false
        };

        storage.saveTodos(todos);
        triggerChange();
        return true;
    };

    // 알림 상태 업데이트 (F-07 알림 기능을 위한 준비)
    const markNotified = (id, type) => {
        const todo = todos.find(todo => todo.id === id);
        if (!todo || !todo.schedule) return false;

        if (type === 'start') {
            todo.schedule.notifiedStart = true;
        } else if (type === 'due') {
            todo.schedule.notifiedDue = true;
        }

        storage.saveTodos(todos);
        triggerChange();
        return true;
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
        deleteTodo,
        // 일정 관련 함수들
        updateTodoSchedule,
        getTodoSchedule,
        clearTodoSchedule,
        markNotified
    };
})();
