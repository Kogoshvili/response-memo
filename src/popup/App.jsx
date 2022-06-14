import React, { useEffect, useState } from 'react';
import List from './components/List';

function App() {
    const [list, setList] = useState([]);

    useEffect(() => {
        (async () => {
            const res = await chrome.storage.local.get();
            setList(Object.keys(res));}
        )();
        chrome.storage.onChanged.addListener(async (_changes) => {
            const res = await chrome.storage.local.get();
            setList(Object.keys(res));
        });
    }, []);

    const onStartClick = () => {
        chrome.runtime.sendMessage({ fun: 'start' });
    };

    const onClearClick = () => {
        chrome.runtime.sendMessage({ fun: 'clear' });
    };

    const onClick = (index) => {
        chrome.storage.local.set({ preselected: list[index] });
    };

    return (
        <div className="App">
            <button onClick={onStartClick}>Start</button>
            <button onClick={onClearClick}>Clear Storage</button>
            <p>Select Response That will be used for next request</p>
            <List list={list} onClick={onClick} />
        </div>
    );
}

export default App;
