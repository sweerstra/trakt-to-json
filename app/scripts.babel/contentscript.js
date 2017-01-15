(() => {
    const UrlType = {
        Lists: 'lists',
        Watchlist: 'watchlist',
        History: 'history',
        Ratings: 'ratings'
    };

    chrome.runtime.onMessage.addListener(request => {
        if (request.type === 'options') {
            const type = UrlHelper.getUrlType(request.url);

            if (type === UrlType.History || type === UrlType.Ratings) {
                request.options.sort.set = false;
                request.options.years = [];
            }

            download(getItemsWithOptions(request.options), ExportHelper.generateFilename(type, request.url));
        }
    });

    function download(obj, filename = 'data') {
        const data = `text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(obj))}`;
        const a = document.createElement('a');
        a.href = `data:${data}`;
        a.download = `trakt_${filename}.json`;
        a.click();
    }

    function getItemsWithOptions(options) {
        let items = getItems();

        if (options.type.set) {
            items = Manipulation.filterByType(items, options.type.value);
        }

        if (options.sort.set) {
            items = Manipulation.sortByDate(items, options.sort.value);
        }

        if (options.years.length > 0) {
            items = Manipulation.filterByYears(items, options.years)
        }

        if (options.amount && items.length > options.amount) {
            items = items.slice(0, options.amount);
        }

        return items;
    }

    function getItems() {
        return Array.from(document.querySelectorAll('.grid-item')).map(el => Selection.createItemFromElement(el));
    }

    const Manipulation = {

        sortByDate (items, type) {
            return items.sort((a, b) => {
                return type === 'asc'
                    ? new Date(a.released) - new Date(b.released)
                    : new Date(b.released) - new Date(a.released);
            });
        },

        filterByType (items, type) {
            return items.filter(obj => obj.type === type);
        },

        filterByYears (items, years) {
            return items.filter(obj => years.some(year => obj.released.startsWith(year)));
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
            return querystring.split('=').filter(Boolean).length == 1;
        }

    };

    const ExportHelper = {

        generateFilename(type, url) {

            if (type === UrlType.Lists || type === UrlType.Watchlist) {
                return this.getListFilename(url);
            }
            else if (type === UrlType.History) {
                return this.getHistoryFilename(url);
            }
            else if (type === UrlType.Ratings) {
                return this.getRatingsFilename(url);
            }

        },

        getListFilename (url) {
            return UrlHelper.getSegmentsOfUrl(url).pop();
        },

        getRatingsFilename (url) {
            return UrlHelper.getSegmentsOfUrl(url).slice(-5).join('_');
        },

        getHistoryFilename(url) {
            const segments = UrlHelper.getSegmentsOfUrl(url).slice(3);
            return (UrlHelper.emptyQuerystringValue(url) ? segments.slice(0, 4) : segments).join('_');
        },

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