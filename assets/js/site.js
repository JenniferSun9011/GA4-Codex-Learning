(function () {
  const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

  function qs(selector, root) {
    return (root || document).querySelector(selector);
  }

  function qsa(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function formatMoney(value) {
    return money.format(Number(value) || 0);
  }

  function productUrl(product) {
    return 'product.html?id=' + encodeURIComponent(product.item_id);
  }

  function articleUrl(article) {
    return 'article.html?id=' + encodeURIComponent(article.id);
  }

  function buildUrl(path, params) {
    const query = new URLSearchParams(params || {});
    const suffix = query.toString();
    return suffix ? path + '?' + suffix : path;
  }

  function getParam(name) {
    return new URLSearchParams(window.location.search).get(name);
  }

  function renderHeader() {
    const header = qs('[data-site-header]');
    if (!header) {
      return;
    }
    header.innerHTML = [
      '<div class="nav-wrap">',
      '<a class="brand" href="index.html" aria-label="AI Ecommerce Lab home">AI Ecommerce Lab</a>',
      '<nav class="site-nav" aria-label="Main navigation">',
      '<a href="products.html">Products</a>',
      '<a href="blog.html">Blog</a>',
      '<a href="about.html">About</a>',
      '<a class="cart-link" href="cart.html">Cart <span data-cart-count>0</span></a>',
      '</nav>',
      '<form class="site-search" data-site-search role="search">',
      '<label class="sr-only" for="site-search-input">Search products</label>',
      '<input id="site-search-input" name="q" type="search" placeholder="Search products">',
      '<button type="submit" aria-label="Search products">Search</button>',
      '</form>',
      '</div>'
    ].join('');
    updateCartCount();
  }

  function renderFooter() {
    const footer = qs('[data-site-footer]');
    if (!footer) {
      return;
    }
    footer.innerHTML = [
      '<div>',
      '<strong>AI Ecommerce Lab</strong>',
      '<p>Static GA4 ecommerce training site. No real payments or personal data collection.</p>',
      '</div>',
      '<div class="footer-links">',
      '<a href="products.html">Products</a>',
      '<a href="blog.html">Blog</a>',
      '<a href="about.html">About</a>',
      '</div>'
    ].join('');
  }

  function updateCartCount() {
    const count = window.AIELabCart.getItems().reduce(function (sum, item) {
      return sum + item.quantity;
    }, 0);
    qsa('[data-cart-count]').forEach(function (el) {
      el.textContent = String(count);
    });
  }

  function productCard(product, listId, listName) {
    return [
      '<article class="product-card">',
      '<a class="product-card__image" href="' + productUrl(product) + '" data-select-item="' + product.item_id + '" data-list-id="' + listId + '" data-list-name="' + listName + '">',
      '<img src="' + product.image + '" alt="' + product.alt + '">',
      '</a>',
      '<div class="product-card__body">',
      '<p class="tag">' + product.item_category + '</p>',
      '<h3><a href="' + productUrl(product) + '" data-select-item="' + product.item_id + '" data-list-id="' + listId + '" data-list-name="' + listName + '">' + product.item_name + '</a></h3>',
      '<p>' + product.description + '</p>',
      '<div class="product-card__footer">',
      '<strong>' + formatMoney(product.price) + '</strong>',
      '<a class="button button--small" href="' + productUrl(product) + '" data-select-item="' + product.item_id + '" data-list-id="' + listId + '" data-list-name="' + listName + '">View Product</a>',
      '</div>',
      '</div>',
      '</article>'
    ].join('');
  }

  function bindSelectItems(root) {
    qsa('[data-select-item]', root).forEach(function (link) {
      link.addEventListener('click', function () {
        const product = window.AIELabData.findProduct(link.getAttribute('data-select-item'));
        if (product) {
          window.AIELabAnalytics.selectItem(product, link.getAttribute('data-list-id') || 'product_list', link.getAttribute('data-list-name') || 'Product List');
        }
      });
    });
  }

  function renderFeatured() {
    const target = qs('[data-featured-products]');
    if (!target) {
      return;
    }
    target.innerHTML = window.AIELabProducts.map(function (product) {
      return productCard(product, 'featured_products', 'Featured Products');
    }).join('');
    bindSelectItems(target);
  }

  function renderProductsList() {
    const target = qs('[data-products-list]');
    if (!target) {
      return;
    }
    const category = getParam('category');
    const products = category ? window.AIELabProducts.filter(function (product) {
      return product.item_category === category;
    }) : window.AIELabProducts;
    target.innerHTML = products.map(function (product) {
      return productCard(product, 'products_page', 'Products Page');
    }).join('');
    bindSelectItems(target);
    window.AIELabAnalytics.viewItemList(products, 'products_page', 'Products Page');
  }

  function renderProductDetail() {
    const target = qs('[data-product-detail]');
    if (!target) {
      return;
    }
    const product = window.AIELabData.findProduct(getParam('id'));
    if (!product) {
      target.innerHTML = [
        '<div class="empty-state">',
        '<p class="eyebrow">Product not found</p>',
        '<h1>We could not find this demo product.</h1>',
        '<p>The product link may be outdated or missing an item ID.</p>',
        '<a class="button button--primary" href="products.html">Back to Products</a>',
        '</div>'
      ].join('');
      return;
    }
    document.title = product.item_name + ' | AI Ecommerce Lab';
    target.innerHTML = [
      '<article class="product-detail">',
      '<div class="product-detail__media"><img src="' + product.image + '" alt="' + product.alt + '"></div>',
      '<div class="product-detail__content">',
      '<p class="eyebrow">' + product.item_category + '</p>',
      '<h1>' + product.item_name + '</h1>',
      '<p class="price">' + formatMoney(product.price) + '</p>',
      '<p>' + product.description + '</p>',
      '<h2>Key benefits</h2>',
      '<ul>' + product.features.map(function (feature) { return '<li>' + feature + '</li>'; }).join('') + '</ul>',
      '<h2>Demo specs</h2>',
      '<ul>' + product.specs.map(function (spec) { return '<li>' + spec + '</li>'; }).join('') + '</ul>',
      '<div class="quantity-control">',
      '<label for="quantity">Quantity</label>',
      '<input id="quantity" type="number" min="1" value="1" inputmode="numeric">',
      '</div>',
      '<div class="button-row">',
      '<button class="button button--primary" type="button" data-add-to-cart="' + product.item_id + '">Add to Cart</button>',
      '<button class="button button--secondary" type="button" data-buy-now="' + product.item_id + '">Buy Now</button>',
      '<button class="text-button" type="button" data-add-to-wishlist="' + product.item_id + '">Save for later</button>',
      '</div>',
      '</div>',
      '</article>'
    ].join('');
    window.AIELabAnalytics.viewItem(product);
  }

  function addProductToCart(productId) {
    const quantityInput = qs('#quantity');
    const qty = quantityInput ? Number(quantityInput.value) || 1 : 1;
    const product = window.AIELabCart.addItem(productId, qty);
    if (product) {
      window.AIELabAnalytics.addToCart(product, qty);
      updateCartCount();
    }
    return product;
  }

  function renderCart() {
    const target = qs('[data-cart-view]');
    if (!target) {
      return;
    }
    const items = window.AIELabCart.getItems();
    if (!items.length) {
      target.innerHTML = [
        '<div class="empty-state">',
        '<h2>Your cart is empty</h2>',
        '<p>Add a product to continue the demo ecommerce funnel.</p>',
        '<a class="button button--primary" href="products.html">Back to Products</a>',
        '</div>'
      ].join('');
      return;
    }
    const totals = window.AIELabCart.totals(items);
    target.innerHTML = [
      '<div class="cart-layout">',
      '<div class="cart-items">',
      items.map(function (item) {
        return [
          '<article class="cart-item">',
          '<img src="' + item.product.image + '" alt="' + item.product.alt + '">',
          '<div>',
          '<h2>' + item.product.item_name + '</h2>',
          '<p>' + item.product.item_category + '</p>',
          '<p>' + formatMoney(item.product.price) + '</p>',
          '</div>',
          '<div class="cart-item__actions">',
          '<label for="qty-' + item.product.item_id + '">Qty</label>',
          '<input id="qty-' + item.product.item_id + '" type="number" min="1" value="' + item.quantity + '" data-cart-quantity="' + item.product.item_id + '">',
          '<button class="text-button" type="button" data-remove-item="' + item.product.item_id + '">Remove</button>',
          '</div>',
          '<strong>' + formatMoney(item.product.price * item.quantity) + '</strong>',
          '</article>'
        ].join('');
      }).join(''),
      '</div>',
      '<aside class="summary-box">',
      '<h2>Cart total</h2>',
      '<div class="summary-row"><span>Subtotal</span><strong>' + formatMoney(totals.subtotal) + '</strong></div>',
      (totals.discount ? '<div class="summary-row"><span>Discount' + (totals.coupon ? ' (' + totals.coupon.code + ')' : '') + '</span><strong>-' + formatMoney(totals.discount) + '</strong></div>' : ''),
      '<div class="summary-row"><span>Estimated shipping</span><strong>' + formatMoney(totals.shipping) + '</strong></div>',
      '<div class="summary-row"><span>Estimated tax</span><strong>' + formatMoney(totals.tax) + '</strong></div>',
      '<div class="summary-row summary-row--total"><span>Total</span><strong>' + formatMoney(totals.total) + '</strong></div>',
      '<form class="coupon-form" data-coupon-form>',
      '<label for="coupon-code">Promo code</label>',
      '<div><input id="coupon-code" name="coupon" value="' + (totals.coupon ? totals.coupon.code : '') + '" placeholder="Try LAB10 or FIELD15"><button class="button button--small" type="submit">Apply</button></div>',
      '<p class="form-message" data-coupon-message>Use LAB10 for 10% or FIELD15 for 15% off.</p>',
      '</form>',
      '<a class="button button--primary button--full" href="checkout.html">Checkout</a>',
      '</aside>',
      '</div>'
    ].join('');
    if (!window.__AIELabViewCartSent) {
      window.__AIELabViewCartSent = true;
      window.AIELabAnalytics.viewCart(items);
    }
  }

  function checkoutOption(name, id, value, label, checked) {
    return '<label class="option-card" for="' + id + '"><input id="' + id + '" name="' + name + '" type="radio" value="' + value + '"' + (checked ? ' checked' : '') + '> <span>' + label + '</span></label>';
  }

  function renderCheckout() {
    const target = qs('[data-checkout-view]');
    if (!target) {
      return;
    }
    const items = window.AIELabCart.getItems();
    if (!items.length) {
      target.innerHTML = [
        '<div class="empty-state">',
        '<h2>Your cart is empty</h2>',
        '<p>Add products before starting checkout.</p>',
        '<a class="button button--primary" href="products.html">Back to Products</a>',
        '</div>'
      ].join('');
      return;
    }
    const totals = window.AIELabCart.totals(items, 'standard');
    target.innerHTML = [
      '<form class="checkout-layout" data-checkout-form>',
      '<div class="checkout-main">',
      '<section class="panel">',
      '<h2>Shipping method</h2>',
      checkoutOption('shipping', 'ship-standard', 'standard', 'Standard demo shipping - $4.99', true),
      checkoutOption('shipping', 'ship-express', 'express', 'Express demo shipping - $14.99', false),
      '</section>',
      '<section class="panel">',
      '<h2>Payment method</h2>',
      checkoutOption('payment', 'pay-demo-card', 'demo-card', 'Demo card - no real payment', true),
      checkoutOption('payment', 'pay-demo-wallet', 'demo-wallet', 'Demo wallet - no real payment', false),
      checkoutOption('payment', 'pay-demo-declined', 'demo-declined', 'Declined test payment - simulate a failure', false),
      '</section>',
      '<section class="panel">',
      '<h2>Checkout readiness</h2>',
      '<label for="purchase-purpose">Select a demo purchase purpose</label>',
      '<select id="purchase-purpose" name="purchase-purpose" data-checkout-purpose>',
      '<option value="">Choose an option</option>',
      '<option value="field_replacement">Field device replacement</option>',
      '<option value="team_rollout">Team rollout evaluation</option>',
      '<option value="ga4_training">GA4 training walkthrough</option>',
      '</select>',
      '<p class="form-message" data-checkout-error aria-live="polite"></p>',
      '</section>',
      '<p class="privacy-note">This checkout uses simulated options only and does not collect personal information.</p>',
      '</div>',
      '<aside class="summary-box" data-checkout-summary></aside>',
      '</form>'
    ].join('');
    updateCheckoutSummary('standard');
    window.AIELabAnalytics.beginCheckout(items);
  }

  function updateCheckoutSummary(method) {
    const target = qs('[data-checkout-summary]');
    if (!target) {
      return;
    }
    const items = window.AIELabCart.getItems();
    const totals = window.AIELabCart.totals(items, method);
    target.innerHTML = [
      '<h2>Order summary</h2>',
      items.map(function (item) {
        return '<div class="summary-row"><span>' + item.product.item_name + ' x ' + item.quantity + '</span><strong>' + formatMoney(item.product.price * item.quantity) + '</strong></div>';
      }).join(''),
      '<div class="summary-row"><span>Subtotal</span><strong>' + formatMoney(totals.subtotal) + '</strong></div>',
      (totals.discount ? '<div class="summary-row"><span>Discount' + (totals.coupon ? ' (' + totals.coupon.code + ')' : '') + '</span><strong>-' + formatMoney(totals.discount) + '</strong></div>' : ''),
      '<div class="summary-row"><span>Shipping</span><strong>' + formatMoney(totals.shipping) + '</strong></div>',
      '<div class="summary-row"><span>Tax</span><strong>' + formatMoney(totals.tax) + '</strong></div>',
      '<div class="summary-row summary-row--total"><span>Total</span><strong>' + formatMoney(totals.total) + '</strong></div>',
      '<button class="button button--primary button--full" type="submit">Place Demo Order</button>'
    ].join('');
  }

  function renderThankYou() {
    const target = qs('[data-thankyou-view]');
    if (!target) {
      return;
    }
    const order = window.AIELabCart.getLastOrder();
    if (!order || !order.transaction_id) {
      target.innerHTML = [
        '<div class="empty-state">',
        '<p class="eyebrow">No active order</p>',
        '<h1>No demo order was found.</h1>',
        '<p>Start a new shopping path to create a purchase event.</p>',
        '<a class="button button--primary" href="products.html">Shop Products</a>',
        '</div>'
      ].join('');
      return;
    }
    target.innerHTML = [
      '<section class="thankyou-card">',
      '<p class="eyebrow">Order complete</p>',
      '<h1>Thank you for your demo order.</h1>',
      '<p>Order number: <strong>' + order.transaction_id + '</strong></p>',
      '<p>Total: <strong>' + formatMoney(order.total) + '</strong></p>',
      '<div class="order-items">',
      order.items.map(function (item) {
        return '<div class="summary-row"><span>' + item.product.item_name + ' x ' + item.quantity + '</span><strong>' + formatMoney(item.product.price * item.quantity) + '</strong></div>';
      }).join(''),
      '</div>',
      '<div class="button-row">',
      '<a class="button button--primary" href="index.html">Back Home</a>',
      '<a class="button button--secondary" href="products.html">Continue Shopping</a>',
      '</div>',
      '</section>'
    ].join('');
    if (!window.AIELabCart.hasSentPurchase(order.transaction_id)) {
      window.AIELabAnalytics.purchase(order);
      window.AIELabCart.markPurchaseSent(order.transaction_id);
      window.AIELabCart.clearCart();
      updateCartCount();
    }
  }

  function renderBlogList() {
    const target = qs('[data-blog-list]');
    if (!target) {
      return;
    }
    target.innerHTML = window.AIELabArticles.map(function (article) {
      const product = window.AIELabData.findProduct(article.recommendedProductId);
      return [
        '<article class="article-card">',
        '<p class="tag">Guide</p>',
        '<h2><a href="' + articleUrl(article) + '">' + article.title + '</a></h2>',
        '<p>' + article.summary + '</p>',
        '<dl class="article-meta">',
        '<div><dt>Target keyword</dt><dd>' + article.seoKeyword + '</dd></div>',
        '<div><dt>Search intent</dt><dd>' + article.searchIntent + '</dd></div>',
        '<div><dt>Traffic goal</dt><dd>' + article.trafficGoal + '</dd></div>',
        '</dl>',
        '<div class="recommendation">',
        '<span>Recommended: ' + product.item_name + '</span>',
        '<a class="text-link" href="' + productUrl(product) + '">Shop Now</a>',
        '</div>',
        '</article>'
      ].join('');
    }).join('');
  }

  function renderTrafficTests() {
    const target = qs('[data-traffic-tests]');
    if (!target) {
      return;
    }
    target.innerHTML = [
      '<div class="section__heading">',
      '<p class="eyebrow">Source testing</p>',
      '<h2>Referral and AI traffic links</h2>',
      '<p>Click these links to create GA4 sessions with source and medium parameters. Continue from article or product page to cart and purchase to compare conversion quality by source.</p>',
      '</div>',
      '<div class="traffic-test-grid">',
      window.AIELabTrafficTests.map(function (group) {
        return [
          '<article class="traffic-card">',
          '<p class="tag">' + group.id + '</p>',
          '<h3>' + group.group + '</h3>',
          '<p>' + group.description + '</p>',
          '<div class="traffic-links">',
          group.links.map(function (link) {
            const url = buildUrl(link.path, link.params);
            return [
              '<a class="traffic-link" href="' + url + '" data-traffic-test="' + group.id + '" data-traffic-label="' + link.label + '">',
              '<span>' + link.label + '</span>',
              '<code>' + link.params.utm_source + ' / ' + link.params.utm_medium + '</code>',
              '</a>'
            ].join('');
          }).join(''),
          '</div>',
          '</article>'
        ].join('');
      }).join(''),
      '</div>'
    ].join('');
  }

  function renderPromotion() {
    const target = qs('[data-promotion]');
    if (!target) {
      return;
    }
    const product = window.AIELabData.findProduct('tablet-x1');
    const promotion = {
      id: 'field-kit-launch',
      name: 'Field Kit Launch Offer',
      creative: 'homepage_field_kit_banner',
      product: product
    };
    target.innerHTML = [
      '<div>',
      '<p class="eyebrow">Training promotion</p>',
      '<h2>Field Kit Launch: save 10% with LAB10</h2>',
      '<p>Use this simulated promotion to analyse banner exposure, promotion clicks, coupon use, and purchase behavior.</p>',
      '</div>',
      '<a class="button button--primary" href="' + productUrl(product) + '" data-promotion-id="' + promotion.id + '">Shop the offer</a>'
    ].join('');
    window.AIELabAnalytics.viewPromotion(promotion);
  }

  function renderSearchResults() {
    const target = qs('[data-search-results]');
    if (!target) {
      return;
    }
    const term = (getParam('q') || '').trim();
    const normalized = term.toLowerCase();
    const products = normalized ? window.AIELabProducts.filter(function (product) {
      return [product.item_name, product.item_category, product.description].join(' ').toLowerCase().indexOf(normalized) !== -1;
    }) : [];
    qs('[data-search-term]').textContent = term || 'a product';
    target.innerHTML = products.length ? products.map(function (product) {
      return productCard(product, 'site_search', 'Site Search Results');
    }).join('') : '<div class="empty-state"><h2>No products found</h2><p>Try tablet, phone, or watch.</p><a class="button button--primary" href="products.html">Browse products</a></div>';
    bindSelectItems(target);
    if (term) {
      window.AIELabAnalytics.search(term, products.length);
      window.AIELabAnalytics.viewSearchResults(term, products);
    }
  }

  function renderNewsletter() {
    const target = qs('[data-newsletter]');
    if (!target) {
      return;
    }
    target.innerHTML = [
      '<section class="newsletter-panel">',
      '<div><p class="eyebrow">User asset test</p><h2>Join the simulated product digest</h2><p>No email is collected. This interaction only creates a training lead event.</p></div>',
      '<form data-newsletter-form><button class="button button--primary" type="submit">Create demo subscription</button><p class="form-message" data-newsletter-message aria-live="polite"></p></form>',
      '</section>'
    ].join('');
  }

  function renderArticleDetail() {
    const target = qs('[data-article-detail]');
    if (!target) {
      return;
    }
    const article = window.AIELabData.findArticle(getParam('id')) || window.AIELabArticles[0];
    const product = window.AIELabData.findProduct(article.recommendedProductId);
    document.title = article.title + ' | AI Ecommerce Lab';
    target.innerHTML = [
      '<article class="content-page article-detail">',
      '<p class="eyebrow">Guide</p>',
      '<h1>' + article.title + '</h1>',
      article.body.map(function (paragraph) { return '<p>' + paragraph + '</p>'; }).join(''),
      '<section class="recommendation recommendation--large">',
      '<div>',
      '<p class="eyebrow">Recommended product</p>',
      '<h2>' + product.item_name + '</h2>',
      '<p>' + product.description + '</p>',
      '</div>',
      '<a class="button button--primary" href="' + productUrl(product) + '">Shop Now</a>',
      '</section>',
      '</article>'
    ].join('');
  }

  function bindGlobalEvents() {
    document.addEventListener('click', function (event) {
      const addButton = event.target.closest('[data-add-to-cart]');
      if (addButton) {
        addProductToCart(addButton.getAttribute('data-add-to-cart'));
      }
      const buyButton = event.target.closest('[data-buy-now]');
      if (buyButton) {
        if (addProductToCart(buyButton.getAttribute('data-buy-now'))) {
          window.location.href = 'checkout.html';
        }
      }
      const removeButton = event.target.closest('[data-remove-item]');
      if (removeButton) {
        const removed = window.AIELabCart.removeItem(removeButton.getAttribute('data-remove-item'));
        if (removed) {
          window.AIELabAnalytics.removeFromCart(removed.product, removed.quantity);
        }
        renderCart();
        updateCartCount();
      }
      const trafficLink = event.target.closest('[data-traffic-test]');
      if (trafficLink) {
        window.AIELabAnalytics.trafficTestClick(
          trafficLink.getAttribute('data-traffic-test'),
          trafficLink.getAttribute('data-traffic-label'),
          trafficLink.getAttribute('href')
        );
      }
      const wishlistButton = event.target.closest('[data-add-to-wishlist]');
      if (wishlistButton) {
        const product = window.AIELabData.findProduct(wishlistButton.getAttribute('data-add-to-wishlist'));
        if (product) {
          window.AIELabAnalytics.addToWishlist(product);
          wishlistButton.textContent = 'Saved for training';
          wishlistButton.disabled = true;
        }
      }
      const promotionLink = event.target.closest('[data-promotion-id]');
      if (promotionLink) {
        const product = window.AIELabData.findProduct('tablet-x1');
        window.AIELabAnalytics.selectPromotion({
          id: promotionLink.getAttribute('data-promotion-id'),
          name: 'Field Kit Launch Offer',
          creative: 'homepage_field_kit_banner',
          product: product
        });
      }
    });

    document.addEventListener('change', function (event) {
      if (event.target.matches('[data-cart-quantity]')) {
        window.AIELabCart.setQuantity(event.target.getAttribute('data-cart-quantity'), Number(event.target.value) || 1);
        renderCart();
        updateCartCount();
      }
      if (event.target.name === 'shipping') {
        const items = window.AIELabCart.getItems();
        const shippingValue = window.AIELabCart.totals(items, event.target.value).shipping;
        updateCheckoutSummary(event.target.value);
        window.AIELabAnalytics.selectShippingOption(items, event.target.value, shippingValue);
        window.AIELabAnalytics.addShippingInfo(items, event.target.value, shippingValue);
      }
      if (event.target.name === 'payment') {
        window.AIELabAnalytics.addPaymentInfo(window.AIELabCart.getItems(), event.target.value);
      }
    });

    document.addEventListener('submit', function (event) {
      const searchForm = event.target.closest('[data-site-search]');
      if (searchForm) {
        event.preventDefault();
        const query = new FormData(searchForm).get('q');
        window.location.href = buildUrl('search.html', { q: String(query || '').trim() });
        return;
      }
      const couponForm = event.target.closest('[data-coupon-form]');
      if (couponForm) {
        event.preventDefault();
        const coupon = window.AIELabCart.applyCoupon(new FormData(couponForm).get('coupon'));
        const items = window.AIELabCart.getItems();
        const discountValue = coupon.valid ? window.AIELabCart.totals(items).discount : 0;
        window.AIELabAnalytics.applyCoupon(coupon.code, discountValue, coupon.valid ? 'valid' : 'invalid');
        renderCart();
        return;
      }
      const newsletterForm = event.target.closest('[data-newsletter-form]');
      if (newsletterForm) {
        event.preventDefault();
        const source = document.body.getAttribute('data-page') || 'site';
        window.AIELabAnalytics.generateLead('simulated_newsletter', source);
        const message = qs('[data-newsletter-message]', newsletterForm);
        message.textContent = 'Demo subscription recorded. No personal data was collected.';
        newsletterForm.querySelector('button').disabled = true;
        return;
      }
      const form = event.target.closest('[data-checkout-form]');
      if (!form) {
        return;
      }
      event.preventDefault();
      const purpose = qs('[data-checkout-purpose]', form);
      const shipping = qs('input[name="shipping"]:checked', form);
      const payment = qs('input[name="payment"]:checked', form);
      const error = qs('[data-checkout-error]', form);
      if (!purpose || !purpose.value) {
        error.textContent = 'Choose a demo purchase purpose before placing the order.';
        window.AIELabAnalytics.formError('demo_checkout', 'missing_purchase_purpose');
        return;
      }
      if (payment && payment.value === 'demo-declined') {
        error.textContent = 'This simulated payment was declined. Choose another payment method to continue.';
        window.AIELabAnalytics.checkoutError('payment_declined', payment.value);
        window.AIELabAnalytics.paymentFailed(payment.value);
        return;
      }
      window.AIELabCart.createOrder({
        shippingMethod: shipping ? shipping.value : 'standard',
        paymentMethod: payment ? payment.value : 'demo-card'
      });
      window.location.href = 'thankyou.html';
    });

    document.addEventListener('focusin', function (event) {
      if (event.target.closest('[data-checkout-form]') && !window.__AIELabCheckoutFormStarted) {
        window.__AIELabCheckoutFormStarted = true;
        window.AIELabAnalytics.formStart('demo_checkout');
      }
    });

    window.addEventListener('cart:updated', updateCartCount);
  }

  function init() {
    renderHeader();
    renderFooter();
    renderFeatured();
    renderProductsList();
    renderProductDetail();
    renderCart();
    renderCheckout();
    renderThankYou();
    renderBlogList();
    renderTrafficTests();
    renderArticleDetail();
    renderPromotion();
    renderSearchResults();
    renderNewsletter();
    bindGlobalEvents();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
