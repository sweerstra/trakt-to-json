const urlHeader = document.querySelector('header');
const itemTypeSelect = document.querySelector('select[name=type]');
const pagesInput = document.querySelector('input[name=pages]');
const exportButton = document.getElementById('export');

const setStyle = ({ id, url }) => {
    chrome.tabs.sendMessage(id, { type: 'parse', url }, ({ user, traktType, itemType }) => {
        if (traktType === 'history' || traktType === 'ratings') {
            itemTypeSelect.value = itemType;
            itemTypeSelect.disabled = true;

            getCurrentTab(tab => {
                chrome.tabs.sendMessage(tab.id, { type: 'pagination' }, ({ length }) => {
                    if (length === 0) {
                        exportButton.disabled = true;
                    } else {
                        pagesInput.dataset.max = length;
                    }

                    pagesInput.value = length;
                });
            });
        } else {
            pagesInput.parentNode.parentNode.removeChild(pagesInput.parentNode);
        }

        urlHeader.innerHTML = createStyledUrlHeader(user, traktType, itemType);
    });
};

const createStyledUrlHeader = (user, traktType, itemType) => {
    return `
        ${user} /
        <span class="highlighted">${traktType}</span> /
        <span class="highlighted">${itemType}</span>
    `;
};

const getCurrentTab = (callback) => {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
        callback(tab);
    });
};

document.addEventListener('DOMContentLoaded', () => {
    getCurrentTab(setStyle);
});

exportButton.addEventListener('click', () => {
    const options = Array.from(document.querySelectorAll('[name]')).reduce((options, { name, value }) => {
        options[name] = value;
        return options;
    }, {});

    if (pagesInput || !options.pages) {
        const maxPages = pagesInput.dataset.max;

        if (options.pages > maxPages) {
            options.pages = maxPages;
        }
    }

    options.years = options.years
        ? options.years.trim().split(/\s*,\s*/)
        : [];

    getCurrentTab(({ id, url }) => {
        chrome.tabs.sendMessage(id, { type: 'export', url, options });
    });
});

pagesInput.addEventListener('input', ({ target }) => {
    const { value, dataset } = target;

    if (value > dataset.max) {
        exportButton.disabled = true;
    }

    exportButton.disabled = !value || !parseInt(value);
});