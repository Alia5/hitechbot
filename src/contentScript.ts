const s = document.createElement('script');
s.src = chrome.runtime.getURL('js/webscript.js');
s.onload = () => {
    s.remove();
};
(document.head || document.documentElement).appendChild(s);
