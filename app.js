import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signInWithPopup, 
    GoogleAuthProvider, 
    signOut, 
    updatePassword, 
    updateProfile, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
    getFirestore, 
    doc, 
    setDoc, 
    getDoc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ==========================================================================
// 1. Firebase Initialization
// ==========================================================================
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

// ==========================================================================
// 2. Navigation / Landing Page Logic (index.html)
// ==========================================================================
const navAuthBtn = document.getElementById("nav-auth-btn");

if (window.location.pathname.endsWith('/index.html')) {
    window.location.replace(window.location.pathname.replace(/\/index\.html$/, '/'));
}

// ==========================================================================
// 3. Auth Page Logic (auth.html)
// ==========================================================================
const loginFormContainer = document.getElementById('loginFormContainer');
const signupFormContainer = document.getElementById('signupFormContainer');

const loginEmailInput = document.getElementById('login-email');
const loginPasswordInput = document.getElementById('login-password');
const loginForm = loginFormContainer ? loginFormContainer.querySelector('form') : null;
const loginSubmitBtn = loginForm ? loginForm.querySelector('button[type="submit"]') : null;
const googleLoginBtn = document.getElementById('googleLoginBtn');

const signupNameInput = document.getElementById('signup-name');
const signupEmailInput = document.getElementById('signup-email');
const signupPasswordInput = document.getElementById('signup-password');
const signupForm = signupFormContainer ? signupFormContainer.querySelector('form') : null;
const signupSubmitBtn = signupForm ? signupForm.querySelector('button[type="submit"]') : null;
const googleSignupBtn = document.getElementById('googleSignupBtn');

function resetButtonState(button, text) {
    if (button) {
        button.disabled = false;
        button.textContent = text;
    }
}

window.addEventListener('pageshow', () => {
    resetButtonState(loginSubmitBtn, "LOG IN");
    resetButtonState(signupSubmitBtn, "SIGN UP");
});

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = loginEmailInput.value.trim();
        const password = loginPasswordInput.value.trim();

        if (!email || !password) {
            alert("Please fill in all required fields.");
            return;
        }

        loginSubmitBtn.disabled = true;
        loginSubmitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Logging in...';

        try {
            await signInWithEmailAndPassword(auth, email, password);
            window.location.href = "home.html";
        } catch (err) {
            console.error("Login Error:", err);
            alert("Login failed: " + err.message);
            resetButtonState(loginSubmitBtn, "LOG IN");
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
            resetButtonState(signupSubmitBtn, "SIGN UP");
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

if (googleLoginBtn) googleLoginBtn.addEventListener('click', handleGoogleAuth);
if (googleSignupBtn) googleSignupBtn.addEventListener('click', handleGoogleAuth);

// ==========================================================================
// 4. Dashboard Page Logic (dashboard.html)
// ==========================================================================
const profileUsername = document.getElementById("profile-username");
const detailEmail = document.getElementById("detail-email");
const avatar = document.getElementById("avatar");

const btnLogout = document.getElementById("btn-logout");
const btnEditAccount = document.getElementById("btn-edit-account");
const btnSidebarSettings = document.getElementById("btn-sidebar-settings");
const btnCloseSettings = document.getElementById("btn-close-settings");

const settingsCard = document.getElementById("account-settings-card");
const editProfileForm = document.getElementById("edit-profile-form");
const editFullNameInput = document.getElementById("edit-fullname");
const updatePassForm = document.getElementById("update-pass-form");
const newPasswordInput = document.getElementById("new-password");

let currentUser = null;

// Dynamic Logout Modal Builder
function createLogoutModal() {
    if (document.getElementById("logout-modal-overlay") || !btnLogout) return;
    const modalMarkup = `
        <div id="logout-modal-overlay" class="modal-overlay">
            <div class="logout-modal">
                <div class="logout-modal-icon">
                    <i class="fa-solid fa-right-from-bracket"></i>
                </div>
                <h3>Log Out</h3>
                <p>Are you sure you want to log out of your account?</p>
                <div class="modal-actions">
                    <button id="modal-cancel-btn" class="modal-btn modal-btn-cancel">Cancel</button>
                    <button id="modal-confirm-btn" class="modal-btn modal-btn-confirm">Log Out</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalMarkup);
}

createLogoutModal();

const modalOverlay = document.getElementById("logout-modal-overlay");
const modalCancelBtn = document.getElementById("modal-cancel-btn");
const modalConfirmBtn = document.getElementById("modal-confirm-btn");

function showEditOptions() {
    if (settingsCard) {
        settingsCard.classList.remove("settings-card-hidden");
        settingsCard.classList.add("settings-card-visible");
        if (editFullNameInput) editFullNameInput.focus();
    }
}

function hideEditOptions() {
    if (settingsCard) {
        settingsCard.classList.remove("settings-card-visible");
        settingsCard.classList.add("settings-card-hidden");
    }
}

if (btnEditAccount) btnEditAccount.addEventListener("click", showEditOptions);
if (btnSidebarSettings) btnSidebarSettings.addEventListener("click", showEditOptions);
if (btnCloseSettings) btnCloseSettings.addEventListener("click", hideEditOptions);

if (editProfileForm) {
    editProfileForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const newName = editFullNameInput.value.trim();

        if (!newName || !currentUser) return;

        try {
            await updateProfile(currentUser, { displayName: newName });
            
            const userDocRef = doc(db, "users", currentUser.uid);
            await setDoc(userDocRef, { 
                fullName: newName,
                email: currentUser.email 
            }, { merge: true });

            if (profileUsername) profileUsername.textContent = newName;
            if (avatar) avatar.textContent = newName.charAt(0).toUpperCase();

            hideEditOptions();
        } catch (err) {
            console.error("Profile Update Error:", err);
            alert("Failed to update profile: " + err.message);
        }
    });
}

if (updatePassForm) {
    updatePassForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const newPassword = newPasswordInput.value;

        if (!newPassword || !currentUser) return;

        try {
            await updatePassword(currentUser, newPassword);
            newPasswordInput.value = "";
            hideEditOptions();
        } catch (err) {
            console.error("Password Update Error:", err);
            alert("Failed to update password: " + err.message);
        }
    });
}

if (btnLogout) btnLogout.addEventListener("click", () => modalOverlay?.classList.add("active"));
if (modalCancelBtn) modalCancelBtn.addEventListener("click", () => modalOverlay?.classList.remove("active"));

if (modalConfirmBtn) {
    modalConfirmBtn.addEventListener("click", async () => {
        try {
            await signOut(auth);
            window.location.href = "auth.html";
        } catch (err) {
            console.error("Logout Error:", err);
            alert("Failed to log out: " + err.message);
        }
    });
}

// ==========================================================================
// 5. Global Auth State Routing Guard
// ==========================================================================
onAuthStateChanged(auth, async (user) => {
    const isAuthPage = window.location.pathname.includes('auth.html');
    const isDashboardPage = window.location.pathname.includes('dashboard.html');

    if (user) {
        currentUser = user;

        // Update nav button on Landing Page
        if (navAuthBtn) {
            navAuthBtn.textContent = "DASHBOARD >";
            navAuthBtn.href = "dashboard.html";
        }

        // Redirect away from auth page if already logged in
        if (isAuthPage) {
            window.location.href = "dashboard.html";
            return;
        }

        // Fast render for dashboard components
        if (isDashboardPage) {
            const initialName = user.displayName || user.email.split('@')[0];
            const initialEmail = user.email || "";

            if (profileUsername) profileUsername.textContent = initialName;
            if (detailEmail) detailEmail.textContent = initialEmail;
            if (avatar) avatar.textContent = initialName.charAt(0).toUpperCase();
            if (editFullNameInput) editFullNameInput.value = initialName;

            try {
                const userDocRef = doc(db, "users", user.uid);
                const userDocSnap = await getDoc(userDocRef);

                if (userDocSnap.exists()) {
                    const userData = userDocSnap.data();
                    const fullName = userData.fullName || initialName;
                    
                    if (profileUsername) profileUsername.textContent = fullName;
                    if (avatar) avatar.textContent = fullName.charAt(0).toUpperCase();
                    if (editFullNameInput) editFullNameInput.value = fullName;
                }
            } catch (err) {
                console.warn("Firestore sync deferred:", err);
            }
        }
    } else {
        currentUser = null;

        // Protect Dashboard route
        if (isDashboardPage) {
            window.location.href = "auth.html";
        }
    }
});
