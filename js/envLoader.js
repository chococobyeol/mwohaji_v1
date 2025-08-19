// 환경변수 로더
const envLoader = (() => {
    let envVars = {};
    
    // .env 파일 읽기 (fetch로 텍스트 파일 읽기)
    const loadEnvFile = async () => {
        try {
            const response = await fetch('/.env');
            if (response.ok) {
                const envContent = await response.text();
                parseEnvContent(envContent);
                console.log('[EnvLoader] .env 파일 로드 완료');
            } else {
                console.warn('[EnvLoader] .env 파일을 찾을 수 없습니다. 기본값을 사용합니다.');
                setDefaultValues();
            }
        } catch (error) {
            console.warn('[EnvLoader] .env 파일 로드 실패:', error);
            setDefaultValues();
        }
    };
    
    // .env 파일 내용 파싱
    const parseEnvContent = (content) => {
        const lines = content.split('\n');
        lines.forEach(line => {
            line = line.trim();
            if (line && !line.startsWith('#')) {
                const [key, value] = line.split('=');
                if (key && value) {
                    envVars[key.trim()] = value.trim();
                }
            }
        });
    };
    
    // 기본값 설정 (보안상 빈 값으로 설정)
    const setDefaultValues = () => {
        envVars = {
            GOOGLE_CLIENT_ID: '',
            GOOGLE_API_KEY: '',
            GOOGLE_CLIENT_SECRET: ''
        };
        console.warn('[EnvLoader] .env 파일을 찾을 수 없어 기본값을 사용합니다. 환경변수를 설정해주세요.');
    };
    
    // 환경변수 값 가져오기
    const getEnv = (key) => {
        return envVars[key] || null;
    };
    
    // 전역 환경변수 설정
    const setGlobalEnv = () => {
        window.ENV_GOOGLE_CLIENT_ID = getEnv('GOOGLE_CLIENT_ID');
        window.ENV_GOOGLE_API_KEY = getEnv('GOOGLE_API_KEY');
        window.ENV_GOOGLE_CLIENT_SECRET = getEnv('GOOGLE_CLIENT_SECRET');
        
        console.log('[EnvLoader] 전역 환경변수 설정 완료:', {
            CLIENT_ID: window.ENV_GOOGLE_CLIENT_ID,
            API_KEY: window.ENV_GOOGLE_API_KEY,
            CLIENT_SECRET: window.ENV_GOOGLE_CLIENT_SECRET ? '***' : 'undefined'
        });
        
        // 환경변수 로딩 완료 이벤트 발생
        window.dispatchEvent(new CustomEvent('envLoaded', { 
            detail: { 
                clientId: window.ENV_GOOGLE_CLIENT_ID,
                apiKey: window.ENV_GOOGLE_API_KEY 
            } 
        }));
    };
    
    // 초기화
    const init = async () => {
        await loadEnvFile();
        setGlobalEnv();
    };
    
    return {
        init,
        getEnv,
        setGlobalEnv
    };
})();

// 전역 객체에 할당
window.envLoader = envLoader;
