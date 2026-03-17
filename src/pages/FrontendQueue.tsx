import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../hooks/useUser";
import { socket } from "../utils/socket";
import LoadingScreen from "./components/LoadingScreen";

type FrontendMatchFoundPayload = {
    roomId: string;
    endTime: number;
};

export default function FrontendQueue(){

    const navigate = useNavigate();

    const { user, loading } = useUser();
    const currentUserName = user?.displayName || user?.email || "Anon";

    useEffect(() => {
        if(!user && !loading) navigate("/login");
    }, [user, loading, navigate]);

    useEffect(() => {
        if (currentUserName && currentUserName !== "Anon") {
            socket.emit("registerUser", { username: currentUserName });
            socket.emit("joinFrontendQueue", { username: currentUserName });
        }
    }, [currentUserName]);

    useEffect(() => {
        const handleMatchFound = (data: any) => {
            const { roomId, endTime } = data;
            navigate(`/PixelPvP/room/${roomId}`, { state: { endTime } });
        };

        socket.on("frontendMatchFound", handleMatchFound);

        // ALWAYS clean up socket listeners in React, otherwise you get duplicate navigations
        return () => {
            socket.off("frontendMatchFound", handleMatchFound);
        };
    }, [navigate]);

    return(
        <div>
            <LoadingScreen message="Searchin for players" />
        </div>
    )
}