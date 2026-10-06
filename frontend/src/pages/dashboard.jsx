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
    const [locations, setLocations] = useState([]);
    const [locationsError, setLocationsError] = useState("");
    const [showTravelHistory, setShowTravelHistory] = useState(false);
    const [tripHistory, setTripHistory] = useState([]);
    const [selectedTrip, setSelectedTrip] = useState(null);
    const [travelerName, setTravelerName] = useState("");
    const [tripComment, setTripComment] = useState("");
    const [tripError, setTripError] = useState("");
    const [tripRoute, setTripRoute] = useState([]);
    const [isEndingTrip, setIsEndingTrip] = useState(false);
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

    useEffect(() => {
        if (!selectedTrip || selectedTrip.endedAt) return undefined;
        let cancelled = false;
        const refresh = async () => {
            try {
                const response = await fetch("/api/trips", { headers: { Authorization: `Bearer ${token}` } });
                const body = await responseBody(response);
                const current = body.trips?.find((trip) => trip.id === selectedTrip.id);
                if (!cancelled && response.ok && current) {
                    setSelectedTrip(current);
                    setTripHistory((existing) => existing.map((trip) => trip.id === current.id ? current : trip));
                }
            } catch { /* keep the most recently received track visible */ }
        };
        const timer = window.setInterval(refresh, 3000);
        return () => { cancelled = true; window.clearInterval(timer); };
    }, [selectedTrip?.id, selectedTrip?.endedAt, token]);

    useEffect(() => {
        if (!selectedTrip) { setTripRoute([]); return; }
        let cancelled = false;
        fetch(`/packages/${selectedTrip.package_id}`).then((response) => response.ok ? response.json() : null).then((body) => {
            if (!cancelled) setTripRoute(body?.route?.map(([longitude, latitude]) => [latitude, longitude]) || []);
        }).catch(() => { if (!cancelled) setTripRoute([]); });
        return () => { cancelled = true; };
    }, [selectedTrip?.package_id]);

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
        setSelectedTrip(null);
        setShowTravelHistory(false);
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
            setDeviceToken(`Bearer ${body.token}`);
        } catch (error) {
            setDeviceTokenError(error.message);
        } finally {
            setIsCreatingDeviceToken(false);
        }
    }

    async function openMe() {
        setLocationsError("");
        setShowTravelHistory(true);
        setSelectedTrip(null);
        try {
            const response = await fetch("/api/trips", { headers: { Authorization: `Bearer ${token}` } });
            const body = await responseBody(response);
            if (!response.ok) throw new Error(body.error || "Could not load location history");
            setTravelerName(body.name || "Traveler");
            setTripHistory(body.trips || []);
        } catch (error) {
            setLocationsError(error.message);
        }
    }

    async function activateTrip() {
        setDeviceTokenError("");
        try {
            const response = await fetch("/api/trips", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ package_id: selectedPackage.package_id, package_name: selectedPackage.name }) });
            const body = await responseBody(response);
            if (!response.ok) throw new Error(body.error || "Could not start this trip");
            setTripHistory((current) => [body.trip, ...current]);
            setShowBandDialog(true);
        } catch (error) {
            setDeviceTokenError(error.message);
            setShowBandDialog(true);
        }
    }

    async function endTrip() {
        if (!selectedTrip) return;
        setTripError("");
        setIsEndingTrip(true);
        try {
            const response = await fetch(`/api/trips/${selectedTrip.id}/end`, { method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ comments: tripComment }) });
            const body = await responseBody(response);
            if (!response.ok) throw new Error(body.error || "Could not end this trip");
            setSelectedTrip(body.trip);
            setTripHistory((current) => current.map((trip) => trip.id === body.trip.id ? body.trip : trip));
        } catch (error) {
            setTripError(error.message);
        } finally {
            setIsEndingTrip(false);
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
                    <h1>{selectedPackage ? selectedPackage.name : showTravelHistory ? (selectedTrip ? selectedTrip.package_name : "Travel history") : "Package dashboard"}</h1>
                </div>
                <div className="header-actions">
                    {(selectedPackage || showTravelHistory) && <button className="back-button" onClick={returnToDashboard}>← Back to packages</button>}
                    <button className="contacts-button" onClick={openMe}>Me</button>
                    <button className="contacts-button" onClick={openContacts}>Add emergency contacts</button>
                    <button className="logout-button" onClick={onLogout}>Log out</button>
                </div>
            </header>

            {showTravelHistory ? <section className="travel-page" aria-labelledby="travel-history-title">
                {!selectedTrip ? <>
                    <div className="section-heading"><div><p className="eyebrow">YOUR JOURNEYS</p><h2 id="travel-history-title">Travel history</h2></div><span className="package-count">{tripHistory.length} trips</span></div>
                    {locationsError && <p className="form-error" role="alert">{locationsError}</p>}
                    {!tripHistory.length && !locationsError && <p className="empty-packages">Your trips will appear here when you activate a package.</p>}
                    <div className="trip-grid">{[...tripHistory].sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt)).map((trip) => <button className="trip-card" key={trip.id} onClick={() => { setSelectedTrip(trip); setLocations(trip.locations || []); setTripComment(trip.comments || ""); setTripError(""); }}>
                        <span className={`trip-tag ${trip.endedAt ? "done" : "active"}`}>{trip.endedAt ? "DONE" : "ACTIVE"}</span><h3>{trip.package_name}</h3><p>{formatTravelDate(trip.startedAt)}</p>
                    </button>)}</div>
                </> : <>
                    <div className="section-heading"><div><p className="eyebrow">TRIP DETAILS</p><h2 id="travel-history-title">{selectedTrip.package_name}</h2></div><button className="back-button" onClick={() => setSelectedTrip(null)}>← All trips</button></div>
                    {selectedTrip.offRoute && <p className="deviation-alert" role="alert">You’re about 10 m off the planned path. Please get back on the path.</p>}
                    <Map route={tripRoute} locations={selectedTrip.locations || []} />
                    <section className="trip-information"><p className="eyebrow">TRAVEL NOTES</p><h3>Trip history</h3><p><strong>Traveler</strong> {travelerName}</p><p><strong>Started</strong> {formatTravelDate(selectedTrip.startedAt)}</p><p><strong>Ended</strong> {selectedTrip.endedAt ? formatTravelDate(selectedTrip.endedAt) : "Still active"}</p>
                        {selectedTrip.endedAt ? <p><strong>Your comments</strong> {selectedTrip.comments || "No comments added."}</p> : <><label htmlFor="trip-comment">Your comments</label><textarea id="trip-comment" value={tripComment} onChange={(event) => setTripComment(event.target.value)} placeholder="Add a note about this trip" rows="3"/><button className="connect-button end-trip-button" onClick={endTrip} disabled={isEndingTrip}>{isEndingTrip ? "Ending trip…" : "End trip"}</button></>}
                        {tripError && <p className="form-error" role="alert">{tripError}</p>}
                    </section>
                </>}
            </section> : !selectedPackage ? <>
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
                        <button className="activate-button" onClick={activateTrip}>Activate</button>
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
                    <p>Copy this bearer value into your phone location app’s authorization setting. Send location updates to <code>/api/location</code>.</p>
                    {deviceToken && <div className="device-token"><span>Your phone token</span><code>{deviceToken}</code></div>}
                    {deviceTokenError && <p className="form-error" role="alert">{deviceTokenError}</p>}
                    <button className="connect-button" onClick={connectPhone} disabled={isCreatingDeviceToken || !!deviceToken}>{isCreatingDeviceToken ? "Generating…" : deviceToken ? "Token generated" : "Generate phone token"}</button>
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

function formatTravelDate(value) {
    if (!value) return "Date unavailable";
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
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
