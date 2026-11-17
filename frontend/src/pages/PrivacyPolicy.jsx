import React from "react";
import { Link } from "react-router-dom";
import {
    FaShieldAlt,
    FaLock,
    FaUserShield,
    FaDatabase,
    FaRobot,
    FaArrowLeft,
} from "react-icons/fa";

import "../styles/PrivacyPolicy.css";

function PrivacyPolicy() {
    return (
        <div className="privacy-page">

            {/* HERO */}
            <section className="privacy-hero">

                <div className="privacy-hero-decoration privacy-circle-one"></div>
                <div className="privacy-hero-decoration privacy-circle-two"></div>

                <div className="privacy-hero-content">

                    <span className="privacy-eyebrow">
                        TALENTIQ PRIVACY
                    </span>

                    <h1>
                        Privacy <span>Policy</span>
                    </h1>

                    <p>
                        Your privacy matters to us. Learn how TalentIQ
                        collects, uses and protects your information.
                    </p>

                </div>

            </section>


            {/* MAIN CONTENT */}
            <main className="privacy-main">

                {/* BACK LINK */}
                <Link
                    to="/about-talentiq"
                    className="privacy-back-link"
                >
                    <FaArrowLeft />
                    Back to About TalentIQ
                </Link>


                {/* INTRODUCTION */}
                <section className="privacy-card">

                    <div className="privacy-card-icon">
                        <FaShieldAlt />
                    </div>

                    <div>
                        <h2>Our Commitment to Your Privacy</h2>

                        <p>
                            TalentIQ is an AI-powered career platform designed
                            to help candidates discover job opportunities,
                            improve their resumes and build successful careers.
                            We are committed to protecting your personal
                            information and providing a secure experience.
                        </p>

                        <p>
                            This Privacy Policy explains how information may
                            be collected, used and protected when you use
                            TalentIQ.
                        </p>
                    </div>

                </section>


                {/* INFORMATION WE COLLECT */}
                <section className="privacy-section">

                    <div className="privacy-section-number">
                        01
                    </div>

                    <div className="privacy-section-content">

                        <h2>Information We Collect</h2>

                        <p>
                            Depending on how you use TalentIQ, we may collect
                            information such as:
                        </p>

                        <ul>
                            <li>
                                Name and contact information
                            </li>

                            <li>
                                Account and profile information
                            </li>

                            <li>
                                Resume and professional information
                            </li>

                            <li>
                                Skills, education and work experience
                            </li>

                            <li>
                                Job preferences and application information
                            </li>

                            <li>
                                Messages submitted through our support forms
                            </li>
                        </ul>

                    </div>

                </section>


                {/* HOW WE USE INFORMATION */}
                <section className="privacy-section">

                    <div className="privacy-section-number">
                        02
                    </div>

                    <div className="privacy-section-content">

                        <h2>How We Use Your Information</h2>

                        <p>
                            Information may be used to provide and improve
                            TalentIQ services, including:
                        </p>

                        <ul>
                            <li>
                                Creating and managing your account
                            </li>

                            <li>
                                Providing job recommendations
                            </li>

                            <li>
                                Improving resume-related features
                            </li>

                            <li>
                                Matching candidates with relevant opportunities
                            </li>

                            <li>
                                Responding to support requests
                            </li>

                            <li>
                                Improving platform functionality and security
                            </li>
                        </ul>

                    </div>

                </section>


                {/* AI */}
                <section className="privacy-section privacy-ai-section">

                    <div className="privacy-section-number">
                        03
                    </div>

                    <div className="privacy-section-content">

                        <div className="privacy-title-row">
                            <FaRobot />
                            <h2>AI-Powered Features</h2>
                        </div>

                        <p>
                            TalentIQ uses AI-powered functionality to provide
                            features such as job recommendations, job search
                            assistance and resume-related insights.
                        </p>

                        <p>
                            Information provided to these features is used to
                            generate relevant results and improve your career
                            experience within TalentIQ.
                        </p>

                    </div>

                </section>


                {/* DATA SECURITY */}
                <section className="privacy-section">

                    <div className="privacy-section-number">
                        04
                    </div>

                    <div className="privacy-section-content">

                        <div className="privacy-title-row">
                            <FaLock />
                            <h2>Data Security</h2>
                        </div>

                        <p>
                            We take reasonable measures to protect information
                            from unauthorized access, alteration, disclosure
                            or destruction.
                        </p>

                        <p>
                            However, no internet-based platform can guarantee
                            complete security of information.
                        </p>

                    </div>

                </section>


                {/* USER CONTROL */}
                <section className="privacy-section">

                    <div className="privacy-section-number">
                        05
                    </div>

                    <div className="privacy-section-content">

                        <div className="privacy-title-row">
                            <FaUserShield />
                            <h2>Your Privacy Choices</h2>
                        </div>

                        <p>
                            You may review and update information associated
                            with your TalentIQ account through the available
                            profile and account features.
                        </p>

                        <p>
                            If you have questions about your information,
                            you can contact the TalentIQ support team.
                        </p>

                    </div>

                </section>


                {/* DATA STORAGE */}
                <section className="privacy-section">

                    <div className="privacy-section-number">
                        06
                    </div>

                    <div className="privacy-section-content">

                        <div className="privacy-title-row">
                            <FaDatabase />
                            <h2>Data Storage</h2>
                        </div>

                        <p>
                            Information submitted through TalentIQ features
                            may be stored in the platform's database so that
                            the corresponding services can operate correctly.
                        </p>

                    </div>

                </section>


                {/* CHANGES */}
                <section className="privacy-section">

                    <div className="privacy-section-number">
                        07
                    </div>

                    <div className="privacy-section-content">

                        <h2>Changes to This Policy</h2>

                        <p>
                            TalentIQ may update this Privacy Policy from time
                            to time. Any changes will be reflected on this
                            page.
                        </p>

                    </div>

                </section>


                {/* CONTACT */}
                <section className="privacy-contact-card">

                    <FaShieldAlt />

                    <div>
                        <h2>Have Questions?</h2>

                        <p>
                            If you have questions about this Privacy Policy
                            or how TalentIQ handles information, please contact
                            our support team.
                        </p>

                        <Link to="/help-center">
                            Visit Help Center
                        </Link>
                    </div>

                </section>

            </main>

        </div>
    );
}

export default PrivacyPolicy;