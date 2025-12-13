import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  sendPasswordResetEmail 
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";

import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAgKoN-aP4hk4AzeTOkKnGy-QwBMVO5RDw",
  authDomain: "gymtracker-6ef97.firebaseapp.com",
  projectId: "gymtracker-6ef97",
  storageBucket: "gymtracker-6ef97.firebasestorage.app",
  messagingSenderId: "746810944434",
  appId: "1:746810944434:web:7f264137f0d1aeeb7092ab"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Persistent login
setPersistence(auth, browserLocalPersistence);

const form = document.getElementById("loginForm");
const err = document.getElementById("authError");
const forgotPasswordLink = document.getElementById("forgotPasswordLink");
const resetPasswordModal = document.getElementById("resetPasswordModal");
const resetEmailInput = document.getElementById("resetEmailInput");
const sendResetBtn = document.getElementById("sendResetBtn");
const closeResetModal = document.getElementById("closeResetModal");
const errorPopup = document.getElementById("errorPopup");
const errorMessage = document.getElementById("errorMessage");

forgotPasswordLink.addEventListener("click", () => {
  resetPasswordModal.classList.remove("hidden");
});
function showError(msg) {
  errorMessage.textContent = msg;
  const icon = errorPopup.querySelector(".success-icon");
  icon.innerHTML = `<i class="fa-solid fa-xmark-circle"></i>`;
  
  icon.classList.remove("success");
  icon.classList.add("error");
  errorPopup.classList.remove("hidden");

  setTimeout(() => errorPopup.classList.add("hidden"), 1800);
}

function showSuccess(msg) {
  errorMessage.textContent = msg;
  const icon = errorPopup.querySelector(".success-icon");
  icon.innerHTML = `<i class="fa-solid fa-circle-check"></i>`;
  icon.classList.remove("error");
  icon.classList.add("success");

  errorPopup.classList.remove("hidden");

  setTimeout(() => errorPopup.classList.add("hidden"), 1800);
}

// Close modal
closeResetModal.addEventListener("click", () => {
  resetPasswordModal.classList.add("hidden");
});

sendResetBtn.addEventListener("click", async () => {
  const email = resetEmailInput.value.trim();

  if (!email) {
    return;
  }

  try {
    await sendPasswordResetEmail(auth, email);
    showSuccess("Password reset email sent!");
    resetPasswordModal.classList.add("hidden");
  } catch (err) {
    console.error(err);
    if (err.code === "auth/user-not-found") {
      showError("No account found with that email.");
    } else if (err.code === "auth/invalid-email") {
      showError("Invalid email address.");
    } else {
      showError("Something went wrong. Try again.");
    }
  }
});

// ---------------------------
// LOGIN SUBMIT
// ---------------------------
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const input = loginEmail.value.trim().toLowerCase();
  const password = loginPassword.value.trim();

  let emailToUse = input;

  try {
    // If user typed username instead of email → fetch email
    if (!input.includes('@')) {
      const q = query(collection(db, 'users'), where('username', '==', input));
      const snap = await getDocs(q);

      if (snap.empty) {
        throw new Error('No such username');
      }

      emailToUse = snap.docs[0].data().email;
    }

    await signInWithEmailAndPassword(auth, emailToUse, password);
    window.location.href = 'index.html';
  } catch (error) {
    console.log(error);
    err.textContent = 'Incorrect email/username or password.';
    err.classList.remove('hidden');
  }
});

onAuthStateChanged(auth, (user) => {
  if (user) window.location.href = 'index.html';
});
