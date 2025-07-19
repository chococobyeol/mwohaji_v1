const storage = (() => {
    const TODOS_KEY = 'mwohaji-todos';
    const CATEGORIES_KEY = 'mwohaji-categories';

    const getTodos = () => {
        try {
            const todos = localStorage.getItem(TODOS_KEY);
            return todos ? JSON.parse(todos) : [];
        } catch (e) {
            console.error('Failed to parse todos from localStorage', e);
            return [];
        }
    };

    const saveTodos = (todos) => {
        try {
            localStorage.setItem(TODOS_KEY, JSON.stringify(todos));
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

    return {
        getTodos,
        saveTodos,
        getCategories,
        saveCategories
    };
})();
