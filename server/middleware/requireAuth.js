const {verifyAccessToken} = require("../utils/tokens")
const User = require("../models/User")


const requireAuth = async(req,res,next) =>{
    try{
        const authHeader = req.headers.authorization || req.get("authorization")

        if ( !authHeader || !authHeader.startsWith("Bearer ")){
            return res.status(401).json({message:"No access token provided"})
        }

        const token =  authHeader.split(" ")[1]

        let decoded
        try{
            decoded = verifyAccessToken(token)
        }catch(err){
            return res.status(401).json({message:"Access token expires or invalid"})
        }

        const user = await User.findById(decoded.userId)
        if(!user){
            return res.status(401).json({message:"User no longer exists"})
        }

        req.user = user
        next()
    }catch(err){
        console.error("Auth middleware error:", err.message)
        return res.status(500).json({message:"Server error during authentication"})
    }
}

module.exports = requireAuth;


