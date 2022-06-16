import React, { useEffect, useState } from 'react';
import List from './components/List';
import { Runtime, Storage, ResponsesStorage } from '../APIs';

function App() {
    const [list, setList] = useState([]);
    const [requestId, setRequestId] = useState(null);
    const [isManual, setIsManual] = useState(false);

    useEffect(() => {
        (async () => {
            const data = await ResponsesStorage.getCached();
            console.log(data);
            const keys = Object.keys(data);
            setList(keys);
            const manual = await Storage.get('manual');
            setIsManual(manual);
        })();
        Storage.addChangedListener(async (_changes) => {
            const data = await Storage.get();
            setList(data);
        });
        Runtime.addMessageListener(async (message) => {
            if (message.requestId) {
                setRequestId(message.requestId);
            }
        });
    }, []);

    useEffect(() => {
        (async () => await Storage.set('manual', isManual))();
    }, [isManual]);

    const onStartClick = () => {
        Runtime.invokeFunction('start');
    };

    const onClearClick = () => {
        Runtime.invokeFunction('clear');
    };

    const onManualClick = () => {
        setIsManual(!isManual);
    };

    const onClick = (index) => {
        Runtime.invokeFunction('respond', [requestId, list[index]]);
    };

    return (
        <div className="App">
            <button onClick={onStartClick}>Start</button>
            <button style={{ backgroundColor: isManual ? 'green' : 'gray' }} onClick={onManualClick}>Manual</button>
            <button onClick={onClearClick}>Clear Storage</button>
            <div>Select Response That will be used for next request</div>
            <div>{requestId}</div>
            {/* <List list={list} onClick={onClick} /> */}
        </div>
    );
}

export default App;
