import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './popup/App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);



// const button = document.getElementById('start');
// button.onclick = () => {
//     chrome.runtime.sendMessage({ msg: 'start' });
// };

// const clearButton = document.getElementById('clear');
// clearButton.onclick = () => {
//     chrome.runtime.sendMessage({ msg: 'clear' });
// };

// chrome.storage.onChanged.addListener(function(changes, namespace) {

// })
