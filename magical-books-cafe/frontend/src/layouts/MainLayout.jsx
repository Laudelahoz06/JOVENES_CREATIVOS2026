import { Outlet, useLocation } from "react-router-dom";

import Navbar from "../components/Navbar";
import Footer from "../components/common/Footer";
import AssistantWidget from "../components/ai/AssistantWidget";

function MainLayout() {
    const { pathname } = useLocation();

    // El panel administrativo tiene su propio layout (sidebar + header):
    // sin navbar pública, sin footer ni asistente flotante.
    const isAdminPage = pathname.startsWith("/admin");

    if (isAdminPage) {
        return <Outlet />;
    }

    return (
        <>
            <Navbar />

            <main>
                <Outlet />
            </main>

            <Footer />

            <AssistantWidget />
        </>
    );
}

export default MainLayout;
