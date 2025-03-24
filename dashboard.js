import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  orderBy,
  query,
} from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";
import { addDoc } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";
import {
  deleteDoc,
  doc,
} from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";
import { Timestamp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBmS3PF33c4BHzgjKuM0LUSu_wpIFQSNvk",
  authDomain: "peer-tutor-a1076.firebaseapp.com",
  projectId: "peer-tutor-a1076",
  storageBucket: "peer-tutor-a1076.firebasestorage.app",
  messagingSenderId: "677806357185",
  appId: "1:677806357185:web:c74d94070bf86997517240",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app); // Firestore instance
const auth = getAuth(); // Auth instance

onAuthStateChanged(auth, (user) => {
  if (user) {
    try {
      const usersRef = collection(db, "users");
      const snapshot = getDocs(usersRef);

      snapshot.forEach((doc) => {
        const userData = doc.data();
        const userEmail = userData.email;
        const userRole = userData.role;
      });
    } catch (error) {
      console.error("Error loading users:", error);
      showMessage("Error loading users. Please try again.", "adminMessage");
    }
    // Check if the current user is an admin (you can hardcode the admin email or use Firestore)
    checkIfTutor(userRole);
  } else {
    window.location.href = "index.html"; // Redirect to login if not authenticated
  }
});

// Function to check if the user is an admin
function checkIfTutor(role) {
  if (role === "tutor") {
    alert("You are not an tutor.");
    window.location.href = "homepage.html"; // Redirect if the user is not an admin
  }
}
// Function to load and display all submitted questions on the Tutor Dashboard
async function loadQuestions() {
  const questionsList = document.getElementById("questionsList");
  questionsList.innerHTML = ""; // Clear existing list

  try {
    // Fetch all questions from Firestore
    const q = query(collection(db, "questions"), orderBy("timestamp", "desc"));
    const querySnapshot = await getDocs(q);

    querySnapshot.forEach((doc) => {
      const question = doc.data().question;
      const userId = doc.data().userId;
      const questionId = doc.id; // Get document ID (question ID)

      // Create the list item to display the question
      const li = document.createElement("div");
      li.textContent = question;
      li.classList.add("questionContainer");

      const repliesList = document.createElement("div");
      repliesList.id = `repliesList-${questionId}`;
      li.appendChild(repliesList);
      repliesList.classList = "replyContainer";

      loadReplies(questionId);
      // Add reply form
      if (user && user.uid === userId) {
        const replyForm = document.createElement("form");
        replyForm.id = `replyForm-${questionId}`;
        replyForm.innerHTML = `
                <input type="text" id="replyText-${questionId}" class="replyText" placeholder="Reply..." />
                <button type="submit" id="submitButton">Submit Reply</button>
              `;

        // Add event listener to the reply form
        replyForm.addEventListener("submit", async (event) => {
          event.preventDefault();

          const replyText = document
            .getElementById(`replyText-${questionId}`)
            .value.trim(); // Get the reply text

          if (!replyText) {
            showMessage("Please provide a valid reply.", "replyMessage");
            return;
          }

          try {
            if (!user) {
              showMessage("You need to be logged in to reply.", "replyMessage");
              return;
            }

            // Add the reply to the subcollection of the specific question
            await addDoc(
              collection(db, "questions", questionId, "replies"), // Using subcollection "replies"
              {
                replyText: replyText,
                userId: user.uid, // Associate the reply with the logged-in user
                timestamp: Timestamp.now(),
              }
            );

            showMessage("Reply submitted successfully!", "replyMessage");
            document.getElementById(`replyText-${questionId}`).value = ""; // Clear the input field

            loadReplies(questionId); // Reload replies
          } catch (e) {
            console.error("Error adding reply: ", e);
            showMessage("Error submitting reply.", "replyMessage");
          }
        });
        li.appendChild(replyForm);
      }
      loadReplies();
    });
  } catch (error) {
    console.error("Error fetching questions: ", error);
  }
}

// Function to load replies for a specific question
function loadReplies(questionId) {
  const repliesList = document.getElementById(`repliesList-${questionId}`);

  if (!repliesList) {
    console.error("Replies list element not found.");
    return;
  }

  repliesList.innerHTML = ""; // Clear existing replies
  // Fetch all replies from Firestore (subcollection of the question document)
  const repliesRef = collection(db, "questions", questionId, "replies");
  const q = query(repliesRef, orderBy("timestamp", "asc"));

  getDocs(q)
    .then((querySnapshot) => {
      querySnapshot.forEach((doc) => {
        const reply = doc.data().replyText;
        const replyId = doc.id; // Get the document ID for the reply (used for deletion)
        const replyUserId = doc.data().userId; // Get the userId of the reply

        const li = document.createElement("li");
        li.textContent = reply;
        // Create a delete button for the reply
        const deleteButton = document.createElement("button");
        deleteButton.innerHTML = `<i class="fas fa-trash"></i>`;
        deleteButton.classList.add("delete-btn");

        const user = auth.currentUser; // Get the current authenticated user
        if (user && user.uid === replyUserId) {
          // Only show the delete button if the user is the author of the reply
          deleteButton.onclick = function () {
            deleteReply(questionId, replyId);
          };

          // Append the delete button to the list item
          li.appendChild(deleteButton);
        } else {
          // Hide the delete button if the user is not the author
          deleteButton.style.display = "none";
        }

        repliesList.appendChild(li);
      });
    })
    .catch((error) => {
      console.error("Error fetching replies: ", error);
    });
}

// Function to delete a specific reply
async function deleteReply(questionId, replyId) {
  try {
    // Get the reference to the reply document
    const replyRef = doc(db, "questions", questionId, "replies", replyId);

    // Delete the reply document
    await deleteDoc(replyRef);

    // Show success message
    showMessage("Reply deleted successfully.", "replyMessage");

    // Reload the replies after deletion
    loadReplies(questionId);
  } catch (error) {
    console.error("Error deleting reply: ", error);
    showMessage("Error deleting reply.", "replyMessage");
  }
}

function showMessage(message, divId) {
  const messageDiv = document.getElementById(divId);

  // Check if the messageDiv exists before modifying its properties
  if (messageDiv) {
    messageDiv.style.display = "block";
    messageDiv.innerHTML = message;
    messageDiv.style.opacity = 1;

    setTimeout(function () {
      messageDiv.style.opacity = 0;
    }, 5000);
  } else {
    console.error(
      `Element with ID ${divId} not found. Unable to display message.`
    );
  }
}

// Call the function to load questions when the page loads
loadQuestions();
