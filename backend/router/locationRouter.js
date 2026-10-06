import express from "express";
import fs from "fs";
import tokenVerification from "../middleware/tokenVerify.js";
import { sendSms } from "../utils/sms.js";
import { ensurePoliceCase } from "../utils/caseEscalation.js";

const router = express.Router();

const LOCATION_FILE = "./user/locationHistory.json";
const TRIP_FILE = "./user/trips.json";
const PACKAGE_FILE = "./package/packageInfo.json";

function distanceToSegmentMeters(point, start, end) {
    const latitude = point[0] * Math.PI / 180;
    const scaleX = 111320 * Math.cos(latitude);
    const scaleY = 110540;
    const px = point[1] * scaleX, py = point[0] * scaleY;
    const ax = start[0] * scaleX, ay = start[1] * scaleY;
    const bx = end[0] * scaleX, by = end[1] * scaleY;
    const dx = bx - ax, dy = by - ay;
    const ratio = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy || 1)));
    return Math.hypot(px - (ax + ratio * dx), py - (ay + ratio * dy));
}

function isOffRoute(location, packageId) {
    if (!fs.existsSync(PACKAGE_FILE)) return false;
    const packages = JSON.parse(fs.readFileSync(PACKAGE_FILE, "utf-8"));
    const route = packages.find((item) => item.package_id === packageId)?.route || [];
    if (route.length < 2) return false;
    return Math.min(...route.slice(1).map((point, index) => distanceToSegmentMeters([location.lat, location.lon], [route[index][1], route[index][0]], [point[1], point[0]]))) > 10;
}

function readHistory() {
    return fs.existsSync(LOCATION_FILE)
        ? JSON.parse(fs.readFileSync(LOCATION_FILE, "utf-8"))
        : {};
}

const ownTracksCompatibility = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (authHeader?.startsWith("Basic ")) {
        try {
            const base64Credentials = authHeader.split(" ")[1];

            const decoded = Buffer
                .from(base64Credentials, "base64")
                .toString("utf-8");

            const separatorIndex = decoded.indexOf(":");

            if (separatorIndex === -1) {
                return res.status(401).json({
                    error: "Invalid Basic Authentication"
                });
            }

            const password = decoded.slice(separatorIndex + 1);

            if (password.startsWith("Bearer ")) {
                req.headers.authorization = password;
            }
        } catch {
            return res.status(401).json({
                error: "Failed to parse OwnTracks authentication"
            });
        }
    }

    if (
        req.method === "POST" &&
        req.body &&
        req.body._type === "location"
    ) {
        req.body = {
            lat: req.body.lat,
            lon: req.body.lon,
            alt: Number.isFinite(req.body.alt) ? req.body.alt : 0,
            vel: Number.isFinite(req.body.vel) ? req.body.vel : 0,
            timestamp: Number.isFinite(req.body.tst) ? new Date(req.body.tst * 1000).toISOString() : undefined
        };
    }

    next();
};

router.use(ownTracksCompatibility);
router.use(tokenVerification);
router.use((req, res, next) => req.portal === "user" ? next() : res.status(403).json({ error: "User portal account required" }));

router.post(["/", "/:user/:device"], async (req, res) => {
    if (req.body?._type === "status") {
        return res.status(200).json([]);
    }

    const { lat, lon, alt, vel } = req.body || {};

    if (![lat, lon, alt, vel].every(
        value => typeof value === "number" && Number.isFinite(value)
    )) {
        return res.status(400).json({
            error: "Location must include numeric lat, lon, alt, and vel values"
        });
    }

    const historyByUser = readHistory();

    const location = {
        lat,
        lon,
        alt,
        vel,
        timestamp: req.body.timestamp || new Date().toISOString()
    };

    historyByUser[req.user_id] ||= [];
    historyByUser[req.user_id].push(location);

    const tripsByUser = fs.existsSync(TRIP_FILE) ? JSON.parse(fs.readFileSync(TRIP_FILE, "utf-8")) : {};
    const activeTrip = (tripsByUser[req.user_id] || []).find((trip) => !trip.endedAt);
    let deviationSms = null;
    if (activeTrip) {
        activeTrip.locations ||= [];
        if (activeTrip.locations.length === 0) activeTrip.startedAt = location.timestamp;
        activeTrip.locations.push(location);
        if (isOffRoute(location, activeTrip.package_id)) {
            activeTrip.deviationSince ||= new Date().toISOString();
            activeTrip.offRoute = true;
            if (!activeTrip.deviationSmsSent) {
                activeTrip.deviationSmsSent = true;
                const users = JSON.parse(fs.readFileSync("./user/userInfo.json", "utf-8"));
                const user = users.find((entry) => entry.user_id === req.user_id);
                deviationSms = { phone: user?.phone, name: user?.name };
            }
        } else {
            if (activeTrip.deviationSince) {
                const users = JSON.parse(fs.readFileSync("./user/userInfo.json", "utf-8"));
                const user = users.find((entry) => entry.user_id === req.user_id);
                if (user) await ensurePoliceCase(user, activeTrip);
            }
            activeTrip.deviationSince = null;
            activeTrip.offRoute = false;
            activeTrip.deviationSmsSent = false;
        }
        fs.writeFileSync(TRIP_FILE, JSON.stringify(tripsByUser, null, 2));
    }

    fs.writeFileSync(
        LOCATION_FILE,
        JSON.stringify(historyByUser, null, 2)
    );

    if (activeTrip?.offRoute && activeTrip.deviationSince) {
        const users = JSON.parse(fs.readFileSync("./user/userInfo.json", "utf-8"));
        const user = users.find((entry) => entry.user_id === req.user_id);
        if (user) await ensurePoliceCase(user, activeTrip);
    }

    if (deviationSms?.phone) {
        void sendSms("You're deviating away from the path. Get back on routed path immediately!", [deviationSms.phone])
            .catch((error) => console.error(`Could not send deviation SMS for ${deviationSms.name}: ${error.message}`));
    }

    return res.status(200).json([]);
});

router.get("/", (req, res) => {
    const historyByUser = readHistory();

    return res.json({
        locations: historyByUser[req.user_id] || []
    });
});

export default router;
