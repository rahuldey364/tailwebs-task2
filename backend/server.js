const express = require("express")
// const {chats} = require("../backend/data/data")
const connectDB = require("../backend/database/connection")
const dotenv = require("dotenv")
const app = express()
const route = require("../backend/routes/route")
dotenv.config()

connectDB()
const PORT = process.env.PORT || 8080

app.use(express.json())
app.use(express.urlencoded({ extended: true }));

// app.get("/" , (req,res) => {
//     res.send("api is running")
// })

// app.get("/api/chat", (req,res) => {
//     res.send(chats)
// })

// app.get("/api/chat/:id", (req,res) => {
//     const uniqueChat = chats.find(c => c._id === req.params.id)
//     res.send(uniqueChat)
// })


app.use("/", route)

const server = app.listen(PORT, () => {
    console.log(`app running on ${PORT}`)
})

const io = require("socket.io")(server, {
    pingTimeout: 60000,
    cors: {
        origin: "http://localhost:3000"
    }
})

io.on("connection", (socket) => {
    console.log("Connected to socket.io");
    socket.on("setup", (userData) => {
        socket.join(userData._id)
        socket.emit("connected")
    })
    socket.on("join chat" ,(room) => {
        socket.join(room)
        console.log("user joined room :" , room)
    })
    socket.on("new message" ,(newMessageReceived) => {
        let chat = newMessageReceived.chat
        if(!chat.users) return console.log("chat.user not defined")
        chat.users.forEach((user) => {
            if(user._id ==newMessageReceived.sender._id) return
            socket.in(user._id).emit("message received" , newMessageReceived)
        })
    })

    socket.off("setup" , () => {
        console.log("user Disconnected")
    })
})
    