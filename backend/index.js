const express = require("express");
const { exec } = require("child_process");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});
const port = 3005;
app.use(cors({ origin: "http://localhost:5173", methods: ["GET", "POST"] }));
let pingResults = [];

// Function to start pinging a given host
function startPinging(host) {
  const ping = exec(`ping ${host}`);

  ping.stdout.on("data", (data) => {
    const lines = data.split("\n");
    lines.forEach((line) => {
      if (line.includes("time=")) {
        const timeMatch = line.match(/time=([0-9.]+) ms/);
        if (timeMatch) {
          const time = parseFloat(timeMatch[1]);
          const result = {
            timestamp: new Date(),
            time: time,
            message: "Success",
          };
          pingResults.push(result);
          io.emit("pingResult", result);
        }
      } else if (line.includes("Request timeout")) {
        const result = {
          timestamp: new Date(),
          message: "Request timeout",
        };
        pingResults.push(result);
        io.emit("pingResult", result);
      } else if (line.includes("No route to host")) {
        const result = {
          timestamp: new Date(),
          message: "No route to host",
        };
        pingResults.push(result);
        io.emit("pingResult", result);
      }
    });
  });

  ping.stderr.on("data", (data) => {
    console.error(`stderr: ${data}`);
  });

  ping.on("close", (code) => {
    console.log(`ping process exited with code ${code}`);
    const result = {
      timestamp: new Date(),
      message: "Disconnected",
    };
    pingResults.push(result);
    io.emit("pingResult", result);
  });
}

// Route to get ping results
app.get("/ping-results", (req, res) => {
  res.json(pingResults);
});

// Start the server
server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);

  // Start pinging the given host
  const host = process.argv[2] || "google.com";
  console.log(`Pinging host: ${host}`);
  startPinging(host);
});

// Handle socket.io connections
io.on("connection", (socket) => {
  console.log("A user connected");
  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});
