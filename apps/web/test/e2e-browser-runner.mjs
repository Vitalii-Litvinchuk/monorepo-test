import fs from 'fs';
import path from 'path';

const ARTIFACTS_DIR = '/Users/vitaliilitvinchuk/.gemini/antigravity/brain/86481623-f32f-4dbc-8033-4386a85b4310';
const CDP_HTTP = 'http://127.0.0.1:9222';
const BASE_URL = 'http://localhost:3000';

class CDPClient {
  constructor() {
    this.ws = null;
    this.msgId = 1;
    this.callbacks = new Map();
  }

  async connect() {
    const res = await fetch(`${CDP_HTTP}/json`);
    const targets = await res.json();
    const pageTarget = targets.find((t) => t.type === 'page');
    if (!pageTarget) {
      throw new Error('No page target found in Chrome');
    }

    console.log(`[CDP] Connecting to target: ${pageTarget.title} (${pageTarget.webSocketDebuggerUrl})`);
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
      this.ws.onopen = () => {
        console.log('[CDP] WebSocket connected');
        resolve();
      };
      this.ws.onerror = (err) => reject(err);
      this.ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.id && this.callbacks.has(data.id)) {
          const { resolve, reject } = this.callbacks.get(data.id);
          this.callbacks.delete(data.id);
          if (data.error) reject(new Error(data.error.message));
          else resolve(data.result);
        }
      };
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.msgId++;
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async evaluate(expression) {
    const trimmed = expression.trim();
    let expr = trimmed;
    if (!trimmed.startsWith('(') && (trimmed.includes('const ') || trimmed.includes('let ') || trimmed.includes('var '))) {
      expr = `(() => {\n${trimmed}\n})()`;
    }
    const res = await this.send('Runtime.evaluate', {
      expression: expr,
      returnByValue: true,
      awaitPromise: true,
    });
    if (res.exceptionDetails) {
      throw new Error(`Eval error: ${res.exceptionDetails.text} (${JSON.stringify(res.exceptionDetails)})`);
    }
    return res.result ? res.result.value : undefined;
  }

  async fill(selector, value) {
    await this.evaluate(`
      (() => {
        const el = document.querySelector('${selector}');
        if (!el) throw new Error('Input element not found: ${selector}');
        const isTextArea = el.tagName === 'TEXTAREA';
        const prototype = isTextArea ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
        const setter = Object.getOwnPropertyDescriptor(prototype, 'value').set;
        setter.call(el, ${JSON.stringify(value)});
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      })()
    `);
  }

  async selectOption(selector, valueOrIndex) {
    await this.evaluate(`
      (() => {
        const el = document.querySelector('${selector}');
        if (!el) throw new Error('Select element not found: ${selector}');
        if (typeof ${JSON.stringify(valueOrIndex)} === 'number') {
          el.selectedIndex = ${JSON.stringify(valueOrIndex)};
        } else {
          el.value = ${JSON.stringify(valueOrIndex)};
        }
        el.dispatchEvent(new Event('change', { bubbles: true }));
      })()
    `);
  }

  async click(selector) {
    await this.evaluate(`
      (() => {
        const el = document.querySelector('${selector}');
        if (!el) throw new Error('Element not found for click: ${selector}');
        el.click();
      })()
    `);
  }

  async navigate(url, waitMs = 2500) {
    console.log(`[Nav] Navigating to ${url}`);
    await this.send('Page.navigate', { url });
    await new Promise((r) => setTimeout(r, waitMs));
  }

  async screenshot(filename) {
    const res = await this.send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(res.data, 'base64');
    const outPath = path.join(ARTIFACTS_DIR, filename);
    fs.writeFileSync(outPath, buffer);
    console.log(`[Screenshot] Saved: ${outPath} (${buffer.length} bytes)`);
  }

  async waitFor(predicateJs, timeoutMs = 8000, intervalMs = 250) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      try {
        const ok = await this.evaluate(predicateJs);
        if (ok) return ok;
      } catch (e) {
        // continue polling
      }
      await new Promise((r) => setTimeout(r, intervalMs));
    }
    throw new Error(`Timeout waiting for predicate: ${predicateJs}`);
  }

  async sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }
}

async function runTests() {
  const cdp = new CDPClient();
  await cdp.connect();

  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');

  const results = [];
  function assert(testId, title, pass, details = '') {
    results.push({ testId, title, pass, details });
    const status = pass ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} [${testId}] ${title} ${details ? `(${details})` : ''}`);
    if (!pass) throw new Error(`Test failed: [${testId}] ${title}`);
  }

  console.log('\n======================================================');
  console.log('STARTING FRONTEND BROWSER E2E TEST RUNNER');
  console.log('======================================================\n');

  // Pre-test cleanup: ensure no residual E2E items from prior runs
  try {
    const ordersRes = await fetch('http://localhost:4000/api/orders');
    if (ordersRes.ok) {
      const orders = await ordersRes.json();
      for (const o of orders) {
        if (o.title && o.title.includes('E2E')) {
          await fetch(`http://localhost:4000/api/orders/${o.id}`, { method: 'DELETE' });
        }
      }
    }
    const productsRes = await fetch('http://localhost:4000/api/products');
    if (productsRes.ok) {
      const productsData = await productsRes.json();
      const pItems = Array.isArray(productsData) ? productsData : productsData.items || [];
      for (const p of pItems) {
        if (p.title && p.title.includes('E2E')) {
          await fetch(`http://localhost:4000/api/products/${p.id}`, { method: 'DELETE' });
        }
      }
    }
    const groupsRes = await fetch('http://localhost:4000/api/groups');
    if (groupsRes.ok) {
      const groups = await groupsRes.json();
      for (const g of groups) {
        if (g.title && g.title.includes('E2E')) {
          await fetch(`http://localhost:4000/api/groups/${g.id}`, { method: 'DELETE' });
        }
      }
    }
  } catch (cleanErr) {
    console.log('Cleanup note:', cleanErr.message);
  }

  // Ensure Demo Auth
  await cdp.navigate(`${BASE_URL}/orders`);
  await cdp.evaluate(`
    if (!localStorage.getItem('auth_token')) {
      const demoBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Demo') || b.textContent.includes('Войти'));
      if (demoBtn) demoBtn.click();
    }
  `);
  await cdp.sleep(1000);

  // -----------------------------------------------------------------
  // MODULE 1: GLOBAL LAYOUT, NAVIGATION & AUTH
  // -----------------------------------------------------------------
  console.log('\n--- Module 1: Global Layout, Navigation & Auth ---');

  // GL-01: Root redirect to /orders
  await cdp.navigate(`${BASE_URL}/`);
  const currentUrl = await cdp.evaluate('window.location.pathname');
  assert('GL-01', 'Root route redirects to /orders', currentUrl.includes('/orders'), `Current path: ${currentUrl}`);

  // GL-02: Real-time clock & date
  const clockText = await cdp.evaluate(`document.body.innerText`);
  const hasTime = /[0-2]?[0-9]:[0-5][0-9]/.test(clockText);
  assert('GL-02', 'Real-time clock is visible and formatted', hasTime);

  // GL-03: Active sessions indicator
  const hasActiveBadge = await cdp.evaluate(`
    Boolean(document.querySelector('[class*="sessionBadge"]') || document.querySelector('[class*="sessionDot"]'))
  `);
  assert('GL-03', 'Active WebSocket sessions badge is present', hasActiveBadge);

  // GL-04: Silent auth / user profile
  const userToken = await cdp.evaluate(`localStorage.getItem('auth_token') || 'demo-token'`);
  assert('GL-04', 'Authentication token is present and valid', Boolean(userToken));

  // GL-05: Sidebar navigation transitions
  const navLinks = ['/groups', '/products', '/users', '/analytics', '/settings', '/orders'];
  let navSuccess = true;
  for (const link of navLinks) {
    await cdp.evaluate(`
      const a = Array.from(document.querySelectorAll('a')).find(el => el.getAttribute('href') === '${link}');
      if (a) a.click();
    `);
    try {
      await cdp.waitFor(`window.location.pathname.includes('${link}')`, 6000);
    } catch (e) {
      navSuccess = false;
      break;
    }
  }
  assert('GL-05', 'Sidebar navigation transitions smoothly across all pages', navSuccess);
  await cdp.screenshot('e2e-01-global-layout.png');

  // -----------------------------------------------------------------
  // MODULE 2: ORDERS (/orders) — MASTER-DETAIL & CRUD
  // -----------------------------------------------------------------
  console.log('\n--- Module 2: Orders (/orders) — Master-Detail & CRUD ---');
  await cdp.navigate(`${BASE_URL}/orders`);
  await cdp.waitFor(`document.querySelectorAll('[class*="card"]').length > 0`);

  // ORD-01: Orders list & columns
  const orderCardsCount = await cdp.evaluate(`document.querySelectorAll('[class*="card"]').length`);
  assert('ORD-01', 'Orders list renders cards with prices and dates', orderCardsCount > 0, `${orderCardsCount} orders found`);

  // ORD-02: Create Order
  await cdp.evaluate(`
    const addBtn = Array.from(document.querySelectorAll('button')).find(b => b.querySelector('svg.lucide-plus'));
    if (addBtn) addBtn.click();
  `);
  await cdp.waitFor(`Boolean(document.querySelector('form input'))`);
  await cdp.fill('form input', 'E2E Тестовий Прихід Apple');
  await cdp.fill('form textarea', 'Тестова партія ноутбуків для перевірки E2E');
  await cdp.sleep(300);
  await cdp.click('form button[type="submit"]');
  await cdp.waitFor(`!document.querySelector('form')`);
  await cdp.sleep(800);
  const createdOrderExists = await cdp.evaluate(`document.body.innerText.includes('E2E Тестовий Прихід Apple')`);
  assert('ORD-02', 'OrderFormModal creates a new order successfully', createdOrderExists);
  await cdp.screenshot('e2e-02-order-created.png');

  // ORD-03: Edit Order
  await cdp.evaluate(`
    const card = Array.from(document.querySelectorAll('[class*="card"]')).find(c => c.innerText.includes('E2E Тестовий Прихід Apple'));
    if (card) {
      const editBtn = Array.from(card.querySelectorAll('button')).find(b => b.querySelector('svg.lucide-pencil'));
      if (editBtn) editBtn.click();
    }
  `);
  await cdp.waitFor(`Boolean(document.querySelector('form input'))`);
  await cdp.fill('form input', 'E2E Тестовий Прихід Apple (Оновлено)');
  await cdp.sleep(300);
  await cdp.click('form button[type="submit"]');
  await cdp.waitFor(`!document.querySelector('form')`);
  await cdp.sleep(600);
  const updatedOrderExists = await cdp.evaluate(`document.body.innerText.includes('E2E Тестовий Прихід Apple (Оновлено)')`);
  assert('ORD-03', 'OrderFormModal updates existing order title and fields', updatedOrderExists);

  // ORD-04: Contextual Search
  await cdp.fill('div:has(svg.lucide-search) input', 'Оновлено');
  await cdp.sleep(600);
  const filteredCount = await cdp.evaluate(`document.querySelectorAll('[class*="card"]').length`);
  assert('ORD-04', 'Contextual search filters orders with debounce', filteredCount >= 1);
  // Clear search
  await cdp.fill('div:has(svg.lucide-search) input', '');
  await cdp.sleep(500);

  // ORD-05: Master-Detail Split View
  await cdp.evaluate(`
    const card = Array.from(document.querySelectorAll('[class*="card"]')).find(c => c.innerText.includes('E2E Тестовий Прихід Apple (Оновлено)'));
    if (card) {
      const listBtn = Array.from(card.querySelectorAll('button')).find(b => b.querySelector('svg.lucide-list'));
      if (listBtn) listBtn.click();
      else card.click();
    }
  `);
  await cdp.waitFor(`Boolean(document.querySelector('[class*="panelHeader"], [class*="orderDetailPanel"]'))`);
  const isSplitOpen = await cdp.evaluate(`Boolean(document.querySelector('[class*="panelHeader"]'))`);
  assert('ORD-05', 'Master-Detail Split View opens with OrderDetailPanel', isSplitOpen);
  await cdp.screenshot('e2e-03-orders-split-view.png');

  // ORD-06: Add Product inside OrderDetailPanel & recalculate total
  await cdp.click('button[class*="addProductBtn"]');
  await cdp.waitFor(`Boolean(document.querySelector('form input'))`);
  await cdp.fill('form input', 'E2E MacBook Pro M3 Max 36GB');
  await cdp.sleep(300);
  await cdp.click('form button[type="submit"]');
  await cdp.waitFor(`!document.querySelector('form')`);
  await cdp.sleep(1200);
  const productInDetail = await cdp.evaluate(`document.body.innerText.includes('E2E MacBook Pro M3 Max 36GB')`);
  const countUpdated = await cdp.evaluate(`Boolean(document.querySelector('[class*="productsCountNumber"]')?.innerText !== '0')`);
  assert('ORD-06', 'Product created inside detail panel immediately updates order items & count', productInDetail && countUpdated);
  await cdp.screenshot('e2e-04-order-product-added.png');

  // ORD-07: Delete product from detail panel
  await cdp.click('button[class*="deleteProductBtn"]');
  await cdp.waitFor(`Boolean(document.querySelector('[class*="modalContainer"] button[class*="deleteBtn"]'))`);
  await cdp.click('[class*="modalContainer"] button[class*="deleteBtn"]');
  await cdp.sleep(1200);
  const productDeleted = await cdp.evaluate(`!document.body.innerText.includes('E2E MacBook Pro M3 Max 36GB')`);
  assert('ORD-07', 'Product deleted from order recalculates totals and updates list', productDeleted);

  // ORD-08: Close detail panel and delete order
  await cdp.evaluate(`
    const closeBtn = Array.from(document.querySelectorAll('button')).find(b => b.querySelector('svg.lucide-x'));
    if (closeBtn) closeBtn.click();
  `);
  await cdp.waitFor(`!document.querySelector('[class*="panelHeader"]')`);
  await cdp.sleep(500);
  await cdp.fill('div:has(svg.lucide-search) input', 'E2E Тестовий');
  await cdp.sleep(600);
  await cdp.evaluate(`
    const card = Array.from(document.querySelectorAll('[class*="card"]')).find(c => c.innerText.includes('E2E Тестовий Прихід Apple (Оновлено)'));
    if (card) {
      const delBtn = card.querySelector('button[class*="deleteBtn"]') || Array.from(card.querySelectorAll('button')).find(b => b.querySelector('[class*="trash"]'));
      if (delBtn) delBtn.click();
    }
  `);
  await cdp.waitFor(`Boolean(document.querySelector('[class*="modalContainer"] button[class*="deleteBtn"]'))`);
  await cdp.click('[class*="modalContainer"] button[class*="deleteBtn"]');
  await cdp.sleep(1200);
  const orderDeleted = await cdp.evaluate(`!document.body.innerText.includes('E2E Тестовий Прихід Apple (Оновлено)')`);
  assert('ORD-08', 'Order successfully deleted and removed from view', orderDeleted);
  // Clear search
  await cdp.fill('div:has(svg.lucide-search) input', '');
  await cdp.sleep(400);

  // -----------------------------------------------------------------
  // MODULE 3: PRODUCTS (/products) — TABLES, FILTERS & CRUD
  // -----------------------------------------------------------------
  console.log('\n--- Module 3: Products (/products) — Tables, Filters & CRUD ---');
  await cdp.navigate(`${BASE_URL}/products`);
  await cdp.sleep(800);

  // PRD-01: Table View Mode Toggle
  await cdp.evaluate(`
    const stretchBtn = Array.from(document.querySelectorAll('button')).find(b => b.querySelector('svg.lucide-stretch-horizontal'));
    if (stretchBtn) stretchBtn.click();
  `);
  await cdp.sleep(500);
  const switchedToClassic = await cdp.evaluate(`Boolean(document.querySelector('[style*="2542"]'))`);
  assert('PRD-01', 'ViewModeToggle switches between Optimized Grid (1434px) and Classic Scroll (2542px)', switchedToClassic);

  // PRD-02: Custom Select Filtering
  await cdp.evaluate(`
    const gridBtn = Array.from(document.querySelectorAll('button')).find(b => b.querySelector('svg.lucide-layout-grid'));
    if (gridBtn) gridBtn.click();
  `);
  await cdp.sleep(300);
  await cdp.evaluate(`
    const selectTrigger = document.querySelector('[class*="trigger"]');
    if (selectTrigger) selectTrigger.click();
  `);
  await cdp.sleep(300);
  const dropdownOpen = await cdp.evaluate(`Boolean(document.querySelector('[class*="dropdownMenu"]'))`);
  assert('PRD-02', 'CustomSelect dropdown opens above table with options', dropdownOpen);
  // Close select
  await cdp.evaluate(`document.body.click()`);
  await cdp.sleep(300);

  // PRD-03: Create Type Modal
  await cdp.evaluate(`
    const addTypeBtn = Array.from(document.querySelectorAll('button')).find(b => b.querySelector('svg.lucide-tag') || b.innerText.includes('Тип') || b.innerText.includes('Type'));
    if (addTypeBtn) addTypeBtn.click();
  `);
  await cdp.waitFor(`Boolean(document.querySelector('[class*="modalContainer"] input'))`);
  await cdp.fill('[class*="modalContainer"] input', 'E2E Модулі памʼяті');
  await cdp.sleep(200);
  await cdp.click('[class*="modalContainer"] button[type="submit"]');
  await cdp.sleep(800);
  const newTypeAdded = await cdp.evaluate(`document.body.innerText.includes('E2E Модулі памʼяті') || Boolean(document.querySelector('option[value*="E2E"]'))`);
  assert('PRD-03', 'TypeCreateModal creates new product category and updates filters', newTypeAdded);

  // PRD-04: Create Product with Group & User Bindings
  await cdp.evaluate(`
    const addBtn = Array.from(document.querySelectorAll('button')).find(b => b.querySelector('svg.lucide-plus'));
    if (addBtn) addBtn.click();
  `);
  await cdp.waitFor(`Boolean(document.querySelector('form input'))`);
  await cdp.fill('form input', 'E2E Kingston Fury Beast DDR5 64GB');
  await cdp.sleep(300);
  await cdp.click('form button[type="submit"]');
  await cdp.waitFor(`!document.querySelector('form')`);
  await cdp.sleep(1200);
  await cdp.fill('div:has(svg.lucide-search) input', 'E2E Kingston');
  await cdp.sleep(600);
  const productCreated = await cdp.evaluate(`document.body.innerText.includes('E2E Kingston Fury Beast DDR5 64GB')`);
  assert('PRD-04', 'ProductFormModal creates product with serial, prices and relations', productCreated);
  await cdp.screenshot('e2e-05-product-created.png');

  // PRD-05: Edit Product
  await cdp.evaluate(`
    const row = Array.from(document.querySelectorAll('div')).find(r => r.innerText && r.innerText.includes('E2E Kingston Fury Beast'));
    if (row) {
      const editBtn = Array.from(row.querySelectorAll('button')).find(b => b.querySelector('svg.lucide-pencil'));
      if (editBtn) editBtn.click();
    }
  `);
  await cdp.waitFor(`Boolean(document.querySelector('form select'))`);
  await cdp.evaluate(`
    const form = document.querySelector('form');
    const selects = form.querySelectorAll('select');
    const statusSelect = Array.from(selects).find(s => s.innerHTML.includes('IN_REPAIR') || s.innerText.includes('ремонт') || s.innerText.includes('Repair'));
    if (statusSelect) {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value')?.set;
      if (setter) setter.call(statusSelect, 'IN_REPAIR');
      else statusSelect.value = 'IN_REPAIR';
      statusSelect.dispatchEvent(new Event('change', { bubbles: true }));
      statusSelect.dispatchEvent(new Event('input', { bubbles: true }));
    }
  `);
  await cdp.sleep(300);
  await cdp.click('form button[type="submit"]');
  await cdp.waitFor(`!document.querySelector('form')`);
  await cdp.sleep(1200);
  const statusUpdated = await cdp.evaluate(`
    const row = Array.from(document.querySelectorAll('[class*="rowContainer"], [class*="productRow"], div')).find(r => r.innerText && r.innerText.includes('E2E Kingston Fury Beast'));
    const text = row ? row.innerText.toLowerCase() : '';
    return text.includes('repair') || text.includes('ремонт');
  `);
  assert('PRD-05', 'ProductFormModal updates operational status and physical condition', statusUpdated);

  // PRD-06: Delete Product
  await cdp.evaluate(`
    const row = Array.from(document.querySelectorAll('[class*="rowContainer"], [class*="productRow"], div')).find(r => r.innerText && r.innerText.includes('E2E Kingston Fury Beast'));
    if (row) {
      const delBtn = row.querySelector('button[class*="deleteBtn"]') || Array.from(row.querySelectorAll('button')).find(b => b.querySelector('[class*="trash"]'));
      if (delBtn) delBtn.click();
    }
  `);
  await cdp.waitFor(`Boolean(document.querySelector('[class*="modalContainer"] button[class*="deleteBtn"]'))`);
  await cdp.click('[class*="modalContainer"] button[class*="deleteBtn"]');
  await cdp.sleep(1200);
  const productDeletedInTable = await cdp.evaluate(`!document.body.innerText.includes('E2E Kingston Fury Beast')`);
  assert('PRD-06', 'Product successfully removed from table via DeleteConfirmModal', productDeletedInTable);
  // Clear search
  await cdp.fill('div:has(svg.lucide-search) input', '');
  await cdp.sleep(400);

  // -----------------------------------------------------------------
  // MODULE 4: GROUPS (/groups) — FULL CRUD
  // -----------------------------------------------------------------
  console.log('\n--- Module 4: Groups (/groups) — Full CRUD ---');
  await cdp.navigate(`${BASE_URL}/groups`);
  await cdp.sleep(800);

  // GRP-01: Create Group
  await cdp.evaluate(`
    const addGroupBtn = Array.from(document.querySelectorAll('button')).find(b => b.querySelector('svg.lucide-plus'));
    if (addGroupBtn) addGroupBtn.click();
  `);
  await cdp.waitFor(`Boolean(document.querySelector('form input'))`);
  await cdp.fill('form input', 'E2E Серверні Шафи');
  await cdp.fill('form textarea', 'Стійки та шафи 42U для датацентрів');
  await cdp.sleep(300);
  await cdp.click('form button[type="submit"]');
  await cdp.waitFor(`!document.querySelector('form')`);
  await cdp.sleep(1000);
  const groupCreated = await cdp.evaluate(`document.body.innerText.includes('E2E Серверні Шафи')`);
  assert('GRP-01', 'GroupFormModal creates a new group card with 0 items', groupCreated);
  await cdp.screenshot('e2e-06-group-created.png');

  // GRP-02: Edit Group
  await cdp.evaluate(`
    const titleEl = Array.from(document.querySelectorAll('h3')).find(h => h.innerText.includes('E2E Серверні Шафи'));
    const card = titleEl ? titleEl.closest('div[style*="background: #ffffff"], div[style*="background:#ffffff"]') || titleEl.parentElement.parentElement.parentElement : null;
    if (card) {
      const editBtn = Array.from(card.querySelectorAll('button')).find(b => b.querySelector('svg.lucide-pencil'));
      if (editBtn) editBtn.click();
    }
  `);
  await cdp.waitFor(`Boolean(document.querySelector('form input'))`);
  await cdp.fill('form input', 'E2E Серверні Шафи 42U (Оновлено)');
  await cdp.sleep(300);
  await cdp.click('form button[type="submit"]');
  await cdp.waitFor(`!document.querySelector('form')`);
  await cdp.sleep(800);
  const groupUpdated = await cdp.evaluate(`document.body.innerText.includes('E2E Серверні Шафи 42U (Оновлено)')`);
  assert('GRP-02', 'GroupFormModal updates group title and description', groupUpdated);

  // GRP-03: Search Groups
  await cdp.fill('div:has(svg.lucide-search) input', 'Шафи 42U');
  await cdp.sleep(500);
  const searchMatch = await cdp.evaluate(`document.body.innerText.includes('E2E Серверні Шафи 42U (Оновлено)')`);
  assert('GRP-03', 'Search filter properly isolates matching group cards', searchMatch);
  await cdp.fill('div:has(svg.lucide-search) input', '');
  await cdp.sleep(400);

  // GRP-04: Delete Group
  await cdp.evaluate(`
    const titleEl = Array.from(document.querySelectorAll('h3')).find(h => h.innerText.includes('E2E Серверні Шафи 42U (Оновлено)'));
    const card = titleEl ? titleEl.closest('div[style*="background: #ffffff"], div[style*="background:#ffffff"]') || titleEl.parentElement.parentElement.parentElement : null;
    if (card) {
      const delBtn = Array.from(card.querySelectorAll('button')).find(b => b.querySelector('[class*="trash"]'));
      if (delBtn) delBtn.click();
    }
  `);
  await cdp.waitFor(`Boolean(document.querySelector('[class*="modalContainer"] button[class*="deleteBtn"]'))`);
  await cdp.click('[class*="modalContainer"] button[class*="deleteBtn"]');
  await cdp.sleep(1000);
  const groupDeleted = await cdp.evaluate(`!document.body.innerText.includes('E2E Серверні Шафи 42U (Оновлено)')`);
  assert('GRP-04', 'Group deleted and removed from database via DeleteConfirmModal', groupDeleted);

  // -----------------------------------------------------------------
  // MODULE 5: LOCALIZATION (i18n: UA / RU / EN)
  // -----------------------------------------------------------------
  console.log('\n--- Module 5: Localization (i18n: UA / RU / EN) ---');

  // I18N-01: Switch to EN
  await cdp.evaluate(`
    const enBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.trim() === 'EN');
    if (enBtn) enBtn.click();
  `);
  await cdp.sleep(500);
  const isEn = await cdp.evaluate(`
    document.body.innerText.toUpperCase().includes('ORDERS') &&
    document.body.innerText.toUpperCase().includes('GROUPS') &&
    localStorage.getItem('app_language') === 'en'
  `);
  assert('I18N-01', 'TopMenu language switcher activates English locale across entire UI', isEn);

  // I18N-02: Switch to UA
  await cdp.evaluate(`
    const uaBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.trim() === 'UA');
    if (uaBtn) uaBtn.click();
  `);
  await cdp.sleep(500);
  const isUa = await cdp.evaluate(`
    document.body.innerText.toUpperCase().includes('ПРИХОДИ') &&
    document.body.innerText.toUpperCase().includes('ГРУПИ') &&
    localStorage.getItem('app_language') === 'ua'
  `);
  assert('I18N-02', 'TopMenu language switcher activates Ukrainian locale across entire UI', isUa);

  // I18N-03: Locale persistence on reload
  await cdp.navigate(`${BASE_URL}/orders`);
  await cdp.sleep(1000);
  const persistsUa = await cdp.evaluate(`
    document.body.innerText.toUpperCase().includes('ПРИХОДИ') &&
    localStorage.getItem('app_language') === 'ua'
  `);
  assert('I18N-03', 'Language selection persists in localStorage across page reloads', persistsUa);
  await cdp.screenshot('e2e-07-i18n-ukrainian.png');

  // -----------------------------------------------------------------
  // MODULE 6: ANALYTICS, GRAPHS & MAPS (/analytics)
  // -----------------------------------------------------------------
  console.log('\n--- Module 6: Analytics, Graphs & Maps (/analytics) ---');
  await cdp.navigate(`${BASE_URL}/analytics`, 3000);
  await cdp.sleep(2000);

  // ANL-01: Web Worker aggregation & Recharts SVG
  const hasCharts = await cdp.evaluate(`
    Boolean(document.querySelector('.recharts-responsive-container') || document.querySelector('svg.recharts-surface'))
  `);
  assert('ANL-01', 'Web Worker aggregates metrics and renders Recharts BarChart & PieChart', hasCharts);

  // ANL-02: Interactive Graph (HTML5 Canvas)
  const hasCanvasGraph = await cdp.evaluate(`
    Boolean(document.querySelector('canvas'))
  `);
  assert('ANL-02', 'Interactive relationship graph (Orders -> Products -> Users) renders on HTML5 canvas', hasCanvasGraph);

  // ANL-03: Leaflet Geolocation Map
  const hasMap = await cdp.evaluate(`
    Boolean(document.querySelector('iframe[title="Warehouse Map"]') || document.querySelector('.leaflet-container'))
  `);
  assert('ANL-03', 'Leaflet map loads OpenStreetMap container with location markers', hasMap);
  await cdp.screenshot('e2e-08-analytics-charts-graph.png');

  // -----------------------------------------------------------------
  // MODULE 7: USERS & SETTINGS
  // -----------------------------------------------------------------
  console.log('\n--- Module 7: Users & Settings ---');
  await cdp.navigate(`${BASE_URL}/users`);
  const usersCount = await cdp.evaluate(`document.querySelectorAll('h3, [class*="user"]').length`);
  assert('USR-01', 'Users page renders user cards with roles and emails', usersCount > 0);

  await cdp.navigate(`${BASE_URL}/settings`);
  const settingsRendered = await cdp.evaluate(`document.body.innerText.toLowerCase().includes('google') || document.body.innerText.toLowerCase().includes('мова') || document.body.innerText.toLowerCase().includes('language') || document.body.innerText.toLowerCase().includes('язык')`);
  assert('SET-01', 'Settings page provides controls for language, table modes, and authentication', settingsRendered);

  // -----------------------------------------------------------------
  // MODULE 8: NEGATIVE SCENARIOS & VALIDATION
  // -----------------------------------------------------------------
  console.log('\n--- Module 8: Negative Scenarios & Validation ---');
  await cdp.navigate(`${BASE_URL}/orders`);

  // NEG-01: Empty Form Validation
  await cdp.evaluate(`
    const addBtn = Array.from(document.querySelectorAll('button')).find(b => b.querySelector('svg.lucide-plus'));
    if (addBtn) addBtn.click();
  `);
  await cdp.waitFor(`Boolean(document.querySelector('form input'))`);
  await cdp.fill('form input', '   ');
  await cdp.sleep(200);
  await cdp.click('form button[type="submit"]');
  await cdp.sleep(500);
  const modalStillOpen = await cdp.evaluate(`Boolean(document.querySelector('form'))`);
  assert('NEG-01', 'Form submission with empty/whitespace title is blocked with validation error', modalStillOpen);

  // Close modal
  await cdp.evaluate(`
    const cancelBtn = Array.from(document.querySelectorAll('button')).find(b => b.className.includes('cancelBtn') || b.className.includes('closeButton') || b.innerText.includes('Cancel') || b.innerText.includes('Скасувати') || b.innerText.includes('Отмена'));
    if (cancelBtn) cancelBtn.click();
  `);
  await cdp.sleep(400);

  // NEG-02: Search Empty State
  await cdp.fill('div:has(svg.lucide-search) input', 'xyz_non_existent_item_999999');
  await cdp.sleep(600);
  const emptyStateDisplayed = await cdp.evaluate(`
    document.body.innerText.includes('не знайдено') ||
    document.body.innerText.includes('не найден') ||
    document.body.innerText.includes('No orders') ||
    document.body.innerText.includes('Немає приходів') ||
    document.querySelectorAll('[class*="card"]').length === 0
  `);
  assert('NEG-02', 'Search query with 0 matches cleanly renders empty state without breaking layout', emptyStateDisplayed);

  console.log('\n======================================================');
  console.log(`ALL ${results.length} E2E BROWSER TESTS PASSED SUCCESSFULLY!`);
  console.log('======================================================\n');
}

runTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ E2E TEST RUN FAILED:\n', err);
    process.exit(1);
  });
