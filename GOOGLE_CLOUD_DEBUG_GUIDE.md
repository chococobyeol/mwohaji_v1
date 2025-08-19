# Google Drive 로그인 오류 해결 가이드

## 현재 문제 상황
- **오류**: `unregistered_origin` 및 `403 Forbidden`
- **Client ID**: `YOUR_CLIENT_ID.apps.googleusercontent.com`
- **로컬 개발 URL**: `http://localhost:8000`

## 1단계: Google Cloud Console 설정 재확인

### 1.1 OAuth 동의 화면 설정
1. [Google Cloud Console](https://console.cloud.google.com/) → "mwohaji" 프로젝트 선택
2. **API 및 서비스** → **OAuth 동의 화면**
3. 설정 확인:
   - **사용자 유형**: "외부" (이미 설정됨)
   - **게시 상태**: **"프로덕션으로 푸시"** (반드시 필요!)
   - **테스트 사용자**: 본인 Gmail 계정 추가

### 1.2 OAuth 클라이언트 ID 설정
1. **API 및 서비스** → **사용자 인증 정보**
2. 클라이언트 ID `YOUR_CLIENT_ID.apps.googleusercontent.com` 클릭
3. **승인된 JavaScript 원본** 확인:
   ```
   http://localhost:8000
   http://127.0.0.1:8000
   https://yourdomain.com
   ```
4. **승인된 리디렉션 URI** 확인:
   ```
   http://localhost:8000
   http://127.0.0.1:8000
   https://yourdomain.com
   ```

### 1.3 API 활성화 확인
1. **API 및 서비스** → **라이브러리**
2. 다음 API가 활성화되어 있는지 확인:
   - **Google Drive API** ✅
   - **Google People API** ✅

## 2단계: 문제가 지속되는 경우 - 새 OAuth 클라이언트 ID 생성

현재 클라이언트 ID에 문제가 있을 수 있으므로 새로 생성:

### 2.1 새 OAuth 클라이언트 ID 생성
1. **API 및 서비스** → **사용자 인증 정보**
2. **+ 사용자 인증 정보 만들기** → **OAuth 클라이언트 ID**
3. **애플리케이션 유형**: "웹 애플리케이션"
4. **이름**: "mwohaji-web-client-new"
5. **승인된 JavaScript 원본**:
   ```
   http://localhost:8000
   http://127.0.0.1:8000
   https://yourdomain.com
   ```
6. **승인된 리디렉션 URI**:
   ```
   http://localhost:8000
   http://127.0.0.1:8000
   https://yourdomain.com
   ```

### 2.2 새 클라이언트 ID로 코드 업데이트
새로 생성된 클라이언트 ID를 다음 파일들에 업데이트:
- `js/googleDriveSync.js` (2곳)
- `index.html` (1곳)

## 3단계: 브라우저 캐시 및 쿠키 정리

### 3.1 Chrome 개발자 도구
1. F12 → **애플리케이션** 탭
2. **저장소** → **로컬 저장소** → `localhost:8000` 삭제
3. **쿠키** → `localhost:8000` 모든 쿠키 삭제
4. **쿠키** → `.google.com` 관련 쿠키 삭제

### 3.2 하드 새로고침
- **Ctrl + Shift + R** (Windows)
- **Cmd + Shift + R** (Mac)

## 4단계: 네트워크 및 보안 설정 확인

### 4.1 로컬 서버 확인
현재 개발 서버가 정확히 `http://localhost:8000`에서 실행되고 있는지 확인

### 4.2 방화벽/안티바이러스 확인
- Windows Defender 또는 안티바이러스 소프트웨어가 OAuth 요청을 차단하지 않는지 확인
- 회사 네트워크인 경우 프록시 설정 확인

## 5단계: Google Identity Services 문제 해결

### 5.1 대체 인증 방법 사용
현재 코드에 이미 구현된 fallback OAuth 2.0 흐름 활용

### 5.2 Google One Tap 비활성화
필요시 Google One Tap을 완전히 비활성화하고 표준 OAuth 2.0만 사용

## 6단계: 최신 로그 확인

브라우저 콘솔에서 다음 정보 확인:
- 현재 Origin 정보
- Client ID 정확성
- Google Identity Services 로드 상태

## 긴급 해결책

위 모든 방법이 실패하는 경우:

### 방법 1: 다른 포트 사용
```bash
# 포트 3000으로 변경
python -m http.server 3000
```
그리고 OAuth 설정에 `http://localhost:3000` 추가

### 방법 2: 다른 브라우저 테스트
- Chrome → Edge/Firefox로 변경하여 테스트
- 시크릿 모드에서 테스트

### 방법 3: 프로젝트 재생성
새로운 Google Cloud 프로젝트를 생성하여 처음부터 설정

## 주의사항

1. **설정 변경 후 5-10분 대기**: Google의 설정 변경사항이 전파되는 데 시간이 걸릴 수 있음
2. **정확한 URL 사용**: `http://localhost:8000`과 `http://127.0.0.1:8000`는 다른 origin임
3. **대소문자 구분**: 모든 URL은 정확히 일치해야 함
4. **포트 번호 확인**: 실제 실행 중인 포트와 OAuth 설정이 일치해야 함

## 현재 해결된 문제

✅ `callback is not a function` 오류 해결
✅ `handleCredentialResponse` 전역 함수 노출 완료
✅ Google Identity Services 초기화 최적화

## 다음 해결할 문제

🔄 `unregistered_origin` 오류 (현재 진행 중)
⏳ 동기화 버튼 표시 확인
⏳ 로그인 후 팝업 창 처리 개선
