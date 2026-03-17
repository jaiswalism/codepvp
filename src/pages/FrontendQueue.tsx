import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../hooks/useUser";
import { socket } from "../utils/socket";
import LoadingScreen from "./components/LoadingScreen";

type FrontendMatchFoundPayload = {
    roomId: string;
    endTime: number;
};

export default function FrontendQueue() {
    const navigate = useNavigate();
    const { userData } = useUser();
    const username = userData?.username;

    useEffect(() => {
        if (!username) return;

        socket.emit("registerUser", { username });
        socket.emit("joinFrontendQueue", { username });

        const handleMatchFound = ({ roomId }: FrontendMatchFoundPayload) => {
            navigate(`/PixelPvP/room?roomId=${roomId}`);
        };

        socket.on("frontendMatchFound", handleMatchFound);

        return () => {
            socket.emit("leaveFrontendQueue", { username });
            socket.off("frontendMatchFound", handleMatchFound);
        };
    }, [navigate, username]);

    return (
        <div>
            <LoadingScreen message="Finding Players" />
        </div>
    );
}