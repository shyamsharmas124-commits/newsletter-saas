const Organization = require("../models/Organization")
const Membership = require("../models/Membership");
const User = require("../models/User")





const createOrganization = async(req, res) =>{
    try{
        const {name, slug} = req.body;

        if(!name || !slug){
            return res.status(400).json({message:"Name and slug are required"})
        }

        const slugRegex = /^[a-z0-9-]+$/;
        if(!slugRegex.test(slug)){
            return res.status(400).json({message:"Slug can only contain lowercase letters, numbers, and hyphens"})
        }

        const exisitngOrg = await Organization.findOne({slug})
        if ( exisitngOrg){
            return res.status(409).json({message:"Slug already taken"})
        }

        const org = await Organization.create({
            name,
            slug,
            owner: req.user._id,

        })

        await Membership.create({
            user: req.user._id,
            organization: org._id,
            role: "owner"

        })

        res.status(201).json({organization:org})
    }catch(err){
        console.error("Create org error:", err.message)
        res.status(500).json({message:"Server error creating organization"})
    }
}







const getMyOrganizations =  async(req,res)=>{
    try{
        const membership = await Membership.find({user: req.user._id})
            .populate("organization")
            .lean()

        const organizations = membership.map((m)=>({
            ...m.organization,
            role: m.role
        }))

        res.status(200).json({organizations})
    }catch(err){
        console.error("Get orgs error", err.message)
        res.status(500).json({message:"Server error fetching organizations"})
    }

}







const getOrganization = async(req,res)=>{
    try{
        const org = await Organization.findById(req.params.orgId).lean()
        if(!org){
            return res.status(404).json({message:"Organization not found"})
        }

        res.status(200).json({organization:org, role: req.membership.role})
    }catch(err){
        console.error("Get org error:", err.message)
        res.status(500).json({message:"Server error fetching organization"})
    }
}








const inviteMember = async (req,res) =>{
    try{
        const {email, role} = req.body
        if ( !email || ! role){
            return res.status(400).json({message:"Email and role are required"})
        }

        const validRoles = ["editor", "subscriber"]
        if(!validRoles.includes(role)){
            return res.status(400).json({message:"Role must be 'editor or 'subscriber'. Cannot invite that email"})
        }

        const userToInvite = await User.findOne({email})
        if (!userToInvite){
            return res.status(404).json({message:"No user found with that email"})
        }

        const membership = await Membership.create({
            user: userToInvite._id,
            organization: req.params.orgId,
            role,

            
        })

        res.status(201).json({message:`${userToInvite.name} added as ${role}`, membership})

    }catch(err){
        console.error("Invite member erros:", err.message)
        res.status(500).json({message:"Server error inviting member"})
    }
}





const getMembers = async(req,res) =>{
    try{
        const memberships = await Membership.find({
            organization: req.params.orgId,
        })

            .populate("user", "name email")
            .lean();

        const members = memberships.map((m)=>({
            id: m.user._id,
            name: m.user.name,
            emai: m.user.email,
            role: m.role,
            joinedAt: m.createdAt,
        }));

        res.status(200).json({members})
    }catch(err){
        console.error("Get members error:", err.message)
        res.status(500).json({message:"Server error fetching members"})
    }
}






const changeMemberRole = async(req,res) =>{
    try{
        const {role} = req.body;
        const {orgId, userId} = req.params;

        const validRoles = ["editor", "subscriber"]
        if(!validRoles.includes(role)){
            return res.status(400).json({message:"Can only change role to 'editor' or 'subscriber'",})

        }

        if ( userId === req.user._id.toString()){
            return res.status(400).json({message:"You cannot change your own role"})
        }

        const membership = await Membership.findOneAndUpdate(
            {user: userId, organization: orgId},
            {role},
            {new:true}
            
        );

        if(!membership){
            return res.status(404).json({message:"Membership not found"})
        }

        return res.status(200).json({message:"Role updated", membership})
    }catch(err){
        console.error("Change role error:", err.message)
        res.status(500).json({message:"Server error changing role"})

    }
    
}








const removeMember = async(req, res) =>{
    try{
        const {orgId, userId} = req.params

        if(userId === req.user._id.toString()){
            return res.status(400).json({message:"You cannot remove yourself"})
        }

        const membership = await Membership.findOneAndDelete({
            user:userId,
            organization:orgId,
        })

        if(!membership){
            return res.status(404).json({message:"Membership not found"})
        }

        res.status(200).json({message:"Member removed"})
    }catch(err){
        console.error("Remove member error:", err.message)
        res.status(500).json({message:"Server error removing member"})
    }



}


module.exports={
    createOrganization,
    getMyOrganizations,
    getOrganization,
    inviteMember,
    getMembers,
    changeMemberRole,
    removeMember,
};

