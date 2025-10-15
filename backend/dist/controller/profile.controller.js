import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { CacheService } from "../services/cacheService.js";
const prisma = new PrismaClient();
// Get user profile data
export const getUserProfile = async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        if (!userId) {
            return res.status(400).json({ error: "User ID is required" });
        }
        // Try to get cached profile data first
        const cacheKey = `profile:${userId}`;
        const cachedProfile = await CacheService.get(cacheKey);
        if (cachedProfile) {
            console.log("📦 Profile data served from cache");
            return res.json(cachedProfile);
        }
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                userSkills: {
                    include: {
                        skill: true
                    }
                }
            }
        });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        const profileData = {
            id: user.id,
            firstName: user.Firstname,
            lastName: user.Lastname,
            email: user.email,
            bio: user.bio || undefined,
            experienceLevel: user.experienceLevel,
            avatar: user.avatar || undefined,
            phoneNumber: user.phoneNumber || undefined,
            location: user.location || undefined,
            linkedinProfile: user.linkedinProfile || undefined,
            githubProfile: user.githubProfile || undefined,
            portfolioWebsite: user.portfolioWebsite || undefined,
            timezone: user.timezone || "UTC",
            emailNotifications: user.emailNotifications,
            pushNotifications: user.pushNotifications,
            interviewReminders: user.interviewReminders,
            weeklyReports: user.weeklyReports,
            marketingEmails: user.marketingEmails,
            skillTags: user.userSkills.map(us => us.skill.name),
            createdAt: user.createdAt,
            lastLoginAt: user.lastLoginAt || undefined
        };
        // Cache the profile data for future requests
        await CacheService.set(cacheKey, profileData, 1800); // 30 minutes cache
        console.log("💾 Profile data cached successfully");
        res.json(profileData);
    }
    catch (error) {
        console.error("Error fetching user profile:", error);
        res.status(500).json({
            error: "Failed to fetch user profile",
            details: error instanceof Error ? error.message : "Unknown error"
        });
    }
};
// Update user profile
export const updateUserProfile = async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        const updateData = req.body;
        if (!userId) {
            return res.status(400).json({ error: "User ID is required" });
        }
        // Validate experience level if provided
        if (updateData.experienceLevel && !["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"].includes(updateData.experienceLevel)) {
            return res.status(400).json({ error: "Invalid experience level" });
        }
        // Update user profile
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                ...(updateData.firstName && { Firstname: updateData.firstName }),
                ...(updateData.lastName && { Lastname: updateData.lastName }),
                ...(updateData.bio !== undefined && { bio: updateData.bio }),
                ...(updateData.experienceLevel && { experienceLevel: updateData.experienceLevel }),
                ...(updateData.phoneNumber !== undefined && { phoneNumber: updateData.phoneNumber }),
                ...(updateData.location !== undefined && { location: updateData.location }),
                ...(updateData.linkedinProfile !== undefined && { linkedinProfile: updateData.linkedinProfile }),
                ...(updateData.githubProfile !== undefined && { githubProfile: updateData.githubProfile }),
                ...(updateData.portfolioWebsite !== undefined && { portfolioWebsite: updateData.portfolioWebsite }),
                ...(updateData.timezone && { timezone: updateData.timezone }),
                updatedAt: new Date()
            }
        });
        // Invalidate cached profile data after update
        const cacheKey = `profile:${userId}`;
        await CacheService.delete(cacheKey);
        await CacheService.invalidateDashboardCache(userId.toString());
        console.log("🗑️ Profile cache invalidated after update");
        res.json({
            message: "Profile updated successfully",
            user: {
                id: updatedUser.id,
                firstName: updatedUser.Firstname,
                lastName: updatedUser.Lastname,
                email: updatedUser.email,
                bio: updatedUser.bio,
                experienceLevel: updatedUser.experienceLevel
            }
        });
    }
    catch (error) {
        console.error("Error updating user profile:", error);
        res.status(500).json({
            error: "Failed to update user profile",
            details: error instanceof Error ? error.message : "Unknown error"
        });
    }
};
// Update notification settings
export const updateNotificationSettings = async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        const notificationData = req.body;
        if (!userId) {
            return res.status(400).json({ error: "User ID is required" });
        }
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                ...(notificationData.emailNotifications !== undefined && { emailNotifications: notificationData.emailNotifications }),
                ...(notificationData.pushNotifications !== undefined && { pushNotifications: notificationData.pushNotifications }),
                ...(notificationData.interviewReminders !== undefined && { interviewReminders: notificationData.interviewReminders }),
                ...(notificationData.weeklyReports !== undefined && { weeklyReports: notificationData.weeklyReports }),
                ...(notificationData.marketingEmails !== undefined && { marketingEmails: notificationData.marketingEmails }),
                updatedAt: new Date()
            }
        });
        // Invalidate cached profile data after notification update
        const cacheKey = `profile:${userId}`;
        await CacheService.delete(cacheKey);
        console.log("🗑️ Profile cache invalidated after notification update");
        res.json({
            message: "Notification settings updated successfully",
            notifications: {
                emailNotifications: updatedUser.emailNotifications,
                pushNotifications: updatedUser.pushNotifications,
                interviewReminders: updatedUser.interviewReminders,
                weeklyReports: updatedUser.weeklyReports,
                marketingEmails: updatedUser.marketingEmails
            }
        });
    }
    catch (error) {
        console.error("Error updating notification settings:", error);
        res.status(500).json({
            error: "Failed to update notification settings",
            details: error instanceof Error ? error.message : "Unknown error"
        });
    }
};
// Change password
export const changePassword = async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        const { currentPassword, newPassword } = req.body;
        if (!userId) {
            return res.status(400).json({ error: "User ID is required" });
        }
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: "Current password and new password are required" });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ error: "New password must be at least 6 characters long" });
        }
        // Get current user
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        // Verify current password
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isCurrentPasswordValid) {
            return res.status(400).json({ error: "Current password is incorrect" });
        }
        // Hash new password
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        // Update password
        await prisma.user.update({
            where: { id: userId },
            data: {
                password: hashedNewPassword,
                updatedAt: new Date()
            }
        });
        res.json({ message: "Password changed successfully" });
    }
    catch (error) {
        console.error("Error changing password:", error);
        res.status(500).json({
            error: "Failed to change password",
            details: error instanceof Error ? error.message : "Unknown error"
        });
    }
};
// Update user skills
export const updateUserSkills = async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        const { skillTags } = req.body;
        if (!userId) {
            return res.status(400).json({ error: "User ID is required" });
        }
        if (!Array.isArray(skillTags)) {
            return res.status(400).json({ error: "skillTags must be an array" });
        }
        // Remove all existing user skills
        await prisma.userSkill.deleteMany({
            where: { userId }
        });
        // Add new skills
        for (const skillName of skillTags) {
            // Find or create skill
            let skill = await prisma.skillTag.findFirst({
                where: { name: skillName }
            });
            if (!skill) {
                skill = await prisma.skillTag.create({
                    data: { name: skillName }
                });
            }
            // Create user skill relationship
            await prisma.userSkill.create({
                data: {
                    userId,
                    skillId: skill.id
                }
            });
        }
        // Invalidate cached profile and dashboard data after skills update
        const cacheKey = `profile:${userId}`;
        await CacheService.delete(cacheKey);
        await CacheService.invalidateDashboardCache(userId.toString());
        console.log("🗑️ Profile and dashboard cache invalidated after skills update");
        res.json({
            message: "Skills updated successfully",
            skillTags
        });
    }
    catch (error) {
        console.error("Error updating user skills:", error);
        res.status(500).json({
            error: "Failed to update user skills",
            details: error instanceof Error ? error.message : "Unknown error"
        });
    }
};
// Upload avatar (placeholder for file upload)
export const uploadAvatar = async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        // This would typically handle file upload logic
        // For now, we'll just return a placeholder response
        res.json({
            message: "Avatar upload endpoint - implement file upload logic",
            userId
        });
    }
    catch (error) {
        console.error("Error uploading avatar:", error);
        res.status(500).json({
            error: "Failed to upload avatar",
            details: error instanceof Error ? error.message : "Unknown error"
        });
    }
};
// Delete account
export const deleteAccount = async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        if (!userId) {
            return res.status(400).json({ error: "User ID is required" });
        }
        // In a real application, you might want to soft delete instead
        // For now, this is a hard delete - use with caution!
        await prisma.user.update({
            where: { id: userId },
            data: {
                isActive: false,
                updatedAt: new Date()
            }
        });
        res.json({ message: "Account deactivated successfully" });
    }
    catch (error) {
        console.error("Error deleting account:", error);
        res.status(500).json({
            error: "Failed to delete account",
            details: error instanceof Error ? error.message : "Unknown error"
        });
    }
};
