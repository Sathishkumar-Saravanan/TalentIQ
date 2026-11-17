import React from "react";
import { Link } from "react-router-dom";
import {
    FaFileContract,
    FaUserCheck,
    FaBriefcase,
    FaRobot,
    FaShieldAlt,
    FaExclamationTriangle,
    FaArrowLeft,
} from "react-icons/fa";

import "../styles/TermsConditions.css";

function TermsConditions() {
    return (
        <div className="terms-page">

            {/* HERO */}
            <section className="terms-hero">

                <div className="terms-hero-decoration terms-circle-one"></div>
                <div className="terms-hero-decoration terms-circle-two"></div>

                <div className="terms-hero-content">

                    <span className="terms-eyebrow">
                        TALENTIQ LEGAL
                    </span>

                    <h1>
                        Terms & <span>Conditions</span>
                    </h1>

                    <p>
                        Please review the terms that apply when using
                        TalentIQ and its career-related services.
                    </p>

                </div>

            </section>


            {/* MAIN */}
            <main className="terms-main">

                {/* BACK */}
                <Link
                    to="/about-talentiq"
                    className="terms-back-link"
                >
                    <FaArrowLeft />
                    Back to About TalentIQ
                </Link>


                {/* INTRO */}
                <section className="terms-intro-card">

                    <div className="terms-intro-icon">
                        <FaFileContract />
                    </div>

                    <div>
                        <h2>Welcome to TalentIQ</h2>

                        <p>
                            By accessing or using TalentIQ, you agree to
                            follow these Terms & Conditions. These terms
                            are intended to help maintain a safe, useful
                            and reliable career platform for all users.
                        </p>
                    </div>

                </section>


                {/* 01 */}
                <section className="terms-section">

                    <div className="terms-number">
                        01
                    </div>

                    <div className="terms-content">

                        <h2>Use of TalentIQ</h2>

                        <p>
                            TalentIQ provides career-related tools and
                            services including job discovery, job
                            recommendations, resume features and
                            AI-powered career assistance.
                        </p>

                        <p>
                            You agree to use the platform only for
                            lawful and legitimate purposes.
                        </p>

                    </div>

                </section>


                {/* 02 */}
                <section className="terms-section">

                    <div className="terms-number">
                        02
                    </div>

                    <div className="terms-content">

                        <div className="terms-title-row">
                            <FaUserCheck />
                            <h2>User Accounts</h2>
                        </div>

                        <p>
                            Users are responsible for providing accurate
                            information when creating and maintaining
                            their TalentIQ accounts.
                        </p>

                        <p>
                            You are responsible for keeping your account
                            credentials secure and for activities performed
                            through your account.
                        </p>

                    </div>

                </section>


                {/* 03 */}
                <section className="terms-section">

                    <div className="terms-number">
                        03
                    </div>

                    <div className="terms-content">

                        <div className="terms-title-row">
                            <FaBriefcase />
                            <h2>Jobs & Applications</h2>
                        </div>

                        <p>
                            TalentIQ may display job opportunities and
                            provide tools that help users discover and
                            apply for jobs.
                        </p>

                        <p>
                            TalentIQ does not guarantee employment,
                            interviews, job offers or successful
                            application outcomes.
                        </p>

                    </div>

                </section>


                {/* 04 */}
                <section className="terms-section terms-ai-section">

                    <div className="terms-number">
                        04
                    </div>

                    <div className="terms-content">

                        <div className="terms-title-row">
                            <FaRobot />
                            <h2>AI-Powered Features</h2>
                        </div>

                        <p>
                            TalentIQ may use AI to provide job
                            recommendations, resume insights, career
                            suggestions and other related features.
                        </p>

                        <p>
                            AI-generated information is intended to assist
                            users and should not be considered a guarantee
                            of accuracy, employment or professional advice.
                        </p>

                    </div>

                </section>


                {/* 05 */}
                <section className="terms-section">

                    <div className="terms-number">
                        05
                    </div>

                    <div className="terms-content">

                        <h2>User Content</h2>

                        <p>
                            Users may provide information such as resumes,
                            profiles, job applications and messages.
                        </p>

                        <p>
                            You are responsible for ensuring that the
                            information you submit does not violate
                            applicable laws or the rights of others.
                        </p>

                    </div>

                </section>


                {/* 06 */}
                <section className="terms-section">

                    <div className="terms-number">
                        06
                    </div>

                    <div className="terms-content">

                        <div className="terms-title-row">
                            <FaShieldAlt />
                            <h2>Platform Security</h2>
                        </div>

                        <p>
                            Users must not attempt to interfere with,
                            damage or gain unauthorized access to
                            TalentIQ systems or another user's account.
                        </p>

                    </div>

                </section>


                {/* 07 */}
                <section className="terms-section">

                    <div className="terms-number">
                        07
                    </div>

                    <div className="terms-content">

                        <div className="terms-title-row">
                            <FaExclamationTriangle />
                            <h2>Service Limitations</h2>
                        </div>

                        <p>
                            TalentIQ aims to provide reliable services,
                            but features may occasionally be unavailable,
                            modified or temporarily interrupted.
                        </p>

                    </div>

                </section>


                {/* 08 */}
                <section className="terms-section">

                    <div className="terms-number">
                        08
                    </div>

                    <div className="terms-content">

                        <h2>Changes to These Terms</h2>

                        <p>
                            TalentIQ may update these Terms & Conditions
                            as the platform develops. Updated terms will
                            be published on this page.
                        </p>

                    </div>

                </section>


                {/* FINAL CARD */}
                <section className="terms-final-card">

                    <FaFileContract />

                    <div>

                        <h2>Questions About Our Terms?</h2>

                        <p>
                            If you have questions about these Terms &
                            Conditions, our support team can help.
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

export default TermsConditions;