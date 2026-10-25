import fs from "fs";
import { sendSms } from "./sms.js";
import { ensurePoliceCase } from "./caseEscalation.js";

const LOCATION_FILE = "./user/locationHistory.json";
const TRIP_FILE = "./user/trips.json";
const PACKAGE_FILE = "./package/packageInfo.json";
const USER_FILE = "./user/userInfo.json";
const MAX_HISTORY_AGE_MS = 2 * 60 * 1000;

function readJson(path, fallback) {
    return fs.existsSync(path) ? JSON.parse(fs.readFileSync(path, "utf-8")) : fallback;
}

function activeTripFor(trips) {
    return trips
        .filter((trip) => !trip.endedAt && (!trip.isPlanned || trip.tripStartedAt))
        .sort((a, b) => Date.parse(b.tripStartedAt || b.startedAt) - Date.parse(a.tripStartedAt || a.startedAt))[0];
}

function distanceToSegmentMeters(point, start, end) {
    const latitude = point[0] * Math.PI / 180;
    const scaleX = 111320 * Math.cos(latitude);
    const scaleY = 110540;
    const px = point[1] * scaleX, py = point[0] * scaleY;
    const ax = start[1] * scaleX, ay = start[0] * scaleY;
    const bx = end[1] * scaleX, by = end[0] * scaleY;
    const dx = bx - ax, dy = by - ay;
    const ratio = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy || 1)));
    return Math.hypot(px - (ax + ratio * dx), py - (ay + ratio * dy));
}

function routeFor(trip) {
    if (trip.isPlanned && Array.isArray(trip.plannedRoute)) {
        // Planned routes use Leaflet's [latitude, longitude] coordinate order.
        return trip.plannedRoute;
    }
    const packages = readJson(PACKAGE_FILE, []);
    // Package routes use GeoJSON's [longitude, latitude] coordinate order.
    return (packages.find((item) => item.package_id === trip.package_id)?.route || [])
        .map(([longitude, latitude]) => [latitude, longitude]);
}

function isOffRoute(location, trip) {
    const route = routeFor(trip);
    if (route.length < 2) return false;
    return Math.min(...route.slice(1).map((point, index) => distanceToSegmentMeters(
        [location.lat, location.lon], route[index], point,
    ))) > 10;
}

export async function evaluateActiveTripLocation(userId, location) {
    const tripsByUser = readJson(TRIP_FILE, {});
    const trips = tripsByUser[userId] || [];
    const trip = activeTripFor(trips);
    if (!trip) return null;

    trip.locations ||= [];
    const alreadyRecorded = trip.locations.some((point) => point.timestamp === location.timestamp);
    if (alreadyRecorded) return trip;

    if (trip.locations.length === 0) trip.startedAt = location.timestamp;
    trip.locations.push(location);
    let deviationSms = null;
    if (isOffRoute(location, trip)) {
        trip.deviationSince ||= new Date().toISOString();
        trip.offRoute = true;
        if (!trip.deviationSmsSent) {
            trip.deviationSmsSent = true;
            const user = readJson(USER_FILE, []).find((entry) => entry.user_id === userId);
            deviationSms = { phone: user?.phone, name: user?.name };
        }
    } else {
        if (trip.deviationSince) {
            const user = readJson(USER_FILE, []).find((entry) => entry.user_id === userId);
            if (user) await ensurePoliceCase(user, trip);
        }
        trip.deviationSince = null;
        trip.offRoute = false;
        trip.deviationSmsSent = false;
    }
    fs.writeFileSync(TRIP_FILE, JSON.stringify(tripsByUser, null, 2));

    if (trip.offRoute && trip.deviationSince) {
        const user = readJson(USER_FILE, []).find((entry) => entry.user_id === userId);
        if (user) await ensurePoliceCase(user, trip);
    }
    if (deviationSms?.phone) {
        void sendSms("You're deviating away from the path. Get back on routed path immediately!", [deviationSms.phone])
            .catch((error) => console.error(`Could not send deviation SMS for ${deviationSms.name}: ${error.message}`));
    }
    return trip;
}

// Also consume recent saved GPS points after a trip starts and when updates were
// written to locationHistory.json before this process handled them.
export async function processRecentActiveTripLocations() {
    const historyByUser = readJson(LOCATION_FILE, {});
    const tripsByUser = readJson(TRIP_FILE, {});
    const now = Date.now();
    for (const [userId, points] of Object.entries(historyByUser)) {
        const trip = activeTripFor(tripsByUser[userId] || []);
        if (!trip) continue;
        const recordedTimestamps = new Set((trip.locations || []).map((point) => point.timestamp));
        const recentPoints = (points || []).filter((point) => {
            const timestamp = Date.parse(point.timestamp);
            return Number.isFinite(timestamp)
                && timestamp >= now - MAX_HISTORY_AGE_MS
                && timestamp <= now + 30_000
                && !recordedTimestamps.has(point.timestamp);
        });
        for (const point of recentPoints) {
            await evaluateActiveTripLocation(userId, point);
            recordedTimestamps.add(point.timestamp);
        }
    }
}
