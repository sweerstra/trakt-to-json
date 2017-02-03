(() => {
    const typeSelect = document.getElementById('type'),
        sortCheckbox = document.getElementById('cbSort'),
        sortSelect = document.getElementById('sort'),
        amountInput = document.getElementById('amount'),
        yearsInput = document.getElementById('years');

    document.addEventListener('DOMContentLoaded', () => {
        const options = JSON.parse(localStorage.getItem('options'));

        if (options) {
            typeSelect.value = options.type;
            sortCheckbox.checked = Boolean(options.sort);
            sortSelect.value = options.sort;
            if (options.years.length) {
                yearsInput.value = options.years.join(', ');
            }
            amountInput.value = options.amount;
        }
    });

    document.getElementById('save').addEventListener('click', () => {
        localStorage.setItem('options', JSON.stringify({
            type: typeSelect.value,
            sort: sortCheckbox.checked ? sortSelect.value : null,
            years: yearsInput.value ? yearsInput.value.trim().split(/\s*,\s*/) : [],
            amount: +amountInput.value || null
        }));
    });
})();