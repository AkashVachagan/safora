import express from "express";
import fs from "fs";
import crypto from "crypto";
import tokenVerification from "../middleware/tokenVerify.js";
import { ensurePoliceCase } from "../utils/caseEscalation.js";

const router = express.Router();
const TRIP_FILE = "./user/trips.json";
const USER_FILE = "./user/userInfo.json";

function readTrips() {
    return fs.existsSync(TRIP_FILE) ? JSON.parse(fs.readFileSync(TRIP_FILE, "utf-8")) : {};
}

router.use(tokenVerification);
router.use((req, res, next) => req.portal === "user" ? next() : res.status(403).json({ error: "User portal account required" }));

router.get("/", (req, res) => {
    const users = JSON.parse(fs.readFileSync(USER_FILE, "utf-8"));
    const user = users.find((entry) => entry.user_id === req.user_id);
    return res.json({ name: user?.name || "Traveler", trips: readTrips()[req.user_id] || [] });
});

router.post("/", (req, res) => {
    const { package_id, package_name } = req.body || {};
    if (typeof package_id !== "string" || typeof package_name !== "string" || !package_id || !package_name) {
        return res.status(400).json({ error: "A package is required to start a trip" });
    }
    const tripsByUser = readTrips();
    const trips = tripsByUser[req.user_id] || [];
    const activeTrip = trips.find((trip) => !trip.endedAt);
    if (activeTrip) return res.status(409).json({ error: "End your active trip before starting another", trip: activeTrip });
    const trip = { id: crypto.randomUUID(), package_id, package_name, startedAt: new Date().toISOString(), endedAt: null, comments: "", locations: [] };
    trips.push(trip);
    tripsByUser[req.user_id] = trips;
    fs.writeFileSync(TRIP_FILE, JSON.stringify(tripsByUser, null, 2));
    return res.status(201).json({ trip });
});

router.put("/:tripId/end", async (req, res) => {
    const tripsByUser = readTrips();
    const trip = (tripsByUser[req.user_id] || []).find((entry) => entry.id === req.params.tripId);
    if (!trip) return res.status(404).json({ error: "Trip not found" });
    const users = JSON.parse(fs.readFileSync(USER_FILE, "utf-8"));
    const user = users.find((entry) => entry.user_id === req.user_id);
    if (user) await ensurePoliceCase(user, trip);
    if (!trip.endedAt) trip.endedAt = new Date().toISOString();
    trip.comments = typeof req.body?.comments === "string" ? req.body.comments.trim() : "";
    fs.writeFileSync(TRIP_FILE, JSON.stringify(tripsByUser, null, 2));
    return res.json({ trip });
});

export default router;
