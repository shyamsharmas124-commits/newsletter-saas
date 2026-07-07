const express = require('express')
const router =  express.Router()

const {signup, login, refresh, logout} = require("../controllers/authController")
const requireAuth = require('../middleware/requireAuth')

router.post("/signup", signup)
router.post("/login", login)
router.post("/refresh", refresh)
router.post("/logout", logout)

router.get("/me", requireAuth, (req,res)=>{
    res.status(200).json({
        user:{id:req.user._id, name: req.user.name, email: req.user.email},
    })
})

module.exports = router;

