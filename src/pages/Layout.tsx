import { Outlet } from "react-router-dom";

export default function Layout() {
    return(
        <div className="h-dvh w-dvw flex justify-center items-center" >
            <Outlet />
        </div>
    );
}