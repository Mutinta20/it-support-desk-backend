
const router = require("express").Router();
const pool = require("../db");

const allowedStatuses = [
    "Pending",
    "In progress",
    "Completed"
];

// Validate the record ID
function getValidId(value) {
    const id = Number(value);

    if (!Number.isInteger(id) || id <= 0) {
        return null;
    }

    return id;
}

// Validate the four editable fields
function validateRecord(body) {
    const { title, category, description, status } = body;

    if (
        typeof title !== "string" ||
        typeof category !== "string" ||
        typeof description !== "string" ||
        typeof status !== "string"
    ) {
        return "All four fields must be text.";
    }

    const cleanTitle = title.trim();
    const cleanCategory = category.trim();
    const cleanDescription = description.trim();
    const cleanStatus = status.trim();

    if (cleanTitle.length < 3 || cleanTitle.length > 80) {
        return "Title must have 3 to 80 characters.";
    }

    if (cleanCategory.length < 2 || cleanCategory.length > 40) {
        return "Category must have 2 to 40 characters.";
    }

    if (
        cleanDescription.length < 5 ||
        cleanDescription.length > 300
    ) {
        return "Description must have 5 to 300 characters.";
    }

    if (!allowedStatuses.includes(cleanStatus)) {
        return "Status must be Pending, In progress or Completed.";
    }

    return null;
}

// GET all records
router.get("/", async (req, res, next) => {
    try {
        const result = await pool.query(
            "SELECT id, title, category, description, status FROM records ORDER BY id"
        );

        res.status(200).json(result.rows);
    } catch (error) {
        next(error);
    }
});

// GET one record
router.get("/:id", async (req, res, next) => {
    try {
        const id = getValidId(req.params.id);

        if (!id) {
            return res.status(400).json({
                message: "Invalid record ID."
            });
        }

        const result = await pool.query(
            "SELECT id, title, category, description, status FROM records WHERE id = $1",
            [id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                message: "Record not found."
            });
        }

        res.status(200).json(result.rows[0]);
    } catch (error) {
        next(error);
    }
});

// POST create a record
router.post("/", async (req, res, next) => {
    try {
        const validationError = validateRecord(req.body);

        if (validationError) {
            return res.status(400).json({
                message: validationError
            });
        }

        const { title, category, description, status } = req.body;

        const result = await pool.query(
            `INSERT INTO records
            (title, category, description, status)
            VALUES ($1, $2, $3, $4)
            RETURNING id, title, category, description, status`,
            [
                title.trim(),
                category.trim(),
                description.trim(),
                status.trim()
            ]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        next(error);
    }
});

// PUT update a record
router.put("/:id", async (req, res, next) => {
    try {
        const id = getValidId(req.params.id);

        if (!id) {
            return res.status(400).json({
                message: "Invalid record ID."
            });
        }

        const validationError = validateRecord(req.body);

        if (validationError) {
            return res.status(400).json({
                message: validationError
            });
        }

        const { title, category, description, status } = req.body;

        const result = await pool.query(
            `UPDATE records
            SET title = $1,
                category = $2,
                description = $3,
                status = $4,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $5
            RETURNING id, title, category, description, status`,
            [
                title.trim(),
                category.trim(),
                description.trim(),
                status.trim(),
                id
            ]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                message: "Record not found."
            });
        }

        res.status(200).json(result.rows[0]);
    } catch (error) {
        next(error);
    }
});

// DELETE a record
router.delete("/:id", async (req, res, next) => {
    try {
        const id = getValidId(req.params.id);

        if (!id) {
            return res.status(400).json({
                message: "Invalid record ID."
            });
        }

        const result = await pool.query(
            "DELETE FROM records WHERE id = $1 RETURNING id",
            [id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                message: "Record not found."
            });
        }

        res.status(200).json({
            message: "Record deleted."
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
