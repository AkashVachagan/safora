import express from "express";
import fs from "fs";
import tokenVerification from "../middleware/tokenVerify.js";
import { sendSms } from "../utils/sms.js";

const router = express.Router();
const CONTACT_FILE = "./user/emergencyContacts.json";

function readContacts() {
    return fs.existsSync(CONTACT_FILE) ? JSON.parse(fs.readFileSync(CONTACT_FILE, "utf-8")) : {};
}

router.use(tokenVerification);
router.use((req, res, next) => req.portal === "user" ? next() : res.status(403).json({ error: "User portal account required" }));

router.get("/", (req, res) => {
    const contactsByUser = readContacts();
    return res.json({ contacts: contactsByUser[req.user_id] || [] });
});

router.post("/sos", async (req, res) => {
    const contacts = readContacts()[req.user_id] || [];
    if (!contacts.length) return res.status(400).json({ error: "Add an emergency contact before sending SOS" });

    const users = fs.existsSync("./user/userInfo.json")
        ? JSON.parse(fs.readFileSync("./user/userInfo.json", "utf-8"))
        : [];
    const user = users.find((entry) => entry.user_id === req.user_id);
    try {
        await sendSms(`${user?.name || "User"} clicked SOS`, contacts.map((contact) => contact.phone));
        return res.json({ message: "SOS sent to your emergency contacts" });
    } catch (error) {
        return res.status(502).json({ error: error.message || "Could not send SOS" });
    }
});

router.put("/", (req, res) => {
    const contacts = Array.isArray(req.body.contacts) ? req.body.contacts : null;
    if (!contacts || contacts.some((contact) => !contact.name?.trim() || !contact.phone?.trim())) {
        return res.status(400).json({ error: "Every contact needs a name and phone number" });
    }
    const contactsByUser = readContacts();
    contactsByUser[req.user_id] = contacts.map(({ name, phone }) => ({ name: name.trim(), phone: phone.trim() }));
    fs.writeFileSync(CONTACT_FILE, JSON.stringify(contactsByUser, null, 2));
    return res.json({ contacts: contactsByUser[req.user_id] });
});

export default router;
