const bcrypt = require("bcryptjs");
const User = require("../models/User");

const {
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken,
} = require("../utils/tokens");

const { setRefreshCookie, clearRefreshCookie } = require("../utils/cookies");

// SIGNUP (POST)
const signup = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                message: "All fields are required",
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                message: "Password must be at least 8 characters long",
            });
        }

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(409).json({
                message: "Email already in use",
            });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
        });

        const accessToken = generateAccessToken(user._id);
        const refreshToken = generateRefreshToken(user._id);

        setRefreshCookie(res, refreshToken);

        return res.status(201).json({
            accessToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
            },
        });
    } catch (err) {
        console.error("Signup error:", err);

        return res.status(500).json({
            message: "Server error during signup",
        });
    }
};

// LOGIN (POST)

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password required",
            });
        }

        const user = await User.findOne({ email }).select("+password");

        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password",
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({
                message: "Invalid email or password",
            });
        }

        const accessToken = generateAccessToken(user._id);
        const refreshToken = generateRefreshToken(user._id);

        setRefreshCookie(res, refreshToken);

        return res.status(200).json({
            accessToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
            },
        });
    } catch (err) {
        console.error("Login error:", err);

        return res.status(500).json({
            message: "Server error during login",
        });
    }
};

//REFRESH (POST)    used when the forntend access token has expired

const refresh = async (req, res) => {
    try {
        const token = req.cookies?.refreshToken;

        if (!token) {
            return res.status(401).json({
                message: "No refresh token provided",
            });
        }

        let decoded;

        try {
            decoded = verifyRefreshToken(token);
        } catch (err) {
            clearRefreshCookie(res);

            return res.status(401).json({
                message: "Invalid or expired refresh token",
            });
        }

        const user = await User.findById(decoded.userId);

        if (!user) {
            clearRefreshCookie(res);

            return res.status(401).json({
                message: "User no longer exists",
            });
        }

        const newAccessToken = generateAccessToken(user._id);
        const newRefreshToken = generateRefreshToken(user._id);

        setRefreshCookie(res, newRefreshToken);

        return res.status(200).json({
            accessToken: newAccessToken,
        });
    } catch (err) {
        console.error("Refresh error:", err);

        return res.status(500).json({
            message: "Server error during token refresh",
        });
    }
};

//LOGOT (POST)

const logout = (req, res) => {
    clearRefreshCookie(res);

    return res.status(200).json({
        message: "Logged out successfully",
    });
};

module.exports = {
    signup,
    login,
    refresh,
    logout,
};