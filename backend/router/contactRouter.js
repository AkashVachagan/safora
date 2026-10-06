import express from "express";
import fs from "fs";
import tokenVerification from "../middleware/tokenVerify.js";

const router = express.Router();
const CONTACT_FILE = "./user/emergencyContacts.json";

function readContacts() {
    return fs.existsSync(CONTACT_FILE) ? JSON.parse(fs.readFileSync(CONTACT_FILE, "utf-8")) : {};
}

router.use(tokenVerification);

router.get("/", (req, res) => {
    const contactsByUser = readContacts();
    return res.json({ contacts: contactsByUser[req.user_id] || [] });
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
