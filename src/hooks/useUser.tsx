import { onAuthStateChanged, type User } from "firebase/auth";
import { createContext, useContext, useState, useEffect } from "react";
import { auth, db } from "../../firebaseConfig" // Ensure this points to your firebase config
import { doc, getDoc } from "firebase/firestore";

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
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const userDocRef = doc(db, "users", firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            setUserData(userDocSnap.data() as UserData);
          } else {
            setUserData(null);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          setUserData(null);
        }
      } else {
        setUserData(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <UserContext.Provider value={{ user, userData, loading }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);