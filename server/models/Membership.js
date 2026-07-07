const mongoose = require("mongoose");

const membershipSchema = new mongoose.Schema(
    {
        user:{
            type: mongoose.Schema.Types.ObjectId,
            ref:"User",
            required:true,

        },
        organization:{
            type: mongoose.Schema.Types.ObjectId,
            ref:"Organization",
            required:true,
        },
        role:{
            type:String,
            enum:["owner", "editor", "subscriber"],
            default:"subscriber",
            required:true,
        },
    },
    {timestamps:true}
)

membershipSchema.index({ user: 1, organization: 1 }, { unique: true });

module.exports = mongoose.model("Membership", membershipSchema);