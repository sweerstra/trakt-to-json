chrome.browserAction.onClicked.addListener(({ id, url }) => {
    chrome.tabs.query({ active: true, currentWindow: true }, () => {
        chrome.tabs.sendMessage(id, {
            url,
            type: 'options',
            options: JSON.parse(localStorage.getItem('options'))
        });
    });
});
