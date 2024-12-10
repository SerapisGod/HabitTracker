'use client'; // Add this if you're using client-side features like state

import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "../_utils/firebase";
import { useRouter } from 'next/navigation'; 


export default function LandingPage() {
  const router = useRouter();

  const handleLogin = async () => {
    try {
      // Perform GitHub login using Firebase
      const result = await signInWithPopup(auth, provider);
      const user = result.user; // Get user information
      console.log("User signed in:", user);

      // Redirect to the DailyTrackerPage after successful login
      router.push("/");
    } catch (error) {
      console.error("Error logging in:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth); // Firebase signOut function
      console.log("User signed out");
      router.push("/landingpage"); // Redirect to the login page
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-r from-pink-400 to-yellow-400 p-4 text-white">
      <h1 className="text-5xl font-bold mb-4">Welcome to HabitTracker!</h1>
      <p className="text-lg mb-6">Track your habits and achieve your goals.</p>

      <div className="flex space-x-4">
        <button
          onClick={handleLogin}
          className="px-6 py-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded"
        >
          Login
        </button>
        <button
          onClick={handleLogout}
          className="px-6 py-2 bg-red-700 hover:bg-red-800 text-white font-semibold rounded"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
