import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import {
    getFirestore,
    doc,
    setDoc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyD4uUnjwEcVNVn0Sd6KzuMxBiQW2QTzyks",
    authDomain: "chat-b56a0.firebaseapp.com",
    projectId: "chat-b56a0",
    storageBucket: "chat-b56a0.firebasestorage.app",
    messagingSenderId: "928517534314",
    appId: "1:928517534314:web:adeb5fc7c8ae090dfad013",
    measurementId: "G-MX1MJC4TCN"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

const loginFormContainer = document.getElementById('loginFormContainer');
const signupFormContainer = document.getElementById('signupFormContainer');

const loginEmailInput = document.getElementById('login-email');
const loginPasswordInput = document.getElementById('login-password');
const loginForm = loginFormContainer.querySelector('form');
const loginSubmitBtn = loginForm.querySelector('button[type="submit"]');
const googleLoginBtn = document.getElementById('googleLoginBtn');

const signupNameInput = document.getElementById('signup-name');
const signupEmailInput = document.getElementById('signup-email');
const signupPasswordInput = document.getElementById('signup-password');
const signupForm = signupFormContainer.querySelector('form');
const signupSubmitBtn = signupForm.querySelector('button[type="submit"]');
const googleSignupBtn = document.getElementById('googleSignupBtn');

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = loginEmailInput.value.trim();
        const password = loginPasswordInput.value.trim();

        if (!email || !password) {
            alert("Please fill in all required fields.");
            return;
        }

        const originalBtnText = loginSubmitBtn.textContent;
        loginSubmitBtn.disabled = true;
        loginSubmitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Logging in...';

        try {
            await signInWithEmailAndPassword(auth, email, password);
            window.location.href = "dashboard.html";
        } catch (err) {
            console.error("Login Error:", err);
            alert("Login failed: " + err.message);
            loginSubmitBtn.disabled = false;
            loginSubmitBtn.textContent = originalBtnText;
        }
    });
}

if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = signupNameInput.value.trim();
        const email = signupEmailInput.value.trim();
        const password = signupPasswordInput.value.trim();

        if (!name || !email || !password) {
            alert("Please fill in all required fields.");
            return;
        }

        const originalBtnText = signupSubmitBtn.textContent;
        signupSubmitBtn.disabled = true;
        signupSubmitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Creating account...';

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                fullName: name,
                email: email,
                createdAt: new Date().toISOString()
            });

            window.location.href = "dashboard.html";
        } catch (err) {
            console.error("Sign Up Error:", err);
            alert("Sign up failed: " + err.message);
            signupSubmitBtn.disabled = false;
            signupSubmitBtn.textContent = originalBtnText;
        }
    });
}

async function handleGoogleAuth() {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;

        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
            await setDoc(userDocRef, {
                uid: user.uid,
                fullName: user.displayName || "Google User",
                email: user.email,
                createdAt: new Date().toISOString()
            });
        }

        window.location.href = "dashboard.html";
    } catch (err) {
        console.error("Google Auth Error:", err);
        alert("Google Authentication failed: " + err.message);
    }
}

if (googleLoginBtn) {
    googleLoginBtn.addEventListener('click', handleGoogleAuth);
}

if (googleSignupBtn) {
    googleSignupBtn.addEventListener('click', handleGoogleAuth);
}

onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("User is signed in:", user.email);
    } else {
        console.log("No user is signed in.");
    }
});