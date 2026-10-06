import express from "express";
import fs from "fs";
import tokenVerification from "../middleware/tokenVerify.js";

const router = express.Router();

const LOCATION_FILE = "./user/locationHistory.json";

function readHistory() {
    return fs.existsSync(LOCATION_FILE)
        ? JSON.parse(fs.readFileSync(LOCATION_FILE, "utf-8"))
        : {};
}

router.use((req, res, next) => {
    console.log("REQUEST:", req.method, req.originalUrl);
    console.log("BODY:", req.body);
    console.log("AUTH:", req.headers.authorization);
    next();
});

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
            vel: Number.isFinite(req.body.vel) ? req.body.vel : 0
        };
    }

    next();
};

router.use(ownTracksCompatibility);
router.use(tokenVerification);

router.post(["/", "/:user/:device"], (req, res) => {
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
        timestamp: new Date().toISOString()
    };

    historyByUser[req.user_id] ||= [];
    historyByUser[req.user_id].push(location);

    fs.writeFileSync(
        LOCATION_FILE,
        JSON.stringify(historyByUser, null, 2)
    );

    return res.status(200).json([]);
});

router.get("/", (req, res) => {
    const historyByUser = readHistory();

    return res.json({
        locations: historyByUser[req.user_id] || []
    });
});

export default router;