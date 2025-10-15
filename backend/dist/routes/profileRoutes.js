import express from "express";
import { getUserProfile, updateUserProfile, updateNotificationSettings, changePassword, updateUserSkills, uploadAvatar, deleteAccount } from "../controller/profile.controller.js";
const router = express.Router();
// Get user profile
router.get("/user/:userId", getUserProfile);
// Update user profile
router.put("/user/:userId", updateUserProfile);
// Update notification settings
router.put("/user/:userId/notifications", updateNotificationSettings);
// Change password
router.put("/user/:userId/password", changePassword);
// Update user skills
router.put("/user/:userId/skills", updateUserSkills);
// Upload avatar
router.post("/user/:userId/avatar", uploadAvatar);
// Delete/deactivate account
router.delete("/user/:userId", deleteAccount);
export default router;
