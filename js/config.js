// Google Drive API 설정
// ⚠️ 주의: 클라이언트 사이드 앱에서는 API 키가 브라우저에 노출됩니다
// 보안을 위해 Google Cloud Console에서 다음 제한을 설정하세요:
// 1. HTTP 리퍼러 제한 (도메인 제한)
// 2. API 제한 (Drive API만 허용)
// 3. OAuth 클라이언트 승인된 도메인 제한

window.GOOGLE_DRIVE_CONFIG = {
    apiKey: 'LOCAL_DEV_KEY',
    clientId: 'LOCAL_DEV_CLIENT_ID', 
    scope: 'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/drive.file',
    discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest']
};
