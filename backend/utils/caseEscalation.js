import fs from "fs";
import { sendSms } from "./sms.js";

const TRIP_FILE = "./user/trips.json";
const CONTACT_FILE = "./user/emergencyContacts.json";

function readJson(path, fallback) {
    return fs.existsSync(path) ? JSON.parse(fs.readFileSync(path, "utf-8")) : fallback;
}

export async function ensurePoliceCase(user, trip) {
    if (!trip?.deviationSince || Date.now() - new Date(trip.deviationSince).getTime() < 60000) return null;

    const tripsByUser = readJson(TRIP_FILE, {});
    const savedTrip = (tripsByUser[user.user_id] || []).find((entry) => entry.id === trip.id);
    if (!savedTrip) return null;
    if (!savedTrip.policeCase) {
        savedTrip.policeCase = { createdAt: new Date().toISOString(), deviationSince: savedTrip.deviationSince };
        trip.policeCase = savedTrip.policeCase;
        fs.writeFileSync(TRIP_FILE, JSON.stringify(tripsByUser, null, 2));
    }

    if (!savedTrip.policeCase.smsAttemptedAt) {
        const contacts = readJson(CONTACT_FILE, {})[user.user_id] || [];
        const phoneNumbers = contacts.map((contact) => contact.phone).filter(Boolean);
        if (phoneNumbers.length) {
            savedTrip.policeCase.smsAttemptedAt = new Date().toISOString();
            trip.policeCase = savedTrip.policeCase;
            fs.writeFileSync(TRIP_FILE, JSON.stringify(tripsByUser, null, 2));
            try {
                await sendSms(`${user.name} named as you as an emergency contact and they've deviated away from their allocated tourist path`, phoneNumbers);
                savedTrip.policeCase.smsSentAt = new Date().toISOString();
                trip.policeCase = savedTrip.policeCase;
                fs.writeFileSync(TRIP_FILE, JSON.stringify(tripsByUser, null, 2));
            } catch (error) {
                console.error(`Could not send police case SMS for ${user.name}: ${error.message}`);
            }
        }
    }
    return savedTrip.policeCase;
}

export async function sweepPoliceCases() {
    const users = readJson("./user/userInfo.json", []);
    const tripsByUser = readJson(TRIP_FILE, {});
    for (const user of users) {
        for (const trip of tripsByUser[user.user_id] || []) await ensurePoliceCase(user, trip);
    }
}
