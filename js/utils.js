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

    // Google Drive API 환경변수 로더
    const loadGoogleDriveConfig = async () => {
        console.log('환경변수 로드 시작...');
        try {
            // .env 파일에서 설정 읽기 시도
            console.log('.env 파일 fetch 시도...');
            const response = await fetch('.env');
            console.log('.env 파일 응답:', response.status, response.ok);
            
            if (response.ok) {
                const envText = await response.text();
                console.log('.env 파일 로드 성공, 내용 길이:', envText.length);
                const config = {};
                
                envText.split('\n').forEach(line => {
                    const trimmed = line.trim();
                    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
                        const [key, value] = trimmed.split('=', 2);
                        config[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
                    }
                });
                
                console.log('환경변수 파싱 완료, 키 개수:', Object.keys(config).length);
                console.log('GOOGLE_CLIENT_ID 존재:', !!config.GOOGLE_CLIENT_ID);
                console.log('GOOGLE_API_KEY 존재:', !!config.GOOGLE_API_KEY);
                console.log('GOOGLE_SCOPE 설정됨:', !!config.GOOGLE_SCOPE);
                
                if (config.GOOGLE_CLIENT_ID && config.GOOGLE_API_KEY) {
                    console.log('Google Drive 환경변수를 .env 파일에서 로드했습니다.');
                    const finalConfig = {
                        apiKey: config.GOOGLE_API_KEY,
                        clientId: config.GOOGLE_CLIENT_ID,
                        scope: config.GOOGLE_SCOPE || 'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/drive.file',
                        discoveryDocs: [config.GOOGLE_DISCOVERY_DOCS || 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest']
                    };
                    console.log('최종 설정:', { ...finalConfig, apiKey: finalConfig.apiKey ? '[설정됨]' : '[누락]' });
                    return finalConfig;
                } else {
                    console.warn('필수 환경변수가 누락됨:', {
                        GOOGLE_CLIENT_ID: !!config.GOOGLE_CLIENT_ID,
                        GOOGLE_API_KEY: !!config.GOOGLE_API_KEY
                    });
                }
            } else {
                console.warn('.env 파일을 찾을 수 없음:', response.status);
            }
        } catch (error) {
            console.warn('환경변수 파일 로드 실패:', error.message);
        }
        
        // 폴백: 전역 변수에서 설정 읽기
        console.log('전역 변수 폴백 확인...');
        const globalConfig = window.GOOGLE_DRIVE_CONFIG || {};
        console.log('전역 설정:', globalConfig);
        if (globalConfig.clientId && globalConfig.apiKey) {
            console.log('Google Drive 환경변수를 전역 변수에서 로드했습니다.');
            return {
                ...globalConfig,
                scope: globalConfig.scope || 'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/drive.file'
            };
        }
        
        // 설정이 없는 경우
        console.error('Google Drive API 설정을 찾을 수 없습니다. .env 파일을 확인하거나 window.GOOGLE_DRIVE_CONFIG를 설정해주세요.');
        return null;
    };

    // 시간 경과 표시
    const getTimeAgo = (date) => {
        if (!date) return '알 수 없음';
        
        const now = new Date();
        const target = new Date(date);
        const diffMs = now - target;
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);
        
        if (diffMs < 0) {
            return '미래 시간';
        } else if (diffMins < 1) {
            return '방금 전';
        } else if (diffMins < 60) {
            return `${diffMins}분 전`;
        } else if (diffHours < 24) {
            return `${diffHours}시간 전`;
        } else if (diffDays < 7) {
            return `${diffDays}일 전`;
        } else {
            return formatDate(target, 'YYYY-MM-DD HH:mm');
        }
    };

    // 간단한 토스트 알림
    const showToast = (message, type = 'info') => {
        const toast = document.createElement('div');
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#3b82f6'};
            color: white;
            padding: 12px 16px;
            border-radius: 6px;
            z-index: 10000;
            font-size: 14px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            transition: all 0.3s ease;
            transform: translateX(100%);
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.transform = 'translateX(0)';
        }, 10);
        
        setTimeout(() => {
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
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
        getBackupStats,
        loadGoogleDriveConfig,
        getTimeAgo,
        showToast
    };
})();
