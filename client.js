// client.js
const net = require("net");
const readline = require("readline");

const PORT = 4000;
const HOST = "localhost";

const socket = net.createConnection({ host: HOST, port: PORT }, () => {
  console.log("Connected to chat server. Type commands below (e.g., LOGIN Nitin):");
});

socket.on("data", (data) => {
  console.log(data.toString().trim());
});

socket.on("end", () => {
  console.log("Disconnected from server.");
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.on("line", (line) => {
  socket.write(line + "\n");
});
