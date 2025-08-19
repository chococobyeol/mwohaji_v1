# Google Drive 동기화 구현 가이드

## 📋 목차
1. [개요](#개요)
2. [구현 방법](#구현-방법)
3. [Google Drive API 설정](#google-drive-api-설정)
4. [코드 구현](#코드-구현)
5. [보안 고려사항](#보안-고려사항)
6. [배포 및 테스트](#배포-및-테스트)
7. [문제 해결](#문제-해결)

## 🎯 개요

정적 사이트 호스팅 환경에서 Google Drive와 데이터를 동기화하는 것은 몇 가지 제약사항이 있습니다:

- **클라이언트 사이드만 가능**: 서버 없이 브라우저에서 직접 Google Drive API 호출
- **OAuth 2.0 인증**: 사용자 인증 및 권한 관리 필요
- **API 키 보안**: 클라이언트에서 API 키 노출 위험
- **CORS 제한**: Google Drive API의 교차 출처 요청 제한

## 🚀 구현 방법

### Google Drive API 직접 사용 (권장)
- **장점**: 완전한 제어, 실시간 동기화, 정적 사이트에서 완벽 동작
- **단점**: 복잡한 인증, API 키 보안 이슈

## 🔧 Google Drive API 설정

### 1. Google Cloud Console 설정

```bash
# 1. Google Cloud Console 접속
https://console.cloud.google.com/

# 2. 새 프로젝트 생성
# 3. Google Drive API 활성화
# 4. OAuth 2.0 클라이언트 ID 생성
# 5. API 키 생성
```

### 2. OAuth 동의 화면 설정

```javascript
// OAuth 동의 화면 구성
{
  "app_name": "Mwohaji Todo App",
  "user_support_email": "support@yourdomain.com",
  "developer_contact_information": {
    "email": "dev@yourdomain.com"
  },
  "scopes": [
    "https://www.googleapis.com/auth/drive.file",
    "https://www.googleapis.com/auth/drive.metadata.readonly"
  ]
}
```

### 3. 클라이언트 ID 및 시크릿

```javascript
// config.js (환경별 설정)
const GOOGLE_CONFIG = {
  clientId: 'YOUR_CLIENT_ID.apps.googleusercontent.com',
  apiKey: 'YOUR_API_KEY',
  scope: 'https://www.googleapis.com/auth/drive.file',
  discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest']
};
```

## 💻 코드 구현

### 1. Google Drive 동기화 모듈

```javascript
// js/googleDriveSync.js
const googleDriveSync = (() => {
    let gapi = null;
    let isAuthenticated = false;
    let currentUser = null;
    
    // Google API 초기화
    const initGoogleAPI = async () => {
        try {
            await new Promise((resolve, reject) => {
                gapi.load('client:auth2', {
                    callback: resolve,
                    onerror: reject
                });
            });
            
            await gapi.client.init({
                apiKey: GOOGLE_CONFIG.apiKey,
                clientId: GOOGLE_CONFIG.clientId,
                scope: GOOGLE_CONFIG.scope,
                discoveryDocs: GOOGLE_CONFIG.discoveryDocs
            });
            
            // 인증 상태 확인
            isAuthenticated = gapi.auth2.getAuthInstance().isSignedIn.get();
            
            if (isAuthenticated) {
                currentUser = gapi.auth2.getAuthInstance().currentUser.get();
                console.log('[GoogleDrive] 이미 인증됨:', currentUser.getBasicProfile().getName());
            }
            
            return true;
        } catch (error) {
            console.error('[GoogleDrive] API 초기화 실패:', error);
            return false;
        }
    };
    
    // Google 계정 로그인
    const signIn = async () => {
        try {
            const authInstance = gapi.auth2.getAuthInstance();
            const user = await authInstance.signIn();
            
            isAuthenticated = true;
            currentUser = user;
            
            console.log('[GoogleDrive] 로그인 성공:', user.getBasicProfile().getName());
            return true;
        } catch (error) {
            console.error('[GoogleDrive] 로그인 실패:', error);
            return false;
        }
    };
    
    // Google 계정 로그아웃
    const signOut = async () => {
        try {
            const authInstance = gapi.auth2.getAuthInstance();
            await authInstance.signOut();
            
            isAuthenticated = false;
            currentUser = null;
            
            console.log('[GoogleDrive] 로그아웃 완료');
            return true;
        } catch (error) {
            console.error('[GoogleDrive] 로그아웃 실패:', error);
            return false;
        }
    };
    
    // 파일 업로드 (Google Drive에 저장)
    const uploadToDrive = async (filename, content, mimeType = 'text/plain') => {
        if (!isAuthenticated) {
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
    
    // 파일 다운로드 (Google Drive에서 가져오기)
    const downloadFromDrive = async (filename) => {
        if (!isAuthenticated) {
            throw new Error('Google 계정 로그인이 필요합니다.');
        }
        
        try {
            const file = await findFile(filename);
            if (!file) {
                throw new Error('파일을 찾을 수 없습니다.');
            }
            
            const response = await gapi.client.drive.files.get({
                fileId: file.id,
                alt: 'media'
            });
            
            return response.body;
        } catch (error) {
            console.error('[GoogleDrive] 파일 다운로드 실패:', error);
            throw error;
        }
    };
    
    // 파일 검색
    const findFile = async (filename) => {
        try {
            const response = await gapi.client.drive.files.list({
                q: `name='${filename}' and trashed=false`,
                spaces: 'drive',
                fields: 'files(id, name, modifiedTime)'
            });
            
            return response.result.files[0] || null;
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
            
            const media = {
                mimeType: mimeType,
                body: content
            };
            
            const response = await gapi.client.drive.files.create({
                resource: fileMetadata,
                media: media,
                fields: 'id, name, modifiedTime'
            });
            
            console.log('[GoogleDrive] 파일 생성 완료:', response.result.name);
            return response.result;
        } catch (error) {
            console.error('[GoogleDrive] 파일 생성 실패:', error);
            throw error;
        }
    };
    
    // 기존 파일 업데이트
    const updateFile = async (fileId, content, mimeType) => {
        try {
            const media = {
                mimeType: mimeType,
                body: content
            };
            
            const response = await gapi.client.drive.files.update({
                fileId: fileId,
                media: media,
                fields: 'id, name, modifiedTime'
            });
            
            console.log('[GoogleDrive] 파일 업데이트 완료:', response.result.name);
            return response.result;
        } catch (error) {
            console.error('[GoogleDrive] 파일 업데이트 실패:', error);
            throw error;
        }
    };
    
    // 파일 목록 조회
    const listFiles = async () => {
        if (!isAuthenticated) {
            throw new Error('Google 계정 로그인이 필요합니다.');
        }
        
        try {
            const response = await gapi.client.drive.files.list({
                pageSize: 100,
                fields: 'files(id, name, modifiedTime, size)',
                orderBy: 'modifiedTime desc'
            });
            
            return response.result.files;
        } catch (error) {
            console.error('[GoogleDrive] 파일 목록 조회 실패:', error);
            throw error;
        }
    };
    
    // 자동 동기화 설정
    const setupAutoSync = (intervalMinutes = 5) => {
        if (!isAuthenticated) {
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
            const todos = todoManager.getTodos();
            const categories = todoManager.getCategories();
            const completedRepeatTodos = todoManager.getCompletedRepeatTodos();
            
            // 데이터를 JSON으로 변환
            const data = {
                todos,
                categories,
                completedRepeatTodos,
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
    
    return {
        initGoogleAPI,
        signIn,
        signOut,
        uploadToDrive,
        downloadFromDrive,
        listFiles,
        setupAutoSync,
        autoSync,
        getSyncStatus,
        isAuthenticated: () => isAuthenticated,
        getCurrentUser: () => currentUser
    };
})();

// 전역 객체에 할당
window.googleDriveSync = googleDriveSync;
```

### 2. HTML에 Google API 스크립트 추가

```html
<!-- index.html의 </body> 태그 앞에 추가 -->
<script src="https://apis.google.com/js/api.js"></script>
<script src="js/googleDriveSync.js"></script>
```

### 3. UI 컴포넌트 추가

```html
<!-- Google Drive 동기화 버튼 추가 -->
<div class="google-drive-sync-section">
    <button id="google-drive-login-btn" class="google-drive-btn" style="display: none;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
        </svg>
        Google Drive 로그인
    </button>
    
    <button id="google-drive-sync-btn" class="google-drive-btn" style="display: none;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 12a9 9 0 11-6.219-8.56"/>
            <path d="M3 12a9 9 0 016.219 8.56"/>
        </svg>
        동기화
    </button>
    
    <button id="google-drive-logout-btn" class="google-drive-btn" style="display: none;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
            <polyline points="16,17 21,12 16,7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
        로그아웃
    </button>
    
    <div id="google-drive-status" class="sync-status" style="display: none;">
        <span class="status-text">동기화 준비됨</span>
        <span class="last-sync-time"></span>
    </div>
</div>
```

### 4. CSS 스타일 추가

```css
/* style.css에 추가 */
.google-drive-sync-section {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 16px 0;
    padding: 16px;
    background: #f8f9fa;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
}

.google-drive-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 16px;
    background: #4285f4;
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
}

.google-drive-btn:hover {
    background: #3367d6;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(66, 133, 244, 0.3);
}

.google-drive-btn svg {
    width: 16px;
    height: 16px;
}

.sync-status {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 12px;
    color: #6b7280;
}

.status-text {
    font-weight: 500;
}

.last-sync-time {
    font-size: 11px;
    opacity: 0.8;
}

.sync-status.success .status-text {
    color: #10b981;
}

.sync-status.error .status-text {
    color: #ef4444;
}

.sync-status.syncing .status-text {
    color: #f59e0b;
    animation: pulse 1.5s infinite;
}

@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
}
```

### 5. 이벤트 리스너 및 초기화

```javascript
// app.js에 추가
const initGoogleDriveSync = async () => {
    try {
        // Google API 초기화
        const initialized = await googleDriveSync.initGoogleAPI();
        if (!initialized) {
            console.warn('[App] Google Drive API 초기화 실패');
            return;
        }
        
        // UI 상태 업데이트
        updateGoogleDriveUI();
        
        // 자동 동기화 설정 (5분 간격)
        if (googleDriveSync.isAuthenticated()) {
            googleDriveSync.setupAutoSync(5);
        }
        
        // 동기화 상태 변경 이벤트 리스너
        window.addEventListener('googleDriveSyncStatusChanged', (event) => {
            updateSyncStatusUI(event.detail);
        });
        
        console.log('[App] Google Drive 동기화 초기화 완료');
        
    } catch (error) {
        console.error('[App] Google Drive 동기화 초기화 실패:', error);
    }
};

const updateGoogleDriveUI = () => {
    const loginBtn = document.getElementById('google-drive-login-btn');
    const syncBtn = document.getElementById('google-drive-sync-btn');
    const logoutBtn = document.getElementById('google-drive-logout-btn');
    const statusDiv = document.getElementById('google-drive-status');
    
    if (googleDriveSync.isAuthenticated()) {
        loginBtn.style.display = 'none';
        syncBtn.style.display = 'inline-flex';
        logoutBtn.style.display = 'inline-flex';
        statusDiv.style.display = 'block';
        
        // 동기화 상태 표시
        const status = googleDriveSync.getSyncStatus();
        if (status) {
            updateSyncStatusUI(status);
        }
    } else {
        loginBtn.style.display = 'inline-flex';
        syncBtn.style.display = 'none';
        logoutBtn.style.display = 'none';
        statusDiv.style.display = 'none';
    }
};

const updateSyncStatusUI = (status) => {
    const statusDiv = document.getElementById('google-drive-status');
    const statusText = statusDiv.querySelector('.status-text');
    const lastSyncTime = statusDiv.querySelector('.last-sync-time');
    
    // 상태 클래스 제거
    statusDiv.classList.remove('success', 'error', 'syncing');
    
    if (status.success) {
        statusDiv.classList.add('success');
        statusText.textContent = '동기화 완료';
        lastSyncTime.textContent = `마지막 동기화: ${new Date(status.timestamp).toLocaleString('ko-KR')}`;
    } else {
        statusDiv.classList.add('error');
        statusText.textContent = `동기화 실패: ${status.errorMessage}`;
        lastSyncTime.textContent = `마지막 시도: ${new Date(status.timestamp).toLocaleString('ko-KR')}`;
    }
};

// 이벤트 리스너 추가
document.addEventListener('DOMContentLoaded', () => {
    const loginBtn = document.getElementById('google-drive-login-btn');
    const syncBtn = document.getElementById('google-drive-sync-btn');
    const logoutBtn = document.getElementById('google-drive-logout-btn');
    
    if (loginBtn) {
        loginBtn.addEventListener('click', async () => {
            try {
                const success = await googleDriveSync.signIn();
                if (success) {
                    updateGoogleDriveUI();
                    googleDriveSync.setupAutoSync(5);
                    alert('Google Drive 로그인 성공!');
                }
            } catch (error) {
                alert('Google Drive 로그인 실패: ' + error.message);
            }
        });
    }
    
    if (syncBtn) {
        syncBtn.addEventListener('click', async () => {
            try {
                syncBtn.disabled = true;
                syncBtn.innerHTML = '<svg>...</svg> 동기화 중...';
                
                await googleDriveSync.autoSync();
                alert('동기화 완료!');
                
            } catch (error) {
                alert('동기화 실패: ' + error.message);
            } finally {
                syncBtn.disabled = false;
                syncBtn.innerHTML = '<svg>...</svg> 동기화';
            }
        });
    }
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                await googleDriveSync.signOut();
                updateGoogleDriveUI();
                
                // 자동 동기화 타이머 제거
                if (window.autoSyncTimer) {
                    clearInterval(window.autoSyncTimer);
                    window.autoSyncTimer = null;
                }
                
                alert('Google Drive 로그아웃 완료!');
            } catch (error) {
                alert('로그아웃 실패: ' + error.message);
            }
        });
    }
});

// 초기화 함수 호출
setTimeout(() => {
    initGoogleDriveSync();
}, 1000);
```

## 🔒 보안 고려사항

### 1. API 키 보안

```javascript
// 환경별 설정 분리
const config = {
    development: {
        clientId: 'DEV_CLIENT_ID.apps.googleusercontent.com',
        apiKey: 'DEV_API_KEY'
    },
    production: {
        clientId: 'PROD_CLIENT_ID.apps.googleusercontent.com',
        apiKey: 'PROD_API_KEY'
    }
};

// 환경 감지
const isProduction = window.location.hostname !== 'localhost';
const currentConfig = config[isProduction ? 'production' : 'development'];
```

### 2. OAuth 스코프 최소화

```javascript
// 필요한 최소 권한만 요청
const SCOPES = [
    'https://www.googleapis.com/auth/drive.file',  // 사용자 파일만 접근
    'https://www.googleapis.com/auth/drive.metadata.readonly'  // 메타데이터 읽기
];
```

### 3. 사용자 데이터 보호

```javascript
// 민감한 정보 필터링
const sanitizeDataForSync = (data) => {
    const sanitized = { ...data };
    
    // API 키 등 민감 정보 제거
    if (sanitized.settings) {
        delete sanitized.settings.aiApiKey;
        delete sanitized.settings.apiKey;
    }
    
    return sanitized;
};
```

## 🚀 배포 및 테스트

### 1. 환경별 설정

```bash
# 개발 환경
npm run dev

# 프로덕션 빌드
npm run build

# 테스트
npm run test
```

### 2. 배포 전 체크리스트

- [ ] Google Cloud Console에서 프로덕션 OAuth 동의 화면 설정
- [ ] 도메인 추가 (OAuth 동의 화면)
- [ ] API 키 제한 설정 (도메인 제한)
- [ ] HTTPS 설정 확인
- [ ] CORS 설정 확인

### 3. 테스트 시나리오

```javascript
// 테스트용 함수
const testGoogleDriveSync = async () => {
    try {
        console.log('=== Google Drive 동기화 테스트 시작 ===');
        
        // 1. API 초기화 테스트
        const initialized = await googleDriveSync.initGoogleAPI();
        console.log('API 초기화:', initialized);
        
        // 2. 로그인 테스트
        const loginSuccess = await googleDriveSync.signIn();
        console.log('로그인:', loginSuccess);
        
        // 3. 파일 업로드 테스트
        const testData = { test: 'data', timestamp: new Date().toISOString() };
        const uploadResult = await googleDriveSync.uploadToDrive(
            'test_sync.json',
            JSON.stringify(testData),
            'application/json'
        );
        console.log('업로드 결과:', uploadResult);
        
        // 4. 파일 다운로드 테스트
        const downloadResult = await googleDriveSync.downloadFromDrive('test_sync.json');
        console.log('다운로드 결과:', downloadResult);
        
        // 5. 로그아웃 테스트
        const logoutSuccess = await googleDriveSync.signOut();
        console.log('로그아웃:', logoutSuccess);
        
        console.log('=== 테스트 완료 ===');
        
    } catch (error) {
        console.error('테스트 실패:', error);
    }
};

// 브라우저 콘솔에서 실행
// testGoogleDriveSync();
```

## 🛠️ 문제 해결

### 1. 일반적인 오류

#### CORS 오류
```javascript
// Google Drive API는 CORS를 지원하지만, 일부 브라우저에서 문제 발생 가능
// 해결책: Google Apps Script 사용 또는 프록시 서버 구축
```

#### 인증 오류
```javascript
// OAuth 동의 화면 설정 확인
// 도메인 추가 확인
// API 키 제한 설정 확인
```

#### 권한 오류
```javascript
// 필요한 스코프가 OAuth 동의 화면에 포함되어 있는지 확인
// 사용자가 권한을 거부했는지 확인
```

### 2. 디버깅 팁

```javascript
// 상세한 로깅 활성화
const DEBUG_MODE = true;

const log = (message, data = null) => {
    if (DEBUG_MODE) {
        console.log(`[GoogleDrive] ${message}`, data);
    }
};

// 네트워크 요청 모니터링
const monitorRequests = () => {
    if (DEBUG_MODE) {
        const originalFetch = window.fetch;
        window.fetch = function(...args) {
            console.log('[GoogleDrive] API 요청:', args);
            return originalFetch.apply(this, args);
        };
    }
};
```

### 3. 성능 최적화

```javascript
// 배치 처리로 여러 파일 동시 동기화
const batchSync = async (files) => {
    const promises = files.map(file => 
        googleDriveSync.uploadToDrive(file.name, file.content, file.mimeType)
    );
    
    return Promise.allSettled(promises);
};

// 압축을 통한 데이터 크기 최적화
const compressData = (data) => {
    const jsonString = JSON.stringify(data);
    // LZ-string 등 압축 라이브러리 사용
    return LZString.compress(jsonString);
};
```

## 📚 추가 리소스

### 1. 공식 문서
- [Google Drive API 문서](https://developers.google.com/drive/api)
- [Google Identity 문서](https://developers.google.com/identity)
- [OAuth 2.0 가이드](https://developers.google.com/identity/protocols/oauth2)

### 2. 유용한 라이브러리
- [Google API Client Library](https://github.com/google/google-api-javascript-client)
- [LZ-String](https://github.com/pieroxy/lz-string) - 데이터 압축
- [CryptoJS](https://github.com/brix/crypto-js) - 데이터 암호화

### 3. 커뮤니티 리소스
- [Stack Overflow - Google Drive API](https://stackoverflow.com/questions/tagged/google-drive-api)
- [Google Cloud Community](https://cloud.google.com/community)

## 🎉 결론

Google Drive 동기화를 정적 사이트에 구현하는 것은 복잡하지만 충분히 가능합니다. 

**주요 포인트:**
1. **보안 우선**: API 키와 OAuth 설정을 신중하게 관리
2. **사용자 경험**: 자동 동기화와 상태 표시로 편의성 제공
3. **에러 처리**: 네트워크 오류와 권한 문제에 대한 견고한 처리
4. **성능 최적화**: 배치 처리와 압축을 통한 효율성 향상

이 가이드를 따라 구현하면 사용자들이 자신의 Google Drive에서 할 일 데이터를 안전하게 동기화할 수 있는 강력한 기능을 제공할 수 있습니다.
