// Content script for Simple Dark Mode & Reader
// This script runs in the context of web pages
// 页面加载时自动恢复所有功能状态，页面切换时重新应用

(function() {
    'use strict';
    
    // Prevent multiple injections
    if (window.simpleDarkModeReaderInjected) return;
    window.simpleDarkModeReaderInjected = true;
    
    // 存储已应用的样式ID，避免重复注入
    const appliedStyles = new Set();
    
    // 存储当前设置，用于快速访问
    let currentSettings = {};
    
    // 初始化函数 - 页面加载后自动恢复所有功能
    function initialize() {
        // 读取所有保存的设置
        const allSettings = [
            'darkMode', 'readerMode', 'fontSize', 'lineHeight', 'wordSpacing',
            'forceCopy', 'videoEnhance', 'smoothScroll', 'enhancedDark', 'darkModeLevel',
            'removeTracking', 'hideCookie', 'blockMediaPermission', 'antiFingerprint',
            'eyeCare', 'autoScroll', 'videoSpeed', 'skipAds', 'preventPause',
            'blockPopups', 'blockRefresh', 'blockGif', 'cleanPage', 'userAgent'
        ];
        
        chrome.storage.local.get(allSettings, (result) => {
            console.log('Simple Dark Mode & Reader: 恢复功能状态', result);
            currentSettings = result;
            
            // 立即应用所有功能
            applyAllSettings(result);
        });
    }
    
    // 应用所有设置
    function applyAllSettings(settings) {
        // 1. 深色模式（优先执行）
        if (settings.darkMode) {
            applyDarkMode(settings.darkModeLevel || 'standard');
        } else {
            removeStyle('simple-dark-mode');
        }
        
        // 2. 深色增强
        if (settings.enhancedDark) {
            applyEnhancedDark();
        } else {
            removeStyle('simple-enhanced-dark');
        }
        
        // 3. 护眼黄底
        if (settings.eyeCare) {
            applyEyeCare();
        } else {
            removeStyle('simple-eye-care');
        }
        
        // 4. 阅读模式
        if (settings.readerMode) {
            applyReaderMode();
        } else {
            removeStyle('simple-reader-mode');
        }
        
        // 5. 文本样式（字体、行距、间距）
        if (settings.fontSize || settings.lineHeight || settings.wordSpacing) {
            applyTextStyle(settings.fontSize, settings.lineHeight, settings.wordSpacing);
        } else {
            removeStyle('simple-text-style');
        }
        
        // 6. 强制复制
        if (settings.forceCopy) {
            applyForceCopy();
        } else {
            removeStyle('simple-force-copy');
        }
        
        // 7. 平滑滚动
        if (settings.smoothScroll) {
            applySmoothScroll();
        } else {
            document.documentElement.style.scrollBehavior = 'auto';
        }
        
        // 8. 自动滚屏
        if (settings.autoScroll) {
            applyAutoScroll();
        } else if (window.simpleAutoScrollInterval) {
            clearInterval(window.simpleAutoScrollInterval);
            window.simpleAutoScrollInterval = null;
        }
        
        // 9. 视频增强
        if (settings.videoEnhance) {
            applyVideoEnhance();
        }
        
        // 10. 视频倍速
        if (settings.videoSpeed && settings.videoSpeed !== 1.0) {
            applyVideoSpeed(settings.videoSpeed);
        }
        
        // 11. 跳过广告
        if (settings.skipAds) {
            applySkipAds();
        }
        
        // 12. 禁止自动暂停
        if (settings.preventPause) {
            applyPreventPause();
        }
        
        // 13. 清除跟踪参数
        if (settings.removeTracking) {
            removeTrackingParams();
        }
        
        // 14. 隐藏Cookie提示
        if (settings.hideCookie) {
            applyHideCookie();
        } else {
            removeStyle('simple-hide-cookie');
        }
        
        // 15. 禁止媒体权限
        if (settings.blockMediaPermission) {
            applyBlockMediaPermission();
        }
        
        // 16. 防指纹追踪
        if (settings.antiFingerprint) {
            applyAntiFingerprint();
        }
        
        // 17. 页面净化
        if (settings.cleanPage) {
            applyCleanPage();
        } else {
            removeStyle('simple-clean-page');
        }
        
        // 18. 屏蔽弹窗
        if (settings.blockPopups) {
            applyBlockPopups();
        }
        
        // 19. 禁止自动刷新
        if (settings.blockRefresh) {
            applyBlockRefresh();
        }
        
        // 20. 关闭GIF动画
        if (settings.blockGif) {
            applyBlockGif();
        } else {
            removeStyle('simple-block-gif');
        }
        
        // 21. 切换UA
        if (settings.userAgent && settings.userAgent !== 'default') {
            applyUserAgent(settings.userAgent);
        }
    }
    
    // ==================== 功能实现函数 ====================
    
    // 注入或更新样式
    function injectStyle(id, css) {
        if (appliedStyles.has(id)) {
            // 已存在则更新
            const existing = document.getElementById(id);
            if (existing) {
                existing.textContent = css;
                return;
            }
        }
        
        // 创建新样式
        const style = document.createElement('style');
        style.id = id;
        style.textContent = css;
        document.head.appendChild(style);
        appliedStyles.add(id);
    }
    
    // 移除样式
    function removeStyle(id) {
        const style = document.getElementById(id);
        if (style) {
            style.remove();
            appliedStyles.delete(id);
        }
    }
    
    // 1. 深色模式
    function applyDarkMode(level = 'standard') {
        let colors;
        switch (level) {
            case 'pure-black':
                colors = { bg: '#000000', surface: '#121212', text: '#e0e0e0', border: '#333' };
                break;
            case 'soft':
                colors = { bg: '#2d2d2d', surface: '#3d3d3d', text: '#f5f5f5', border: '#4d4d4d' };
                break;
            default:
                colors = { bg: '#1a1a1a', surface: '#2d2d2d', text: '#e0e0e0', border: '#333' };
        }
        
        const css = `
            html, body { 
                background: ${colors.bg} !important; 
                color: ${colors.text} !important; 
            }
            * { 
                background-color: ${colors.surface} !important; 
                color: ${colors.text} !important; 
                border-color: ${colors.border} !important; 
            }
            a { color: #90caf9 !important; }
            a:hover { color: #64b5f6 !important; }
            img, video, iframe { 
                background: transparent !important; 
                opacity: 0.9 !important;
            }
            input, textarea, select, button {
                background-color: ${colors.surface} !important;
                color: ${colors.text} !important;
                border: 1px solid ${colors.border} !important;
            }
            ::-webkit-scrollbar {
                width: 8px !important;
                height: 8px !important;
            }
            ::-webkit-scrollbar-track {
                background: ${colors.bg} !important;
            }
            ::-webkit-scrollbar-thumb {
                background: ${colors.border} !important;
                border-radius: 4px !important;
            }
        `;
        
        injectStyle('simple-dark-mode', css);
    }
    
    // 2. 深色增强
    function applyEnhancedDark() {
        const css = `
            body { 
                filter: brightness(0.9) contrast(1.1) !important; 
            }
            img, video { 
                filter: brightness(0.85) !important; 
            }
        `;
        injectStyle('simple-enhanced-dark', css);
    }
    
    // 3. 护眼黄底
    function applyEyeCare() {
        const css = `
            html, body { 
                background: #f5f0e1 !important; 
            }
            * { 
                background-color: #f5f0e1 !important; 
                color: #5c4b37 !important; 
            }
            a { color: #8b6914 !important; }
            a:hover { color: #6b4e0a !important; }
            img, video { background: transparent !important; }
        `;
        injectStyle('simple-eye-care', css);
    }
    
    // 4. 阅读模式
    function applyReaderMode() {
        const css = `
            .ad, .ads, .advertisement, .banner, 
            .sidebar, .widget, .social, .share, 
            .comment, .related, .promotion, 
            .popup, .modal, .overlay, .dialog,
            .cookie-banner, .consent-banner, .gdpr-banner,
            .newsletter, .subscribe, .mailchimp,
            .float-btn, .floating-button, .back-to-top {
                display: none !important;
                visibility: hidden !important;
                opacity: 0 !important;
            }
            .content, article, .article, .post, 
            .entry-content, .main-content, main {
                max-width: 800px !important;
                margin: 0 auto !important;
                padding: 20px !important;
            }
        `;
        injectStyle('simple-reader-mode', css);
    }
    
    // 5. 文本样式
    function applyTextStyle(fontSize, lineHeight, wordSpacing) {
        const fs = fontSize || 16;
        const lh = lineHeight || 1.6;
        const ws = wordSpacing || 0;
        
        const css = `
            body { 
                font-size: ${fs}px !important; 
                line-height: ${lh} !important; 
                word-spacing: ${ws}px !important;
            }
            p, div, span, li, td, th {
                font-size: ${fs}px !important;
                line-height: ${lh} !important;
            }
            h1 { font-size: ${fs * 2}px !important; }
            h2 { font-size: ${fs * 1.5}px !important; }
            h3 { font-size: ${fs * 1.2}px !important; }
        `;
        injectStyle('simple-text-style', css);
    }
    
    // 6. 强制复制
    function applyForceCopy() {
        ['copy', 'cut', 'paste', 'contextmenu', 'selectstart', 'dragstart'].forEach(event => {
            document.addEventListener(event, e => {
                e.stopPropagation();
            }, true);
        });
        
        const css = `
            * { 
                user-select: text !important; 
                -webkit-user-select: text !important;
                -moz-user-select: text !important;
                -ms-user-select: text !important;
            }
        `;
        injectStyle('simple-force-copy', css);
    }
    
    // 7. 平滑滚动
    function applySmoothScroll() {
        document.documentElement.style.scrollBehavior = 'smooth';
    }
    
    // 8. 自动滚屏
    function applyAutoScroll() {
        if (window.simpleAutoScrollInterval) {
            clearInterval(window.simpleAutoScrollInterval);
        }
        window.simpleAutoScrollInterval = setInterval(() => {
            window.scrollBy(0, 1);
        }, 50);
    }
    
    // 9. 视频增强
    function applyVideoEnhance() {
        const videos = document.querySelectorAll('video');
        videos.forEach(video => {
            video.controls = true;
            video.setAttribute('controlsList', 'nodownload');
        });
        
        // 监听新添加的视频
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.tagName === 'VIDEO') {
                        node.controls = true;
                        node.setAttribute('controlsList', 'nodownload');
                    }
                });
            });
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }
    
    // 10. 视频倍速
    function applyVideoSpeed(speed) {
        document.querySelectorAll('video').forEach(v => {
            v.playbackRate = speed;
        });
        
        // 监听新添加的视频
        const observer = new MutationObserver(() => {
            document.querySelectorAll('video').forEach(v => {
                if (v.playbackRate !== speed) {
                    v.playbackRate = speed;
                }
            });
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }
    
    // 11. 跳过广告
    function applySkipAds() {
        const skipAds = () => {
            // 移除广告元素
            document.querySelectorAll('.ad, .ads, .advertisement, [class*="ad-"], [id*="ad-"]').forEach(el => el.remove());
            
            // 跳过视频广告
            document.querySelectorAll('video').forEach(v => {
                if (v.currentTime < 5 && v.duration > 10) {
                    v.currentTime = 5;
                }
            });
        };
        
        skipAds();
        setInterval(skipAds, 3000);
    }
    
    // 12. 禁止自动暂停
    function applyPreventPause() {
        document.querySelectorAll('video').forEach(video => {
            video.addEventListener('pause', () => {
                if (!video.ended) {
                    video.play();
                }
            }, true);
        });
    }
    
    // 13. 清除跟踪参数
    function removeTrackingParams() {
        const url = new URL(window.location.href);
        const trackingParams = [
            'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
            'fbclid', 'gclid', 'msclkid', 'mc_eid', 'utm_id'
        ];
        
        let changed = false;
        trackingParams.forEach(param => {
            if (url.searchParams.has(param)) {
                url.searchParams.delete(param);
                changed = true;
            }
        });
        
        if (changed) {
            window.history.replaceState({}, '', url);
        }
    }
    
    // 14. 隐藏Cookie提示
    function applyHideCookie() {
        const css = `
            .cookie-banner, .cookie-consent, .cookie-notice, 
            .consent-banner, .gdpr-banner, .privacy-banner,
            .cookie-popup, .cookie-dialog, .cookie-overlay {
                display: none !important;
                visibility: hidden !important;
                opacity: 0 !important;
            }
        `;
        injectStyle('simple-hide-cookie', css);
    }
    
    // 15. 禁止媒体权限
    function applyBlockMediaPermission() {
        if (navigator.mediaDevices) {
            navigator.mediaDevices.getUserMedia = () => {
                return Promise.reject(new Error('Media permission blocked by Simple Dark Mode & Reader'));
            };
            navigator.mediaDevices.enumerateDevices = () => {
                return Promise.resolve([]);
            };
        }
    }
    
    // 16. 防指纹追踪
    function applyAntiFingerprint() {
        // 伪装 webdriver
        Object.defineProperty(navigator, 'webdriver', {
            get: () => false
        });
        
        // 伪装插件
        Object.defineProperty(navigator, 'plugins', {
            get: () => [1, 2, 3, 4, 5]
        });
        
        // 伪装语言
        Object.defineProperty(navigator, 'languages', {
            get: () => ['zh-CN', 'zh', 'en']
        });
    }
    
    // 17. 页面净化
    function applyCleanPage() {
        const css = `
            .ad, .ads, .advertisement, .promotion,
            .popup, .modal, .overlay, .dialog, .lightbox,
            .sidebar, .widget, .qr-code, .qrcode,
            .floating-button, .float-btn, .back-to-top,
            .share-buttons, .social-share, .wechat-qrcode {
                display: none !important;
                visibility: hidden !important;
                opacity: 0 !important;
            }
        `;
        injectStyle('simple-clean-page', css);
    }
    
    // 18. 屏蔽弹窗
    function applyBlockPopups() {
        window.open = () => null;
        window.alert = () => null;
        window.confirm = () => true;
        window.prompt = () => null;
    }
    
    // 19. 禁止自动刷新
    function applyBlockRefresh() {
        // 移除刷新 meta 标签
        const meta = document.querySelector('meta[http-equiv="refresh"]');
        if (meta) meta.remove();
        
        // 阻止 location.reload
        Object.defineProperty(window.location, 'reload', {
            value: () => {}
        });
        
        // 阻止定时刷新
        const originalSetInterval = window.setInterval;
        window.setInterval = function(fn, delay) {
            if (delay < 5000 && typeof fn === 'string' && fn.includes('location')) {
                return null;
            }
            return originalSetInterval.apply(this, arguments);
        };
    }
    
    // 20. 关闭GIF动画
    function applyBlockGif() {
        const css = `
            img[src*=".gif"], img[src*=".GIF"] {
                display: none !important;
                visibility: hidden !important;
            }
        `;
        injectStyle('simple-block-gif', css);
        
        // 停止所有 GIF 动画
        document.querySelectorAll('img[src*=".gif"]').forEach(img => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            img.src = canvas.toDataURL('image/png');
        });
    }
    
    // 21. 切换UA
    function applyUserAgent(type) {
        const uas = {
            mobile: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15A372 Safari/604.1',
            desktop: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        };
        
        if (uas[type]) {
            Object.defineProperty(navigator, 'userAgent', {
                get: () => uas[type]
            });
            Object.defineProperty(navigator, 'platform', {
                get: () => type === 'mobile' ? 'iPhone' : 'Win32'
            });
        }
    }
    
    // 监听来自 popup 的消息
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        switch(request.action) {
            case 'exportPDF':
                window.print();
                break;
            case 'getPageInfo':
                sendResponse({
                    title: document.title,
                    url: window.location.href,
                    hasVideo: !!document.querySelector('video'),
                    hasDarkMode: document.documentElement.classList.contains('dark') || 
                                getComputedStyle(document.body).backgroundColor.includes('18, 18, 18')
                });
                break;
            case 'reapplySettings':
                // 重新应用所有设置
                initialize();
                break;
            case 'settingsChanged':
                // 设置变化，重新应用
                initialize();
                break;
        }
        return true;
    });
    
    // 立即初始化（不等待 DOMContentLoaded）
    initialize();
    
    // 页面加载完成后再次初始化（确保所有元素都已加载）
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            console.log('Simple Dark Mode & Reader: DOM 加载完成，重新应用设置');
            initialize();
        });
    }
    
    // 监听页面变化（SPA应用）
    let lastUrl = location.href;
    let lastBodyHash = '';
    
    function getBodyHash() {
        return document.body ? document.body.innerHTML.substring(0, 1000) : '';
    }
    
    new MutationObserver(() => {
        // 检查 URL 变化
        const url = location.href;
        if (url !== lastUrl) {
            lastUrl = url;
            console.log('Simple Dark Mode & Reader: 页面URL变化，重新应用设置');
            setTimeout(initialize, 300);
            return;
        }
        
        // 检查页面内容变化（针对SPA应用的路由切换）
        const currentBodyHash = getBodyHash();
        if (currentBodyHash !== lastBodyHash && currentBodyHash.length > 0) {
            lastBodyHash = currentBodyHash;
            console.log('Simple Dark Mode & Reader: 页面内容变化，重新应用设置');
            setTimeout(initialize, 300);
        }
    }).observe(document, {
        subtree: true, 
        childList: true,
        characterData: true
    });
    
    // 监听存储变化
    chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === 'local') {
            console.log('Simple Dark Mode & Reader: 设置已更改，重新应用', changes);
            initialize();
        }
    });
    
    console.log('Simple Dark Mode & Reader: Content script 已加载，准备恢复功能状态');
})();
