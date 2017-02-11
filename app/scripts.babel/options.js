(() => {
    const typeSelect = document.getElementById('type');
    const sortSelect = document.getElementById('sort');
    const yearsInput = document.getElementById('years');
    const amountInput = document.getElementById('amount');

    document.addEventListener('DOMContentLoaded', () => {
        const options = JSON.parse(localStorage.getItem('options')) || {
                type: 'all',
                sort: '',
                years: null,
                amount: ''
            };

        typeSelect.value = options.type;
        sortSelect.value = options.sort;
        yearsInput.value = options.years ? options.years.join(', ') : null;
        amountInput.value = options.amount;
    });

    document.getElementById('save').addEventListener('click', () => {
        localStorage.setItem('options', JSON.stringify({
            type: typeSelect.value,
            sort: sortSelect.value,
            years: yearsInput.value ? yearsInput.value.trim().split(/\s*,\s*/) : [],
            amount: +amountInput.value || null
        }));
    });
})();