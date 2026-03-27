const productsGrid = document.getElementById("productsGrid");
const productSearch = document.getElementById("productSearch");
const availableOnly = document.getElementById("availableOnly");
const categorySelect = document.getElementById("categorySelect");
const availableCount = document.getElementById("availableCount");
const outOfStockCount = document.getElementById("outOfStockCount");

const modal = document.getElementById("productModal");
const modalCloseBtn = modal.querySelector(".modal-close");
const modalImage = document.getElementById("modalImage");
const modalTitle = document.getElementById("modalTitle");
const modalCategory = document.getElementById("modalCategory");
const modalPrice = document.getElementById("modalPrice");
const modalStatus = document.getElementById("modalStatus");
const modalRestock = document.getElementById("modalRestock");
const modalFallback = document.getElementById("modalFallback");
const fallbackName = document.getElementById("fallbackName");
const fallbackPhone = document.getElementById("fallbackPhone");
const fallbackCallLink = document.getElementById("fallbackCallLink");
const contactFallbackBtn = document.getElementById("contactFallbackBtn");
const contactKatariaBtn = document.getElementById("contactKatariaBtn");

const contactForm = document.getElementById("contactForm");
const formResult = document.getElementById("formResult");
const year = document.getElementById("year");
const messageInput = document.getElementById("messageInput");
const destinationInput = document.getElementById("destinationInput");
const productNameInput = document.getElementById("productNameInput");
const contactContext = document.getElementById("contactContext");

const progressBar = document.getElementById("progressBar");

year.textContent = new Date().getFullYear();

let allProducts = [];
let selectedProduct = null;

const revealObserver = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    }
  },
  { threshold: 0.12 }
);

function observeReveals() {
  document.querySelectorAll(".reveal[data-reveal]").forEach((el) => {
    if (!el.classList.contains("is-visible")) {
      revealObserver.observe(el);
    }
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatMoney(value) {
  return `Rs ${value}`;
}

function formatDate(isoDate) {
  try {
    return new Date(isoDate).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit"
    });
  } catch (e) {
    return isoDate;
  }
}

function getFilteredProducts() {
  const q = (productSearch.value || "").trim().toLowerCase();
  const onlyAvailable = availableOnly.checked;
  const category = categorySelect.value || "All";

  return allProducts.filter((p) => {
    const matchesText =
      !q ||
      p.name.toLowerCase().includes(q) ||
      String(p.category).toLowerCase().includes(q);

    const matchesAvailability = !onlyAvailable || p.availability?.available;

    const matchesCategory = category === "All" || p.category === category;

    return matchesText && matchesAvailability && matchesCategory;
  });
}

function updateMenuStats() {
  const available = allProducts.filter((p) => p.availability?.available).length;
  availableCount.textContent = available;
  outOfStockCount.textContent = allProducts.length - available;
}

function renderProducts(products) {
  productsGrid.innerHTML = products
    .map((p) => {
      const isAvailable = Boolean(p.availability?.available);
      const badge = isAvailable
        ? '<span class="badge badge-ok">Available</span>'
        : '<span class="badge badge-bad">Out of stock</span>';

      const eta =
        !isAvailable && p.availability?.restockEta
          ? `ETA: ${formatDate(p.availability.restockEta)}`
          : "";

      return `
        <article class="product-card reveal" data-reveal>
          <img src="${p.image}" alt="${escapeHtml(p.name)}" loading="lazy" />
          <div class="product-info">
            <h4 class="product-title">${escapeHtml(p.name)}</h4>
            <div class="product-meta">
              ${badge}
              <span class="price">${formatMoney(p.price)}</span>
            </div>
            <div class="product-actions">
              <button class="btn btn-primary" type="button" data-open-modal="${p.id}">
                Check & Contact
              </button>
            </div>
            ${
              eta
                ? `<p class="muted" style="margin:10px 0 0; font-weight:800;">${escapeHtml(
                    eta
                  )}</p>`
                : ""
            }
          </div>
        </article>
      `;
    })
    .join("");

  observeReveals();
}

function openModal(product) {
  selectedProduct = product;

  modalImage.src = product.image;
  modalImage.alt = product.name;
  modalTitle.textContent = product.name;
  modalCategory.textContent = product.category;
  modalPrice.textContent = formatMoney(product.price);

  const isAvailable = Boolean(product.availability?.available);

  if (isAvailable) {
    modalStatus.textContent = "Available now";
    modalStatus.style.color = "var(--ok)";
    modalRestock.textContent = "You can place an order right away.";
    modalFallback.style.display = "none";

    contactFallbackBtn.onclick = null;
    contactKatariaBtn.onclick = () => {
      prepareContact("Kataria Bakery", product);
    };
  } else {
    const eta = product.availability?.restockEta
      ? formatDate(product.availability.restockEta)
      : "soon";

    modalStatus.textContent = "Out of stock right now";
    modalStatus.style.color = "var(--bad)";
    modalRestock.textContent = `Expected restock: ${eta}`;

    const fb = product.fallbackBakery || {
      name: "Partner Bakery",
      phone: "N/A"
    };

    modalFallback.style.display = "block";
    fallbackName.textContent = fb.name;
    fallbackPhone.textContent = fb.phone;
    fallbackCallLink.href = `tel:${fb.phone}`;

    contactKatariaBtn.onclick = () => {
      prepareContact("Kataria Bakery", product);
    };
    contactFallbackBtn.onclick = () => {
      prepareContact(fb.name, product, fb.phone);
    };
  }

  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeModal() {
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

function prepareContact(destination, product, partnerPhone) {
  destinationInput.value = destination;
  productNameInput.value = product.name;

  const isAvailable = Boolean(product.availability?.available);
  const restockText = !isAvailable && product.availability?.restockEta
    ? `Restock ETA: ${formatDate(product.availability.restockEta)}.`
    : "";

  const partnerText =
    !isAvailable && partnerPhone
      ? `If you need it sooner, partner phone: ${partnerPhone}.`
      : "";

  const message =
    isAvailable
      ? `Hello ${destination}! I want to order "${product.name}". Price: ${formatMoney(
          product.price
        )}. Please confirm availability and pickup/delivery details.`
      : `Hello ${destination}! I checked "${product.name}" and Kataria currently shows it as out of stock. ${restockText} ${partnerText} Please guide me with the next available option.`;

  messageInput.value = message;

  contactContext.innerHTML = `
    <p class="muted">
      Prefilled for: <strong>${escapeHtml(product.name)}</strong> -> <strong>${escapeHtml(
        destination
      )}</strong>
    </p>
  `;

  closeModal();

  document.getElementById("contact").scrollIntoView({ behavior: "smooth" });
  setTimeout(() => messageInput.focus(), 350);
}

// Modal events
modalCloseBtn.addEventListener("click", closeModal);
modal.addEventListener("click", (e) => {
  if (e.target === modal) closeModal();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && modal.classList.contains("is-open")) {
    closeModal();
  }
});

// Product card click (event delegation)
productsGrid.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-open-modal]");
  if (!btn) return;
  const id = Number(btn.dataset.openModal);
  const product = allProducts.find((p) => p.id === id);
  if (product) openModal(product);
});

// Toolbar events
productSearch.addEventListener("input", () => {
  renderProducts(getFilteredProducts());
});

availableOnly.addEventListener("change", () => {
  renderProducts(getFilteredProducts());
});

categorySelect.addEventListener("change", () => {
  renderProducts(getFilteredProducts());
});

// Accordion events
document.querySelectorAll(".accordion-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const item = btn.closest(".accordion-item");
    item.classList.toggle("is-open");
  });
});

// Scroll reveal + progress bar
observeReveals();
window.addEventListener("scroll", () => {
  const scrollTop = window.scrollY || 0;
  const height = document.body.scrollHeight - window.innerHeight;
  const progress = height > 0 ? scrollTop / height : 0;
  progressBar.style.setProperty("--progress", Math.min(1, Math.max(0, progress)));
});

// Contact form submit
contactForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const formData = new FormData(contactForm);
  const payload = Object.fromEntries(formData.entries());

  try {
    const response = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    formResult.textContent = data.message;
    formResult.style.color = data.success ? "green" : "crimson";

    if (data.success) {
      contactForm.reset();
      // Keep context values consistent after reset
      destinationInput.value = "Kataria Bakery";
      productNameInput.value = "";
      contactContext.innerHTML =
        '<p class="muted">Tip: Use "Contact" from a product card to prefill your message.</p>';
      messageInput.value = "";
    }
  } catch (error) {
    formResult.textContent = "Something went wrong. Please try again.";
    formResult.style.color = "crimson";
  }
});

// Load products
async function loadProducts() {
  try {
    const response = await fetch("/api/products");
    const products = await response.json();

    allProducts = Array.isArray(products) ? products : [];

    updateMenuStats();

    const categories = Array.from(
      new Set(allProducts.map((p) => p.category))
    ).sort();

    // Rebuild category options (keep first "All")
    categorySelect.innerHTML = '<option value="All">All categories</option>';
    categories.forEach((c) => {
      const option = document.createElement("option");
      option.value = c;
      option.textContent = c;
      categorySelect.appendChild(option);
    });

    renderProducts(getFilteredProducts());
  } catch (error) {
    productsGrid.innerHTML =
      "<p>Could not load products right now. Please refresh.</p>";
  }
}

loadProducts();
