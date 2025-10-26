// ✅ Firebase CDN Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut 
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

// ✅ Correct Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyCCOUhkqJILjR1qmfmQ-WkeSvnIFR0",
  authDomain: "invest-9731f.firebaseapp.com",
  databaseURL: "https://invest-9731f-default-rtdb.firebaseio.com",
  projectId: "invest-9731f",
  storageBucket: "invest-9731f.appspot.com", // ✅ fixed
  messagingSenderId: "1054310074316",
  appId: "1:1054310074316:web:9f43c69e75163655873f69",
  measurementId: "G-M0F5TK590L",
};

// ✅ Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// 🔑 Register User Function
export async function registerUser(name, email, password, phone) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;

    // Create user document automatically in Firestore
    await setDoc(doc(db, "users", uid), {
      name,
      email,
      phone,
      balance: 0,
      createdAt: serverTimestamp(),
    });

    return { success: true, uid };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// 🔑 Login Function
export async function loginUser(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, uid: userCredential.user.uid };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// 🚪 Logout Function
export async function logoutUser() {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
