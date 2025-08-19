// Google Drive 동기화 모듈 (순수 OAuth 2.0 방식)

const googleDriveSync = (() => {
    let isAuthenticated = false;
    let currentUser = null;
    let accessToken = null;
    
    // Google API 초기화 (더 이상 Google Identity Services 사용하지 않음)
    const initGoogleAPI = async () => {
        try {
            console.log('=== [GoogleDrive] API 초기화 시작 ===');
            console.log('[GoogleDrive] 순수 OAuth 2.0 방식으로 변경됨');
            console.log('[GoogleDrive] - 현재 Origin:', window.location.origin);
            console.log('[GoogleDrive] - 현재 Hostname:', window.location.hostname);
            console.log('[GoogleDrive] - 현재 Port:', window.location.port);
            console.log('[GoogleDrive] - 현재 Protocol:', window.location.protocol);
            console.log('[GoogleDrive] - 현재 전체 URL:', window.location.href);
            
            // Google Identity Services를 사용하지 않으므로 항상 성공
            console.log('[GoogleDrive] OAuth 2.0 방식 초기화 완료');
            return true;
        } catch (error) {
            console.error('[GoogleDrive] API 초기화 실패:', error);
            return false;
        }
    };
    
         // Google 계정 로그인 (현재 창에서 OAuth 2.0)
     const signIn = async () => {
         try {
             console.log('=== [GoogleDrive] OAuth 2.0 로그인 시작 ===');
             
             // 환경변수 검증
             if (!window.ENV_GOOGLE_CLIENT_ID) {
                 throw new Error('Google 클라이언트 ID가 설정되지 않았습니다. .env 파일을 확인해주세요.');
             }
             
             console.log('[GoogleDrive] 1. 환경 확인 중...');
             console.log('[GoogleDrive] - window.location.origin:', window.location.origin);
             console.log('[GoogleDrive] - window.location.href:', window.location.href);
            
                         // OAuth 2.0 인증 URL 생성
             const authUrl = 'https://accounts.google.com/o/oauth2/auth?' +
                 'client_id=' + (window.ENV_GOOGLE_CLIENT_ID || '') +
                '&redirect_uri=' + encodeURIComponent(window.location.origin) +
                '&scope=https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile' +
                '&response_type=code' +
                '&access_type=offline' +
                '&prompt=consent' +
                '&state=' + encodeURIComponent(JSON.stringify({
                    timestamp: Date.now(),
                    origin: window.location.origin
                }));
            
            console.log('[GoogleDrive] 2. OAuth URL 생성:', authUrl);
            console.log('[GoogleDrive] 3. 현재 창에서 Google 로그인 페이지로 이동...');
            
            // 현재 창에서 Google 로그인 페이지로 이동
            window.location.href = authUrl;
            
            return true;
        } catch (error) {
            console.error('[GoogleDrive] 로그인 실패:', error);
            return false;
        }
    };
    
         // 인증 코드 처리
     const handleAuthCode = async (code) => {
         try {
             console.log('[GoogleDrive] 4. 인증 코드 처리 시작...');
             
             // 환경변수 검증
             if (!window.ENV_GOOGLE_CLIENT_ID || !window.ENV_GOOGLE_CLIENT_SECRET) {
                 throw new Error('Google 클라이언트 ID 또는 시크릿이 설정되지 않았습니다. .env 파일을 확인해주세요.');
             }
            
            // 인증 코드로 액세스 토큰 요청
            const response = await fetch('https://oauth2.googleapis.com/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                                 body: new URLSearchParams({
                     code: code,
                     client_id: window.ENV_GOOGLE_CLIENT_ID || '',
                     client_secret: window.ENV_GOOGLE_CLIENT_SECRET || '',
                    redirect_uri: window.location.origin,
                    grant_type: 'authorization_code'
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                accessToken = data.access_token;
                console.log('[GoogleDrive] 5. 액세스 토큰 획득 완료');
                
                // 사용자 정보 가져오기
                const userInfo = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`
                    }
                });
                
                if (userInfo.ok) {
                    const userData = await userInfo.json();
                    isAuthenticated = true;
                    currentUser = {
                        id: userData.id,
                        email: userData.email,
                        name: userData.name,
                        picture: userData.picture
                    };
                    
                    console.log('[GoogleDrive] 6. 로그인 성공:', currentUser.name);
                    
                    // UI 업데이트 이벤트 발생
                    window.dispatchEvent(new CustomEvent('googleDriveAuthChanged', { 
                        detail: { isAuthenticated: true, user: currentUser } 
                    }));
                    
                    // 자동 동기화 설정
                    setupAutoSync();
                    
                    // 성공 메시지 및 설정 사이드바 다시 열기
                    alert('Google Drive 로그인 성공!');
                    
                    // 설정 사이드바 다시 열기 (사용자가 로그인 상태를 확인할 수 있도록)
                    setTimeout(() => {
                        if (window.openSettingsSidebar) {
                            window.openSettingsSidebar();
                        }
                    }, 1000);
                }
            } else {
                console.error('[GoogleDrive] 액세스 토큰 요청 실패:', response.status, response.statusText);
                alert('로그인 실패: 액세스 토큰을 가져올 수 없습니다.');
            }
        } catch (error) {
            console.error('[GoogleDrive] 인증 코드 처리 실패:', error);
            alert('로그인 실패: ' + error.message);
        }
    };
    
    // Google 계정 로그아웃
    const signOut = async () => {
        try {
            isAuthenticated = false;
            currentUser = null;
            accessToken = null;
            
            // 자동 동기화 중지
            if (window.autoSyncTimer) {
                clearInterval(window.autoSyncTimer);
                window.autoSyncTimer = null;
            }
            
            console.log('[GoogleDrive] 로그아웃 완료');
            
            // UI 업데이트 이벤트 발생
            window.dispatchEvent(new CustomEvent('googleDriveAuthChanged', { 
                detail: { isAuthenticated: false, user: null } 
            }));
            
            return true;
        } catch (error) {
            console.error('[GoogleDrive] 로그아웃 실패:', error);
            return false;
        }
    };
    
    // Google Drive API 호출 헬퍼
    const callGoogleDriveAPI = async (endpoint, options = {}) => {
        if (!accessToken) {
            throw new Error('액세스 토큰이 없습니다. 로그인이 필요합니다.');
        }
        
        const response = await fetch(`https://www.googleapis.com/drive/v3/${endpoint}`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });
        
        if (!response.ok) {
            throw new Error(`Google Drive API 오류: ${response.status} ${response.statusText}`);
        }
        
        return response.json();
    };
    
    // 파일 업로드 (Google Drive에 저장)
    const uploadToDrive = async (filename, content, mimeType = 'text/plain') => {
        if (!isAuthenticated || !accessToken) {
            throw new Error('Google 계정 로그인이 필요합니다.');
        }
        
        try {
            // 기존 파일 검색
            const existingFile = await findFile(filename);
            
            if (existingFile) {
                // 기존 파일 업데이트
                return await updateFile(existingFile.id, content, mimeType);
            } else {
                // 새 파일 생성
                return await createFile(filename, content, mimeType);
            }
        } catch (error) {
            console.error('[GoogleDrive] 파일 업로드 실패:', error);
            throw error;
        }
    };
    
    // 파일 검색
    const findFile = async (filename) => {
        try {
            const response = await callGoogleDriveAPI(`files?q=name='${filename}' and trashed=false&spaces=drive&fields=files(id,name,modifiedTime)`);
            return response.files[0] || null;
        } catch (error) {
            console.error('[GoogleDrive] 파일 검색 실패:', error);
            return null;
        }
    };
    
    // 새 파일 생성
    const createFile = async (filename, content, mimeType) => {
        try {
            const fileMetadata = {
                name: filename,
                mimeType: mimeType
            };
            
            // 1단계: 메타데이터로 파일 생성
            const createResponse = await fetch('https://www.googleapis.com/drive/v3/files', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(fileMetadata)
            });
            
            if (!createResponse.ok) {
                throw new Error(`파일 생성 실패: ${createResponse.status}`);
            }
            
            const file = await createResponse.json();
            
            // 2단계: 파일 내용 업로드
            const uploadResponse = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${file.id}?uploadType=media`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': mimeType
                },
                body: content
            });
            
            if (!uploadResponse.ok) {
                throw new Error(`파일 내용 업로드 실패: ${uploadResponse.status}`);
            }
            
            const result = await uploadResponse.json();
            console.log('[GoogleDrive] 파일 생성 완료:', result.name);
            return result;
        } catch (error) {
            console.error('[GoogleDrive] 파일 생성 실패:', error);
            throw error;
        }
    };
    
    // 기존 파일 업데이트
    const updateFile = async (fileId, content, mimeType) => {
        try {
            // 메타데이터 업데이트
            const metadata = {
                name: `mwohaji_sync_${new Date().toISOString().split('T')[0]}.json`,
                mimeType: mimeType
            };
            
            // 1단계: 메타데이터 업데이트
            const metadataResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(metadata)
            });
            
            if (!metadataResponse.ok) {
                throw new Error(`메타데이터 업데이트 실패: ${metadataResponse.status}`);
            }
            
            // 2단계: 파일 내용 업데이트 (resumable 업로드)
            const uploadResponse = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': mimeType
                },
                body: content
            });
            
            if (!uploadResponse.ok) {
                throw new Error(`파일 내용 업데이트 실패: ${uploadResponse.status}`);
            }
            
            const result = await uploadResponse.json();
            console.log('[GoogleDrive] 파일 업데이트 완료:', result.name);
            return result;
        } catch (error) {
            console.error('[GoogleDrive] 파일 업데이트 실패:', error);
            throw error;
        }
    };
    
    // 자동 동기화 설정
    const setupAutoSync = (intervalMinutes = 5) => {
        if (!isAuthenticated || !accessToken) {
            console.warn('[GoogleDrive] 자동 동기화 설정 실패: 인증 필요');
            return;
        }
        
        // 기존 타이머 제거
        if (window.autoSyncTimer) {
            clearInterval(window.autoSyncTimer);
        }
        
        // 새 타이머 설정
        window.autoSyncTimer = setInterval(async () => {
            try {
                await autoSync();
            } catch (error) {
                console.error('[GoogleDrive] 자동 동기화 실패:', error);
            }
        }, intervalMinutes * 60 * 1000);
        
        console.log(`[GoogleDrive] 자동 동기화 설정 완료 (${intervalMinutes}분 간격)`);
    };
    
    // 자동 동기화 실행
    const autoSync = async () => {
        try {
            // todoManager가 로드되었는지 확인
            if (!window.todoManager) {
                throw new Error('todoManager를 찾을 수 없습니다.');
            }
            
            const todos = window.todoManager.getTodos();
            const categories = window.todoManager.getCategories();
            
            // 데이터를 JSON으로 변환
            const data = {
                todos,
                categories,
                lastSync: new Date().toISOString(),
                version: '1.0'
            };
            
            const content = JSON.stringify(data, null, 2);
            const filename = `mwohaji_sync_${new Date().toISOString().split('T')[0]}.json`;
            
            // Google Drive에 업로드
            await uploadToDrive(filename, content, 'application/json');
            
            console.log('[GoogleDrive] 자동 동기화 완료:', filename);
            
            // 동기화 상태 업데이트
            updateSyncStatus(true, new Date());
            
        } catch (error) {
            console.error('[GoogleDrive] 자동 동기화 실패:', error);
            updateSyncStatus(false, new Date(), error.message);
        }
    };
    
    // 동기화 상태 업데이트
    const updateSyncStatus = (success, timestamp, errorMessage = '') => {
        const status = {
            success,
            timestamp: timestamp.toISOString(),
            errorMessage
        };
        
        localStorage.setItem('googleDriveSyncStatus', JSON.stringify(status));
        
        // UI 업데이트 (이벤트 발생)
        window.dispatchEvent(new CustomEvent('googleDriveSyncStatusChanged', { detail: status }));
    };
    
    // 동기화 상태 조회
    const getSyncStatus = () => {
        try {
            const status = localStorage.getItem('googleDriveSyncStatus');
            return status ? JSON.parse(status) : null;
        } catch (error) {
            return null;
        }
    };
    
    // 페이지 로드 시 인증 코드 확인
    const checkForAuthCode = () => {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const code = urlParams.get('code');
            const state = urlParams.get('state');
            
            if (code) {
                console.log('[GoogleDrive] 페이지 로드 시 인증 코드 발견:', code);
                
                // state 파라미터 검증
                if (state) {
                    try {
                        const stateData = JSON.parse(decodeURIComponent(state));
                        if (stateData.origin === window.location.origin) {
                            console.log('[GoogleDrive] state 검증 성공, 인증 코드 처리 시작...');
                            handleAuthCode(code);
                            
                            // URL에서 인증 코드 제거 (깔끔한 URL 유지)
                            const newUrl = window.location.origin + window.location.pathname;
                            window.history.replaceState({}, document.title, newUrl);
                        } else {
                            console.error('[GoogleDrive] state 검증 실패: origin 불일치');
                        }
                    } catch (e) {
                        console.error('[GoogleDrive] state 파라미터 파싱 실패:', e);
                    }
                } else {
                    console.log('[GoogleDrive] state 파라미터 없음, 인증 코드 처리 시작...');
                    handleAuthCode(code);
                    
                    // URL에서 인증 코드 제거
                    const newUrl = window.location.origin + window.location.pathname;
                    window.history.replaceState({}, document.title, newUrl);
                }
            }
        } catch (error) {
            console.error('[GoogleDrive] 인증 코드 확인 실패:', error);
        }
    };
    
    // 모듈 초기화
    const init = async () => {
        try {
            console.log('[GoogleDrive] OAuth 2.0 모듈 초기화 시작...');
            
            // Google Identity Services를 사용하지 않으므로 즉시 초기화
            const initialized = await initGoogleAPI();
            if (initialized) {
                console.log('[GoogleDrive] OAuth 2.0 모듈 초기화 완료');
                
                // 페이지 로드 시 인증 코드 확인
                checkForAuthCode();
                
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('[GoogleDrive] 모듈 초기화 실패:', error);
            return false;
        }
    };
    
    
    
    return {
        init,
        signIn,
        signOut,
        uploadToDrive,
        setupAutoSync,
        autoSync,
        getSyncStatus,
        isAuthenticated: () => isAuthenticated,
        getCurrentUser: () => currentUser
    };
})();

// 전역 객체에 할당
window.googleDriveSync = googleDriveSync;

// 모듈 초기화 (환경변수 로딩 완료 후 실행)
const initGoogleDriveSync = () => {
    googleDriveSync.init().then(success => {
        if (success) {
            console.log('[GoogleDrive] 모듈 초기화 성공');
        } else {
            console.warn('[GoogleDrive] 모듈 초기화 실패');
        }
    }).catch(error => {
        console.error('[GoogleDrive] 모듈 초기화 오류:', error);
    });
};

// 전역 함수로 노출
window.initGoogleDriveSync = initGoogleDriveSync;

// 환경변수가 로드되었는지 확인하고 초기화
if (window.ENV_GOOGLE_CLIENT_ID) {
    console.log('[GoogleDrive] 환경변수 이미 로드됨, 즉시 초기화');
    initGoogleDriveSync();
} else {
    console.log('[GoogleDrive] 환경변수 로딩 대기 중...');
    // 환경변수 로딩 완료 이벤트 대기
    window.addEventListener('envLoaded', () => {
        console.log('[GoogleDrive] 환경변수 로딩 완료, 초기화 시작');
        initGoogleDriveSync();
    });
}
