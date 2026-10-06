import express from "express";
import crypto from "crypto";
import fs from "fs";
import tokenVerification from "../middleware/tokenVerify.js";

const router = express.Router();
router.use(tokenVerification);

router.post("/", (req, res) => {
    const tokens = JSON.parse(fs.readFileSync("./jwt/token.json", "utf-8"));
    const token = crypto.randomUUID();
    tokens.push({ user_id: req.user_id, token, expiresAt: null, device: true });
    fs.writeFileSync("./jwt/token.json", JSON.stringify(tokens, null, 2));
    return res.status(201).json({ token });
});

export default router;
