const OPTIONS_KEY = 'options';
const ValueProps = { string: 'value', number: 'value', boolean: 'checked' };

document.addEventListener('DOMContentLoaded', () => {
    const form = document.options;

    Object.entries(getOptions(OPTIONS_KEY)).forEach(([key, value]) => {
        // get property of object value to set for input
        const valueProp = ValueProps[typeof value];
        form[key][valueProp] = value;
    });

    form.querySelectorAll('input').forEach(input => input.addEventListener('input', save));
    form.querySelectorAll('select').forEach(select => select.addEventListener('change', save));
});

const save = ({ target }) => {
    // get property of element to access for value
    const valueProp = target.dataset.prop;
    const obj = { [target.name]: target[valueProp] };
    const options = getOptions(OPTIONS_KEY);

    setOptions(OPTIONS_KEY, { ...options, ...obj });
};

const getOptions = (key) => {
    return JSON.parse(localStorage.getItem(key)) || {};
};

const setOptions = (key, options) => {
    return localStorage.setItem(key, JSON.stringify(options));
};