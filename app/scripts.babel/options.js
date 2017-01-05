(function () {
    const typeCheckbox = document.getElementById('cbType'),
        typeSelect = document.getElementById('type'),
        sortCheckbox = document.getElementById('cbSort'),
        sortSelect = document.getElementById('sort'),
        amountInput = document.getElementById('amount'),
        yearsInput = document.getElementById('years');

    document.addEventListener('DOMContentLoaded', () => {
        const options = JSON.parse(localStorage.getItem('options'));

        if (!options) return;

        typeCheckbox.checked = options.type.set;
        typeSelect.value = options.type.value;

        sortCheckbox.checked = options.sort.set;
        sortSelect.value = options.sort.value;

        yearsInput.value = options.years.value.join(', ');
        amountInput.value = options.amount.value;
    });

    document.getElementById('save').addEventListener('click', () => {
        const years = yearsInput.value.split(/\s*,\s*/);

        localStorage.setItem('options', JSON.stringify({
            type: {
                set: typeCheckbox.checked,
                value: typeSelect.value
            },
            sort: {
                set: sortCheckbox.checked,
                value: sortSelect.value
            },
            years: years,
            amount: parseInt(amountInput.value)
        }));
    });
})();