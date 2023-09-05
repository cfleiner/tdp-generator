function getRadioValue(id) {
    return document.querySelector(`input[name="${id}"]:checked`).value
}

function getCheckValues(cls) {
    const children = document.getElementsByClassName(cls)
    const obj = {};
    for(const child of children) {
        let key = child.name.split('-')[0];
        obj[key] = child.checked;
    }
    return obj;
}

function getColors(cls) {
    const children = document.getElementsByClassName(cls)
    const obj = {};
    for(const child of children) {
        let key = child.name.replace(cls + '-', '');
        obj[key] = child.value;
    }
    return obj;
}

// Variables from user input
function getShare(className){
    const sliders = document.getElementsByClassName(className);
    const obj = {};
    for (const slider of sliders) {
        let key = slider.id.replace(className + '-', '');
        obj[key] = Number(slider.value);
    }
    return obj
}

export{getRadioValue, getCheckValues, getShare, getColors};