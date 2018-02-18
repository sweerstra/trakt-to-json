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

            (options.pages !== '1' && (type === 'history' || type === 'ratings')
                ? getItemsFromMultiplePages(parser.getMultiPageUrl(), options.pages)
                : getItemsFromCurrentPage(type, options))
                .then(items => {
                    if (items.length === 0) {
                        sendResponse({ error: true });
                        return;
                    }

                    const filteredItems = filterItems(items, type, options);
                    const shouldExport = filteredItems.length > 0;

                    if (shouldExport) {
                        download(
                            options.letterboxd
                                ? mapItemsToLetterboxdExport(filteredItems)
                                : filteredItems
                        );
                    }

                    sendResponse({ error: !shouldExport });
                });
            break;

        case 'parse':
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
        items = items.sort((a, b) => new Date(a.date) > new Date(b.date) ? asc : desc);
    }

    if (years.length > 0) {
        items = items.filter(item => years.includes(item.year));
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

const mapItemsToLetterboxdExport = (items) => {
    return items.map(item => ({ Title: item.title, Year: item.year }));
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
