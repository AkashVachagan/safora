import express from "express";
import bcrypt from "bcrypt";
import crypto from "crypto";
import fs from "fs";

const router = express.Router();

const DAY = 24 * 60 * 60 * 1000;

function accountsFile(portal) {
    return portal === "police" ? "./user/policeInfo.json" : "./user/userInfo.json";
}

// user registration
// update userList.json -> username, hash, user_id
// update tree.json
// update token.json
router.post("/register", async (req, res) => {
    const {username, password, phone, portal = "user"} = req.body;
    if (!username?.trim() || !password || (portal === "user" && !phone?.trim())) return res.status(400).json({ error: "Username, password, and a phone number for the user portal are required" });
    const userFile = accountsFile(portal);
    if (!fs.existsSync(userFile)) fs.writeFileSync(userFile, JSON.stringify([], null, 2));
    const userListString = fs.readFileSync(userFile, "utf-8");
    const tokenListString = fs.readFileSync("./jwt/token.json", "utf-8");
    const userList = JSON.parse(userListString);
    const tokenList = JSON.parse(tokenListString);
    const randomUserId = crypto.randomUUID();
    const randomToken = crypto.randomUUID();

    if (userList.find(child => child.name === username)){
        console.log("user already exists");
        return res.status(409).json({
            error: "user already exists"
        });
    }
    
    const hashPass = await bcrypt.hash(password, 12);

    const userTemplate = {
        name: username,
        ...(portal === "user" ? { phone: phone.trim() } : {}),
        hash: hashPass,
        user_id: randomUserId
    };
    userList.push(userTemplate);

    const tokenTemplate = {
        user_id: randomUserId,
        portal,
        token: randomToken,
        expiresAt: Date.now() + DAY
    }
    tokenList.push(tokenTemplate);
    
    fs.writeFileSync(userFile, JSON.stringify(userList, null, 2));
    fs.writeFileSync("./jwt/token.json", JSON.stringify(tokenList, null, 2));
    console.log("user registration successful");

    return res.status(201).json({
        token: randomToken
    });
});

// user login
router.post("/login", async (req, res) => {
    const {username, password, portal = "user"} = req.body;
    const userFile = accountsFile(portal);
    if (!fs.existsSync(userFile)) return res.status(404).json({ error: "username not found in this portal" });
    const userListString = fs.readFileSync(userFile, "utf-8");
    const tokenListString = fs.readFileSync("./jwt/token.json", "utf-8");
    const userList = JSON.parse(userListString);
    const tokenList = JSON.parse(tokenListString);
    const randomToken = crypto.randomUUID();

    const userInfo = userList.find(child => child.name === username);
    if (!userInfo){
        console.log("username not found");
        return res.status(404).json({
            error: "username not found"
        });
    }

    const valid = await bcrypt.compare(password, userInfo.hash);

    if (!valid){
        console.log("incorrect password");
        return res.status(400).json({
            error: "incorrect password"
        });
    }

    const user_id = userInfo.user_id;
    const jwt = tokenList.find(child => child.user_id === user_id && (child.portal || "user") === portal);
    if (!jwt){
        console.log("user jwt not available");
        return res.status(500).json({
            error: "user jwt not available"
        });
    }

    jwt.token = randomToken;
    jwt.expiresAt = Date.now() + DAY;
    jwt.portal = portal;

    fs.writeFileSync("./jwt/token.json", JSON.stringify(tokenList, null, 2));

    console.log("User token created");
    return res.status(200).json({
        token: randomToken
    });
})

export default router;
