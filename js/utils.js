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

    // 로컬 스토리지 유틸리티 (추가 안전성)
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

    const safeLocalStorageGet = (key, defaultValue = null) => {
        if (!isLocalStorageAvailable()) return defaultValue;
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (e) {
            console.warn(`Failed to parse localStorage item '${key}':`, e);
            return defaultValue;
        }
    };

    const safeLocalStorageSet = (key, value) => {
        if (!isLocalStorageAvailable()) return false;
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.error(`Failed to save to localStorage '${key}':`, e);
            return false;
        }
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

    return {
        formatDate,
        formatDateTime,
        createElement,
        removeElement,
        truncateText,
        escapeHtml,
        groupBy,
        sortBy,
        isLocalStorageAvailable,
        safeLocalStorageGet,
        safeLocalStorageSet,
        debounce,
        addEventListeners,
        isValidEmail,
        isValidUrl,
        formatFileSize
    };
})();
