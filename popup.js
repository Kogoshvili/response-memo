const button = document.getElementById('start');
button.onclick = () => {
    chrome.runtime.sendMessage({ msg: 'start' });
};

const clearButton = document.getElementById('clear');
clearButton.onclick = () => {
    chrome.runtime.sendMessage({ msg: 'clear' });
};
