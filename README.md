# Mwohaji (뭐하지...)

개인정보 보호를 중시하는 클라이언트 사이드 할 일 관리 웹 애플리케이션

## 주요 특징

- **개인정보 보호**: 모든 데이터는 브라우저 로컬에만 저장
- **마크다운 지원**: 할 일 내용에 마크다운 문법 사용 가능
- **AI 채팅**: 자연어로 할 일 관리 (Gemini API)
- **스마트 알림**: 시작/마감 시간 설정 및 반복 알림
- **반응형 디자인**: 모바일 친화적 UI
- **빠른 성능**: 경량화된 번들 크기
- **데이터 백업**: .txt 파일로 내보내기/가져오기
- **클라우드 동기화**: Google Drive 백업 (Beta)

## 데모

**라이브 데모**: [https://mwohaji.onrender.com](https://mwohaji.onrender.com)

## 기능 목록

### 기본 할 일 관리
- 할 일 생성, 수정, 삭제, 완료 처리
- 카테고리별 분류 및 관리
- 반복 일정 설정 (일간/주간/월간)
- 일정 설정 (시작/마감 시간)
- 인앱 알림 및 백그라운드 알림

### 고급 기능
- **마크다운 지원**: 제목, 굵은 텍스트, 목록, 링크, 이미지 등
- **AI 채팅**: 자연어로 할 일 생성 및 관리
- **타이머/스톱워치**: 시간 관리 도구
- **데이터 백업**: .txt 파일 형식으로 백업/복원
- **Google Drive 연동**: 클라우드 백업 (Beta)

### 사용자 경험
- 반응형 디자인 (모바일/데스크톱)
- 미니멀 블랙&화이트 테마
- 접근성 지원 (WCAG 2.1 AA)
- 빠른 반응성
- 보안 강화 (XSS 방지)

## 기술 스택

### 프론트엔드
- **JavaScript**: Vanilla JS (ES2016+)
- **HTML5**: 시맨틱 마크업
- **CSS3**: Flexbox, Grid, 반응형 디자인
- **마크다운**: marked.js 라이브러리

### 백엔드 & 저장소
- **데이터 저장**: Web Storage API (localStorage)
- **파일 처리**: File API, Blob API
- **알림**: Service Worker, Notification API

### 외부 서비스
- **AI**: Google Gemini API
- **클라우드**: Google Drive API
- **호스팅**: Render.com

## 설치 및 실행

### 1. 저장소 클론
```bash
git clone https://github.com/chococobyeol/mwohaji_v1.git
cd mwohaji
```

### 2. 로컬 실행
```bash
# Python 3.x 사용
python -m http.server 8000

# 또는 Node.js 사용
npx serve .

# 또는 PHP 사용
php -S localhost:8000
```

### 3. 브라우저에서 접속
```
http://localhost:8000
```

## 설정

### AI 채팅 기능 설정
1. [Google AI Studio](https://makersuite.google.com/app/apikey)에서 API 키 발급
2. 앱에서 설정 → AI 기능 활성화
3. API 키 입력

### Google Drive 백업 설정
1. Google Cloud Console에서 프로젝트 생성
2. Google Drive API 활성화
3. OAuth 2.0 클라이언트 ID 생성
4. 환경변수 설정:
   ```bash
   GOOGLE_API_KEY=your_api_key
   GOOGLE_CLIENT_ID=your_client_id
   ```

## 사용법

### 기본 사용법
1. **할 일 추가**: 상단 입력창에 내용 입력 후 Enter
2. **카테고리 선택**: 입력창 아래 카테고리 버튼 클릭
3. **완료 처리**: 체크박스 클릭
4. **일정 설정**: 할 일 옆 달력 아이콘 클릭

### 마크다운 사용법
```markdown
# 제목
**굵은 텍스트**
*기울임 텍스트*
- 목록 항목
[링크](https://example.com)
![이미지](url){width=300 height=200}
```

### AI 채팅 사용법
```
"오늘 3시에 회의 준비 알림 설정"
"새 카테고리 만들기: 건강관리"
"업무 카테고리에 보고서 작성 추가"
```

## 프로젝트 구조

```
mwohaji/
├── index.html              # 메인 HTML
├── css/
│   └── style.css           # 스타일시트
├── js/
│   ├── app.js              # 메인 애플리케이션 (5,000+ 라인)
│   ├── storage.js          # localStorage 관리
│   ├── todoManager.js      # 할 일 CRUD 로직
│   ├── notificationScheduler.js  # 알림 스케줄링
│   ├── geminiApi.js        # AI API 연동
│   ├── aiChat.js           # AI 채팅 기능
│   ├── timer.js            # 타이머/스톱워치
│   ├── fileHandler.js      # 파일 입출력
│   ├── security.js         # XSS 방지
│   ├── icons.js            # SVG 아이콘 시스템
│   ├── utils.js            # 유틸리티 함수
│   └── serviceWorkerManager.js  # Service Worker 관리
├── sw.js                   # Service Worker
├── help.html               # 도움말 페이지
├── privacy-policy.html     # 개인정보처리방침
├── robots.txt              # 검색엔진 설정
├── sitemap.xml             # 사이트맵
├── build.sh                # 배포 스크립트
├── PRD.md                  # 제품 요구 명세서
└── README.md               # 프로젝트 문서
```

## 보안

### 개인정보 보호
- 모든 데이터는 브라우저 로컬에만 저장
- 서버로 개인정보 전송하지 않음
- HTTPS 프로토콜 사용
- XSS 공격 방지 (HTML 새니타이저 적용)

### 데이터 백업
- .txt 파일 형식으로 로컬 백업
- Google Drive 연동 시 구글 정책 준수
- API 키는 사용자 로컬에만 저장

## 브라우저 지원

- Chrome 90+
- Firefox 90+
- Safari 14+
- Edge 90+



## 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 문의

- **이메일**: chococobyeol@gmail.com
- **라이브 데모**: [https://mwohaji.onrender.com](https://mwohaji.onrender.com)
- **도움말**: [https://mwohaji.onrender.com/help.html](https://mwohaji.onrender.com/help.html)

## 감사의 말

- [marked.js](https://marked.js.org/) - 마크다운 파싱
- HTML 새니타이저 - XSS 방지
- [Google Gemini API](https://ai.google.dev/) - AI 기능
- [Render.com](https://render.com/) - 호스팅 서비스

---

**Mwohaji** - 뭐하지... 할 일 관리 앱
