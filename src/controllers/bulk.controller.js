const csv = require("csv-parser");
const streamifier = require("streamifier");
const Product = require("../models/Product");

exports.bulkUpload = async (req, res) => {
  try {
    const results = [];

    streamifier
      .createReadStream(req.file.buffer)
      .pipe(csv())
      .on("data", (data) => results.push(data))
      .on("end", async () => {

        const products = results.map((row) => ({
          name: row.name,
          description: row.description,
          category: row.category,
          subCategory: row.subCategory,
          images: row.images ? row.images.split(",") : [],
          variants: [
            {
              attributes: {
                Size: row.size,
                Color: row.color,
              },
              price: Number(row.price),
              stock: Number(row.stock),
              sku: row.sku,
            },
          ],
        }));

        await Product.insertMany(products);

        res.json({
          message: "Bulk upload success",
          count: products.length,
        });
      });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Bulk upload failed" });
  }
};