function init() {
  // Add any initialization logic here, e.g., event listeners
  console.log("Website initialized");
}

function goToSection(sectionId) {
  window.location.hash = sectionId;
}

function addToWishlist(suiteName) {
  alert(`Added ${suiteName} to your wishlist!`);
}
