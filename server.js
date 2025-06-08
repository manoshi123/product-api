const express = require("express");
const fs = require("fs");
var cors = require('cors');
const app = express();
const PORT = 3000;

app.use(cors());
// Helper: Load products from JSON file
const loadProducts = () => {
  const data = fs.readFileSync("./products.json", "utf-8");
  return JSON.parse(data);
};

app.use(express.json());

/**
 * GET /products
 * Returns all products
 */
app.get("/products", (req, res) => {
  const products = loadProducts(); // load all products

  // Get 'start' and 'limit' from query params, with defaults
  const start = parseInt(req.query.start) || 0;
  const limit = parseInt(req.query.limit) || products.length;

  // Slice the products based on the range
  const paginated = products.slice(start, start + limit);

  res.json(paginated);
});

/**
 * GET /product/:id
 * Returns product by ID
 */
app.get("/product/:id", (req, res) => {
  const products = loadProducts();
  const productId = parseInt(req.params.id);
  const product = products.find((p) => p.id === productId);
  if (product) {
    res.json(product);
  } else {
    res.status(404).json({ error: "Product not found" });
  }
});

/**
 * GET /search?q=keyword
 * Searches products by name or description
 */
app.get("/search", (req, res) => {
  const products = loadProducts();
  const query = req.query.q?.toLowerCase();

  if (!query) {
    return res.status(400).json({ error: "Query parameter q is required" });
  }

  const results = products.filter(
    (p) =>
      p.title.toLowerCase().includes(query) ||
      p.description.toLowerCase().includes(query) ||
      p.category.toLowerCase().includes(query) ||
      p.type.toLowerCase().includes(query)
  );

  res.json(results);
});

app.get("/colors", (req, res) => {
  const products = loadProducts();
  const colors = [...new Set(products.map((p) => p.color))];
  res.json(colors);
});

app.get("/sizes", (req, res) => {
  const products = loadProducts();
  const allSizes = products.flatMap((p) => p.variants);
  const sizes = [...new Set(allSizes)];
  res.json(sizes);
});

app.get("/categories", (req, res) => {
  const products = loadProducts();
  const categories = [...new Set(products.map((p) => p.category))];
  res.json(categories);
});

app.get("/types", (req, res) => {
  const products = loadProducts();
  const types = [...new Set(products.map((p) => p.type))];
  res.json(types);
});


app.get("/products/filter", (req, res) => {
  const products = loadProducts();
  const {
    color,
    size,
    category,
    type,
    minPrice,
    maxPrice,
    start,
    limit
  } = req.query;

  const filtered = products.filter((product) => {
    const matchColor = color
      ? product.color.toLowerCase() === color.toLowerCase()
      : true;
    const matchSize = size
      ? product.variants.includes(size.toUpperCase())
      : true;
    const matchCategory = category
      ? product.category.toLowerCase() === category.toLowerCase()
      : true;
    const matchType = type
      ? product.type.toLowerCase() === type.toLowerCase()
      : true;

    // Extract variant prices safely
    const variantPrices =
      product.variantPrices || product.variants.map((v) => parseFloat(v.price));
    const productMinPrice = Math.min(...variantPrices);

    const matchMinPrice = minPrice
      ? productMinPrice >= parseFloat(minPrice)
      : true;
    const matchMaxPrice = maxPrice
      ? productMinPrice <= parseFloat(maxPrice)
      : true;

    return (
      matchColor &&
      matchSize &&
      matchCategory &&
      matchType &&
      matchMinPrice &&
      matchMaxPrice
    );
  });

  // Add pagination
  const startIndex = parseInt(start) || 0;
  const limitValue = parseInt(limit) || filtered.length;
  const paginated = filtered.slice(startIndex, startIndex + limitValue);

  res.json({
    total: filtered.length,
    start: startIndex,
    limit: limitValue,
    data: paginated
  });
});


app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
