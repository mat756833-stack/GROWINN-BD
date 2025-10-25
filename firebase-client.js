// ✅ Firebase Configuration & Functions (Fixed Version)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  query,
  where,
  getDocs,
  onSnapshot,
  addDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-storage.js";

// ✅ Correct Firebase Config (fixed .appspot.com)
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
const storage = getStorage(app);

// 🔑 Generate unique referral code
function generateReferralCode() {
  return "REF_" + Math.random().toString(36).substring(2, 10).toUpperCase();
}

// 🧩 Register User
export async function registerUser(name, email, password, phone, referralCode) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;

    let referredBy = null;
    if (referralCode) {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("referralCode", "==", referralCode));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        referredBy = querySnapshot.docs[0].id;
      }
    }

    await setDoc(doc(db, "users", uid), {
      name,
      email,
      phone,
      balance: 0,
      referralCode: generateReferralCode(),
      referredBy: referredBy || null,
      totalDeposits: 0,
      totalWithdrawn: 0,
      createdAt: serverTimestamp(),
    });

    return { success: true, uid };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// 🔑 Login User
export async function loginUser(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, uid: userCredential.user.uid };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// 🚪 Logout User
export async function logoutUser() {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// 👤 Get Current User
export function getCurrentUser() {
  return new Promise((resolve) => {
    onAuthStateChanged(auth, (user) => {
      resolve(user);
    });
  });
}

// 📄 Get User Data
export async function getUserData(uid) {
  try {
    const userDoc = await getDoc(doc(db, "users", uid));
    if (userDoc.exists()) {
      return { success: true, data: userDoc.data() };
    }
    return { success: false, error: "User not found" };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// 🔄 Real-time User Data Listener
export function onUserDataChange(uid, callback) {
  return onSnapshot(doc(db, "users", uid), (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data());
    }
  });
}

// 💳 Create Payment Request
export async function createPaymentRequest(uid, amount, plan, dailyProfit, screenshotURL) {
  try {
    const docRef = await addDoc(collection(db, "paymentRequests"), {
      uid,
      amount,
      plan,
      dailyProfit,
      screenshotURL,
      status: "pending",
      createdAt: serverTimestamp(),
    });
    return { success: true, docId: docRef.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// 📤 Upload Screenshot
export async function uploadScreenshot(file, uid) {
  try {
    const fileName = `payments/${uid}/${Date.now()}_${file.name}`;
    const storageRef = ref(storage, fileName);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    return { success: true, url: downloadURL };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// 💰 Get User's Payment Requests
export async function getUserPaymentRequests(uid) {
  try {
    const q = query(collection(db, "paymentRequests"), where("uid", "==", uid));
    const querySnapshot = await getDocs(q);
    const requests = [];
    querySnapshot.forEach((doc) => {
      requests.push({ id: doc.id, ...doc.data() });
    });
    return { success: true, data: requests };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// 👑 Admin: Get Pending Requests
export async function getPendingPaymentRequests() {
  try {
    const q = query(collection(db, "paymentRequests"), where("status", "==", "pending"));
    const querySnapshot = await getDocs(q);
    const requests = [];
    querySnapshot.forEach((doc) => {
      requests.push({ id: doc.id, ...doc.data() });
    });
    return { success: true, data: requests };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// 🟢 Approve Payment
export async function approvePaymentRequest(requestId, uid, amount, referredBy) {
  try {
    await updateDoc(doc(db, "paymentRequests", requestId), {
      status: "approved",
      approvedAt: serverTimestamp(),
    });

    const userDoc = await getDoc(doc(db, "users", uid));
    const currentBalance = userDoc.data().balance || 0;
    await updateDoc(doc(db, "users", uid), {
      balance: currentBalance + amount,
      totalDeposits: (userDoc.data().totalDeposits || 0) + amount,
    });

    // 💸 Referral bonus
    if (referredBy) {
      const referrerDoc = await getDoc(doc(db, "users", referredBy));
      const referralBonus = amount * 0.18;
      const referrerBalance = referrerDoc.data().balance || 0;
      await updateDoc(doc(db, "users", referredBy), {
        balance: referrerBalance + referralBonus,
      });

      await addDoc(collection(db, "referralBonuses"), {
        referrerId: referredBy,
        referredUserId: uid,
        bonusAmount: referralBonus,
        depositAmount: amount,
        createdAt: serverTimestamp(),
      });
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// 🔴 Reject Payment
export async function rejectPaymentRequest(requestId) {
  try {
    await updateDoc(doc(db, "paymentRequests", requestId), {
      status: "rejected",
      rejectedAt: serverTimestamp(),
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// 🧑‍💼 Check Admin
export async function isUserAdmin(uid) {
  try {
    const adminDoc = await getDoc(doc(db, "admins", uid));
    return adminDoc.exists();
  } catch {
    return false;
  }
}

// 🔍 Get User by UID
export async function getUserByUID(uid) {
  try {
    const userDoc = await getDoc(doc(db, "users", uid));
    if (userDoc.exists()) {
      return { success: true, data: { id: uid, ...userDoc.data() } };
    }
    return { success: false, error: "User not found" };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// 💵 Update User Balance
export async function updateUserBalance(uid, newBalance) {
  try {
    await updateDoc(doc(db, "users", uid), { balance: newBalance });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// 👥 Get All Users
export async function getAllUsers() {
  try {
    const querySnapshot = await getDocs(collection(db, "users"));
    const users = [];
    querySnapshot.forEach((doc) => {
      users.push({ id: doc.id, ...doc.data() });
    });
    return { success: true, data: users };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

