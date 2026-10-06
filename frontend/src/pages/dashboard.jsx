import { useEffect, useMemo, useState } from "react";
import Map from "../components/map.jsx";
import mahabalipuramImage from "../images/mahabalipuram.jpg";
import darjeelingImage from "../images/darjeeling.jpg";
import goldenTempleImage from "../images/golden-temple.jpeg";
import mysorePalaceImage from "../images/mysore-palace.jpg";
import hampiImage from "../images/hampi.jpg";
import tajMahalImage from "../images/taj-mahal.jpg";
import varanasiGhatsImage from "../images/varanasi-ghats.jpg";
import gatewayOfIndiaImage from "../images/gateway-of-india.jpg";
import charminarImage from "../images/charminar.jpeg";
import indiaGateImage from "../images/india-gate.jpeg";

const packageImages = {
    "mahabalipuram-001": mahabalipuramImage,
    "taj-mahal-002": tajMahalImage,
    "gateway-mumbai-003": gatewayOfIndiaImage,
    "india-gate-004": indiaGateImage,
    "mysore-palace-005": mysorePalaceImage,
    "hampi-006": hampiImage,
    "golden-temple-007": goldenTempleImage,
    "charminar-008": charminarImage,
    "varanasi-ghats-009": varanasiGhatsImage,
    "darjeeling-010": darjeelingImage,
};
const imageFraming = {
    "taj-mahal-002": { backgroundPosition: "center 38%" },
    "india-gate-004": { backgroundPosition: "center 38%" },
    "mysore-palace-005": { backgroundPosition: "center 38%" },
    "hampi-006": { backgroundPosition: "center 38%" },
    "golden-temple-007": { backgroundPosition: "center 38%" },
    "charminar-008": { backgroundPosition: "center 38%" },
    "varanasi-ghats-009": { backgroundPosition: "center 38%" },
    "gateway-mumbai-003": { backgroundPosition: "center center", backgroundSize: "120% auto" },
};

function Dashboard({ token, onLogout }){
    const [route, setRoute] = useState(null);
    const [selectedPackage, setSelectedPackage] = useState(null);
    const [packages, setPackages] = useState([]);
    const [isLoadingRoute, setIsLoadingRoute] = useState(false);
    const [showBandDialog, setShowBandDialog] = useState(false);
    const [deviceToken, setDeviceToken] = useState("");
    const [isCreatingDeviceToken, setIsCreatingDeviceToken] = useState(false);
    const [deviceTokenError, setDeviceTokenError] = useState("");
    const [showMeDialog, setShowMeDialog] = useState(false);
    const [locations, setLocations] = useState([]);
    const [locationsError, setLocationsError] = useState("");
    const [search, setSearch] = useState("");
    const [radius, setRadius] = useState("");
    const [userLocation, setUserLocation] = useState(null);
    const [locateRequest, setLocateRequest] = useState(0);
    const [locationMessage, setLocationMessage] = useState("");
    const [showContactsDialog, setShowContactsDialog] = useState(false);
    const [contacts, setContacts] = useState([newContact()]);
    const [contactsError, setContactsError] = useState("");
    const [isSavingContacts, setIsSavingContacts] = useState(false);

    useEffect(() => {
        fetch("/packages")
            .then((response) => response.ok ? response.json() : [])
            .then(setPackages)
            .catch(() => setPackages([]));
    }, []);

    const filteredPackages = useMemo(() => packages.filter((item) => {
        const searchMatches = `${item.name} ${item.state}`.toLowerCase().includes(search.toLowerCase());
        if (!searchMatches || !radius || !userLocation) return searchMatches;
        const [longitude, latitude] = item.destination;
        return distanceInKm(userLocation, [latitude, longitude]) <= Number(radius);
    }), [packages, search, radius, userLocation]);

    async function selectPackage(packageId) {
        setIsLoadingRoute(true);
        try {
            const response = await fetch(`/packages/${packageId}`);
            if (!response.ok) throw new Error("Unable to load route");
            const packageInfo = await response.json();
            setRoute(packageInfo.route.map(([longitude, latitude]) => [latitude, longitude]));
            setSelectedPackage(packageInfo);
        } finally {
            setIsLoadingRoute(false);
        }
    }

    function returnToDashboard() {
        setSelectedPackage(null);
        setRoute(null);
    }

    function findMyLocation() {
        setLocationMessage("Finding your location…");
        setLocateRequest((value) => value + 1);
    }

    function handleLocation(location) {
        setUserLocation(location);
        setLocationMessage("Showing packages near you.");
    }

    async function openContacts() {
        setContactsError("");
        setShowContactsDialog(true);
        try {
            const response = await fetch("/user/contacts", { headers: { Authorization: `Bearer ${token}` } });
            const body = await responseBody(response);
            if (!response.ok) throw new Error(body.error || "Could not load contacts");
            setContacts(body.contacts.length ? body.contacts.map((contact) => ({ ...contact, id: crypto.randomUUID() })) : [newContact()]);
        } catch {
            setContactsError("Saved contacts could not be loaded. You can still add new contacts below.");
        }
    }

    function updateContact(index, field, value) {
        setContacts((current) => current.map((contact, contactIndex) => contactIndex === index ? { ...contact, [field]: value } : contact));
    }

    async function saveContacts(event) {
        event.preventDefault();
        setContactsError("");
        setIsSavingContacts(true);
        try {
            const response = await fetch("/user/contacts", { method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ contacts }) });
            const body = await responseBody(response);
            if (!response.ok) throw new Error(body.error || "Could not save contacts");
            setContacts(body.contacts.map((contact) => ({ ...contact, id: crypto.randomUUID() })));
            setShowContactsDialog(false);
        } catch (error) {
            setContactsError(error.message);
        } finally {
            setIsSavingContacts(false);
        }
    }

    async function connectPhone() {
        setIsCreatingDeviceToken(true);
        setDeviceTokenError("");
        try {
            const response = await fetch("/user/device-token", { method: "POST", headers: { Authorization: `Bearer ${token}` } });
            const body = await responseBody(response);
            if (!response.ok) throw new Error(body.error || "Could not generate a phone token");
            setDeviceToken(body.token);
        } catch (error) {
            setDeviceTokenError(error.message);
        } finally {
            setIsCreatingDeviceToken(false);
        }
    }

    async function openMe() {
        setLocationsError("");
        setShowMeDialog(true);
        try {
            const response = await fetch("/api/location", { headers: { Authorization: `Bearer ${token}` } });
            const body = await responseBody(response);
            if (!response.ok) throw new Error(body.error || "Could not load location history");
            setLocations(body.locations || []);
        } catch (error) {
            setLocationsError(error.message);
        }
    }

    const profile = selectedPackage?.profile;
    const heroImage = selectedPackage ? packageImages[selectedPackage.package_id] : "";
    const heroFraming = selectedPackage ? imageFraming[selectedPackage.package_id] : {};

    return (
        <main className={`dashboard ${selectedPackage ? "detail-active" : ""}`}>
            <header className="dashboard-header">
                <div>
                    <p className="eyebrow">SAFORA</p>
                    <h1>{selectedPackage ? selectedPackage.name : "Package dashboard"}</h1>
                </div>
                <div className="header-actions">
                    {selectedPackage && <button className="back-button" onClick={returnToDashboard}>← Back to packages</button>}
                    <button className="contacts-button" onClick={openMe}>Me</button>
                    <button className="contacts-button" onClick={openContacts}>Add emergency contacts</button>
                    <button className="logout-button" onClick={onLogout}>Log out</button>
                </div>
            </header>

            {!selectedPackage ? <>
            <section className="map-section" aria-labelledby="map-title">
                <div className="section-heading">
                    <div>
                        <p className="eyebrow">OVERVIEW</p>
                        <h2 id="map-title">Your package map</h2>
                    </div>
                    <span className="map-status"><span /> Live location</span>
                </div>
                <Map route={route} userLocation={userLocation} locateRequest={locateRequest} onLocation={handleLocation} />
            </section>

            <section className="packages-section" aria-labelledby="packages-title">
                <div className="section-heading">
                    <div>
                        <p className="eyebrow">DELIVERIES</p>
                        <h2 id="packages-title">Packages</h2>
                    </div>
                    <span className="package-count">{filteredPackages.length} of {packages.length} destinations</span>
                </div>
                <div className="package-filters">
                    <label className="search-field" htmlFor="package-search"><span aria-hidden="true">⌕</span><input id="package-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search destinations" /></label>
                    <label className="radius-field" htmlFor="radius"><span>Within</span><input id="radius" type="number" min="1" value={radius} onChange={(event) => setRadius(event.target.value)} placeholder="km" /><span>km</span></label>
                    <button className="location-button" onClick={findMyLocation}>⌖ Use my location</button>
                </div>
                {locationMessage && <p className="location-message">{locationMessage}{radius && !userLocation ? " Set your location to apply the radius." : ""}</p>}
                <div className="packages-grid">
                    {filteredPackages.map((item) => <button className="package-card" key={item.package_id} onClick={() => selectPackage(item.package_id)} disabled={isLoadingRoute}>
                        <div className="package-icon" aria-hidden="true">□</div><div><h3>{item.name}</h3><p>{item.state} · From Alandur Metro</p></div><span className="arrow" aria-hidden="true">→</span>
                    </button>)}
                </div>
                {!filteredPackages.length && <p className="empty-packages">No packages match those filters.</p>}
            </section>
            </> : <section className="destination-layout" aria-labelledby="destination-title">
                <article className="destination-content">
                    <div className="destination-heading">
                        <div><p className="eyebrow">DESTINATION GUIDE</p><h2 id="destination-title">{selectedPackage.name}, a memorable Indian landmark</h2></div>
                        <button className="activate-button" onClick={() => setShowBandDialog(true)}>Activate</button>
                    </div>
                    <div className="hero-photo" style={{ backgroundImage: `linear-gradient(0deg, rgba(11, 31, 19, .67), rgba(11, 31, 19, .04) 65%), url("${heroImage}")`, ...heroFraming }}><div><p className="card-label">{selectedPackage.name.toUpperCase()} · {selectedPackage.state.toUpperCase()}</p><span>{profile?.hero}</span></div></div>
                    <div className="guide-intro">
                        <p>{profile?.about[0]}</p>
                        <p>{profile?.about[1]}</p>
                    </div>
                    <div className="guide-section">
                        <p className="card-label">WHAT TO SEE</p>
                        <div className="guide-list">
                            {profile?.sights.map(([title, description]) => <div key={title}><h3>{title}</h3><p>{description}</p></div>)}
                        </div>
                    </div>
                    <div className="guide-section deeper-guide">
                        <p className="card-label">A DEEPER LOOK</p>
                        {profile?.details?.map((detail) => <p key={detail}>{detail}</p>)}
                    </div>
                    <div className="guide-section travel-note">
                        <p className="card-label">PLAN THE DAY</p>
                        <h3>Plan your visit</h3>
                        <p>{profile?.plan} The map shows the route from Alandur Metro to {selectedPackage.name}.</p>
                    </div>
                </article>
                <aside className="destination-sidebar">
                    <section className="side-map" aria-labelledby="map-title">
                        <div className="side-card-heading"><div><p className="card-label">ROUTE</p><h3 id="map-title">Alandur → {selectedPackage.name}</h3></div><span className="map-status"><span /> Live</span></div>
                        <Map route={route} />
                    </section>
                    <article className="news-card compact-news">
                        <p className="card-label">CURRENT NEWS</p>
                        <h3>{profile?.news.title}</h3>
                        <p>{profile?.news.text}</p>
                        <div className="risk-row"><span>Risk score</span><strong>{profile?.news.score} <small>/ 100</small></strong><em>{profile?.news.level}</em></div>
                    </article>
                </aside>
            </section>}

            {showBandDialog && <div className="modal-backdrop" role="presentation" onMouseDown={() => setShowBandDialog(false)}>
                <section className="band-modal" role="dialog" aria-modal="true" aria-labelledby="band-title" onMouseDown={(event) => event.stopPropagation()}>
                    <button className="modal-close" aria-label="Close" onClick={() => setShowBandDialog(false)}>×</button>
                    <div className="band-icon" aria-hidden="true">⌁</div>
                    <p className="eyebrow">SAFETY SETUP</p>
                    <h2 id="band-title">Connect with phone</h2>
                    <p>Use this token in your phone location app. Send location updates to <code>/api/location</code> with an <code>Authorization: Bearer TOKEN</code> header.</p>
                    {deviceToken && <div className="device-token"><span>Your phone token</span><code>{deviceToken}</code></div>}
                    {deviceTokenError && <p className="form-error" role="alert">{deviceTokenError}</p>}
                    <button className="connect-button" onClick={connectPhone} disabled={isCreatingDeviceToken || !!deviceToken}>{isCreatingDeviceToken ? "Generating…" : deviceToken ? "Token generated" : "Generate phone token"}</button>
                </section>
            </div>}

            {showMeDialog && <div className="modal-backdrop" role="presentation" onMouseDown={() => setShowMeDialog(false)}>
                <section className="contacts-modal me-modal" role="dialog" aria-modal="true" aria-labelledby="me-title" onMouseDown={(event) => event.stopPropagation()}>
                    <button className="modal-close" aria-label="Close" onClick={() => setShowMeDialog(false)}>×</button>
                    <p className="eyebrow">LOCATION HISTORY</p>
                    <h2 id="me-title">Me</h2>
                    <p>Phone location updates saved to your account.</p>
                    {locationsError && <p className="form-error" role="alert">{locationsError}</p>}
                    {!locationsError && !locations.length && <p>No phone locations received yet.</p>}
                    {!!locations.length && <div className="location-history">{[...locations].reverse().map((location, index) => <article className="location-entry" key={`${location.lat}-${location.lon}-${index}`}>
                        <strong>{location.lat}, {location.lon}</strong>
                        <span>Altitude: {location.alt} m</span><span>Velocity: {location.vel}</span>
                    </article>)}</div>}
                </section>
            </div>}

            {showContactsDialog && <div className="modal-backdrop" role="presentation" onMouseDown={() => setShowContactsDialog(false)}>
                <section className="contacts-modal" role="dialog" aria-modal="true" aria-labelledby="contacts-title" onMouseDown={(event) => event.stopPropagation()}>
                    <button className="modal-close" aria-label="Close" onClick={() => setShowContactsDialog(false)}>×</button>
                    <p className="eyebrow">SAFETY SETUP</p>
                    <h2 id="contacts-title">Emergency contacts</h2>
                    <p>Add the people we should contact in an emergency. You can add as many pairs as you need.</p>
                    <form onSubmit={saveContacts}>
                        <div className="contact-list">
                                {contacts.map((contact, index) => <div className="contact-row" key={contact.id}>
                                <input aria-label={`Contact ${index + 1} name`} value={contact.name} onChange={(event) => updateContact(index, "name", event.target.value)} placeholder="Name" required />
                                <input aria-label={`Contact ${index + 1} phone`} value={contact.phone} onChange={(event) => updateContact(index, "phone", event.target.value)} placeholder="Phone number" required />
                                {contacts.length > 1 && <button type="button" className="remove-contact" aria-label="Remove contact" onClick={() => setContacts((current) => current.filter((_, contactIndex) => contactIndex !== index))}>×</button>}
                            </div>)}
                        </div>
                        <button type="button" className="add-contact" onClick={() => setContacts((current) => [...current, newContact()])}>+ Add another contact</button>
                        {contactsError && <p className="form-error" role="alert">{contactsError}</p>}
                        <button className="connect-button" type="submit" disabled={isSavingContacts}>{isSavingContacts ? "Saving…" : "Save contacts"}</button>
                    </form>
                </section>
            </div>}
        </main>
    );
}

function distanceInKm([lat1, lon1], [lat2, lon2]) {
    const radians = (value) => value * Math.PI / 180;
    const earthRadius = 6371;
    const latitudeDistance = radians(lat2 - lat1);
    const longitudeDistance = radians(lon2 - lon1);
    const value = Math.sin(latitudeDistance / 2) ** 2 + Math.cos(radians(lat1)) * Math.cos(radians(lat2)) * Math.sin(longitudeDistance / 2) ** 2;
    return earthRadius * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

function newContact() {
    return { id: crypto.randomUUID(), name: "", phone: "" };
}

async function responseBody(response) {
    const text = await response.text();
    try {
        return JSON.parse(text);
    } catch {
        return { error: "The server returned an unexpected response. Please ensure the backend is running." };
    }
}

export default Dashboard;
