(() => {
    class UrlParser {
        constructor(url) {
            this._segments = (url.endsWith('/') ? url.slice(0, -1) : url).split(/[/=?]+/);
            this._url = url;
            this._combinations = {
                lists: 'getListFilename',
                watchlist: 'getListFilename',
                history: 'getHistoryFilename',
                ratings: 'getRatingsFilename'
            };
        }

        getFilename(type) {
            return this[this._combinations[type]]();
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

    chrome.runtime.onMessage.addListener(({type, url, options}) => {
        if (type === 'options') {
            const parser = new UrlParser(url);
            const type = parser.getUrlType();

            if (type === 'history' || type === 'ratings') {
                options.sort = null;
                options.years = [];
            }

            const items = getItems(options);

            if (items.length > 0) {
                download(items, parser.getFilename(type));
            }
        }
    });

    function download(obj, filename = 'data') {
        const data = `text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(obj))}`;
        const a = document.createElement('a');
        a.href = `data:${data}`;
        a.download = `trakt_${filename}.json`;
        a.click();
    }

    function getItems({type, sort, years, amount}) {
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

    function createItemFromElement(el) => {
        return {
            title: el.querySelector('a.titles-link div.titles h3').innerText,
            type: el.getAttribute('data-type'),
            released: el.getAttribute('data-released'),
            poster: el.querySelector('a div.poster img.real').getAttribute('data-original'),
            percentage: el.getAttribute('data-percentage'),
            rank: el.getAttribute('data-rank')
        };
    }
})();