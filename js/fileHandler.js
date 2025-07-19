const fileHandler = (() => {

    // 데이터를 텍스트로 변환 (내보내기용)
    const stringifyData = (todos, categories) => {
        let content = "### Mwohaji Backup Data ###\n\n";
        
        // 카테고리 목록 저장
        content += "#CATEGORIES:\n";
        content += categories.map(c => `${c.id}|${c.name}`).join('\n');
        content += "\n\n";

        // 할 일 목록 저장 (알람 관련 정보 제외)
        content += "#TODOS:\n";
        content += todos.map(t => {
            const completedMark = t.completed ? '[x]' : '[ ]';
            return `${completedMark} ${t.id}|${t.category}|${t.text}`;
        }).join('\n');

        return content;
    };

    // 텍스트를 데이터로 변환 (가져오기용)
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
                const completed = line.startsWith('[x]');
                const content = line.substring(4);
                const [id, category, ...textParts] = content.split('|');
                const text = textParts.join('|');

                if (id && category && text) {
                     importedData.todos.push({
                        id: Number(id),
                        text: text,
                        category: category,
                        completed: completed,
                        createdAt: new Date(Number(id)).toISOString(),
                        // 알람 관련 속성 제거
                    });
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
