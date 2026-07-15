(function () {
  const CART_KEY = 'aiEcommerceLabCart';
  const ORDER_KEY = 'aiEcommerceLabLastOrder';
  const PURCHASED_KEY_PREFIX = 'aiEcommerceLabPurchased:';

  function parseJson(value, fallback) {
    try {
      return value ? JSON.parse(value) : fallback;
    } catch (error) {
      return fallback;
    }
  }

  function getProducts() {
    return window.AIELabProducts || [];
  }

  function findProduct(id) {
    return getProducts().find(function (product) { return product.item_id === id; });
  }

  function rawCart() {
    return parseJson(window.localStorage.getItem(CART_KEY), []);
  }

  function saveRawCart(items) {
    window.localStorage.setItem(CART_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent('cart:updated'));
  }

  function hydrateCart() {
    return rawCart().map(function (item) {
      const product = findProduct(item.item_id);
      if (!product) {
        return null;
      }
      return {
        product: product,
        quantity: Math.max(1, Number(item.quantity) || 1)
      };
    }).filter(Boolean);
  }

  function addItem(productId, quantity) {
    const product = findProduct(productId);
    if (!product) {
      return false;
    }
    const qty = Math.max(1, Number(quantity) || 1);
    const cart = rawCart();
    const existing = cart.find(function (item) { return item.item_id === productId; });
    if (existing) {
      existing.quantity = Math.max(1, Number(existing.quantity) || 1) + qty;
    } else {
      cart.push({ item_id: productId, quantity: qty });
    }
    saveRawCart(cart);
    return product;
  }

  function setQuantity(productId, quantity) {
    const qty = Number(quantity);
    let cart = rawCart();
    if (qty <= 0) {
      cart = cart.filter(function (item) { return item.item_id !== productId; });
    } else {
      cart = cart.map(function (item) {
        if (item.item_id === productId) {
          return { item_id: item.item_id, quantity: Math.max(1, qty) };
        }
        return item;
      });
    }
    saveRawCart(cart);
  }

  function removeItem(productId) {
    const item = hydrateCart().find(function (cartItem) {
      return cartItem.product.item_id === productId;
    });
    saveRawCart(rawCart().filter(function (cartItem) {
      return cartItem.item_id !== productId;
    }));
    return item;
  }

  function clearCart() {
    window.localStorage.removeItem(CART_KEY);
    window.dispatchEvent(new CustomEvent('cart:updated'));
  }

  function subtotal(cartItems) {
    return window.AIELabAnalytics.roundMoney(cartItems.reduce(function (sum, item) {
      return sum + item.product.price * item.quantity;
    }, 0));
  }

  function shipping(cartItems, method) {
    if (!cartItems.length) {
      return 0;
    }
    if (method === 'express') {
      return 14.99;
    }
    return 4.99;
  }

  function tax(cartItems) {
    return window.AIELabAnalytics.roundMoney(subtotal(cartItems) * 0.08);
  }

  function totals(cartItems, method) {
    const itemsSubtotal = subtotal(cartItems);
    const shippingValue = shipping(cartItems, method || 'standard');
    const taxValue = tax(cartItems);
    return {
      subtotal: itemsSubtotal,
      shipping: shippingValue,
      tax: taxValue,
      total: window.AIELabAnalytics.roundMoney(itemsSubtotal + shippingValue + taxValue)
    };
  }

  function createOrder(options) {
    const cartItems = hydrateCart();
    const method = options.shippingMethod || 'standard';
    const orderTotals = totals(cartItems, method);
    const order = {
      transaction_id: 'DEMO-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8).toUpperCase(),
      created_at: new Date().toISOString(),
      shipping_method: method,
      payment_method: options.paymentMethod || 'demo-card',
      items: cartItems,
      subtotal: orderTotals.subtotal,
      shipping: orderTotals.shipping,
      tax: orderTotals.tax,
      total: orderTotals.total
    };
    window.sessionStorage.setItem(ORDER_KEY, JSON.stringify(order));
    window.localStorage.setItem(ORDER_KEY, JSON.stringify(order));
    return order;
  }

  function getLastOrder() {
    return parseJson(window.sessionStorage.getItem(ORDER_KEY), null) || parseJson(window.localStorage.getItem(ORDER_KEY), null);
  }

  function hasSentPurchase(transactionId) {
    return window.localStorage.getItem(PURCHASED_KEY_PREFIX + transactionId) === '1';
  }

  function markPurchaseSent(transactionId) {
    window.localStorage.setItem(PURCHASED_KEY_PREFIX + transactionId, '1');
  }

  window.AIELabCart = {
    getItems: hydrateCart,
    addItem,
    setQuantity,
    removeItem,
    clearCart,
    totals,
    createOrder,
    getLastOrder,
    hasSentPurchase,
    markPurchaseSent
  };
})();
