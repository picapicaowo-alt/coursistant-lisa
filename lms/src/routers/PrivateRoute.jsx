import { useAuth } from "../contexts/AuthContext.js";
import { Navigate } from "react-router-dom";
import axios from "axios";
import { useEffect, useState } from "react";

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const [tokenValid, setTokenValid] = useState(null);  // null: not checked yet

  useEffect(() => {
    if (user) {
      const checkToken = async () => {
        try {
          const response = await axios.get(`${import.meta.env.VITE_TOKEN_CHECK_API_DOMAIN_NAME}/profile/user/${user.id}`, {
            headers: {
              'token': user.accessToken
            }
          });
          if (response.data.code === 4011 || response.data.msg === "Access Token Validation Failed") {
            setTokenValid(false);
          } else {
            setTokenValid(true);
          }
        } catch (err) {
          setTokenValid(false);
        }
      };
      checkToken();
    }
  }, [user]);

  if (loading || (user && tokenValid === null)) {
    return <div>Loading...</div>;
  }

  if (!user || tokenValid === false) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default PrivateRoute;
