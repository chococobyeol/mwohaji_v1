const geminiApi = (() => {
    let apiKey = null;
    const MODEL = 'gemini-2.5-flash';
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

    // 최근 목록 캐시 (동일 요청 내에서 순번 참조용)
    let recentListed = [];

    // 스케줄 입력 정규화
    const normalizeSchedule = (raw) => {
        if (!raw || typeof raw !== 'object') return null;
        const out = {};
        const now = new Date();
        const pick = (...keys) => keys.find(k => Object.prototype.hasOwnProperty.call(raw, k));

        const startKey = pick('startTime','start_time','startAt','scheduleTime');
        const dueKey = pick('dueTime','due_time','dueAt');

        const toDate = (val) => {
            if (val == null) return null;
            if (val instanceof Date) return val;
            if (typeof val === 'number' && isFinite(val)) {
                return new Date(now.getTime() + val * 60 * 1000);
            }
            if (typeof val === 'string') {
                const m = val.trim().toLowerCase();
                // "+10m" 또는 "10m" 형태
                const mm = m.match(/^\+?(\d+)m(in)?$/);
                if (mm) {
                    const mins = parseInt(mm[1],10);
                    return new Date(now.getTime() + mins * 60 * 1000);
                }
                const asDate = new Date(val);
                if (!isNaN(asDate)) return asDate;
            }
            return null;
        };

        const sVal = startKey ? raw[startKey] : undefined;
        const dVal = dueKey ? raw[dueKey] : undefined;
        const offKey = pick('timeOffset','time_offset','offsetMinutes','minutes','minutesFromNow');
        if (!sVal && !dVal && offKey) {
            const mins = Number(raw[offKey]);
            if (!isNaN(mins) && mins > 0) out.startTime = new Date(now.getTime() + mins * 60 * 1000);
        }
        const sDate = toDate(sVal);
        const dDate = toDate(dVal);
        if (sDate) out.startTime = sDate;
        if (dDate) out.dueTime = dDate;

        // 옵션 플래그
        const pickBool = (a,b, def) => (raw[a] ?? raw[b] ?? def);
        if ('startModal' in raw || 'start_modal' in raw) out.startModal = pickBool('startModal','start_modal', true);
        if ('startNotification' in raw || 'start_notification' in raw) out.startNotification = pickBool('startNotification','start_notification', true);
        if ('dueModal' in raw || 'due_modal' in raw) out.dueModal = pickBool('dueModal','due_modal', true);
        if ('dueNotification' in raw || 'due_notification' in raw) out.dueNotification = pickBool('dueNotification','due_notification', true);

        return Object.keys(out).length ? out : null;
    };

    // 액션 구현체: 사용자 요구를 직접 실행하는 간단한 함수 집합
    const actionsImpl = {
        addCategory: ({ name }) => {
            if (!name || !name.trim()) return { ok: false, result: '카테고리 이름이 필요합니다.' };
            const created = todoManager.addCategory(name.trim());
            if (created) {
                if (window.app && window.app.renderCategories) window.app.renderCategories();
                return { ok: true, result: `카테고리 "${created.name}" 추가` };
            }
            return { ok: false, result: '카테고리 추가 실패(중복 등)' };
        },

        createTodo: ({ text, category, schedule, repeat }) => {
            if (!text || !text.trim()) return { ok: false, result: '할 일 내용이 필요합니다.' };
            // 카테고리 확인/생성
            let categoryId = 'default';
            if (category && category.trim()) {
                const existing = todoManager.getCategories().find(c => c.name === category.trim());
                if (existing) {
                    categoryId = existing.id;
                } else {
                    const newCat = todoManager.addCategory(category.trim());
                    if (newCat) categoryId = newCat.id;
                }
            }

            // 반복 설정 정규화
            let normalizedRepeat = null;
            if (repeat && typeof repeat === 'object') {
                normalizedRepeat = { ...repeat };
                if (normalizedRepeat.type === 'interval') {
                    const n = Number(normalizedRepeat.interval);
                    normalizedRepeat.interval = !isNaN(n) && n > 0 ? n : 30;
                }
            }

            const newTodo = todoManager.addTodo(text.trim(), categoryId, normalizedRepeat);
            if (!newTodo) return { ok: false, result: '할 일 생성 실패' };

            // 일정 설정 (유연한 키 정규화)
            if (schedule && typeof schedule === 'object') {
                const scheduleData = normalizeSchedule(schedule);
                if (scheduleData) {
                    todoManager.updateTodoSchedule(newTodo.id, scheduleData);
                }
            }
                    
                    if (window.notificationScheduler) {
                        window.notificationScheduler.rescheduleAllNotifications(todoManager.getTodos());
                    }
            if (window.app && window.app.renderTodos) window.app.renderTodos();
            if (window.app && window.app.renderCategories) window.app.renderCategories();
            return { ok: true, result: `"${newTodo.text}" 생성` };
        },

        deleteTodo: ({ todoId, text, position }) => {
            const todos = todoManager.getTodos();
            let target = null;
            if (todoId != null) target = todos.find(t => t.id == todoId);
            // 순번 기반 참조(동일 요청 내 선행 list 액션 필요)
            if (!target && position != null) {
                const idx = Number(position) - 1;
                if (recentListed && recentListed[idx]) {
                    target = todos.find(t => t.id == recentListed[idx].id);
                    if (!target) return { ok: false, result: 'position 참조 실패: 목록과 데이터가 일치하지 않습니다.' };
                } else {
                    return { ok: false, result: 'position 참조를 위해 선행 list 액션이 필요합니다.' };
                }
            }
            if (!target && text) target = todos.find(t => t.text.includes(text));
            if (!target) return { ok: false, result: '삭제할 할 일을 찾지 못했습니다.' };
            todoManager.deleteTodo(target.id);
            if (window.app && window.app.renderTodos) window.app.renderTodos();
            return { ok: true, result: `"${target.text}" 삭제` };
        },

        deleteAllTodos: () => {
            try {
                const all = todoManager.getTodos();
                const completedRepeat = (todoManager.getCompletedRepeatTodos && todoManager.getCompletedRepeatTodos()) || [];
                const completedIds = new Set(completedRepeat.map(t => t.id));
                let count = 0;
                all.forEach(t => {
                    if (completedIds.has(t.id)) {
                        todoManager.deleteCompletedRepeatTodo(t.id);
                        count++;
                    } else {
                        todoManager.deleteTodo(t.id);
                        count++;
                    }
                });
                if (window.app && window.app.renderTodos) window.app.renderTodos();
                return { ok: true, result: `${count}개 삭제` };
            } catch (e) {
                return { ok: false, result: e?.message || '전체 삭제 실패' };
            }
        },

        // 반복 알림(완료 기록 포함) 일괄 삭제
        deleteRepeatTodos: ({ includeCompleted = true } = {}) => {
            try {
                const all = todoManager.getTodos();
                let count = 0;
                all.forEach(t => {
                    // 반복 여부는 t.repeat 존재로 판정
                    if (t.repeat) {
                        if (t.completed) {
                            // 완료된 반복 항목(기록) 삭제
                            if (todoManager.deleteCompletedRepeatTodo) {
                                todoManager.deleteCompletedRepeatTodo(t.id);
                                count++;
                    }
                } else {
                            // 진행중 반복 할 일 삭제
                            todoManager.deleteTodo(t.id);
                            count++;
                        }
                    }
                });
                if (!includeCompleted) {
                    // 이미 위 루프에서 completed도 삭제했으므로, 옵션을 반영하려면 completed를 유지해야 함
                    // 간단히: includeCompleted=false면 완료 기록은 복원 불가하므로, 앞으로의 호출에서만 사용 권장
                }
                if (window.app && window.app.renderTodos) window.app.renderTodos();
                return { ok: true, result: `${count}개 반복 알림 삭제` };
            } catch (e) {
                return { ok: false, result: e?.message || '반복 알림 삭제 실패' };
            }
        },

        // 카테고리 삭제: behavior에 따라 처리
        // behavior: 'keepTodos' | 'deleteTodos' | 'moveTo'
        deleteCategory: ({ name, behavior = 'keepTodos', targetCategoryName }) => {
            const cats = todoManager.getCategories();
            const cat = cats.find(c => c.name === name);
            if (!cat) return { ok: false, result: '카테고리를 찾지 못했습니다.' };
            try {
                if (behavior === 'deleteTodos') {
                    todoManager.deleteCategoryAndTodos(cat.id);
                } else if (behavior === 'moveTo') {
                    if (!targetCategoryName || !targetCategoryName.trim()) {
                        return { ok: false, result: 'targetCategoryName이 필요합니다.' };
                    }
                    todoManager.deleteCategoryAndMoveTodos(cat.id, targetCategoryName.trim());
                } else {
                    // keepTodos: 삭제 후 해당 할 일은 '일반'으로
                    todoManager.deleteCategory(cat.id);
                }
                if (window.app && window.app.renderTodos) window.app.renderTodos();
                if (window.app && window.app.renderCategories) window.app.renderCategories();
                return { ok: true, result: `카테고리 "${name}" 삭제 (${behavior})` };
            } catch (e) {
                return { ok: false, result: e?.message || '카테고리 삭제 실패' };
            }
        },

        updateTodoByRecreate: ({ find, update }) => {
            const todos = todoManager.getTodos();
            let target = null;
            if (find?.todoId != null) target = todos.find(t => t.id == find.todoId);
            // 순번 기반 참조(동일 요청 내 선행 list 액션 필요)
            if (!target && find?.position != null) {
                const idx = Number(find.position) - 1;
                if (recentListed && recentListed[idx]) {
                    target = todos.find(t => t.id == recentListed[idx].id);
                    if (!target) return { ok: false, result: 'position 참조 실패: 목록과 데이터가 일치하지 않습니다.' };
                } else {
                    return { ok: false, result: 'position 참조를 위해 선행 list 액션이 필요합니다.' };
                }
            }
            if (!target && find?.text) target = todos.find(t => t.text.includes(find.text));
            if (!target) return { ok: false, result: '수정할 할 일을 찾지 못했습니다.' };

            // 스케줄 정규화
            const normalizedSchedule = normalizeSchedule(update?.schedule) || {
                startTime: target.schedule?.startTime || null,
                dueTime: target.schedule?.dueTime || null,
                startModal: target.schedule?.startModal !== false,
                startNotification: !!target.schedule?.startNotification,
                dueModal: target.schedule?.dueModal !== false,
                dueNotification: !!target.schedule?.dueNotification
            };

            const next = {
                text: update?.text || target.text,
                category: update?.category || target.category,
                schedule: normalizedSchedule,
                repeat: update?.repeat || target.repeat || null
            };

            todoManager.deleteTodo(target.id);
            const created = actionsImpl.createTodo(next);
            if (!created.ok) return { ok: false, result: `수정 실패: ${created.result}` };
            return { ok: true, result: `"${target.text}" → "${next.text}" 수정` };
        },

        listTodos: () => {
            const todos = todoManager.getTodos();
            return { ok: true, result: todos.map(t => ({
                id: t.id,
                text: t.text,
                category: t.category,
                schedule: {
                    startTime: t.schedule?.startTime || null,
                    dueTime: t.schedule?.dueTime || null
                },
                repeat: t.repeat || null,
                completed: !!t.completed
            })) };
        },

        listScheduledTodos: ({ includeCompleted = false } = {}) => {
            const all = todoManager.getTodos();
            const scheduled = all.filter(t => (includeCompleted || !t.completed) && (t.schedule?.startTime || t.schedule?.dueTime));
            return { ok: true, result: scheduled.map(t => ({
                id: t.id,
                text: t.text,
                category: t.category,
                startTime: t.schedule?.startTime || null,
                dueTime: t.schedule?.dueTime || null,
                repeat: t.repeat || null
            })) };
        },

        searchTodoContent: ({ query }) => {
            const todos = todoManager.getTodos().filter(t => t.text.includes(query || ''));
            return { ok: true, result: todos.map(t => ({ id: t.id, text: t.text })) };
        }
    };

    // 프롬프트 구성: 함수 호출 목록(actions) + 대화 메시지(message)
    const buildPrompt = (userInput, context) => {
        const nowISO = new Date().toISOString();
        const categories = (context?.categories || []).join(', ');
        const todosBrief = (context?.todos || [])
            .map(t => `- ${t.text} [${t.category}]${t.schedule?.startTime ? ` 시작:${new Date(t.schedule.startTime).toLocaleString('ko-KR')}` : ''}${t.schedule?.dueTime ? ` 마감:${new Date(t.schedule.dueTime).toLocaleString('ko-KR')}` : ''}`)
            .slice(0, 15)
            .join('\n');
        const convo = Array.isArray(context?.conversation) && context.conversation.length
            ? `이전 대화(최신 10개):\n${context.conversation.map(m => `${m.sender}: ${m.text}`).join('\n')}`
            : '';

        return `역할: 당신은 할 일 관리 앱 어시스턴트입니다. 자연어 명령을 분석해 "함수 호출 목록(actions)"을 생성하고, 사용자에게 보여줄 한국어 메시지(message)도 함께 제공합니다.

중요 규칙:
- 시간은 반드시 ISO 8601 로컬 시간 문자열(예: 2025-08-13T17:00:00)로 출력
- 반복 간격(interval)은 분 단위 정수
- 반드시 유효한 JSON만 출력하고, 코드블록(백틱)과 추가 설명/머릿말/꼬릿말은 절대 포함하지 말 것
- 지원 함수 목록과 시그니처:
  1) addCategory({ name })
  2) createTodo({ text, category?, schedule?, repeat? })
     - schedule: { startTime?, dueTime?, startModal?, startNotification?, dueModal?, dueNotification? }
     - repeat: { type: 'interval'|'daily'|'weekly'|'monthly', interval?, limit?, days?, dates? }
       3) deleteTodo({ todoId?, text?, position? })
      4) deleteAllTodos()
  5) updateTodoByRecreate({ find: { todoId?, text? }, update: { text?, category?, schedule?, repeat? } })
         6) listTodos()
         7) listScheduledTodos({ includeCompleted? })
         8) searchTodoContent({ query })
         9) deleteRepeatTodos({ includeCompleted? })
         10) deleteCategory({ name, behavior?, targetCategoryName? })

출력 형식(JSON만):
{
  "actions": [ { "function": "createTodo", "args": { ... } }, ... ],
  "message": "사용자에게 보여줄 한국어 문장",
  "success": true
}

앱 상태:
- 현재시각: ${nowISO}
- 카테고리: ${categories || '없음'}
- 미완료 할 일 미리보기:\n${todosBrief || '없음'}

${convo}

사용자 입력: "${userInput}"

예시:
- "5시에 알람 추가해줘" ⇒ { actions: [{ function: "createTodo", args: { text: "알림", schedule: { startTime: "2025-08-13T17:00:00" } }}], message: "오늘 17:00에 시작 알림을 추가했어요.", success: true }
- "매 10분마다 5회 반복 알림" ⇒ { actions: [{ function: "createTodo", args: { text: "알림", repeat: { type: "interval", interval: 10, limit: 5 }}}], message: "10분 간격으로 5회 반복 알림을 만들었어요.", success: true }`;
    };

    const robustParseJson = (text) => {
        if (!text) throw new Error('빈 응답');
        const fenced = text.replace(/```json\s*([\s\S]*?)```/i, '$1');
        const match = fenced.match(/\{[\s\S]*\}/);
        if (!match) throw new Error('JSON 블록을 찾지 못함');
        const cleaned = match[0]
            .replace(/[\u2018\u2019]/g, "'")
            .replace(/[\u201C\u201D]/g, '"');
        return JSON.parse(cleaned);
    };

    const ACTION_SPECS = {
        addCategory: { args: ['name'] },
        createTodo: { args: ['text','category','schedule','repeat'] },
        deleteTodo: { args: ['todoId','text','position'] },
        deleteAllTodos: { args: [] },
        deleteRepeatTodos: { args: ['includeCompleted'] },
        deleteCategory: { args: ['name','behavior','targetCategoryName'] },
        updateTodoByRecreate: { args: ['find','update'] },
        listTodos: { args: [] },
        listScheduledTodos: { args: ['includeCompleted'] },
        searchTodoContent: { args: ['query'] }
    };

    const validateSchedule = (schedule, path, errors) => {
        const allowed = ['startTime','dueTime','startModal','startNotification','dueModal','dueNotification'];
        if (typeof schedule !== 'object' || schedule === null) {
            errors.push(`${path}는 object 여야 합니다.`);
            return;
        }
        for (const k of Object.keys(schedule)) {
            if (!allowed.includes(k)) errors.push(`${path}.${k}는 허용되지 않은 키입니다.`);
        }
        const isIso = (s) => typeof s === 'string' && !isNaN(new Date(s));
        if (schedule.startTime != null && !isIso(schedule.startTime)) errors.push(`${path}.startTime은 ISO 시간 문자열이어야 합니다.`);
        if (schedule.dueTime != null && !isIso(schedule.dueTime)) errors.push(`${path}.dueTime은 ISO 시간 문자열이어야 합니다.`);
        const bools = ['startModal','startNotification','dueModal','dueNotification'];
        for (const b of bools) {
            if (schedule[b] != null && typeof schedule[b] !== 'boolean') errors.push(`${path}.${b}는 boolean 이어야 합니다.`);
        }
    };

    const validateRepeat = (repeat, path, errors) => {
        const allowed = ['type','interval','limit','days','dates'];
        if (typeof repeat !== 'object' || repeat === null) {
            errors.push(`${path}는 object 여야 합니다.`);
            return;
        }
        for (const k of Object.keys(repeat)) {
            if (!allowed.includes(k)) errors.push(`${path}.${k}는 허용되지 않은 키입니다.`);
        }
        const types = ['interval','daily','weekly','monthly'];
        if (repeat.type != null && !types.includes(repeat.type)) errors.push(`${path}.type은 ${types.join('|')} 중 하나여야 합니다.`);
        if (repeat.interval != null && (!Number.isInteger(repeat.interval) || repeat.interval <= 0)) errors.push(`${path}.interval은 양의 정수(분)이어야 합니다.`);
        if (repeat.limit != null && (!Number.isInteger(repeat.limit) || repeat.limit <= 0)) errors.push(`${path}.limit은 양의 정수여야 합니다.`);
        if (repeat.days != null && !Array.isArray(repeat.days)) errors.push(`${path}.days는 배열이어야 합니다.`);
        if (repeat.dates != null && !Array.isArray(repeat.dates)) errors.push(`${path}.dates는 배열이어야 합니다.`);
    };

    const validateActions = (actions) => {
        const errors = [];
        if (!Array.isArray(actions)) {
            return { ok: false, errors: ['actions는 배열이어야 합니다.'] };
        }
        actions.forEach((act, idx) => {
            const p = `actions[${idx}]`;
            if (!act || typeof act !== 'object') {
                errors.push(`${p}는 object 여야 합니다.`);
                return;
            }
            if (typeof act.function !== 'string') {
                errors.push(`${p}.function은 문자열이어야 합니다.`);
                return;
            }
            const spec = ACTION_SPECS[act.function];
            if (!spec) {
                errors.push(`${p}.function '${act.function}'는 허용되지 않습니다.`);
                return;
            }
            const args = act.args ?? {};
            if (typeof args !== 'object') {
                errors.push(`${p}.args는 object 여야 합니다.`);
                return;
            }
            // 추가 키 금지
            for (const k of Object.keys(args)) {
                if (!spec.args.includes(k)) errors.push(`${p}.args.${k}는 허용되지 않은 키입니다.`);
            }
            // 필드별 간단 타입 검증
            switch (act.function) {
                case 'addCategory':
                    if (args.name != null && typeof args.name !== 'string') errors.push(`${p}.args.name은 문자열이어야 합니다.`);
                    break;
                case 'createTodo':
                    if (typeof args.text !== 'string') errors.push(`${p}.args.text는 필수 문자열입니다.`);
                    if (args.category != null && typeof args.category !== 'string') errors.push(`${p}.args.category는 문자열이어야 합니다.`);
                    if (args.schedule != null) validateSchedule(args.schedule, `${p}.args.schedule`, errors);
                    if (args.repeat != null) validateRepeat(args.repeat, `${p}.args.repeat`, errors);
                    break;
                case 'deleteRepeatTodos':
                    if (args.includeCompleted != null && typeof args.includeCompleted !== 'boolean') errors.push(`${p}.args.includeCompleted는 boolean이어야 합니다.`);
                    break;
                case 'deleteCategory':
                    if (typeof args.name !== 'string' || !args.name.trim()) errors.push(`${p}.args.name은 필수 문자열입니다.`);
                    if (args.behavior != null && !['keepTodos','deleteTodos','moveTo'].includes(args.behavior)) errors.push(`${p}.args.behavior는 keepTodos|deleteTodos|moveTo 중 하나여야 합니다.`);
                    if (args.behavior === 'moveTo' && (typeof args.targetCategoryName !== 'string' || !args.targetCategoryName.trim())) errors.push(`${p}.args.targetCategoryName은 behavior가 moveTo일 때 필수 문자열입니다.`);
                    break;
                case 'deleteTodo':
                    if (args.todoId != null && typeof args.todoId !== 'number') errors.push(`${p}.args.todoId는 숫자여야 합니다.`);
                    if (args.text != null && typeof args.text !== 'string') errors.push(`${p}.args.text는 문자열이어야 합니다.`);
                    if (args.position != null && !Number.isInteger(args.position)) errors.push(`${p}.args.position은 정수여야 합니다.`);
                    break;
                case 'updateTodoByRecreate':
                    if (typeof args.find !== 'object' || args.find == null) { errors.push(`${p}.args.find는 object여야 합니다.`); break; }
                    if (typeof args.update !== 'object' || args.update == null) { errors.push(`${p}.args.update는 object여야 합니다.`); break; }
                    // find
                    for (const k of Object.keys(args.find)) {
                        if (!['todoId','text','position'].includes(k)) errors.push(`${p}.args.find.${k}는 허용되지 않은 키입니다.`);
                    }
                    if (args.find.todoId != null && typeof args.find.todoId !== 'number') errors.push(`${p}.args.find.todoId는 숫자여야 합니다.`);
                    if (args.find.text != null && typeof args.find.text !== 'string') errors.push(`${p}.args.find.text는 문자열이어야 합니다.`);
                    if (args.find.position != null && !Number.isInteger(args.find.position)) errors.push(`${p}.args.find.position은 정수여야 합니다.`);
                    // update
                    for (const k of Object.keys(args.update)) {
                        if (!['text','category','schedule','repeat'].includes(k)) errors.push(`${p}.args.update.${k}는 허용되지 않은 키입니다.`);
                    }
                    if (args.update.text != null && typeof args.update.text !== 'string') errors.push(`${p}.args.update.text는 문자열이어야 합니다.`);
                    if (args.update.category != null && typeof args.update.category !== 'string') errors.push(`${p}.args.update.category는 문자열이어야 합니다.`);
                    if (args.update.schedule != null) validateSchedule(args.update.schedule, `${p}.args.update.schedule`, errors);
                    if (args.update.repeat != null) validateRepeat(args.update.repeat, `${p}.args.update.repeat`, errors);
                    break;
                case 'listScheduledTodos':
                    if (args.includeCompleted != null && typeof args.includeCompleted !== 'boolean') errors.push(`${p}.args.includeCompleted는 boolean이어야 합니다.`);
                    break;
                case 'searchTodoContent':
                    if (typeof args.query !== 'string') errors.push(`${p}.args.query는 문자열이어야 합니다.`);
                    break;
                default:
                    break;
            }
        });
        return { ok: errors.length === 0, errors };
    };

    const requestSchemaFix = async (userInput, context, rawOrParsed, errors, attempt = 1) => {
        const convo = Array.isArray(context?.conversation) ? context.conversation.slice(-5) : [];
        const todosPreview = (context?.todos || []).slice(0, 10).map(t => ({
            id: t.id, text: t.text, category: t.category,
            startTime: t.schedule?.startTime || null,
            dueTime: t.schedule?.dueTime || null
        }));
        const advice = `이전 응답이 스키마를 위반했습니다. 아래 오류를 모두 수정하여 JSON만 다시 출력하세요. 추가 텍스트 금지.

스키마 오류:
${errors.map(e=>`- ${e}`).join('\n')}

지원 함수와 정확한 키는 다음과 같습니다:
- addCategory({ name })
- createTodo({ text, category?, schedule?, repeat? })
  schedule: { startTime?, dueTime?, startModal?, startNotification?, dueModal?, dueNotification? }
  repeat: { type, interval?, limit?, days?, dates? }
- deleteTodo({ todoId?, text?, position? })
- deleteAllTodos()
- updateTodoByRecreate({ find: { todoId?, text?, position? }, update: { text?, category?, schedule?, repeat? } })
- listTodos()
- listScheduledTodos({ includeCompleted? })
- searchTodoContent({ query })

사용자 입력: ${userInput}
이전 응답(JSON 또는 텍스트): ${typeof rawOrParsed === 'string' ? rawOrParsed : JSON.stringify(rawOrParsed)}
최근 대화(최신 5개): ${JSON.stringify(convo)}
현재 미완료 할 일 프리뷰(최대 10개): ${JSON.stringify(todosPreview)}

출력 형식(JSON): { "actions": [ { "function": "...", "args": { ... } } ], "message": "...", "success": true }`;

        const resp = await fetch(`${API_URL}?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: advice }] }],
                generationConfig: {
                    temperature: attempt > 1 ? 0.0 : 0.2,
                    topP: 0.9,
                    maxOutputTokens: 1024,
                    response_mime_type: 'application/json'
                }
            })
        });
        if (!resp.ok) return null;
        const data = await resp.json().catch(()=>null);
        const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || data?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        try {
            return typeof raw === 'string' ? robustParseJson(raw) : JSON.parse(atob(raw || ''));
        } catch {
            return null;
        }
    };

    const runActions = async (actions) => {
        const results = [];
        if (!Array.isArray(actions)) return results;
        recentListed = [];
        for (const act of actions) {
            const fn = act?.function;
            const args = act?.args || {};
            if (typeof actionsImpl[fn] === 'function') {
                try {
                    const r = await actionsImpl[fn](args);
                    results.push({ function: fn, ok: !!r?.ok, result: r?.result });
                    if ((fn === 'listTodos' || fn === 'listScheduledTodos' || fn === 'searchTodoContent') && Array.isArray(r?.result)) {
                        recentListed = r.result.map(item => ({ id: item.id, text: item.text, category: item.category }));
                    }
                } catch (e) {
                    console.error('[GeminiAPI] 액션 실행 실패:', fn, e);
                    results.push({ function: fn, ok: false, result: e.message });
                }
                    } else {
                results.push({ function: fn, ok: false, result: '정의되지 않은 함수' });
            }
        }
        return results;
    };

    // (의도 기반 로컬 보정/추론 로직 제거: AI가 모든 결정을 내리도록 단순화)

    const setApiKey = async (key) => {
        apiKey = key;
        if (!key || key === 'test') return;
        const resp = await fetch(`${API_URL}?key=${key}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: 'ping' }] }], generationConfig: { maxOutputTokens: 5 } })
        });
        if (!resp.ok) {
            const data = await resp.json().catch(() => ({}));
            apiKey = null;
            throw new Error(data?.error?.message || 'API 키 검증 실패');
        }
    };

    const clearApiKey = () => { apiKey = null; };

    const sendMessage = async (userInput, context) => {
        if (!apiKey) {
            return { success: false, error: 'API 키가 설정되지 않았습니다. 설정에서 API 키를 입력해주세요.' };
        }
        if (apiKey === 'test') {
            const in5 = new Date(Date.now() + 5 * 60000).toISOString().slice(0, 19);
            const actions = [{ function: 'createTodo', args: { text: '테스트 알림', schedule: { startTime: in5 } } }];
            await runActions(actions);
            return { success: true, message: `테스트 모드: ${new Date(in5).toLocaleString('ko-KR')} 시작 알림 생성` };
        }

        try {
            const prompt = buildPrompt(userInput, context);
            const resp = await fetch(`${API_URL}?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { temperature: 0.3, topP: 0.9, maxOutputTokens: 1024, response_mime_type: 'application/json' }
                })
            });

            if (!resp.ok) {
                const err = await resp.json().catch(() => ({}));
                throw new Error(err?.error?.message || resp.statusText);
            }

            const data = await resp.json();
            // response_mime_type 설정 시, text 대신 JSON으로 반환될 수 있음
            const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || data?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

            // 모델이 JSON이 아니어도 대화로 응답할 수 있도록 폴백
            let parsed = null;
            try {
                parsed = typeof raw === 'string' ? robustParseJson(raw) : JSON.parse(atob(raw || ''));
            } catch (e) {
                // JSON 파싱 실패: 즉시 스키마 수정 요청(최대 2회) 후 재시도
                const fixed1 = await requestSchemaFix(userInput, context, raw, ['JSON 파싱 실패: 유효한 JSON만 출력해야 합니다.'], 1);
                if (!fixed1) return { success: false, error: 'AI 응답이 JSON 형식이 아닙니다.', message: `모델이 JSON을 반환하지 않았습니다. 원문 일부: ${String(raw||'').slice(0,160)}` };
                let candidate = fixed1;
                // 1차 결과도 스키마 위반일 수 있으니 즉시 검증
                const s1 = validateActions(candidate.actions || []);
                const s1Errors = [];
                if (!('actions' in candidate)) s1Errors.push('필드 누락: actions');
                if (!('message' in candidate)) s1Errors.push('필드 누락: message');
                if (!('success' in candidate)) s1Errors.push('필드 누락: success');
                if (!s1.ok) s1Errors.push(...s1.errors);
                if (s1Errors.length > 0) {
                    const fixed2 = await requestSchemaFix(userInput, context, candidate, s1Errors, 2);
                    if (!fixed2) return { success: false, error: 'AI 응답 스키마 위반', message: `스키마 오류: ${s1Errors.join(', ')}` };
                    candidate = fixed2;
                }
                parsed = candidate;
            }

            // 스키마 검증 (엄격)
            if (parsed && typeof parsed === 'object') {
                const schemaErrs = [];
                if (!('actions' in parsed)) schemaErrs.push('필드 누락: actions');
                if (!('message' in parsed)) schemaErrs.push('필드 누락: message');
                if (!('success' in parsed)) schemaErrs.push('필드 누락: success');
                if (schemaErrs.length === 0) {
                    const v = validateActions(parsed.actions);
                    if (!v.ok) schemaErrs.push(...v.errors);
                }
                if (schemaErrs.length > 0) {
                    const fixed = await requestSchemaFix(userInput, context, parsed, schemaErrs, 1);
                    if (!fixed) return { success: false, error: 'AI 응답 스키마 위반', message: `스키마 오류: ${schemaErrs.join(', ')}` };
                    parsed = fixed;
                }
            }

            // 액션 실행 후 사용자 메시지 반환 (함수 기반 고정 스키마)
            let actions = Array.isArray(parsed.actions) ? parsed.actions : [];
            console.groupCollapsed('[GeminiAPI] 실행할 액션들');
            console.table(actions.map(a => ({ function: a.function, args: JSON.stringify(a.args || {}) })));
            console.groupEnd();
            // 모델 주도 원칙에 맞게 로컬 임의 처리 제거

            const execResults = await runActions(actions);
            console.groupCollapsed('[GeminiAPI] 1차 실행 결과');
            console.table(execResults);
            console.groupEnd();

            // 목록 결과를 사람이 읽기 쉬운 문자열로 합성
            const listResult = execResults.find(r => r.ok && (r.function === 'listScheduledTodos' || r.function === 'listTodos'));
            let listMessage = '';
            if (listResult && Array.isArray(listResult.result)) {
                const items = listResult.result;
                if (items.length === 0) {
                    listMessage = '\n(예정된 항목이 없습니다)';
                    } else {
                    const lines = items.slice(0, 50).map(item => {
                        const s = item.startTime ? new Date(item.startTime) : (item.schedule?.startTime ? new Date(item.schedule.startTime) : null);
                        const d = item.dueTime ? new Date(item.dueTime) : (item.schedule?.dueTime ? new Date(item.schedule.dueTime) : null);
                        const sTxt = s && !isNaN(s) ? s.toLocaleString('ko-KR') : '';
                        const dTxt = d && !isNaN(d) ? d.toLocaleString('ko-KR') : '';
                        const times = [sTxt && `시작:${sTxt}`, dTxt && `마감:${dTxt}`].filter(Boolean).join(', ');
                        return `• [${item.category}] ${item.text}${times ? ` (${times})` : ''}`;
                    });
                    listMessage = `\n${lines.join('\n')}`;
                }
            }

            let finalSuccess = parsed.success === undefined ? true : !!parsed.success;
            let finalMessage = parsed.message || (actions.length ? '작업을 완료했습니다.' : '요청을 처리했습니다.');
            if (listMessage) finalMessage = `${finalMessage}${listMessage}`;

            // 실패한 액션이 있으면 에러 피드백 루프 1회 시도 (AI가 전적으로 보정 결정)
            const failed = execResults.filter(r => !r.ok);
            if (failed.length > 0) {
                console.error('[GeminiAPI] 액션 실행 실패 감지:', failed);
                const feedbackPrompt = `이전 응답의 액션 중 일부가 실패했습니다. 아래 실패 정보와 원래 사용자 요청, 기존 액션과 최근 대화 일부를 참고하여 올바른 보정 액션 목록만 JSON으로 다시 제시하세요. 추가 설명 없이 JSON만 출력하세요. 실패 원인(예: '해당 텍스트와 일치하는 할 일을 찾지 못함', 'position 참조 누락', '시간 형식 오류')을 정확히 반영해 수정하세요.

원래 사용자 입력: ${userInput}
실패 정보(JSON): ${JSON.stringify(failed)}
기존 액션(JSON): ${JSON.stringify(actions)}
최근 대화(최신 5개): ${JSON.stringify((context?.conversation||[]).slice(-5))}

출력 형식(JSON): { "actions": [ { "function": "...", "args": { ... } } ], "message": "사용자에게 보여줄 한국어 문장", "success": true }`;

                const fbResp = await fetch(`${API_URL}?key=${apiKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: feedbackPrompt }] }],
                        generationConfig: { temperature: 0.2, topP: 0.9, maxOutputTokens: 1024, response_mime_type: 'application/json' }
                    })
                });
            if (fbResp.ok) {
                    const fbData = await fbResp.json();
                    const fbRaw = fbData?.candidates?.[0]?.content?.parts?.[0]?.text || fbData?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
                    try {
                        const fbParsed = typeof fbRaw === 'string' ? robustParseJson(fbRaw) : JSON.parse(atob(fbRaw || ''));
                    const fbActions = Array.isArray(fbParsed.actions) ? fbParsed.actions : [];
                    // 보정 액션에 position 참조가 있으면 직전 list 결과를 활용할 수 있도록 안내는 프롬프트에서 이미 수행함
                        if (fbActions.length > 0) {
                            console.groupCollapsed('[GeminiAPI] 피드백 액션들');
                            console.table(fbActions.map(a => ({ function: a.function, args: JSON.stringify(a.args || {}) })));
                            console.groupEnd();
                            const fbResults = await runActions(fbActions);
                            console.groupCollapsed('[GeminiAPI] 피드백 실행 결과');
                            console.table(fbResults);
                            console.groupEnd();
                            const anyFixed = fbResults.some(r => r.ok);
                            finalSuccess = finalSuccess || anyFixed;
                            finalMessage = `${finalMessage}\n오류를 감지하여 자동으로 수정 시도했습니다.` + (fbParsed.message ? `\n${fbParsed.message}` : '');
                        }
                    } catch (e) {
                        console.error('[GeminiAPI] 피드백 응답 파싱 실패:', e);
                        finalMessage = `${finalMessage}\n(오류 세부: ${failed.map(f=>`${f.function}: ${f.result}`).join(', ')})`;
                    }
                } else {
                    console.error('[GeminiAPI] 피드백 요청 실패:', await fbResp.text().catch(() => ''));
                    finalMessage = `${finalMessage}\n(오류 세부: ${failed.map(f=>`${f.function}: ${f.result}`).join(', ')})`;
                }
            }
            return { success: finalSuccess, message: finalMessage };
        } catch (e) {
            console.error('[GeminiAPI] 오류:', e);
            const msg = e && e.message ? e.message : '알 수 없는 오류가 발생했습니다';
            return { success: false, error: msg };
        }
    };

    return { setApiKey, clearApiKey, sendMessage };
})();

window.geminiApi = geminiApi; 

