import express from "express";
import fs from "fs";

const router = express.Router();

router.delete("/", (req, res) => {
    if (req.body?.confirmation !== "DELETE ALL SAFORA USER DATA") {
        return res.status(400).json({ error: "Explicit delete confirmation is required" });
    }
    fs.mkdirSync("./user", { recursive: true });
    fs.mkdirSync("./jwt", { recursive: true });
    for (const [file, empty] of [
        ["./user/userInfo.json", []],
        ["./user/policeInfo.json", []],
        ["./user/emergencyContacts.json", {}],
        ["./user/locationHistory.json", {}],
        ["./user/trips.json", {}],
        ["./jwt/token.json", []],
    ]) fs.writeFileSync(file, JSON.stringify(empty, null, 2));
    return res.json({ message: "All user and police account data was deleted" });
});

export default router;
