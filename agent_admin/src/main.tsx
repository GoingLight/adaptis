import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";
import { auth } from "./api/client";
import Layout from "./components/Layout";
import AgentLayout from "./pages/AgentLayout";
import Agents from "./pages/Agents";
import Auth from "./pages/Auth";
import Channels from "./pages/Channels";
import Conversations from "./pages/Conversations";
import Knowledge from "./pages/Knowledge";
import Landing from "./pages/Landing";
import Settings from "./pages/Settings";
import Widget from "./pages/Widget";
import { I18nProvider } from "./i18n";
import "./styles.css";

const Guard = ({ children }: { children: React.ReactElement }) => (auth.isLoggedIn() ? children : <Navigate to="/login" replace />);

const router = createBrowserRouter([
  { path: "/", element: <Landing /> },
  { path: "/login", element: <Auth mode="login" /> },
  { path: "/register", element: <Auth mode="register" /> },
  {
    path: "/", element: <Guard><Layout /></Guard>,
    children: [
      { path: "agents", element: <Agents /> },
      {
        path: "agents/:id", element: <AgentLayout />,
        children: [
          { index: true, element: <Navigate to="knowledge" replace /> },
          { path: "knowledge", element: <Knowledge /> },
          { path: "settings", element: <Settings /> },
          { path: "widget", element: <Widget /> },
          { path: "channels", element: <Channels /> },
          { path: "conversations", element: <Conversations /> },
        ],
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(<React.StrictMode><I18nProvider><RouterProvider router={router} /></I18nProvider></React.StrictMode>);
