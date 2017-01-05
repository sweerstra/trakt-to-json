onLoad();

function onLoad() {
    const options = JSON.parse(localStorage.getItem('options'));

    console.log(options);

    let manager = new EntryManager(options);

    console.log(manager.getWithOptions());
}

class EntryManager {
    constructor(options) {
        this._options = options;
    }

    getWithOptions() {
        let entries = this.getEntries();

        if (this._options.type.set) {
            entries = Manipulation.filterByType(entries, this._options.type.value);
        }

        if (this._options.sort.set) {
            entries = Manipulation.sortByDate(entries, this._options.sort.value);
        }

        if (this._options.amount.set) {
            entries = entries.slice(this._options.amount.value);
        }

        if (this._options.years.set) {
            entries = Manipulation.filterByYears(entries, this._options.years.value)
        }

        return entries;
    }

    getEntries() {
        const nodeList = document.querySelectorAll('.grid-item');

        return Array.from(nodeList).map(el => Selection.createEntryFromElement(el));
    }
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
        return entries.filter(obj =>
            years.some(year =>
                obj.released.startsWith(year)));
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
