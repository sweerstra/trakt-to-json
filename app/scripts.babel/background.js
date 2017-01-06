(() => {
    chrome.browserAction.onClicked.addListener(tab => {
        chrome.tabs.query({active: true, currentWindow: true}, tabs => {
            chrome.tabs.sendMessage(tabs[0].id, {
                type: 'options',
                options: JSON.parse(localStorage.getItem('options')),
                url: tabs[0].url
            }, null);
        });
    });
})();