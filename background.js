chrome.tabs.onUpdated.addListener((tabId, info, { url }) => {
    const types = ['history', 'ratings', 'watchlist', 'lists'];

    if (url.includes('trakt.tv') && types.some(type => url.includes(type))) {
        chrome.pageAction.show(tabId);
    }
});