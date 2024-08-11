import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:3005"); // Adjust the URL if your server runs on a different address

function App() {
  const [pingResults, setPingResults] = useState([]);
  const [speed, setSpeed] = useState<any>(null);
  const [angle, setAngle] = useState(0);
  const [effectiveType, setEffectiveType] = useState("-");
  const [rtt, setRtt] = useState(0);
  const [averagePing, setAveragePing] = useState(0);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    socket.on("pingResult", (data) => {
      const { timestamp, time, message } = data as any;

      if (message === "Request timeout") {
        setError(message + ". Your connection may be unstable");
        return;
      }
      if (message === "No route to host") {
        setError(message + ". Your connection is severed");
        return;
      }
      setPingResults((prevResults) => {
        const newResults = [...prevResults, data];
        const sortedResults = newResults.sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        const totalPing = sortedResults.reduce((acc, curr) => acc + curr.time, 0);
        setAveragePing(totalPing / sortedResults.length);
        return sortedResults;
      });
      setError(null);
      // Simulate updating speed and RTT for the demo
      setSpeed(calcSpeed(time));
      setEffectiveType("4g");
      setRtt(time);
      const angle = calcAngle(time);
      setAngle(angle);
    });
    socket.on("disconnect", () => {
      setPingResults([]);
      setError("Backend Disconnected");
    });
    return () => {
      socket.off("pingResult");
    };
  }, []);

  const calcAngle = (value: number) => {
    let angle = -90;
    if (value < 51) {
      angle = (value / 60) * 100 - 90;
    } else if (value > 50 && value < 151) {
      angle = (value / 120) * 100 - 90;
    } else if (value > 151 && value < 251) {
      angle = (value / 180) * 100 - 90;
    } else {
      angle = (value / 360) * 100 - 90;
    }
    return Math.round(angle);
  };
  const calcSpeed = (time: number) => {
    if (time < 51) {
      return "Good";
    } else if (time > 50 && time < 151) {
      return "Average";
    } else if (time > 151 && time < 251) {
      return "Bad";
    } else {
      return "Very bad";
    }
  };
  const refreshSpeedOMeter = () => {
    setSpeed("null");
    setEffectiveType("-");
    setRtt(0);
    setAngle(-90);
    setPingResults([]);
    setAveragePing(0);
  };

  return (
    <div className="min-h-screen items-center flex justify-center lg:p-6">
      <div className="bg-white w-full min-h-screen lg:max-w-6xl mx-auto shadow-lg rounded-lg overflow-hidden border-r">
        <div className="px-4 py-2 mb-6 leading-normal bg-gray-200 flex shrink-0">
          <h3 className="pl-2 text-left m-auto align-middle text-gray-800 w-full">
            Ping Speedometer
          </h3>
          <button
            onClick={refreshSpeedOMeter}
            className="bg-gray-100 float-right hover:bg-gray-50 text-gray-800 font-bold py-3 px-3 rounded-full inline-flex items-center"
          >
            <img
              src="/rotate-clockwise.svg"
              alt="Refresh"
              className="w-4 h-4"
            />
          </button>
        </div>

        <div className="items-center flex flex-col justify-center p-4">
            <div className="speedometr">
              <div className="scale low"></div>
              <div className="scale hight"></div>
              <div className="scale middle"></div>
              <div
                id="arrow"
                className="arrow"
                style={{ transform: `rotate(${angle}deg)` }}
              ></div>
            </div>
            <div
              id="counter"
              className="text-gray-800 text-center text-base font-semibold pt-4 pb-0"
            >
              {!error ? (
                `${speed} ping`
              ) : (
                <p className="text-red-500">{error}</p>
              )}
            </div>
        </div>

        <div className="px-6 pt-0 pb-4 text-center flex justify-center flex-wrap">
          <span
            className="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-800 mr-2"
            id="effectiveType"
          >
            {effectiveType}
          </span>
          <span
            className="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-800 mr-2"
            id="rtt"
          >
            Latest: {rtt} milliseconds
          </span>
          <span
            className="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-800 mr-2"
            id="averagePing"
          >
            Average Ping: {averagePing.toFixed(2)} ms
          </span>
        </div>

        <div className="px-6 py-3 max-w-2xl mx-auto flex flex-col gap-3 items-center justify-center bg-gray-100 bg-opacity-50 rounded-xl shadow-lg">
          <div className="text-gray-800 text-xl font-extrabold">
            <p>Ping Results</p>
          </div>
          <div className="flex justify-between w-full">
            <p className="font-bold">TimeStamp</p>
            <p className="font-bold">Ping (TTL)</p>
          </div>
          <div className="w-full max-h-96 overflow-y-scroll border px-2 py-3 rounded-xl">
            {pingResults.map((result: any, index: number) => (
              <div key={index} className="flex justify-between w-full">
                <p>{new Date(result.timestamp as number).toLocaleString()}</p>
                <p>{result.time} ms</p>
              </div>
            ))}
          </div>
          <div>
            <div className="flex justify-center gap-3">
              <p>0-50: Good</p>
              <p>51-150: Average</p>
              <p>151-250: Bad</p>
              <p>251-350: Very Bad</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
