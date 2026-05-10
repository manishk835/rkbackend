// src/controllers/bulk.controller.js

const csv = require("csv-parser");

const streamifier = require(
  "streamifier"
);

const Product = require(
  "../models/Product"
);

/* ======================================================
   BULK PRODUCT UPLOAD
====================================================== */

exports.bulkUpload =
  async (req, res) => {
    try {

      /* ================= FILE CHECK ================= */

      if (!req.file) {
        return res.status(400).json({
          message:
            "CSV file required",
        });
      }

      const results = [];

      /* ================= PARSE CSV ================= */

      streamifier
        .createReadStream(
          req.file.buffer
        )

        .pipe(csv())

        .on(
          "data",
          (data) => {
            results.push(data);
          }
        )

        .on(
          "end",
          async () => {

            try {

              if (
                results.length === 0
              ) {
                return res.status(400).json({
                  message:
                    "CSV is empty",
                });
              }

              /* ================= PRODUCTS ================= */

              const products =
                [];

              const failed =
                [];

              for (
                const row of results
              ) {

                try {

                  /* ================= REQUIRED ================= */

                  if (
                    !row.name &&
                    !row.title
                  ) {
                    failed.push({
                      row,
                      reason:
                        "Missing name/title",
                    });

                    continue;
                  }

                  if (
                    !row.category
                  ) {
                    failed.push({
                      row,
                      reason:
                        "Missing category",
                    });

                    continue;
                  }

                  /* ================= PRICE ================= */

                  const price =
                    Number(
                      row.price
                    ) || 0;

                  const stock =
                    Number(
                      row.stock
                    ) || 0;

                  /* ================= IMAGES ================= */

                  const imageArray =
                    row.images
                      ? row.images
                          .split(",")
                          .map(
                            (
                              img
                            ) => ({
                              url:
                                img.trim(),
                            })
                          )
                      : [];

                  /* ================= VARIANT ================= */

                  const variantName =
                    [
                      row.size,
                      row.color,
                    ]
                      .filter(
                        Boolean
                      )
                      .join(
                        " / "
                      ) ||
                    "Default";

                  const sku =
                    row.sku ||
                    `${Date.now()}-${Math.floor(
                      Math.random() *
                        10000
                    )}`;

                  /* ================= PRODUCT ================= */

                  const product =
                    {
                      seller:
                        req.user
                          ?._id,

                      title:
                        row.title ||
                        row.name,

                      name:
                        row.name ||
                        row.title,

                      slug:
                        (
                          row.title ||
                          row.name
                        )
                          .toLowerCase()
                          .replace(
                            /\s+/g,
                            "-"
                          )
                          .replace(
                            /[^a-z0-9-]/g,
                            ""
                          ) +
                        "-" +
                        Math.floor(
                          Math.random() *
                            10000
                        ),

                      description:
                        row.description ||
                        "",

                      shortDescription:
                        row.shortDescription ||
                        "",

                      category:
                        row.category
                          .toLowerCase()
                          .trim(),

                      subCategory:
                        row.subCategory ||
                        "",

                      price,

                      thumbnail:
                        imageArray[0]
                          ?.url ||
                        "",

                      images:
                        imageArray,

                      variants: [
                        {
                          name:
                            variantName,

                          attributes:
                            {
                              Size:
                                row.size ||
                                "",

                              Color:
                                row.color ||
                                "",
                            },

                          stock,

                          sku,

                          priceOverride:
                            price,
                        },
                      ],

                      totalStock:
                        stock,

                      inStock:
                        stock > 0,

                      isActive:
                        true,

                      isApproved:
                        false,

                      status:
                        "pending",
                    };

                  products.push(
                    product
                  );

                } catch (
                  rowError
                ) {

                  failed.push({
                    row,
                    reason:
                      rowError.message,
                  });
                }
              }

              /* ================= INSERT ================= */

              if (
                products.length > 0
              ) {

                await Product.insertMany(
                  products
                );
              }

              /* ================= RESPONSE ================= */

              return res.json({
                success: true,

                message:
                  "Bulk upload completed",

                inserted:
                  products.length,

                failed:
                  failed.length,

                errors:
                  failed,
              });

            } catch (
              insertError
            ) {

              console.error(
                "Bulk Insert Error:",
                insertError
              );

              return res.status(500).json({
                message:
                  "Bulk insert failed",
              });
            }
          }
        );

    } catch (err) {

      console.error(
        "Bulk Upload Error:",
        err
      );

      return res.status(500).json({
        message:
          "Bulk upload failed",
      });
    }
  };