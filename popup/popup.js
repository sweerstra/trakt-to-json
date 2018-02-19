const urlHeader = document.querySelector('header .url');
const itemTypeSelect = document.querySelector('select[name=type]');
const pagesInput = document.querySelector('input[name=pages]');
const exportButton = document.getElementById('export');
const errorText = document.querySelector('.error');
const loader = document.getElementById('loader');

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

        urlHeader.innerHTML = `${user} /
                               <span class="highlighted">${traktType}</span> /
                               <span class="highlighted">${itemType}</span>`;
    });
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
    exportButton.style.display = 'none';
    loader.style.display = 'block';

    const options = Array.from(document.querySelectorAll('[name]')).reduce((options, { name, type, value, checked }) => {
        options[name] = type === 'checkbox' ? checked : value;
        return options;
    }, {});

    const pages = parseInt(options.pages, 10);
    if (pagesInput && pages) {
        const maxPages = parseInt(pagesInput.dataset.max, 10);

        if (pages > maxPages) {
            options.pages = maxPages;
        }
    }

    options.years = options.years
        ? options.years.trim().split(/\s*,\s*/)
        : [];

    getCurrentTab(({ id, url }) => {
        chrome.tabs.sendMessage(id, { type: 'export', url, options }, ({ error }) => {
            loader.style.display = 'none';

            if (error) {
                exportButton.style.display = 'block';
                errorText.style.display = 'block';
            }
        });
    });
});

pagesInput.addEventListener('input', ({ target }) => {
    const { value, dataset: { min, max } } = target;

    if (value) {
        if (value > max) {
            pagesInput.value = max;
        } else if (value < min) {
            pagesInput.value = min;
        }
    }

    exportButton.disabled = !value || !parseInt(value, 10);
});