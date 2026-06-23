(function () {
  "use strict";

  var currentScript =
    document.currentScript ||
    (function () {
      var scripts = document.getElementsByTagName("script");
      return scripts[scripts.length - 1];
    })();

  var scriptSrc = currentScript.src;
  var scriptUrl = new URL(scriptSrc);
  var storeId = scriptUrl.searchParams.get("store_id");
  if (!storeId) return;
  // Tiendanube puede hostear este archivo en su propio dominio (apps-scripts.tiendanube.com),
  // así que no podemos asumir que la URL de nuestra API se deriva del src del script. Viaja
  // como query param propio (api_base), seteado al activar el script vía POST /scripts.
  // Si no está (ej. se sirve directo desde nuestro propio /widget/cucardas.js), caemos al split viejo.
  var apiBase = scriptUrl.searchParams.get("api_base") || scriptSrc.split("/widget/")[0];

  var SIZE_PX = { small: 44, medium: 72, large: 112 };
  var SIZE_FONT = { small: 11, medium: 15, large: 20 };

  // --- Estilos (animaciones + ocultar cucardas nativas) inyectados una sola vez ---
  function injectStyles(hideNative) {
    if (document.getElementById("cucardas-styles")) {
      if (hideNative) document.documentElement.setAttribute("data-cucardas-hide-native", "1");
      return;
    }
    var css = [
      "@keyframes cuc-pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.12)}}",
      "@keyframes cuc-blink{0%,100%{opacity:1}50%{opacity:.25}}",
      "@keyframes cuc-bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}",
      "@keyframes cuc-shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-3px)}75%{transform:translateX(3px)}}",
      ".cuc-badge{position:absolute;z-index:99999;pointer-events:none;line-height:1;}",
      ".cuc-anim-pulse{animation:cuc-pulse 1.2s ease-in-out infinite}",
      ".cuc-anim-blink{animation:cuc-blink 1.2s ease-in-out infinite}",
      ".cuc-anim-bounce{animation:cuc-bounce 1s ease-in-out infinite}",
      ".cuc-anim-shake{animation:cuc-shake .8s ease-in-out infinite}",
      ".cuc-text{display:inline-block;font-weight:700;border-radius:6px;padding:.4em .7em;white-space:nowrap;box-shadow:0 1px 4px rgba(0,0,0,.2);font-family:inherit;}",
      // Selectores comunes de cucardas nativas de Tiendanube/temas
      '[data-cucardas-hide-native="1"] .js-product-flags,[data-cucardas-hide-native="1"] .product-item-promotion,[data-cucardas-hide-native="1"] .product-flag,[data-cucardas-hide-native="1"] .js-promo-flag{display:none !important}',
    ].join("\n");
    var style = document.createElement("style");
    style.id = "cucardas-styles";
    style.textContent = css;
    document.head.appendChild(style);
    if (hideNative) document.documentElement.setAttribute("data-cucardas-hide-native", "1");
  }

  // --- Detección de producto en página de producto ---
  function detectProductId() {
    var meta = document.querySelector('meta[name="cucardas-product-id"]');
    if (meta) return meta.getAttribute("content");

    // window.LS.product.id es la variable nativa de Tiendanube y siempre es el ID numérico
    // real del producto. Va antes que el JSON-LD a propósito: muchos temas exponen ahí el SKU
    // en vez del product ID (campo "sku", no "productID"), y un SKU no es lo mismo que el ID.
    if (window.LS && window.LS.product && window.LS.product.id) return String(window.LS.product.id);

    var ldScripts = document.querySelectorAll('script[type="application/ld+json"]');
    for (var i = 0; i < ldScripts.length; i++) {
      try {
        var data = JSON.parse(ldScripts[i].textContent);
        var node = Array.isArray(data)
          ? data.filter(function (d) {
              return d["@type"] === "Product";
            })[0]
          : data;
        if (node && node["@type"] === "Product" && node.productID) {
          return String(node.productID);
        }
      } catch (e) {
        /* JSON-LD inválido, seguimos */
      }
    }

    return null;
  }

  function findProductImageContainer() {
    var selectors = [
      "[data-cucardas-image]",
      "#single-product .js-product-slide-img", // tema Brasilia de Tiendanube (y similares)
      ".js-product-slide-img",
      ".js-product-image img",
      ".product-image img",
      ".main-product-image img",
    ];
    for (var i = 0; i < selectors.length; i++) {
      var el = document.querySelector(selectors[i]);
      if (el) return el;
    }
    return null;
  }

  // --- Evaluación de condiciones (best-effort, según datos del tema) ---
  function productMatchesCondition(condition, lsProduct) {
    if (!condition || condition === "none") return true;
    if (!lsProduct) return true; // sin datos no podemos descartar: mostramos

    var variants = lsProduct.variants || [];
    var anyOnSale = variants.some(function (v) {
      var price = parseFloat(v.price);
      var compare = parseFloat(v.compare_at_price);
      return !isNaN(compare) && !isNaN(price) && compare > price;
    });
    var anyInStock = variants.some(function (v) {
      return v.stock === null || v.stock === undefined || Number(v.stock) > 0;
    });

    switch (condition) {
      case "on_sale":
        return anyOnSale;
      case "out_of_stock":
        return !anyInStock;
      case "in_stock":
        return anyInStock;
      case "new":
      default:
        return true; // "new" no es determinable de forma confiable en el storefront
    }
  }

  // --- Render de una cucarda sobre un contenedor de imagen ---
  function applyPosition(el, position) {
    var m = "8px";
    var pos = position || "top-left";
    if (pos === "center") {
      el.style.top = "50%";
      el.style.left = "50%";
      el.style.transform = "translate(-50%,-50%)";
      return;
    }
    if (pos.indexOf("top") === 0) el.style.top = m;
    else el.style.bottom = m;
    if (pos.indexOf("left") >= 0) el.style.left = m;
    else el.style.right = m;
  }

  function buildBadge(assignment) {
    var wrap = document.createElement("div");
    wrap.className = "cuc-badge";
    if (assignment.animation && assignment.animation !== "none") {
      wrap.className += " cuc-anim-" + assignment.animation;
    }
    applyPosition(wrap, assignment.position);

    if (assignment.type === "text") {
      // Si hay sizePx, lo usamos como referencia de ancho y derivamos el tamaño de fuente
      // proporcionalmente (la fuente "natural" representa ~28% del ancho de la cucarda chica).
      var fontSize = assignment.sizePx
        ? Math.round(assignment.sizePx * 0.28)
        : SIZE_FONT[assignment.size] || SIZE_FONT.small;
      var span = document.createElement("span");
      span.className = "cuc-text";
      span.textContent = assignment.text || "";
      span.style.background = assignment.backgroundColor || "#e0353b";
      span.style.color = assignment.textColor || "#ffffff";
      span.style.fontSize = fontSize + "px";
      wrap.appendChild(span);
    } else if (assignment.imageUrl) {
      var width = assignment.sizePx || SIZE_PX[assignment.size] || SIZE_PX.small;
      var img = document.createElement("img");
      img.src = assignment.imageUrl;
      img.alt = "";
      img.style.width = width + "px";
      img.style.height = "auto";
      img.style.display = "block";
      wrap.appendChild(img);
    } else {
      return null;
    }
    return wrap;
  }

  function renderBadgeOn(targetImg, assignment) {
    var container = targetImg.closest("[data-cucardas-image]") || targetImg.parentElement;
    if (!container) return;
    if (window.getComputedStyle(container).position === "static") {
      container.style.position = "relative";
    }
    var badge = buildBadge(assignment);
    if (badge) container.appendChild(badge);
  }

  // --- Página de producto ---
  function runProductPage() {
    var productId = detectProductId();
    if (!productId) return;

    var url =
      apiBase +
      "/api/public/assignments?store_id=" +
      encodeURIComponent(storeId) +
      "&product_id=" +
      encodeURIComponent(productId);

    fetch(url)
      .then(function (r) {
        return r.ok ? r.json() : { assignments: [] };
      })
      .then(function (data) {
        var list = (data.assignments || []).filter(function (a) {
          return a.location === "product_page" || a.location === "both";
        });
        if (list.length === 0) return;

        var lsProduct = window.LS && window.LS.product;
        var visible = list.filter(function (a) {
          return productMatchesCondition(a.condition, lsProduct);
        });
        if (visible.length === 0) return;

        injectStyles(visible.some(function (a) {
          return a.hideNativeBadges;
        }));

        var targetImg = findProductImageContainer();
        if (!targetImg) return;
        visible.forEach(function (a) {
          renderBadgeOn(targetImg, a);
        });
      })
      .catch(function () {
        /* fallo silencioso: el widget nunca debe romper el storefront */
      });
  }

  // --- Páginas de grilla / listado ---
  function findGridCards() {
    var cards = [];
    var nodes = document.querySelectorAll(
      "[data-cucardas-product], .js-item-product, .item-product, [data-product-id]",
    );
    nodes.forEach(function (node) {
      var pid =
        node.getAttribute("data-cucardas-product") ||
        node.getAttribute("data-product-id") ||
        node.getAttribute("data-id");
      var img = node.querySelector("img");
      if (pid && img) cards.push({ productId: String(pid), img: img });
    });
    return cards;
  }

  function runGridPage() {
    var cards = findGridCards();
    if (cards.length === 0) return;

    var ids = cards
      .map(function (c) {
        return c.productId;
      })
      .filter(function (v, i, arr) {
        return arr.indexOf(v) === i;
      })
      .slice(0, 100);

    var url =
      apiBase +
      "/api/public/assignments/batch?store_id=" +
      encodeURIComponent(storeId) +
      "&product_ids=" +
      encodeURIComponent(ids.join(","));

    fetch(url)
      .then(function (r) {
        return r.ok ? r.json() : { assignments: [] };
      })
      .then(function (data) {
        var byProduct = {};
        (data.assignments || []).forEach(function (a) {
          if (a.location !== "product_grid" && a.location !== "both") return;
          (byProduct[a.productId] = byProduct[a.productId] || []).push(a);
        });
        if (Object.keys(byProduct).length === 0) return;

        injectStyles(
          (data.assignments || []).some(function (a) {
            return a.hideNativeBadges;
          }),
        );

        cards.forEach(function (card) {
          var list = byProduct[card.productId];
          if (!list) return;
          // En grilla no tenemos datos de precio/stock por tarjeta: las condiciones se
          // omiten acá y solo se evalúan de forma fiable en la página de producto.
          list.forEach(function (a) {
            renderBadgeOn(card.img, a);
          });
        });
      })
      .catch(function () {});
  }

  function init() {
    // Una página de producto suele exponer LS.product; igual corremos ambos detectores
    // porque algunos temas muestran productos relacionados en grilla dentro del producto.
    runProductPage();
    runGridPage();
  }

  if (document.readyState === "complete" || document.readyState === "interactive") {
    init();
  } else {
    document.addEventListener("DOMContentLoaded", init);
  }
})();
