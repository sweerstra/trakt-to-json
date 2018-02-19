const urlHeader = document.querySelector('#url');
const settings = document.querySelector('#settings');
const itemTypeSelect = document.querySelector('[name=type]');
const pagesInput = document.querySelector('[name=pages]');
const exportButton = document.querySelector('#export');
const errorText = document.querySelector('.error');
const loader = document.querySelector('#loader');

const setStyle = ({ id, url }) => {
    chrome.tabs.sendMessage(id, { type: 'get-parsed-url', url }, ({ user, traktType, itemType }) => {
        if (traktType === 'history' || traktType === 'ratings') {
            itemTypeSelect.value = itemType;
            itemTypeSelect.disabled = true;

            chrome.tabs.sendMessage(id, { type: 'get-pagination-length' }, ({ length }) => {
                pagesInput.value = length;
                pagesInput.dataset.max = length;
            });
        } else {
            settings.removeChild(pagesInput.parentNode);
        }

        const highlight = text => `<span class="highlighted">${text}</span>`;
        urlHeader.innerHTML = `${user} / ${highlight(traktType)} / ${highlight(itemType)}`;
    });
};

document.addEventListener('DOMContentLoaded', () => {
    getCurrentTab(setStyle);
});

exportButton.addEventListener('click', () => {
    exportButton.style.display = 'none';
    loader.style.display = 'block';

    const options = Array
        .from(document.querySelectorAll('[name]'))
        .reduce((options, { name, type, value, checked }) => {
            options[name] = type === 'checkbox' ? checked : value;
            return options;
        }, {});

    options.years = options.years.trim()
        .split(/\s*,\s*/)
        .filter(Boolean);

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
    const value = parseInt(target.value, 10);
    const min = parseInt(target.dataset.min, 10);
    const max = parseInt(target.dataset.max, 10);

    if (value) {
        if (value > max) {
            pagesInput.value = max;
        } else if (value < min) {
            pagesInput.value = min;
        }
    }

    exportButton.disabled = !value || value <= 0;
});

const getCurrentTab = (callback) => {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
        callback(tab);
    });
};