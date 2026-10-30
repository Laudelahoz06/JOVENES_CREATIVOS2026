import { BrowserRouter, Routes, Route } from "react-router-dom";

import MainLayout from "../layouts/MainLayout";

import Home from "../pages/Home";
import Catalog from "../pages/Catalog";
import NotFound from "../pages/NotFound";

function AppRouter() {

    return (
        <BrowserRouter>

            <Routes>

                <Route element={<MainLayout />}>

                    <Route path="/" element={<Home />} />

                    <Route path="/catalogo" element={<Catalog />} />

                    <Route path="*" element={<NotFound />} />

                </Route>

            </Routes>

        </BrowserRouter>
    );
}

export default AppRouter;