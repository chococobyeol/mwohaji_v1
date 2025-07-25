const storage = (() => {
    const TODOS_KEY = 'mwohaji-todos';
    const CATEGORIES_KEY = 'mwohaji-categories';
    const COMPLETED_REPEAT_KEY = 'mwohaji-completed-repeat';
    const SETTINGS_KEY = 'mwohaji-settings';

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
            let parsedCategories = categories ? JSON.parse(categories) : [{ id: 'default', name: '일반' }];
            
            // 기존 카테고리들에 createdAt 필드가 없다면 추가
            parsedCategories = parsedCategories.map(category => {
                if (!category.createdAt) {
                    // 기본 '일반' 카테고리는 오래된 날짜로 설정
                    if (category.name === '일반') {
                        category.createdAt = new Date('2020-01-01').toISOString();
                    } else {
                        // 카테고리 ID에서 타임스탬프 추출하여 실제 생성 시간 추정
                        const idMatch = category.id.match(/cat-(\d+)/);
                        if (idMatch) {
                            const timestamp = parseInt(idMatch[1]);
                            category.createdAt = new Date(timestamp).toISOString();
                        } else {
                            // ID에서 추출할 수 없는 경우 현재 시간으로 설정
                            category.createdAt = new Date().toISOString();
                        }
                    }
                }
                return category;
            });
            
            return parsedCategories;
        } catch (e) {
            console.error('Failed to parse categories from localStorage', e);
            return [{ id: 'default', name: '일반', createdAt: new Date('2020-01-01').toISOString() }];
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

    // 설정 저장/불러오기
    const getSettings = () => {
        try {
            const settings = localStorage.getItem(SETTINGS_KEY);
            const defaultSettings = {
                showCompleted: true // 기본값: 완료된 할 일 표시
            };
            return settings ? { ...defaultSettings, ...JSON.parse(settings) } : defaultSettings;
        } catch (e) {
            console.error('Failed to parse settings from localStorage', e);
            return { showCompleted: true };
        }
    };

    const saveSettings = (settings) => {
        try {
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
        } catch (e) {
            console.error('Failed to save settings to localStorage', e);
        }
    };

    return {
        getTodos,
        saveTodos,
        getCategories,
        saveCategories,
        getCompletedRepeatTodos,
        saveCompletedRepeatTodos,
        getSettings,
        saveSettings
    };
})();
