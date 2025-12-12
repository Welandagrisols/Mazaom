import React, { useState } from "react";
import LoginScreen from "@/screens/LoginScreen";
import SignupScreen from "@/screens/SignupScreen";
import StaffLoginScreen from "@/screens/StaffLoginScreen";

type AuthScreen = "staff" | "admin" | "signup";

export default function AuthNavigator() {
  const [currentScreen, setCurrentScreen] = useState<AuthScreen>("staff");

  if (currentScreen === "signup") {
    return (
      <SignupScreen onNavigateToLogin={() => setCurrentScreen("admin")} />
    );
  }

  if (currentScreen === "admin") {
    return (
      <LoginScreen
        onNavigateToSignup={() => setCurrentScreen("signup")}
        onNavigateToStaffLogin={() => setCurrentScreen("staff")}
      />
    );
  }

  return (
    <StaffLoginScreen onNavigateToAdminLogin={() => setCurrentScreen("admin")} />
  );
}
