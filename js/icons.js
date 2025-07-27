const icons = (() => {
    // PRD 7.3.1 아이콘 시스템 구현
    // 기본: 24x24px, 선 두께: 1.5px, 라운드 처리: 2px
    
    const createSVG = (pathData, size = 24, strokeWidth = 1.5) => {
        return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">
            ${pathData}
        </svg>`;
    };

    const iconPaths = {
        // 할 일 관리 - 깔끔하고 단순한 아이콘들
        checkbox: '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>', // 빈 박스
        checkboxChecked: '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><polyline points="9,12 11,14 15,10"/>', // 체크된 박스
        plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>', // 추가
        trash: '<polyline points="3,6 5,6 21,6"/><path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>', // 삭제 (휴지통)
        edit: '<path d="m11,4H4a2,2 0 0,0 -2,2v14a2,2 0 0,0 2,2h14a2,2 0 0,0 2,-2v-7"/><path d="m18.5,2.5 a2.12,2.12 0 0,1 3,3L12,15l-4,1 1,-4 9.5,-9.5z"/>', // 편집 (연필)
        
        // 시간/일정
        clock: '<circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/>', // 시계
        bell: '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="m13.73 21a2 2 0 0 1-3.46 0"/>', // 알림 설정
        bellOff: '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="m13.73 21a2 2 0 0 1-3.46 0"/><line x1="4" y1="4" x2="20" y2="20"/>', // 알림 끄기
        repeat: '<path d="M17 2l4 4-4 4"/><path d="M21 6H9a4 4 0 0 0-4 4v2"/><path d="M7 22l-4-4 4-4"/><path d="M3 18h12a4 4 0 0 0 4-4v-2"/>', // 반복 (순환 화살표)
        
        // 데이터 관리 - 원래 화살표 모양으로 되돌리기
        upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7,10 12,5 17,10"/><line x1="12" y1="5" x2="12" y2="15"/>', // 가져오기 (↑)
        download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7,10 12,15 17,10"/><line x1="12" y1="15" x2="12" y2="3"/>', // 내보내기 (↓)
        
        // 보기 모드
        grid: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>', // 전체 보기 (격자)
        calendar: '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>', // 월간 보기 (달력)
        
        // 기타 - 카테고리 아이콘 변경 (4개 정사각형 + 검색)
        settings: '<rect x="2" y="2" width="8" height="8" rx="1"/><rect x="14" y="2" width="8" height="8" rx="1"/><rect x="2" y="14" width="8" height="8" rx="1"/><circle cx="18" cy="18" r="3"/><path d="m22 22-1.5-1.5"/>', // 카테고리 (4개 정사각형 + 검색)
        'settings-gear': '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>', // 설정 (톱니바퀴)
        'order-list': '<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>', // 순서 편집 (목록 아이콘)
        close: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>', // 닫기 (×)
        'check-circle': '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22,4 12,14.01 9,11.01"/>', // 완료된 할 일 표시
        
        // 소리 관련
        volume: '<polygon points="11,5 6,9 2,9 2,15 6,15 11,19 11,5"/><path d="m19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>', // 소리 켜짐
        volumeX: '<polygon points="11,5 6,9 2,9 2,15 6,15 11,19 11,5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>', // 소리 꺼짐
        
        // AI 대화 관련
        chat: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>', // 대화 (말풍선)
        send: '<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22,2 15,22 11,13 2,9"/>', // 전송 (종이비행기)
        robot: '<rect x="3" y="11" width="18" height="10" rx="2" ry="2"/><circle cx="12" cy="16" r="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>', // AI 로봇
        brain: '<path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.12 2.5 2.5 0 0 1-.84-4.24 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/>' // AI 두뇌
    };

    const get = (iconName, size = 24, strokeWidth = 1.5) => {
        const pathData = iconPaths[iconName];
        if (!pathData) {
            console.warn(`Icon '${iconName}' not found`);
            return iconPaths.close; // 기본 아이콘으로 close 반환
        }
        return createSVG(pathData, size, strokeWidth);
    };

    // 접근성을 위한 ARIA 레이블 포함 버전
    const getWithLabel = (iconName, label, size = 24, strokeWidth = 1.5) => {
        const svg = get(iconName, size, strokeWidth);
        return svg.replace('<svg ', `<svg aria-label="${label}" role="img" `);
    };

    // 버튼에 아이콘을 설정하는 헬퍼 함수
    const setButtonIcon = (button, iconName, label = '', size = 24, strokeWidth = 1.5) => {
        if (label) {
            button.innerHTML = getWithLabel(iconName, label, size, strokeWidth);
            button.setAttribute('aria-label', label);
        } else {
            button.innerHTML = get(iconName, size, strokeWidth);
        }
        button.style.display = 'inline-flex';
        button.style.alignItems = 'center';
        button.style.justifyContent = 'center';
    };

    return {
        get,
        getWithLabel,
        setButtonIcon,
        // 자주 사용되는 아이콘들을 직접 노출
        paths: iconPaths
    };
})(); 