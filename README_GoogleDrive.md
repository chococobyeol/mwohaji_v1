# Google Drive 동기화 기능 사용법

## 📋 개요

Mwohaji 앱에 Google Drive 동기화 기능이 추가되었습니다. 이 기능을 사용하면 할 일 데이터를 Google Drive에 백업하고 여러 기기에서 동기화할 수 있습니다.

## 🚀 설정 방법

### 1. Google Cloud Console 설정

1. [Google Cloud Console](https://console.cloud.google.com/)에 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. Google Drive API 활성화
4. OAuth 2.0 클라이언트 ID 생성
5. API 키 생성

### 2. OAuth 동의 화면 설정

- **사용자 유형**: "외부" 선택
- **앱 이름**: "Mwohaji Todo App"
- **승인된 JavaScript 원본**: `https://yourdomain.com`
- **승인된 리디렉션 URI**: `https://yourdomain.com`

### 3. 앱 설정

`js/config.js` 파일을 열고 다음 값들을 설정하세요:

```javascript
const GOOGLE_CONFIG = {
    clientId: 'YOUR_CLIENT_ID.apps.googleusercontent.com',  // OAuth 클라이언트 ID
    apiKey: 'YOUR_API_KEY',                                // API 키
    scope: 'https://www.googleapis.com/auth/drive.file',
    discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest']
};
```

## 💻 사용 방법

### 1. 로그인

1. 설정 버튼 클릭 (우측 상단)
2. 설정 사이드바에서 "Google Drive 동기화" 섹션 확인
3. "Google Drive 로그인" 버튼 클릭
4. Google 계정으로 로그인 및 권한 승인

### 2. 동기화

- **수동 동기화**: "동기화" 버튼 클릭
- **자동 동기화**: "자동 동기화 (5분 간격)" 체크박스 활성화

### 3. 로그아웃

"로그아웃" 버튼을 클릭하여 Google 계정 연결 해제

## 🔒 보안 및 권한

- **최소 권한**: 사용자의 Google Drive 파일만 접근
- **데이터 보호**: 민감한 정보는 동기화하지 않음
- **로컬 저장**: API 키는 클라이언트에만 저장

## ⚠️ 주의사항

1. **API 키 보안**: `config.js` 파일을 공개 저장소에 업로드하지 마세요
2. **도메인 제한**: OAuth 동의 화면에 실제 도메인을 등록해야 합니다
3. **HTTPS 필수**: 프로덕션 환경에서는 HTTPS가 필요합니다

## 🛠️ 문제 해결

### 로그인 실패
- OAuth 동의 화면 설정 확인
- 도메인 등록 확인
- API 키 제한 설정 확인

### 동기화 실패
- Google Drive 권한 확인
- 네트워크 연결 상태 확인
- 브라우저 콘솔에서 오류 메시지 확인

## 📱 호환성

- **브라우저**: Chrome, Firefox, Safari, Edge (최신 버전)
- **모바일**: 반응형 디자인으로 모바일에서도 사용 가능
- **오프라인**: 로그인하지 않아도 기존 기능은 정상 사용 가능

## 🔄 동기화 데이터

동기화되는 데이터:
- 할 일 목록
- 카테고리 정보
- 완료 상태
- 생성/수정 시간

동기화되지 않는 데이터:
- 사용자 설정
- API 키
- 기타 민감 정보

## 📞 지원

문제가 발생하거나 질문이 있으시면:
1. 브라우저 콘솔의 오류 메시지 확인
2. Google Cloud Console 설정 재확인
3. 네트워크 연결 상태 확인

---

**참고**: 이 기능은 정적 사이트 호스팅 환경에서 완벽하게 작동합니다. 추가 서버가 필요하지 않습니다.
