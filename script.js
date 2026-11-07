// CampusKhoj JavaScript

const reportForm = document.getElementById("reportForm");
const itemForm = document.getElementById("itemForm");
const itemType = document.getElementById("itemType");

// Lost Item button
function reportLostItem() {
  reportForm.style.display = "block";
  itemType.value = "Lost";
  reportForm.scrollIntoView({ behavior: "smooth" });
}

// Found Item button
function reportFoundItem() {
  reportForm.style.display = "block";
  itemType.value = "Found";
  reportForm.scrollIntoView({ behavior: "smooth" });
}

// Submit report
itemForm.addEventListener("submit", function(event) {
  event.preventDefault();

  const name = document.getElementById("itemName").value;
  const type = itemType.value;
  const description = document.getElementById("itemDescription").value;
  const location = document.getElementById("itemLocation").value;
  const date = document.getElementById("itemDate").value;

  const report = {
    name,
    type,
    description,
    location,
    date
  };

  const reports = JSON.parse(localStorage.getItem("campusReports")) || [];

  reports.push(report);

  localStorage.setItem("campusReports", JSON.stringify(reports));

  alert("Your " + type + " report has been submitted successfully!");

  itemForm.reset();
  reportForm.style.display = "none";
});

console.log("CampusKhoj is running!");
