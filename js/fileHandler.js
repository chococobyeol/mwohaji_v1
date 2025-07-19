const fileHandler = (() => {

    // 데이터를 텍스트로 변환 (내보내기용) - PRD F-06 형식에 맞게 수정
    const stringifyData = (todos, categories) => {
        let content = "### Mwohaji Backup Data ###\n\n";
        
        // 카테고리 목록 저장
        content += "#CATEGORIES:\n";
        content += categories.map(c => `${c.id}|${c.name}`).join('\n');
        content += "\n\n";

        // 할 일 목록 저장 - PRD 형식: [상태] 내용 @cat:카테고리 @notify:YYYY-MM-DD HH:mm @rec:규칙
        content += "#TODOS:\n";
        content += todos.map(t => {
            const completedMark = t.completed ? '[x]' : '[ ]';
            let todoLine = `${completedMark} ${t.text} @cat:${t.category}`;
            
            // 알림 시간이 있다면 추가 (현재 미구현이지만 구조 준비)
            if (t.notificationTime) {
                todoLine += ` @notify:${utils.formatDateTime(t.notificationTime)}`;
            }
            
            // 반복 규칙이 있다면 추가 (현재 미구현이지만 구조 준비)
            if (t.recurring) {
                todoLine += ` @rec:${t.recurring}`;
            }
            
            // ID는 숨김 메타데이터로 저장 (파싱 시 필요)
            todoLine += ` @id:${t.id}`;
            
            return todoLine;
        }).join('\n');

        return content;
    };

    // 텍스트를 데이터로 변환 (가져오기용) - PRD F-06 형식에 맞게 수정
    const parseData = (text) => {
        const lines = text.split('\n');
        let isTodosSection = false;
        let isCategoriesSection = false;

        const importedData = {
            todos: [],
            categories: []
        };

        lines.forEach(line => {
            if (line.trim() === '#CATEGORIES:') {
                isCategoriesSection = true;
                isTodosSection = false;
                return;
            }
            if (line.trim() === '#TODOS:') {
                isTodosSection = true;
                isCategoriesSection = false;
                return;
            }
            if (line.trim() === '' || line.startsWith('###')) return;

            if (isCategoriesSection) {
                const [id, name] = line.split('|');
                if (id && name) {
                    importedData.categories.push({ id, name });
                }
            } else if (isTodosSection) {
                // PRD 형식 파싱: [상태] 내용 @cat:카테고리 @notify:YYYY-MM-DD HH:mm @rec:규칙 @id:숫자
                const completed = line.startsWith('[x]');
                const content = line.substring(4); // '[x] ' 또는 '[ ] ' 제거
                
                // @ 기호로 분리하여 각 부분 파싱
                const parts = content.split(' @');
                const todoText = parts[0]; // 첫 번째 부분은 할 일 텍스트
                
                let category = '일반';
                let notificationTime = null;
                let recurring = null;
                let id = Date.now(); // 기본값
                
                // @ 파라미터들 파싱
                parts.slice(1).forEach(part => {
                    if (part.startsWith('cat:')) {
                        category = part.substring(4);
                    } else if (part.startsWith('notify:')) {
                        const dateStr = part.substring(7);
                        notificationTime = new Date(dateStr).toISOString();
                    } else if (part.startsWith('rec:')) {
                        recurring = part.substring(4);
                    } else if (part.startsWith('id:')) {
                        id = Number(part.substring(3)) || Date.now();
                    }
                });

                if (todoText.trim()) {
                    const todo = {
                        id: id,
                        text: todoText.trim(),
                        category: category,
                        completed: completed,
                        createdAt: new Date(id).toISOString()
                    };
                    
                    // 알림/반복 기능이 구현되면 추가
                    if (notificationTime) todo.notificationTime = notificationTime;
                    if (recurring) todo.recurring = recurring;
                    
                    importedData.todos.push(todo);
                }
            }
        });
        return importedData;
    };

    // 파일 내보내기 실행
    const exportToFile = (todos, categories) => {
        const content = stringifyData(todos, categories);
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
