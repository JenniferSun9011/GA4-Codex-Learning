(function () {
  const MEASUREMENT_ID = 'G-1SKTM8X221';
  const GA4_DEBUG = true;

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () {
    window.dataLayer.push(arguments);
  };

  if (!window.__AIELabGtagLoaded) {
    window.__AIELabGtagLoaded = true;
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(MEASUREMENT_ID);
    document.head.appendChild(script);
    window.gtag('js', new Date());
    window.gtag('config', MEASUREMENT_ID);
  }

  function roundMoney(value) {
    return Math.round((Number(value) || 0) * 100) / 100;
  }

  function toGa4Item(product, quantity, index) {
    return {
      item_id: product.item_id,
      item_name: product.item_name,
      item_brand: product.item_brand,
      item_category: product.item_category,
      price: roundMoney(product.price),
      quantity: Number(quantity) || 1,
      index: typeof index === 'number' ? index : undefined
    };
  }

  function debugEvent(eventName, params) {
    if (!GA4_DEBUG || !window.console) {
      return;
    }
    console.log('[GA4 EVENT] ' + eventName, params || {});
  }

  function sendEvent(eventName, params) {
    const payload = Object.assign({
      transport_type: 'beacon',
      environment: 'training',
      training_scenario: getTrainingScenario()
    }, params || {});
    debugEvent(eventName, payload);
    if (typeof window.gtag === 'function') {
      window.gtag('event', eventName, payload);
      if (GA4_DEBUG) {
        console.log('[GA4] ' + eventName + ' sent');
      }
    }
  }

  function getTrainingScenario() {
    const query = new URLSearchParams(window.location.search);
    if (query.get('utm_campaign')) {
      return query.get('utm_campaign');
    }
    return document.body.getAttribute('data-page') || 'site_navigation';
  }

  function listParams(products, listId, listName) {
    return {
      item_list_id: listId,
      item_list_name: listName,
      items: products.map(function (product, index) {
        return toGa4Item(product, 1, index + 1);
      })
    };
  }

  function cartParams(cartItems) {
    const items = cartItems.map(function (item, index) {
      return toGa4Item(item.product, item.quantity, index + 1);
    });
    return {
      currency: 'USD',
      value: roundMoney(items.reduce(function (sum, item) {
        return sum + item.price * item.quantity;
      }, 0)),
      items: items
    };
  }

  window.AIELabAnalytics = {
    measurementId: MEASUREMENT_ID,
    debug: GA4_DEBUG,
    roundMoney,
    toGa4Item,
    sendEvent,
    viewItemList(products, listId, listName) {
      sendEvent('view_item_list', listParams(products, listId, listName));
    },
    selectItem(product, listId, listName) {
      sendEvent('select_item', {
        item_list_id: listId,
        item_list_name: listName,
        items: [toGa4Item(product, 1, 1)]
      });
    },
    viewItem(product) {
      sendEvent('view_item', {
        currency: product.currency,
        value: roundMoney(product.price),
        items: [toGa4Item(product, 1, 1)]
      });
    },
    addToCart(product, quantity) {
      const qty = Number(quantity) || 1;
      sendEvent('add_to_cart', {
        currency: product.currency,
        value: roundMoney(product.price * qty),
        items: [toGa4Item(product, qty, 1)]
      });
    },
    viewCart(cartItems) {
      sendEvent('view_cart', cartParams(cartItems));
    },
    removeFromCart(product, quantity) {
      const qty = Number(quantity) || 1;
      sendEvent('remove_from_cart', {
        currency: product.currency,
        value: roundMoney(product.price * qty),
        items: [toGa4Item(product, qty, 1)]
      });
    },
    beginCheckout(cartItems) {
      sendEvent('begin_checkout', cartParams(cartItems));
    },
    addShippingInfo(cartItems, shippingTier, shippingValue) {
      const params = cartParams(cartItems);
      params.shipping_tier = shippingTier;
      params.shipping = roundMoney(shippingValue);
      sendEvent('add_shipping_info', params);
    },
    addPaymentInfo(cartItems, paymentType) {
      const params = cartParams(cartItems);
      params.payment_type = paymentType;
      sendEvent('add_payment_info', params);
    },
    purchase(order) {
      sendEvent('purchase', {
        transaction_id: order.transaction_id,
        currency: 'USD',
        value: roundMoney(order.total),
        tax: roundMoney(order.tax),
        shipping: roundMoney(order.shipping),
        coupon: order.coupon || undefined,
        discount: roundMoney(order.discount),
        items: order.items.map(function (item, index) {
          return toGa4Item(item.product, item.quantity, index + 1);
        })
      });
    },
    trafficTestClick(testType, label, linkUrl) {
      sendEvent('traffic_test_click', {
        test_type: testType,
        link_label: label,
        link_url: linkUrl,
        event_timeout: 2000
      });
    },
    search(searchTerm, resultsCount) {
      sendEvent('search', {
        search_term: searchTerm,
        results_count: Number(resultsCount) || 0
      });
    },
    viewSearchResults(searchTerm, products) {
      sendEvent('view_search_results', Object.assign({
        search_term: searchTerm,
        results_count: products.length
      }, listParams(products, 'site_search', 'Site Search Results')));
    },
    viewPromotion(promotion) {
      sendEvent('view_promotion', {
        promotion_id: promotion.id,
        promotion_name: promotion.name,
        creative_name: promotion.creative,
        items: [toGa4Item(promotion.product, 1, 1)]
      });
    },
    selectPromotion(promotion) {
      sendEvent('select_promotion', {
        promotion_id: promotion.id,
        promotion_name: promotion.name,
        creative_name: promotion.creative,
        items: [toGa4Item(promotion.product, 1, 1)]
      });
    },
    generateLead(leadType, source) {
      sendEvent('generate_lead', {
        lead_type: leadType,
        lead_source: source
      });
    },
    addToWishlist(product) {
      sendEvent('add_to_wishlist', {
        currency: product.currency,
        value: roundMoney(product.price),
        items: [toGa4Item(product, 1, 1)]
      });
    },
    applyCoupon(coupon, discountValue, status) {
      sendEvent('apply_coupon', {
        coupon: coupon || 'none',
        discount_value: roundMoney(discountValue),
        coupon_status: status
      });
    },
    selectShippingOption(cartItems, shippingTier, shippingValue) {
      sendEvent('select_shipping_option', {
        shipping_tier: shippingTier,
        shipping: roundMoney(shippingValue),
        value: cartParams(cartItems).value
      });
    },
    formStart(formName) {
      sendEvent('form_start', { form_name: formName });
    },
    formError(formName, errorType) {
      sendEvent('form_error', {
        form_name: formName,
        error_type: errorType
      });
    },
    checkoutError(errorType, paymentType) {
      sendEvent('checkout_error', {
        error_type: errorType,
        payment_type: paymentType
      });
    },
    paymentFailed(paymentType) {
      sendEvent('payment_failed', {
        payment_type: paymentType
      });
    }
  };
})();
