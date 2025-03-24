import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  orderBy,
  query,
  getDoc,
} from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";
import { addDoc } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";
import {
  deleteDoc,
  doc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";
import { Timestamp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

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
// Firebase configuration

// Initialize Firebase
const db = getFirestore(app); // Firestore instance
const auth = getAuth(); // Auth instance

onAuthStateChanged(auth, async (user) => {
  if (user) {
    console.log("User authenticated:", user.email); // Check if user is logged in
    loadQuestions(); // Load questions after successful authentication
  } else {
    console.log("No user authenticated.");
    window.location.href = "index.html";
  }
});

// Function to check if the user is a tutor
function checkIfTutor(role) {
  if (role !== "tutor") {
    // You had it the other way around before
    alert("You are not a tutor.");
    window.location.href = "homepage.html"; // Redirect if the user is not a tutor
  }
}

// Function to load and display all submitted questions on the Tutor Dashboard
// Function to load and display all submitted questions on the Tutor Dashboard
async function loadQuestions() {
  const questionsList = document.getElementById("questionsList");
  questionsList.innerHTML = ""; // Clear any previous questions

  try {
    const q = query(collection(db, "questions"), orderBy("timestamp", "desc"));
    const querySnapshot = await getDocs(q);

    querySnapshot.forEach((doc) => {
      const questionData = doc.data();
      const question = questionData.question;
      const questionId = doc.id;

      const li = document.createElement("div"); // Create a div for each question
      li.textContent = question; // Set the question text
      li.classList.add("questionContainer");

      const repliesList = document.createElement("div");
      repliesList.id = `repliesList-${questionId}`;
      li.appendChild(repliesList); // Add replies section

      repliesList.classList = "replyContainer";

      console.log(`Created replies list for question ID: ${questionId}`);

      // Add a slight delay before calling loadReplies()
      setTimeout(() => loadReplies(questionId), 100);

      const replyForm = document.createElement("form");
      replyForm.id = `replyForm-${questionId}`;
      replyForm.innerHTML = `
        <input type="text" id="replyText-${questionId}" class="replyText" placeholder="Reply..." />
        <button type="submit" id="submitButton">Submit Reply</button>
      `;

      replyForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const replyText = document
          .getElementById(`replyText-${questionId}`)
          .value.trim();
        if (!replyText) {
          showMessage("Please provide a valid reply.", "replyMessage");
          return;
        }

        try {
          const currentUser = auth.currentUser;
          if (!currentUser) {
            showMessage("You need to be logged in to reply.", "replyMessage");
            return;
          }

          await addDoc(collection(db, "questions", questionId, "replies"), {
            replyText: replyText,
            userId: currentUser.uid,
            timestamp: Timestamp.now(),
          });

          showMessage("Reply submitted successfully!", "replyMessage");
          document.getElementById(`replyText-${questionId}`).value = ""; // Clear the input field

          loadReplies(questionId); // Reload the replies
        } catch (e) {
          console.error("Error adding reply: ", e);
          showMessage("Error submitting reply.", "replyMessage");
        }
      });

      li.appendChild(replyForm);
      questionsList.appendChild(li); // Append the question to the list
    });
  } catch (error) {
    console.error("Error fetching questions: ", error);
  }
}

// Function to load replies for a specific question
// Function to load replies for a specific question
async function loadReplies(questionId) {
  const repliesList = document.getElementById(`repliesList-${questionId}`);

  if (!repliesList) {
    console.error(
      "Replies list element not found for question ID:",
      questionId
    );
    return;
  }

  repliesList.innerHTML = ""; // Clear previous replies

  try {
    const repliesRef = collection(db, "questions", questionId, "replies");
    const q = query(repliesRef, orderBy("timestamp", "asc"));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.log(`No replies found for question ${questionId}`);
      const noRepliesMessage = document.createElement("p");
      noRepliesMessage.textContent = "No replies yet.";
      repliesList.appendChild(noRepliesMessage);
      return;
    }

    querySnapshot.forEach((doc) => {
      const replyData = doc.data();
      const replyText = replyData.replyText;
      const replyUserId = replyData.userId;
      const replyId = doc.id;

      const li = document.createElement("li");
      li.textContent = replyText;

      const deleteButton = document.createElement("button");
      deleteButton.innerHTML = `<i class="fas fa-trash"></i>`;
      deleteButton.classList.add("delete-btn");

      const currentUser = auth.currentUser;

      if (currentUser && currentUser.uid === replyUserId) {
        deleteButton.onclick = function () {
          deleteReply(questionId, replyId);
        };
        li.appendChild(deleteButton);
      }

      repliesList.appendChild(li);
    });
  } catch (error) {
    console.error("Error fetching replies for question ID:", questionId, error);
  }
}

// Function to delete a reply
async function deleteReply(questionId, replyId) {
  try {
    const replyRef = doc(db, "questions", questionId, "replies", replyId);
    await deleteDoc(replyRef);
    showMessage("Reply deleted successfully.", "replyMessage");

    loadReplies(questionId);
  } catch (error) {
    console.error("Error deleting reply: ", error);
    showMessage("Error deleting reply.", "replyMessage");
  }
}

function showMessage(message, divId) {
  const messageDiv = document.getElementById(divId);

  if (messageDiv) {
    messageDiv.style.display = "block";
    messageDiv.innerHTML = message;
    messageDiv.style.opacity = 1;

    setTimeout(() => {
      messageDiv.style.opacity = 0;
    }, 5000);
  } else {
    console.error(
      `Element with ID ${divId} not found. Unable to display message.`
    );
  }
}
