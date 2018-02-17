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
        case 'pagination':
            sendResponse({ length: getPaginationLength() || 1 });
            break;

        case 'export':
            parser = new TraktUrlParser(url);
            const type = parser.getTraktType();

            type === 'history' || type === 'ratings'
                ? getItemsFromMultiplePages(parser.getMultiPageUrl(), options.pages)
                : getItemsFromCurrentPage(type, options).then(items => {
                    if (items.length > 0) {
                        const filename = prompt('Choose filename export file');
                        if (filename) {
                            download(filterItems(items, type, options), filename);
                        }
                    }
                });

            break;

        case 'parse':
            parser = new TraktUrlParser(url);
            const user = parser.getUser();
            const traktType = parser.getTraktType();
            const itemType = parser.getItemType();
            sendResponse({ user, traktType, itemType });
            break;
    }

    return true;
});

const getItemsFromCurrentPage = () => {
    return Promise.resolve(
        Array.from(document.querySelectorAll('.grid-item'), createItemFromElement)
    );
};

const getItemsFromMultiplePages = (multiPageUrl, length) => {
    const url = `https://i321720.iris.fhict.nl/php/web_scrape.php?target=${multiPageUrl}`;

    const fetches = Array.from({ length }, (_, index) =>
        fetch(url + (index + 1)).then(resp => resp.text())
    );

    return Promise.all(fetches).then(html => {
        const container = document.createElement('div');
        container.innerHTML = html;

        return Array.from(container.querySelectorAll('.grid-item'), createItemFromElement);
    });
};

const filterItems = (items, traktType, { type, sort, years }) => {
    if (traktType.includes('list') && type !== 'all') {
        items = items.filter(item => item.type === type);
    }

    if (sort) {
        const asc = sort === 'asc' ? 1 : -1;
        const desc = sort === 'desc' ? 1 : -1;
        items = items.sort((a, b) => new Date(a.released) > new Date(b.released) ? asc : desc);
    }

    if (years.length > 0) {
        items = items.filter(item => years.includes(item.year));
    }

    return items;
};

const createItemFromElement = (el) => {
    const { type, url, percentage, rank, released } = el.dataset;

    return {
        title: el.querySelector('a.titles-link div.titles h3').textContent,
        poster: el.querySelector('img.real').dataset.original,
        type,
        url,
        percentage: percentage || el.querySelector('.percentage').textContent.slice(0, -1),
        rank,
        released: released || el.querySelector('.format-date').dataset.date.slice(0, 10),
        year: url.split('-').pop()
    };
};

const download = (items, filename) => {
    const data = `text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(items))}`;
    const a = document.createElement('a');
    a.href = `data:${data}`;
    a.download = `trakt_${filename}.json`;
    a.click();
};

const getPaginationLength = () => {
    const listItems = document.querySelectorAll('.pagination .page');
    if (listItems.length === 0) return null;
    const length = listItems[listItems.length - 1].querySelector('a').textContent;
    return parseInt(length, 10) || null;
};
