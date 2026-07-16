import React from "react";
import LanguageSwitcher from "../components/LanguageSwitcher";
import "./AuthLayout.css";

export default function AuthLayout({children}) {
  return (
    <div className="auth-wrapper">
      <div className="auth-lang-switcher">
        <LanguageSwitcher/>
      </div>
      
      {children}
    </div>
  );
}
