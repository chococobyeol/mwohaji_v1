const storage = (() => {
    const TODOS_KEY = 'mwohaji-todos';
    const CATEGORIES_KEY = 'mwohaji-categories';
    const COMPLETED_REPEAT_KEY = 'mwohaji-completed-repeat';

    const getTodos = () => {
        try {
            const todos = localStorage.getItem(TODOS_KEY);
            const parsedTodos = todos ? JSON.parse(todos) : [];
            // 저장된 시간을 Date 객체로 변환하되, 로컬 시간으로 해석되도록 처리
            return parsedTodos.map(todo => {
                if (todo.schedule) {
                    if (todo.schedule.startTime) {
                        // 'YYYY-MM-DDTHH:mm:00' 형식의 문자열을 로컬 시간으로 파싱
                        todo.schedule.startTime = new Date(todo.schedule.startTime);
                    }
                    if (todo.schedule.dueTime) {
                        // 'YYYY-MM-DDTHH:mm:00' 형식의 문자열을 로컬 시간으로 파싱
                        todo.schedule.dueTime = new Date(todo.schedule.dueTime);
                    }
                    // 앱 로드 시 notified 상태를 항상 false로 초기화 (새로고침 시 알림 다시 울리도록)
                    // 이 부분은 제거되어야 합니다. 알림 상태는 markNotified에서만 변경되어야 합니다.
                    // todo.schedule.notifiedStart = false;
                    // todo.schedule.notifiedDue = false;
                }
                return todo;
            });
        } catch (e) {
            console.error('Failed to parse todos from localStorage', e);
            return [];
        }
    };

    const saveTodos = (todos) => {
        try {
            // 저장하기 전에 Date 객체를 'YYYY-MM-DDTHH:mm:00' 형식의 문자열로 변환하여 저장
            const todosToSave = todos.map(todo => {
                const newTodo = { ...todo };
                if (newTodo.schedule) {
                    if (newTodo.schedule.startTime instanceof Date) {
                        const date = newTodo.schedule.startTime;
                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const day = String(date.getDate()).padStart(2, '0');
                        const hours = String(date.getHours()).padStart(2, '0');
                        const minutes = String(date.getMinutes()).padStart(2, '0');
                        newTodo.schedule.startTime = `${year}-${month}-${day}T${hours}:${minutes}:00`;
                    }
                    if (newTodo.schedule.dueTime instanceof Date) {
                        const date = newTodo.schedule.dueTime;
                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const day = String(date.getDate()).padStart(2, '0');
                        const hours = String(date.getHours()).padStart(2, '0');
                        const minutes = String(date.getMinutes()).padStart(2, '0');
                        newTodo.schedule.dueTime = `${year}-${month}-${day}T${hours}:${minutes}:00`;
                    }
                }
                return newTodo;
            });
            localStorage.setItem(TODOS_KEY, JSON.stringify(todosToSave));
        } catch (e) {
            console.error('Failed to save todos to localStorage', e);
            // PRD 8.1. 용량 초과 시 에러 처리 연계
            alert('데이터 저장에 실패했습니다. 저장 공간이 부족할 수 있습니다.');
        }
    };

    const getCategories = () => {
        try {
            const categories = localStorage.getItem(CATEGORIES_KEY);
            // 카테고리가 없으면 기본 '일반' 카테고리를 포함하여 반환
            return categories ? JSON.parse(categories) : [{ id: 'default', name: '일반' }];
        } catch (e) {
            console.error('Failed to parse categories from localStorage', e);
            return [{ id: 'default', name: '일반' }];
        }
    };

    const saveCategories = (categories) => {
        try {
            localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
        } catch (e) {
            console.error('Failed to save categories to localStorage', e);
            alert('카테고리 저장에 실패했습니다.');
        }
    };

    const getCompletedRepeatTodos = () => {
        try {
            const completed = localStorage.getItem(COMPLETED_REPEAT_KEY);
            return completed ? JSON.parse(completed) : [];
        } catch (e) {
            console.error('Failed to parse completed repeat todos from localStorage', e);
            return [];
        }
    };

    const saveCompletedRepeatTodos = (completed) => {
        try {
            localStorage.setItem(COMPLETED_REPEAT_KEY, JSON.stringify(completed));
        } catch (e) {
            console.error('Failed to save completed repeat todos to localStorage', e);
        }
    };

    return {
        getTodos,
        saveTodos,
        getCategories,
        saveCategories,
        getCompletedRepeatTodos,
        saveCompletedRepeatTodos
    };
})();
