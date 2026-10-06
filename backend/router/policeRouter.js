import express from "express";
import fs from "fs";
import tokenVerification from "../middleware/tokenVerify.js";
import { ensurePoliceCase } from "../utils/caseEscalation.js";

const router = express.Router();
router.use(tokenVerification);
router.use((req, res, next) => req.portal === "police" ? next() : res.status(403).json({ error: "Police portal account required" }));

function readJson(file, fallback) {
    return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf-8")) : fallback;
}

router.get("/overview", async (_req, res) => {
    const users = readJson("./user/userInfo.json", []);
    const history = readJson("./user/locationHistory.json", {});
    let trips = readJson("./user/trips.json", {});
    for (const user of users) {
        for (const trip of trips[user.user_id] || []) await ensurePoliceCase(user, trip);
    }
    trips = readJson("./user/trips.json", {});
    const liveUsers = users.map((user) => {
        const userTrips = trips[user.user_id] || [];
        const activeTrip = userTrips.find((trip) => !trip.endedAt);
        const allLocations = history[user.user_id] || [];
        const locations = activeTrip?.locations?.length ? activeTrip.locations : allLocations.slice(-1);
        return { id: user.user_id, name: user.name, locations, location: locations.at(-1) || null, activeTrip };
    }).filter((user) => user.location);
    const cases = users.flatMap((user) => (trips[user.user_id] || []).filter((trip) => trip.policeCase).map((trip) => ({ userId: user.user_id, name: user.name, tripId: trip.id, since: trip.policeCase.deviationSince, status: trip.endedAt ? "TRIP ENDED" : "USER ACTIVE", endedAt: trip.endedAt })));
    // A visible sample case helps demonstrate the police case workflow in a fresh installation.
    cases.push({ userId: "sample-varshikan", name: "Varshikan", tripId: "sample-varshikan-trip", since: new Date(Date.now() - 61000).toISOString(), sample: true });
    return res.json({ users: liveUsers, cases });
});

router.get("/users/:userId", (req, res) => {
    const users = readJson("./user/userInfo.json", []);
    const history = readJson("./user/locationHistory.json", {});
    const contacts = readJson("./user/emergencyContacts.json", {});
    const trips = readJson("./user/trips.json", {});
    if (req.params.userId === "sample-varshikan") {
        return res.json({ user: { id: "sample-varshikan", name: "Varshikan" }, contacts: [{ name: "Emergency contact", phone: "+91 90000 00000" }], trips: [{ id: "sample-varshikan-trip", package_name: "Mahabalipuram", startedAt: new Date(Date.now() - 3600000).toISOString(), endedAt: null, locations: history[users[0]?.user_id]?.slice(-12) || [{ lat: 13.0067, lon: 80.2010, alt: 0, vel: 0 }] }] });
    }
    const user = users.find((entry) => entry.user_id === req.params.userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    return res.json({ user: { id: user.user_id, name: user.name }, contacts: contacts[user.user_id] || [], trips: trips[user.user_id] || [], locations: history[user.user_id] || [] });
});

export default router;
