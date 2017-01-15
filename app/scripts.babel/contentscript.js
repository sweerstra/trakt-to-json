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

            download(getEntriesWithOptions(request.options), ExportHelper.generateFilename(type, request.url));
        }
    });

    function download(obj, filename = 'data') {
        const data = `text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(obj))}`;
        const a = document.createElement('a');
        a.href = `data:${data}`;
        a.download = `trakt_${filename}.json`;
        a.click();
    }

    function getEntriesWithOptions(options) {
        let entries = getEntries();

        if (options.type.set) {
            entries = Manipulation.filterByType(entries, options.type.value);
        }

        if (options.sort.set) {
            entries = Manipulation.sortByDate(entries, options.sort.value);
        }

        if (options.years.length > 0) {
            entries = Manipulation.filterByYears(entries, options.years)
        }

        if (options.amount && entries.length > options.amount) {
            entries = entries.slice(0, options.amount);
        }

        return entries;
    }

    function getEntries() {
        return Array.from(document.querySelectorAll('.grid-item')).map(el => Selection.createEntryFromElement(el));
    }

    const Manipulation = {

        sortByDate (entries, type) {
            return entries.sort((a, b) => {
                return type === 'asc'
                    ? new Date(a.released) - new Date(b.released)
                    : new Date(b.released) - new Date(a.released);
            });
        },

        filterByType (entries, type) {
            return entries.filter(obj => obj.type === type);
        },

        filterByYears (entries, years) {
            return entries.filter(obj => years.some(year => obj.released.startsWith(year)));
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

        createEntryFromElement (el) {
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