(() => {
    const typeSelect = document.getElementById('type');
    const sortCheck = document.getElementById('cbSort');
    const sortSelect = document.getElementById('sort');
    const amountInput = document.getElementById('amount');
    const yearsInput = document.getElementById('years');

    document.addEventListener('DOMContentLoaded', () => {
        const options = JSON.parse(localStorage.getItem('options'));

        if (options) {
            typeSelect.value = options.type;
            sortCheck.checked = Boolean(options.sort);
            sortSelect.value = options.sort;
            if (options.years.length > 0) {
                yearsInput.value = options.years.join(', ');
            }
            amountInput.value = options.amount;
        }
    });

    document.getElementById('save').addEventListener('click', () => {
        localStorage.setItem('options', JSON.stringify({
            type: typeSelect.value,
            sort: sortCheck.checked ? sortSelect.value : null,
            years: yearsInput.value ? yearsInput.value.trim().split(/\s*,\s*/) : [],
            amount: +amountInput.value || null
        }));
    });
})();