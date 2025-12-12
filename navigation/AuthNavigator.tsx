import React, { useState } from "react";
import LoginScreen from "@/screens/LoginScreen";
import SignupScreen from "@/screens/SignupScreen";

export default function AuthNavigator() {
  const [currentScreen, setCurrentScreen] = useState<"login" | "signup">("login");

  if (currentScreen === "signup") {
    return (
      <SignupScreen onNavigateToLogin={() => setCurrentScreen("login")} />
    );
  }

  return (
    <LoginScreen onNavigateToSignup={() => setCurrentScreen("signup")} />
  );
}
