import { createContext, useContext } from "react";
import type { User } from "firebase/auth";

type UserContextType = {
    user: User | null;
};

export const UserContext = createContext<UserContextType>({ user: null });
export const useUser = () => useContext(UserContext);