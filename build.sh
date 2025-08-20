#!/bin/bash

# Render.com 배포용 빌드 스크립트
# 환경변수를 config.js 파일에 주입

echo "🔧 환경변수를 config.js에 주입 중..."

# config.js 파일 생성
cat > js/config.js << EOF
// Google Drive API 설정 (자동 생성됨)
window.GOOGLE_DRIVE_CONFIG = {
    apiKey: '${GOOGLE_API_KEY}',
    clientId: '${GOOGLE_CLIENT_ID}',
    scope: 'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/drive.file',
    discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest']
};
EOF

echo "✅ config.js 생성 완료"
echo "📁 파일 내용:"
cat js/config.js

echo "🚀 빌드 완료!"
