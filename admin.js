import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBmS3PF33c4BHzgjKuM0LUSu_wpIFQSNvk",
  authDomain: "peer-tutor-a1076.firebaseapp.com",
  projectId: "peer-tutor-a1076",
  storageBucket: "peer-tutor-a1076.firebasestorage.app",
  messagingSenderId: "677806357185",
  appId: "1:677806357185:web:be5149be7ba68343517240",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const auth = getAuth();
const db = getFirestore(app);

// Check if the logged-in user is an admin
onAuthStateChanged(auth, (user) => {
  if (user) {
    // Check if the current user is an admin (you can hardcode the admin email or use Firestore)
    checkIfAdmin(user.email);
  } else {
    window.location.href = "login.html"; // Redirect to login if not authenticated
  }
});

// Function to check if the user is an admin
function checkIfAdmin(email) {
  const adminEmail = "lilalanlin@icloud.com"; // Replace this with your admin email
  if (email !== adminEmail) {
    alert("You are not an admin.");
    window.location.href = "index.html"; // Redirect if the user is not an admin
  } else {
    // Once an admin is authenticated, fetch and display the roles
    loadAssignedRoles();
  }
}

// Handle role assignment form submission
const assignRoleForm = document.getElementById("assignRoleForm");
assignRoleForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = document.getElementById("email").value.trim();
  const role = document.getElementById("role").value;

  if (!email) {
    showMessage("Please enter an email.", "adminMessage");
    return;
  }

  try {
    // Query the users collection using the email (you'll need to store emails as a field)
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", email)); // Use query() with where() to filter by email

    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      // Assume we found the user and get the user ID
      const userDoc = snapshot.docs[0];
      const userId = userDoc.id; // UID from Firestore

      const userRef = doc(db, "users", userId); // Reference to the user's document
      // Now assign the role directly in the user's document
      await updateDoc(userRef, {
        role: role, // Update the role field
      });

      showMessage(
        `Role of ${role} assigned to ${email} successfully.`,
        "adminMessage"
      );
      loadAssignedRoles();
    } else {
      showMessage(`No user found with email: ${email}`, "adminMessage");
    }
  } catch (error) {
    console.error("Error assigning role: ", error);
    showMessage("Error assigning role. Please try again.", "adminMessage");
  }
});

async function loadAssignedRoles() {
  const usersList = document.getElementById("usersList");
  usersList.innerHTML = "";

  try {
    const usersRef = collection(db, "users");
    const snapshot = await getDocs(usersRef);

    snapshot.forEach((doc) => {
      const userData = doc.data();
      const userEmail = userData.email;
      const userRole = userData.role;

      const userDiv = document.createElement("div");
      userDiv.classList.add("user-item");

      userDiv.innerHTML = `
            <p><strong>${userEmail}</strong></p>
            `;
      usersList.appendChild(userDiv);
    });
  } catch (error) {
    console.error("Error loading users:", error);
    showMessage("Error loading users. Please try again.", "adminMessage");
  }
}

// Function to display messages to the admin
function showMessage(message, divId) {
  const messageDiv = document.getElementById(divId);
  messageDiv.style.display = "block";
  messageDiv.innerHTML = message;
  messageDiv.style.opacity = 1;
  setTimeout(() => {
    messageDiv.style.opacity = 0;
  }, 5000);
}
