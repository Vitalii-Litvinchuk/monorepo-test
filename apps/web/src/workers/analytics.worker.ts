// Web Worker for offloading heavy multi-currency calculations and search indexing

self.onmessage = (event: MessageEvent) => {
  const { type, payload } = event.data;

  if (type === 'CALCULATE_TOTALS') {
    const { products } = payload;
    let totalUah = 0;
    let totalUsd = 0;

    for (const prod of products) {
      if (prod.prices) {
        for (const pr of prod.prices) {
          if (pr.currencyCode === 'UAH') totalUah += pr.value;
          else if (pr.currencyCode === 'USD') totalUsd += pr.value;
        }
      }
    }

    self.postMessage({
      type: 'TOTALS_CALCULATED',
      result: { totalUah, totalUsd, count: products.length },
    });
  }

  if (type === 'FILTER_PRODUCTS') {
    const { products, query } = payload;
    const lower = query.toLowerCase().trim();
    const filtered = products.filter((p: any) => {
      return (
        p.title.toLowerCase().includes(lower) ||
        String(p.serialNumber).includes(lower) ||
        (p.specification && p.specification.toLowerCase().includes(lower))
      );
    });

    self.postMessage({
      type: 'PRODUCTS_FILTERED',
      result: filtered,
    });
  }
};
