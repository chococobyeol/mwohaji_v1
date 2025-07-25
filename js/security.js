const security = (() => {
    // XSS 방지를 위한 HTML 이스케이프 함수
    const escapeHtml = (text) => {
        if (typeof text !== 'string') return text;
        
        const htmlEscapeMap = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#x27;',
            '/': '&#x2F;',
            '`': '&#x60;',
            '=': '&#x3D;'
        };
        
        return text.replace(/[&<>"'`=\/]/g, (char) => htmlEscapeMap[char]);
    };

    // HTML 디코딩 함수
    const unescapeHtml = (text) => {
        if (typeof text !== 'string') return text;
        
        const htmlUnescapeMap = {
            '&amp;': '&',
            '&lt;': '<',
            '&gt;': '>',
            '&quot;': '"',
            '&#x27;': "'",
            '&#x2F;': '/',
            '&#x60;': '`',
            '&#x3D;': '='
        };
        
        return text.replace(/&(?:amp|lt|gt|quot|#x27|#x2F|#x60|#x3D);/g, (entity) => htmlUnescapeMap[entity]);
    };

    // 위험한 스크립트 태그 제거
    const stripScripts = (text) => {
        if (typeof text !== 'string') return text;
        return text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    };

    // 기본적인 HTML 태그만 허용하는 새니타이저
    const sanitizeHtml = (html) => {
        if (typeof html !== 'string') return html;
        
        // 허용된 태그들 (마크다운 지원을 위해 확장)
        const allowedTags = [
            'b', 'i', 'em', 'strong', 'span', 'br', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
            'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'a', 'hr', 'del', 'ins', 'mark', 'img'
        ];
        const allowedAttributes = ['class', 'href', 'title', 'src', 'alt', 'style'];
        
        // 모든 스크립트 제거
        let sanitized = stripScripts(html);
        
        // 허용되지 않은 태그 제거
        sanitized = sanitized.replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)[^>]*>/g, (match, tagName) => {
            if (allowedTags.includes(tagName.toLowerCase())) {
                // 허용된 태그는 속성을 정리하여 반환
                return match.replace(/\s+(on\w+|javascript:|data:)[^=]*=["'][^"']*["']/gi, '');
            }
            return ''; // 허용되지 않은 태그는 제거
        });
        
        // href 속성의 URL 검증
        sanitized = sanitized.replace(/href=["']([^"']*)["']/gi, (match, url) => {
            if (isValidUrl(url)) {
                return `href="${escapeHtml(url)}"`;
            } else {
                return 'href="#"';
            }
        });
        
        // src 속성의 URL 검증 (이미지용)
        sanitized = sanitized.replace(/src=["']([^"']*)["']/gi, (match, url) => {
            if (isValidUrl(url)) {
                return `src="${escapeHtml(url)}"`;
            } else {
                return 'src=""';
            }
        });
        
        return sanitized;
    };

    // 안전한 텍스트 노드 생성
    const createSafeTextNode = (text) => {
        return document.createTextNode(escapeHtml(text));
    };

    // 안전한 innerHTML 설정
    const safeInnerHTML = (element, html) => {
        if (!element) return;
        element.innerHTML = sanitizeHtml(html);
    };

    // 안전한 텍스트 설정
    const safeTextContent = (element, text) => {
        if (!element) return;
        element.textContent = escapeHtml(text);
    };

    // URL 검증 함수
    const isValidUrl = (url) => {
        try {
            const urlObj = new URL(url);
            // HTTP, HTTPS만 허용
            return ['http:', 'https:'].includes(urlObj.protocol);
        } catch (e) {
            return false;
        }
    };

    // 안전한 속성 설정
    const safeSetAttribute = (element, attribute, value) => {
        if (!element) return;
        
        // 위험한 속성들 차단
        const dangerousAttributes = [
            'onclick', 'onmouseover', 'onload', 'onerror', 'onmouseout',
            'onfocus', 'onblur', 'onchange', 'onsubmit', 'onkeydown',
            'onkeyup', 'onkeypress', 'onmousedown', 'onmouseup'
        ];
        
        if (dangerousAttributes.includes(attribute.toLowerCase())) {
            console.warn(`Attempted to set dangerous attribute: ${attribute}`);
            return;
        }
        
        // href 속성의 경우 URL 검증
        if (attribute.toLowerCase() === 'href') {
            if (!isValidUrl(value)) {
                console.warn(`Invalid URL for href: ${value}`);
                return;
            }
        }
        
        element.setAttribute(attribute, escapeHtml(value));
    };

    // CSP 헤더 검증 (개발용)
    const checkCSP = () => {
        try {
            // CSP 위반 시도를 통한 CSP 정책 확인
            eval('1+1'); // CSP가 제대로 설정되어 있다면 이 코드는 실행되지 않음
            console.warn('CSP가 설정되지 않았거나 eval을 허용하고 있습니다.');
        } catch (e) {
            console.log('CSP가 적절히 설정되어 있습니다.');
        }
    };

    // 입력 데이터 검증
    const validateInput = (input, type = 'text', maxLength = 1000) => {
        if (typeof input !== 'string') return false;
        if (input.length > maxLength) return false;
        
        switch (type) {
            case 'email':
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                return emailRegex.test(input);
            case 'url':
                return isValidUrl(input);
            case 'alphanumeric':
                return /^[a-zA-Z0-9]+$/.test(input);
            case 'text':
            default:
                // 기본적으로 위험한 문자들만 체크
                return !/<script|javascript:|data:|vbscript:|on\w+=/i.test(input);
        }
    };

    // 파일 확장자 검증
    const validateFileExtension = (filename, allowedExtensions = ['.txt']) => {
        if (typeof filename !== 'string') return false;
        const extension = filename.toLowerCase().slice(filename.lastIndexOf('.'));
        return allowedExtensions.map(ext => ext.toLowerCase()).includes(extension);
    };

    return {
        escapeHtml,
        unescapeHtml,
        stripScripts,
        sanitizeHtml,
        createSafeTextNode,
        safeInnerHTML,
        safeTextContent,
        isValidUrl,
        safeSetAttribute,
        checkCSP,
        validateInput,
        validateFileExtension
    };
})();
