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
    "mahabalipuram-001": { 
        backgroundPosition: "center, center 10%", 
        backgroundSize: "cover, 100% auto", 
        backgroundRepeat: "no-repeat" 
    },
    "taj-mahal-002": { 
        backgroundPosition: "center, center 0%", 
        backgroundSize: "cover, 100% auto", 
        backgroundRepeat: "no-repeat" 
    },
    "india-gate-004": { 
        backgroundPosition: "center 38%", 
        backgroundSize: "cover, 100% auto",
        backgroundRepeat: "no-repeat" 
    },
    "mysore-palace-005": { 
        backgroundPosition: "center, center 10%", 
        backgroundSize: "cover, 100% auto", 
        backgroundRepeat: "no-repeat" 
    },
    "hampi-006": { 
        backgroundPosition: "center, center 30%", 
        backgroundSize: "cover, 100% auto", 
        backgroundRepeat: "no-repeat" 
    },
    "golden-temple-007": { 
        backgroundPosition: "center, center 35%", 
        backgroundSize: "cover, 100% auto", 
        backgroundRepeat: "no-repeat" 
    },
    "charminar-008": { 
        backgroundPosition: "center, center 90%", 
        backgroundSize: "cover, 100% auto", 
        backgroundRepeat: "no-repeat" 
    },
    "varanasi-ghats-009": { 
        backgroundPosition: "center 38%", 
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat" 
    },
    "gateway-mumbai-003": { 
        backgroundPosition: "center, center 60%", 
        backgroundSize: "cover, 100% auto", 
        backgroundRepeat: "no-repeat" 
    },
    "darjeeling-010": { 
        backgroundPosition: "center, center 50%", 
        backgroundSize: "cover, 100% auto", 
        backgroundRepeat: "no-repeat" 
    },
};


function Dashboard({ token, onLogout }){
    const [route, setRoute] = useState(null);
    const [selectedPackage, setSelectedPackage] = useState(null);
    const [packages, setPackages] = useState([]);
    const [packageRoutes, setPackageRoutes] = useState([]);
    const [isLoadingRoute, setIsLoadingRoute] = useState(false);
    const [showBandDialog, setShowBandDialog] = useState(false);
    const [deviceToken, setDeviceToken] = useState("");
    const [isCreatingDeviceToken, setIsCreatingDeviceToken] = useState(false);
    const [deviceTokenError, setDeviceTokenError] = useState("");
    const [locations, setLocations] = useState([]);
    const [locationsError, setLocationsError] = useState("");
    const [showTravelHistory, setShowTravelHistory] = useState(false);
    const [tripHistory, setTripHistory] = useState([]);
    const [deletingTripId, setDeletingTripId] = useState("");
    const [selectedTrip, setSelectedTrip] = useState(null);
    const [travelerName, setTravelerName] = useState("");
    const [tripComment, setTripComment] = useState("");
    const [tripError, setTripError] = useState("");
    const [tripRoute, setTripRoute] = useState([]);
    const [isEndingTrip, setIsEndingTrip] = useState(false);
    const [showPlanDialog, setShowPlanDialog] = useState(false);
    const [tripStart, setTripStart] = useState("");
    const [tripDestination, setTripDestination] = useState("");
    const [isPlanningTrip, setIsPlanningTrip] = useState(false);
    const [planError, setPlanError] = useState("");
    const [isStartingTrip, setIsStartingTrip] = useState(false);
    const [tripStartStatus, setTripStartStatus] = useState("");
    const [isSendingSos, setIsSendingSos] = useState(false);
    const [sosMessage, setSosMessage] = useState("");
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
        let cancelled = false;
        async function loadPackagesAndRoutes() {
            try {
                const response = await fetch("/packages");
                if (!response.ok) throw new Error("Could not load packages");
                const items = await response.json();
                if (cancelled) return;
                setPackages(items);

                const routes = await Promise.all(items.map(async (item) => {
                    try {
                        const routeResponse = await fetch(`/packages/${item.package_id}`);
                        if (!routeResponse.ok) return null;
                        const packageInfo = await routeResponse.json();
                        return {
                            id: item.package_id,
                            name: item.name,
                            route: packageInfo.route?.map(([longitude, latitude]) => [latitude, longitude]) || [],
                        };
                    } catch {
                        return null;
                    }
                }));
                if (!cancelled) setPackageRoutes(routes.filter((item) => item?.route.length));
            } catch {
                if (!cancelled) setPackages([]);
            }
        }
        loadPackagesAndRoutes();
        return () => { cancelled = true; };
    }, []);

    useEffect(() => {
        if (!selectedTrip || selectedTrip.endedAt || selectedTrip.isPlanned) return undefined;
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
        if (!selectedTrip?.isPlanned || selectedTrip.travelBriefingStatus !== "loading") return undefined;
        let cancelled = false;
        const refreshBriefing = async () => {
            try {
                const response = await fetch("/api/trips", { headers: { Authorization: `Bearer ${token}` } });
                const body = await responseBody(response);
                const current = body.trips?.find((trip) => trip.id === selectedTrip.id);
                if (!cancelled && response.ok && current) {
                    setSelectedTrip(current);
                    setTripHistory((existing) => existing.map((trip) => trip.id === current.id ? current : trip));
                }
            } catch { /* keep showing the loading state until the next refresh */ }
        };
        const timer = window.setInterval(refreshBriefing, 2000);
        refreshBriefing();
        return () => { cancelled = true; window.clearInterval(timer); };
    }, [selectedTrip?.id, selectedTrip?.isPlanned, selectedTrip?.travelBriefingStatus, token]);

    useEffect(() => {
        if (!selectedTrip) { setTripRoute([]); return; }
        if (selectedTrip.isPlanned) { setTripRoute(selectedTrip.plannedRoute || []); return; }
        let cancelled = false;
        fetch(`/packages/${selectedTrip.package_id}`).then((response) => response.ok ? response.json() : null).then((body) => {
            if (!cancelled) setTripRoute(body?.route?.map(([longitude, latitude]) => [latitude, longitude]) || []);
        }).catch(() => { if (!cancelled) setTripRoute([]); });
        return () => { cancelled = true; };
    }, [selectedTrip?.package_id, selectedTrip?.isPlanned, selectedTrip?.id]);

    const filteredPackages = useMemo(() => packages.filter((item) => {
        const searchMatches = `${item.name} ${item.state}`.toLowerCase().includes(search.toLowerCase());
        if (!searchMatches || !radius || !userLocation) return searchMatches;
        const [longitude, latitude] = item.destination;
        return distanceInKm(userLocation, [latitude, longitude]) <= Number(radius);
    }), [packages, search, radius, userLocation]);
    const topRiskPackages = useMemo(() => [...packages]
        .sort((a, b) => (a.profile?.news?.score ?? 0) - (b.profile?.news?.score ?? 0))
        .slice(0, 3), [packages]);

    async function selectPackage(packageId) {
        setIsLoadingRoute(true);
        try {
            const response = await fetch(`/packages/${packageId}`);
            if (!response.ok) throw new Error("Unable to load route");
            const packageInfo = await response.json();
            setRoute(packageInfo.route.map(([longitude, latitude]) => [latitude, longitude]));
            window.scrollTo(0, 0);
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
        if (isStartingTrip) {
            setIsStartingTrip(false);
            setTripStartStatus("Trip started. Your current location is shown on the map.");
        }
    }

    function handleLocationError(message) {
        setLocationMessage(message);
        if (isStartingTrip) {
            setIsStartingTrip(false);
            setTripStartStatus(message);
        }
    }

    async function startPlannedTrip() {
        if (!selectedTrip) return;
        setTripError("");
        setIsStartingTrip(true);
        setTripStartStatus("Starting trip and getting travel information…");
        try {
            console.log("[Trip] Sending planned-trip start request; this should trigger Gemini on the backend.");
            const response = await fetch(`/api/trips/${selectedTrip.id}/start`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
            const body = await responseBody(response);
            if (!response.ok) throw new Error(body.error || "Could not start this trip");
            console.log(body.trip?.travelBriefing ? "[Trip] Gemini briefing received from backend." : "[Trip] Trip started, but the backend returned no Gemini briefing. Check the backend console.");
            setSelectedTrip(body.trip);
            setTripHistory((current) => current.map((trip) => trip.id === body.trip.id ? body.trip : trip));
            setTripStartStatus("Getting your current location…");
            setLocateRequest((value) => value + 1);
        } catch (error) {
            console.error("[Trip] Could not start planned trip or load its Gemini briefing:", error);
            setIsStartingTrip(false);
            setTripError(error.message);
            setTripStartStatus("");
        }
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
        try {
            const response = await fetch("/api/trips", { headers: { Authorization: `Bearer ${token}` } });
            const body = await responseBody(response);
            if (!response.ok) throw new Error(body.error || "Could not load location history");
            setTravelerName(body.name || "Traveler");
            const serverTrips = body.trips || [];
            const serverTripIds = new Set(serverTrips.map((trip) => trip.id));
            const trips = [...serverTrips, ...tripHistory.filter((trip) => !serverTripIds.has(trip.id))];
            setTripHistory(trips);
            setSelectedTrip(null);
        } catch (error) {
            setSelectedTrip(null);
            setLocationsError(error.message);
        }
    }

    async function deleteTrip(tripId) {
        setDeletingTripId(tripId);
        setLocationsError("");
        try {
            const response = await fetch(`/api/trips/${tripId}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
            const body = await responseBody(response);
            if (!response.ok) throw new Error(body.error || "Could not delete this trip");
            setTripHistory((current) => current.filter((trip) => trip.id !== tripId));
            if (selectedTrip?.id === tripId) {
                setSelectedTrip(null);
                setTripComment("");
            }
        } catch (error) {
            setLocationsError(error.message);
        } finally {
            setDeletingTripId("");
        }
    }

    async function sendSos() {
        setIsSendingSos(true);
        setSosMessage("");
        try {
            const response = await fetch("/user/contacts/sos", { method: "POST", headers: { Authorization: `Bearer ${token}` } });
            const body = await responseBody(response);
            if (!response.ok) throw new Error(body.error || "Could not send SOS");
            setSosMessage(body.message || "SOS sent to your emergency contacts");
        } catch (error) {
            setSosMessage(error.message);
        } finally {
            setIsSendingSos(false);
        }
    }

    async function planTrip(event) {
        event.preventDefault();
        setIsPlanningTrip(true);
        setPlanError("");
        try {
            console.log("[Trip planner] Sending start and destination to the backend.");
            const response = await fetch("/packages/plan-route", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ start: tripStart, destination: tripDestination }),
            });
            const body = await responseBody(response);
            if (!response.ok) throw new Error(body.error || "Could not plan this route");
            if (!Array.isArray(body.route) || body.route.length < 2) throw new Error("The route service returned no usable route");
            console.log(`[Trip planner] Route calculated using ${body.source || "unknown source"}.`);
            const plannedRoute = body.route.map(([longitude, latitude]) => [latitude, longitude]);
            const saveResponse = await fetch("/api/trips", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    package_id: "planned-route",
                    package_name: `${tripStart.trim()} → ${tripDestination.trim()}`,
                    start_address: body.start.name,
                    destination_address: body.destination.name,
                    isPlanned: true,
                    startPoint: [body.start.coordinates[1], body.start.coordinates[0]],
                    endPoint: [body.destination.coordinates[1], body.destination.coordinates[0]],
                    plannedRoute,
                    routeSource: body.source,
                }),
            });
            const savedBody = await responseBody(saveResponse);
            if (!saveResponse.ok) throw new Error(savedBody.error || "Could not save this planned trip");
            const plannedTrip = savedBody.trip;
            setTripHistory((current) => [plannedTrip, ...current]);
            setTripRoute(plannedTrip.plannedRoute);
            setTripStartStatus("");
            setIsStartingTrip(false);
            setSelectedTrip(plannedTrip);
            setSelectedPackage(null);
            setRoute(null);
            setShowTravelHistory(true);
            setShowPlanDialog(false);
            setPlanError("");
            window.scrollTo(0, 0);
        } catch (error) {
            console.error("[Trip planner] Could not create the planned trip:", error);
            setPlanError(error.message);
        } finally {
            setIsPlanningTrip(false);
        }
    }

    async function activateTrip() {
        setDeviceTokenError("");
        try {
            const response = await fetch("/api/trips", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({
                package_id: selectedPackage.package_id,
                package_name: selectedPackage.name,
                start_address: `${selectedPackage.origin || "Alandur Metro"}, Chennai, Tamil Nadu, India`,
                destination_address: `${selectedPackage.name}, ${selectedPackage.state}, India`,
            }) });
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
    const tripPackage = selectedTrip && packages.find((item) => item.package_id === selectedTrip.package_id);
    const tripStartAddress = selectedTrip && (selectedTrip.startAddress || selectedTrip.startName || `${tripPackage?.origin || "Alandur Metro"}, Chennai, Tamil Nadu, India`);
    const tripDestinationAddress = selectedTrip && (selectedTrip.destinationAddress || selectedTrip.destinationName || `${selectedTrip.package_name}, ${tripPackage?.state || "India"}, India`);
    const heroImage = selectedPackage ? packageImages[selectedPackage.package_id] : "";
    const heroFraming = selectedPackage ? imageFraming[selectedPackage.package_id] : {};

    return (
        <main className={`dashboard ${selectedPackage && !showTravelHistory ? "detail-active" : ""}`}>
            <header className="dashboard-header">
                <div>
                    <p className="eyebrow">SAFORA</p>
                    <h1>{selectedPackage ? selectedPackage.name : showTravelHistory ? (selectedTrip ? selectedTrip.package_name : "Travel history") : "Package dashboard"}</h1>
                </div>
                <div className="header-actions">
                    {(selectedPackage || showTravelHistory) && <button className="back-button" onClick={returnToDashboard}>← Back to packages</button>}
                    <button className="plan-trip-button" onClick={() => { setPlanError(""); setShowPlanDialog(true); }}>Plan a trip</button>
                    <button className="sos-button" onClick={sendSos} disabled={isSendingSos}>{isSendingSos ? "Sending SOS…" : "SOS"}</button>
                    <button className="contacts-button" onClick={openMe}>Me</button>
                    <button className="contacts-button" onClick={openContacts}>Add emergency contacts</button>
                    <button className="logout-button" onClick={onLogout}>Log out</button>
                </div>
            </header>
            {sosMessage && <p className="sos-status" role="status">{sosMessage}</p>}

            {showTravelHistory ? <section className="travel-page" aria-labelledby="travel-history-title">
                {!selectedTrip ? <>
                    <div className="section-heading"><div><p className="eyebrow">YOUR JOURNEYS</p><h2 id="travel-history-title">Travel history</h2></div><span className="package-count">{tripHistory.length} trips</span></div>
                    {locationsError && <p className="form-error" role="alert">{locationsError}</p>}
                    {!tripHistory.length && !locationsError && <p className="empty-packages">Your trips will appear here when you activate a package.</p>}
                    <div className="trip-grid">{[...tripHistory].sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt)).map((trip) => <div className="trip-card-wrapper" key={trip.id}>
                        <button className="trip-card" onClick={() => { setSelectedTrip(trip); setLocations(trip.locations || []); setTripComment(trip.comments || ""); setTripError(""); }}>
                            <span className={`trip-tag ${trip.endedAt ? "done" : trip.isPlanned ? "planned" : "active"}`}>{trip.endedAt ? "DONE" : trip.isPlanned ? "PLANNED" : "ACTIVE"}</span><h3>{trip.package_name}</h3><p>{formatTravelDate(trip.startedAt)}</p>
                        </button>
                        <button className="trip-delete-button" type="button" aria-label={`Delete trip ${trip.package_name}`} title="Delete trip" disabled={deletingTripId === trip.id} onClick={() => deleteTrip(trip.id)}>
                            {deletingTripId === trip.id ? <span className="trip-delete-spinner" aria-hidden="true">…</span> : <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M10 11v6m4-6v6M5 7l1 14h12l1-14M9 7V4h6v3" /></svg>}
                        </button>
                    </div>)}</div>
                </> : <>
                    <div className="section-heading"><div><p className="eyebrow">TRIP DETAILS</p><h2 id="travel-history-title">{selectedTrip.package_name}</h2></div><button className="back-button" onClick={() => setSelectedTrip(null)}>← All trips</button></div>
                    {selectedTrip.offRoute && <p className="deviation-alert" role="alert">You’re about 10 m off the planned path. Please get back on the path.</p>}
                    <div className="planned-trip-layout">
                        <aside className="planned-route-card">
                            <p className="eyebrow">{selectedTrip.isPlanned ? "PLANNED ROUTE" : "TRIP DETAILS"}</p>
                            <h3>{selectedTrip.package_name}</h3>
                            <div className="planned-route-point"><span className="planned-route-dot start" /><div><small>START</small><strong>{tripStartAddress}</strong></div></div>
                            <div className="planned-route-point"><span className="planned-route-dot end" /><div><small>DESTINATION</small><strong>{tripDestinationAddress}</strong></div></div>
                            {selectedTrip.isPlanned ? <>
                                {!selectedTrip.endedAt && <><label htmlFor="trip-comment">Your comments</label><textarea id="trip-comment" value={tripComment} onChange={(event) => setTripComment(event.target.value)} placeholder="Add a note about this trip" rows="3"/>{selectedTrip.tripStartedAt ? <button className="connect-button end-trip-button" onClick={endTrip} disabled={isEndingTrip}>{isEndingTrip ? "Ending trip…" : "End trip"}</button> : <button className="connect-button start-trip-button" onClick={startPlannedTrip} disabled={isStartingTrip}>{isStartingTrip ? "Starting trip…" : "Start trip"}</button>}</>}
                                <p className="planned-route-type">{selectedTrip.routeSource === "osrm" ? "Road route" : "Approximate route"}</p>
                                {tripStartStatus && <p className="trip-start-status" role="status">{tripStartStatus}</p>}
                                {selectedTrip.endedAt && <><p><strong>Ended</strong> {formatTravelDate(selectedTrip.endedAt)}</p><p><strong>Your comments</strong> {selectedTrip.comments || "No comments added."}</p></>}
                            </> : <>
                                <p><strong>Traveler</strong> {travelerName}</p>
                                <p><strong>Started</strong> {formatTravelDate(selectedTrip.startedAt)}</p>
                                <p><strong>Ended</strong> {selectedTrip.endedAt ? formatTravelDate(selectedTrip.endedAt) : "Still active"}</p>
                            </>}
                            {!selectedTrip.isPlanned && (selectedTrip.endedAt ? <p><strong>Your comments</strong> {selectedTrip.comments || "No comments added."}</p> : <><label htmlFor="trip-comment">Your comments</label><textarea id="trip-comment" value={tripComment} onChange={(event) => setTripComment(event.target.value)} placeholder="Add a note about this trip" rows="3"/><button className="connect-button end-trip-button" onClick={endTrip} disabled={isEndingTrip}>{isEndingTrip ? "Ending trip…" : "End trip"}</button></>)}
                            {tripError && <p className="form-error" role="alert">{tripError}</p>}
                            {selectedTrip.isPlanned && <section className="trip-briefing"><h4>Trip news and things to know</h4>{selectedTrip.travelBriefingStatus === "loading" ? <p role="status">Getting up-to-date travel information…</p> : selectedTrip.travelBriefing ? <p>{selectedTrip.travelBriefing}</p> : <p role="status">Couldn’t get up-to-date information for this trip. Please try again later.</p>}{selectedTrip.travelBriefingCreatedAt && <small>Saved {formatTravelDate(selectedTrip.travelBriefingCreatedAt)}</small>}</section>}
                        </aside>
                        <div className="planned-trip-map"><Map
                            route={tripRoute}
                            locations={selectedTrip.locations || []}
                            userLocation={selectedTrip.isPlanned ? userLocation : undefined}
                            locateRequest={selectedTrip.isPlanned ? locateRequest : undefined}
                            onLocation={selectedTrip.isPlanned ? handleLocation : undefined}
                            onLocationError={selectedTrip.isPlanned ? handleLocationError : undefined}
                            startPoint={selectedTrip.startPoint || tripRoute[0]}
                            endPoint={selectedTrip.endPoint || tripRoute[tripRoute.length - 1]}
                        /></div>
                    </div>
                </>}
            </section> : !selectedPackage ? <>
            <section className="map-section" aria-labelledby="map-title">
                <div className="section-heading">
                    <div>
                        <p className="eyebrow">OVERVIEW</p>
                        <h2 id="map-title">Your package map</h2>
                    </div>
                    <span className="map-status"><span />{userLocation ? "Current location found" : "Location off"}</span>
                </div>
                <div className="overview-grid">
                    <div className="overview-map"><Map route={route} userLocation={userLocation} locateRequest={locateRequest} onLocation={handleLocation} onLocationError={handleLocationError} routes={packageRoutes} /></div>
                    <aside className="risk-packages" aria-label="Top three packages by risk score">
                        <div className="risk-packages-heading"><p className="eyebrow">RISK RANKING</p><h3>Top 3 packages</h3></div>
                        {topRiskPackages.map((item, index) => <button className="risk-package-card" key={item.package_id} onClick={() => selectPackage(item.package_id)} disabled={isLoadingRoute}>
                            <span className="risk-rank">{index + 1}</span>
                            <span className="risk-package-copy"><strong>{item.name}</strong><small>{item.profile?.news?.level || "Risk level unavailable"}</small></span>
                            <span className="risk-package-score"><small>Risk score</small><strong>{item.profile?.news?.score ?? "—"}</strong></span>
                        </button>)}
                    </aside>
                </div>
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
                    <button className="location-button" onClick={findMyLocation}>⌖ Find me</button>
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

            {showPlanDialog && <div className="modal-backdrop" role="presentation" onMouseDown={() => !isPlanningTrip && setShowPlanDialog(false)}>
                <section className="contacts-modal plan-trip-modal" role="dialog" aria-modal="true" aria-labelledby="plan-trip-title" onMouseDown={(event) => event.stopPropagation()}>
                    <button className="modal-close" aria-label="Close" onClick={() => setShowPlanDialog(false)}>×</button>
                    <p className="eyebrow">CUSTOM ROUTE</p>
                    <h2 id="plan-trip-title">Plan a trip</h2>
                    <p>Choose where you’re starting and where you’re going. We’ll calculate a road route and open it in Me.</p>
                    <form onSubmit={planTrip}>
                        <label htmlFor="trip-start">Start</label>
                        <input id="trip-start" value={tripStart} onChange={(event) => setTripStart(event.target.value)} placeholder="City, address, or landmark" required />
                        <label htmlFor="trip-destination">Destination</label>
                        <input id="trip-destination" value={tripDestination} onChange={(event) => setTripDestination(event.target.value)} placeholder="City, address, or landmark" required />
                        {planError && <p className="form-error" role="alert">{planError}</p>}
                        <button className="connect-button plan-submit" type="submit" disabled={isPlanningTrip}>{isPlanningTrip ? "Finding route…" : "Show route in Me"}</button>
                    </form>
                </section>
            </div>}

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
