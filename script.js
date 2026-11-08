
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



    // Display Lost Reports
    lostList.innerHTML = "";

    if (lostReports.length === 0) {
      lostList.textContent = "You have not submitted any Lost Reports yet.";
    } else {
      lostReports.forEach((report, index) => {
        lostList.appendChild(
          createReportCard(report, index,true)
        );
      });
    }

    // Display Found Reports
    foundList.innerHTML = "";

    if (foundReports.length === 0) {
      foundList.textContent = "You have not submitted any Found Reports yet.";
    } else {
      foundReports.forEach((report, index) => {
        foundList.appendChild(
          createReportCard(report, index,true)
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

function calculateMatchScore(lost, found) {
  const nameScore =
    textSimilarity(lost.name, found.name);

  const descriptionScore =
    textSimilarity(lost.description, found.description);

  const locationScore =
    textSimilarity(lost.location, found.location);

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

    card.append(
  heading,
  score,
  reasons,
  note,
      lostInfo,
      foundInfo,
      lostButton,
      foundButton
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

  showScreen(detailsScreen);
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
    let photoUrl = "";

    // Upload photo to Supabase Storage
    if (selectedPhotoData) {
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
  await supabaseClient.auth.getUser();

if (authError) throw authError;

const user = authData.user;

if (!user) {
  throw new Error("Please login before submitting a report.");
}

// Create report
const report = {
  user_id: user.id,
  name: document.getElementById("itemName").value.trim(),
  type: itemType.value,
  description: document.getElementById("itemDescription").value.trim(),
  location: document.getElementById("itemLocation").value.trim(),
  date: document.getElementById("itemDate").value || null,
  photo_url: photoUrl || null
};

    const { error } = await supabaseClient
      .from("reports")
      .insert([report]);

    if (error) throw error;

    alert("Report saved online successfully! 🎉");

    // Keep local copy temporarily
    const localReport = {
      ...report,
      photo: selectedPhotoData
    };

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
  showHome();
}
async function editMyReport(report) {
  const { data: authData, error: authError } =
    await supabaseClient.auth.getUser();

  if (authError || !authData.user) {
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

  if (!name.trim()) {
    alert("Item name cannot be empty.");
    return;
  }

  const { error } = await supabaseClient
    .from("reports")
    .update({
      name: name.trim(),
      description: description.trim(),
      location: location.trim(),
      date: date.trim() || null
    })
    .eq("id", report.id)
    .eq("user_id", authData.user.id);

  if (error) {
    alert("Update failed: " + error.message);
    return;
  }

  alert("Report updated successfully!");
  showMyReports();
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

