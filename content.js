class TraktUrlParser {
    constructor(url) {
        this._url = url;
        this._urlSegments = this._url.split('/');
        return this;
    }

    getUser() {
        return this._urlSegments[4];
    }

    getTraktType() {
        return this._urlSegments[5].split('?')[0];
    }

    getItemType() {
        return this._urlSegments[6] || 'all';
    }

    getMultiPageUrl() {
        return this._url.split('?')[0] + '?page=';
    }
}

chrome.runtime.onMessage.addListener(({ type: messageType, url, options }, sender, sendResponse) => {
    let parser;

    switch (messageType) {
        case 'get-pagination-length':
            sendResponse({ length: getPaginationLength() || 1 });
            break;

        case 'export':
            parser = new TraktUrlParser(url);
            const traktType = parser.getTraktType();

            (options.pages === '1' || traktType === 'watchlist' || traktType === 'lists'
                ? getItemsFromCurrentPage()
                : getItemsFromMultiplePages(parser.getMultiPageUrl(), options.pages))
                .then(items => {
                    if (items.length === 0) {
                        sendResponse({ error: true });
                        return;
                    }

                    const filteredItems = filterItems(items, traktType, options);
                    const hasItemsToExport = filteredItems.length > 0;

                    if (hasItemsToExport) {
                        download(filteredItems);
                    }

                    sendResponse({ error: !hasItemsToExport });
                });
            break;

        case 'get-parsed-url':
            parser = new TraktUrlParser(url);

            sendResponse({
                user: parser.getUser(),
                traktType: parser.getTraktType(),
                itemType: parser.getItemType()
            });
            break;
    }

    return true;
});

const getItemsFromCurrentPage = (element = document) => {
    return Promise.resolve(
        Array.from(element.querySelectorAll('.grid-item'), createItemFromElement)
    );
};

const getItemsFromMultiplePages = (multiPageUrl, length) => {
    const url = `https://i321720.iris.fhict.nl/php/web_scrape.php?target=${multiPageUrl}`;

    const pages = Array.from({ length }, (_, index) =>
        fetch(url + (index + 1)).then(resp => resp.text()));

    return Promise.all(pages).then(html => {
        const container = document.createElement('div');
        container.innerHTML = html;
        return getItemsFromCurrentPage(container);
    });
};

const filterItems = (items, traktType, { type: itemType, sort, years, letterboxd }) => {
    if (traktType.includes('list') && itemType !== 'all') {
        items = items.filter(item => item.type === itemType);
    }

    if (sort) {
        const asc = sort === 'asc' ? 1 : -1;
        const desc = sort === 'desc' ? 1 : -1;
        items = items.sort((a, b) => new Date(a.date) > new Date(b.date) ? asc : desc);
    }

    if (years.length > 0) {
        items = items.filter(item => years.includes(item.year));
    }

    if (letterboxd) {
        items = items.map(item => ({ Title: item.title, Year: item.year }));
    }

    return items;
};

const createItemFromElement = (el) => {
    const { type, url, percentage, rank } = el.dataset;

    let date = el.dataset.released;
    if (date === undefined) {
        const dateElement = el.querySelector('[class$="-date"]');
        date = dateElement && dateElement.dataset.date.slice(0, 10);
    }

    return {
        title: el.querySelector('a.titles-link div.titles h3').textContent,
        poster: el.querySelector('img.real').dataset.original,
        type,
        url,
        percentage: percentage || el.querySelector('.percentage').textContent.slice(0, -1),
        rank,
        date,
        year: date.slice(0, 4)
    };
};

const download = (items) => {
    const data = `text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(items))}`;
    const a = document.createElement('a');
    a.href = `data:${data}`;
    a.download = `data.json`;
    a.click();
};

const getPaginationLength = () => {
    const listItems = document.querySelectorAll('.pagination .page');
    if (listItems.length === 0) return null;
    const length = listItems[listItems.length - 1].querySelector('a').textContent;
    return parseInt(length, 10) || null;
};
