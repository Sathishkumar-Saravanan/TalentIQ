import React from "react";
import { Navigate, useLocation } from "react-router-dom";

const ProtectedRoute = ({
  children,
  allowedRoles = [],
}) => {
  const location = useLocation();

  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("accessToken");

  const storedUser =
    localStorage.getItem("user") ||
    localStorage.getItem("authUser") ||
    localStorage.getItem("talentIQUser");

  let user = null;

  try {
    if (storedUser) {
      user = JSON.parse(storedUser);
    }
  } catch (error) {
    console.error("PROTECTED ROUTE USER PARSE ERROR:", error);
    user = null;
  }

  /*
  |--------------------------------------------------------------------------
  | NOT LOGGED IN
  |--------------------------------------------------------------------------
  */

  if (!token) {
    console.log(
      "PROTECTED ROUTE: No token → redirecting to login"
    );

    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location.pathname,
        }}
      />
    );
  }

  /*
  |--------------------------------------------------------------------------
  | ROLE
  |--------------------------------------------------------------------------
  */

  const role = String(
    user?.role || ""
  )
    .trim()
    .toLowerCase();

  /*
  |--------------------------------------------------------------------------
  | ROLE RESTRICTION
  |--------------------------------------------------------------------------
  */

  if (
    allowedRoles.length > 0 &&
    !allowedRoles
      .map((item) =>
        String(item)
          .trim()
          .toLowerCase()
      )
      .includes(role)
  ) {
    console.log(
      "PROTECTED ROUTE: Role not allowed",
      {
        role,
        allowedRoles,
        pathname: location.pathname,
      }
    );

    /*
    |----------------------------------------------------------------------
    | SEND USER TO THEIR OWN DASHBOARD
    |----------------------------------------------------------------------
    */

    if (role === "recruiter") {
      return (
        <Navigate
          to="/recruiter-dashboard"
          replace
        />
      );
    }

    if (role === "candidate") {
      return (
        <Navigate
          to="/dashboard"
          replace
        />
      );
    }

    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  return children;
};

export default ProtectedRoute;