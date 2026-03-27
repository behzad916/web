const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

const products = [
  // Note: "availability" + "fallbackBakery" power the UI "Check availability" feature.
  {
    id: 1,
    name: "Chocolate Truffle Cake",
    price: 650,
    category: "Cakes",
    image:
      "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=900&q=80",
    availability: { available: true },
    fallbackBakery: null
  },
  {
    id: 2,
    name: "Fresh Cream Pineapple Cake",
    price: 550,
    category: "Cakes",
    image:
      "https://images.unsplash.com/photo-1614707267537-b85aaf00c4b7?auto=format&fit=crop&w=900&q=80",
    availability: { available: true },
    fallbackBakery: null
  },
  {
    id: 3,
    name: "Red Velvet Cake",
    price: 700,
    category: "Cakes",
    image:
      "https://images.unsplash.com/photo-1541783250267-bc9a2e8a9f0a?auto=format&fit=crop&w=900&q=80",
    availability: { available: false, restockEta: "2026-04-03" },
    fallbackBakery: { name: "Baker Street Cakes", phone: "+91 90000 11223" }
  },
  {
    id: 4,
    name: "Carrot Walnut Cake",
    price: 620,
    category: "Cakes",
    image:
      "https://images.unsplash.com/photo-1542826438-bb0a6f2f0d44?auto=format&fit=crop&w=900&q=80",
    availability: { available: false, restockEta: "2026-04-10" },
    fallbackBakery: { name: "Baker Street Cakes", phone: "+91 90000 11223" }
  },

  // Pastries
  {
    id: 5,
    name: "Butter Croissant",
    price: 80,
    category: "Pastries",
    image:
      "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=900&q=80",
    availability: { available: true },
    fallbackBakery: null
  },
  {
    id: 6,
    name: "Almond Croissant",
    price: 95,
    category: "Pastries",
    image:
      "https://images.unsplash.com/photo-1549576490-b0a4c7f2b7b6?auto=format&fit=crop&w=900&q=80",
    availability: { available: false, restockEta: "2026-04-07" },
    fallbackBakery: { name: "Sunrise Pastry Hub", phone: "+91 90000 22334" }
  },
  {
    id: 7,
    name: "Cheese Danish",
    price: 120,
    category: "Pastries",
    image:
      "https://images.unsplash.com/photo-1604335399206-7e5a0d2e1e08?auto=format&fit=crop&w=900&q=80",
    availability: { available: true },
    fallbackBakery: null
  },
  {
    id: 8,
    name: "Strawberry Danish",
    price: 125,
    category: "Pastries",
    image:
      "https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?auto=format&fit=crop&w=900&q=80",
    availability: { available: true },
    fallbackBakery: null
  },

  // Donuts / Snacks
  {
    id: 9,
    name: "Chocolate Donut",
    price: 60,
    category: "Snacks",
    image:
      "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=900&q=80",
    availability: { available: true },
    fallbackBakery: null
  },
  {
    id: 10,
    name: "Vanilla Donut Box",
    price: 90,
    category: "Snacks",
    image:
      "https://images.unsplash.com/photo-1505253211267-1e1f6b3f1f9c?auto=format&fit=crop&w=900&q=80",
    availability: { available: false, restockEta: "2026-04-04" },
    fallbackBakery: { name: "Crisp Bakes & Bites", phone: "+91 90000 55667" }
  },
  {
    id: 11,
    name: "Brownie (Fudge)",
    price: 210,
    category: "Snacks",
    image:
      "https://images.unsplash.com/photo-1519869325930-28139f9d0a3f?auto=format&fit=crop&w=900&q=80",
    availability: { available: true },
    fallbackBakery: null
  },

  // Breads
  {
    id: 12,
    name: "Multigrain Bread",
    price: 70,
    category: "Breads",
    image:
      "https://images.unsplash.com/photo-1608198093002-ad4e005484ec?auto=format&fit=crop&w=900&q=80",
    availability: { available: true },
    fallbackBakery: null
  },
  {
    id: 13,
    name: "Sourdough Loaf",
    price: 160,
    category: "Breads",
    image:
      "https://images.unsplash.com/photo-1549931319-a545dcf17b19?auto=format&fit=crop&w=900&q=80",
    availability: { available: false, restockEta: "2026-04-08" },
    fallbackBakery: { name: "Village Oven Breads", phone: "+91 90000 33445" }
  },
  {
    id: 14,
    name: "Garlic Bread",
    price: 85,
    category: "Breads",
    image:
      "https://images.unsplash.com/photo-1600628422019-56f0a0a0f2b3?auto=format&fit=crop&w=900&q=80",
    availability: { available: true },
    fallbackBakery: null
  },

  // Cookies
  {
    id: 15,
    name: "Assorted Cookies Box",
    price: 250,
    category: "Cookies",
    image:
      "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=900&q=80",
    availability: { available: true },
    fallbackBakery: null
  },
  {
    id: 16,
    name: "Dark Chocolate Cookies",
    price: 170,
    category: "Cookies",
    image:
      "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=900&q=80",
    availability: { available: false, restockEta: "2026-04-06" },
    fallbackBakery: { name: "Sweet Stop Cookies", phone: "+91 90000 44556" }
  },
  {
    id: 17,
    name: "Peanut Butter Cookies",
    price: 180,
    category: "Cookies",
    image:
      "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=900&q=80",
    availability: { available: true },
    fallbackBakery: null
  },

  // Cupcakes
  {
    id: 18,
    name: "Cupcake (Strawberry)",
    price: 140,
    category: "Cupcakes",
    image:
      "https://images.unsplash.com/photo-1542204165-65bf26472b9b?auto=format&fit=crop&w=900&q=80",
    availability: { available: true },
    fallbackBakery: null
  },
  {
    id: 19,
    name: "Cupcake (Chocolate)",
    price: 140,
    category: "Cupcakes",
    image:
      "https://images.unsplash.com/photo-1499636136210-a5a7f4d4d4d4?auto=format&fit=crop&w=900&q=80",
    availability: { available: false, restockEta: "2026-04-12" },
    fallbackBakery: { name: "Baker Street Cakes", phone: "+91 90000 11223" }
  },

  // Rolls
  {
    id: 20,
    name: "Cinnamon Rolls",
    price: 190,
    category: "Snacks",
    image:
      "https://images.unsplash.com/photo-1608889175114-6c98a8a0a5b7?auto=format&fit=crop&w=900&q=80",
    availability: { available: false, restockEta: "2026-04-09" },
    fallbackBakery: { name: "Crisp Bakes & Bites", phone: "+91 90000 55667" }
  }
];

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Kataria Bakery backend is running." });
});

app.get("/api/products", (req, res) => {
  res.json(products);
});

app.get("/api/products/:id", (req, res) => {
  const id = Number(req.params.id);
  const product = products.find((p) => p.id === id);
  if (!product) {
    return res.status(404).json({
      success: false,
      message: "Product not found."
    });
  }
  return res.json(product);
});

app.post("/api/contact", (req, res) => {
  const { name, phone, message, destination, productName } = req.body || {};

  if (!name || !phone || !message) {
    return res.status(400).json({
      success: false,
      message: "Name, phone, and message are required."
    });
  }

  const toBakery = destination && String(destination).trim()
    ? String(destination).trim()
    : "Kataria Bakery";

  const productPart = productName ? ` for "${productName}"` : "";

  return res.json({
    success: true,
    message: `Thanks ${name}! Your request has been received by ${toBakery}${productPart}.`
  });
});

app.listen(PORT, () => {
  console.log(`Kataria Bakery server running at http://localhost:${PORT}`);
});
