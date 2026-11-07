// Wakle-Finder JavaScript

const reportForm = document.getElementById("reportForm");
const itemForm = document.getElementById("itemForm");
const itemType = document.getElementById("itemType");

function reportLostItem() {
  reportForm.style.display = "block";
  itemType.value = "Lost";
  reportForm.scrollIntoView({ behavior: "smooth" });
}

function reportFoundItem() {
  reportForm.style.display = "block";
  itemType.value = "Found";
  reportForm.scrollIntoView({ behavior: "smooth" });
}

itemForm.addEventListener("submit", function(event) {
  event.preventDefault();

  const report = {
    name: document.getElementById("itemName").value,
    type: itemType.value,
    description: document.getElementById("itemDescription").value,
    location: document.getElementById("itemLocation").value,
    date: document.getElementById("itemDate").value
  };

  const reports = JSON.parse(
    localStorage.getItem("wakleReports") || "[]"
  );

  reports.push(report);

  localStorage.setItem("wakleReports", JSON.stringify(reports));

  alert("Your " + report.type + " report submitted successfully!");

  itemForm.reset();
  reportForm.style.display = "none";
});

console.log("Wakle-Finder is running!");
