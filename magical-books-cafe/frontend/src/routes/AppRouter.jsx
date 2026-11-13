import { BrowserRouter, Routes, Route } from "react-router-dom";

import MainLayout from "../layouts/MainLayout";

import Home from "../pages/Home";
import Catalog from "../pages/Catalog";
import ProductDetail from "../pages/ProductDetail";
import Login from "../pages/Login";
import Register from "../pages/Register";
import ForgotPassword from "../pages/ForgotPassword";
import ResetPassword from "../pages/ResetPassword";
import Contact from "../pages/Contact";
import Cart from "../pages/Cart";
import PaymentResult from "../pages/PaymentResult";
import Profile from "../pages/Profile";
import MyOrders from "../pages/MyOrders";
import MyRentals from "../pages/MyRentals";
import MyMessages from "../pages/MyMessages";
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

                    <Route
                        path="/catalogo/:id"
                        element={<ProductDetail />}
                    />

                    <Route path="/iniciar-sesion" element={<Login />} />

                    <Route path="/registro" element={<Register />} />

                    <Route
                        path="/recuperar-contrasena"
                        element={<ForgotPassword />}
                    />

                    <Route
                        path="/restablecer-contrasena"
                        element={<ResetPassword />}
                    />

                    <Route path="/contacto" element={<Contact />} />

                    <Route path="/carrito" element={<Cart />} />

                    <Route
                        path="/pagos/resultado"
                        element={<PaymentResult />}
                    />

                    <Route
                        path="/perfil"
                        element={
                            <ProtectedRoute>
                                <Profile />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/mis-pedidos"
                        element={
                            <ProtectedRoute>
                                <MyOrders />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/mis-alquileres"
                        element={
                            <ProtectedRoute>
                                <MyRentals />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/mis-mensajes"
                        element={
                            <ProtectedRoute>
                                <MyMessages />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/admin"
                        element={
                            <ProtectedRoute allowedRoles={["admin"]}>
                                <AdminDashboard />
                            </ProtectedRoute>
                        }
                    />

                    <Route path="*" element={<NotFound />} />

                </Route>

            </Routes>

        </BrowserRouter>
    );
}

export default AppRouter;
