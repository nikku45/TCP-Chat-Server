# 💬 Simple Socket Chat Server

A lightweight multi-user **TCP Chat Server** built using **Node.js** and the standard `net` module.  
This project was created as part of a backend assignment to demonstrate understanding of **socket programming**, **concurrency**, and **real-time communication** without using HTTP or databases.

---

## 🚀 Features

✅ Multi-user chat support (5–10 simultaneous users)  
✅ Unique username login system  
✅ Real-time broadcast messaging  
✅ Graceful disconnect detection  
✅ Optional commands:
- `WHO` → list all active users  
- `DM <username> <text>` → send private messages  
- `PING` → server replies with `PONG`  
- Idle timeout (60 seconds of inactivity disconnects user)

---

## 🛠️ Tech Stack
- **Language:** Node.js  
- **Libraries:** Only the built-in `net` module (no external dependencies)

---

## ⚙️ Setup & Installation

### 1️⃣ Clone or download this repository
```bash
git clone <repo-url>
cd socket-chat-server
```


2️⃣ Run the chat server
```bash
node server.js
```


By default, it listens on port 4000.
You can also specify a custom port:

```bash
node server.js 5000
```


You should see:
```bash
Chat server listening on port 5000'
```

💻 How to Connect Clients
🟢 Option 1 — Using Node.js Client (Recommended)

If telnet or nc isn’t available, use the provided client.js file.

Run two clients in separate terminals:

If telnet or nc isn’t available, use the provided client.js file.

```bash
node client.js
```
Othewise

```bash
nc localhost 4000
```


You’ll see:
```bash
Connected to chat server. Type commands below (e.g., LOGIN Nitin):
```


| Command                | Description                   | Example                 |
| ---------------------- | ----------------------------- | ----------------------- |
| `LOGIN <username>`     | Log in with a unique username | `LOGIN Nitin`           |
| `MSG <text>`           | Broadcast message to everyone | `MSG Hello all!`        |
| `WHO`                  | List all active users         | `WHO`                   |
| `DM <username> <text>` | Send private message          | `DM Rahul hey bro`      |
| `PING`                 | Check server response         | `PING` → returns `PONG` |
