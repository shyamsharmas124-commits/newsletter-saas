const express = require('express')
const router = express.Router()
const requireAuth = require("../middleware/requireAuth")
const requireRole = require("../middleware/requireRole")

const{
    createOrganization,
    getMyOrganizations,
    getOrganization,
    inviteMember,
    getMember,
    changeMemberRole,
    removeMember,
    getMembers,
} = require("../controllers/orgController")

router.use(requireAuth);

router.post("/", createOrganization)
router.get("/mine", getMyOrganizations)

router.get("/:orgId", requireRole("subscriber"), getOrganization);
router.get("/:orgId/members", requireRole("subscriber"), getMembers);
router.post("/:orgId/invites", requireRole("editor"), inviteMember);
router.patch("/:orgId/members/:userId/role", requireRole("owner"), changeMemberRole);
router.delete("/:orgId/members/:userId", requireRole("owner"), removeMember);

module.exports = router;