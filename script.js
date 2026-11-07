alert("JavaScript is running!");
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

const itemForm = document.getElementById("itemForm");
const itemType = document.getElementById("itemType");
const searchInput = document.getElementById("searchInput");

const itemPhoto = document.getElementById("itemPhoto");
const photoPreview = document.getElementById("photoPreview");

let selectedPhotoData = "";

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

  screen.style.display = "block";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function showHome() {
  showScreen(homeScreen);
}

function showReports() {
  displayReports();
  showScreen(reportsScreen);
}

function reportLostItem() {
  itemForm.reset();
  itemType.value = "Lost";
  showScreen(reportScreen);
}

function reportFoundItem() {
  itemForm.reset();
  itemType.value = "Found";
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

// Create report card
function createReportCard(report, index) {
  const card = document.createElement("div");
  card.className = "report-card";
  
if (report.photo) {
  const image = document.createElement("img");
  image.src = report.photo;
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

  const button = document.createElement("button");
  button.textContent = "View Details";

  card.append(title, badge, location, button);

  card.addEventListener("click", function() {
    showReportDetails(report);
  });

  return card;
}

// Display separate Lost and Found folders
function displayReports() {
  const query = searchInput.value.toLowerCase();

  lostReportsList.innerHTML = "";
  foundReportsList.innerHTML = "";

  const reports = getReports();

  const filtered = reports.filter(function(report) {
    return (
      report.name.toLowerCase().includes(query) ||
      report.description.toLowerCase().includes(query) ||
      report.location.toLowerCase().includes(query) ||
      report.type.toLowerCase().includes(query)
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
}

// Show individual report details
function showReportDetails(report) {
  selectedReport = report;
  reportDetails.innerHTML = "";
  
if (report.photo) {
  const image = document.createElement("img");
  image.src = report.photo;
  image.alt = "Item photo";
  image.style.width = "100%";
  image.style.maxWidth = "350px";
  image.style.borderRadius = "14px";
  image.style.marginBottom = "20px";

  reportDetails.appendChild(image);
}


  const fields = [
    ["Item Name", report.name],
    ["Report Type", report.type],
    ["Description", report.description],
    ["Location", report.location],
    ["Date", report.date]
  ];

  fields.forEach(function(field) {
    const row = document.createElement("div");
    row.className = "detail-row";

    const label = document.createElement("h3");
    label.textContent = field[0];

    const value = document.createElement("p");
    value.textContent = field[1];

    row.append(label, value);
    reportDetails.appendChild(row);
  });

  showScreen(detailsScreen);
}

// Submit report
itemForm.addEventListener("submit", function(event) {
  event.preventDefault();

  const report = {
    name: document.getElementById("itemName").value.trim(),
    type: itemType.value,
    description: document.getElementById("itemDescription").value.trim(),
    location: document.getElementById("itemLocation").value.trim(),
    date: document.getElementById("itemDate").value,
photo: selectedPhotoData 
  };

  const reports = getReports();
  reports.unshift(report);

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

  alert("Report submitted successfully!");
});

// Instant search
searchInput.addEventListener("input", displayReports);

// Initial load
displayReports();

console.log("Wakle-Finder is running!");
// Test Supabase Connection

supabaseClient
  .from("reports")
  .select("id")
  .limit(1)
  .then(({ data, error }) => {
    if (error) {
      alert("Connection Error: " + error.message);
      console.error(error);
    } else {
      alert("Supabase Connected Successfully! 🎉");
      console.log(data);
    }
  });
