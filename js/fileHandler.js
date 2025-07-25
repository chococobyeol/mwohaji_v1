const fileHandler = (() => {

    // 데이터를 텍스트로 변환 (내보내기용) - PRD F-06 형식에 맞게 수정
    const stringifyData = (todos, categories, completedRepeatTodos = []) => {
        let content = "### Mwohaji Backup Data ###\n\n";
        
        // 카테고리 목록 저장 (생성 날짜 포함)
        content += "#CATEGORIES:\n";
        content += categories.map(c => `${c.id}|${c.name}|${c.createdAt || new Date().toISOString()}`).join('\n');
        content += "\n\n";
        
        // 카테고리 순서 정보 저장
        content += "#CATEGORY_ORDER:\n";
        content += categories.map(c => c.id).join('|');
        content += "\n\n";

        // 일반 할 일 목록 저장 (완료된 반복 할 일 제외)
        content += "#TODOS:\n";
        const regularTodos = todos.filter(todo => {
            // completedRepeatTodos에 있는 항목은 제외
            return !completedRepeatTodos.some(ct => ct.id === todo.id);
        });
        
        content += regularTodos.map(t => {
            const completedMark = t.completed ? '[x]' : '[ ]';
            let todoLine = `${completedMark} ${t.text} @cat:${t.category}`;
            
            // F-09: 일정 정보 저장
            if (t.schedule) {
                if (t.schedule.startTime) {
                    todoLine += ` @start:${utils.formatDateTime(new Date(t.schedule.startTime))}`;
                    todoLine += ` @smodal:${t.schedule.startModal !== false}`;
                    todoLine += ` @snotify:${t.schedule.startNotification}`;
                }
                if (t.schedule.dueTime) {
                    todoLine += ` @due:${utils.formatDateTime(new Date(t.schedule.dueTime))}`;
                    todoLine += ` @dmodal:${t.schedule.dueModal !== false}`;
                    todoLine += ` @dnotify:${t.schedule.dueNotification}`;
                }
            }
            
            // 반복 규칙이 있다면 추가
            if (t.repeat) {
                todoLine += ` @repeat:${JSON.stringify(t.repeat)}`;
            }
            
            // 완료 시간이 있다면 추가
            if (t.completedAt) {
                todoLine += ` @completedAt:${t.completedAt}`;
            }
            
            // ID는 숨김 메타데이터로 저장 (파싱 시 필요)
            todoLine += ` @id:${t.id}`;
            
            return todoLine;
        }).join('\n');

        // 완료된 반복 할 일들만 별도 섹션에 저장
        if (completedRepeatTodos.length > 0) {
            content += "\n\n#COMPLETED_REPEAT_TODOS:\n";
            content += completedRepeatTodos.map(t => {
                const completedMark = '[x]';
                let todoLine = `${completedMark} ${t.text} @cat:${t.category}`;
                
                // 일정 정보 저장
                if (t.schedule) {
                    if (t.schedule.startTime) {
                        todoLine += ` @start:${utils.formatDateTime(new Date(t.schedule.startTime))}`;
                        todoLine += ` @smodal:${t.schedule.startModal !== false}`;
                        todoLine += ` @snotify:${t.schedule.startNotification}`;
                    }
                    if (t.schedule.dueTime) {
                        todoLine += ` @due:${utils.formatDateTime(new Date(t.schedule.dueTime))}`;
                        todoLine += ` @dmodal:${t.schedule.dueModal !== false}`;
                        todoLine += ` @dnotify:${t.schedule.dueNotification}`;
                    }
                }
                
                // 반복 규칙 저장
                if (t.repeat) {
                    todoLine += ` @repeat:${JSON.stringify(t.repeat)}`;
                }
                
                // 완료 시간 저장
                if (t.completedAt) {
                    todoLine += ` @completedAt:${t.completedAt}`;
                }
                
                // ID 저장
                todoLine += ` @id:${t.id}`;
                
                return todoLine;
            }).join('\n');
        }

        return content;
    };

    // 텍스트를 데이터로 변환 (가져오기용) - PRD F-06 형식에 맞게 수정
    const parseData = (text) => {
        const lines = text.split('\n');
        let isTodosSection = false;
        let isCategoriesSection = false;
        let isCompletedRepeatTodosSection = false;
        let isCategoryOrderSection = false;

        const importedData = {
            todos: [],
            categories: [],
            completedRepeatTodos: [],
            categoryOrder: []
        };

        lines.forEach(line => {
            if (line.trim() === '#CATEGORIES:') {
                isCategoriesSection = true;
                isTodosSection = false;
                isCompletedRepeatTodosSection = false;
                isCategoryOrderSection = false;
                return;
            }
            if (line.trim() === '#TODOS:') {
                isTodosSection = true;
                isCategoriesSection = false;
                isCompletedRepeatTodosSection = false;
                isCategoryOrderSection = false;
                return;
            }
            if (line.trim() === '#COMPLETED_REPEAT_TODOS:') {
                isCompletedRepeatTodosSection = true;
                isCategoriesSection = false;
                isTodosSection = false;
                isCategoryOrderSection = false;
                return;
            }
            if (line.trim() === '#CATEGORY_ORDER:') {
                isCategoryOrderSection = true;
                isCategoriesSection = false;
                isTodosSection = false;
                isCompletedRepeatTodosSection = false;
                return;
            }
            if (line.trim() === '' || line.startsWith('###')) return;

            if (isCategoriesSection) {
                const parts = line.split('|');
                if (parts.length >= 2) {
                    const [id, name, createdAt] = parts;
                    const category = { id, name };
                    if (createdAt) {
                        category.createdAt = createdAt;
                    }
                    importedData.categories.push(category);
                }
            } else if (isCategoryOrderSection) {
                const categoryIds = line.split('|');
                importedData.categoryOrder = categoryIds.filter(id => id.trim());
            } else if (isTodosSection || isCompletedRepeatTodosSection) {
                // PRD 개선된 형식 파싱: [상태] 내용 @cat:카테고리 @start:YYYY-MM-DD HH:mm @due:YYYY-MM-DD HH:mm @smodal:true/false @snotify:true/false @dmodal:true/false @dnotify:true/false @id:숫자
                const completed = line.startsWith('[x]');
                const content = line.substring(4); // '[x] ' 또는 '[ ] ' 제거
                
                // 파라미터들을 찾기 위해 @ 기호로 분리
                const parts = content.split(' @');
                const todoText = parts[0].trim();
                const params = [];
                
                // 첫 번째 부분 이후의 모든 부분을 파라미터로 처리
                for (let i = 1; i < parts.length; i++) {
                    const part = parts[i];
                    const colonIndex = part.indexOf(':');
                    if (colonIndex !== -1) {
                        const key = part.substring(0, colonIndex);
                        const value = part.substring(colonIndex + 1);
                        params.push({ key, value });
                    }
                }
                console.log('파싱된 할 일 텍스트:', todoText);
                console.log('파싱된 파라미터들:', params);
                
                let category = '일반';
                let repeat = null;
                let id = Date.now(); // 기본값
                let schedule = null;
                let completedAt = null;
                
                // 파라미터들 파싱
                params.forEach(param => {
                    const { key, value } = param;
                    if (key === 'cat') {
                        category = value;
                    } else if (key === 'start') {
                        if (!schedule) schedule = {};
                        schedule.startTime = new Date(value).toISOString();
                    } else if (key === 'due') {
                        if (!schedule) schedule = {};
                        schedule.dueTime = new Date(value).toISOString();
                    } else if (key === 'smodal') {
                        const enabled = value === 'true';
                        if (!schedule) schedule = {};
                        schedule.startModal = enabled;
                    } else if (key === 'snotify') {
                        const enabled = value === 'true';
                        if (!schedule) schedule = {};
                        schedule.startNotification = enabled;
                    } else if (key === 'dmodal') {
                        const enabled = value === 'true';
                        if (!schedule) schedule = {};
                        schedule.dueModal = enabled;
                    } else if (key === 'dnotify') {
                        const enabled = value === 'true';
                        if (!schedule) schedule = {};
                        schedule.dueNotification = enabled;
                    } else if (key === 'repeat') {
                        try {
                            repeat = JSON.parse(value);
                        } catch (e) {
                            console.warn('반복 정보 파싱 실패:', value);
                        }
                    } else if (key === 'completedAt') {
                        completedAt = value;
                    } else if (key === 'id') {
                        id = Number(value) || Date.now();
                    }
                });

                if (todoText.trim()) {
                    const todo = {
                        id: id,
                        text: todoText.trim(),
                        category: category,
                        completed: completed,
                        createdAt: completedAt ? new Date(completedAt).toISOString() : new Date().toISOString()
                    };
                    
                    // F-09: 일정 정보 추가
                    if (schedule) {
                        // 기본값으로 알림 상태 초기화
                        schedule.notifiedStart = false;
                        schedule.notifiedDue = false;
                        
                        // startModal, startNotification 기본값 처리
                        if (schedule.startTime) {
                            if (schedule.startModal === undefined) {
                                schedule.startModal = true;
                            }
                            if (schedule.startNotification === undefined) {
                                schedule.startNotification = true;
                            }
                        }
                        
                        // dueModal, dueNotification 기본값 처리
                        if (schedule.dueTime) {
                            if (schedule.dueModal === undefined) {
                                schedule.dueModal = true;
                            }
                            if (schedule.dueNotification === undefined) {
                                schedule.dueNotification = true;
                            }
                        }
                        
                        todo.schedule = schedule;
                    }
                    
                    // 반복 기능
                    if (repeat) todo.repeat = repeat;
                    
                    // 완료 시간
                    if (completedAt) todo.completedAt = completedAt;
                    
                    // 완료된 반복 할 일인지 확인하여 적절한 배열에 추가
                    if (isCompletedRepeatTodosSection) {
                        importedData.completedRepeatTodos.push(todo);
                    } else {
                        importedData.todos.push(todo);
                    }
                }
            }
        });
        console.log('파싱된 데이터:', importedData);
        return importedData;
    };

    // 파일 내보내기 실행
    const exportToFile = (todos, categories, completedRepeatTodos = []) => {
        const content = stringifyData(todos, categories, completedRepeatTodos);
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        
        const date = new Date();
        const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        a.download = `mwohaji_backup_${formattedDate}.txt`;
        a.href = url;
        
        document.body.appendChild(a);
        a.click();
        
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // 파일 가져오기 실행
    const importFromFile = (file) => {
        return new Promise((resolve, reject) => {
            if (!file || file.type !== 'text/plain') {
                reject(new Error('올바른 .txt 파일을 선택해주세요.'));
                return;
            }

            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = parseData(event.target.result);
                    resolve(data);
                } catch (e) {
                    reject(new Error('파일 형식이 올바르지 않습니다.'));
                }
            };
            reader.onerror = () => {
                reject(new Error('파일을 읽는 중 오류가 발생했습니다.'));
            };
            reader.readAsText(file);
        });
    };


    return {
        exportToFile,
        importFromFile
    };
})();
