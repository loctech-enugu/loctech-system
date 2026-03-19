/** Walk-in attendance method */
export type WalkInMethod = "staff_assisted" | "barcode";

/** Signed-in student record returned by getSignedInStudents */
export interface WalkInSignedInRecord {
  id: string;
  studentId: string;
  studentName?: string;
  studentEmail?: string;
  signInTime: string | null;
  signOutTime: string | null;
  method?: WalkInMethod;
}

/** Walk-in session (barcode) - expiresAt may be Date or ISO string from API */
export interface WalkInSession {
  barcode: string;
  expiresAt: Date | string;
}

/** Student search result for walk-in */
export interface WalkInStudentSearchResult {
  id: string;
  name: string;
  email: string;
}

/** Sign-in result */
export interface WalkInSignInResult {
  id: string;
  message: string;
}
