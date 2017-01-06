(function () {
    const typeCheckbox = document.getElementById('cbType'),
        typeSelect = document.getElementById('type'),
        sortCheckbox = document.getElementById('cbSort'),
        sortSelect = document.getElementById('sort'),
        rankCheckbox = document.getElementById('rank'),
        amount = document.getElementById('amount'),
        years = document.getElementById('years');

    document.addEventListener('DOMContentLoaded', () => {
        const options = JSON.parse(localStorage.getItem('options'));

        if (options) {
            typeCheckbox.checked = options.type.set;
            typeSelect.value = options.type.value;
            sortCheckbox.checked = options.sort.set;
            sortSelect.value = options.sort.value;
            rankCheckbox.checked = options.rank;
            if (options.years) {
                years.value = options.years.join(', ');
            }
            amount.value = options.amount;
        }
    });

    document.getElementById('save').addEventListener('click', () => {
        localStorage.setItem('options', JSON.stringify({
            type: {
                set: typeCheckbox.checked,
                value: typeSelect.value
            },
            sort: {
                set: sortCheckbox.checked,
                value: sortSelect.value
            },
            rank: rankCheckbox.checked,
            years: years.value.split(/\s*,\s*/),
            amount: parseInt(amount.value)
        }));
    });
})();