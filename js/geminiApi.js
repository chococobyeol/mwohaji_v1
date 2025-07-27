const geminiApi = (() => {
    let apiKey = null;
    let conversationHistory = []; // 대화 히스토리 추가
    
    // 2025년 최신 Gemini API 모델들
    const MODELS = [
        'gemini-1.5-flash',
        'gemini-1.5-pro', 
        'gemini-1.0-pro',
        'gemini-pro'
    ];
    
    let currentModelIndex = 0;
    
    const getCurrentModel = () => {
        return `https://generativelanguage.googleapis.com/v1beta/models/${MODELS[currentModelIndex]}:generateContent`;
    };

    // 대화 히스토리 관리
    const addToHistory = (role, content) => {
        conversationHistory.push({
            role: role, // 'user' 또는 'assistant'
            content: content,
            timestamp: new Date().toISOString()
        });
        
        // 히스토리가 너무 길어지면 오래된 것부터 제거 (최대 10개)
        if (conversationHistory.length > 10) {
            conversationHistory = conversationHistory.slice(-10);
        }
    };

    const getConversationContext = () => {
        return conversationHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n');
    };

    const clearHistory = () => {
        conversationHistory = [];
    };

    // API 키 설정
    const setApiKey = (key) => {
        apiKey = key;
    };

    // 프롬프트 생성
    const createPrompt = (userInput, context) => {
        const conversationContext = getConversationContext();
        
        return `당신은 할 일 관리 앱의 AI 어시스턴트입니다. 사용자의 자연어 입력을 분석하여 할 일 관리 작업을 수행하도록 도와주세요.

현재 앱 상태:
- 할 일 목록: ${context.todos.length}개 (미완료: ${context.todos.filter(t => !t.completed).length}개)
- 카테고리: ${context.categories.join(', ') || '없음'}
- 현재 시간: ${new Date(context.currentTime).toLocaleString('ko-KR')}

${context.todos.length > 0 ? `현재 할 일 목록:
${context.todos.map((todo, index) => {
    const scheduleInfo = todo.schedule ? 
        (todo.schedule.startTime ? ` (시작: ${new Date(todo.schedule.startTime).toLocaleString('ko-KR')})` :
         todo.schedule.dueTime ? ` (마감: ${new Date(todo.schedule.dueTime).toLocaleString('ko-KR')})` : '') : '';
    return `${index + 1}. "${todo.text}" - ${todo.category}${scheduleInfo}${todo.completed ? ' (완료)' : ''}`;
}).join('\n')}` : '현재 설정된 할 일이 없습니다.'}

${conversationContext ? `이전 대화 내용:
${conversationContext}

위 대화 내용을 참고하여 맥락을 이해하고 응답해주세요.` : ''}

앱의 주요 기능:
1. 할 일 관리: 할 일 추가, 수정, 삭제, 완료 처리
2. 카테고리 관리: 카테고리 추가, 수정, 삭제 (없는 카테고리는 자동 생성)
3. 일정 설정: 시작 시간, 마감 시간 설정
4. 알림 기능: 설정된 시간에 모달 알림과 소리 알림
5. 반복 기능: 매일, 매주, 매월 반복 설정

시간 해석 규칙 (매우 중요):
- "1시", "2시" 등은 기본적으로 오전(AM)으로 해석
- "오후 1시", "PM 1시", "13시" 등은 오후(PM)로 해석
- "내일 1시" = 내일 오전 1시 (01:00)
- "내일 오후 1시" = 내일 오후 1시 (13:00)
- "오늘 3시" = 오늘 오전 3시 (03:00)
- "오늘 오후 3시" = 오늘 오후 3시 (15:00)

알림 타입 구분:
- 시작 알림 (startTime): "지금 시작하라", "X분 후에 시작", "지금 알림" → 시작 알림
- 마감 알림 (dueTime): "X시까지", "마감", "기한", "데드라인" → 마감 알림

사용 가능한 작업:
1. 할 일 추가: "할 일 추가: [내용] [카테고리]" (카테고리가 없으면 자동 생성)
2. 알림 설정: "알림 설정: [시간]" 또는 "X분 후 알림"
3. 알림 수정: "기존 알림을 [새시간]으로 수정" 또는 "오후 3시 알림을 오전 3시로 수정"
4. 카테고리 관리: "카테고리 추가/수정/삭제"
5. 할 일 완료/삭제: "할 일 완료/삭제: [할일ID]"
6. 할 일 카테고리 변경: "할 일 카테고리 변경: [할일ID] [새카테고리]" (카테고리가 없으면 자동 생성)
7. 정보 조회: "할 일 목록 보기", "카테고리별 할 일 보기"

사용자 입력: "${userInput}"

다음 JSON 형식으로만 응답해주세요 (코드 블록 없이, 순수 JSON만):

{
    "action": "명령 타입 (ADD_TODO, SET_SCHEDULE, ADD_CATEGORY, COMPLETE_TODO, DELETE_TODO, SHOW_INFO, CHAT)",
    "data": {
        // 명령에 필요한 데이터
        // SET_SCHEDULE의 경우: {"scheduleTime": "2025-07-28T01:00:00", "text": "알림 내용"}
        // ADD_TODO의 경우: {"text": "할 일 내용", "categoryId": "카테고리ID"}
        // UPDATE_TODO_CATEGORY의 경우: {"todoId": 할일ID, "newCategory": "새카테고리명"}
    },
    "message": "사용자에게 보여줄 친근한 메시지",
    "success": true/false
}

만약 명령을 실행할 수 없다면 action을 "CHAT"으로 하고 친근하게 대화해주세요.

예시 응답:
- "오늘 3시에 회의 준비 알림 설정" → ADD_TODO + SET_SCHEDULE (오전 3시)
- "업무 카테고리에 보고서 작성 추가" → ADD_TODO
- "새 카테고리 만들기: 건강관리" → ADD_CATEGORY
- "설거지 카테고리를 업무로 변경" → UPDATE_TODO_CATEGORY
- "2분후에 알림 추가해줘" → SET_SCHEDULE {"timeOffset": 2, "text": "알림"}
- "5분 후 알림" → SET_SCHEDULE {"timeOffset": 5, "text": "알림"}
- "내일 1시에 알림" → SET_SCHEDULE {"scheduleTime": "2025-07-28T01:00:00", "text": "알림"} (오전 1시)
- "내일 오후 1시에 알림" → SET_SCHEDULE {"scheduleTime": "2025-07-28T13:00:00", "text": "알림"} (오후 1시)
- "오후 3시 알림을 오전 3시로 수정" → UPDATE_SCHEDULE {"oldTime": "15:00", "newTime": "03:00", "text": "알림"}
- "할 일 삭제" → DELETE_TODO {"todoId": "할일ID"}
- "전부 다 삭제" → DELETE_TODO {"deleteAll": true}
- "특정 할 일들 삭제" → DELETE_TODO {"todoIds": ["할일ID1", "할일ID2"]}

중요: 반드시 유효한 JSON 형식으로만 응답하세요. 코드 블록이나 추가 텍스트 없이 JSON만 보내주세요.`;
    };

    // API 호출
    const sendMessage = async (userInput, context) => {
        if (!apiKey) {
            return {
                success: false,
                error: 'API 키가 설정되지 않았습니다. 설정에서 API 키를 입력해주세요.'
            };
        }

        // 로컬 테스트 모드 (API 키가 'test'인 경우)
        if (apiKey === 'test') {
            console.log('[GeminiAPI] 로컬 테스트 모드 실행:', userInput);
            return await handleLocalTest(userInput, context);
        }

        // 사용자 입력을 히스토리에 추가
        addToHistory('user', userInput);
        console.log('[GeminiAPI] 사용자 입력 히스토리에 추가:', userInput);
        console.log('[GeminiAPI] 현재 대화 히스토리:', getConversationContext());

        try {
            const prompt = createPrompt(userInput, context);
            
            const response = await fetch(`${getCurrentModel()}?key=${apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.7,
                        topK: 40,
                        topP: 0.95,
                        maxOutputTokens: 1024,
                    }
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('API 응답 오류:', errorData);
                
                // 모델을 찾을 수 없는 경우 다음 모델 시도
                if (errorData.error?.message?.includes('not found') && currentModelIndex < MODELS.length - 1) {
                    currentModelIndex++;
                    console.log(`모델 변경 시도: ${MODELS[currentModelIndex]}`);
                    return await sendMessage(userInput, context); // 재귀 호출
                }
                
                throw new Error(`API 오류: ${errorData.error?.message || response.statusText}`);
            }

            const data = await response.json();
            
            if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
                throw new Error('API 응답 형식이 올바르지 않습니다.');
            }

            const aiResponse = data.candidates[0].content.parts[0].text;
            console.log('[GeminiAPI] AI 응답:', aiResponse);
            
            // JSON 응답 파싱 시도
            try {
                // AI 응답에서 JSON 부분만 추출
                const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
                if (!jsonMatch) {
                    throw new Error('JSON을 찾을 수 없습니다.');
                }
                
                let jsonString = jsonMatch[0];
                
                // JSON 문자열 정리 (불필요한 문자 제거)
                jsonString = jsonString.replace(/[\u2018\u2019]/g, "'"); // 스마트 따옴표를 일반 따옴표로
                jsonString = jsonString.replace(/[\u201C\u201D]/g, '"'); // 스마트 따옴표를 일반 따옴표로
                
                console.log('[GeminiAPI] 정리된 JSON 문자열:', jsonString);
                
                const parsedResponse = JSON.parse(jsonString);
                console.log('[GeminiAPI] 파싱된 JSON:', parsedResponse);
                console.log('[GeminiAPI] 파싱된 data 객체:', parsedResponse.data);
                
                // AI 응답을 히스토리에 추가
                addToHistory('assistant', parsedResponse.message || aiResponse);
                
                // 명령 실행
                if (parsedResponse.success && parsedResponse.action !== 'CHAT') {
                    console.log('[GeminiAPI] 명령 실행 시작:', parsedResponse.action, parsedResponse.data);
                    const result = await executeCommand(parsedResponse.action, parsedResponse.data);
                    console.log('[GeminiAPI] 명령 실행 결과:', result);
                    return {
                        success: true,
                        message: result.message || parsedResponse.message
                    };
                } else {
                    console.log('[GeminiAPI] CHAT 모드 또는 success가 false');
                    return {
                        success: true,
                        message: parsedResponse.message || aiResponse
                    };
                }
            } catch (parseError) {
                console.error('[GeminiAPI] JSON 파싱 실패:', parseError);
                
                // 더 강력한 JSON 정리 시도
                try {
                    console.log('[GeminiAPI] 강력한 JSON 정리 시도');
                    let cleanedResponse = aiResponse;
                    
                    // 코드 블록 마커 제거
                    cleanedResponse = cleanedResponse.replace(/```json\s*/g, '').replace(/```\s*/g, '');
                    
                    // JSON 객체 찾기
                    const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        let jsonString = jsonMatch[0];
                        
                        // 특수 문자 정리
                        jsonString = jsonString.replace(/[\u2018\u2019]/g, "'");
                        jsonString = jsonString.replace(/[\u201C\u201D]/g, '"');
                        jsonString = jsonString.replace(/[\n\r\t]/g, ' ');
                        jsonString = jsonString.replace(/\s+/g, ' ');
                        
                        console.log('[GeminiAPI] 강력 정리 후 JSON:', jsonString);
                        
                        const parsedResponse = JSON.parse(jsonString);
                        console.log('[GeminiAPI] 강력 정리 후 파싱 성공:', parsedResponse);
                        
                        // AI 응답을 히스토리에 추가
                        addToHistory('assistant', parsedResponse.message || aiResponse);
                        
                        // 명령 실행
                        if (parsedResponse.success && parsedResponse.action !== 'CHAT') {
                            console.log('[GeminiAPI] 명령 실행 시작:', parsedResponse.action, parsedResponse.data);
                            const result = await executeCommand(parsedResponse.action, parsedResponse.data);
                            console.log('[GeminiAPI] 명령 실행 결과:', result);
                            return {
                                success: true,
                                message: result.message || parsedResponse.message
                            };
                        } else {
                            console.log('[GeminiAPI] CHAT 모드 또는 success가 false');
                            return {
                                success: true,
                                message: parsedResponse.message || aiResponse
                            };
                        }
                    }
                } catch (secondParseError) {
                    console.error('[GeminiAPI] 강력 정리 후에도 파싱 실패:', secondParseError);
                }
                
                // JSON 파싱 실패 시 일반 대화로 처리
                return {
                    success: true,
                    message: aiResponse
                };
            }

        } catch (error) {
            console.error('Gemini API 오류:', error);
            
            // 오류 상황을 AI에게 재전달하여 해결책 요청
            try {
                const errorContext = {
                    ...context,
                    error: error.message,
                    originalInput: userInput
                };
                
                const errorPrompt = `오류가 발생했습니다. 사용자의 원래 요청과 오류 상황을 분석하여 적절한 해결책을 제시해주세요.

원래 사용자 요청: "${userInput}"
발생한 오류: ${error.message}

현재 앱 상태:
- 할 일 목록: ${context.todos.length}개
- 카테고리: ${context.categories.join(', ') || '없음'}

다음 중 하나로 응답해주세요:
1. 오류를 수정한 명령 (JSON 형식)
2. 대안 제안 (CHAT 형식)
3. 사용자에게 추가 정보 요청 (CHAT 형식)

JSON 응답 형식:
{
    "action": "명령 타입",
    "data": { ... },
    "message": "사용자에게 보여줄 메시지",
    "success": true
}`;

                const errorResponse = await fetch(`${getCurrentModel()}?key=${apiKey}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{
                                text: errorPrompt
                            }]
                        }],
                        generationConfig: {
                            temperature: 0.7,
                            topK: 40,
                            topP: 0.95,
                            maxOutputTokens: 1024,
                        }
                    })
                });

                if (errorResponse.ok) {
                    const errorData = await errorResponse.json();
                    if (errorData.candidates && errorData.candidates[0] && errorData.candidates[0].content) {
                        const aiErrorResponse = errorData.candidates[0].content.parts[0].text;
                        
                        try {
                            const parsedErrorResponse = JSON.parse(aiErrorResponse);
                            if (parsedErrorResponse.success && parsedErrorResponse.action !== 'CHAT') {
                                // 오류 수정 명령 실행
                                const result = await executeCommand(parsedErrorResponse.action, parsedErrorResponse.data);
                                return {
                                    success: true,
                                    message: result.message || parsedErrorResponse.message
                                };
                            } else {
                                // 대안 제안 또는 추가 정보 요청
                                return {
                                    success: true,
                                    message: parsedErrorResponse.message || aiErrorResponse
                                };
                            }
                        } catch (parseError) {
                            // JSON 파싱 실패 시 일반 대화로 처리
                            return {
                                success: true,
                                message: aiErrorResponse
                            };
                        }
                    }
                }
            } catch (retryError) {
                console.error('오류 재처리 실패:', retryError);
            }
            
            // 모든 재처리 실패 시 원래 오류 반환
            return {
                success: false,
                error: error.message
            };
        }
    };

    // 로컬 테스트 모드 (API 없이 테스트)
    const handleLocalTest = async (userInput, context) => {
        const lowerInput = userInput.toLowerCase();
        
        // 시간 기반 알람 설정 (예: "내일 1시", "오늘 3시", "내일 오후 2시")
        if (lowerInput.includes('시') && (lowerInput.includes('내일') || lowerInput.includes('오늘'))) {
            const now = new Date();
            let targetDate = new Date(now);
            
            // 내일인지 오늘인지 확인
            if (lowerInput.includes('내일')) {
                targetDate.setDate(targetDate.getDate() + 1);
            }
            
            // 시간 추출 및 AM/PM 해석
            const timeMatch = userInput.match(/(\d+)시/);
            if (timeMatch) {
                let hour = parseInt(timeMatch[1]);
                
                // 오후/PM 키워드가 있으면 오후로 설정
                if (lowerInput.includes('오후') || lowerInput.includes('pm') || lowerInput.includes('p.m')) {
                    if (hour !== 12) hour += 12; // 12시는 그대로 유지
                } else if (lowerInput.includes('오전') || lowerInput.includes('am') || lowerInput.includes('a.m')) {
                    // 오전은 그대로 유지 (0-11시)
                } else {
                    // 키워드가 없으면 기본적으로 오전으로 해석 (1-12시)
                    if (hour === 12) hour = 0; // 12시는 오전 12시 (00:00)
                }
                
                targetDate.setHours(hour, 0, 0, 0);
                
                // 알림 타입 결정 (현재 시간과의 차이로 판단)
                const timeDiff = targetDate.getTime() - now.getTime();
                const hoursDiff = timeDiff / (1000 * 60 * 60);
                const isStartNotification = hoursDiff <= 0.5; // 30분 이하는 시작 알림
                
                // 할 일 텍스트 추출 (예: "내일 1시 알람" → "알람")
                const todoText = userInput.replace(/내일|오늘|시|오전|오후|pm|am|p\.m|a\.m|알람|해줘/g, '').trim() || '알림';
                
                // 임시 할 일 생성
                const tempTodo = todoManager.addTodo(todoText, 'default');
                
                if (tempTodo) {
                    const scheduleData = isStartNotification ? {
                        startTime: targetDate,
                        startModal: true,
                        startNotification: true
                    } : {
                        dueTime: targetDate,
                        dueModal: true,
                        dueNotification: true
                    };
                    
                    todoManager.updateTodoSchedule(tempTodo.id, scheduleData);
                    
                    if (window.notificationScheduler) {
                        window.notificationScheduler.rescheduleAllNotifications(todoManager.getTodos());
                    }
                    
                    if (window.app && window.app.renderTodos) {
                        window.app.renderTodos();
                    }
                    
                    const notificationType = isStartNotification ? '시작' : '마감';
                    return {
                        success: true,
                        message: `테스트 모드: ${targetDate.toLocaleString('ko-KR')}에 ${notificationType} 알림을 설정했습니다.`
                    };
                }
            }
        }
        
        // "내일 1시 알람" 같은 패턴 특별 처리
        if (lowerInput.includes('내일') && lowerInput.includes('시') && (lowerInput.includes('알람') || lowerInput.includes('알림'))) {
            console.log('[GeminiAPI] 테스트 모드 - 내일 시 알람 패턴 감지:', userInput);
            
            const now = new Date();
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);
            
            // 시간 추출
            const timeMatch = userInput.match(/(\d+)시/);
            if (timeMatch) {
                let hour = parseInt(timeMatch[1]);
                
                // 오후 키워드가 없으면 오전으로 해석
                if (!lowerInput.includes('오후') && !lowerInput.includes('pm') && !lowerInput.includes('p.m')) {
                    if (hour === 12) hour = 0; // 12시는 오전 12시
                } else {
                    if (hour !== 12) hour += 12; // 오후로 변환
                }
                
                tomorrow.setHours(hour, 0, 0, 0);
                
                // 할 일 텍스트 추출
                const todoText = userInput.replace(/내일|시|알람|해줘/g, '').trim() || '알림';
                
                const tempTodo = todoManager.addTodo(todoText, 'default');
                if (tempTodo) {
                    const scheduleData = {
                        startTime: tomorrow,
                        startModal: true,
                        startNotification: true
                    };
                    
                    todoManager.updateTodoSchedule(tempTodo.id, scheduleData);
                    
                    if (window.notificationScheduler) {
                        window.notificationScheduler.rescheduleAllNotifications(todoManager.getTodos());
                    }
                    
                    if (window.app && window.app.renderTodos) {
                        window.app.renderTodos();
                    }
                    
                    return {
                        success: true,
                        message: `테스트 모드: ${tomorrow.toLocaleString('ko-KR')}에 시작 알림을 설정했습니다.`
                    };
                }
            }
        }
        
        // 분 단위 알람 설정 (예: "5분 후", "10분 뒤")
        if (lowerInput.includes('분') && (lowerInput.includes('후') || lowerInput.includes('뒤'))) {
            const match = userInput.match(/(\d+)분\s*(후|뒤)/);
            if (match) {
                const minutes = parseInt(match[1]);
                const now = new Date();
                const scheduleTime = new Date(now.getTime() + minutes * 60 * 1000);
                
                // 알림 타입 결정 (30분 이하는 시작 알림, 그 이상은 마감 알림)
                const isStartNotification = minutes <= 30;
                const notificationType = isStartNotification ? '시작' : '마감';
                
                // 할 일 텍스트 추출 (예: "설거지 5분 후 알림" → "설거지")
                const todoText = userInput.replace(/\d+분\s*(후|뒤).*/, '').trim() || `${minutes}분 후 알림`;
                
                // 임시 할 일 생성
                const tempTodo = todoManager.addTodo(todoText, 'default');
                
                if (tempTodo) {
                    // 기존 앱 구조에 맞는 schedule 데이터 생성
                    const scheduleData = isStartNotification ? {
                        startTime: scheduleTime,
                        startModal: true,
                        startNotification: true
                    } : {
                        dueTime: scheduleTime,
                        dueModal: true,
                        dueNotification: true
                    };
                    
                    // todoManager의 updateTodoSchedule 함수 사용
                    todoManager.updateTodoSchedule(tempTodo.id, scheduleData);
                    
                    // 알림 스케줄러 재초기화
                    if (window.notificationScheduler) {
                        window.notificationScheduler.rescheduleAllNotifications(todoManager.getTodos());
                    }
                    
                    // UI 업데이트
                    if (window.app && window.app.renderTodos) {
                        window.app.renderTodos();
                    }
                    
                    return {
                        success: true,
                        message: `테스트 모드: ${scheduleTime.toLocaleString('ko-KR')}에 ${notificationType} 알림을 설정했습니다.`
                    };
                }
            }
        }
        
        // 할 일 추가 키워드 감지
        if (lowerInput.includes('추가') || lowerInput.includes('만들어') || lowerInput.includes('생성')) {
            const text = userInput.replace(/추가|만들어|생성|해줘/g, '').trim();
            if (text) {
                // 카테고리 추출 시도 (예: "업무 카테고리에 보고서 작성 추가")
                const categoryMatch = userInput.match(/(.+?)\s*카테고리에\s*(.+?)\s*(추가|만들어|생성)/);
                let categoryId = 'default';
                let categoryName = null;
                
                if (categoryMatch) {
                    categoryName = categoryMatch[1].trim();
                    const todoText = categoryMatch[2].trim();
                    
                    // 카테고리가 존재하는지 확인
                    const existingCategories = todoManager.getCategories();
                    const category = existingCategories.find(cat => cat.name === categoryName);
                    
                    if (category) {
                        categoryId = category.id;
                    } else {
                        // 카테고리가 없으면 자동 생성
                        console.log('[GeminiAPI] 테스트 모드 - 카테고리가 없어서 자동 생성:', categoryName);
                        const newCategory = todoManager.addCategory(categoryName);
                        if (newCategory) {
                            categoryId = newCategory.id;
                        }
                    }
                    
                    const newTodo = todoManager.addTodo(todoText, categoryId);
                    if (newTodo) {
                        if (window.app && window.app.renderTodos) {
                            window.app.renderTodos();
                        }
                        const categoryMessage = category ? '' : ` (새로 생성된 카테고리)`;
                        return {
                            success: true,
                            message: `테스트 모드: "${todoText}" 할 일을 ${categoryName} 카테고리에 추가했습니다.${categoryMessage}`
                        };
                    }
                } else {
                    // 일반 할 일 추가
                    const newTodo = todoManager.addTodo(text, 'default');
                    if (newTodo) {
                        if (window.app && window.app.renderTodos) {
                            window.app.renderTodos();
                        }
                        return {
                            success: true,
                            message: `테스트 모드: "${text}" 할 일을 추가했습니다.`
                        };
                    }
                }
            }
        }
        
        // 카테고리 추가 키워드 감지
        if (lowerInput.includes('카테고리') && lowerInput.includes('만들')) {
            const match = userInput.match(/카테고리\s*만들[어]*\s*:\s*(.+)/);
            if (match) {
                const categoryName = match[1].trim();
                const newCategory = todoManager.addCategory(categoryName);
                if (newCategory) {
                    if (window.app && window.app.renderTodos) {
                        window.app.renderTodos();
                    }
                    return {
                        success: true,
                        message: `테스트 모드: "${categoryName}" 카테고리를 추가했습니다.`
                    };
                } else {
                    return handleLocalTestError(userInput, '카테고리 생성 실패');
                }
            }
        }
        
        // 알림 수정 키워드 감지 (예: "오후 3시 알림을 오전 3시로 수정")
        if (lowerInput.includes('수정') && (lowerInput.includes('시') || lowerInput.includes('시간'))) {
            console.log('[GeminiAPI] 테스트 모드 - 알림 수정 패턴 감지:', userInput);
            
            // 기존 시간과 새 시간 추출
            const timeMatch = userInput.match(/(\d+)시.*?(\d+)시.*?수정/);
            if (timeMatch) {
                const oldHour = parseInt(timeMatch[1]);
                const newHour = parseInt(timeMatch[2]);
                
                // 오후/오전 키워드 확인
                const isOldPM = lowerInput.includes('오후') || lowerInput.includes('pm');
                const isNewPM = lowerInput.includes('새로운') && (lowerInput.includes('오후') || lowerInput.includes('pm'));
                
                const oldTime = isOldPM && oldHour !== 12 ? oldHour + 12 : oldHour;
                const newTime = isNewPM && newHour !== 12 ? newHour + 12 : newHour;
                
                // 기존 알림 찾기
                const allTodos = todoManager.getTodos();
                const targetTodo = allTodos.find(todo => {
                    if (todo.schedule) {
                        if (todo.schedule.startTime) {
                            const startHour = new Date(todo.schedule.startTime).getHours();
                            return startHour === oldTime;
                        }
                        if (todo.schedule.dueTime) {
                            const dueHour = new Date(todo.schedule.dueTime).getHours();
                            return dueHour === oldTime;
                        }
                    }
                    return false;
                });
                
                if (targetTodo) {
                    // 새 시간 설정
                    const newScheduleTime = new Date();
                    newScheduleTime.setHours(newTime, 0, 0, 0);
                    
                    // 내일로 설정하는 경우
                    if (lowerInput.includes('내일')) {
                        newScheduleTime.setDate(newScheduleTime.getDate() + 1);
                    }
                    
                    // 알림 타입 결정 (기존 알림 타입 유지)
                    const isStartNotification = targetTodo.schedule && targetTodo.schedule.startTime;
                    
                    const scheduleData = isStartNotification ? {
                        startTime: newScheduleTime,
                        startModal: true,
                        startNotification: true
                    } : {
                        dueTime: newScheduleTime,
                        dueModal: true,
                        dueNotification: true
                    };
                    
                    // 기존 스케줄 업데이트
                    todoManager.updateTodoSchedule(targetTodo.id, scheduleData);
                    
                    // 알림 스케줄러 재초기화
                    if (window.notificationScheduler) {
                        window.notificationScheduler.rescheduleAllNotifications(todoManager.getTodos());
                    }
                    
                    // UI 업데이트
                    if (window.app && window.app.renderTodos) {
                        window.app.renderTodos();
                    }
                    
                    const notificationType = isStartNotification ? '시작 알림' : '마감 알림';
                    return {
                        success: true,
                        message: `테스트 모드: "${targetTodo.text}" ${notificationType}을 ${newScheduleTime.toLocaleString('ko-KR')}로 수정했습니다.`
                    };
                } else {
                    return handleLocalTestError(userInput, '수정할 알림을 찾을 수 없음');
                }
            }
        }
        
        // 삭제 키워드 감지
        if (lowerInput.includes('삭제') || lowerInput.includes('지워')) {
            console.log('[GeminiAPI] 테스트 모드 - 삭제 패턴 감지:', userInput);
            
            // 전체 삭제
            if (lowerInput.includes('전부') || lowerInput.includes('모두') || lowerInput.includes('다')) {
                const allTodos = todoManager.getTodos();
                const deletedCount = allTodos.length;
                
                // 모든 할 일 삭제
                allTodos.forEach(todo => {
                    todoManager.deleteTodo(todo.id);
                });
                
                // UI 업데이트
                if (window.app && window.app.renderTodos) {
                    window.app.renderTodos();
                }
                
                return {
                    success: true,
                    message: `테스트 모드: 모든 할 일(${deletedCount}개)을 삭제했습니다.`
                };
            }
            
            // 특정 할 일 삭제 (텍스트로 찾기)
            const allTodos = todoManager.getTodos();
            const targetTodo = allTodos.find(todo => 
                userInput.includes(todo.text) || todo.text.includes(userInput.replace(/삭제|지워/g, '').trim())
            );
            
            if (targetTodo) {
                todoManager.deleteTodo(targetTodo.id);
                
                // UI 업데이트
                if (window.app && window.app.renderTodos) {
                    window.app.renderTodos();
                }
                
                return {
                    success: true,
                    message: `테스트 모드: "${targetTodo.text}" 할 일을 삭제했습니다.`
                };
            } else {
                return handleLocalTestError(userInput, '삭제할 할 일을 찾을 수 없음');
            }
        }
        
        // 카테고리 변경 키워드 감지
        if (lowerInput.includes('카테고리') && (lowerInput.includes('변경') || lowerInput.includes('바꿔'))) {
            const match = userInput.match(/(.+?)\s*카테고리를\s*(.+?)\s*로\s*변경/);
            if (match) {
                const todoText = match[1].trim();
                const newCategory = match[2].trim();
                
                // 할 일 찾기
                const todo = todoManager.getTodos().find(t => t.text.includes(todoText));
                if (todo) {
                    // 카테고리가 존재하는지 확인
                    const existingCategories = todoManager.getCategories();
                    const categoryExists = existingCategories.some(cat => cat.name === newCategory);
                    
                    // 카테고리가 없으면 자동 생성
                    if (!categoryExists) {
                        console.log('[GeminiAPI] 테스트 모드 - 카테고리가 없어서 자동 생성:', newCategory);
                        const createdCategory = todoManager.addCategory(newCategory);
                        if (!createdCategory) {
                            return handleLocalTestError(userInput, '카테고리 생성 실패');
                        }
                    }
                    
                    // 할 일 카테고리 변경
                    todoManager.updateTodoCategory(todo.id, newCategory);
                    
                    if (window.app && window.app.renderTodos) {
                        window.app.renderTodos();
                    }
                    
                    const categoryMessage = categoryExists ? '' : ` (새로 생성된 카테고리)`;
                    return {
                        success: true,
                        message: `테스트 모드: "${todo.text}" 할 일의 카테고리를 "${newCategory}"로 변경했습니다.${categoryMessage}`
                    };
                } else {
                    return handleLocalTestError(userInput, '할 일을 찾을 수 없음');
                }
            }
        }
        
        // 기본 응답
        return {
            success: true,
            message: `테스트 모드: "${userInput}" 메시지를 받았습니다. 현재 모델: ${MODELS[currentModelIndex]}. API 키를 설정하면 더 정확한 응답을 받을 수 있습니다.`
        };
    };

    // 로컬 테스트 모드에서 오류 처리
    const handleLocalTestError = (userInput, error) => {
        console.log('[GeminiAPI] 로컬 테스트 모드 오류 처리:', error);
        
        // 오류 유형에 따른 적절한 응답
        if (error.includes('카테고리')) {
            return {
                success: true,
                message: `테스트 모드: 카테고리 관련 오류가 발생했습니다. "새 카테고리 만들기: [카테고리명]" 형식으로 카테고리를 먼저 생성해주세요.`
            };
        } else if (error.includes('할 일')) {
            return {
                success: true,
                message: `테스트 모드: 할 일 관련 오류가 발생했습니다. 할 일 내용을 더 구체적으로 말씀해주세요.`
            };
        } else if (error.includes('시간') || error.includes('알림')) {
            return {
                success: true,
                message: `테스트 모드: 시간 설정 오류가 발생했습니다. "X분 후 알림" 형식으로 다시 시도해주세요.`
            };
        } else {
            return {
                success: true,
                message: `테스트 모드: 오류가 발생했습니다. 다른 표현으로 다시 시도해주세요.`
            };
        }
    };

    // 명령 실행
    const executeCommand = async (action, data) => {
        console.log('[GeminiAPI] executeCommand 호출:', action, data);
        try {
            switch (action) {
                case 'ADD_TODO':
                    console.log('[GeminiAPI] ADD_TODO 실행');
                    
                    // 카테고리 ID 찾기
                    let categoryId = 'default';
                    if (data.category) {
                        const existingCategories = todoManager.getCategories();
                        const category = existingCategories.find(cat => cat.name === data.category);
                        
                        if (category) {
                            categoryId = category.id;
                        } else {
                            // 카테고리가 없으면 자동 생성
                            console.log('[GeminiAPI] 카테고리가 없어서 자동 생성:', data.category);
                            const newCategory = todoManager.addCategory(data.category);
                            if (newCategory) {
                                categoryId = newCategory.id;
                            }
                        }
                    }
                    
                    const newTodo = todoManager.addTodo(data.text, categoryId);
                    if (newTodo) {
                        const categoryMessage = data.category && !todoManager.getCategories().find(cat => cat.name === data.category) ? 
                            ` (새로 생성된 카테고리)` : '';
                        return { message: `"${data.text}" 할 일을 ${data.category || '일반'} 카테고리에 추가했습니다.${categoryMessage}` };
                    } else {
                        return { message: '할 일 추가에 실패했습니다.' };
                    }

                case 'SET_SCHEDULE':
                    console.log('[GeminiAPI] SET_SCHEDULE 실행:', data);
                    
                    // 알림 타입 결정 (사용자 입력 분석)
                    const isStartNotification = data.isStartNotification !== undefined ? data.isStartNotification : 
                        (data.text && (
                            data.text.includes('시작') || 
                            data.text.includes('지금') || 
                            data.text.includes('알림') ||
                            (data.timeOffset && data.timeOffset <= 30) // 30분 이하는 시작 알림
                        ));
                    
                    console.log('[GeminiAPI] 알림 타입 결정:', isStartNotification ? '시작 알림' : '마감 알림');
                    
                    // 기존 할 일에 알림 설정
                    if (data.todoId && data.scheduleTime) {
                        const todo = todoManager.getTodos().find(t => t.id == data.todoId);
                        if (todo) {
                            // 기존 앱 구조에 맞는 schedule 데이터 생성
                            const scheduleData = isStartNotification ? {
                                startTime: new Date(data.scheduleTime),
                                startModal: true,
                                startNotification: true
                            } : {
                                dueTime: new Date(data.scheduleTime),
                                dueModal: true,
                                dueNotification: true
                            };
                            
                            // todoManager의 updateTodoSchedule 함수 사용
                            todoManager.updateTodoSchedule(todo.id, scheduleData);
                            
                            // 알림 스케줄러 재초기화
                            if (window.notificationScheduler) {
                                window.notificationScheduler.rescheduleAllNotifications(todoManager.getTodos());
                            }
                            
                            // UI 업데이트
                            if (window.app && window.app.renderTodos) {
                                window.app.renderTodos();
                            }
                            
                            const notificationType = isStartNotification ? '시작 알림' : '마감 알림';
                            return { 
                                message: `"${todo.text}" ${notificationType}을 ${new Date(data.scheduleTime).toLocaleString('ko-KR')}에 설정했습니다.` 
                            };
                        }
                    } 
                    // 새로운 할 일 생성 후 알림 설정 (scheduleTime만 있는 경우)
                    else if (data.scheduleTime) {
                        console.log('[GeminiAPI] scheduleTime으로 새로운 할 일 생성 후 알림 설정:', data.scheduleTime);
                        
                        // 할 일 텍스트 결정
                        const todoText = data.text || '알림';
                        
                        // 새로운 할 일 생성
                        const tempTodo = todoManager.addTodo(todoText, 'default');
                        
                        console.log('[GeminiAPI] 생성된 할 일:', tempTodo);
                        
                        if (tempTodo) {
                            // 기존 앱 구조에 맞는 schedule 데이터 생성
                            const scheduleData = isStartNotification ? {
                                startTime: new Date(data.scheduleTime),
                                startModal: true,
                                startNotification: true
                            } : {
                                dueTime: new Date(data.scheduleTime),
                                dueModal: true,
                                dueNotification: true
                            };
                            
                            // todoManager의 updateTodoSchedule 함수 사용
                            todoManager.updateTodoSchedule(tempTodo.id, scheduleData);
                            
                            // 알림 스케줄러 재초기화
                            if (window.notificationScheduler) {
                                window.notificationScheduler.rescheduleAllNotifications(todoManager.getTodos());
                            }
                            
                            // UI 업데이트
                            if (window.app && window.app.renderTodos) {
                                window.app.renderTodos();
                            }
                            
                            const notificationType = isStartNotification ? '시작 알림' : '마감 알림';
                            return { 
                                message: `${new Date(data.scheduleTime).toLocaleString('ko-KR')}에 ${notificationType}을 설정했습니다.` 
                            };
                        }
                    }
                    // 시간 오프셋으로 알림 설정 (예: 2분 후)
                    else if (data.timeOffset) {
                        console.log('[GeminiAPI] timeOffset으로 알림 설정:', data.timeOffset);
                        // 시간 오프셋으로 알림 설정 (예: 2분 후)
                        const now = new Date();
                        const scheduleTime = new Date(now.getTime() + data.timeOffset * 60 * 1000);
                        
                        // 임시 할 일 생성
                        const tempTodo = todoManager.addTodo(
                            data.text || `${isStartNotification ? '시작' : '마감'} 알림 (${scheduleTime.toLocaleTimeString('ko-KR')})`, 
                            'default'
                        );
                        
                        console.log('[GeminiAPI] 생성된 할 일:', tempTodo);
                        
                        if (tempTodo) {
                            // 기존 앱 구조에 맞는 schedule 데이터 생성
                            const scheduleData = isStartNotification ? {
                                startTime: scheduleTime,
                                startModal: true,
                                startNotification: true
                            } : {
                                dueTime: scheduleTime,
                                dueModal: true,
                                dueNotification: true
                            };
                            
                            // todoManager의 updateTodoSchedule 함수 사용
                            todoManager.updateTodoSchedule(tempTodo.id, scheduleData);
                            
                            // 알림 스케줄러 재초기화
                            if (window.notificationScheduler) {
                                window.notificationScheduler.rescheduleAllNotifications(todoManager.getTodos());
                            }
                            
                            // UI 업데이트
                            if (window.app && window.app.renderTodos) {
                                window.app.renderTodos();
                            }
                            
                            const notificationType = isStartNotification ? '시작 알림' : '마감 알림';
                            return { 
                                message: `${scheduleTime.toLocaleString('ko-KR')}에 ${notificationType}을 설정했습니다.` 
                            };
                        }
                    }
                    
                    console.log('[GeminiAPI] SET_SCHEDULE 실패 - 조건에 맞지 않음');
                    return { message: '알림 설정에 실패했습니다.' };

                case 'UPDATE_SCHEDULE':
                    console.log('[GeminiAPI] UPDATE_SCHEDULE 실행:', data);
                    
                    // 기존 알림 찾기
                    const allTodos = todoManager.getTodos();
                    let targetTodo = null;
                    
                    if (data.oldTime) {
                        // 시간으로 기존 알림 찾기
                        const oldHour = parseInt(data.oldTime.split(':')[0]);
                        targetTodo = allTodos.find(todo => {
                            if (todo.schedule) {
                                if (todo.schedule.startTime) {
                                    const startHour = new Date(todo.schedule.startTime).getHours();
                                    return startHour === oldHour;
                                }
                                if (todo.schedule.dueTime) {
                                    const dueHour = new Date(todo.schedule.dueTime).getHours();
                                    return dueHour === oldHour;
                                }
                            }
                            return false;
                        });
                    } else if (data.todoId) {
                        // ID로 기존 알림 찾기
                        targetTodo = allTodos.find(t => t.id == data.todoId);
                    }
                    
                    if (targetTodo) {
                        console.log('[GeminiAPI] 수정할 할 일 찾음:', targetTodo);
                        
                        // 새 시간 설정
                        const newScheduleTime = new Date(data.newTime);
                        const today = new Date();
                        newScheduleTime.setFullYear(today.getFullYear());
                        newScheduleTime.setMonth(today.getMonth());
                        newScheduleTime.setDate(today.getDate());
                        
                        // 내일로 설정하는 경우
                        if (data.newTime.includes('내일') || data.newTime.includes('tomorrow')) {
                            newScheduleTime.setDate(today.getDate() + 1);
                        }
                        
                        // 알림 타입 결정 (기존 알림 타입 유지)
                        const isStartNotification = targetTodo.schedule && targetTodo.schedule.startTime;
                        
                        const scheduleData = isStartNotification ? {
                            startTime: newScheduleTime,
                            startModal: true,
                            startNotification: true
                        } : {
                            dueTime: newScheduleTime,
                            dueModal: true,
                            dueNotification: true
                        };
                        
                        // 기존 스케줄 업데이트
                        todoManager.updateTodoSchedule(targetTodo.id, scheduleData);
                        
                        // 알림 스케줄러 재초기화
                        if (window.notificationScheduler) {
                            window.notificationScheduler.rescheduleAllNotifications(todoManager.getTodos());
                        }
                        
                        // UI 업데이트
                        if (window.app && window.app.renderTodos) {
                            window.app.renderTodos();
                        }
                        
                        const notificationType = isStartNotification ? '시작 알림' : '마감 알림';
                        return { 
                            message: `"${targetTodo.text}" ${notificationType}을 ${newScheduleTime.toLocaleString('ko-KR')}로 수정했습니다.` 
                        };
                    } else {
                        console.log('[GeminiAPI] 수정할 할 일을 찾을 수 없음');
                        return { message: '수정할 알림을 찾을 수 없습니다.' };
                    }

                case 'ADD_CATEGORY':
                    const newCategory = todoManager.addCategory(data.name);
                    if (newCategory) {
                        return { message: `"${data.name}" 카테고리를 추가했습니다.` };
                    } else {
                        return { message: '카테고리 추가에 실패했습니다.' };
                    }

                case 'UPDATE_TODO_CATEGORY':
                    console.log('[GeminiAPI] UPDATE_TODO_CATEGORY 실행:', data);
                    const todoToUpdate = todoManager.getTodos().find(t => t.id == data.todoId);
                    if (todoToUpdate) {
                        // 카테고리가 존재하는지 확인
                        const existingCategories = todoManager.getCategories();
                        const categoryExists = existingCategories.some(cat => cat.name === data.newCategory);
                        
                        // 카테고리가 없으면 자동 생성
                        if (!categoryExists) {
                            console.log('[GeminiAPI] 카테고리가 없어서 자동 생성:', data.newCategory);
                            const newCategory = todoManager.addCategory(data.newCategory);
                            if (!newCategory) {
                                return { message: `카테고리 "${data.newCategory}" 생성에 실패했습니다.` };
                            }
                        }
                        
                        // 할 일 카테고리 변경
                        todoManager.updateTodoCategory(todoToUpdate.id, data.newCategory);
                        
                        // UI 업데이트
                        if (window.app && window.app.renderTodos) {
                            window.app.renderTodos();
                        }
                        
                        const categoryMessage = categoryExists ? '' : ` (새로 생성된 카테고리)`;
                        return { message: `"${todoToUpdate.text}" 할 일의 카테고리를 "${data.newCategory}"로 변경했습니다.${categoryMessage}` };
                    } else {
                        return { message: '해당 할 일을 찾을 수 없습니다.' };
                    }

                case 'COMPLETE_TODO':
                    const todo = todoManager.getTodos().find(t => t.id == data.todoId);
                    if (todo) {
                        todoManager.toggleTodoStatus(todo.id);
                        return { message: `"${todo.text}" 할 일을 완료 처리했습니다.` };
                    } else {
                        return { message: '해당 할 일을 찾을 수 없습니다.' };
                    }

                case 'DELETE_TODO':
                    console.log('[GeminiAPI] DELETE_TODO 실행:', data);
                    
                    // todoIds 배열 처리
                    if (data.todoIds && Array.isArray(data.todoIds)) {
                        console.log('[GeminiAPI] todoIds 배열로 삭제:', data.todoIds);
                        const allTodos = todoManager.getTodos();
                        let deletedCount = 0;
                        
                        for (const todoId of data.todoIds) {
                            const todoToDelete = allTodos.find(t => t.id == todoId);
                            if (todoToDelete) {
                                todoManager.deleteTodo(todoToDelete.id);
                                deletedCount++;
                                console.log('[GeminiAPI] 할 일 삭제됨:', todoToDelete.text);
                            } else {
                                console.log('[GeminiAPI] 할 일을 찾을 수 없음, ID:', todoId);
                            }
                        }
                        
                        if (deletedCount > 0) {
                            // UI 업데이트
                            if (window.app && window.app.renderTodos) {
                                window.app.renderTodos();
                            }
                            
                            return { 
                                message: `${deletedCount}개의 할 일을 삭제했습니다.` 
                            };
                        } else {
                            return { message: '삭제할 할 일을 찾을 수 없습니다.' };
                        }
                    }
                    // 단일 todoId 처리
                    else if (data.todoId) {
                        const todoToDelete = todoManager.getTodos().find(t => t.id == data.todoId);
                        if (todoToDelete) {
                            todoManager.deleteTodo(todoToDelete.id);
                            
                            // UI 업데이트
                            if (window.app && window.app.renderTodos) {
                                window.app.renderTodos();
                            }
                            
                            return { message: `"${todoToDelete.text}" 할 일을 삭제했습니다.` };
                        } else {
                            return { message: '해당 할 일을 찾을 수 없습니다.' };
                        }
                    }
                    // 전체 삭제 처리
                    else if (data.deleteAll) {
                        console.log('[GeminiAPI] 전체 삭제 실행');
                        const allTodos = todoManager.getTodos();
                        const deletedCount = allTodos.length;
                        
                        // 모든 할 일 삭제
                        allTodos.forEach(todo => {
                            todoManager.deleteTodo(todo.id);
                        });
                        
                        // UI 업데이트
                        if (window.app && window.app.renderTodos) {
                            window.app.renderTodos();
                        }
                        
                        return { message: `모든 할 일(${deletedCount}개)을 삭제했습니다.` };
                    }
                    
                    console.log('[GeminiAPI] DELETE_TODO 실패 - 유효한 데이터 없음');
                    return { message: '삭제할 할 일을 지정해주세요.' };

                case 'SHOW_INFO':
                    const todos = todoManager.getTodos();
                    const categories = todoManager.getCategories();
                    const completedCount = todos.filter(t => t.completed).length;
                    
                    return { 
                        message: `현재 상태:\n• 총 할 일: ${todos.length}개\n• 완료된 할 일: ${completedCount}개\n• 미완료 할 일: ${todos.length - completedCount}개\n• 카테고리: ${categories.length}개\n\n카테고리별 할 일:\n${categories.map(cat => `• ${cat.name}: ${todos.filter(t => t.category === cat.name).length}개`).join('\n')}`
                    };

                default:
                    return { message: '죄송합니다. 해당 명령을 이해하지 못했습니다.' };
            }
        } catch (error) {
            console.error('[GeminiAPI] executeCommand 오류:', error);
            
            // 오류 상황을 AI에게 재전달하여 해결책 요청
            try {
                const errorPrompt = `명령 실행 중 오류가 발생했습니다. 사용자의 원래 요청과 오류 상황을 분석하여 적절한 해결책을 제시해주세요.

원래 명령: ${action}
명령 데이터: ${JSON.stringify(data)}
발생한 오류: ${error.message}

현재 앱 상태:
- 할 일 목록: ${todoManager.getTodos().length}개
- 카테고리: ${todoManager.getCategories().map(c => c.name).join(', ') || '없음'}

다음 중 하나로 응답해주세요:
1. 오류를 수정한 명령 (JSON 형식)
2. 대안 제안 (CHAT 형식)
3. 사용자에게 추가 정보 요청 (CHAT 형식)

JSON 응답 형식:
{
    "action": "명령 타입",
    "data": { ... },
    "message": "사용자에게 보여줄 메시지",
    "success": true
}`;

                const errorResponse = await fetch(`${getCurrentModel()}?key=${apiKey}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{
                                text: errorPrompt
                            }]
                        }],
                        generationConfig: {
                            temperature: 0.7,
                            topK: 40,
                            topP: 0.95,
                            maxOutputTokens: 1024,
                        }
                    })
                });

                if (errorResponse.ok) {
                    const errorData = await errorResponse.json();
                    if (errorData.candidates && errorData.candidates[0] && errorData.candidates[0].content) {
                        const aiErrorResponse = errorData.candidates[0].content.parts[0].text;
                        
                        try {
                            const parsedErrorResponse = JSON.parse(aiErrorResponse);
                            if (parsedErrorResponse.success && parsedErrorResponse.action !== 'CHAT') {
                                // 오류 수정 명령 실행
                                const result = await executeCommand(parsedErrorResponse.action, parsedErrorResponse.data);
                                return result;
                            } else {
                                // 대안 제안 또는 추가 정보 요청
                                return { message: parsedErrorResponse.message || aiErrorResponse };
                            }
                        } catch (parseError) {
                            // JSON 파싱 실패 시 일반 대화로 처리
                            return { message: aiErrorResponse };
                        }
                    }
                }
            } catch (retryError) {
                console.error('[GeminiAPI] executeCommand 오류 재처리 실패:', retryError);
            }
            
            // 모든 재처리 실패 시 원래 오류 반환
            return { message: `명령 실행 중 오류가 발생했습니다: ${error.message}` };
        }
    };

    return {
        setApiKey,
        sendMessage,
        clearHistory, // 대화 히스토리 초기화
        getConversationContext // 대화 히스토리 조회 (디버깅용)
    };
})();

// window 객체에 노출
window.geminiApi = geminiApi; 