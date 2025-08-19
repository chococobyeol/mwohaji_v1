# 🌍 Google Drive API 설정 가이드

## 📋 개요

Mwohaji 앱의 Google Drive 동기화 기능을 사용하기 위해 Google Cloud Console에서 API 키를 설정해야 합니다.

## 🚀 설정 방법

### **1단계: Google Cloud Console 설정**

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. **Google Drive API** 활성화
4. **OAuth 2.0 클라이언트 ID** 생성
5. **API 키** 생성

### **2단계: OAuth 동의 화면 설정**

- **사용자 유형**: "외부" 선택
- **앱 이름**: "Mwohaji Todo App"
- **승인된 JavaScript 원본**: 
  - 개발용: `http://localhost:3000`, `http://127.0.0.1:3000`
  - 프로덕션용: `https://yourdomain.com`
- **승인된 리디렉션 URI**: 
  - 개발용: `http://localhost:3000`, `http://127.0.0.1:3000`
  - 프로덕션용: `https://yourdomain.com`

### **3단계: 환경변수 설정**

#### **방법 1: .env 파일 사용 (로컬 개발용)**

프로젝트 루트에 `.env` 파일 생성:

```bash
# Google Drive API 설정
GOOGLE_CLIENT_ID=YOUR_CLIENT_ID.apps.googleusercontent.com
GOOGLE_API_KEY=YOUR_API_KEY_HERE
GOOGLE_SCOPE=https://www.googleapis.com/auth/drive.file
GOOGLE_DISCOVERY_DOCS=https://www.googleapis.com/discovery/v1/apis/drive/v3/rest
```

**주의사항**: 
- `.env` 파일은 Git에 커밋하지 마세요 (보안상 위험)
- `.gitignore`에 `.env`가 포함되어 있습니다

#### **방법 2: 호스팅 서비스 환경변수 (프로덕션용)**

**Netlify/Vercel:**
```bash
GOOGLE_CLIENT_ID=YOUR_CLIENT_ID.apps.googleusercontent.com
GOOGLE_API_KEY=YOUR_API_KEY_HERE
GOOGLE_SCOPE=https://www.googleapis.com/auth/drive.file
GOOGLE_DISCOVERY_DOCS=https://www.googleapis.com/discovery/v1/apis/drive/v3/rest
```

## 🔒 보안 주의사항

### **개발 환경**
- `.env` 파일에 API 키 입력
- 이 파일을 Git에 커밋하지 마세요
- `.gitignore`에 `.env`가 이미 포함되어 있습니다

### **프로덕션 환경**
- 환경변수는 서버/호스팅 서비스에서 관리
- `.env` 파일을 공개 저장소에 업로드하지 마세요
- API 키 제한 설정 (도메인, IP 등)

## 🛠️ 문제 해결

### **Google Drive 로그인 실패**
- Client ID와 API Key가 올바른지 확인
- OAuth 동의 화면 설정 확인
- 도메인 등록 확인
- **중요**: 설정 후 페이지 새로고침 필수

### **API 키 오류**
- Google Cloud Console에서 API 키가 활성화되었는지 확인
- API 키 제한 설정 확인
- Google Drive API가 활성화되었는지 확인

### **OAuth 오류**
- 승인된 JavaScript 원본과 리디렉션 URI가 정확한지 확인
- 개발용: `http://localhost:3000` 또는 `http://127.0.0.1:3000`
- 프로덕션용: 실제 도메인 URL

## 📁 파일 구조

```
mwohaji/
├── .env                    # 환경변수 설정 (Git에 커밋하지 않음)
├── .gitignore             # .env 파일 제외
├── env.example            # 환경변수 예시
├── js/
│   └── googleDriveSync.js # Google Drive 동기화
└── ENVIRONMENT_SETUP.md   # 이 가이드
```

## 💡 **빠른 설정 (개발용)**

1. Google Cloud Console에서 OAuth 2.0 클라이언트 ID와 API 키 생성
2. 프로젝트 루트에 `.env` 파일 생성
3. `env.example`을 참고하여 실제 값 입력:
   - `GOOGLE_CLIENT_ID=실제_클라이언트_ID`
   - `GOOGLE_API_KEY=실제_API_키`
4. 파일 저장
5. 브라우저에서 페이지 새로고침
6. 설정 사이드바에서 **Google Drive 로그인** 시도

## 📞 지원

문제가 발생하거나 질문이 있으시면:
1. 브라우저 콘솔의 오류 메시지 확인
2. `.env` 파일의 설정값 확인
3. Google Cloud Console 설정 재확인
4. **페이지 새로고침** 시도

---

**참고**: 이 시스템은 정적 사이트 호스팅 환경에서 완벽하게 작동합니다.
