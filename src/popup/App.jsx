import React, { useEffect, useState } from 'react';
import List from './components/List';
import { Runtime, Storage, ResponsesStorage } from '../APIs';
import './App.scss';

function App() {
    const [list, setList] = useState([]);
    const [requestId, setRequestId] = useState(null);
    const [isManual, setIsManual] = useState(false);

    useEffect(() => {
        (async () => {
            const data = await ResponsesStorage.getCached();
            if (data) {
                setList(Object.keys(data));
            } else {
                setList([]);
            }
            const manual = await Storage.get('manual');
            setIsManual(manual['manual']);
        })();
        Storage.addChangedListener(async (changes) => {
            if (changes) {
                const data = await ResponsesStorage.getCached();
                if (data) {
                    const keys = Object.keys(data);
                    setList(keys);
                }
            }
        });
        Runtime.addMessageListener(async (message) => {
            if (message.requestId) setRequestId(message.requestId);
        });
    }, []);

    const onStartClick = () => {
        Runtime.invokeFunction('start');
    };

    const onClearClick = () => {
        Runtime.invokeFunction('clear');
    };

    const onManualClick = async () => {
        await Storage.set('manual', !isManual);
        setIsManual(!isManual);
    };

    const onClick = (index) => {
        Runtime.invokeFunction('respond', [requestId, list[index]]);
    };

    return (
        <div className="App">
            <button onClick={onStartClick}>Start</button>
            <button className={isManual ? 'enabled' : 'disabled'} onClick={onManualClick}>Manual</button>
            <button onClick={onClearClick}>Clear Storage</button>
            <hr style={{ marginTop: '1em' }}/>
            <div>
                { isManual && <div>Select Response for {requestId}:</div> }
                <List active={isManual} list={list} onClick={onClick} />
            </div>
        </div>
    );
}

export default App;
