import { Router } from "express";
import { registerUser, loginUser, logoutUser, getCurrentUser, } from "../controller/auth.controller.js";
const router = Router();
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);
router.get("/me", getCurrentUser);
export default router;
