const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { authenticateToken, authorizeRole } = require("../middleware/authMiddleware");

// Get all builder invitations
router.get("/invitations", authenticateToken, authorizeRole("admin"), async (req, res) => {
  try {
    // Find all users with invitation tokens (pending invitations)
    const pendingInvitations = await User.find({ 
      invitationToken: { $exists: true, $ne: null },
      active: false
    }).select("-password").sort({ createdAt: -1 });
    
    // Format the response
    const invitations = pendingInvitations.map(invitation => ({
      id: invitation._id,
      builderName: invitation.username,
      email: invitation.email || null,
      phone: invitation.phone || null,
      createdAt: invitation.createdAt,
      invitationExpires: invitation.invitationExpires,
      status: new Date() > invitation.invitationExpires ? "Expired" : "Pending",
      invitationLink: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/builder-signup?token=${invitation.invitationToken}`
    }));
    
    res.json(invitations);
  } catch (error) {
    console.error("Error fetching invitations:", error);
    res.status(500).json({ message: "Failed to fetch invitations" });
  }
});

// Delete an invitation
router.delete("/invitations/:id", authenticateToken, authorizeRole("admin"), async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await User.findByIdAndDelete(id);
    
    if (!result) {
      return res.status(404).json({ message: "Invitation not found" });
    }
    
    res.json({ message: "Invitation deleted successfully" });
  } catch (error) {
    console.error("Error deleting invitation:", error);
    res.status(500).json({ message: "Failed to delete invitation" });
  }
});

// Send invitation email
router.post("/send-invitation-email", authenticateToken, authorizeRole("admin"), async (req, res) => {
  try {
    const { invitationId, email } = req.body;
    
    if (!invitationId || !email) {
      return res.status(400).json({ message: "Invitation ID and email are required" });
    }
    
    // Find the invitation
    const invitation = await User.findById(invitationId);
    
    if (!invitation || !invitation.invitationToken) {
      return res.status(404).json({ message: "Invitation not found" });
    }
    
    // Here you would integrate with your email service to send the invitation
    // For example, using nodemailer or a service like SendGrid
    
    // For now, we'll just simulate a successful email send
    console.log(`Sending invitation to ${email} with token ${invitation.invitationToken}`);
    
    // Update the invitation with the email if not already set
    if (!invitation.email) {
      invitation.email = email;
      await invitation.save();
    }
    
    res.json({ message: "Invitation email sent successfully" });
  } catch (error) {
    console.error("Error sending invitation email:", error);
    res.status(500).json({ message: "Failed to send invitation email" });
  }
});

// Get all builders (for admin dashboard)
router.get("/builders", authenticateToken, authorizeRole("admin"), async (req, res) => {
  try {
    const builders = await User.find({ 
      role: "builder",
      active: true
    }).select("-password").sort({ fullName: 1 });
    
    res.json(builders);
  } catch (error) {
    console.error("Error fetching builders:", error);
    res.status(500).json({ message: "Failed to fetch builders" });
  }
});

module.exports = router; 