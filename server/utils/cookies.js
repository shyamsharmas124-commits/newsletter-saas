const REFRESH_COOKIE_NAME = "refreshToken"

const refreshCookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV  === "production",
    sameSite: "lax",
    path:"/api/auth",
    maxAge: 7 * 24 * 60 * 1000 ,
}

const setRefreshCookie = (res,token)=>{
    res.cookie(REFRESH_COOKIE_NAME, token, refreshCookieOptions)
}

const clearRefreshCookie = (res) =>{
    res.clearCookie(REFRESH_COOKIE_NAME, {path: "/api/auth"})
}


module.exports={
    REFRESH_COOKIE_NAME,
    setRefreshCookie,
    clearRefreshCookie,
}

