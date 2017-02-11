(() => {
    const File = {
        lists: 'getListFilename',
        watchlist: 'getListFilename',
        history: 'getHistoryFilename',
        ratings: 'getRatingsFilename'
    };

    chrome.runtime.onMessage.addListener(({type, url, options}) => {
        if (type === 'options') {
            const type = UrlHelper.getUrlType(url);

            if (type === 'history' || type === 'ratings') {
                options.sort = null;
                options.years = [];
            }

            const items = getItems(options);

            if (items.length > 0) {
                download(items, ExportHelper[File[type]](url));
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
        let items = [...document.querySelectorAll('.grid-item')].map(el => Selection.createItemFromElement(el));

        if (type !== 'all') {
            items = Manipulation.filterByType(items, type);
        }

        if (sort) {
            items = Manipulation.sortByDate(items, sort);
        }

        if (years.length > 0) {
            items = Manipulation.filterByYears(items, years)
        }

        if (amount && items.length > amount) {
            items = items.slice(0, amount);
        }

        return items;
    }

    const Manipulation = {

        sortByDate (items, type) {
            const sorted = items.sort((a, b) => new Date(a.released) - new Date(b.released));

            return type === 'desc' ? sorted.reverse() : sorted;
        },

        filterByType (items, type) {
            return items.filter(item => item.type === type);
        },

        filterByYears (items, years) {
            return items.filter(item => years.some(year => item.released.startsWith(year)));
        }

    };

    const UrlHelper = {

        getUrlType(url) {
            return this.getSegmentsOfUrl(url).slice(4).shift();
        },

        getSegmentsOfUrl(url) {
            return (url.endsWith('/') ? url.slice(0, -1) : url).split(/[/=?]+/);
        },

        emptyQuerystringValue(querystring) {
            return querystring.split('=').filter(Boolean).length === 1;
        }

    };

    const ExportHelper = {

        getListFilename (url) {
            return UrlHelper.getSegmentsOfUrl(url).pop();
        },

        getRatingsFilename (url) {
            return UrlHelper.getSegmentsOfUrl(url).slice(-5).join('_');
        },

        getHistoryFilename(url) {
            const segments = UrlHelper.getSegmentsOfUrl(url).slice(3);
            return (UrlHelper.emptyQuerystringValue(url) ? segments.slice(0, 4) : segments).join('_');
        }

    };

    const Selection = {

        createItemFromElement (el) {
            return {
                title: this.getTitle(el),
                type: el.getAttribute('data-type'),
                released: el.getAttribute('data-released'),
                poster: this.getPoster(el),
                percentage: el.getAttribute('data-percentage'),
                rank: el.getAttribute('data-rank')
            };
        },

        getTitle (el) {
            return el.querySelector('a.titles-link div.titles h3').innerText;
        },

        getPoster (el) {
            return el.querySelector('a div.poster img.real').getAttribute('data-original');
        }

    };
})();