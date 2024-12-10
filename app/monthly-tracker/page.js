'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../_utils/firebase';
import { Router } from 'next/router';

export default function MonthlyTrackerPage() {
  const [habits, setHabits] = useState([]);
  const [days, setDays] = useState([]);

  useEffect(() => {
    let unsubscribeHabits = () => {};

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        const habitsRef = collection(db, 'users', user.uid, 'habits');

        unsubscribeHabits = onSnapshot(habitsRef, (snapshot) => {
          const fetchedHabits = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setHabits(fetchedHabits);
        });
      } else {
        Router.push('/landingpage');  
      }
    });

    // Set up the days of the current month
    const today = new Date();
    const totalDays = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const daysArray = Array.from({ length: totalDays }, (_, i) => i + 1);
    setDays(daysArray);

    // Cleanup function
    return () => {
      unsubscribeAuth();
      unsubscribeHabits();
    };
  }, []);

  const toggleCompletion = async (habitId, day) => {
    if (!auth.currentUser) return;

    const habitToUpdate = habits.find((habit) => habit.id === habitId);
    if (!habitToUpdate) return;

    const updatedCompletion = {
      ...habitToUpdate.completion,
      [day]: !habitToUpdate.completion?.[day],
    };

    const habitDocRef = doc(db, 'users', auth.currentUser.uid, 'habits', habitId);

    try {
      await updateDoc(habitDocRef, { completion: updatedCompletion });
    } catch (error) {
      console.error('Error updating habit completion:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-pink-400 to-yellow-400 p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-white">
          Monthly Tracker: {new Date().toLocaleString('default', { month: 'long' })}{' '}
          {new Date().getFullYear()}
        </h1>
        <div className="flex space-x-4">
          <Link href="/" className="text-blue-500 hover:underline">
            Daily Tracker
          </Link>
        </div>
      </div>

      {/* Habit Table Section */}
      <div className="overflow-x-auto bg-white rounded-lg shadow p-4">
        <table className="table-auto border-collapse border border-white-700 w-full text-sm text-gray-800">
          <thead>
            <tr>
              <th className="border border-gray-600 p-2 bg-gray-100">Habit</th>
              {days.map((day) => (
                <th key={day} className="border border-gray-600 p-2 bg-gray-100">
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {habits.map((habit) => (
              <tr key={habit.id}>
                <td className="border border-gray-600 p-2 font-semibold">{habit.name}</td>
                {days.map((day) => (
                  <td
                    key={day}
                    className={`border border-gray-600 p-2 cursor-pointer ${
                      habit.completion?.[day] ? 'bg-green-400' : 'bg-gray-300'
                    }`}
                    onClick={() => toggleCompletion(habit.id, day)}
                  ></td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
