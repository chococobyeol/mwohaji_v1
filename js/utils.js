const utils = (() => {
    // 날짜 포맷팅 함수들
    const formatDate = (date, format = 'YYYY-MM-DD') => {
        if (!date) return '';
        const d = new Date(date);
        if (isNaN(d.getTime())) return '';
        
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        
        return format
            .replace('YYYY', year)
            .replace('MM', month)
            .replace('DD', day)
            .replace('HH', hours)
            .replace('mm', minutes);
    };

    const formatDateTime = (date) => {
        return formatDate(date, 'YYYY-MM-DD HH:mm');
    };

    // DOM 조작 헬퍼 함수들
    const createElement = (tag, className = '', textContent = '') => {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (textContent) element.textContent = textContent;
        return element;
    };

    const removeElement = (element) => {
        if (element && element.parentNode) {
            element.parentNode.removeChild(element);
        }
    };

    // 문자열 유틸리티
    const truncateText = (text, maxLength = 50) => {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength - 3) + '...';
    };

    const escapeHtml = (text) => {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    };

    // 배열 유틸리티
    const groupBy = (array, keyFn) => {
        return array.reduce((groups, item) => {
            const key = keyFn(item);
            if (!groups[key]) groups[key] = [];
            groups[key].push(item);
            return groups;
        }, {});
    };

    const sortBy = (array, keyFn, ascending = true) => {
        return [...array].sort((a, b) => {
            const aValue = keyFn(a);
            const bValue = keyFn(b);
            
            if (aValue < bValue) return ascending ? -1 : 1;
            if (aValue > bValue) return ascending ? 1 : -1;
            return 0;
        });
    };

    // 디바운스 함수
    const debounce = (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    };

    // 이벤트 헬퍼
    const addEventListeners = (element, events) => {
        Object.keys(events).forEach(eventType => {
            element.addEventListener(eventType, events[eventType]);
        });
    };

    // 유효성 검사 함수들
    const isValidEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const isValidUrl = (url) => {
        try {
            new URL(url);
            return true;
        } catch (e) {
            return false;
        }
    };

    // 파일 크기 포맷팅
    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // 백업 데이터 검증 함수들
    const validateBackupData = (data) => {
        const errors = [];
        
        // 기본 구조 검증
        if (!data || typeof data !== 'object') {
            errors.push('데이터가 올바르지 않습니다.');
            return errors;
        }
        
        // 할 일 데이터 검증
        if (!Array.isArray(data.todos)) {
            errors.push('할 일 데이터가 배열이 아닙니다.');
        } else {
            data.todos.forEach((todo, index) => {
                if (!todo.id || !todo.text || !todo.category) {
                    errors.push(`할 일 ${index + 1}: 필수 필드가 누락되었습니다.`);
                }
                if (todo.schedule) {
                    if (todo.schedule.startTime && isNaN(new Date(todo.schedule.startTime).getTime())) {
                        errors.push(`할 일 ${index + 1}: 시작 시간이 올바르지 않습니다.`);
                    }
                    if (todo.schedule.dueTime && isNaN(new Date(todo.schedule.dueTime).getTime())) {
                        errors.push(`할 일 ${index + 1}: 마감 시간이 올바르지 않습니다.`);
                    }
                }
            });
        }
        
        // 카테고리 데이터 검증
        if (!Array.isArray(data.categories)) {
            errors.push('카테고리 데이터가 배열이 아닙니다.');
        } else {
            data.categories.forEach((category, index) => {
                if (!category.id || !category.name) {
                    errors.push(`카테고리 ${index + 1}: 필수 필드가 누락되었습니다.`);
                }
            });
        }
        
        // 완료된 반복 할 일 데이터 검증
        if (data.completedRepeatTodos && !Array.isArray(data.completedRepeatTodos)) {
            errors.push('완료된 반복 할 일 데이터가 배열이 아닙니다.');
        }
        
        return errors;
    };

    // 백업 데이터 통계 함수
    const getBackupStats = (data) => {
        if (!data) return null;
        
        const stats = {
            totalTodos: 0,
            completedTodos: 0,
            todosWithSchedule: 0,
            todosWithRepeat: 0,
            totalCategories: 0,
            completedRepeatTodos: 0
        };
        
        if (Array.isArray(data.todos)) {
            stats.totalTodos = data.todos.length;
            stats.completedTodos = data.todos.filter(t => t.completed).length;
            stats.todosWithSchedule = data.todos.filter(t => t.schedule && (t.schedule.startTime || t.schedule.dueTime)).length;
            stats.todosWithRepeat = data.todos.filter(t => t.repeat).length;
        }
        
        if (Array.isArray(data.categories)) {
            stats.totalCategories = data.categories.length;
        }
        
        if (Array.isArray(data.completedRepeatTodos)) {
            stats.completedRepeatTodos = data.completedRepeatTodos.length;
        }
        
        return stats;
    };

    return {
        formatDate,
        formatDateTime,
        createElement,
        removeElement,
        truncateText,
        escapeHtml,
        groupBy,
        sortBy,
        debounce,
        addEventListeners,
        isValidEmail,
        isValidUrl,
        formatFileSize,
        validateBackupData,
        getBackupStats
    };
})();
