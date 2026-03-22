import { onAuthStateChanged, type User } from "firebase/auth";
import { createContext, useContext, useState, useEffect } from "react";
import { auth, db } from "../../firebaseConfig" // Ensure this points to your firebase config
import { doc, onSnapshot } from "firebase/firestore";

export interface UserData {
  uid: string;
  email: string | null;
  username: string;
  languages: string[];
  skillLevel: string;
  bio: string;
  avatar: string;
  completedOnboarding: boolean;
  role?: string; // Added for Admin access
  rating?: number;
  questionsSolved?: number;
}

type UserContextType = {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
};

const UserContext = createContext<UserContextType>({
  user: null,
  userData: null,
  loading: true,
});

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  let unsubscribeSnapshot: (() => void) | null = null;

  const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
    setUser(firebaseUser);

    if (firebaseUser) {
      const userDocRef = doc(db, "users", firebaseUser.uid);

      // 🔥 REAL-TIME LISTENER
      unsubscribeSnapshot = onSnapshot(
        userDocRef,
        (docSnap) => {
          if (docSnap.exists()) {
            setUserData(docSnap.data() as UserData);
          } else {
            setUserData(null);
          }
          setLoading(false);
        },
        (error) => {
          console.error("Error listening to user data:", error);
          setUserData(null);
          setLoading(false);
        }
      );
    } else {
      setUserData(null);
      setLoading(false);
    }
  });

  return () => {
    unsubscribeAuth();
    if (unsubscribeSnapshot) unsubscribeSnapshot();
  };
}, []);

  return (
    <UserContext.Provider value={{ user, userData, loading }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);