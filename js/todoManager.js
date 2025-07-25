const todoManager = (() => {
    let todos = [];
    let categories = [];
    let onTodosChangeCallback = null;
    let completedRepeatTodos = [];

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
        // 일반 할 일과 완료된 반복 할 일을 모두 포함하여 반환
        return [...todos, ...completedRepeatTodos];
    };

    const setCategories = (newCategories) => {
        categories = newCategories;
    };

    const getCategories = () => {
        return categories;
    };

    const setCompletedRepeatTodos = (newCompleted) => {
        completedRepeatTodos = newCompleted;
    };

    const getCompletedRepeatTodos = () => {
        return completedRepeatTodos;
    };

    const addCompletedRepeatTodo = (todo, completedAt) => {
        const completed = { 
            ...todo, 
            id: Date.now() + Math.random(), // 고유한 ID 생성
            completed: true,  // 완료 상태로 설정
            completedAt
            // 모든 정보 보존 (일정 정보도 포함)
        };
        
        // 알림 상태도 함께 복사 (notifiedStart, notifiedDue)
        if (completed.schedule) {
            completed.schedule.notifiedStart = todo.schedule?.notifiedStart || false;
            completed.schedule.notifiedDue = todo.schedule?.notifiedDue || false;
        }
        
        completedRepeatTodos.push(completed);
        storage.saveCompletedRepeatTodos(completedRepeatTodos);
    };

    // F-01: 할 일 생성 (변경된 방식)
    const addTodo = (text, categoryId = 'default', repeat = null) => {
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
            schedule: {
                startTime: null,
                startModal: true,
                startNotification: true,
                dueTime: null,
                dueModal: true,
                dueNotification: true,
                notifiedStart: false,
                notifiedDue: false
            },
            repeat // 반복 옵션 추가
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
        const newCategory = { 
            id: `cat-${Date.now()}`, 
            name: name.trim(),
            createdAt: new Date().toISOString()
        };
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

    const deleteCategoryAndMoveTodos = (id, targetCategoryName) => {
        if (id === 'default') {
            alert('기본 카테고리는 삭제할 수 없습니다.');
            return;
        }
        const categoryToDelete = categories.find(c => c.id === id);
        if (!categoryToDelete) return;

        categories = categories.filter(c => c.id !== id);
        storage.saveCategories(categories);

        // 해당 카테고리의 할 일을 지정된 카테고리로 변경
        todos.forEach(todo => {
            if (todo.category === categoryToDelete.name) {
                todo.category = targetCategoryName;
            }
        });
        storage.saveTodos(todos);
        triggerChange();
    };

    const deleteCategoryAndTodos = (id) => {
        if (id === 'default') {
            alert('기본 카테고리는 삭제할 수 없습니다.');
            return;
        }
        const categoryToDelete = categories.find(c => c.id === id);
        if (!categoryToDelete) return;

        categories = categories.filter(c => c.id !== id);
        storage.saveCategories(categories);

        // 해당 카테고리의 할 일을 모두 삭제
        todos = todos.filter(todo => todo.category !== categoryToDelete.name);
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
            if (todo.repeat) {
                // 반복 일정이면 완료 기록에 복사본 저장
                addCompletedRepeatTodo(todo, new Date().toISOString());
                // 원본은 그대로 두고 완료 표시하지 않음 (반복이므로)
                // 반복 할 일 완료 시 notified 상태를 리셋하여 다음 반복에서 알림이 울리도록 함
                if (todo.schedule) {
                    todo.schedule.notifiedStart = false;
                    todo.schedule.notifiedDue = false;
                }
                console.log(`[toggleTodoStatus] 반복 할 일 완료: ${todo.text} (완료 시간: ${new Date().toISOString()})`);
                storage.saveTodos(todos);
                triggerChange(); // UI 업데이트를 위해 호출
            } else {
                todo.completed = !todo.completed;
                if (todo.completed) {
                    // 완료할 때 시간 저장
                    todo.completedAt = new Date().toISOString();
                } else {
                    // 미완료로 되돌릴 때 시간 제거
                    delete todo.completedAt;
                }
                storage.saveTodos(todos);
                triggerChange();
            }
        }
    };

    // F-04: 할 일 삭제
    const deleteTodo = (id) => {
        todos = todos.filter(todo => todo.id !== id);
        storage.saveTodos(todos);
        triggerChange();
    };

    // 완료된 반복 할 일 삭제
    const deleteCompletedRepeatTodo = (id) => {
        completedRepeatTodos = completedRepeatTodos.filter(todo => todo.id !== id);
        storage.saveCompletedRepeatTodos(completedRepeatTodos);
        triggerChange();
    };

    // F-09: 일정 설정 관련 함수들
    const updateTodoSchedule = (id, scheduleData) => {
        const todo = todos.find(todo => todo.id === id);
        if (!todo) return false;

        console.log(`[updateTodoSchedule] Before update - Todo ID: ${id}, Current schedule:`, todo.schedule ? JSON.parse(JSON.stringify(todo.schedule)) : 'undefined');
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
        if (scheduleData.hasOwnProperty('startTime')) {
            let newStartTimeDate = null;
            if (scheduleData.startTime !== null) {
                newStartTimeDate = new Date(scheduleData.startTime);
                // Check if parsing was successful
                if (isNaN(newStartTimeDate.getTime())) {
                    console.error(`[updateTodoSchedule] Invalid startTime format: ${scheduleData.startTime}`);
                    newStartTimeDate = null; // Reset to null if invalid
                } else {
                    // 날짜 유효성 추가 검사
                    const now = new Date();
                    const minDate = new Date(now.getFullYear() - 1, 0, 1); // 1년 전
                    const maxDate = new Date(now.getFullYear() + 10, 11, 31); // 10년 후
                    
                    if (newStartTimeDate < minDate || newStartTimeDate > maxDate) {
                        console.error(`[updateTodoSchedule] startTime out of valid range: ${newStartTimeDate}`);
                        newStartTimeDate = null;
                    }
                }
            }
            
            // 기존 값과 새 값 비교 (문자열/Date/null 처리 포함)
            let oldStartTimeValue = null;
            if (oldStartTime instanceof Date) {
                oldStartTimeValue = oldStartTime.getTime();
            } else if (typeof oldStartTime === 'string') {
                const parsedOldStartTime = new Date(oldStartTime);
                if (!isNaN(parsedOldStartTime.getTime())) {
                    oldStartTimeValue = parsedOldStartTime.getTime();
                }
            }
            
            const newStartTimeValue = newStartTimeDate instanceof Date ? newStartTimeDate.getTime() : null;
            
            console.log(`[updateTodoSchedule] startTime 비교: old=${oldStartTimeValue}, new=${newStartTimeValue}`);
            console.log(`[updateTodoSchedule] startTime 원본: old="${oldStartTime}", new="${scheduleData.startTime}"`);
            
            // null 값도 명시적으로 처리
            if (oldStartTimeValue !== newStartTimeValue) {
                todo.schedule.startTime = newStartTimeDate;
                todo.schedule.notifiedStart = false;
                console.log(`[updateTodoSchedule] startTime 변경: ${oldStartTimeValue} -> ${newStartTimeValue}`);
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
        if (scheduleData.hasOwnProperty('dueTime')) {
            let newDueTimeDate = null;
            if (scheduleData.dueTime !== null) {
                newDueTimeDate = new Date(scheduleData.dueTime);
                // Check if parsing was successful
                if (isNaN(newDueTimeDate.getTime())) {
                    console.error(`[updateTodoSchedule] Invalid dueTime format: ${scheduleData.dueTime}`);
                    newDueTimeDate = null; // Reset to null if invalid
                } else {
                    // 날짜 유효성 추가 검사
                    const now = new Date();
                    const minDate = new Date(now.getFullYear() - 1, 0, 1); // 1년 전
                    const maxDate = new Date(now.getFullYear() + 10, 11, 31); // 10년 후
                    
                    if (newDueTimeDate < minDate || newDueTimeDate > maxDate) {
                        console.error(`[updateTodoSchedule] dueTime out of valid range: ${newDueTimeDate}`);
                        newDueTimeDate = null;
                    }
                }
            }
            
            // 기존 값과 새 값 비교 (문자열/Date/null 처리 포함)
            let oldDueTimeValue = null;
            if (oldDueTime instanceof Date) {
                oldDueTimeValue = oldDueTime.getTime();
            } else if (typeof oldDueTime === 'string') {
                const parsedOldDueTime = new Date(oldDueTime);
                if (!isNaN(parsedOldDueTime.getTime())) {
                    oldDueTimeValue = parsedOldDueTime.getTime();
                }
            }
            
            const newDueTimeValue = newDueTimeDate instanceof Date ? newDueTimeDate.getTime() : null;
            
            console.log(`[updateTodoSchedule] dueTime 비교: old=${oldDueTimeValue}, new=${newDueTimeValue}`);
            console.log(`[updateTodoSchedule] dueTime 원본: old="${oldDueTime}", new="${scheduleData.dueTime}"`);
            
            // null 값도 명시적으로 처리
            if (oldDueTimeValue !== newDueTimeValue) {
                todo.schedule.dueTime = newDueTimeDate;
                todo.schedule.notifiedDue = false;
                console.log(`[updateTodoSchedule] dueTime 변경: ${oldDueTimeValue} -> ${newDueTimeValue}`);
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
        console.log(`[updateTodoSchedule] After update - Todo ID: ${id}, Updated schedule:`, todo.schedule ? JSON.parse(JSON.stringify(todo.schedule)) : 'undefined');
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
        deleteCategoryAndMoveTodos,
        deleteCategoryAndTodos,
        updateTodoText,
        updateTodoCategory,
        toggleTodoStatus,
        deleteTodo,
        // 일정 관련 함수들
        updateTodoSchedule,
        getTodoSchedule,
        clearTodoSchedule,
        markNotified,
        // 반복 일정 완료 기록 관련
        setCompletedRepeatTodos,
        getCompletedRepeatTodos,
        deleteCompletedRepeatTodo
    };
})();
