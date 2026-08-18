import PropTypes from "prop-types";
import "./AuthLayout.css";

export default function AuthLayout({children}) {
  return (
    <div className="auth-wrapper">
      {children}
    </div>
  );
}

AuthLayout.propTypes = {
  children: PropTypes.node.isRequired,
};
