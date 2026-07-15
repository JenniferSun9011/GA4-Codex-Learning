(function () {
  const svgData = function (title, colorA, colorB) {
    const svg = [
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 560" role="img" aria-label="' + title + '">',
      '<defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="' + colorA + '"/><stop offset="1" stop-color="' + colorB + '"/></linearGradient></defs>',
      '<rect width="800" height="560" rx="36" fill="url(#g)"/>',
      '<rect x="160" y="120" width="480" height="320" rx="32" fill="#ffffff" opacity=".9"/>',
      '<rect x="198" y="156" width="404" height="248" rx="18" fill="#12323a"/>',
      '<circle cx="400" cy="424" r="12" fill="#12323a"/>',
      '<text x="400" y="290" text-anchor="middle" font-family="Arial" font-size="34" font-weight="700" fill="#ffffff">' + title + '</text>',
      '</svg>'
    ].join('');
    return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
  };

  const products = [
    {
      item_id: 'tablet-x1',
      item_name: 'Rugged Tablet X1',
      item_brand: 'AI Ecommerce Lab',
      item_category: 'Rugged Tablets',
      price: 199.99,
      currency: 'USD',
      description: 'A durable tablet for field work, warehouse checks, and outdoor ecommerce operations.',
      features: ['10-inch readable display', 'Drop-resistant body', 'All-day demo battery', 'Barcode workflow ready'],
      specs: ['Screen: 10.1 inch', 'Storage: 128 GB demo spec', 'Use case: field operations'],
      image: svgData('Rugged Tablet X1', '#0f766e', '#38bdf8'),
      alt: 'Illustration of Rugged Tablet X1 demo product'
    },
    {
      item_id: 'phone-pro',
      item_name: 'Rugged Phone Pro',
      item_brand: 'AI Ecommerce Lab',
      item_category: 'Rugged Phones',
      price: 329.99,
      currency: 'USD',
      description: 'A compact rugged phone designed for mobile teams that need reliable shopping and scanning workflows.',
      features: ['Compact field device', 'Glove-friendly controls', 'Fast checkout testing path', 'Strong demo connectivity'],
      specs: ['Screen: 6.4 inch', 'Storage: 256 GB demo spec', 'Use case: mobile selling'],
      image: svgData('Rugged Phone Pro', '#1d4ed8', '#22c55e'),
      alt: 'Illustration of Rugged Phone Pro demo product'
    },
    {
      item_id: 'watch-outdoor',
      item_name: 'Outdoor Smartwatch',
      item_brand: 'AI Ecommerce Lab',
      item_category: 'Smartwatches',
      price: 129.99,
      currency: 'USD',
      description: 'A lightweight smartwatch for outdoor activity tracking and accessory funnel analysis.',
      features: ['Outdoor tracking modes', 'Water-resistant demo spec', 'Accessory cross-sell fit', 'Lightweight design'],
      specs: ['Display: 1.5 inch', 'Battery: 7-day demo spec', 'Use case: outdoor users'],
      image: svgData('Outdoor Smartwatch', '#7c3aed', '#f59e0b'),
      alt: 'Illustration of Outdoor Smartwatch demo product'
    }
  ];

  const articles = [
    {
      id: 'rugged-tablet-guide',
      title: 'How to Choose a Rugged Tablet',
      summary: 'A practical buyer guide for teams comparing durability, screen size, and field workflow needs.',
      recommendedProductId: 'tablet-x1',
      seoKeyword: 'how to choose a rugged tablet',
      searchIntent: 'Commercial investigation',
      trafficGoal: 'Drive readers from buyer education to Rugged Tablet X1 product detail views.',
      body: [
        'A rugged tablet is usually the best fit when shoppers need a larger screen, product catalog access, or warehouse workflow support.',
        'For GA4 analysis, this article is useful for testing visitors who spend time with educational content before viewing a high-intent product page.',
        'The main conversion question is whether content traffic moves from article engagement into product detail views and cart additions.'
      ]
    },
    {
      id: 'mobile-desktop-shopping',
      title: 'Mobile vs Desktop Shopping Experience',
      summary: 'Compare how mobile and desktop shoppers move through discovery, cart, and checkout paths.',
      recommendedProductId: 'phone-pro',
      seoKeyword: 'mobile vs desktop ecommerce shopping',
      searchIntent: 'Informational analysis',
      trafficGoal: 'Compare mobile and desktop engagement before product clicks and checkout starts.',
      body: [
        'Mobile shoppers need clear product cards, short paths to cart, and checkout controls that avoid horizontal scrolling.',
        'Desktop shoppers often compare more details before moving forward, so product specs and category context matter.',
        'Use this page to compare device category traffic, engagement, product clicks, and checkout starts in GA4.'
      ]
    },
    {
      id: 'ga4-funnel-basics',
      title: 'GA4 Ecommerce Funnel Basics',
      summary: 'Learn the key ecommerce events that make product and checkout funnel diagnosis possible.',
      recommendedProductId: 'watch-outdoor',
      seoKeyword: 'GA4 ecommerce funnel basics',
      searchIntent: 'Educational learning',
      trafficGoal: 'Validate content-assisted journeys from GA4 learning content to product exploration.',
      body: [
        'A clean GA4 ecommerce funnel starts with view_item_list, select_item, view_item, add_to_cart, begin_checkout, and purchase.',
        'Each event needs stable item IDs, names, categories, prices, quantities, and values so later reporting can be trusted.',
        'This article helps test content paths that educate visitors before they enter the ecommerce journey.'
      ]
    }
  ];

  const trafficTests = [
    {
      group: 'Referral test links',
      id: 'referral',
      description: 'Use these links to simulate traffic from partner content, community discussions, and review placements.',
      links: [
        {
          label: 'Partner review to rugged tablet guide',
          path: 'article.html',
          params: {
            id: 'rugged-tablet-guide',
            utm_source: 'partner-review',
            utm_medium: 'referral',
            utm_campaign: 'phase3_referral_test',
            utm_content: 'rugged_tablet_review'
          }
        },
        {
          label: 'Community forum to mobile shopping guide',
          path: 'article.html',
          params: {
            id: 'mobile-desktop-shopping',
            utm_source: 'field-ops-forum',
            utm_medium: 'referral',
            utm_campaign: 'phase3_referral_test',
            utm_content: 'mobile_shopping_thread'
          }
        },
        {
          label: 'Review roundup to product page',
          path: 'product.html',
          params: {
            id: 'watch-outdoor',
            utm_source: 'outdoor-review-roundup',
            utm_medium: 'referral',
            utm_campaign: 'phase3_referral_test',
            utm_content: 'smartwatch_roundup_cta'
          }
        }
      ]
    },
    {
      group: 'AI traffic test links',
      id: 'ai',
      description: 'Use these links to simulate visitors arriving from AI assistant recommendations or AI search summaries.',
      links: [
        {
          label: 'ChatGPT-style answer to GA4 funnel guide',
          path: 'article.html',
          params: {
            id: 'ga4-funnel-basics',
            utm_source: 'chatgpt',
            utm_medium: 'ai_assistant',
            utm_campaign: 'phase3_ai_traffic_test',
            utm_content: 'ga4_funnel_answer'
          }
        },
        {
          label: 'Perplexity-style citation to rugged tablet guide',
          path: 'article.html',
          params: {
            id: 'rugged-tablet-guide',
            utm_source: 'perplexity',
            utm_medium: 'ai_assistant',
            utm_campaign: 'phase3_ai_traffic_test',
            utm_content: 'rugged_tablet_citation'
          }
        },
        {
          label: 'Gemini-style recommendation to phone product',
          path: 'product.html',
          params: {
            id: 'phone-pro',
            utm_source: 'gemini',
            utm_medium: 'ai_assistant',
            utm_campaign: 'phase3_ai_traffic_test',
            utm_content: 'rugged_phone_recommendation'
          }
        }
      ]
    }
  ];

  window.AIELabProducts = products;
  window.AIELabArticles = articles;
  window.AIELabTrafficTests = trafficTests;
  window.AIELabData = {
    products,
    articles,
    trafficTests,
    findProduct(id) {
      return products.find(function (product) { return product.item_id === id; });
    },
    findArticle(id) {
      return articles.find(function (article) { return article.id === id; });
    }
  };
})();
