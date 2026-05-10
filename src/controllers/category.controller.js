// src/controllers/category.controller.js

const Category = require(
  "../models/Category"
);

/* ======================================================
   CREATE CATEGORY
====================================================== */

exports.createCategory =
  async (req, res) => {
    try {

      const {
        name,
        slug,
        image,
        parent,
        order,
        isActive,
      } = req.body;

      /* ================= VALIDATION ================= */

      if (!name) {
        return res.status(400).json({
          message:
            "Category name required",
        });
      }

      /* ================= SLUG ================= */

      const finalSlug =
        slug
          ? slug
              .trim()
              .toLowerCase()
          : name
              .trim()
              .toLowerCase()
              .replace(
                /\s+/g,
                "-"
              )
              .replace(
                /[^a-z0-9-]/g,
                ""
              );

      /* ================= DUPLICATE CHECK ================= */

      const existing =
        await Category.findOne({
          $or: [
            {
              name: {
                $regex:
                  new RegExp(
                    `^${name}$`,
                    "i"
                  ),
              },
            },
            {
              slug:
                finalSlug,
            },
          ],
        });

      if (existing) {
        return res.status(400).json({
          message:
            "Category already exists",
        });
      }

      /* ================= CREATE ================= */

      const category =
        await Category.create({
          name:
            name.trim(),

          slug:
            finalSlug,

          image:
            image || "",

          parent:
            parent ||
            null,

          order:
            Number(
              order
            ) || 0,

          isActive:
            isActive !==
            false,
        });

      return res.status(201).json({
        success: true,

        message:
          "Category created",

        category,
      });

    } catch (err) {

      console.error(
        "CREATE CATEGORY ERROR:",
        err
      );

      return res.status(400).json({
        message:
          err.message ||
          "Create failed",
      });
    }
  };

/* ======================================================
   GET ALL CATEGORIES
====================================================== */

exports.getCategories =
  async (req, res) => {
    try {

      const {
        active,
      } = req.query;

      const filter = {};

      /* ================= ACTIVE FILTER ================= */

      if (
        active === "true"
      ) {
        filter.isActive =
          true;
      }

      const categories =
        await Category.find(
          filter
        )
          .sort({
            order: 1,
            createdAt: 1,
          })

          .lean();

      return res.json({
        success: true,

        count:
          categories.length,

        categories,
      });

    } catch (err) {

      console.error(
        "GET CATEGORIES ERROR:",
        err
      );

      return res.status(500).json({
        message:
          "Failed to fetch categories",
      });
    }
  };

/* ======================================================
   UPDATE CATEGORY
====================================================== */

exports.updateCategory =
  async (req, res) => {
    try {

      const {
        name,
        slug,
      } = req.body;

      /* ================= EXISTING ================= */

      const existing =
        await Category.findById(
          req.params.id
        );

      if (!existing) {
        return res.status(404).json({
          message:
            "Category not found",
        });
      }

      /* ================= DUPLICATE CHECK ================= */

      if (
        name ||
        slug
      ) {

        const duplicate =
          await Category.findOne({
            _id: {
              $ne:
                req.params.id,
            },

            $or: [
              name
                ? [
                    {
                      name: {
                        $regex:
                          new RegExp(
                            `^${name}$`,
                            "i"
                          ),
                      },
                    },
                  ]
                : [],

              slug
                ? [
                    {
                      slug:
                        slug
                          .trim()
                          .toLowerCase(),
                    },
                  ]
                : [],
            ].flat(),
          });

        if (duplicate) {
          return res.status(400).json({
            message:
              "Category already exists",
          });
        }
      }

      /* ================= UPDATE ================= */

      const updated =
        await Category.findByIdAndUpdate(
          req.params.id,

          {
            ...req.body,

            ...(slug && {
              slug:
                slug
                  .trim()
                  .toLowerCase(),
            }),
          },

          {
            new: true,

            runValidators:
              true,
          }
        );

      return res.json({
        success: true,

        message:
          "Category updated",

        category:
          updated,
      });

    } catch (err) {

      console.error(
        "UPDATE CATEGORY ERROR:",
        err
      );

      return res.status(500).json({
        message:
          err.message ||
          "Update failed",
      });
    }
  };

/* ======================================================
   DELETE CATEGORY
====================================================== */

exports.deleteCategory =
  async (req, res) => {
    try {

      const category =
        await Category.findById(
          req.params.id
        );

      if (!category) {
        return res.status(404).json({
          message:
            "Category not found",
        });
      }

      await category.deleteOne();

      return res.json({
        success: true,

        message:
          "Category deleted",
      });

    } catch (err) {

      console.error(
        "DELETE CATEGORY ERROR:",
        err
      );

      return res.status(500).json({
        message:
          "Delete failed",
      });
    }
  };