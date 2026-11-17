import React from "react";
import { Link } from "react-router-dom";

import {
  FaArrowRight,
  FaRobot,
  FaBriefcase,
  FaFileAlt,
  FaChartLine,
  FaUsers,
  FaShieldAlt,
  FaLinkedinIn,
  FaGithub,
  FaInstagram,
  FaTwitter,
} from "react-icons/fa";

import "../styles/AboutTalentIQ.css";

function AboutTalentIQ() {
  return (
    <div className="about-page">

      {/* =========================================================
          HERO SECTION
      ========================================================= */}

      <section className="about-hero">

        <div className="about-hero-decoration about-circle-one"></div>
        <div className="about-hero-decoration about-circle-two"></div>

        <div className="about-hero-container">

          <div className="about-hero-content">

            <span className="about-eyebrow">
              ABOUT TALENTIQ
            </span>

            <h1>
              Your career,
              <br />
              <span>powered by AI.</span>
            </h1>

            <p>
              TalentIQ is an AI-powered career platform designed to help
              candidates discover better opportunities, improve their
              resumes and build successful careers.
            </p>

            <div className="about-hero-buttons">

              <Link
                to="/find-jobs"
                className="about-primary-button"
              >
                Explore Jobs
                <FaArrowRight />
              </Link>

              <Link
                to="/help-center"
                className="about-secondary-button"
              >
                Visit Help Center
              </Link>

            </div>

          </div>


          {/* AI VISUAL */}

          <div className="about-ai-visual">

            <div className="about-orbit orbit-one"></div>
            <div className="about-orbit orbit-two"></div>

            <div className="about-ai-center">

              <FaRobot />

              <span>AI</span>

            </div>

            <div className="about-floating-card floating-card-one">
              <FaBriefcase />
            </div>

            <div className="about-floating-card floating-card-two">
              <FaFileAlt />
            </div>

            <div className="about-floating-card floating-card-three">
              <FaChartLine />
            </div>

          </div>

        </div>

      </section>


      {/* =========================================================
          ABOUT INTRO
      ========================================================= */}

      <section className="about-intro">

        <div className="about-section-label">
          WHAT IS TALENTIQ?
        </div>

        <h2>
          Making your career journey
          <span> smarter and simpler.</span>
        </h2>

        <p className="about-intro-text">
          Finding the right job can be challenging. TalentIQ brings
          intelligent job discovery, AI-powered recommendations,
          resume improvement and career insights together in one
          platform.
        </p>

        <div className="about-feature-grid">

          <div className="about-feature-card">

            <div className="about-feature-icon">
              <FaRobot />
            </div>

            <h3>
              AI-Powered
            </h3>

            <p>
              Use AI to discover relevant opportunities and make
              smarter career decisions.
            </p>

          </div>


          <div className="about-feature-card">

            <div className="about-feature-icon">
              <FaBriefcase />
            </div>

            <h3>
              Better Opportunities
            </h3>

            <p>
              Find jobs that better match your skills, experience
              and career goals.
            </p>

          </div>


          <div className="about-feature-card">

            <div className="about-feature-icon">
              <FaFileAlt />
            </div>

            <h3>
              Resume Improvement
            </h3>

            <p>
              Improve your resume and present your skills more
              effectively to employers.
            </p>

          </div>


          <div className="about-feature-card">

            <div className="about-feature-icon">
              <FaChartLine />
            </div>

            <h3>
              Career Insights
            </h3>

            <p>
              Understand your strengths, skills and areas that can
              help you grow professionally.
            </p>

          </div>

        </div>

      </section>


      {/* =========================================================
          MISSION / VISION / VALUES
      ========================================================= */}

      <section className="about-mission-section">

        <div className="about-section-label">
          OUR PURPOSE
        </div>

        <h2>
          Built to help you
          <span> move forward.</span>
        </h2>

        <div className="about-mission-grid">

          {/* MISSION */}

          <div className="about-mission-card">

            <div className="about-card-icon">
              <FaRobot />
            </div>

            <span>
              OUR MISSION
            </span>

            <h3>
              Make career opportunities more accessible.
            </h3>

            <p>
              Our mission is to simplify the job search experience
              by using technology and AI to connect people with
              opportunities that match their skills and ambitions.
            </p>

          </div>


          {/* VISION */}

          <div className="about-mission-card">

            <div className="about-card-icon">
              <FaChartLine />
            </div>

            <span>
              OUR VISION
            </span>

            <h3>
              Build a smarter future for careers.
            </h3>

            <p>
              We envision a future where candidates can understand
              their potential, discover the right opportunities and
              continuously improve their careers with intelligent
              technology.
            </p>

          </div>


          {/* VALUES */}

          <div className="about-mission-card">

            <div className="about-card-icon">
              <FaUsers />
            </div>

            <span>
              OUR VALUES
            </span>

            <h3>
              People first, technology second.
            </h3>

            <p>
              We believe technology should make career decisions
              easier, more transparent and more useful for people.
            </p>

          </div>

        </div>

      </section>


      {/* =========================================================
          WHY TALENTIQ
      ========================================================= */}

      <section className="about-why-section">

        <div className="about-why-content">

          <div className="about-section-label">
            WHY TALENTIQ
          </div>

          <h2>
            Everything you need to
            <span> build your career.</span>
          </h2>

          <p>
            TalentIQ combines job discovery, AI recommendations,
            resume tools and career insights into one connected
            experience.
          </p>

          <div className="about-check-list">

            <div>
              <span>✓</span>
              AI-powered job recommendations
            </div>

            <div>
              <span>✓</span>
              Intelligent job search
            </div>

            <div>
              <span>✓</span>
              Resume analysis and improvement
            </div>

            <div>
              <span>✓</span>
              Application management
            </div>

            <div>
              <span>✓</span>
              Career and skill insights
            </div>

          </div>

        </div>


        <div className="about-why-visual">

          <div className="why-visual-main">

            <FaRobot />

            <h3>
              TalentIQ AI
            </h3>

            <p>
              Your intelligent career companion
            </p>

          </div>

          <div className="why-small-card why-card-one">
            <FaBriefcase />
            <span>Jobs</span>
          </div>

          <div className="why-small-card why-card-two">
            <FaFileAlt />
            <span>Resume</span>
          </div>

          <div className="why-small-card why-card-three">
            <FaChartLine />
            <span>Insights</span>
          </div>

        </div>

      </section>


      {/* =========================================================
          CTA
      ========================================================= */}

      <section className="about-cta">

        <div className="about-cta-content">

          <span>
            READY TO GET STARTED?
          </span>

          <h2>
            Your next opportunity
            <br />
            could be closer than you think.
          </h2>

          <p>
            Explore opportunities and let TalentIQ help you take
            the next step in your career.
          </p>

          <Link
            to="/find-jobs"
            className="about-cta-button"
          >
            Explore Jobs
            <FaArrowRight />
          </Link>

        </div>

      </section>


      {/* =========================================================
          FOOTER
      ========================================================= */}

      <footer className="about-footer">

        <div className="about-footer-container">

          {/* BRAND */}

          <div className="about-footer-brand">

            <Link
              to="/"
              className="about-footer-logo"
            >

              <img
                src="/images/TalentIQ_Logo.png"
                alt="TalentIQ Logo"
              />

              <span>
                Talent<span>IQ</span>
              </span>

            </Link>

            <p>
              TalentIQ is an AI-powered career platform designed
              to help candidates discover the right opportunities,
              improve their resumes and build successful careers.
            </p>


            {/* SOCIAL ICONS */}

            <div className="about-social-links">

              <a
                href="#"
                aria-label="LinkedIn"
              >
                <FaLinkedinIn />
              </a>

              <a
                href="#"
                aria-label="GitHub"
              >
                <FaGithub />
              </a>

              <a
                href="#"
                aria-label="Instagram"
              >
                <FaInstagram />
              </a>

              <a
                href="#"
                aria-label="Twitter"
              >
                <FaTwitter />
              </a>

            </div>

          </div>


          {/* CANDIDATES */}

          <div className="about-footer-column">

            <h3>
              For Candidates
            </h3>

            <Link to="/find-jobs">
              Find Jobs
            </Link>

            <Link to="/ai-recommendations">
              AI Recommendations
            </Link>

            <Link to="/resume">
              Resume Builder
            </Link>

            <Link to="/applications">
              My Applications
            </Link>

            <Link to="/profile">
              My Profile
            </Link>

          </div>


          {/* TALENTIQ AI */}

          <div className="about-footer-column">

            <h3>
              TalentIQ AI
            </h3>

            <Link to="/ai-job-search">
              AI Job Search
            </Link>

            <Link to="/career-insights">
              Career Insights
            </Link>

            <Link to="/skill-gap-analysis">
              Skill Gap Analysis
            </Link>

            <Link to="/career-copilot">
              Career Copilot
            </Link>

            <Link to="/resume-health">
              Resume Health
            </Link>

          </div>


          {/* SUPPORT */}

          <div className="about-footer-column">

            <h3>
              Support
            </h3>

            <Link to="/help-center">
              Help Center
            </Link>

            <Link to="/contact">
              Contact Us
            </Link>

            <Link to="/privacy-policy">
              Privacy Policy
            </Link>

            <Link to="/terms-conditions">
              Terms & Conditions
            </Link>

            <Link to="/about">
              About TalentIQ
            </Link>

          </div>

        </div>


        {/* FOOTER BOTTOM */}

        <div className="about-footer-bottom">

          <p>
            © 2026 TalentIQ. All rights reserved.
          </p>

          <p>
            Built with AI to help you find the right career.
          </p>

        </div>

      </footer>

    </div>
  );
}

export default AboutTalentIQ;