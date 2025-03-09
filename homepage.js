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

// Function to show messages to the user
function showMessage(message, divId) {
  const messageDiv = document.getElementById(divId);
  messageDiv.style.display = "block";
  messageDiv.innerHTML = message;
  messageDiv.style.opacity = 1;
  setTimeout(function () {
    messageDiv.style.opacity = 0;
  }, 5000);
}

// Handle question submission
const questionForm = document.getElementById("questionForm");
questionForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const questionText = document.getElementById("question").value.trim();

  // Make sure the question is not empty
  if (!questionText) {
    showMessage("Please enter a valid question.", "questionMessage");
    return;
  }

  try {
    // Get current user (so we can associate the question with their user ID)
    const user = auth.currentUser;
    if (!user) {
      showMessage(
        "You need to be logged in to submit a question.",
        "questionMessage"
      );
      return;
    }

    // Save question to Firestore
    const docRef = await addDoc(collection(db, "questions"), {
      question: questionText,
      userId: user.uid, // Associate the question with the logged-in user
      timestamp: new Date(),
    });

    showMessage("Question submitted successfully!", "questionMessage");
    document.getElementById("question").value = ""; // Clear the input field

    // Optionally, reload the list of questions (if you want to display them right away)
    loadQuestions();
  } catch (e) {
    console.error("Error adding document: ", e);
    showMessage("Error submitting question.", "questionMessage");
  }
});

// Function to load and display all submitted questions
async function loadQuestions() {
  const myQuestionsList = document.getElementById("myQuestionsList");
  const submittedQuestionsList = document.getElementById(
    "submittedQuestionsList"
  );

  myQuestionsList.innerHTML = ""; // Clear the "My Questions" list
  submittedQuestionsList.innerHTML = ""; // Clear the "Submitted Questions" list

  try {
    // Fetch all questions from Firestore
    const q = query(collection(db, "questions"), orderBy("timestamp", "desc"));
    const querySnapshot = await getDocs(q);

    const user = auth.currentUser;

    querySnapshot.forEach((doc) => {
      const question = doc.data().question;
      const userId = doc.data().userId;
      const questionId = doc.id; // Get document ID (question ID)

      // Create a new div for each question
      const li = document.createElement("div");
      li.textContent = question;
      li.id = `question-${questionId}`; // Give the question div an ID

      const questionText = document.createElement("span");
      questionText.textContent = question;

      const editButton = document.createElement("button");
      editButton.textContent = "Edit";
      const deleteButton = document.createElement("button");
      deleteButton.textContent = "Delete";

      // Show the Edit and Delete buttons only if the logged-in user is the author
      if (user && user.uid === userId) {
        // Show Edit button
        editButton.onclick = function () {
          editQuestion(questionId, questionText.textContent); // Implement the edit functionality
        };
        li.appendChild(editButton);

        // Show Delete button
        deleteButton.onclick = function () {
          deleteQuestion(questionId); // Implement delete functionality
        };
        li.appendChild(deleteButton);

        // Append to "My Questions" list
        myQuestionsList.appendChild(li);
      } else {
        // Hide Edit and Delete buttons for questions not authored by the logged-in user
        editButton.style.display = "none";
        deleteButton.style.display = "none";

        // Append to "Submitted Questions" list
        submittedQuestionsList.appendChild(li);
      }

      // Add replies section
      const repliesList = document.createElement("div");
      repliesList.id = `repliesList-${questionId}`;
      li.appendChild(repliesList);

      // Add reply form
      if (user && user.uid === userId) {
        const replyForm = document.createElement("form");
        replyForm.id = `replyForm-${questionId}`;
        replyForm.innerHTML = `
          <input type="text" id="replyText-${questionId}" placeholder="Write your reply" />
          <button type="submit">Submit Reply</button>
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
      // Append the reply form to the question list item (li)
    });
  } catch (error) {
    console.error("Error fetching questions: ", error);
  }
}

// Function to handle question editing
async function editQuestion(questionId, currentQuestionText) {
  const questionDiv = document.getElementById(`question-${questionId}`);

  // Create an input field with the current question text pre-filled
  const inputField = document.createElement("input");
  inputField.type = "text";
  inputField.value = currentQuestionText;

  const saveButton = document.createElement("button");
  saveButton.textContent = "Save";

  const cancelButton = document.createElement("button");
  cancelButton.textContent = "Cancel";

  // Remove the existing text and buttons
  questionDiv.innerHTML = ""; // Clear the question div

  // Add the new input field and buttons
  questionDiv.appendChild(inputField);
  questionDiv.appendChild(saveButton);
  questionDiv.appendChild(cancelButton);

  // Handle saving the updated question
  saveButton.onclick = async function () {
    const updatedQuestionText = inputField.value.trim();

    if (!updatedQuestionText) {
      showMessage("Please provide a valid question.", "questionMessage");
      return;
    }

    try {
      // Get current user
      const user = auth.currentUser;
      if (!user) {
        showMessage(
          "You need to be logged in to edit a question.",
          "questionMessage"
        );
        return;
      }

      // Update the question document in Firestore
      const questionRef = doc(db, "questions", questionId);
      await updateDoc(questionRef, {
        question: updatedQuestionText, // Update the question field
        timestamp: Timestamp.now(), // Update timestamp (optional)
      });

      showMessage("Question updated successfully!", "questionMessage");
      loadQuestions(); // Reload the list of questions
    } catch (e) {
      console.error("Error updating question: ", e);
      showMessage("Error updating question.", "questionMessage");
    }
  };

  // Handle cancelling the edit
  cancelButton.onclick = function () {
    loadQuestions(); // Reload questions without making changes
  };
}

// Function to delete the question
// Function to delete a question (and its replies)
async function deleteQuestion(questionId) {
  try {
    const questionRef = doc(db, "questions", questionId);

    // Check if there are replies in the subcollection
    const repliesSnapshot = await getDocs(collection(questionRef, "replies"));

    // Delete all replies first (if any)
    repliesSnapshot.forEach(async (replyDoc) => {
      await deleteDoc(doc(questionRef, "replies", replyDoc.id));
    });

    // After deleting replies, delete the main question document
    await deleteDoc(questionRef);

    // Show success message
    showMessage("Question deleted successfully.", "questionMessage");
    loadQuestions(); // Reload questions after deletion
  } catch (error) {
    console.error("Error deleting question: ", error);
    showMessage("Error deleting question.", "questionMessage");
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
        deleteButton.textContent = "Delete";

        const user = auth.currentUser; // Get the current authenticated user
        if (user && user.uid === replyUserId) {
          // Compare with the question's userId
          // Only show the delete button if the user is the author of the question

          deleteButton.onclick = function () {
            deleteReply(questionId, replyId);
          };
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

// Function to check the user's role and show the dashboard link if they are a tutor
async function checkUserRole() {
  const user = auth.currentUser;

  if (user) {
    try {
      // Fetch the user's document from Firestore to get their role
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        const role = userData.role; // Assuming role is stored as 'role'

        // Show or hide the "Go to Tutor Dashboard" link based on the user's role
        const tutorDashboardLink =
          document.getElementById("tutorDashboardLink");

        if (role === "tutor") {
          tutorDashboardLink.style.display = "block"; // Show the link if role is tutor
        } else {
          tutorDashboardLink.style.display = "none"; // Hide the link if role is not tutor
        }
      }
    } catch (error) {
      console.error("Error fetching user role: ", error);
    }
  } else {
    console.log("User not authenticated.");
  }
}

// Listen for auth state changes to check user role
onAuthStateChanged(auth, (user) => {
  if (user) {
    checkUserRole(); // Check the role of the logged-in user
  } else {
    window.location.href = "login.html"; // Redirect to login if user is not authenticated
  }
});

loadQuestions();
loadReplies();
