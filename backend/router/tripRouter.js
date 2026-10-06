import express from "express";
import fs from "fs";
import crypto from "crypto";
import { fileURLToPath } from "url";
import tokenVerification from "../middleware/tokenVerify.js";
import { ensurePoliceCase } from "../utils/caseEscalation.js";

const router = express.Router();
const TRIP_FILE = "./user/trips.json";
const USER_FILE = "./user/userInfo.json";
const ENV_FILE = fileURLToPath(new URL("./.env", import.meta.url));
if (fs.existsSync(ENV_FILE)) {
    process.loadEnvFile(ENV_FILE);
    console.log("[Gemini] Loaded backend/router/.env.");
}

function readTrips() {
    return fs.existsSync(TRIP_FILE) ? JSON.parse(fs.readFileSync(TRIP_FILE, "utf-8")) : {};
}

async function generateAndSaveTravelBriefing(userId, tripId, start, destination) {
    const briefing = await createTravelBriefing(start, destination);
    const tripsByUser = readTrips();
    const trip = (tripsByUser[userId] || []).find((entry) => entry.id === tripId);
    if (!trip) return;
    if (briefing) {
        trip.travelBriefing = briefing;
        trip.travelBriefingStatus = "ready";
        trip.travelBriefingCreatedAt = new Date().toISOString();
    } else {
        trip.travelBriefingStatus = "error";
        trip.travelBriefingError = "Could not get up-to-date trip information.";
    }
    fs.writeFileSync(TRIP_FILE, JSON.stringify(tripsByUser, null, 2));
}

async function createTravelBriefing(start, destination) {
    console.log("[Gemini] createTravelBriefing was called.");
    if (!process.env.GEMINI_API_KEY) {
        console.error("[Gemini] GEMINI_API_KEY is missing from the backend environment; no request was sent.");
        return null;
    }
    try {
        console.log("[Gemini] Sending generateContent request.");
        // const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent", {
        const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent", {

        // gemini-3.5-flash-lite
            method: "POST",
            headers: { "Content-Type": "application/json", "X-goog-api-key": process.env.GEMINI_API_KEY },
            body: JSON.stringify({ contents: [{ parts: [{ text: `Give a 3 line overview with just text of current news, advisories, and things to know for a trip from ${start} to ${destination}. Be concise and do not invent breaking news.` }] }] }),
        });
        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`[Gemini] Request failed (${response.status}): ${errorBody}`);
            return null;
        }
        const data = await response.json();
        const briefing = data.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("\n").trim() || null;
        if (!briefing) {
            console.error(`[Gemini] Response contained no briefing text: ${JSON.stringify(data)}`);
            return null;
        }
        console.log("[Gemini] Briefing received successfully.");
        return briefing;
    } catch (error) {
        console.error(`[Gemini] Could not generate trip briefing: ${error.message}`);
        return null;
    }
}

router.use(tokenVerification);
router.use((req, res, next) => req.portal === "user" ? next() : res.status(403).json({ error: "User portal account required" }));

router.get("/", (req, res) => {
    const users = JSON.parse(fs.readFileSync(USER_FILE, "utf-8"));
    const user = users.find((entry) => entry.user_id === req.user_id);
    return res.json({ name: user?.name || "Traveler", trips: readTrips()[req.user_id] || [] });
});

router.delete("/:tripId", (req, res) => {
    const tripsByUser = readTrips();
    const trips = tripsByUser[req.user_id] || [];
    const remainingTrips = trips.filter((trip) => trip.id !== req.params.tripId);
    if (remainingTrips.length === trips.length) return res.status(404).json({ error: "Trip not found" });
    tripsByUser[req.user_id] = remainingTrips;
    fs.writeFileSync(TRIP_FILE, JSON.stringify(tripsByUser, null, 2));
    return res.json({ success: true, tripId: req.params.tripId });
});

router.post("/", async (req, res) => {
    const {
        package_id,
        package_name,
        start_address,
        destination_address,
        isPlanned = false,
        startPoint,
        endPoint,
        plannedRoute,
        routeSource,
    } = req.body || {};
    if (typeof package_id !== "string" || typeof package_name !== "string" || !package_id || !package_name) {
        return res.status(400).json({ error: "A package is required to start a trip" });
    }
    if (isPlanned && (!Array.isArray(plannedRoute) || plannedRoute.length < 2 || plannedRoute.some((point) => !Array.isArray(point) || point.length !== 2 || point.some((coordinate) => !Number.isFinite(coordinate))))) {
        return res.status(400).json({ error: "A valid planned route is required" });
    }
    const tripsByUser = readTrips();
    const trips = tripsByUser[req.user_id] || [];
    const activeTrip = trips.find((trip) => !trip.endedAt && !trip.isPlanned);
    if (activeTrip) return res.status(409).json({ error: "End your active trip before starting another", trip: activeTrip });
    const trip = {
        id: crypto.randomUUID(),
        package_id,
        package_name,
        ...(typeof start_address === "string" && start_address.trim() ? { startAddress: start_address.trim() } : {}),
        ...(typeof destination_address === "string" && destination_address.trim() ? { destinationAddress: destination_address.trim() } : {}),
        ...(isPlanned ? { isPlanned: true, startPoint, endPoint, plannedRoute, routeSource } : {}),
        ...(isPlanned ? { travelBriefingStatus: "loading" } : {}),
        startedAt: new Date().toISOString(),
        endedAt: null,
        comments: "",
        locations: [],
    };
    trips.push(trip);
    tripsByUser[req.user_id] = trips;
    fs.writeFileSync(TRIP_FILE, JSON.stringify(tripsByUser, null, 2));
    if (isPlanned) {
        console.log(`[Trip ${trip.id}] Requesting Gemini briefing while saving the planned route.`);
        const [fallbackStart = "", fallbackDestination = ""] = package_name.split(" → ");
        generateAndSaveTravelBriefing(req.user_id, trip.id, trip.startAddress || fallbackStart, trip.destinationAddress || fallbackDestination)
            .catch((error) => console.error(`[Gemini] Could not save trip briefing: ${error.message}`));
    }
    return res.status(201).json({ trip });
});

router.post("/:tripId/start", async (req, res) => {
    const tripsByUser = readTrips();
    const trip = (tripsByUser[req.user_id] || []).find((entry) => entry.id === req.params.tripId);
    if (!trip) return res.status(404).json({ error: "Trip not found" });
    if (!trip.isPlanned) return res.status(400).json({ error: "Only a planned trip can be started here" });
    if (trip.endedAt) return res.status(409).json({ error: "This trip has already ended" });
    if (!trip.tripStartedAt) {
        trip.tripStartedAt = new Date().toISOString();
    }
    tripsByUser[req.user_id] = tripsByUser[req.user_id].map((entry) => entry.id === trip.id ? trip : entry);
    fs.writeFileSync(TRIP_FILE, JSON.stringify(tripsByUser, null, 2));
    return res.json({ trip });
});

router.put("/:tripId/end", async (req, res) => {
    const tripsByUser = readTrips();
    const trip = (tripsByUser[req.user_id] || []).find((entry) => entry.id === req.params.tripId);
    if (!trip) return res.status(404).json({ error: "Trip not found" });
    if (trip.isPlanned && !trip.tripStartedAt) return res.status(409).json({ error: "Start this trip before ending it" });
    const users = JSON.parse(fs.readFileSync(USER_FILE, "utf-8"));
    const user = users.find((entry) => entry.user_id === req.user_id);
    if (user && !trip.isPlanned) await ensurePoliceCase(user, trip);
    if (!trip.endedAt) trip.endedAt = new Date().toISOString();
    trip.comments = typeof req.body?.comments === "string" ? req.body.comments.trim() : "";
    fs.writeFileSync(TRIP_FILE, JSON.stringify(tripsByUser, null, 2));
    return res.json({ trip });
});

export default router;
