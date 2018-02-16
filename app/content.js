const UrlMethods = new Map([
    ['lists', 'getListFilename'],
    ['watchlist', 'getListFilename'],
    ['history', 'getHistoryFilename'],
    ['ratings', 'getRatingsFilename']
]);

class UrlParser {
    constructor(url) {
        this._segments = (url.endsWith('/') ? url.slice(0, -1) : url).split(/[/=?]+/);
        this._url = url;
    }

    getFilename(type) {
        return this[UrlMethods.get(type)]();
    }

    getUrlType() {
        return this._segments.slice(4)[0];
    }

    getListFilename() {
        return this._segments[this._segments.length - 1];
    }

    getRatingsFilename() {
        return this._segments.slice(3).join('_');
    }

    getHistoryFilename() {
        const part = this._segments.slice(3);

        return (this._url.split('=').filter(Boolean).length === 1 ? part.slice(0, 4) : part).join('_');
    }
}

chrome.runtime.onMessage.addListener(({ type, url, options }) => {
    if (type === 'options') {
        const parser = new UrlParser(url);
        const type = parser.getUrlType();
        const handledOptions = handleDefaultOptions(options);

        if (type === 'history' || type === 'ratings') {
            handledOptions.sort = null;
            handledOptions.years = [];
        }

        const items = getItems(handledOptions);

        if (items.length > 0) {
            download(items, parser.getFilename(type));
        }
    }
});

function download(array, filename) {
    const data = `text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(array))}`;
    const a = document.createElement('a');
    a.href = `data:${data}`;
    a.download = `trakt_${filename}.json`;
    a.click();
}

function getItems({ type, sort, years, amount }) {
    let items = [...document.querySelectorAll('.grid-item')].map(el => createItemFromElement(el));

    if (type !== 'all') {
        items = filterByType(items, type);
    }

    if (sort) {
        items = sortByDate(items, sort);
    }

    if (years.length > 0) {
        items = filterByYears(items, years)
    }

    if (amount && items.length > amount) {
        items = items.slice(0, amount);
    }

    return items;
}

function sortByDate(items, type) {
    const sorted = items.sort((a, b) => new Date(a.released) - new Date(b.released));

    return type === 'desc' ? sorted.reverse() : sorted;
}

function filterByType(items, type) {
    return items.filter(item => item.type === type);
}

function filterByYears(items, years) {
    return items.filter(item => years.some(year => item.released.startsWith(year)));
}

function createItemFromElement(el) {
    const { type, url, percentage, rank } = el.dataset;
    const urlParts = url.split('-');

    return {
        title: el.querySelector('a.titles-link div.titles h3').innerText,
        type,
        url,
        released: urlParts[urlParts.length - 1],
        poster: el.querySelector('a div.poster img.real').getAttribute('data-original'),
        percentage,
        rank
    };
}

function handleDefaultOptions(options = {}) {
    options.type = options.type || 'all';
    options.sort = options.sort || null;
    options.years = options.years ? options.years.trim().split(/\s*,\s*/) : [];
    options.amount = options.amount ? parseInt(options.amount, 10) : 0;

    return options;
}

function historyExport(user) {
    const url = `https://i321720.iris.fhict.nl/php/web_scrape.php?target=https://trakt.tv/users/souff_yayo/history/movies/added?genres=&page=`;

    const fetches = Array.from({ length: 5 }, (_, index) => {
        console.log(url + (index + 1));
        return fetch(url + (index + 1)).then(resp => resp.text());
    });

    console.log(fetches);

    Promise.all(fetches).then(html => {
        const container = document.createElement('div');
        container.innerHTML = html;

        let items = Array.from(container.querySelectorAll('.grid-item'), el => {
            const urlParts = el.dataset.url.split('-');

            return {
                Title: el.querySelector('a.titles-link div.titles h3').innerText,
                Year: urlParts[urlParts.length - 1],
            };
        });

        console.log(items);

        console.log(JSON.stringify(items));
    });
}

function getPaginationLength() {
    const listItems = document.querySelectorAll('.pagination .page');
    if (listItems.length === 0) return null;
    const length = listItems[listItems.length - 1].querySelector('a').textContent;
    const num = parseInt(length, 10);
    return num !== length ? num : null;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'pagination') {
        sendResponse({ length: getPaginationLength() });
    }
});
