(function () {
    chrome.runtime.onMessage.addListener(
        function (request) {
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
        const nodeList = document.querySelectorAll('.grid-item');

        return Array.from(nodeList).map(el => Selection.createEntryFromElement(el));
    }

    const Manipulation = {

        sortByDate: function (entries, type) {
            return entries.sort((a, b) => {
                return type === 'asc'
                    ? new Date(a.released) - new Date(b.released)
                    : new Date(b.released) - new Date(a.released);
            });
        },

        filterByType: function (entries, type) {
            return entries.filter(obj => obj.type === type);
        },

        filterByYears: function (entries, years) {
            return entries.filter(obj => years.some(year => obj.released.startsWith(year)));
        },

        getLastSegmentOfUrl: function (url) {
            return (url.endsWith('/') ? url.slice(0, -1) : url).split('/').pop();
        }

    };

    const Selection = {

        createEntryFromElement: function (el) {
            return {
                title: this.getTitle(el),
                type: el.getAttribute('data-type'),
                released: el.getAttribute('data-released'),
                poster: this.getPoster(el),
                percentage: el.getAttribute('data-percentage')
            };
        },

        getTitle: function (el) {
            return el.querySelector('a.titles-link div.titles h3').innerText;
        },

        getPoster: function (el) {
            return el.querySelector('a div.poster img.real').getAttribute('data-original');
        }

    };
})();
