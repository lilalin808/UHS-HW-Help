import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  orderBy,
  query,
} from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";
import { doc } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";
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
      const questionId = doc.id; // Get document ID (question ID)

      // Create the list item to display the question
      const li = document.createElement("div");
      li.type = "container";
      li.id = "questionContainer";
      li.classList.add("questionContainer");

      li.textContent = question;

      const repliesList = document.createElement("div");
      repliesList.id = `repliesList-${questionId}`;
      li.appendChild(repliesList);
      repliesList.classList.add("replyContainer");

      questionsList.appendChild(li);

      loadReplies(questionId);
    });
  } catch (error) {
    console.error("Error fetching questions: ", error);
    showMessage("Error fetching questions.", "questionMessage");
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

        const li = document.createElement("div");
        li.type = "container";
        li.classList.add("replyBox");

        li.textContent = reply;

        // Create a delete button for the reply

        repliesList.appendChild(li);
      });
    })
    .catch((error) => {
      console.error("Error fetching replies: ", error);
    });
}

// Call the function to load questions when the page loads
loadQuestions();
