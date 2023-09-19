import { useEffect } from 'react';

export default function WorkerComponent() {
    useEffect(() => {
        const worker = new Worker('/worker.js');

        // Send a message to start the worker
        worker.postMessage('start');

        return () => {
            // Terminate the worker when the component unmounts
            worker.terminate();
        };
    }, []);

    return (
        <></>
    );
}