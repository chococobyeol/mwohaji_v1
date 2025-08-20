const aiChat = (() => {
    let isOpen = false;
    let messages = [];
    let apiKey = null;

    // 사이드바 열기
    const openSidebar = () => {
        console.log('[AIChat] openSidebar 함수 호출됨');
        const sidebar = document.getElementById('ai-chat-sidebar');
        const overlay = document.querySelector('.ai-chat-sidebar-overlay');
        const input = document.getElementById('ai-chat-input');
        
        console.log('[AIChat] DOM 요소 확인:', {
            sidebar: !!sidebar,
            overlay: !!overlay,
            input: !!input
        });
        
        if (sidebar && overlay && input) {
            isOpen = true;
            sidebar.style.display = 'flex';
            setTimeout(() => sidebar.classList.add('open'), 10);
            overlay.classList.add('open');
            overlay.style.display = 'block';
            input.focus();
            console.log('[AIChat] 사이드바 열기 완료');
        } else {
            console.error('[AIChat] 사이드바 열기 실패: 필요한 DOM 요소가 없습니다');
        }
    };

    // 사이드바 닫기
    const closeSidebar = () => {
        const sidebar = document.getElementById('ai-chat-sidebar');
        const overlay = document.querySelector('.ai-chat-sidebar-overlay');
        
        if (sidebar && overlay) {
            isOpen = false;
            sidebar.classList.remove('open');
            overlay.classList.remove('open');
            setTimeout(() => {
                sidebar.style.display = 'none';
                overlay.style.display = 'none';
            }, 300);
        }
    };

    // 상태 업데이트
    const updateStatus = (text, type = 'normal') => {
        const status = document.getElementById('ai-chat-status');
        const statusText = status?.querySelector('.status-text');
        
        if (statusText) {
            statusText.textContent = text;
            statusText.className = `status-text ${type}`;
        }
    };

    // 메시지 추가
    const addMessage = (text, sender, timestamp = new Date()) => {
        const messagesContainer = document.getElementById('ai-chat-messages');
        
        if (!messagesContainer) {
            console.error('[AIChat] 메시지 컨테이너를 찾을 수 없습니다.');
            return;
        }
        
        const message = {
            id: Date.now(),
            text,
            sender,
            timestamp
        };
        messages.push(message);
        renderMessage(message);
        scrollToBottom();
    };

    // 메시지 렌더링
    const renderMessage = (message) => {
        const messagesContainer = document.getElementById('ai-chat-messages');
        
        if (!messagesContainer) return;
        
        const messageElement = document.createElement('div');
        messageElement.className = `ai-chat-message ${message.sender}`;
        messageElement.dataset.id = message.id;

        const time = message.timestamp.toLocaleTimeString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit'
        });

        messageElement.innerHTML = `
            <div class="message-bubble ${message.sender}">${message.text}</div>
            <div class="message-time">${time}</div>
        `;

        messagesContainer.appendChild(messageElement);
    };

    // 스크롤을 맨 아래로
    const scrollToBottom = () => {
        const messagesContainer = document.getElementById('ai-chat-messages');
        if (messagesContainer) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    };

    // 메시지 전송
    const sendMessage = async () => {
        const input = document.getElementById('ai-chat-input');
        const sendBtn = document.getElementById('ai-chat-send-btn');
        
        if (!input || !sendBtn) {
            console.error('[AIChat] 입력 요소를 찾을 수 없습니다.');
            return;
        }
        
        const text = input.value.trim();
        if (!text) return;

        // API 키 확인
        if (!apiKey) {
            addMessage('AI API 키가 설정되지 않았습니다. 설정에서 API 키를 입력하거나, "test"를 입력하여 테스트 모드를 사용할 수 있습니다.', 'ai');
            return;
        }

        // 사용자 메시지 추가
        addMessage(text, 'user');
        input.value = '';

        // 전송 버튼 비활성화
        sendBtn.disabled = true;
        updateStatus('AI가 응답을 생성하고 있습니다...', 'connecting');

        try {
            // AI 응답 요청
            const response = await geminiApi.sendMessage(text, getContext());
            
            if (response.success) {
                addMessage(response.message, 'ai');
                updateStatus('대화 준비됨');
            } else {
                const err = response && response.error ? String(response.error) : '';
                const msg = response && response.message ? String(response.message) : '';
                const display = err ? `오류가 발생했습니다: ${err}${msg ? `\n${msg}` : ''}` : (msg || '오류가 발생했습니다.');
                addMessage(display, 'ai');
                updateStatus('오류 발생', 'error');
            }
        } catch (error) {
            console.error('AI 응답 오류:', error);
            addMessage('AI 응답을 받는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.', 'ai');
            updateStatus('오류 발생', 'error');
        } finally {
            sendBtn.disabled = false;
        }
    };

    // 앱 컨텍스트 정보 가져오기
    const getContext = () => {
        const todos = todoManager.getTodos();
        const categories = todoManager.getCategories();
        const recentMessages = messages.slice(-10).map(m => ({
            sender: m.sender,
            text: m.text,
            timestamp: m.timestamp instanceof Date ? m.timestamp.toISOString() : m.timestamp
        }));
        
        return {
            todos: todos.filter(todo => !todo.completed).slice(0, 10), // 최근 10개 미완료 할 일
            categories: categories.map(cat => cat.name),
            totalTodos: todos.length,
            completedTodos: todos.filter(todo => todo.completed).length,
            currentTime: (() => {
                const now = new Date();
                const localTime = new Date(now.getTime() - (now.getTimezoneOffset() * 60000));
                return localTime.toISOString().slice(0, -1); // 'Z' 제거하여 로컬 시간으로 표시
            })(),
            conversation: recentMessages
        };
    };

    // API 키 초기화
    const clearApiKey = async () => {
        apiKey = null;
        await geminiApi.clearApiKey();
        updateStatus('API 키가 설정되지 않음', 'error');
    };

    // 대화 히스토리 초기화
    const clearHistory = () => {
        messages = [];
        const messagesContainer = document.getElementById('ai-chat-messages');
        if (messagesContainer) {
            messagesContainer.innerHTML = '';
        }
        // geminiApi의 대화 히스토리도 초기화
        if (window.geminiApi && window.geminiApi.clearHistory) {
            window.geminiApi.clearHistory();
        }
        console.log('[AIChat] 대화 히스토리 초기화 완료');
    };

    // API 키 설정 및 유효성 검증
    const setApiKey = async (key) => {
        apiKey = key;
        if (key) {
            // API 키 유효성 검증
            try {
                updateStatus('API 키 검증 중...', 'warning');
                await geminiApi.setApiKey(key);
                updateStatus('AI 연결됨');
                console.log('[AIChat] API 키 유효성 검증 성공');
            } catch (error) {
                updateStatus('API 키가 유효하지 않습니다', 'error');
                console.error('[AIChat] API 키 유효성 검증 실패:', error);
                apiKey = null;
            }
        } else {
            updateStatus('API 키가 설정되지 않음', 'error');
        }
    };

    // 초기화
    const init = async () => {
        // AI 기능이 활성화되어 있는지 확인
        const isAiEnabled = storage.getAiFeatureEnabled();
        if (!isAiEnabled) {
            console.log('[AIChat] AI 기능이 비활성화되어 있어 초기화 건너뛰기');
            return;
        }
        
        console.log('[AIChat] 초기화 시작');
        
        // DOM 요소들이 존재하는지 확인
        const requiredElements = {
            sidebar: document.getElementById('ai-chat-sidebar'),
            overlay: document.querySelector('.ai-chat-sidebar-overlay'),
            toggleBtn: document.getElementById('ai-chat-toggle-btn'),
            closeBtn: document.getElementById('close-ai-chat-sidebar'),
            messagesContainer: document.getElementById('ai-chat-messages'),
            input: document.getElementById('ai-chat-input'),
            sendBtn: document.getElementById('ai-chat-send-btn'),
            status: document.getElementById('ai-chat-status')
        };
        
        // 누락된 요소들 확인
        const missingElements = Object.entries(requiredElements)
            .filter(([name, element]) => !element)
            .map(([name]) => name);
            
        if (missingElements.length > 0) {
            console.error('[AIChat] 누락된 DOM 요소들:', missingElements);
            return;
        }
        
        // DOM 요소들을 변수에 할당
        const { sidebar, overlay, toggleBtn, closeBtn, messagesContainer, input, sendBtn, status } = requiredElements;
        const statusText = status?.querySelector('.status-text');

        try {
            // 기존 이벤트 리스너 제거 (중복 방지)
            toggleBtn.removeEventListener('click', openSidebar);
            closeBtn.removeEventListener('click', closeSidebar);
            overlay.removeEventListener('click', closeSidebar);
            sendBtn.removeEventListener('click', sendMessage);
            
            // 이벤트 리스너 등록
            toggleBtn.addEventListener('click', openSidebar);
            closeBtn.addEventListener('click', closeSidebar);
            overlay.addEventListener('click', closeSidebar);
            
            console.log('[AIChat] 이벤트 리스너 등록 완료');
            console.log('[AIChat] toggleBtn 클릭 이벤트 리스너 추가됨');
            
            sendBtn.addEventListener('click', sendMessage);
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                }
            });

            // 초기 메시지 추가 (이미 있는 경우 건너뛰기)
            if (messagesContainer.children.length === 0) {
                addMessage('안녕하세요! 할 일이나 일정에 대해 말씀해주세요. 예를 들어:\n\n• "오늘 3시에 회의 준비 알림 설정"\n• "업무 카테고리에 보고서 작성 추가"\n• "새 카테고리 만들기: 건강관리"', 'ai');
            }

            // 저장된 API 키 로드 및 유효성 검증
            const savedApiKey = storage.getAiApiKey();
            if (savedApiKey) {
                await setApiKey(savedApiKey); // 비동기 함수 호출
            } else {
                updateStatus('API 키 설정 필요', 'error');
            }
            
            console.log('[AIChat] 초기화 완료');
        } catch (error) {
            console.error('[AIChat] 초기화 중 오류 발생:', error);
        }
    };

    return {
        init,
        openSidebar,
        closeSidebar,
        setApiKey,
        clearApiKey,
        addMessage,
        clearHistory
    };
})();

// 전역 스코프에 노출
window.aiChat = aiChat;