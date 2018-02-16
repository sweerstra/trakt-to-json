class UrlParser {
    constructor(url) {
        this._segments = (url.endsWith('/') ? url.slice(0, -1) : url).split(/[/=?]+/);
        return this;
    }

    get segments() {
        return this._segments;
    }

    getUrlType() {
        return this._segments[4];
    }

    getItemType() {
        return this._segments[5] || 'all';
    }

    getUrlSegmentsForHeader() {
        const slice = this._segments.slice(3);
        return slice[slice.length - 1] ? slice : slice.slice(0, -2);
    }
}

const header = document.querySelector('header');
const itemTypeSelect = document.querySelector('select[name=type]');
const pagesInput = document.querySelector('input[name=pages]');

const setStyle = (url) => {
    const parser = new UrlParser(url);
    const segments = parser.getUrlSegmentsForHeader();
    const urlType = parser.getUrlType();
    const itemType = parser.getItemType();

    if (urlType === 'history' || urlType === 'ratings') {
        itemTypeSelect.value = itemType;
        itemTypeSelect.disabled = true;

        sendMessage({ type: 'pagination' }, ({ length }) => {
            pagesInput.value = length;
            pagesInput.max = length;
        });
    } else {
        pagesInput.parentElement.style.display = 'none';
    }

    header.innerHTML = createStyledUrlHeader(segments, urlType, itemType);
};

const createStyledUrlHeader = (segments, urlType, itemType) => {
    const highlight = value => `<span class="highlighted">${value}</span>`;
    segments[segments.indexOf(urlType)] = highlight(urlType);
    segments[segments.indexOf(itemType)] = highlight(itemType);
    return segments.join(' / ');
};

const sendMessage = (message, callback) => {
    getCurrentTab(tab => {
        chrome.tabs.sendMessage(tab.id, message, callback);
    });
};

const getCurrentTab = (callback) => {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
        callback(tab);
    });
};

getCurrentTab((tab) => setStyle(tab.url));

