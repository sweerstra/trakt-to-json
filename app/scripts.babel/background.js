'use strict';

chrome.browserAction.onClicked.addListener(function (tab) {
    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {
            type: 'options',
            options: fetchOptions(),
            url: tabs[0].url
        }, function (response) {
        });
    });
});

function fetchOptions() {
    return JSON.parse(localStorage.getItem('options'));
}