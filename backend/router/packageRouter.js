import express from "express";
import fs from "fs";

const router = express.Router();
const PACKAGE_FILE = "./package/packageInfo.json";
const ALANDUR = [80.2010, 13.0067];
const MAHABALIPURAM = [80.1927, 12.6269];
const PACKAGE_SEEDS = [
    { package_id: "mahabalipuram-001", name: "Mahabalipuram", state: "Tamil Nadu", destination: MAHABALIPURAM, profile: { hero: "Ancient monuments, sculpted by the shore.", about: ["A Bay of Bengal town shaped by the Pallavas, with granite temples and carvings from the 7th and 8th centuries.", "Begin at the Shore Temple, then explore the Five Rathas and Arjuna’s Penance before an evening by the beach."], sights: [["Shore Temple", "Twin shrines standing at the edge of the sea."], ["Five Rathas", "Monolithic temples carved from single boulders."], ["Arjuna’s Penance", "A vast relief animated by gods, animals and ascetics."]], plan: "Start early for cooler walks and softer light on the monuments. Carry water and keep time for the coast.", news: { title: "Coastal travel advisory", text: "Conditions along the East Coast Road can change quickly; check local conditions before the final stretch.", score: 24, level: "Low" } } },
    { package_id: "taj-mahal-002", name: "Taj Mahal", state: "Uttar Pradesh", destination: [78.0421, 27.1751], profile: { hero: "A white-marble masterpiece beside the Yamuna.", about: ["The Taj Mahal is Agra’s iconic 17th-century mausoleum, admired for its symmetry, luminous marble and intricate inlay work.", "Give the complex time: its gardens, gateway and river-facing rear view are part of the experience."], sights: [["Main mausoleum", "Marble geometry and floral pietra dura detail."], ["Charbagh gardens", "The formal garden frames the monument's long approach."], ["Mehtab Bagh", "A quieter viewpoint across the Yamuna." ]], plan: "Reserve an early entry slot, bring an ID, and expect a security check at the gate.", news: { title: "Visitor timing reminder", text: "Morning entry is usually the calmest window; keep your ticket and photo ID ready.", score: 31, level: "Guarded" } } },
    { package_id: "gateway-mumbai-003", name: "Gateway of India", state: "Maharashtra", destination: [72.8347, 18.9220], profile: { hero: "Mumbai's grand harbourfront welcome.", about: ["Completed in 1924, the basalt arch looks across Mumbai Harbour and remains one of the city’s most recognisable gathering points.", "The surrounding Colaba district blends waterfront walks, cafés and historic streets."], sights: [["Harbour arch", "Indo-Saracenic architecture facing the Arabian Sea."], ["Colaba Causeway", "A lively nearby street for browsing and snacks."], ["Ferry pier", "Boats depart toward Elephanta Island."]], plan: "Visit in daylight and leave extra time for busy waterfront traffic and pedestrian crowds.", news: { title: "Harbourfront crowd watch", text: "The promenade is busiest around sunset and on weekends; plan a little buffer time.", score: 42, level: "Moderate" } } },
    { package_id: "india-gate-004", name: "India Gate", state: "Delhi", destination: [77.2295, 28.6129], profile: { hero: "A landmark avenue at the heart of New Delhi.", about: ["India Gate is a war memorial set on the ceremonial axis of central Delhi, surrounded by broad lawns and historic boulevards.", "It makes an easy stop alongside nearby museums and the National War Memorial."], sights: [["Memorial arch", "A 42-metre arch engraved with names of soldiers."], ["National War Memorial", "A contemplative nearby space honouring service."], ["Kartavya Path", "The grand avenue connecting central landmarks."]], plan: "Go in the cooler hours, use official parking where possible, and stay hydrated in summer.", news: { title: "Central Delhi access note", text: "Ceremonial-area traffic controls can affect approaches during public events.", score: 36, level: "Moderate" } } },
    { package_id: "mysore-palace-005", name: "Mysore Palace", state: "Karnataka", destination: [76.6551, 12.3051], profile: { hero: "Domes, arches and royal craftsmanship.", about: ["Mysore Palace is the ornate seat of the Wadiyar dynasty, famed for its Indo-Saracenic design and lavish interiors.", "The surrounding old city adds markets, food and a slower rhythm to the visit."], sights: [["Durbar Hall", "An opulent ceremonial hall of columns and colour."], ["Amba Vilas", "The palace's richly decorated royal apartments."], ["Devaraja Market", "Flowers, spices and local life nearby."]], plan: "Check illumination and closing timings before travel; footwear rules apply in some areas.", news: { title: "Palace visit update", text: "Entry queues can build before evening illumination and holiday periods.", score: 28, level: "Low" } } },
    { package_id: "hampi-006", name: "Hampi", state: "Karnataka", destination: [76.4600, 15.3350], profile: { hero: "A surreal landscape of boulders and ruins.", about: ["Hampi spreads across a dramatic river valley, where the remains of Vijayanagara meet massive granite formations.", "Its temple complexes, markets and viewpoints are best explored at a deliberately unhurried pace."], sights: [["Virupaksha Temple", "A living temple near the old bazaar."], ["Vittala Temple", "Known for its stone chariot and musical pillars."], ["Matanga Hill", "A broad sunrise view over the ruins."]], plan: "Use sun protection, carry plenty of water and arrange local transport between dispersed sites.", news: { title: "Heat and walking advisory", text: "The open ruins offer little shade in midday heat; schedule the longest walks early.", score: 46, level: "Moderate" } } },
    { package_id: "golden-temple-007", name: "Golden Temple", state: "Punjab", destination: [74.8765, 31.6200], profile: { hero: "A serene sanctuary reflected in the Amrit Sarovar.", about: ["Sri Harmandir Sahib is Sikhism’s holiest shrine, open to visitors from every background and centred on service and reflection.", "The complex includes the community kitchen, where volunteers serve thousands of meals each day."], sights: [["Harmandir Sahib", "The gilded sanctum set within the sacred pool."], ["Langar hall", "A community meal offered in the spirit of equality."], ["Akal Takht", "A central institution of Sikh tradition."]], plan: "Cover your head, dress modestly and allow ample time for security and the parikrama.", news: { title: "Pilgrim queue advisory", text: "Wait times rise around prayer services and weekends; arrive with a flexible schedule.", score: 33, level: "Guarded" } } },
    { package_id: "charminar-008", name: "Charminar", state: "Telangana", destination: [78.4747, 17.3616], profile: { hero: "Four minarets above Hyderabad's old city.", about: ["Built in 1591, the Charminar anchors a dense quarter of bazaars, food stalls and historic religious sites.", "The surrounding lanes offer a vivid contrast between the monument’s symmetry and everyday city life."], sights: [["Charminar balconies", "Views across the old city from the historic monument."], ["Laad Bazaar", "Famous for bangles, textiles and festive colour."], ["Mecca Masjid", "A monumental mosque close to the square."]], plan: "The lanes are busiest after dusk; keep valuables secure and use designated drop-off points.", news: { title: "Old city traffic note", text: "Narrow approaches can be congested, especially in the evening market hours.", score: 51, level: "Elevated" } } },
    { package_id: "varanasi-ghats-009", name: "Varanasi Ghats", state: "Uttar Pradesh", destination: [83.0100, 25.3176], profile: { hero: "Dawn, ritual and the rhythm of the Ganges.", about: ["Varanasi’s stepped ghats are a living riverfront where ceremonies, boats, learning and daily life meet.", "A sunrise boat ride and an evening aarti offer very different perspectives on the city."], sights: [["Dashashwamedh Ghat", "The well-known setting for evening Ganga Aarti."], ["Assi Ghat", "A relaxed southern starting point for walks."], ["River boat ride", "A view of the ghats unfolding from the water."]], plan: "Follow local guidance near the river, keep to well-lit routes at night, and respect photography restrictions.", news: { title: "Riverfront safety note", text: "Use licensed boats and be cautious on wet steps near the waterline.", score: 48, level: "Moderate" } } },
    { package_id: "darjeeling-010", name: "Darjeeling", state: "West Bengal", destination: [88.2636, 27.0410], profile: { hero: "Tea gardens and Himalayan horizons.", about: ["Darjeeling is a hill town known for its tea, heritage railway and clear-weather views toward Kanchenjunga.", "Its steep lanes reward slow exploration, from observatory viewpoints to tucked-away cafés."], sights: [["Tiger Hill", "A celebrated sunrise lookout when weather permits."], ["Toy Train", "The heritage railway threading through the hills."], ["Tea estates", "A chance to see the landscape behind Darjeeling tea."]], plan: "Pack layers and allow contingency time: mountain weather and road conditions can change quickly.", news: { title: "Mountain weather watch", text: "Visibility and road travel can shift with rain or fog; keep your itinerary flexible.", score: 57, level: "Elevated" } } },
];
const PACKAGE_IMAGES = {
    "mahabalipuram-001": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=90",
    "taj-mahal-002": "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=1600&q=90",
    "gateway-mumbai-003": "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=1600&q=90",
    "india-gate-004": "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1600&q=90",
    "mysore-palace-005": "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=90",
    "hampi-006": "https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&w=1600&q=90",
    "golden-temple-007": "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1600&q=90",
    "charminar-008": "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1600&q=90",
    "varanasi-ghats-009": "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1600&q=90",
    "darjeeling-010": "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1600&q=90",
};

function detailedGuide(seed) {
    return [
        `${seed.name} rewards an unhurried visit. Beyond the headline landmark, leave space to notice the changing light, nearby streets and the small details that give this part of ${seed.state} its character.`,
        `For a smoother arrival, keep your route, entry requirements and local opening times in mind. The package view pairs the journey from Alandur Metro with practical context for exploring ${seed.name} at a comfortable pace.`,
        `Start with the best-known area, then take a quieter second pass. This usually reveals more of the textures, viewpoints and everyday life around ${seed.name} than a rushed stop can offer.`,
        `Food, transport and rest stops are part of the experience too. Ask locally for current recommendations, especially if you are travelling on a weekend, public holiday or during seasonal weather changes.`,
        `Keep a little flexibility in the schedule. Crowds, weather and traffic can alter the rhythm of a day, but they also create opportunities to explore nearby lanes, gardens, museums or viewpoints.`,
        `Respect local customs, follow site guidance and support nearby businesses where possible. A flexible plan makes it easier to enjoy ${seed.name} if conditions shift during the day.`,
    ];
}

function fallbackRoute(destination = MAHABALIPURAM) {
    // A local approximation following the East Coast Road. It keeps the map useful
    // when the optional OSRM road-routing service cannot be reached at startup.
    if (destination[0] !== MAHABALIPURAM[0] || destination[1] !== MAHABALIPURAM[1]) {
        return [ALANDUR, [
            (ALANDUR[0] + destination[0]) / 2,
            (ALANDUR[1] + destination[1]) / 2,
        ], destination];
    }
    return [
        ALANDUR, [80.1662, 12.9902], [80.2154, 12.9656], [80.2339, 12.9418],
        [80.2436, 12.9159], [80.2490, 12.8779], [80.2473, 12.8461],
        [80.2388, 12.8134], [80.2297, 12.7776], [80.2209, 12.7375],
        [80.2115, 12.6972], [80.2026, 12.6596], destination,
    ];
}

async function calculateRoute(destination) {
    try {
        const coordinates = `${ALANDUR.join(",")};${destination.join(",")}`;
        const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson`, { signal: AbortSignal.timeout(8000) });
        const result = await response.json();
        if (response.ok && result.routes?.[0]?.geometry?.coordinates?.length) {
            return { route: result.routes[0].geometry.coordinates, source: "osrm" };
        }
    } catch (error) {
        console.warn("Route service unavailable; using the local route fallback.");
    }
    return { route: fallbackRoute(destination), source: "local-fallback" };
}

export async function initialisePackages() {
    fs.mkdirSync("./package", { recursive: true });
    const packages = fs.existsSync(PACKAGE_FILE)
        ? JSON.parse(fs.readFileSync(PACKAGE_FILE, "utf-8"))
        : [];

    let didUpdatePackages = false;
    await Promise.all(PACKAGE_SEEDS.map(async (seed) => {
        const existing = packages.find((item) => item.package_id === seed.package_id);
        // Routes are calculated once, then retained by package_id. Startup only fills
        // in metadata that may have been added in a later version of the app.
        if (existing?.route?.length) {
            Object.assign(existing, { ...seed, origin: "Alandur Metro", profile: {
                ...seed.profile,
                image: PACKAGE_IMAGES[seed.package_id],
                details: detailedGuide(seed),
            } });
            didUpdatePackages = true;
            return;
        }
        const profile = {
            ...seed.profile,
            image: PACKAGE_IMAGES[seed.package_id],
            details: detailedGuide(seed),
        };
        const calculated = await calculateRoute(seed.destination);
        const record = {
            ...seed,
            origin: "Alandur Metro",
            route: calculated.route,
            route_source: calculated.source,
            profile,
        };
        if (existing) Object.assign(existing, record);
        else packages.push(record);
        didUpdatePackages = true;
    }));
    if (didUpdatePackages) {
        fs.writeFileSync(PACKAGE_FILE, JSON.stringify(packages, null, 2));
        console.log("Package routes and destination profiles prepared");
    }
}

router.get("/", (req, res) => {
    const packages = JSON.parse(fs.readFileSync(PACKAGE_FILE, "utf-8"));
    return res.json(packages.map(({ route, ...item }) => item));
});

router.get("/:packageId", (req, res) => {
    const packages = JSON.parse(fs.readFileSync(PACKAGE_FILE, "utf-8"));
    const packageInfo = packages.find((item) => item.package_id === req.params.packageId);
    if (!packageInfo) return res.status(404).json({ error: "package not found" });
    return res.json(packageInfo);
});

export default router;
