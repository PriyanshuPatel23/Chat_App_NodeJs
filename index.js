const express = require("express");
const http = require("http");
const socketio = require("socket.io");

const connect = require("./config/database_config");
const chat = require("./models/chat-model");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.set("view engine", "ejs");

app.use("/", express.static(__dirname + "/public"));

app.get("/chat/:roomid", async (req, res) => {
  const chats = await chat
    .find({
      roomid: req.params.roomid,
    })
    .select("content user");
  res.render("index", {
    name: "Priyanshu",
    id: req.params.roomid,
    chats: chats,
  });
});

io.on("connection", (socket) => {
  console.log("a user connected", socket.id);

  socket.on("join_room", (data) => {
    console.log("joining a room", data.roomid);
    socket.join(data.roomid);
  });

  socket.on("msg_sent", async (data) => {
    console.log(data);
    const Chat = await chat.create({
      roomId: data.roomid,
      user: data.username,
      constent: data.msg,
    });
    io.to(data.roomid).emit("msg_rcvd", data);
    socket.emit("msg_rcvd", data);
    socket.broadcast.emit("msg_rcvd", data);
  });

  socket.on("typing", (data) => {
    socket.broadcast.to(data.roomid).emit("someone_typing");
  });
});

server.listen(3000, async () => {
  console.log("SERVER STARTED ON PORT 3000");
  await connect();
  console.log("Mongodb connected");
});
