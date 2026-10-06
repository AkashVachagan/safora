import express from "express";
import crypto from "crypto";
import fs from "fs";
import tokenVerification from "../middleware/tokenVerify.js";
import { sendSms } from "../utils/sms.js";

const router = express.Router();
router.use(tokenVerification);
router.use((req, res, next) => req.portal === "user" ? next() : res.status(403).json({ error: "User portal account required" }));

router.post("/", (req, res) => {
    const tokens = JSON.parse(fs.readFileSync("./jwt/token.json", "utf-8"));
    const token = crypto.randomUUID();
    tokens.push({ user_id: req.user_id, portal: req.portal, token, expiresAt: null, device: true });
    fs.writeFileSync("./jwt/token.json", JSON.stringify(tokens, null, 2));
    const users = JSON.parse(fs.readFileSync("./user/userInfo.json", "utf-8"));
    const user = users.find((entry) => entry.user_id === req.user_id);
    if (user?.phone) {
        void sendSms(`Bearer ${token}`, [user.phone]).catch((error) => console.error(`Could not SMS the phone token to ${user.name}: ${error.message}`));
    }
    return res.status(201).json({ token });
});

export default router;
