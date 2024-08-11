import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const socket = io('http://localhost:3005'); // Adjust the URL if your server runs on a different address

function ChromePing() {
  const [pingResults, setPingResults] = useState([]);
  const [speed, setSpeed] = useState(0);
  const [effectiveType, setEffectiveType] = useState('-');
  const [rtt, setRtt] = useState(0);

  useEffect(() => {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

    const updateConnectionStatus = () => {
      const downlink = connection.downlink || 0;
      setSpeed(downlink);
      setEffectiveType(connection.effectiveType || '-');
    };

    if (connection) {
      connection.addEventListener('change', updateConnectionStatus);
      updateConnectionStatus();
    }

    socket.on('pingResult', (data) => {
      setPingResults((prevResults) => [...prevResults, data.message]);

      if (data.rtt) {
        setRtt(data.rtt);
      }
    });

    return () => {
      socket.off('pingResult');
      if (connection) {
        connection.removeEventListener('change', updateConnectionStatus);
      }
    };
  }, []);

  const calcAngle = (value) => {
    let angle = -90;
    if (value < 1.5) {
      angle = (value / 1.5) * 60 - 90;
    } else if (value > 1.5 && value < 6.5) {
      angle = (value / 6.5) * 90 - 90;
    } else if (value > 6.5 && value < 15) {
      angle = (value / 15) * 30;
    } else {
      angle = (value / 15) * 90;
    }
    return Math.round(angle);
  };

  const refreshSpeedOMeter = () => {
    setSpeed(0);
    setEffectiveType('-');
    setRtt(0);
  };

  const angle = calcAngle(speed);

  return (
    <div className="min-h-screen items-center flex justify-center p-6">
      <div className="bg-white mx-auto max-w-sm shadow-lg rounded-lg overflow-hidden border-r">
        <div className="block px-4 py-2 mb-6 leading-normal bg-grey-lighter flex flex-no-shrink">
          <h3 className="pl-2 text-left m-auto align-middle text-grey-darkest w-full">Internet Speedometer</h3>
          <button
            onClick={refreshSpeedOMeter}
            className="bg-grey-light float-right hover:bg-grey text-grey-darkest font-bold py-3 px-3 rounded-full inline-flex items-center"
          >
            <svg
              className="fill-current w-6 h-6 flex-no-shrink"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
            >
              <path d="M14.66 15.66A8 8 0 1 1 17 10h-2a6 6 0 1 0-1.76 4.24l1.42 1.42zM12 10h8l-4 4-4-4z" />
            </svg>
          </button>
        </div>
        <div className="items-center flex justify-center p-4">
          <div className="">
            <div className="speedometr">
              <div className="scale low"></div>
              <div className="scale middle"></div>
              <div className="scale hight"></div>
              <div id="arrow" className="arrow" style={{ transform: `rotate(${angle}deg)` }}></div>
            </div>
            <div id="counter" className="text-grey-darkest text-center text-base font-semibold pt-4 pb-0">
              {speed.toFixed(1)} Mbps
            </div>
          </div>
        </div>
        <div className="px-6 pt-0 pb-4 text-center">
          <span
            className="inline-block bg-grey-lighter rounded-full px-3 py-1 text-sm font-semibold text-grey-darker mr-2"
            id="effectiveType"
          >
            {effectiveType}
          </span>
          <span
            className="inline-block bg-grey-lighter rounded-full px-3 py-1 text-sm font-semibold text-grey-darker mr-2"
            id="rtt"
          >
            {rtt} milliseconds
          </span>
        </div>
        <div className="py-4 px-8 text-sm font-medium text-grey-darker bg-grey-lighter leading-normal">
          <p>
            Internet speed is calculated by <b>Chrome Network Information API</b>. Click{' '}
            <a
              href="https://developer.mozilla.org/en-US/docs/Web/API/Network_Information_API"
              target="_black"
            >
              here
            </a>{' '}
            to view the MDN docs. Note that this API is not supported by Firefox.
          </p>
        </div>
      </div>
    </div>
  );
}

export default ChromePing;
