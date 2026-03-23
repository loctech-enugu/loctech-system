"use client";

import {
  WalkInBarcodeCard,
  WalkInSignedInList,
  WalkInStaffSearch,
  useWalkInAttendance,
} from "./walk-in";

/**
 * Walk-in attendance dashboard: barcode session, signed-in list, staff search.
 * Logic lives in `useWalkInAttendance`; UI is split under `./walk-in/`.
 */
export default function WalkInAttendance() {
  const {
    searchQuery,
    setSearchQuery,
    selectedDate,
    setSelectedDate,
    students,
    searching,
    signedIn,
    loadingSignedIn,
    session,
    loadingSession,
    createSession,
    isCreatingSession,
    recordAttendance,
    signOut,
    isSigningOutRecord,
  } = useWalkInAttendance();

  return (
    <div className="space-y-6">
      <WalkInBarcodeCard
        session={session}
        loadingSession={loadingSession}
        isCreatingSession={isCreatingSession}
        onCreateSession={createSession}
      />

      <WalkInSignedInList
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        records={signedIn}
        loading={loadingSignedIn}
        onSignOut={signOut}
        isSigningOutRecord={isSigningOutRecord}
      />

      <WalkInStaffSearch
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        students={students}
        searching={searching}
        onSignIn={recordAttendance}
      />
    </div>
  );
}
