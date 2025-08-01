const storage = (() => {
    // 모든 localStorage 키를 상수로 정의
    const TODOS_KEY = 'mwohaji-todos';
    const CATEGORIES_KEY = 'mwohaji-categories';
    const COMPLETED_REPEAT_KEY = 'mwohaji-completed-repeat';
    const SETTINGS_KEY = 'mwohaji-settings';
    const REPEAT_COUNTS_KEY = 'mwohaji-repeat-counts';
    const AI_API_KEY = 'mwohaji-ai-api-key';
    const AI_FEATURE_ENABLED = 'mwohaji-ai-feature-enabled';

    // localStorage 사용 가능 여부 확인
    const isLocalStorageAvailable = () => {
        try {
            const test = '__localStorage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    };

    // 안전한 localStorage 읽기 함수
    const safeGet = (key, defaultValue = null) => {
        if (!isLocalStorageAvailable()) return defaultValue;
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (e) {
            console.warn(`Failed to parse localStorage item '${key}':`, e);
            return defaultValue;
        }
    };

    // 안전한 localStorage 쓰기 함수
    const safeSet = (key, value) => {
        if (!isLocalStorageAvailable()) return false;
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.error(`Failed to save to localStorage '${key}':`, e);
            return false;
        }
    };

    // 안전한 localStorage 삭제 함수
    const safeRemove = (key) => {
        if (!isLocalStorageAvailable()) return false;
        try {
            localStorage.removeItem(key);
            return true;
        } catch (e) {
            console.error(`Failed to remove localStorage item '${key}':`, e);
            return false;
        }
    };

    // Date 객체를 문자열로 변환하는 헬퍼 함수
    const dateToString = (date) => {
        if (!(date instanceof Date)) return date;
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}:00`;
    };

    // 문자열을 Date 객체로 변환하는 헬퍼 함수
    const stringToDate = (dateString) => {
        if (!dateString) return dateString;
        return new Date(dateString);
    };

    // 할 일 데이터의 Date 객체 처리
    const processTodoDates = (todo, toStorage = true) => {
        if (!todo.schedule) return todo;
        
        const processedTodo = { ...todo };
        if (toStorage) {
            // 저장 시: Date 객체를 문자열로 변환
            if (processedTodo.schedule.startTime instanceof Date) {
                processedTodo.schedule.startTime = dateToString(processedTodo.schedule.startTime);
            }
            if (processedTodo.schedule.dueTime instanceof Date) {
                processedTodo.schedule.dueTime = dateToString(processedTodo.schedule.dueTime);
            }
        } else {
            // 로드 시: 문자열을 Date 객체로 변환
            if (processedTodo.schedule.startTime) {
                processedTodo.schedule.startTime = stringToDate(processedTodo.schedule.startTime);
            }
            if (processedTodo.schedule.dueTime) {
                processedTodo.schedule.dueTime = stringToDate(processedTodo.schedule.dueTime);
            }
            // 알림 상태 초기화
            if (processedTodo.schedule.notifiedStart === undefined) {
                processedTodo.schedule.notifiedStart = false;
            }
            if (processedTodo.schedule.notifiedDue === undefined) {
                processedTodo.schedule.notifiedDue = false;
            }
        }
        return processedTodo;
    };

    const getTodos = () => {
        try {
            const todos = safeGet(TODOS_KEY, []);
            return todos.map(todo => processTodoDates(todo, false));
        } catch (e) {
            console.error('Failed to parse todos from localStorage', e);
            return [];
        }
    };

    const saveTodos = (todos) => {
        try {
            const todosToSave = todos.map(todo => processTodoDates(todo, true));
            const success = safeSet(TODOS_KEY, todosToSave);
            if (!success) {
                alert('데이터 저장에 실패했습니다. 저장 공간이 부족할 수 있습니다.');
            }
        } catch (e) {
            console.error('Failed to save todos to localStorage', e);
            alert('데이터 저장에 실패했습니다. 저장 공간이 부족할 수 있습니다.');
        }
    };

    const getCategories = () => {
        try {
            let parsedCategories = safeGet(CATEGORIES_KEY, [{ id: 'default', name: '일반' }]);
            
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
            const success = safeSet(CATEGORIES_KEY, categories);
            if (!success) {
                alert('카테고리 저장에 실패했습니다.');
            }
        } catch (e) {
            console.error('Failed to save categories to localStorage', e);
            alert('카테고리 저장에 실패했습니다.');
        }
    };

    const getCompletedRepeatTodos = () => {
        try {
            const completed = safeGet(COMPLETED_REPEAT_KEY, []);
            return completed.map(todo => processTodoDates(todo, false));
        } catch (e) {
            console.error('Failed to parse completed repeat todos from localStorage', e);
            return [];
        }
    };

    const saveCompletedRepeatTodos = (completed) => {
        try {
            const completedToSave = completed.map(todo => processTodoDates(todo, true));
            safeSet(COMPLETED_REPEAT_KEY, completedToSave);
        } catch (e) {
            console.error('Failed to save completed repeat todos to localStorage', e);
        }
    };

    // 반복 횟수 데이터 관리 함수 추가
    const getRepeatCounts = () => {
        try {
            return safeGet(REPEAT_COUNTS_KEY, {});
        } catch (e) {
            console.error('Failed to parse repeat counts from localStorage', e);
            return {};
        }
    };

    const saveRepeatCounts = (counts) => {
        try {
            const success = safeSet(REPEAT_COUNTS_KEY, counts);
            if (!success) {
                console.error('Failed to save repeat counts to localStorage');
            }
        } catch (e) {
            console.error('Failed to save repeat counts to localStorage', e);
        }
    };

    const removeRepeatCounts = () => {
        try {
            return safeRemove(REPEAT_COUNTS_KEY);
        } catch (e) {
            console.error('Failed to remove repeat counts from localStorage', e);
            return false;
        }
    };

    // 설정 저장/불러오기
    const getSettings = () => {
        try {
            const defaultSettings = {
                showCompleted: true, // 기본값: 완료된 할 일 표시
                todoSortOrder: 'created-desc', // 기본값: 생성일 최신순
                collapsedCategories: {}, // 기본값: 모든 카테고리 펼쳐짐
                autoScrollToCategory: true // 기본값: 카테고리 선택 시 자동 스크롤
            };
            const settings = safeGet(SETTINGS_KEY, null);
            return settings ? { ...defaultSettings, ...settings } : defaultSettings;
        } catch (e) {
            console.error('Failed to parse settings from localStorage', e);
            return { showCompleted: true, todoSortOrder: 'created-desc', collapsedCategories: {}, autoScrollToCategory: true };
        }
    };

    const saveSettings = (settings) => {
        try {
            safeSet(SETTINGS_KEY, settings);
        } catch (e) {
            console.error('Failed to save settings to localStorage', e);
        }
    };

    // AI API 키 저장/불러오기
    const getAiApiKey = () => {
        try {
            return localStorage.getItem(AI_API_KEY) || '';
        } catch (e) {
            console.error('Failed to get AI API key from localStorage', e);
            return '';
        }
    };

    const saveAiApiKey = (key) => {
        try {
            localStorage.setItem(AI_API_KEY, key);
        } catch (e) {
            console.error('Failed to save AI API key to localStorage', e);
        }
    };

    // AI 기능 활성화 상태 저장/불러오기
    const getAiFeatureEnabled = () => {
        try {
            const enabled = localStorage.getItem(AI_FEATURE_ENABLED);
            // null이거나 'false'인 경우 false 반환, 'true'인 경우만 true 반환
            return enabled === 'true';
        } catch (e) {
            console.error('Failed to get AI feature enabled status from localStorage', e);
            return false; // 기본값: 비활성화
        }
    };

    const saveAiFeatureEnabled = (enabled) => {
        try {
            localStorage.setItem(AI_FEATURE_ENABLED, enabled ? 'true' : 'false');
        } catch (e) {
            console.error('Failed to save AI feature enabled status to localStorage', e);
        }
    };

    // 모든 데이터 초기화
    const clearAllData = () => {
        try {
            const keys = [TODOS_KEY, CATEGORIES_KEY, COMPLETED_REPEAT_KEY, REPEAT_COUNTS_KEY, SETTINGS_KEY, AI_API_KEY, AI_FEATURE_ENABLED];
            keys.forEach(key => safeRemove(key));
            console.log('All localStorage data cleared successfully');
        } catch (e) {
            console.error('Failed to clear localStorage data', e);
        }
    };

    return {
        // 기존 함수들
        getTodos,
        saveTodos,
        getCategories,
        saveCategories,
        getCompletedRepeatTodos,
        saveCompletedRepeatTodos,
        getSettings,
        saveSettings,
        getAiApiKey,
        saveAiApiKey,
        getAiFeatureEnabled,
        saveAiFeatureEnabled,
        clearAllData,
        
        // 새로운 함수들
        getRepeatCounts,
        saveRepeatCounts,
        removeRepeatCounts,
        
        // 유틸리티 함수들 (다른 모듈에서 사용 가능)
        isLocalStorageAvailable,
        safeGet,
        safeSet,
        safeRemove,
        
        // 상수들 (다른 모듈에서 사용 가능)
        KEYS: {
            TODOS_KEY,
            CATEGORIES_KEY,
            COMPLETED_REPEAT_KEY,
            SETTINGS_KEY,
            REPEAT_COUNTS_KEY,
            AI_API_KEY,
            AI_FEATURE_ENABLED
        }
    };
})();
