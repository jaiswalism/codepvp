import { Navigate } from "react-router-dom";
import { useUser } from "../../hooks/useUser";

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, userData, loading } = useUser();

  // 1. Loading State: Keep the user on a splash screen while Firebase 
  // and Firestore resolve the role. This prevents a "flash" of the admin page.
  if (loading) {
    return (
      <div className="bg-[#0a0a0c] min-h-screen flex items-center justify-center">
        <div className="text-cyan-400 font-mono animate-pulse uppercase tracking-widest text-sm">
          [ SYSTEM_CHECK: VERIFYING_ADMIN_PRIVILEGES ]
        </div>
      </div>
    );
  }
  
  // 2. Auth Check: If there is no Firebase Auth user session at all,
  // redirect them to the login page immediately.
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 3. Role Check: If logged in, but the Firestore document doesn't 
  // have role: "admin", redirect them to the home page.
  if (!userData || userData.role !== "admin") {
    console.error("ACCESS_DENIED: Unauthorized attempt to reach Admin Arena.");
    return <Navigate to="/" replace />;
  }

  // 4. Access Granted: If all checks pass, render the AddQuestion page.
  return <>{children}</>;
};

export default AdminRoute;