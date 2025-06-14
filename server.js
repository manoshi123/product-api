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

app.use(express.urlencoded({ extended: true }));
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
    colors = [],
    size = [],
    category = [],
    type,
    prices = [],
    start,
    limit,
  } = req.query;

  console.log(req.query);
  
  const filtered = products.filter((product) => {
    const matchColors = colors.length
      ? colors.some((color) => product.color.toLowerCase() === color.toLowerCase())
      : true;

    const matchSize = size.length
      ? size.some((sz) => product.variants.includes(sz.toUpperCase()))
      : true;

    const matchCategory = category.length
      ? category.some((cat) => product.category.toLowerCase() === cat.toLowerCase())
      : true;

    const matchType = type
      ? product.type.toLowerCase() === type.toLowerCase()
      : true;

    const variantPrices =
      product.variantPrices || product.variants.map((v) => parseFloat(v.price));
    const productMinPrice = Math.min(...variantPrices);

    // Prices array can contain ranges like "0-1000"
    const matchPrices = prices.length
      ? prices.some((range) => {
          const [min, max] = range.split("-").map(Number);
          return productMinPrice >= min && productMinPrice <= max;
        })
      : true;

    return (
      matchColors &&
      matchSize &&
      matchCategory &&
      matchType &&
      matchPrices
    );
  });

  // Pagination
  const startIndex = parseInt(start) || 0;
  const limitValue = parseInt(limit) || filtered.length;
  const paginated = filtered.slice(startIndex, startIndex + limitValue);

  res.json({
    total: filtered.length,
    start: startIndex,
    limit: limitValue,
    data: paginated,
    query: req.query,
  });
});



app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
