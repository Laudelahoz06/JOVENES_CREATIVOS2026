import { BrowserRouter, Routes, Route } from "react-router-dom";

import MainLayout from "../layouts/MainLayout";

import Home from "../pages/Home";
import Catalog from "../pages/Catalog";
import Login from "../pages/Login";
import Register from "../pages/Register";
import NotFound from "../pages/NotFound";

import ProtectedRoute from "../components/common/ProtectedRoute";
import AdminDashboard from "../pages/AdminDashboard";


function AppRouter() {

    return (
        <BrowserRouter>

            <Routes>

                <Route element={<MainLayout />}>
                

                    <Route path="/" element={<Home />} />

                    <Route path="/catalogo" element={<Catalog />} />

                    <Route path="/iniciar-sesion" element={<Login />} />
                    
                    <Route path="/registro" element={<Register />} />


                    <Route path="*" element={<NotFound />} />

                </Route>

                <Route
                    path="/admin"
                    element={
                        <ProtectedRoute allowedRoles={["admin"]}>
                            <AdminDashboard />
                        </ProtectedRoute>
                    }
                />

            </Routes>

        </BrowserRouter>
    );
}

export default AppRouter;