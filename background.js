// Send to login page when extension is installed.
chrome.runtime.onInstalled.addListener(({ reason }) => {
    if (reason === 'install') {
        chrome.tabs.create({
            url: "https://generatemyresume.com/login"
        });
    }
});