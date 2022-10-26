const express = require("express")
const router = express.Router()
const allControllers = require("../controllers/allControllers")
const auth = require("../middlewares/auth")

router.post("/api/user" , allControllers.registerUser)
router.get("/api/user" , auth.protect ,allControllers.allUser)
router.post("/api/user/login" , allControllers.loginUser)

router.post("/api/chat" , auth.protect , allControllers.accessChat )
router.get("/api/chat" , auth.protect , allControllers.fetchChats )

router.post("/api/message" , auth.protect , allControllers.sendMessage )
router.get("/api/message/:chatId" , auth.protect , allControllers.allMessages)

module.exports = router