import { createBrowserRouter, Navigate } from "react-router-dom";
import { App } from "./App";
import { AssessmentsPage } from "../pages/assessments/AssessmentsPage";
import { AuthLayout } from "../layouts/AuthLayout";
import { CalendarPage } from "../pages/calendar/CalendarPage";
import { CommunicationPage } from "../pages/communication/CommunicationPage";
import { DashboardLayout } from "../layouts/DashboardLayout";
import { AcademicsPage } from "../pages/academics/AcademicsPage";
import { AttendancePage } from "../pages/attendance/AttendancePage";
import { LoginPage } from "../pages/auth/LoginPage";
import { DashboardPage } from "../pages/dashboard/DashboardPage";
import { ReportsPage } from "../pages/reports/ReportsPage";
import { StudentsPage } from "../pages/students/StudentsPage";
import { TeachersPage } from "../pages/teachers/TeachersPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        element: <AuthLayout />,
        children: [
          {
            path: "login",
            element: <LoginPage />,
          },
        ],
      },
      {
        path: "dashboard",
        element: <DashboardLayout />,
        children: [
          {
            index: true,
            element: <DashboardPage />,
          },
          {
            path: "students",
            element: <StudentsPage />,
          },
          {
            path: "academics",
            element: <AcademicsPage />,
          },
          {
            path: "teachers",
            element: <TeachersPage />,
          },
          {
            path: "attendance",
            element: <AttendancePage />,
          },
          {
            path: "assessments",
            element: <AssessmentsPage />,
          },
          {
            path: "calendar",
            element: <CalendarPage />,
          },
          {
            path: "communication",
            element: <CommunicationPage />,
          },
          {
            path: "reports",
            element: <ReportsPage />,
          },
        ],
      },
    ],
  },
]);
