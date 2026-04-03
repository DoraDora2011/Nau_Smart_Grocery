const state = {
  currentPage: "home",
  currentRecipe: null,
  recipeSource: "search",
  currentSuggestion: null,
  ingredientSuggestions: [],
  currentScanSuggestion: null,
  scanSuggestions: [],
  scanIngredients: [],
  scanExtras: [],
  scanImageSrc: "",
  scanImageMimeType: "image/jpeg",
  scanSourceName: "",
  scanAnalysisSource: "",
  scanStream: null,
  cart: [],
  history: ["home"],
  homeQuantities: {},
  cartReturnPage: "dish-search",
  paymentReturnPage: "cart",
};

const pageTitles = {
  home: "home",
  chooser: "chooser",
  "dish-search": "dish-search",
  "ingredients-search": "ingredients-search",
  "ingredient-suggestions": "ingredient-suggestions",
  "ingredient-detail": "ingredient-detail",
  cart: "cart",
  payment: "payment",
  recipe: "recipe",
  scan: "scan",
  "scan-suggestions": "scan-suggestions",
  "scan-detail": "scan-detail",
  "scan-cook": "scan-cook",
  "scan-cart": "scan-cart",
  notifications: "notifications",
  profile: "profile",
};

const pages = [...document.querySelectorAll(".page")];
const navItems = [...document.querySelectorAll(".nav-item")];
const headerPrimaryButton = document.getElementById("headerPrimaryButton");
const headerPrimaryBack = document.getElementById("headerPrimaryBack");
const headerPrimaryMenu = document.getElementById("headerPrimaryMenu");
const headerCartButton = document.getElementById("headerCartButton");
const homeSearchPrompt = document.getElementById("homeSearchPrompt");

const servingSlider = document.getElementById("servingSlider");
const servingValue = document.getElementById("servingValue");
const dishNameInput = document.getElementById("dishNameInput");
const dishAllergiesInput = document.getElementById("dishAllergiesInput");

const ingredientsInput = document.getElementById("ingredientsInput");
const ingredientSuggestionList = document.getElementById("ingredientSuggestionList");
const ingredientDetailImage = document.getElementById("ingredientDetailImage");
const ingredientDetailTitle = document.getElementById("ingredientDetailTitle");
const ingredientDetailDescription = document.getElementById("ingredientDetailDescription");

const allergyAlertBox = document.getElementById("allergyAlertBox");
const cartList = document.getElementById("cartList");

const recipeTitle = document.getElementById("recipeTitle");
const recipeMeta = document.getElementById("recipeMeta");
const recipeIngredients = document.getElementById("recipeIngredients");
const recipeSteps = document.getElementById("recipeSteps");
const recipeLinks = document.getElementById("recipeLinks");

const scanVideo = document.getElementById("scanVideo");
const scanPreviewImage = document.getElementById("scanPreviewImage");
const scanPreviewShell = document.querySelector(".scan-preview-shell");
const scanTargetFrame = document.querySelector(".scan-target-frame");
const scanStatusText = document.getElementById("scanStatusText");
const scanImportButton = document.getElementById("scanImportButton");
const scanCaptureButton = document.getElementById("scanCaptureButton");
const scanResetButton = document.getElementById("scanResetButton");
const scanFileInput = document.getElementById("scanFileInput");
const scanSuggestionList = document.getElementById("scanSuggestionList");
const scanDetailImage = document.getElementById("scanDetailImage");
const scanDetailTitle = document.getElementById("scanDetailTitle");
const scanDetailDescription = document.getElementById("scanDetailDescription");
const scanCookTitle = document.getElementById("scanCookTitle");
const scanCookDescription = document.getElementById("scanCookDescription");
const scanCookSteps = document.getElementById("scanCookSteps");
const scanCookLinks = document.getElementById("scanCookLinks");
const scanExtrasList = document.getElementById("scanExtrasList");
const scanCartList = document.getElementById("scanCartList");

init();

function init() {
  seedHomeQuantities();
  bindEvents();
  updateServingValue();
  navigate("home", { replaceHistory: true });
}

function bindEvents() {
  homeSearchPrompt.addEventListener("click", () => navigate("chooser"));

  document.querySelectorAll("[data-home-filter]").forEach((button) => {
    button.addEventListener("click", () => applyHomeFilter(button.dataset.homeFilter));
  });

  document.querySelectorAll("[data-qty-action]").forEach((button) => {
    button.addEventListener("click", () => updateQuantity(button));
  });

  document.querySelectorAll("[data-open-search]").forEach((button) => {
    button.addEventListener("click", () => {
      const targetPage = button.dataset.openSearch === "ingredients"
        ? "ingredients-search"
        : "dish-search";
      navigate(targetPage);
    });
  });

  document.getElementById("dishSearchBackButton").addEventListener("click", () => navigate("home"));
  document.getElementById("dishSearchCartButton").addEventListener("click", () => generateDishPlanAndGo("cart"));
  document.getElementById("clearDishButton").addEventListener("click", () => {
    dishNameInput.value = "";
  });
  document.getElementById("voiceButton").addEventListener("click", handleVoicePlaceholder);
  servingSlider.addEventListener("input", updateServingValue);

  document.getElementById("ingredientSearchBackButton").addEventListener("click", () => navigate("home"));
  document.getElementById("ingredientSearchSubmitButton").addEventListener("click", generateIngredientSuggestionsAndGo);
  document.getElementById("clearIngredientsButton").addEventListener("click", () => {
    ingredientsInput.value = "";
  });
  document.getElementById("ingredientsMicButton").addEventListener("click", handleVoicePlaceholder);
  document.getElementById("ingredientSuggestionsBackButton").addEventListener("click", () => navigate("ingredients-search"));
  document.getElementById("ingredientSuggestionsShareButton").addEventListener("click", handleSharePlaceholder);
  document.getElementById("ingredientDetailBackButton").addEventListener("click", () => navigate("ingredient-suggestions"));
  document.getElementById("ingredientDetailShareButton").addEventListener("click", handleSharePlaceholder);
  document.getElementById("ingredientTryOthersButton").addEventListener("click", () => navigate("ingredient-suggestions"));
  document.getElementById("ingredientLetsCookButton").addEventListener("click", openSelectedSuggestionRecipe);

  scanImportButton.addEventListener("click", (event) => {
    event.preventDefault();
    openScanFilePicker();
  });
  scanImportButton.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openScanFilePicker();
    }
  });
  scanCaptureButton.addEventListener("click", handleScanCapture);
  scanResetButton.addEventListener("click", handleScanReset);
  scanFileInput.addEventListener("change", handleScanFileSelect);
  document.getElementById("scanSuggestionsBackButton").addEventListener("click", () => navigate("scan"));
  document.getElementById("scanSuggestionsShareButton").addEventListener("click", handleSharePlaceholder);
  document.getElementById("scanDetailBackButton").addEventListener("click", () => navigate("scan-suggestions"));
  document.getElementById("scanDetailShareButton").addEventListener("click", handleSharePlaceholder);
  document.getElementById("scanTryOthersButton").addEventListener("click", () => navigate("scan-suggestions"));
  document.getElementById("scanLetsCookButton").addEventListener("click", openScanCookPage);
  document.getElementById("scanCookBackButton").addEventListener("click", () => navigate("scan-detail"));
  document.getElementById("scanCookShareButton").addEventListener("click", handleSharePlaceholder);
  document.getElementById("scanCookHomeButton").addEventListener("click", () => navigate("home"));
  document.getElementById("scanBuyExtrasButton").addEventListener("click", handleOpenScanCart);
  document.getElementById("scanCartBackButton").addEventListener("click", () => navigate("scan-cook"));
  document.getElementById("scanCartShareButton").addEventListener("click", handleSharePlaceholder);
  document.getElementById("scanAddStripButton").addEventListener("click", () => navigate("scan-cook"));
  document.getElementById("scanCheckoutButton").addEventListener("click", handleScanCheckout);

  document.getElementById("cartBackButton").addEventListener("click", () => navigate(state.cartReturnPage || "dish-search"));
  document.getElementById("checkoutButton").addEventListener("click", handleCheckout);
  document.getElementById("removeFlaggedButton").addEventListener("click", removeFlaggedIngredients);
  document.getElementById("proceedAnywayButton").addEventListener("click", () => {
    allergyAlertBox.classList.add("hidden");
  });

  document.getElementById("paymentBackButton").addEventListener("click", () => navigate(state.paymentReturnPage || "cart"));
  document.getElementById("paymentHomeButton").addEventListener("click", () => navigate("home"));
  document.getElementById("paymentRecipeButton").addEventListener("click", () => {
    if (state.currentRecipe) {
      navigate("recipe");
    }
  });

  headerPrimaryButton.addEventListener("click", () => {
    if (state.currentPage === "home") {
      navigate("chooser");
      return;
    }

    navigate("home");
  });

  headerCartButton.addEventListener("click", () => {
    if (state.currentPage === "dish-search") {
      generateDishPlanAndGo("cart");
      return;
    }

    if (isScanFlowPage(state.currentPage)) {
      if (!state.scanExtras.length && state.currentScanSuggestion?.extras?.length) {
        state.scanExtras = cloneExtras(state.currentScanSuggestion.extras);
      }
      if (state.scanExtras.length) {
        navigate("scan-cart");
        return;
      }
    }

    if (state.cart.length) {
      navigate("cart");
    }
  });

  navItems.forEach((item) => {
    item.addEventListener("click", () => {
      const targetPage = item.dataset.route === "search"
        ? "chooser"
        : item.dataset.route;
      navigate(targetPage);
    });
  });
}

function openScanFilePicker() {
  if (!scanFileInput) return;

  try {
    scanFileInput.value = "";
    if (typeof scanFileInput.showPicker === "function") {
      scanFileInput.showPicker();
      return;
    }
  } catch (error) {
    // Ignore and fall back to the standard file picker click.
  }

  scanFileInput.click();
}

function getApiBaseUrl() {
  const override = String(window.NAU_API_BASE || "").trim().replace(/\/$/, "");
  if (override) {
    return override;
  }

  const host = String(window.location.hostname || "").toLowerCase();
  if (host === "127.0.0.1" || host === "localhost") {
    return "https://cook-with-nau.vercel.app";
  }

  return "";
}

function buildApiUrl(path) {
  return `${getApiBaseUrl()}${path}`;
}

function hydrateRecipeSuggestions(suggestions, options = {}) {
  const fallbackImage = options.fallbackImage || "";
  const preferredImage = options.preferredImage || "";

  return (Array.isArray(suggestions) ? suggestions : [])
    .map((suggestion, index) => {
      const title = titleCase(suggestion?.title || `Recipe ${index + 1}`);
      const ingredients = normalizeIngredientEntries(suggestion?.ingredients);
      const steps = normalizeInstructionSteps(suggestion?.steps);
      if (!title || !ingredients.length || !steps.length) {
        return null;
      }

      const rawSourceLinks = Array.isArray(suggestion?.sourceLinks) ? suggestion.sourceLinks : [];
      const sourceLinks = uniqueObjectsByKey(
        rawSourceLinks
          .map((link) => ({
            url: String(link?.url || "").trim(),
            title: String(link?.title || link?.url || "").trim(),
          }))
          .filter((link) => /^https?:\/\//i.test(link.url)),
        "url"
      ).slice(0, 6);

      const suggestedImage = String(suggestion?.image || suggestion?.heroImage || "").trim();
      const leadCategory = String(suggestion?.imageCategory || "").toLowerCase() || inferCategory(`${title} ${ingredients.map((ingredient) => ingredient.name).join(" ")}`);
      const visual = preferredImage
        || ((/^https?:\/\//i.test(suggestedImage) || suggestedImage.startsWith("./assets/")) ? suggestedImage : "")
        || fallbackImage
        || getImageForCategory(leadCategory);

      return {
        id: String(suggestion?.id || `recipe-${slugify(title)}-${index + 1}`),
        title,
        summary: String(suggestion?.summary || "").trim() || `${title} is a realistic recipe option for these ingredients.`,
        description: String(suggestion?.description || suggestion?.summary || "").trim() || `${title} is a realistic recipe option for these ingredients.`,
        serves: Number(suggestion?.serves) || 2,
        ingredients,
        steps,
        youtubeLinks: normalizeRecipeLinks(suggestion?.youtubeLinks, title),
        sourceLinks,
        extras: cloneExtras(Array.isArray(suggestion?.extras) ? suggestion.extras : []),
        image: visual,
        heroImage: visual,
      };
    })
    .filter(Boolean);
}

function navigate(page, options = {}) {
  const safePage = pageTitles[page] ? page : "home";
  const previousPage = state.currentPage;

  if (!options.replaceHistory) {
    const last = state.history[state.history.length - 1];
    if (last !== safePage) {
      state.history.push(safePage);
    }
  }

  if (safePage === "cart" && previousPage !== "cart") {
    state.cartReturnPage = previousPage;
  }

  if (previousPage === "scan" && safePage !== "scan") {
    stopScanCamera();
  }

  state.currentPage = safePage;

  pages.forEach((section) => {
    section.classList.toggle("active", section.dataset.page === safePage);
  });

  const activeRoute = getActiveNavRoute(safePage);
  navItems.forEach((item) => {
    item.classList.toggle("active", item.dataset.route === activeRoute);
  });

  headerPrimaryMenu.classList.remove("hidden");
  headerPrimaryBack.classList.add("hidden");

  if (safePage === "scan") {
    renderScanPreview();
    startScanCamera();
  }

  if (safePage === "ingredient-suggestions") renderIngredientSuggestions();
  if (safePage === "ingredient-detail") renderIngredientDetail();
  if (safePage === "scan-suggestions") renderScanSuggestions();
  if (safePage === "scan-detail") renderScanDetail();
  if (safePage === "scan-cook") renderScanCook();
  if (safePage === "scan-cart") renderScanCart();
  if (safePage === "cart") renderCart();
  if (safePage === "recipe") renderRecipe();
}

function getActiveNavRoute(page) {
  if (page === "home") return "home";
  if (["scan", "scan-suggestions", "scan-detail", "scan-cook", "scan-cart"].includes(page)) return "scan";
  if (page === "payment") return state.paymentReturnPage === "scan-cart" ? "scan" : "search";
  if (page === "cart") return "search";
  if (page === "recipe" && state.recipeSource === "scan") return "scan";
  if (["chooser", "dish-search", "ingredients-search", "ingredient-suggestions", "ingredient-detail", "recipe"].includes(page)) return "search";
  if (page === "notifications") return "notifications";
  if (page === "profile") return "profile";
  return "";
}

function isScanFlowPage(page) {
  return ["scan", "scan-suggestions", "scan-detail", "scan-cook", "scan-cart"].includes(page);
}

function seedHomeQuantities() {
  document.querySelectorAll("[data-qty-value]").forEach((valueNode) => {
    state.homeQuantities[valueNode.dataset.qtyValue] = Number(valueNode.textContent) || 1;
  });
}

function updateQuantity(button) {
  const key = button.dataset.qtyTarget;
  const output = document.querySelector(`[data-qty-value="${key}"]`);
  if (!output) return;

  const currentValue = state.homeQuantities[key] || 1;
  const nextValue = button.dataset.qtyAction === "increase"
    ? currentValue + 1
    : Math.max(0, currentValue - 1);

  state.homeQuantities[key] = nextValue;
  output.textContent = String(nextValue);
}

function applyHomeFilter(filterName) {
  document.querySelectorAll("[data-home-filter]").forEach((button) => {
    button.classList.toggle("active", button.dataset.homeFilter === filterName);
  });

  document.querySelectorAll('.page[data-page="home"] .product-tile[data-category]').forEach((tile) => {
    const shouldShow = filterName === "all" || tile.dataset.category === filterName;
    tile.classList.toggle("is-filtered-out", !shouldShow);
  });
}

function updateServingValue() {
  servingValue.textContent = servingSlider.value;
}


async function generateDishPlanAndGo(targetPage) {
  const dishName = dishNameInput.value.trim();
  const servings = Number(servingSlider.value) || 1;
  const allergies = normalizeList(dishAllergiesInput.value);

  if (!dishName) {
    alert("Please enter a dish name first.");
    return;
  }

  try {
    const recipe = await requestGeminiDishPlan({ dishName, servings, allergies });
    state.currentRecipe = recipe;
    state.recipeSource = "search";
    state.cart = buildCartFromRecipe(recipe, allergies);
    renderRecipe();
    renderCart();
    navigate(targetPage);
  } catch (error) {
    alert(error?.message || "Could not generate a real recipe right now.");
  }
}

async function requestGeminiDishPlan({ dishName, servings, allergies }) {
  const recipe = await requestGroundedDishRecipe({ dishName, servings, allergies });
  if (!recipe) {
    throw new Error("Gemini could not build a grounded recipe right now. Please try again in a moment.");
  }

  recipe.allergyWarnings = findAllergyWarnings(recipe.ingredients, allergies);
  return recipe;
}

async function generateIngredientSuggestionsAndGo() {
  const rawIngredients = ingredientsInput.value.trim();

  if (!rawIngredients) {
    alert("Please enter the ingredients you already have.");
    return;
  }

  try {
    const suggestions = await requestGeminiIngredientSuggestions(rawIngredients);
    state.ingredientSuggestions = suggestions;
    state.currentSuggestion = suggestions[0] || null;
    renderIngredientSuggestions();
    navigate("ingredient-suggestions");
  } catch (error) {
    alert(error?.message || "Could not analyze those ingredients right now.");
  }
}

async function requestGeminiIngredientSuggestions(rawIngredients) {
  const endpoint = buildApiUrl("/api/ingredient-suggestions");
  let response;

  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ingredientsText: rawIngredients,
      }),
    });
  } catch (error) {
    throw new Error("Could not reach the ingredient suggestion service. If you are testing on localhost, redeploy Vercel and try again.");
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error || (response.status === 404
      ? "Ingredient suggestion API route was not found on the server."
      : "Ingredient suggestion generation failed."));
  }

  const suggestions = hydrateRecipeSuggestions(payload?.suggestions, {
    fallbackImage: getImageForCategory("vegetable"),
  });
  if (!suggestions.length) {
    throw new Error("Gemini returned no usable ingredient-based recipes.");
  }

  return suggestions;
}

function renderIngredientSuggestions() {
  renderSuggestionCards({
    container: ingredientSuggestionList,
    suggestions: state.ingredientSuggestions,
    emptyMessage: "No suggestions yet. Enter your ingredients and let Gemini suggest real recipes.",
    onOpen: openIngredientSuggestion,
  });
}

function openIngredientSuggestion(index) {
  state.currentSuggestion = state.ingredientSuggestions[index] || null;
  renderIngredientDetail();
  navigate("ingredient-detail");
}

function renderIngredientDetail() {
  if (!state.currentSuggestion) {
    ingredientDetailTitle.textContent = "Suggested dish";
    ingredientDetailDescription.innerHTML = "<p>Select a suggestion to see more detail.</p>";
    ingredientDetailImage.src = "./assets/9.png";
    return;
  }

  ingredientDetailTitle.textContent = state.currentSuggestion.title;
  ingredientDetailImage.src = safeUrl(state.currentSuggestion.heroImage || state.currentSuggestion.image);
  ingredientDetailImage.alt = state.currentSuggestion.title;

  const ingredientMarkup = state.currentSuggestion.ingredients
    .slice(0, 5)
    .map((ingredient) => `<li>${escapeHtml(ingredient.quantity)} ${escapeHtml(ingredient.unit)} ${escapeHtml(ingredient.name)}</li>`)
    .join("");
  const sourceMarkup = (state.currentSuggestion.sourceLinks || [])
    .map((link) => `<a href="${safeUrl(link.url)}" target="_blank" rel="noreferrer">Source: ${escapeHtml(link.title || link.url)}</a>`)
    .join("");

  ingredientDetailDescription.innerHTML = `
    <p>${escapeHtml(state.currentSuggestion.description)}</p>
    <ul>${ingredientMarkup}</ul>
    ${sourceMarkup}
  `;
}

function openSelectedSuggestionRecipe() {
  if (!state.currentSuggestion) {
    return;
  }

  state.currentRecipe = convertSuggestionToRecipe(state.currentSuggestion);
  state.recipeSource = "search";
  state.cart = buildCartFromRecipe(state.currentRecipe, []);
  renderRecipe();
  navigate("recipe");
}

async function startScanCamera() {
  if (state.scanImageSrc || state.scanStream) {
    return;
  }

  if (!navigator.mediaDevices?.getUserMedia) {
    scanStatusText.textContent = "Camera is not available here. Import a photo from your device instead.";
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: "environment" },
        width: { ideal: 1440 },
        height: { ideal: 1920 },
      },
      audio: false,
    });

    state.scanStream = stream;
    scanVideo.srcObject = stream;
    scanVideo.classList.remove("hidden");
    scanPreviewImage.classList.add("hidden");
    scanStatusText.textContent = "Camera ready. Tap Scan to capture ingredients.";
  } catch (error) {
    scanStatusText.textContent = "Camera access failed. You can still import a photo from your device.";
  }
}

function stopScanCamera() {
  if (!state.scanStream) {
    return;
  }

  state.scanStream.getTracks().forEach((track) => track.stop());
  state.scanStream = null;
  scanVideo.srcObject = null;
}

function renderScanPreview() {
  if (state.scanImageSrc) {
    scanPreviewImage.src = state.scanImageSrc;
    scanPreviewImage.classList.remove("hidden");
    scanVideo.classList.add("hidden");
    if (state.scanIngredients.length) {
      const label = state.scanAnalysisSource === "gemini" ? "Gemini scan found" : "Scan found";
      scanStatusText.textContent = `${label}: ${state.scanIngredients.join(", ")}.`;
    } else {
      scanStatusText.textContent = "Image ready. Tap Scan to analyze this image.";
    }
    return;
  }

  scanPreviewImage.classList.add("hidden");
  scanVideo.classList.remove("hidden");
  scanStatusText.textContent = "Point the camera at ingredients or import a photo from your device.";
}

async function handleScanCapture() {
  if (state.scanImageSrc) {
    await analyzeCurrentScanImage();
    return;
  }

  if (!state.scanStream) {
    await startScanCamera();
    if (!state.scanStream) {
      return;
    }
  }

  await ensureVideoReady(scanVideo);
  const focusedCapture = captureFocusedScanFromElement(
    scanVideo,
    scanVideo.videoWidth || 720,
    scanVideo.videoHeight || 1280,
    "image/jpeg"
  );

  if (!focusedCapture) {
    alert("Camera preview is still getting ready. Please try the scan again.");
    return;
  }

  state.scanImageSrc = focusedCapture.dataUrl;
  state.scanImageMimeType = focusedCapture.mimeType;
  state.scanSourceName = "camera-capture";
  state.scanIngredients = [];
  state.scanAnalysisSource = "";
  stopScanCamera();
  renderScanPreview();
  await analyzeCurrentScanImage();
}

function handleScanReset() {
  stopScanCamera();
  state.scanImageSrc = "";
  state.scanImageMimeType = "image/jpeg";
  state.scanSourceName = "";
  state.scanIngredients = [];
  state.scanAnalysisSource = "";
  state.scanSuggestions = [];
  state.currentScanSuggestion = null;
  state.scanExtras = [];
  scanFileInput.value = "";
  renderScanPreview();
  if (state.currentPage === "scan") {
    startScanCamera();
  }
}

function handleScanFileSelect(event) {
  const file = event.target.files?.[0];
  if (!file) {
    return;
  }

  const reader = new FileReader();
  reader.onload = async () => {
    stopScanCamera();
    state.scanImageSrc = String(reader.result || "");
    state.scanImageMimeType = file.type || getMimeTypeFromDataUrl(state.scanImageSrc);
    state.scanSourceName = file.name.toLowerCase();
    state.scanIngredients = [];
    state.scanAnalysisSource = "";
      renderScanPreview();
    await waitForImageReady(scanPreviewImage);

    const focusedImport = captureFocusedScanFromElement(
      scanPreviewImage,
      scanPreviewImage.naturalWidth || 720,
      scanPreviewImage.naturalHeight || 1280,
      state.scanImageMimeType
    );

    if (focusedImport) {
      state.scanImageSrc = focusedImport.dataUrl;
      state.scanImageMimeType = focusedImport.mimeType;
      renderScanPreview();
    }

    await analyzeCurrentScanImage();
  };
  reader.readAsDataURL(file);
}

async function analyzeCurrentScanImage() {
  if (!state.scanImageSrc) {
    alert("Capture or import an image first.");
    return;
  }

  scanStatusText.textContent = "Scanning ingredients from your image...";

  try {
    const scanResult = await requestOcrIngredientsFromImage();
    state.scanIngredients = scanResult.ingredients;
    state.scanAnalysisSource = scanResult.source;
      state.scanSuggestions = scanResult.suggestions;
    state.currentScanSuggestion = state.scanSuggestions[0] || null;
    renderScanSuggestions();
    navigate("scan-suggestions");
  } catch (error) {
    state.scanIngredients = [];
    state.scanAnalysisSource = "";
      state.scanSuggestions = [];
    state.currentScanSuggestion = null;
    scanStatusText.textContent = error?.message || "Could not analyze this scan right now.";
    alert(error?.message || "Could not analyze this scan right now.");
  }
}

async function requestOcrIngredientsFromImage() {
  await wait(220);

  const geminiResult = await requestGeminiScanAnalysis();
  const suggestions = hydrateRecipeSuggestions(geminiResult?.suggestions, {
    fallbackImage: getImageForCategory("vegetable"),
    preferredImage: state.scanImageSrc || "",
  });
  if (!suggestions.length) {
    throw new Error("Gemini could not build usable recipe suggestions from this scan.");
  }

  const detectedIngredients = Array.isArray(geminiResult?.ingredients)
    ? geminiResult.ingredients.filter(Boolean)
    : [];
  const ingredients = detectedIngredients.length
    ? detectedIngredients
    : suggestions[0].ingredients.slice(0, 5).map((ingredient) => ingredient.name);

  return {
    ingredients,
    source: geminiResult.source || "gemini",
    suggestions,
  };
}
function renderScanSuggestions() {
  renderSuggestionCards({
    container: scanSuggestionList,
    suggestions: state.scanSuggestions,
    emptyMessage: "No scan suggestions yet. Capture or import an image first.",
    onOpen: openScanSuggestion,
  });
}

function openScanSuggestion(index) {
  state.currentScanSuggestion = state.scanSuggestions[index] || null;
  renderScanDetail();
  navigate("scan-detail");
}

function renderScanDetail() {
  if (!state.currentScanSuggestion) {
    scanDetailTitle.textContent = "Suggested dish";
    scanDetailDescription.innerHTML = "<p>Select a scanned suggestion to see more detail.</p>";
    scanDetailImage.src = state.scanImageSrc || "./assets/3.png";
    return;
  }

  scanDetailTitle.textContent = state.currentScanSuggestion.title;
  scanDetailImage.src = safeUrl(state.currentScanSuggestion.heroImage || state.currentScanSuggestion.image);
  scanDetailImage.alt = state.currentScanSuggestion.title;

  const ingredientMarkup = state.currentScanSuggestion.ingredients
    .slice(0, 5)
    .map((ingredient) => `<li>${escapeHtml(ingredient.quantity)} ${escapeHtml(ingredient.unit)} ${escapeHtml(ingredient.name)}</li>`)
    .join("");
  const sourceMarkup = (state.currentScanSuggestion.sourceLinks || [])
    .map((link) => `<a href="${safeUrl(link.url)}" target="_blank" rel="noreferrer">Source: ${escapeHtml(link.title || link.url)}</a>`)
    .join("");

  scanDetailDescription.innerHTML = `
    <p>${escapeHtml(state.currentScanSuggestion.description)}</p>
    <ul>${ingredientMarkup}</ul>
    ${sourceMarkup}
  `;
}

function openScanCookPage() {
  if (!state.currentScanSuggestion) {
    return;
  }

  state.currentRecipe = convertSuggestionToRecipe(state.currentScanSuggestion);
  state.recipeSource = "scan";
  state.scanExtras = cloneExtras(state.currentScanSuggestion.extras);
  renderRecipe();
  renderScanCook();
  navigate("scan-cook");
}

function renderScanCook() {
  if (!state.currentScanSuggestion) {
    scanCookTitle.textContent = "Suggested dish";
    scanCookDescription.innerHTML = "<p>Select a scan suggestion to start cooking.</p>";
    scanCookSteps.innerHTML = "";
    scanCookLinks.innerHTML = "";
    scanExtrasList.innerHTML = "";
    return;
  }

  scanCookTitle.textContent = state.currentScanSuggestion.title;
  const detectedLabel = state.scanAnalysisSource === "gemini" ? "Detected by Gemini vision" : "Detected from scan";
  scanCookDescription.innerHTML = `
    <p>${escapeHtml(state.currentScanSuggestion.description)}</p>
    <p>${escapeHtml(detectedLabel)}: ${escapeHtml(state.scanIngredients.join(", "))}.</p>
  `;
  scanCookSteps.innerHTML = state.currentScanSuggestion.steps
    .map((step) => `<li>${escapeHtml(step)}</li>`)
    .join("");

  const youtubeLinks = (state.currentScanSuggestion.youtubeLinks || [])
    .map((link) => `<a href="${safeUrl(link)}" target="_blank" rel="noreferrer">Open YouTube cooking guide</a>`);
  const sourceLinks = (state.currentScanSuggestion.sourceLinks || [])
    .map((link) => `<a href="${safeUrl(link.url)}" target="_blank" rel="noreferrer">Source: ${escapeHtml(link.title || link.url)}</a>`);
  scanCookLinks.innerHTML = [...youtubeLinks, ...sourceLinks].join("");

  renderScanExtrasGrid(scanExtrasList, state.scanExtras);
}

function handleOpenScanCart() {
  if (!state.scanExtras.length) {
    alert("No extra ingredients were suggested for this recipe.");
    return;
  }

  renderScanCart();
  navigate("scan-cart");
}

function renderScanCart() {
  scanCartList.innerHTML = "";

  if (!state.scanExtras.length) {
    scanCartList.innerHTML = '<div class="scan-empty-message">No extras selected yet. Use the recipe page to add extras for this dish.</div>';
    return;
  }

  state.scanExtras.forEach((extra) => {
    const card = document.createElement("article");
    card.className = "scan-confirm-card";
    card.innerHTML = `
      <img src="${safeUrl(extra.image)}" alt="${escapeHtml(extra.name)}">
      <div class="scan-confirm-card-body">
        <div class="scan-confirm-card-title">${escapeHtml(extra.name)}</div>
        <div class="scan-extra-controls">
          <button class="qty-button qty-minus" type="button" data-scan-extra-action="decrease" data-scan-extra-id="${escapeHtml(extra.id)}">-</button>
          <span class="qty-count">${escapeHtml(extra.quantity)}</span>
          <button class="qty-button qty-plus" type="button" data-scan-extra-action="increase" data-scan-extra-id="${escapeHtml(extra.id)}">+</button>
        </div>
      </div>
    `;
    scanCartList.appendChild(card);
  });

  scanCartList.querySelectorAll("[data-scan-extra-action]").forEach((button) => {
    button.addEventListener("click", () => updateScanExtraQuantity(button.dataset.scanExtraId, button.dataset.scanExtraAction));
  });
}
function renderScanExtrasGrid(container, extras) {
  container.innerHTML = "";

  if (!extras.length) {
    container.innerHTML = '<div class="scan-empty-message">No extras are needed for this recipe right now.</div>';
    return;
  }

  extras.forEach((extra) => {
    const card = document.createElement("article");
    card.className = "scan-extra-card";
    card.innerHTML = `
      <img src="${safeUrl(extra.image)}" alt="${escapeHtml(extra.name)}">
      <span class="scan-extra-label">${escapeHtml(extra.name)}</span>
      <div class="scan-extra-controls">
        <button class="qty-button qty-minus" type="button" data-scan-extra-action="decrease" data-scan-extra-id="${escapeHtml(extra.id)}">-</button>
        <span class="qty-count">${escapeHtml(extra.quantity)}</span>
        <button class="qty-button qty-plus" type="button" data-scan-extra-action="increase" data-scan-extra-id="${escapeHtml(extra.id)}">+</button>
      </div>
    `;
    container.appendChild(card);
  });

  container.querySelectorAll("[data-scan-extra-action]").forEach((button) => {
    button.addEventListener("click", () => updateScanExtraQuantity(button.dataset.scanExtraId, button.dataset.scanExtraAction));
  });
}
function updateScanExtraQuantity(extraId, action) {
  const target = state.scanExtras.find((extra) => extra.id === extraId);
  if (!target) {
    return;
  }

  target.quantity = action === "increase"
    ? target.quantity + 1
    : Math.max(0, target.quantity - 1);

  if (state.currentPage === "scan-cook") {
    renderScanCook();
  }
  if (state.currentPage === "scan-cart") {
    renderScanCart();
  }
}

function handleScanCheckout() {
  if (!state.scanExtras.some((extra) => extra.quantity > 0)) {
    alert("Choose at least one extra ingredient before checkout.");
    return;
  }

  state.paymentReturnPage = "scan-cart";
  navigate("payment");
}

function renderSuggestionCards({ container, suggestions, emptyMessage, onOpen }) {
  container.innerHTML = "";

  if (!suggestions.length) {
    container.innerHTML = `<div class="ingredient-suggestion-empty">${escapeHtml(emptyMessage)}</div>`;
    return;
  }

  suggestions.forEach((suggestion, index) => {
    const button = document.createElement("button");
    button.className = "ingredient-suggestion-card";
    button.type = "button";
    button.innerHTML = `
      <img src="${safeUrl(suggestion.image)}" alt="${escapeHtml(suggestion.title)}">
      <div class="ingredient-suggestion-copy">
        <h3>${escapeHtml(suggestion.title)}</h3>
        <p>${escapeHtml(suggestion.summary)}</p>
      </div>
    `;
    button.addEventListener("click", () => onOpen(index));
    container.appendChild(button);
  });
}
async function requestGroundedDishRecipe({ dishName, servings, allergies }) {
  const endpoint = buildApiUrl("/api/dish-plan");
  let response;

  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        dishName,
        servings,
        allergies,
      }),
    });
  } catch (error) {
    throw new Error("Could not reach the recipe service. If you are testing on localhost, redeploy Vercel and try again.");
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error || (response.status === 404
      ? "Recipe API route was not found on the server."
      : "Server recipe generation failed."));
  }

  return payload;
}

function normalizeIngredientEntries(values) {
  if (!Array.isArray(values)) {
    return [];
  }

  return values
    .map((entry) => {
      const name = String(entry?.name || entry?.ingredient || "").trim();
      if (!name) {
        return null;
      }

      const category = ["vegetable", "meat", "fish", "dairy", "pantry", "egg"].includes(String(entry?.category || "").toLowerCase())
        ? String(entry.category).toLowerCase()
        : inferCategory(name);

      return {
        name,
        quantity: parseQuantityValue(entry?.quantity),
        unit: String(entry?.unit || "item").trim() || "item",
        category,
      };
    })
    .filter(Boolean)
    .slice(0, 20);
}

function normalizeInstructionSteps(values) {
  const list = Array.isArray(values)
    ? values
    : String(values || "").split(/\n+/);

  return list
    .map((step) => String(step).trim().replace(/^\d+[.)-]?\s*/, ""))
    .filter(Boolean)
    .slice(0, 12);
}

function normalizeRecipeLinks(values, title) {
  const links = (Array.isArray(values) ? values : [values])
    .map((value) => String(value || "").trim())
    .filter((value) => /^https?:\/\//i.test(value));

  const uniqueLinks = [...new Set(links)];
  if (uniqueLinks.length) {
    return uniqueLinks.slice(0, 3);
  }

  return [`https://www.youtube.com/results?search_query=${encodeURIComponent(`${title} recipe`)}`];
}

function extractGroundingLinks(metadata) {
  const chunks = metadata?.groundingChunks || [];
  const links = [];

  chunks.forEach((chunk) => {
    const uri = chunk?.web?.uri;
    if (!/^https?:\/\//i.test(String(uri || ""))) {
      return;
    }

    links.push({
      url: uri,
      title: String(chunk?.web?.title || uri).trim(),
    });
  });

  return uniqueObjectsByKey(links, "url").slice(0, 6);
}

function parseQuantityValue(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  const text = String(value || "").trim();
  if (!text) {
    return 1;
  }

  const mixedFraction = text.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixedFraction) {
    return Number(mixedFraction[1]) + Number(mixedFraction[2]) / Number(mixedFraction[3]);
  }

  const fraction = text.match(/^(\d+)\/(\d+)$/);
  if (fraction) {
    return Number(fraction[1]) / Number(fraction[2]);
  }

  const numeric = Number(text.replace(/,/g, "."));
  return Number.isFinite(numeric) && numeric > 0 ? numeric : 1;
}
function convertSuggestionToRecipe(suggestion) {
  return {
    title: suggestion.title,
    serves: suggestion.serves || 2,
    ingredients: suggestion.ingredients || [],
    steps: suggestion.steps || [],
    youtubeLinks: suggestion.youtubeLinks || [],
    sourceLinks: suggestion.sourceLinks || [],
    allergyWarnings: [],
  };
}

function buildCartFromRecipe(recipe, allergies) {
  return recipe.ingredients.map((ingredient) => ({
    id: `${ingredient.name}-${ingredient.category}`,
    ...ingredient,
    flagged: allergies.some((allergy) => ingredient.name.toLowerCase().includes(allergy.toLowerCase())),
    image: ingredient.image || getImageForCategory(ingredient.category),
  }));
}

function renderCart() {
  cartList.innerHTML = "";

  if (!state.cart.length) {
    cartList.innerHTML = '<div class="cart-alert">Your dish ingredients will appear here after AI generates the recipe.</div>';
    allergyAlertBox.classList.add("hidden");
    return;
  }

  const warnings = state.cart.filter((item) => item.flagged).map((item) => item.name);
  allergyAlertBox.classList.toggle("hidden", warnings.length === 0);
  allergyAlertBox.textContent = warnings.length
    ? `Allergy warning: ${warnings.join(", ")}. Tap the white button to remove them from the checkout list.`
    : "";

  state.cart.forEach((item) => {
    const card = document.createElement("article");
    card.className = "cart-visual-card";
    card.innerHTML = `
      <img src="${safeUrl(item.image)}" alt="${escapeHtml(item.name)}">
      <span class="cart-item-label">${escapeHtml(item.name)} ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ ${escapeHtml(item.quantity)} ${escapeHtml(item.unit)}</span>
      ${item.flagged ? '<span class="cart-item-flag">Allergy warning</span>' : ""}
      <div class="cart-visual-controls">
        <button class="qty-button qty-minus" type="button" data-cart-qty="decrease" data-cart-id="${escapeHtml(item.id)}">-</button>
        <span class="qty-count">${escapeHtml(item.quantity)}</span>
        <button class="qty-button qty-plus" type="button" data-cart-qty="increase" data-cart-id="${escapeHtml(item.id)}">+</button>
      </div>
    `;
    cartList.appendChild(card);
  });

  cartList.querySelectorAll("[data-cart-qty]").forEach((button) => {
    button.addEventListener("click", () => updateCartQuantity(button));
  });
}

function updateCartQuantity(button) {
  const item = state.cart.find((entry) => entry.id === button.dataset.cartId);
  if (!item) {
    return;
  }

  item.quantity = button.dataset.cartQty === "increase"
    ? item.quantity + 1
    : Math.max(0, item.quantity - 1);

  renderCart();
}

function removeFlaggedIngredients() {
  const removedNames = state.cart.filter((item) => item.flagged).map((item) => item.name);
  state.cart = state.cart.filter((item) => !item.flagged);

  if (state.currentRecipe) {
    state.currentRecipe.ingredients = state.currentRecipe.ingredients.filter((ingredient) => !removedNames.includes(ingredient.name));
    state.currentRecipe.allergyWarnings = [];
  }

  renderCart();
  renderRecipe();
}

function handleCheckout() {
  if (!state.cart.length) {
    alert("Your cart is empty.");
    return;
  }

  state.paymentReturnPage = "cart";
  navigate("payment");
}

function renderRecipe() {
  if (!state.currentRecipe) {
    recipeTitle.textContent = "Recipe";
    recipeMeta.innerHTML = "";
    recipeIngredients.innerHTML = "";
    recipeSteps.innerHTML = "";
    recipeLinks.innerHTML = "";
    return;
  }

  recipeTitle.textContent = state.currentRecipe.title;
  recipeMeta.innerHTML = `
    <span class="meta-pill">Serves ${escapeHtml(state.currentRecipe.serves)}</span>
    ${state.currentRecipe.allergyWarnings?.length ? `<span class="meta-pill">Warnings: ${escapeHtml(state.currentRecipe.allergyWarnings.join(", "))}</span>` : '<span class="meta-pill">Ready to cook</span>'}
  `;
  recipeIngredients.innerHTML = state.currentRecipe.ingredients
    .map((ingredient) => `<li>${escapeHtml(ingredient.quantity)} ${escapeHtml(ingredient.unit)} ${escapeHtml(ingredient.name)}</li>`)
    .join("");
  recipeSteps.innerHTML = state.currentRecipe.steps
    .map((step) => `<li>${escapeHtml(step)}</li>`)
    .join("");

  const youtubeLinks = (state.currentRecipe.youtubeLinks || [])
    .map((link) => `<a href="${safeUrl(link)}" target="_blank" rel="noreferrer">Open YouTube guide</a>`);
  const sourceLinks = (state.currentRecipe.sourceLinks || [])
    .map((link) => `<a href="${safeUrl(link.url)}" target="_blank" rel="noreferrer">Source: ${escapeHtml(link.title || link.url)}</a>`);

  recipeLinks.innerHTML = [...youtubeLinks, ...sourceLinks].join("");
}

function cloneExtras(extras = []) {
  return extras.map((extra, index) => ({
    ...extra,
    id: extra.id || `${extra.name}-${index}`,
    image: extra.image || getImageForCategory(extra.category),
  }));
}

function findAllergyWarnings(ingredients, allergies) {
  return ingredients
    .filter((ingredient) => allergies.some((allergy) => ingredient.name.toLowerCase().includes(allergy.toLowerCase())))
    .map((ingredient) => ingredient.name);
}

function getImageForCategory(category) {
  const mapping = {
    vegetable: "./assets/1.png",
    meat: "./assets/3.png",
    fish: "./assets/9.png",
    dairy: "./assets/10.png",
    pantry: "./assets/12.png",
    egg: "./assets/11.png",
  };

  return mapping[category] || "./assets/1.png";
}

function inferCategory(value) {
  const text = String(value).toLowerCase();
  if (hasAny(text, ["cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡", "fish", "salmon", "ca kho", "ca bong"])) return "fish";
  if (hasAny(text, ["beef", "pork", "meat", "thÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¹t", "thit", "heo", "bÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â²", "bo", "patty"])) return "meat";
  if (hasAny(text, ["milk", "cheese", "sÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â¯a", "sua", "butter"])) return "dairy";
  if (hasAny(text, ["egg", "trÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚Â»Ãƒâ€šÃ‚Â©ng", "trung"])) return "egg";
  if (hasAny(text, ["rice", "com", "gao", "gÃƒÆ’Ã‚Â¡Ãƒâ€šÃ‚ÂºÃƒâ€šÃ‚Â¡o", "bun", "bread"])) return "pantry";
  return "vegetable";
}

function hasAny(text, keywords) {
  return keywords.some((keyword) => text.includes(keyword));
}

function normalizeList(value) {
  return String(value || "")
    .split(/[;\n]/)
    .flatMap((item) => item.split(","))
    .map((item) => item.trim())
    .filter(Boolean);
}

function titleCase(value) {
  return String(value)
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

function handleVoicePlaceholder() {
  alert("Voice input can be connected later. For now, type your request.");
}

function handleSharePlaceholder() {
  alert("Share action can be connected later in the production version.");
}

async function ensureVideoReady(video) {
  if (video.videoWidth && video.videoHeight) {
    return;
  }

  await new Promise((resolve) => {
    let finished = false;
    const done = () => {
      if (finished) return;
      finished = true;
      cleanup();
      resolve();
    };
    const cleanup = () => {
      video.removeEventListener("loadedmetadata", done);
      video.removeEventListener("canplay", done);
    };

    video.addEventListener("loadedmetadata", done, { once: true });
    video.addEventListener("canplay", done, { once: true });
    setTimeout(done, 500);
  });
}

async function waitForImageReady(image) {
  if (image.complete && image.naturalWidth) {
    return;
  }

  await new Promise((resolve) => {
    let finished = false;
    const done = () => {
      if (finished) return;
      finished = true;
      cleanup();
      resolve();
    };
    const cleanup = () => {
      image.removeEventListener("load", done);
      image.removeEventListener("error", done);
    };

    image.addEventListener("load", done, { once: true });
    image.addEventListener("error", done, { once: true });
    setTimeout(done, 700);
  });
}

function captureFocusedScanFromElement(sourceElement, sourceWidth, sourceHeight, mimeType = "image/jpeg") {
  if (!scanPreviewShell || !scanTargetFrame || !sourceWidth || !sourceHeight) {
    return null;
  }

  const previewRect = scanPreviewShell.getBoundingClientRect();
  const frameRect = scanTargetFrame.getBoundingClientRect();
  if (!previewRect.width || !previewRect.height || !frameRect.width || !frameRect.height) {
    return null;
  }

  const cropRect = calculateCoverCropRect({
    containerWidth: previewRect.width,
    containerHeight: previewRect.height,
    sourceWidth,
    sourceHeight,
    targetLeft: frameRect.left - previewRect.left,
    targetTop: frameRect.top - previewRect.top,
    targetWidth: frameRect.width,
    targetHeight: frameRect.height,
  });

  const canvas = document.createElement("canvas");
  const longestEdge = 1600;
  const scale = Math.min(1, longestEdge / Math.max(cropRect.sourceWidth, cropRect.sourceHeight));
  canvas.width = Math.max(1, Math.round(cropRect.sourceWidth * scale));
  canvas.height = Math.max(1, Math.round(cropRect.sourceHeight * scale));
  const context = canvas.getContext("2d");

  if (!context) {
    return null;
  }

  context.drawImage(
    sourceElement,
    cropRect.sourceX,
    cropRect.sourceY,
    cropRect.sourceWidth,
    cropRect.sourceHeight,
    0,
    0,
    canvas.width,
    canvas.height,
  );

  const safeMimeType = mimeType === "image/png" ? "image/png" : "image/jpeg";
  return {
    dataUrl: canvas.toDataURL(safeMimeType, safeMimeType === "image/jpeg" ? 0.92 : undefined),
    mimeType: safeMimeType,
  };
}

function calculateCoverCropRect({
  containerWidth,
  containerHeight,
  sourceWidth,
  sourceHeight,
  targetLeft,
  targetTop,
  targetWidth,
  targetHeight,
}) {
  const scale = Math.max(containerWidth / sourceWidth, containerHeight / sourceHeight);
  const renderedWidth = sourceWidth * scale;
  const renderedHeight = sourceHeight * scale;
  const overflowX = (renderedWidth - containerWidth) / 2;
  const overflowY = (renderedHeight - containerHeight) / 2;

  const sourceX = clamp((targetLeft + overflowX) / scale, 0, sourceWidth - 1);
  const sourceY = clamp((targetTop + overflowY) / scale, 0, sourceHeight - 1);
  const sourceCropWidth = clamp(targetWidth / scale, 1, sourceWidth - sourceX);
  const sourceCropHeight = clamp(targetHeight / scale, 1, sourceHeight - sourceY);

  return {
    sourceX,
    sourceY,
    sourceWidth: sourceCropWidth,
    sourceHeight: sourceCropHeight,
  };
}

async function requestGeminiScanAnalysis() {
  const endpoint = buildApiUrl("/api/scan-analysis");
  let response;

  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        imageDataUrl: state.scanImageSrc,
        mimeType: state.scanImageMimeType,
        sourceName: state.scanSourceName,
      }),
    });
  } catch (error) {
    throw new Error("Could not reach the scan analysis service. If you are testing on localhost, redeploy Vercel and try again.");
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error || (response.status === 404
      ? "Scan analysis API route was not found on the server."
      : "Scan analysis failed."));
  }

  return payload;
}
function getInlineImageFromDataUrl(dataUrl, preferredMimeType) {
  if (!String(dataUrl).startsWith("data:")) {
    return null;
  }

  const [meta, base64Data] = String(dataUrl).split(",");
  if (!meta || !base64Data) {
    return null;
  }

  const mimeMatch = meta.match(/^data:(.*?);base64$/i);
  return {
    mimeType: mimeMatch?.[1] || preferredMimeType || "image/jpeg",
    data: base64Data,
  };
}

function getMimeTypeFromDataUrl(dataUrl) {
  return getInlineImageFromDataUrl(dataUrl, "image/jpeg")?.mimeType || "image/jpeg";
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function uniqueObjectsByKey(values, key) {
  const seen = new Set();
  return values.filter((value) => {
    const marker = value?.[key];
    if (!marker || seen.has(marker)) {
      return false;
    }
    seen.add(marker);
    return true;
  });
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function safeUrl(value) {
  const text = String(value || "").trim();
  return /^https?:\/\//i.test(text) || text.startsWith("./assets/") ? text : "#";
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}


















