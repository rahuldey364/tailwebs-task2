const jwt = require("jsonwebtoken");
const userModel = require("../Models/userModel");

const protect = async (req, res, next) => {

    try {
        const token = req.headers.authorization
        if(!token) return res.send({status:false,message:"token required"})

        //decodes token id
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = await userModel.findById(decoded.userId).select("-password");

        next();
    } catch (error) {

    }
}
module.exports = {protect}