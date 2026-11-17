import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

// ============================================================
// AUTH CONTEXT
// ============================================================

const AuthContext = createContext(null);

// ============================================================
// GET TOKEN
// ============================================================

const getToken = () => {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("accessToken") ||
    null
  );
};

// ============================================================
// GET STORED USER
// ============================================================

const getStoredUser = () => {
  try {
    const storedUser =
      localStorage.getItem("user");

    if (!storedUser) {
      return null;
    }

    return JSON.parse(storedUser);
  } catch (error) {
    console.error(
      "AUTH USER PARSE ERROR:",
      error
    );

    return null;
  }
};

// ============================================================
// GET USER ROLE
// ============================================================

const getUserRole = (user = null) => {
  const role =
    user?.role ||
    user?.userRole ||
    user?.accountType ||
    localStorage.getItem("role") ||
    localStorage.getItem("userRole") ||
    "";

  return String(role)
    .trim()
    .toLowerCase();
};

// ============================================================
// CLEAR AUTHENTICATION
// ============================================================

const clearAuthenticationStorage = () => {
  // Tokens
  localStorage.removeItem("token");
  localStorage.removeItem("authToken");
  localStorage.removeItem("accessToken");

  // User
  localStorage.removeItem("user");

  // Roles
  localStorage.removeItem("role");
  localStorage.removeItem("userRole");

  // Remember me
  localStorage.removeItem("rememberMe");
};

// ============================================================
// AUTH PROVIDER
// ============================================================

export const AuthProvider = ({
  children,
}) => {
  const [user, setUser] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  // ==========================================================
  // RESTORE AUTHENTICATION
  // ==========================================================

  useEffect(() => {
    const restoreAuthentication = () => {
      try {
        const token = getToken();
        const savedUser =
          getStoredUser();

        // ----------------------------------------------------
        // VALID AUTH DATA
        // ----------------------------------------------------

        if (token && savedUser) {
          const normalizedRole =
            getUserRole(savedUser);

          /*
           * Keep the role synchronized.
           *
           * This is important because App.jsx uses the role
           * to decide whether to display CandidateNavbar or
           * RecruiterNavbar.
           */

          if (normalizedRole) {
            localStorage.setItem(
              "role",
              normalizedRole
            );
          }

          setUser({
            ...savedUser,
            role:
              savedUser.role ||
              normalizedRole,
          });
        } else {
          // --------------------------------------------------
          // INVALID / INCOMPLETE AUTH DATA
          // --------------------------------------------------

          clearAuthenticationStorage();

          setUser(null);
        }
      } catch (error) {
        console.error(
          "AUTH RESTORE ERROR:",
          error
        );

        clearAuthenticationStorage();

        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    restoreAuthentication();
  }, []);

  // ==========================================================
  // LOGIN
  // ==========================================================

  const login = (
    userData,
    token
  ) => {
    try {
      // ------------------------------------------------------
      // VALIDATION
      // ------------------------------------------------------

      if (!userData) {
        console.error(
          "LOGIN ERROR: User data is missing."
        );

        return false;
      }

      if (!token) {
        console.error(
          "LOGIN ERROR: Token is missing."
        );

        return false;
      }

      // ------------------------------------------------------
      // GET ROLE
      // ------------------------------------------------------

      const role =
        getUserRole(userData);

      // ------------------------------------------------------
      // NORMALIZE USER
      // ------------------------------------------------------

      const normalizedUser = {
        ...userData,
        ...(role
          ? { role }
          : {}),
      };

      // ------------------------------------------------------
      // SAVE TOKEN
      // ------------------------------------------------------

      localStorage.setItem(
        "token",
        token
      );

      // ------------------------------------------------------
      // SAVE USER
      // ------------------------------------------------------

      localStorage.setItem(
        "user",
        JSON.stringify(
          normalizedUser
        )
      );

      // ------------------------------------------------------
      // SAVE ROLE
      // ------------------------------------------------------

      if (role) {
        localStorage.setItem(
          "role",
          role
        );

        // Keep this for compatibility
        localStorage.setItem(
          "userRole",
          role
        );
      }

      // ------------------------------------------------------
      // UPDATE REACT STATE
      // ------------------------------------------------------

      setUser(
        normalizedUser
      );

      console.log(
        "AUTH LOGIN SUCCESS:",
        {
          user: normalizedUser,
          role,
          tokenExists: true,
        }
      );

      return true;
    } catch (error) {
      console.error(
        "AUTH LOGIN ERROR:",
        error
      );

      return false;
    }
  };

  // ==========================================================
  // LOGOUT
  // ==========================================================

  const logout = () => {
    try {
      clearAuthenticationStorage();

      setUser(null);

      console.log(
        "AUTH LOGOUT SUCCESS"
      );
    } catch (error) {
      console.error(
        "AUTH LOGOUT ERROR:",
        error
      );
    }
  };

  // ==========================================================
  // UPDATE USER
  // ==========================================================

  const updateUser = (
    updatedUser
  ) => {
    if (!updatedUser) {
      return;
    }

    const currentUser =
      user || {};

    const mergedUser = {
      ...currentUser,
      ...updatedUser,
    };

    const role =
      getUserRole(mergedUser);

    if (role) {
      mergedUser.role = role;

      localStorage.setItem(
        "role",
        role
      );

      localStorage.setItem(
        "userRole",
        role
      );
    }

    localStorage.setItem(
      "user",
      JSON.stringify(
        mergedUser
      )
    );

    setUser(mergedUser);
  };

  // ==========================================================
  // SET USER
  // ==========================================================

  const setAuthenticatedUser = (
    newUser
  ) => {
    if (!newUser) {
      setUser(null);

      localStorage.removeItem(
        "user"
      );

      return;
    }

    const role =
      getUserRole(newUser);

    const normalizedUser = {
      ...newUser,
      ...(role
        ? { role }
        : {}),
    };

    localStorage.setItem(
      "user",
      JSON.stringify(
        normalizedUser
      )
    );

    if (role) {
      localStorage.setItem(
        "role",
        role
      );

      localStorage.setItem(
        "userRole",
        role
      );
    }

    setUser(
      normalizedUser
    );
  };

  // ==========================================================
  // TOKEN
  // ==========================================================

  const token = getToken();

  // ==========================================================
  // ROLE
  // ==========================================================

  const role =
    getUserRole(user);

  // ==========================================================
  // AUTHENTICATED
  // ==========================================================

  const isAuthenticated =
    Boolean(token) &&
    Boolean(user);

  // ==========================================================
  // IS CANDIDATE
  // ==========================================================

  const isCandidate =
    isAuthenticated &&
    role === "candidate";

  // ==========================================================
  // IS RECRUITER
  // ==========================================================

  const isRecruiter =
    isAuthenticated &&
    role === "recruiter";

  // ==========================================================
  // CONTEXT VALUE
  // ==========================================================

  const contextValue = {
    // User
    user,

    setUser:
      setAuthenticatedUser,

    updateUser,

    // Authentication
    login,
    logout,

    // Status
    loading,
    isAuthenticated,

    // Token
    token,

    // Role
    role,

    // Role helpers
    isCandidate,
    isRecruiter,
  };

  // ==========================================================
  // PROVIDER
  // ==========================================================

  return (
    <AuthContext.Provider
      value={contextValue}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ============================================================
// USE AUTH
// ============================================================

export const useAuth = () => {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
};

// ============================================================
// DEFAULT EXPORT
// ============================================================

export default AuthContext;