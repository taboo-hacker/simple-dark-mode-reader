// Content script for Simple Dark Mode & Reader
// This script runs in the context of web pages

(function() {
    'use strict';
    
    // Prevent multiple injections
    if (window.simpleDarkModeReaderInjected) return;
    window.simpleDarkModeReaderInjected = true;
    
    // Listen for messages from popup
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
        }
        return true;
    });
    
    // Auto-apply settings on page load
    chrome.storage.local.get(['darkMode', 'readerMode', 'forceCopy', 'removeTracking'], (result) => {
        // Apply dark mode if enabled
        if (result.darkMode) {
            applyDarkMode();
        }
        
        // Apply reader mode if enabled
        if (result.readerMode) {
            applyReaderMode();
        }
        
        // Apply force copy if enabled
        if (result.forceCopy) {
            applyForceCopy();
        }
        
        // Remove tracking parameters
        if (result.removeTracking) {
            removeTrackingParams();
        }
    });
    
    function applyDarkMode() {
        let style = document.getElementById('simple-dark-mode');
        if (!style) {
            style = document.createElement('style');
            style.id = 'simple-dark-mode';
            document.head.appendChild(style);
        }
        style.textContent = `
            html, body { background: #1a1a1a !important; color: #e0e0e0 !important; }
            * { background-color: #2d2d2d !important; color: #e0e0e0 !important; border-color: #333 !important; }
            a { color: #90caf9 !important; }
            img, video { background: transparent !important; }
        `;
    }
    
    function applyReaderMode() {
        let style = document.getElementById('simple-reader-mode');
        if (!style) {
            style = document.createElement('style');
            style.id = 'simple-reader-mode';
            document.head.appendChild(style);
        }
        style.textContent = `
            .ad, .ads, .sidebar, .widget, .social, .share, .comment, .related, .promotion, .popup, .modal, .banner { display: none !important; }
            .content, article, .article, .post { max-width: 800px !important; margin: 0 auto !important; }
        `;
    }
    
    function applyForceCopy() {
        ['copy', 'cut', 'paste', 'contextmenu', 'selectstart'].forEach(event => {
            document.addEventListener(event, e => e.stopPropagation(), true);
        });
    }
    
    function removeTrackingParams() {
        const url = new URL(window.location.href);
        const params = ['utm_source', 'utm_medium', 'utm_campaign', 'fbclid', 'gclid', 'msclkid'];
        let changed = false;
        params.forEach(p => {
            if (url.searchParams.has(p)) {
                url.searchParams.delete(p);
                changed = true;
            }
        });
        if (changed) {
            window.history.replaceState({}, '', url);
        }
    }
    
    // Block popups
    chrome.storage.local.get('blockPopups', (result) => {
        if (result.blockPopups) {
            window.open = () => null;
            window.alert = () => null;
            window.confirm = () => true;
        }
    });
    
    // Block auto-refresh
    chrome.storage.local.get('blockRefresh', (result) => {
        if (result.blockRefresh) {
            const meta = document.querySelector('meta[http-equiv="refresh"]');
            if (meta) meta.remove();
        }
    });
    
    // Hide cookie banners
    chrome.storage.local.get('hideCookie', (result) => {
        if (result.hideCookie) {
            const style = document.createElement('style');
            style.id = 'simple-hide-cookie';
            style.textContent = '.cookie-banner, .cookie-consent, .cookie-notice, .gdpr-banner { display: none !important; }';
            document.head.appendChild(style);
        }
    });
    
    // Clean page
    chrome.storage.local.get('cleanPage', (result) => {
        if (result.cleanPage) {
            const style = document.createElement('style');
            style.id = 'simple-clean-page';
            style.textContent = `
                .ad, .ads, .popup, .modal, .banner, .sidebar, .widget, .promotion, .qr-code, .qrcode { display: none !important; }
                .floating-button, .float-btn, .back-to-top { display: none !important; }
            `;
            document.head.appendChild(style);
        }
    });
    
    console.log('Simple Dark Mode & Reader: Content script loaded');
})();
