(() => {
    chrome.runtime.onMessage.addListener(request => {
        if (request.type === 'options') {
            download(getWithOptions(request.options), Manipulation.getLastSegmentOfUrl(request.url));
        }
    });

    function download(obj, filename = 'data') {
        const data = `text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(obj))}`;
        const a = document.createElement('a');
        a.href = `data:${data}`;
        a.download = `trakt_${filename}.json`;
        a.click();
    }

    function getWithOptions(options) {
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
        },

        getLastSegmentOfUrl (url) {
            return (url.endsWith('/') ? url.slice(0, -1) : url).split('/').pop();
        }

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
