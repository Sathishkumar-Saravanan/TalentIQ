import React from "react";
import { useLoading } from "../context/LoadingContext";
import "../styles/loading.css";

const LoadingOverlay = () => {
  const { loading } = useLoading();

  if (!loading) {
    return null;
  }

  return (
    <div className="loading-overlay">
      <div className="loading-box">
        <div className="loading-spinner"></div>

        <p>Loading TalentIQ...</p>
      </div>
    </div>
  );
};

export default LoadingOverlay;