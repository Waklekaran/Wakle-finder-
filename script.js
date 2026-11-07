// Wakle-Finder

const reportForm = document.getElementById("reportForm");
const itemForm = document.getElementById("itemForm");
const itemType = document.getElementById("itemType");
const reportsList = document.getElementById("reportsList");
const searchInput = document.getElementById("searchInput");

// Open Lost Item form
function reportLostItem() {
  reportForm.style.display = "block";
  itemType.value = "Lost";
  reportForm.scrollIntoView({ behavior: "smooth" });
}

// Open Found Item form
function reportFoundItem() {
  reportForm.style.display = "block";
  itemType.value = "Found";
  reportForm.scrollIntoView({ behavior: "smooth" });
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

// Display reports
function displayReports(reports) {
  reportsList.innerHTML = "";

  if (reports.length === 0) {
    reportsList.innerHTML = "<p>No reports found.</p>";
    return;
  }

  reports.forEach(function(report) {
    const card = document.createElement("div");
    card.className = "report-card";

    const title = document.createElement("h3");
    title.textContent = report.name;

    const badge = document.createElement("span");
    badge.textContent = report.type;
    badge.className = "report-badge " +
      (report.type === "Lost" ? "lost" : "found");

    const description = document.createElement("p");
    description.textContent = "Description: " + report.description;

    const location = document.createElement("p");
    location.textContent = "Location: " + report.location;

    const date = document.createElement("p");
    date.textContent = "Date: " + report.date;

    card.append(title, badge, description, location, date);
    reportsList.appendChild(card);
  });
}

// Submit report
itemForm.addEventListener("submit", function(event) {
  event.preventDefault();

  const report = {
    name: document.getElementById("itemName").value,
    type: itemType.value,
    description: document.getElementById("itemDescription").value,
    location: document.getElementById("itemLocation").value,
    date: document.getElementById("itemDate").value
  };

  const reports = getReports();
  reports.unshift(report);

  localStorage.setItem(
    "wakleReports",
    JSON.stringify(reports)
  );

  displayReports(reports);

  alert("Report submitted successfully!");

  itemForm.reset();
  reportForm.style.display = "none";
});

// Search reports
searchInput.addEventListener("input", function() {
  const query = searchInput.value.toLowerCase();

  const filteredReports = getReports().filter(function(report) {
    return (
      report.name.toLowerCase().includes(query) ||
      report.description.toLowerCase().includes(query) ||
      report.location.toLowerCase().includes(query) ||
      report.type.toLowerCase().includes(query)
    );
  });

  displayReports(filteredReports);
});

// Load reports when page opens
displayReports(getReports());

console.log("Wakle-Finder is running!");
