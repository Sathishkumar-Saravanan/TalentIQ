const express = require("express");

const HelpArticle = require("../models/HelpArticle");
const Contact = require("../models/contact");

const router = express.Router();

/*
============================================================
GET ALL HELP ARTICLES
GET /api/help
============================================================
*/

router.get("/", async (req, res) => {
    try {
        const {
            search = "",
            category = "",
        } = req.query;

        const query = {
            published: true,
        };

        // ----------------------------------------------------
        // CATEGORY FILTER
        // ----------------------------------------------------

        if (
            category &&
            category !== "All"
        ) {
            query.category = category;
        }

        // ----------------------------------------------------
        // SEARCH FILTER
        // ----------------------------------------------------

        if (search.trim()) {
            const searchValue =
                search.trim();

            query.$or = [
                {
                    title: {
                        $regex: searchValue,
                        $options: "i",
                    },
                },
                {
                    description: {
                        $regex: searchValue,
                        $options: "i",
                    },
                },
                {
                    content: {
                        $regex: searchValue,
                        $options: "i",
                    },
                },
            ];
        }

        // ----------------------------------------------------
        // FETCH ARTICLES
        // ----------------------------------------------------

        const articles =
            await HelpArticle.find(query)
                .sort({
                    popular: -1,
                    createdAt: -1,
                });

        return res.status(200).json({
            success: true,
            count: articles.length,
            articles,
        });

    } catch (error) {

        console.error(
            "GET HELP ARTICLES ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to load help articles",
            error: error.message,
        });
    }
});


/*
============================================================
GET POPULAR HELP ARTICLES
GET /api/help/popular
============================================================
*/

router.get(
    "/popular",
    async (req, res) => {
        try {

            const articles =
                await HelpArticle.find({
                    published: true,
                    popular: true,
                })
                    .sort({
                        views: -1,
                        createdAt: -1,
                    })
                    .limit(6);

            return res.status(200).json({
                success: true,
                count: articles.length,
                articles,
            });

        } catch (error) {

            console.error(
                "GET POPULAR HELP ERROR:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Unable to load popular help articles",
                error: error.message,
            });
        }
    }
);


/*
============================================================
SUBMIT HELP CENTER CONTACT REQUEST
POST /api/help/contact
============================================================

This saves the Help Center contact form
into the existing "contacts" MongoDB collection.

Frontend sends:

{
    name,
    email,
    subject,
    category,
    message
}

The Contact model uses:

{
    fullName,
    email,
    subject,
    message
}

Therefore "name" is converted to "fullName".
============================================================
*/

router.post(
    "/contact",
    async (req, res) => {
        try {

            const {
                name,
                email,
                subject,
                category,
                message,
            } = req.body;

            // ------------------------------------------------
            // VALIDATION
            // ------------------------------------------------

            if (
                !name ||
                !email ||
                !subject ||
                !message
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Name, email, subject and message are required",
                });
            }

            // ------------------------------------------------
            // CREATE CONTACT
            // ------------------------------------------------

            const contact =
                await Contact.create({
                    fullName:
                        name.trim(),

                    email:
                        email
                            .trim()
                            .toLowerCase(),

                    subject:
                        subject.trim(),

                    message:
                        message.trim(),
                });

            // ------------------------------------------------
            // SUCCESS RESPONSE
            // ------------------------------------------------

            return res.status(201).json({
                success: true,
                message:
                    "Support request submitted successfully",
                contact,
            });

        } catch (error) {

            console.error(
                "HELP CENTER CONTACT ERROR:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Unable to submit support request",
                error: error.message,
            });
        }
    }
);


/*
============================================================
GET CONTACT REQUESTS
GET /api/help/contacts
============================================================

Optional endpoint for checking Help Center
contact messages.
============================================================
*/

router.get(
    "/contacts",
    async (req, res) => {
        try {

            const contacts =
                await Contact.find()
                    .sort({
                        createdAt: -1,
                    });

            return res.status(200).json({
                success: true,
                count: contacts.length,
                contacts,
            });

        } catch (error) {

            console.error(
                "GET HELP CONTACTS ERROR:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Unable to load contact requests",
                error: error.message,
            });
        }
    }
);


/*
============================================================
GET SINGLE HELP CONTACT
GET /api/help/contacts/:id
============================================================
*/

router.get(
    "/contacts/:id",
    async (req, res) => {
        try {

            const contact =
                await Contact.findById(
                    req.params.id
                );

            if (!contact) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Contact request not found",
                });
            }

            return res.status(200).json({
                success: true,
                contact,
            });

        } catch (error) {

            console.error(
                "GET HELP CONTACT ERROR:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Unable to load contact request",
                error: error.message,
            });
        }
    }
);


/*
============================================================
EXPORT
============================================================
*/

module.exports = router;