'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'; =
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db } from './_utils/firebase';
import Link from 'next/link';
import { collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';

export default function DailyTrackerPage() {
  const [habits, setHabits] = useState([]);
  const [newHabit, setNewHabit] = useState('');
  const router = useRouter(); 

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push('/landingpage');
        return;
      }
  
      const habitsRef = collection(db, 'users', user.uid, 'habits'); 
      const unsubscribeHabits = onSnapshot(habitsRef, (snapshot) => {
        const fetchedHabits = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setHabits(fetchedHabits); 
      });
  
      return () => unsubscribeHabits();
    });
  
    return () => unsubscribe(); 
  }, [router]);

  const handleLogout = async () => {
    try {
      await signOut(auth); // Firebase signOut function
      console.log("User signed out successfully");
      router.push('/landingpage'); // Redirect to login page
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  // Function to calculate streak for a habit
  const calculateStreak = (habit) => {
    const days = Object.keys(habit.completion).sort((a, b) => b - a); // Sort days in descending order
    let streak = 0;

    for (const day of days) {
      if (habit.completion[day]) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  };

  // Toggle habit completion
  const toggleCompletion = async (habitId) => {
    if (!auth.currentUser) return; // Ensure user is logged in
  
    const habitDocRef = doc(db, 'users', auth.currentUser.uid, 'habits', habitId); // Reference to the habit document
  
    const habitToUpdate = habits.find((habit) => habit.id === habitId);
    if (!habitToUpdate) return;
  
    const updatedCompletion = {
      ...habitToUpdate.completion,
      [new Date().getDate()]: !habitToUpdate.completion?.[new Date().getDate()], // Toggle today's completion
    };
  
    try {
      await updateDoc(habitDocRef, { completion: updatedCompletion }); // Update Firestore
      console.log('Habit completion updated!');
    } catch (error) {
      console.error('Error updating completion:', error);
    }
  };

  // Add a new habit
  const addHabit = async () => {
    if (!auth.currentUser || newHabit.trim() === '') return; // Ensure user is logged in and input is valid
  
    const habitsRef = collection(db, 'users', auth.currentUser.uid, 'habits'); // Path to habits subcollection
  
    const newHabitObj = {
      name: newHabit,
      completion: {}, // Start with an empty map for completion
      createdAt: serverTimestamp(), // Firestore server timestamp
    };
  
    try {
      await addDoc(habitsRef, newHabitObj); // Add habit to Firestore
      setNewHabit(''); // Clear input
      console.log('Habit added successfully!');
    } catch (error) {
      console.error('Error adding habit:', error);
    }
  };

  // Delete a habit
  const deleteHabit = async (habitId) => {
    if (!auth.currentUser) return; // Ensure user is logged in
  
    const habitDocRef = doc(db, 'users', auth.currentUser.uid, 'habits', habitId); // Reference to the habit document
  
    try {
      await deleteDoc(habitDocRef); // Delete habit from Firestore
      console.log('Habit deleted successfully!');
    } catch (error) {
      console.error('Error deleting habit:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-800 p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-white">Daily Tracker</h1>
        <div className="flex space-x-4">
          <Link href="/monthly-tracker" className="text-blue-500 hover:underline">
            Monthly Tracker
          </Link>
          <button
            onClick={handleLogout}
            className="text-red-500 hover:underline"
          >
            Logout
          </button>
        </div>
      </div>

      {/* New Habit Input */}
      <div className="mb-4 flex items-center space-x-2">
        <input
          type="text"
          value={newHabit}
          onChange={(e) => setNewHabit(e.target.value)} // Update state on input change
          className="p-2 bg-gray-700 text-white rounded"
          placeholder="Add a new habit"
        />
        <button
          onClick={addHabit}
          className="p-2 bg-blue-500 text-white rounded hover:bg-blue-700"
        >
          Add Habit
        </button>
      </div>

      {/* Habit List */}
      <div className="space-y-4">
        {habits.map((habit) => (
          <div key={habit.id} className="flex justify-between items-center bg-gray-700 p-4 rounded">
            <span className="text-white">{habit.name}</span>
            <div className="flex items-center space-x-4">
              {/* Completion Button */}
              <button
                onClick={() => toggleCompletion(habit.id)}
                className={`p-2 text-white rounded ${
                  habit.completion?.[new Date().getDate()] ? 'bg-green-500' : 'bg-gray-600'
                }`}
              >
                {habit.completed ? (
                  <span className="text-xl">&#10003;</span> // Checkmark
                ) : (
                  <span className="text-xl">&#x2714;</span> // Empty box
                )}
              </button>

              {/* Display Streak */}
              <span className="text-white">{calculateStreak(habit)} Day Streak</span>

              {/* Delete Button */}
              <button
                onClick={() => deleteHabit(habit.id)}
                className="p-2 bg-red-500 text-white rounded hover:bg-red-700"
              >
                <span className="text-xl">×</span> {/* 'X' icon */}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
