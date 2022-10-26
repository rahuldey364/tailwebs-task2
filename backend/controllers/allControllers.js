const userModel = require("../Models/userModel")
const chatModel = require("../Models/chatModel")
const messageModel = require("../Models/messageModel")
const jwt = require("jsonwebtoken")

const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body
        // console.log(req.body)
        if (!name || !email || !password) return res.status(400).send({ status: false, message: "invalid name or email or pass" })
        const userExist = await userModel.findOne({ email: email })
        if (userExist) return res.status(400).send({ status: false, message: "user a;ready exist with this email" })

        const createUser = await userModel.create(req.body)

        const token = jwt.sign({ userId: createUser._id }, process.env.JWT_SECRET)

        res.status(201).json({
            _id: createUser._id,
            name: createUser.name,
            email: createUser.email,
            token: token
        })
    }
    catch (error) {
        console.log(error)
        return res.status(500).send({ status: false, message: error })
    }
}

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body
        console.log("req.body")
        if (!email || !password) return res.status(400).send({ status: false, message: "enter email or pass" })
        const userExist = await userModel.findOne({ email: email, password: password })
        if (!userExist) return res.status(400).send({ status: false, message: "no user exist with this email id or you have entered a wrong pw" })


        const token = jwt.sign({ userId: userExist._id }, process.env.JWT_SECRET)
        res.status(201).json(
            {
                _id: userExist._id,
                name: userExist.name,
                email: userExist.email,
                token: token
            }
        )
    }
    catch (error) {
        console.log(error)
        res.status(500).send({ status: false, message: error })
    }
}

const allUser = async (req, res) => {
    try {
        // console.log(req.query.search)
        const keyword = req.query.search
            ? {
                $or: [
                    { name: { $regex: req.query.search, $options: "i" } },
                    { email: { $regex: req.query.search, $options: "i" } },
                ],
            }
            : {};

        const users = await userModel.find(keyword).find({ _id: { $ne: req.user._id } });
        res.send(users);

    } catch (error) {
        res.status(500).send({ status: false, message: error })
    }
}

const accessChat = async (req, res) => {
    try {
        const { userId } = req.body
        if (!userId) return res.status(400).send({ ststus: false, message: "no userId" })

        let isChat = await chatModel.find({ $and: [{ users: { $elemMatch: { $eq: req.user._id } } }, { users: { $elemMatch: { $eq: userId } } }] }).populate("users", "-password").populate("latestMessage")

        isChat = await userModel.populate(isChat, {
            path: "latestMessage.sender",
            select: "name pic email"
        })

        if (isChat.length > 0) {
            return res.send(isChat[0])
        }

        const chatData = {
            chatName: "sender",
            users: [req.user._id, userId]
        }

        const createdChat = await chatModel.create(chatData)
        const fullChat = await chatModel.findOne({ _id: createdChat._id }).populate("users", "-password")

        res.status(200).send(fullChat)

    } catch (error) {
        res.status(500).send({ status: false, message: error })
    }
}

const fetchChats = async (req, res) => {
    try {
        const findChats = await chatModel.find({ users: { $elemMatch: { $eq: req.user._id } } }).populate("users", "-password").populate("latestMessage").sort({ updatedAt: -1 })
        const result = await userModel.populate(findChats, {
            path: "latestMessage.sender",
            select: "name pic email"
        })
        res.status(200).send(result)
    } catch (error) {
        res.status(500).send({ status: false, message: error })
    }
}

const sendMessage = async (req, res) => {
    try {
        const { content, chatId } = req.body

        if (!content || !chatId) return res.status(400).send({ ststus: false, message: "chatid and content is required" })

        const newMessage = {
            sender: req.user._id,
            content: content,
            chat: chatId
        }
        let message = await messageModel.create(newMessage)
        message = await message.populate("sender", "name pic")
        message = await message.populate("chat")
        message = await userModel.populate(message, {
            path: "chat.users",
            select: "name pic email"
        })
        // console.log(message)
        await chatModel.findByIdAndUpdate(chatId, {
            latestMessage: message
        })
        res.json(message)

    } catch (error) {
        console.log(error)
        res.status(500).send({ status: false, message: error })
    }
}

const allMessages = async (req,res) => {
    try {
        const messages = await messageModel.find({chat:req.params.chatId}).populate("sender" , "name pic email").populate("chat")
        res.json(messages)
    } catch (error) {
        res.status(500).send({ status: false, message: error })
    }
}

module.exports = { registerUser, loginUser, allUser, accessChat, fetchChats, sendMessage , allMessages }