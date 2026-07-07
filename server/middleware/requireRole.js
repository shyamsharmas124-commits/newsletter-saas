const Membership = require("../models/Membership")

const ROLE_HIERARCHY = ["subscriber","editor", "owner"]

const requireRole = (minimumRole) =>{
    return async(req, res, next) =>{
        try{
            const{orgId} = req.params

            if(!orgId) {
                return res.status(400).json({message:"Organization ID is required"})
            }

            const membership = await Membership.findOne({
                user:req.user._id,
                organization: orgId,
            })

            if (!membership){
                return res.status(403).json({message:"Access denied"})
            }

            const userRoleIndex = ROLE_HIERARCHY.indexOf(membership.role)
            const requiredRoleIndex = ROLE_HIERARCHY.indexOf(minimumRole)

            if (userRoleIndex < 0 || requiredRoleIndex < 0 || userRoleIndex < requiredRoleIndex){
                return res.status(403).json({message:`This action requires the '${minimumRole}' role or above`})
            }

            req.membership = membership
            next()

        }catch(err){
            console.error("RBAC middleware error:", err.message)
            res.status(500).json({message:"Server error during authorization"})
        }
    }
}

module.exports = requireRole