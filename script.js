
// Wakle-Finder App
// Supabase Connection
const SUPABASE_URL = "https://auzgtqyxgwrdwluayhso.supabase.co";

const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_ClnYGYLlmD3T1yXqys9W0Q_GKwc8Dr4";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

const homeScreen = document.getElementById("homeScreen");
const reportScreen = document.getElementById("reportScreen");
const reportsScreen = document.getElementById("reportsScreen");
const detailsScreen = document.getElementById("detailsScreen");
const loginScreen = document.getElementById("loginScreen");
const myReportsScreen =
  document.getElementById("myReportsScreen");

const itemForm = document.getElementById("itemForm");
const itemType = document.getElementById("itemType");
const searchInput = document.getElementById("searchInput");

const itemPhoto = document.getElementById("itemPhoto");
const photoPreview = document.getElementById("photoPreview");


let selectedPhotoData = "";

function updateRewardVisibility() {
  const rewardField = document.getElementById("rewardField");
  const verificationFields = document.getElementById("verificationFields");
  const verificationQuestion = document.getElementById("verificationQuestion");
  const verificationAnswer = document.getElementById("verificationAnswer");

  const isLost = itemType.value === "Lost";

  if (rewardField) {
    rewardField.style.display = isLost ? "block" : "none";
  }

  if (verificationFields) {
    verificationFields.style.display = isLost ? "block" : "none";
  }

  if (verificationQuestion) {
    verificationQuestion.required = isLost;
  }

  if (verificationAnswer) {
    verificationAnswer.required = isLost;
  }
}

itemType.addEventListener("change", updateRewardVisibility);
updateRewardVisibility();


// Photo upload and preview
itemPhoto.addEventListener("change", function() {
  const file = itemPhoto.files[0];

  if (!file) return;

  if (!file.type.startsWith("image/")) {
    alert("Please select an image.");
    itemPhoto.value = "";
    return;
  }

  const reader = new FileReader();

  reader.onload = function(event) {
    const image = new Image();

    image.onload = function() {
      const canvas = document.createElement("canvas");
      const maxSize = 900;

      const scale = Math.min(
        1,
        maxSize / Math.max(image.width, image.height)
      );

      canvas.width = image.width * scale;
      canvas.height = image.height * scale;

      const context = canvas.getContext("2d");
      context.drawImage(
        image, 0, 0, canvas.width, canvas.height
      );

      selectedPhotoData = canvas.toDataURL(
        "image/jpeg", 0.7
      );

      photoPreview.innerHTML = "";

      const previewImage = document.createElement("img");
      previewImage.src = selectedPhotoData;
      previewImage.alt = "Selected item photo";
      previewImage.style.width = "100%";
      previewImage.style.maxWidth = "250px";
      previewImage.style.borderRadius = "12px";

      photoPreview.appendChild(previewImage);
    };

    image.src = event.target.result;
  };

  reader.readAsDataURL(file);
});


const lostReportsList = document.getElementById("lostReportsList");
const foundReportsList = document.getElementById("foundReportsList");
const reportDetails = document.getElementById("reportDetails");

let selectedReport = null;

// Screen navigation
function showScreen(screen) {
  homeScreen.style.display = "none";
  reportScreen.style.display = "none";
  reportsScreen.style.display = "none";
  detailsScreen.style.display = "none";
  loginScreen.style.display = "none";
  myReportsScreen.style.display = "none";

  screen.style.display = "block";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function showHome() {
  showScreen(homeScreen);
}


async function showMyReports() {
  const lostList = document.getElementById("myLostReportsList");
  const foundList = document.getElementById("myFoundReportsList");

  try {
    const { data: authData, error: authError } =
      await supabaseClient.auth.getUser();

    if (authError) throw authError;

    if (!authData.user) {
      alert("Please login to view your reports.");
      showLogin();
      return;
    }

    showScreen(myReportsScreen);

    lostList.textContent = "Loading your lost reports...";
    foundList.textContent = "Loading your found reports...";

    const { data, error } = await supabaseClient
      .from("reports")
      .select("*")
      .eq("user_id", authData.user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const myReports = data || [];

    const lostReports = myReports.filter(
      report => report.type === "Lost"
    );

    const foundReports = myReports.filter(
      report => report.type === "Found"
    );

    lostList.innerHTML = "";
    foundList.innerHTML = "";

    if (lostReports.length === 0) {
      lostList.textContent =
        "You have not submitted any Lost Reports yet.";
    } else {
      lostReports.forEach((report, index) => {
        lostList.appendChild(
          createReportCard(report, index, true)
        );
      });
    }

    if (foundReports.length === 0) {
      foundList.textContent =
        "You have not submitted any Found Reports yet.";
    } else {
      foundReports.forEach((report, index) => {
        foundList.appendChild(
          createReportCard(report, index, true)
        );
      });
    }

  } catch (error) {
    console.error("My Reports Error:", error);

    lostList.textContent = "Could not load your reports.";
    foundList.textContent = "Could not load your reports.";

    alert("Error loading My Reports: " + error.message);
  }
}



    

    

function showLogin() {
  showScreen(loginScreen);
}

function showReports() {
  displayReports();
  showScreen(reportsScreen);
}

function reportLostItem() {
  itemForm.reset();
  itemType.value = "Lost";
  updateRewardVisibility();
  showScreen(reportScreen);
}

function reportFoundItem() {
  itemForm.reset();
  itemType.value = "Found";
  updateRewardVisibility();
  showScreen(reportScreen);
}

// Get saved reports
function getReports() {
  try {
    return JSON.parse(
      localStorage.getItem("wakleReports") || "[]"
    );
  } catch {
    return [];
  }
}

async function getOnlineReports() {
  const { data, error } = await supabaseClient
    .from("reports")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    alert("SUPABASE ERROR: " + error.message);
    console.error("Online reports error:", error);
    throw error;
  }

  return data || [];
}

// SMART MATCHING ENGINE

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

function textSimilarity(first, second) {
  const a = normalizeText(first);
  const b = normalizeText(second);

  if (a.length === 0 || b.length === 0) return 0;

  const setA = new Set(a);
  const setB = new Set(b);

  const common = [...setA].filter(word => setB.has(word));

  return (common.length / new Set([...a, ...b]).size) * 100;
}

function dateSimilarity(date1, date2) {
  if (!date1 || !date2) return 0;

  const first = new Date(date1);
  const second = new Date(date2);

  if (isNaN(first) || isNaN(second)) return 0;

  const days = Math.abs(first - second) / 86400000;

  if (days === 0) return 100;
  if (days <= 1) return 90;
  if (days <= 3) return 75;
  if (days <= 7) return 55;
  if (days <= 14) return 30;

  return 0;
}
// SMART LOCATION PROXIMITY AGENT

function extractCoordinates(location) {
  if (!location) return null;

  const match = String(location).match(
    /^\s*(-?\d{1,3}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)\s*$/
  );

  if (!match) return null;

  const latitude = Number(match[1]);
  const longitude = Number(match[2]);

  if (
    latitude < -90 || latitude > 90 ||
    longitude < -180 || longitude > 180
  ) {
    return null;
  }

  return { latitude, longitude };
}

// Distance between two GPS coordinates in KM
function calculateDistanceKm(location1, location2) {
  const point1 = extractCoordinates(location1);
  const point2 = extractCoordinates(location2);

  if (!point1 || !point2) return null;

  const toRadians = degrees => degrees * Math.PI / 180;

  const lat1 = toRadians(point1.latitude);
  const lat2 = toRadians(point2.latitude);

  const deltaLat = toRadians(
    point2.latitude - point1.latitude
  );

  const deltaLon = toRadians(
    point2.longitude - point1.longitude
  );

  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) *
    Math.cos(lat2) *
    Math.sin(deltaLon / 2) ** 2;

  const earthRadius = 6371;

  const c = 2 * Math.atan2(
    Math.sqrt(a),
    Math.sqrt(1 - a)
  );

  return earthRadius * c;
}

function calculateProximityScore(distanceKm) {
  if (distanceKm === null) return null;

  if (distanceKm <= 1) return 100;
  if (distanceKm <= 3) return 80;
  if (distanceKm <= 5) return 60;
  if (distanceKm <= 10) return 30;

  return 0;
}
function calculateMatchScore(lost, found) {
  const nameScore =
    textSimilarity(lost.name, found.name);

  const descriptionScore =
    textSimilarity(lost.description, found.description);

  const textLocationScore =
    textSimilarity(lost.location, found.location);

  const distanceKm =
    calculateDistanceKm(lost.location, found.location);

  const proximityScore =
    calculateProximityScore(distanceKm);

  // GPS available ho toh proximity ko priority do
  const locationScore =
    proximityScore !== null
      ? (proximityScore * 0.8) +
        (textLocationScore * 0.2)
      : textLocationScore;

  const dateScore =
    dateSimilarity(lost.date, found.date);

  const total =
    (nameScore * 0.35) +
    (descriptionScore * 0.25) +
    (locationScore * 0.25) +
    (dateScore * 0.15);

  return Math.round(total);
}
  
function getMatchReasons(lost, found) {
  const reasons = [];

  if (textSimilarity(lost.name, found.name) >= 70) {
    reasons.push("Item Name");
  }

  if (textSimilarity(
    lost.description,
    found.description
  ) >= 70) {
    reasons.push("Description");
  }

  if (textSimilarity(
    lost.location,
    found.location
  ) >= 70) {
    reasons.push("Location");
  }

  if (dateSimilarity(lost.date, found.date) >= 75) {
    reasons.push("Date");
  }
  // Smart Location Proximity Reason
const distance = calculateDistanceKm(
  lost.location,
  found.location
);

if (distance !== null) {
  if (distance <= 1) {
    reasons.push("📍 Very close location (within 1 km)");
  } else if (distance <= 3) {
    reasons.push("📍 Nearby location (within 3 km)");
  } else if (distance <= 5) {
    reasons.push("📍 Location proximity (within 5 km)");
  }
}
  

  return reasons;
}
// DISPLAY POSSIBLE MATCHES

function displayPossibleMatches(reports) {
  const matchesList = document.getElementById("possibleMatchesList");

  matchesList.innerHTML = "";

  const lostReports = reports.filter(r => r.type === "Lost");
  const foundReports = reports.filter(r => r.type === "Found");

  const matches = [];

  lostReports.forEach(lost => {
    foundReports.forEach(found => {
      const score = calculateMatchScore(lost, found);

      if (score >= 70) {
        matches.push({
          lost,
          found,
          score
        });
      }
    });
  });

  matches.sort((a, b) => b.score - a.score);

  if (matches.length === 0) {
    matchesList.textContent =
      "No strong possible matches found yet.";
    return;
  }

  matches.forEach(match => {
    const card = document.createElement("div");
    card.className = "report-card";

    const heading = document.createElement("h3");
    heading.textContent = "Possible Match";

    const score = document.createElement("h2");
    score.textContent = match.score + "% Similarity";
    const reasons = document.createElement("p");

const matchedDetails = getMatchReasons(
  match.lost,
  match.found
);

reasons.textContent =
  "Matched Details: " +
  (matchedDetails.length
    ? matchedDetails.join(", ")
    : "No strong detail match");

const note = document.createElement("p");

note.textContent =
  "Note: This is a possible match. Please verify before claiming.";

note.style.fontSize = "13px";
note.style.color = "#777";
    // Smart Location Proximity display
const distance = calculateDistanceKm(
  match.lost.location,
  match.found.location
);

const proximityInfo = document.createElement("p");

if (distance !== null) {
  proximityInfo.textContent =
    distance < 1
      ? "📍 " + Math.round(distance * 1000) + " meters apart"
      : "📍 " + distance.toFixed(2) + " km apart";

  proximityInfo.style.color = "#16803c";
  proximityInfo.style.fontWeight = "bold";
  proximityInfo.style.background = "#e8f5e9";
  proximityInfo.style.padding = "8px";
  proximityInfo.style.borderRadius = "8px";
} else {
  proximityInfo.textContent =
    "📍 Distance unavailable — location coordinates missing";
}

    const lostInfo = document.createElement("p");
    lostInfo.textContent =
      "Lost: " + match.lost.name +
      " | Location: " + match.lost.location;

    const foundInfo = document.createElement("p");
    foundInfo.textContent =
      "Found: " + match.found.name +
      " | Location: " + match.found.location;

    const lostButton = document.createElement("button");
    lostButton.textContent = "View Lost Report";
    lostButton.addEventListener("click", () => {
      showReportDetails(match.lost);
    });

    const foundButton = document.createElement("button");
    foundButton.textContent = "View Found Report";
    foundButton.addEventListener("click", () => {
      showReportDetails(match.found);
    });
    // Ask Lost Owner for Verification
const askOwnerButton = document.createElement("button");
askOwnerButton.textContent = "🔐 Ask Owner for Verification";
askOwnerButton.style.margin = "6px";
askOwnerButton.style.padding = "10px";

askOwnerButton.addEventListener("click", async function(event) {
  event.stopPropagation();

  const { data: sessionData, error: sessionError } =
    await supabaseClient.auth.getSession();

  if (sessionError || !sessionData.session) {
    alert("Please login first to request verification.");
    showLogin();
    return;
  }

  const confirmed = confirm(
    "Send a verification request to the Lost item owner?"
  );

  if (!confirmed) return;

  askOwnerButton.disabled = true;
  askOwnerButton.textContent = "Sending Request...";

  try {
    const { data, error } =
      await supabaseClient.functions.invoke(
        "request_owner_verification",
        {
          body: {
            lostReportId: match.lost.id,
            foundReportId: match.found.id
          }
        }
      );

    if (error) throw error;

    if (!data || !data.success) {
      throw new Error(data?.error || "Request failed");
    }

    alert("✅ Verification request sent to the Lost item owner!");

    askOwnerButton.textContent = "✅ Request Sent";
    askOwnerButton.disabled = true;

  } catch (error) {
    console.error("Verification request error:", error);

    alert("Could not send request: " + error.message);

    askOwnerButton.textContent =
      "🔐 Ask Owner for Verification";

    askOwnerButton.disabled = false;
  }
});

    card.append(
  heading,
  score,
  reasons,
  note,
  proximityInfo,
  lostInfo,
  foundInfo,
  lostButton,
  foundButton,
  askONameButton
    );

    matchesList.appendChild(card);
  });
}



// Create report 

function createReportCard(report, index, isMine = false) {
  const card = document.createElement("div");
  card.className = "report-card";

  const photoSource = report.photo_url || report.photo;

  if (photoSource) {
    const image = document.createElement("img");
    image.src = photoSource;
    image.alt = "Reported item";
    image.style.width = "100%";
    image.style.maxHeight = "180px";
    image.style.objectFit = "contain";
    image.style.borderRadius = "12px";
    image.style.marginBottom = "12px";
    card.appendChild(image);
  }

  card.style.cursor = "pointer";

  const title = document.createElement("h3");
  title.textContent = report.name;

  const badge = document.createElement("span");
  badge.textContent = report.type;
  badge.className = "report-badge " +
    (report.type === "Lost" ? "lost" : "found");

  const location = document.createElement("p");
  location.textContent = "Location: " + report.location;

  
if (report.type === "Lost" && Number(report.reward_amount) > 0) {
  const rewardBadge = document.createElement("p");

  rewardBadge.textContent =
    "🎁 Reward Offered: ₹" + report.reward_amount;

  rewardBadge.style.color = "#16803c";
  rewardBadge.style.fontWeight = "bold";
  rewardBadge.style.background = "#e8f5e9";
  rewardBadge.style.padding = "8px 12px";
  rewardBadge.style.borderRadius = "10px";

  card.appendChild(rewardBadge);
}


  const viewButton = document.createElement("button");
  viewButton.textContent = "View Details";

  card.append(title, badge, location, viewButton);

  if (isMine) {
    const editButton = document.createElement("button");
    editButton.textContent = "Edit";
    editButton.style.margin = "5px";

    editButton.addEventListener("click", function(event) {
      event.stopPropagation();
      editMyReport(report);
    });

    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Delete";
    deleteButton.style.margin = "5px";

    deleteButton.addEventListener("click", function(event) {
      event.stopPropagation();
      deleteMyReport(report);
    });

    card.append(editButton, deleteButton);
  }

  card.addEventListener("click", function() {
    showReportDetails(report);
  });

  return card;
}


// Display separate Lost and Found folders

async function displayReports() {
  const query = searchInput.value.toLowerCase().trim();

  lostReportsList.innerHTML = "Loading reports...";
  foundReportsList.innerHTML = "Loading reports...";

  try {
    const reports = await getOnlineReports();
    displayPossibleMatches(reports);

    lostReportsList.innerHTML = "";
    foundReportsList.innerHTML = "";

    const filtered = reports.filter(function(report) {
      return (
        (report.name || "").toLowerCase().includes(query) ||
        (report.description || "").toLowerCase().includes(query) ||
        (report.location || "").toLowerCase().includes(query) ||
        (report.type || "").toLowerCase().includes(query)
      );
    });

    const lost = filtered.filter(r => r.type === "Lost");
    const found = filtered.filter(r => r.type === "Found");

    if (lost.length === 0) {
      lostReportsList.textContent = "No lost reports found.";
    }

    if (found.length === 0) {
      foundReportsList.textContent = "No found reports found.";
    }

    lost.forEach(function(report, index) {
      lostReportsList.appendChild(
        createReportCard(report, index)
      );
    });

    found.forEach(function(report, index) {
      foundReportsList.appendChild(
        createReportCard(report, index)
      );
    });

  } catch (error) {
    console.error("Display reports error:", error);
    lostReportsList.textContent = "Could not load reports.";
    foundReportsList.textContent = "Could not load reports.";
  }
}


// Show individual report details
function showReportDetails(report) {
  selectedReport = report;
  reportDetails.innerHTML = "";

  // Main card styling
  reportDetails.style.padding = "20px";
  reportDetails.style.borderRadius = "18px";
  reportDetails.style.background = "#ffffff";
  reportDetails.style.boxShadow =
    "0 4px 18px rgba(0,0,0,0.10)";

  // Item Name
  const title = document.createElement("h2");
  title.textContent = report.name;
  title.style.marginBottom = "12px";
  reportDetails.appendChild(title);

  // Lost / Found Badge
  const badge = document.createElement("span");
  badge.textContent = report.type;
  badge.style.padding = "7px 16px";
  badge.style.borderRadius = "20px";
  badge.style.color = "#ffffff";
  badge.style.background =
    report.type === "Lost" ? "#e74c3c" : "#27ae60";

  reportDetails.appendChild(badge);

  // Item Photo
  const photoSource = report.photo_url || report.photo;

  if (photoSource) {
    const image = document.createElement("img");
    image.src = photoSource;
    image.alt = "Reported item";
    image.style.width = "100%";
    image.style.maxHeight = "260px";
    image.style.objectFit = "contain";
    image.style.borderRadius = "14px";
    image.style.marginTop = "18px";

    reportDetails.appendChild(image);
  }

  // Report Information
  const fields = [
    ["Description", report.description],
    ["Location", report.location],
    ["Date", report.date]
  ];

  fields.forEach(function(field) {
    const row = document.createElement("div");
    row.style.padding = "12px 0";
    row.style.borderBottom = "1px solid #eeeeee";

    const label = document.createElement("h4");
    label.textContent = field[0];
    label.style.margin = "0 0 5px";
    label.style.color = "#777777";

    const value = document.createElement("p");
    value.textContent = field[1] || "Not provided";
    value.style.margin = "0";

    row.append(label, value);
    reportDetails.appendChild(row);
  });

  // 360 Degree Street View
  const streetViewBtn = document.createElement("button");
  streetViewBtn.textContent = "🌎 Explore 360° Street View";
  streetViewBtn.style.width = "100%";
  streetViewBtn.style.padding = "14px";
  streetViewBtn.style.marginTop = "16px";
  streetViewBtn.style.border = "none";
  streetViewBtn.style.borderRadius = "12px";
  streetViewBtn.style.background = "#2878e8";
  streetViewBtn.style.color = "#ffffff";
  streetViewBtn.style.fontSize = "16px";
  streetViewBtn.style.fontWeight = "bold";
  streetViewBtn.style.cursor = "pointer";

  streetViewBtn.addEventListener("click", function() {
    const location = (report.location || "").trim();

    // Check if location contains latitude and longitude
    const coordinates = location.match(
      /(-?\d{1,3}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)/
    );

    if (coordinates) {
      const latitude = Number(coordinates[1]);
      const longitude = Number(coordinates[2]);

      if (
        latitude >= -90 && latitude <= 90 &&
        longitude >= -180 && longitude <= 180
      ) {
        const streetViewUrl =
          "https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=" +
          latitude + "," + longitude;

        window.open(streetViewUrl, "_blank");
        return;
      }
    }

    // Fallback for text-based locations
    const searchUrl =
      "https://www.google.com/maps/search/?api=1&query=" +
      encodeURIComponent(location);

    window.open(searchUrl, "_blank");
  });

  reportDetails.appendChild(streetViewBtn);

  showScreen(detailsScreen);
}
// OFFLINE REPORT STORAGE

function openOfflineDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("WakleFinderOfflineDB", 1);

    request.onupgradeneeded = function(event) {
      const db = event.target.result;

      if (!db.objectStoreNames.contains("pendingReports")) {
        db.createObjectStore("pendingReports", {
          keyPath: "localId"
        });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveOfflineReport(report) {
  const db = await openOfflineDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(
      "pendingReports",
      "readwrite"
    );

    transaction.objectStore("pendingReports").put(report);

    transaction.oncomplete = () => {
      db.close();
      resolve(true);
    };

    transaction.onerror = () => {
      db.close();
      reject(transaction.error);
    };
  });
}

async function getOfflineReports() {
  const db = await openOfflineDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(
      "pendingReports",
      "readonly"
    );

    const request = transaction
      .objectStore("pendingReports")
      .getAll();

    request.onsuccess = () => {
      const result = request.result || [];
      db.close();
      resolve(result);
    };

    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

async function deleteOfflineReport(localId) {
  const db = await openOfflineDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(
      "pendingReports",
      "readwrite"
    );

    transaction.objectStore("pendingReports").delete(localId);

    transaction.oncomplete = () => {
      db.close();
      resolve(true);
    };

    transaction.onerror = () => {
      db.close();
      reject(transaction.error);
    };
  });
      }
// OFFLINE STATUS DISPLAY

const offlineStatusBox = document.createElement("div");

offlineStatusBox.style.padding = "10px";
offlineStatusBox.style.margin = "10px";
offlineStatusBox.style.borderRadius = "10px";
offlineStatusBox.style.textAlign = "center";
offlineStatusBox.style.fontWeight = "bold";

document.body.prepend(offlineStatusBox);

async function updateOfflineStatus() {
  if (!navigator.onLine) {
    offlineStatusBox.textContent =
      "📴 Offline Mode — Reports will be saved on your device";
    offlineStatusBox.style.background = "#fff3cd";
    offlineStatusBox.style.color = "#856404";
  } else {
    offlineStatusBox.textContent =
      "🟢 Online — Internet connected";
    offlineStatusBox.style.background = "#e8f5e9";
    offlineStatusBox.style.color = "#16803c";
  }

  try {
    const pending = await getOfflineReports();

    offlineStatusBox.textContent +=
      " | Pending Reports: " + pending.length;
  } catch (error) {
    console.error("Offline status error:", error);
  }
}

window.addEventListener("online", updateOfflineStatus);
window.addEventListener("offline", updateOfflineStatus);
window.addEventListener("online", syncOfflineReports);
// AUTO SYNC OFFLINE REPORTS

async function syncOfflineReports() {
  if (!navigator.onLine) return;

  try {
    const pendingReports = await getOfflineReports();

    if (pendingReports.length === 0) return;

    const { data: sessionData, error: sessionError } =
      await supabaseClient.auth.getSession();

    if (sessionError) throw sessionError;

    const currentUser = sessionData.session?.user;

    if (!currentUser) {
      console.log("Please login to sync offline reports.");
      return;
    }

    console.log("Syncing offline reports:", pendingReports.length);

    for (const report of pendingReports) {
      if (report.user_id !== currentUser.id) {
        console.log("Skipping report from another user:", report.localId);
        continue;
      }

      try {
        let photoUrl = null;

        // Upload offline photo
        if (report.offline_photo_data) {
          const photoBlob = await (
            await fetch(report.offline_photo_data)
          ).blob();

          const photoPath =
            "offline-" +
            report.localId.replace(/[^a-zA-Z0-9-]/g, "") +
            ".jpg";

          const { error: uploadError } =
            await supabaseClient.storage
              .from("report-photos")
              .upload(photoPath, photoBlob, {
                upsert: true,
                contentType: "image/jpeg"
              });

          if (uploadError) throw uploadError;

          const { data: photoData } =
            supabaseClient.storage
              .from("report-photos")
              .getPublicUrl(photoPath);

          photoUrl = photoData.publicUrl;
        }

        // Prepare report
        const syncedReport = {
          user_id: report.user_id,
          name: report.name,
          type: report.type,
          description: report.description,
          location: report.location,
          date: report.date,
          reward_amount: report.reward_amount,
          photo_url: photoUrl,
          offline_id: report.localId
        };

        // Save to Supabase
        const { error: insertError } =
          await supabaseClient
            .from("reports")
            .upsert([syncedReport], {
              onConflict: "offline_id"
            });

        if (insertError) throw insertError;

        // Remove from local queue only after successful save
        await deleteOfflineReport(report.localId);

        console.log("Report synced successfully:", report.localId);

      } catch (error) {
        console.error(
          "Offline sync error:",
          report.localId,
          error
        );
      }
    }

    await updateOfflineStatus();

  } catch (error) {
    console.error("Offline sync process failed:", error);
  }
}
  // Submit report to Supabase
itemForm.addEventListener("submit", async function(event) {
  event.preventDefault();

  if (itemPhoto.files.length > 0 && !selectedPhotoData) {
    alert("Please wait for the photo preview to load.");
    return;
  }

  const submitButton = itemForm.querySelector(
    'button[type="submit"]'
  );

  submitButton.disabled = true;
  submitButton.textContent = "Submitting...";

  try {
    const isOffline = !navigator.onLine;
    let photoUrl = "";

    // Upload photo to Supabase Storage
    if (selectedPhotoData && !isOffline) {
      const photoBlob = await (
        await fetch(selectedPhotoData)
      ).blob();

      const photoPath =
        Date.now() + "-" +
        Math.random().toString(36).slice(2) +
        ".jpg";

      const { error: uploadError } =
        await supabaseClient.storage
          .from("report-photos")
          .upload(photoPath, photoBlob, {
            contentType: "image/jpeg"
          });

      if (uploadError) throw uploadError;

      const { data: photoData } =
        supabaseClient.storage
          .from("report-photos")
          .getPublicUrl(photoPath);

      photoUrl = photoData.publicUrl;
    }

    

// Get logged-in user
const { data: authData, error: authError } =
  await supabaseClient.auth.getSession();

if (authError) throw authError;

const user = authData.session?.user;

if (!user) {
  throw new Error("Please login before submitting a report.");
}

// Create report

const rewardInput = document.getElementById("rewardAmount");
    const rewardAmount =
  itemType.value === "Lost" && rewardInput.value
    ? Number(rewardInput.value)
    : null;

const report = {
  user_id: user.id,
  name: document.getElementById("itemName").value.trim(),
  type: itemType.value,
  description: document.getElementById("itemDescription").value.trim(),
  location: document.getElementById("itemLocation").value.trim(),
  date: document.getElementById("itemDate").value || null,
  photo_url: photoUrl || null,
  reward_amount: rewardAmount,

  ...(isOffline ? {
    localId: Date.now() + "-" + Math.random().toString(36).slice(2),
    offline_photo_data: selectedPhotoData || null
  } : {})
};

    if (isOffline) {
  await saveOfflineReport(report);

  alert("📴 Report saved on your device! It will sync when internet is available.");

  itemForm.reset();
  selectedPhotoData = null;
  photoPreview.innerHTML = "";

  await updateOfflineStatus();

  return;
    }
    const { data: savedReport, error } = await supabaseClient
  .from("reports")
  .insert([report])
  .select("id")
  .single();

if (error) throw error;

let riddleSaved = true;

// Save private riddle for Lost reports
if (report.type === "Lost") {
  const question = document
    .getElementById("verificationQuestion")
    .value.trim();

  const answer = document
    .getElementById("verificationAnswer")
    .value.trim();

  const { data: riddleData, error: riddleError } =
    await supabaseClient.functions.invoke("save_report_riddle", {
      body: {
        reportId: savedReport.id,
        question,
        answer
      }
    });

  riddleSaved = !riddleError && riddleData?.success === true;

  if (!riddleSaved) {
    console.error("Riddle save failed:", riddleError || riddleData);
  }
}

// Success messages
if (report.type === "Lost" && riddleSaved) {
  alert("Report and Verification Riddle saved successfully! 🎉");
} else if (report.type === "Lost" && !riddleSaved) {
  alert("Report saved, but Verification Riddle failed. Please fix before relying on verification.");
} else {
  alert("Report saved online successfully! 🎉");
}

    // Keep local copy temporarily
    const localReport = {
      ...report,
      photo: selectedPhotoData
    };
    console.log("Logged-in User ID:", user?.id);
console.log("Report User ID:", report?.user_id);

    const reports = getReports();
    reports.unshift(localReport);

    localStorage.setItem(
      "wakleReports",
      JSON.stringify(reports)
    );

    itemForm.reset();
    selectedPhotoData = "";
    photoPreview.innerHTML = "";

    searchInput.value = "";
    displayReports();
    showScreen(reportsScreen);

  } catch (error) {
    console.error("Report submission error:", error);
    alert("Could not save report: " + error.message);
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Submit Report";
  }

});

// Instant search
searchInput.addEventListener("input", displayReports);

// Initial load
displayReports();

console.log("Wakle-Finder is running!");
function showLoginForm() {
  document.getElementById("signupForm").style.display = "none";
  document.getElementById("emailLoginForm").style.display = "block";

  document.getElementById("authTitle").textContent = "Welcome Back!";
  document.getElementById("authSubtitle").textContent =
    "Login to your Wakle-Finder account";

  document.getElementById("authSwitchText").textContent =
    "New to Wakle-Finder?";

  document.getElementById("authSwitchButton").textContent =
    "Create Account";

  document.getElementById("authSwitchButton").onclick =
    showSignupForm;

  document.getElementById("authMessage").textContent = "";
}

function showSignupForm() {
  document.getElementById("emailLoginForm").style.display = "none";
  document.getElementById("signupForm").style.display = "block";

  document.getElementById("authTitle").textContent =
    "Create Your Account";

  document.getElementById("authSubtitle").textContent =
    "Join the Wakle-Finder community";

  document.getElementById("authSwitchText").textContent =
    "Already have an account?";

  document.getElementById("authSwitchButton").textContent =
    "Login";

  document.getElementById("authSwitchButton").onclick =
    showLoginForm;

  document.getElementById("authMessage").textContent = "";
}

// SIGN UP FORM SUBMISSION
document.getElementById("signupForm").addEventListener(
  "submit",
  async function(event) {
    event.preventDefault();

    const name = document.getElementById("signupName").value.trim();
    const email = document.getElementById("signupEmail").value.trim();
    const password = document.getElementById("signupPassword").value;
    const confirm = document.getElementById("confirmPassword").value;
    const message = document.getElementById("authMessage");

    if (password !== confirm) {
      message.textContent = "Passwords do not match!";
      return;
    }

    if (password.length < 6) {
      message.textContent = "Password must be at least 6 characters.";
      return;
    }

    message.textContent = "Creating your account...";

    const { data, error } = await supabaseClient.auth.signUp({
      email: email,
      password: password,
      options: {
        data: { full_name: name }
      }
    });

    if (error) {
      message.textContent = "Sign Up failed: " + error.message;
      return;
    }

    if (data.session) {
      message.textContent = "Account created successfully!";
    } else {
      message.textContent =
        "Account created! Please verify your email.";
    }

    document.getElementById("signupForm").reset();
  }
);


// LOGIN FORM SUBMISSION
document.getElementById("emailLoginForm").addEventListener(
  "submit",
  async function(event) {
    event.preventDefault();

    const email = document.getElementById("emailLogin").value.trim();
    const password = document.getElementById("passwordLogin").value;
    const message = document.getElementById("authMessage");

    message.textContent = "Logging in...";

    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email: email,
      password: password
    });

    if (error) {
      message.textContent = "Login failed: " + error.message;
      return;
    }

    alert("Login successful! Welcome to Wakle-Finder.");
    await updateAuthUI();

    document.getElementById("emailLoginForm").reset();
    showHome();
  }
);
async function resendVerificationEmail() {
  const email = document.getElementById("signupEmail").value.trim();
  const message = document.getElementById("authMessage");

  if (!email) {
    message.textContent = "Please enter your registered email first.";
    return;
  }

  message.textContent = "Sending verification email...";

  const { error } = await supabaseClient.auth.resend({
    type: "signup",
    email: email
  });

  if (error) {
    message.textContent = "Error: " + error.message;
    return;
  }

  message.textContent = "New verification email sent! Check your inbox.";
}

// USER SESSION MANAGEMENT

async function updateAuthUI() {
  const { data } = await supabaseClient.auth.getSession();
  const user = data.session?.user;

  const panel = document.getElementById("userPanel");
  const welcome = document.getElementById("welcomeUser");

  if (user) {
    panel.style.display = "block";

    const name = user.user_metadata?.full_name || user.email;

    welcome.textContent = "Welcome, " + name + "!";
  } else {
    panel.style.display = "none";
  }
}

// Check login whenever authentication changes
supabaseClient.auth.onAuthStateChange(() => {
  updateAuthUI();
});

// Check existing session on page load
updateAuthUI();

// LOGOUT
async function logoutUser() {
  const { error } = await supabaseClient.auth.signOut();

  if (error) {
    alert("Logout failed: " + error.message);
    return;
  }

  alert("You have logged out successfully!");
  await updateAuthUI();
  showHome();
}
    async function editMyReport(report) {
  try {
    const { data: authData, error: authError } =
      await supabaseClient.auth.getUser();

    if (authError) throw authError;

    if (!authData.user) {
      alert("Please login first.");
      return;
    }

    const name = prompt("Enter item name:", report.name);
    if (name === null) return;

    const description = prompt(
      "Enter description:",
      report.description || ""
    );
    if (description === null) return;

    const location = prompt(
      "Enter location:",
      report.location || ""
    );
    if (location === null) return;

    const date = prompt(
      "Enter date (YYYY-MM-DD):",
      report.date || ""
    );
    if (date === null) return;

    let rewardAmount = report.reward_amount ?? "";

    if (report.type === "Lost") {
      const newReward = prompt(
        "Enter reward amount (₹). Leave empty for no reward:",
        rewardAmount
      );

      if (newReward === null) return;

      if (
        newReward.trim() !== "" &&
        (!Number.isFinite(Number(newReward)) ||
          Number(newReward) < 0)
      ) {
        alert("Please enter a valid reward amount.");
        return;
      }

      rewardAmount =
        newReward.trim() === ""
          ? null
          : Number(newReward);
    }

    if (report.type === "Found") {
      rewardAmount = null;
    }

    if (!name.trim()) {
      alert("Item name cannot be empty.");
      return;
    }

    let photoUrl = report.photo_url || null;

    const changePhoto = confirm(
      "Do you want to change the report photo?"
    );

    if (changePhoto) {
      const fileInput = document.createElement("input");
      fileInput.type = "file";
      fileInput.accept = "image/jpeg,image/png,image/webp";

      const file = await new Promise(resolve => {
        fileInput.addEventListener("change", function() {
          resolve(fileInput.files[0] || null);
        }, { once: true });

        fileInput.addEventListener("cancel", function() {
          resolve(null);
        }, { once: true });

        fileInput.click();
      });

      if (file) {
        if (!file.type.startsWith("image/")) {
          alert("Please select a valid image.");
          return;
        }

        if (file.size > 5 * 1024 * 1024) {
          alert("Photo must be smaller than 5 MB.");
          return;
        }

        const extension = file.name.split(".").pop().toLowerCase();

        if (!["jpg", "jpeg", "png", "webp"].includes(extension)) {
          alert("Only JPG, JPEG, PNG and WEBP are allowed.");
          return;
        }

        const photoPath =
          Date.now() + "-" +
          Math.random().toString(36).slice(2) +
          "." + extension;

        const { error: uploadError } =
          await supabaseClient.storage
            .from("report-photos")
            .upload(photoPath, file, {
              contentType: file.type
            });

        if (uploadError) throw uploadError;

        const { data: photoData } =
          supabaseClient.storage
            .from("report-photos")
            .getPublicUrl(photoPath);

        photoUrl = photoData.publicUrl;
      }
    }

    const { error } = await supabaseClient
      .from("reports")
      .update({
        name: name.trim(),
        description: description.trim(),
        location: location.trim(),
        date: date.trim() || null,
        reward_amount:
          report.type === "Lost" && rewardAmount !== ""
            ? Number(rewardAmount)
            : null,
        photo_url: photoUrl
      })
      .eq("id", report.id)
      .eq("user_id", authData.user.id);

    if (error) throw error;

    alert("Report updated successfully!");
    await showMyReports();

  } catch (error) {
    console.error("Edit report error:", error);
    alert("Update failed: " + error.message);
  }
}




async function deleteMyReport(report) {
  const confirmed = confirm(
    "Are you sure you want to delete this report?"
  );

  if (!confirmed) return;

  const { data: authData, error: authError } =
    await supabaseClient.auth.getUser();

  if (authError || !authData.user) {
    alert("Please login first.");
    return;
  }

  const { error } = await supabaseClient
    .from("reports")
    .delete()
    .eq("id", report.id)
    .eq("user_id", authData.user.id);

  if (error) {
    alert("Delete failed: " + error.message);
    return;
  }

  alert("Report deleted successfully!");
  showMyReports();
}

async function deleteReport(reportId) {
  const confirmDelete = confirm(
    "Are you sure you want to delete this report?"
  );

  if (!confirmDelete) return;

  try {
    const { data: authData, error: authError } =
      await supabaseClient.auth.getUser();

    if (authError) throw authError;

    const user = authData.user;

    if (!user) {
      alert("Please login first.");
      return;
    }

    const { error } = await supabaseClient
      .from("reports")
      .delete()
      .eq("id", reportId)
      .eq("user_id", user.id);

    if (error) throw error;

    alert("Report deleted successfully!");

    await showMyReports();

  } catch (error) {
    console.error("Delete error:", error);
    alert("Delete failed: " + error.message);
  }
}
// GET TAGGED PIN MAP

const getTaggedPinBtn = document.getElementById("getTaggedPin");
const pinMapSection = document.getElementById("pinMapSection");
const selectedPinLocation = document.getElementById("selectedPinLocation");

let pinMap = null;
let selectedMarker = null;
let selectedPinCoords = null;

getTaggedPinBtn.addEventListener("click", function () {
  pinMapSection.style.display = "block";

  if (!pinMap) {
    pinMap = L.map("pinMap").setView([20.5937, 78.9629], 5);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors"
    }).addTo(pinMap);

    pinMap.on("click", function (event) {
      setSelectedPin(event.latlng);
    });
  }

  setTimeout(function () {
    pinMap.invalidateSize();
  }, 200);
});

function setSelectedPin(latlng) {
  selectedPinCoords = {
    latitude: latlng.lat,
    longitude: latlng.lng
  };

  if (selectedMarker) {
    selectedMarker.setLatLng(latlng);
  } else {
    selectedMarker = L.marker(latlng, {
      draggable: true
    }).addTo(pinMap);

    selectedMarker.on("dragend", function () {
      setSelectedPin(selectedMarker.getLatLng());
    });
  }

  selectedPinLocation.textContent =
    "📍 " + latlng.lat.toFixed(6) +
    ", " + latlng.lng.toFixed(6);
}
// CONFIRM TAGGED PIN

const confirmTaggedPinBtn =
  document.getElementById("confirmTaggedPin");

confirmTaggedPinBtn.addEventListener("click", function () {
  if (!selectedPinCoords) {
    alert("Please select a location on the map first.");
    return;
  }

  const locationText =
    selectedPinCoords.latitude.toFixed(6) +
    ", " +
    selectedPinCoords.longitude.toFixed(6);

  document.getElementById("itemLocation").value = locationText;

  pinMapSection.style.display = "none";

  alert("📍 Location tagged successfully!");
});
// KHOJX - Natural Language Smart Search
window.khojxSearchItems = async function (searchTerm) {
  const term = searchTerm.trim();

  if (!term) {
    return {
      success: false,
      message: "Please enter an item name."
    };
  }

  try {
    const { data, error } = await supabaseClient
      .from("reports")
      .select("name, type, description, location")
      .or(
        `name.ilike.%${term}%,description.ilike.%${term}%,location.ilike.%${term}%`
      )
      .limit(10);

    if (error) throw error;

    return {
      success: true,
      results: data || [],
      message: data?.length
        ? `Found ${data.length} matching reports.`
        : "No matching reports found."
    };

  } catch (error) {
    console.error("KHOJX search error:", error);

    return {
      success: false,
      results: [],
      message: "Database search is temporarily unavailable."
    };
  }
};

const loadOwnerRequestsButton = document.getElementById("loadOwnerRequests");
const ownerRequestsList = document.getElementById("ownerRequestsList");

if (loadOwnerRequestsButton && ownerRequestsList) {
  loadOwnerRequestsButton.addEventListener("click", async function () {
    loadOwnerRequestsButton.disabled = true;
    loadOwnerRequestsButton.textContent = "Loading Requests...";

    ownerRequestsList.innerHTML = "";

    try {
      const { data, error } =
        await supabaseClient.functions.invoke(
          "get_owner_verification_requests"
        );

      if (error) throw error;
      if (!data || !data.success) {
        throw new Error(data?.error || "Failed to load requests");
      }

      if (!data.requests || data.requests.length === 0) {
        ownerRequestsList.textContent =
          "No pending verification requests found.";
        return;
      }

      data.requests.forEach(function (request) {
        const card = document.createElement("div");
        card.style.border = "1px solid #ccc";
        card.style.padding = "15px";
        card.style.margin = "10px 0";
        card.style.borderRadius = "10px";

        const title = document.createElement("h3");
        title.textContent = "🔐 Verification Request";

        const reportInfo = document.createElement("p");
        reportInfo.textContent =
          "Lost Report ID: " + request.lostReportId;

        const foundInfo = document.createElement("p");
        foundInfo.textContent =
          "Found Report ID: " + request.foundReportId;

        const question = document.createElement("p");
        question.textContent =
          "Your private question: " + request.question;

        const answerInput = document.createElement("input");
        answerInput.type = "password";
        answerInput.placeholder = "Enter your secret answer";
        answerInput.autocomplete = "off";

        const submitButton = document.createElement("button");
        submitButton.textContent = "Submit Answer";
        submitButton.disabled = true;
        submitButton.disabled = false;

submitButton.addEventListener("click", async function () {
  const answer = answerInput.value.trim();

  if (!answer) {
    alert("Please enter your secret answer.");
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = "Verifying...";

  try {
    const { data, error } =
      await supabaseClient.functions.invoke(
        "answer_owner_verification",
        {
          body: {
            requestId: request.requestId,
            answer: answer
          }
        }
      );

    if (error) throw error;
    if (!data?.success) {
      throw new Error(data?.error || "Verification failed");
    }

    status.textContent =
      data.status === "verified"
        ? "✅ Owner verified successfully!"
        : "❌ Answer did not match.";

    answerInput.value = "";
    answerInput.disabled = true;
    submitButton.textContent = "Submitted";

  } catch (error) {
    console.error(error);
    alert("Verification error: " + error.message);
    submitButton.disabled = false;
    submitButton.textContent = "Submit Answer";
  }
});

        const status = document.createElement("p");
        status.textContent = "Pending your verification";

       card.append(
  title,
  reportInfo,
  foundInfo,
  question,
  answerInput,
  submitButton,
  status
);

        ownerRequestsList.appendChild(card);
      });

    } catch (error) {
      console.error("Owner requests error:", error);
      ownerRequestsList.textContent =
        "Could not load requests. Please login and try again.";
    } finally {
      loadOwnerRequestsButton.disabled = false;
      loadOwnerRequestsButton.textContent = "📩 Check Requests";
    }
  });
}
