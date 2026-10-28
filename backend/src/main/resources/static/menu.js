(function () {
  'use strict';

  const root = document.getElementById('public-menu');
  const demoStore = window.DinhosStore;
  const categoryName = (value) => /^bebidas?$/i.test(String(value ?? '').trim()) ? 'Bebidas' : String(value ?? '').trim();
  const state = {
    search: '',
    category: 'Todos',
    basket: [],
    customerName: '',
    payment: 'PIX',
    source: 'loading',
    status: '',
    statusType: 'info',
    busy: false,
    transaction: null,
    confirmation: null,
  };
  let catalog = demoStore.db.products.map((product) => ({
    id: product.id,
    nome: product.nome,
    descricao: product.descricao || '',
    categoria: categoryName(product.categoria),
    preco: Number(product.preco) || 0,
    estoque: Number(product.estoque) || 0,
    disponivel: product.disponivel !== false,
  }));

  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const money = (value) => Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const availableProducts = () => catalog.filter((product) => product.disponivel);
  const categories = () => ['Todos', ...new Set(availableProducts().map((product) => product.categoria).filter(Boolean).sort((a, b) => a.localeCompare(b, 'pt-BR')))];
  const visibleProducts = () => availableProducts()
    .filter((product) => state.category === 'Todos' || product.categoria === state.category)
    .filter((product) => `${product.nome} ${product.descricao} ${product.categoria}`.toLocaleLowerCase('pt-BR').includes(state.search.toLocaleLowerCase('pt-BR')))
    .sort((a, b) => Number(!(Number(a.estoque) > 0)) - Number(!(Number(b.estoque) > 0)) || a.nome.localeCompare(b.nome, 'pt-BR'));
  const basketTotal = () => state.basket.reduce((sum, item) => sum + item.preco * item.quantidade, 0);
  const basketCount = () => state.basket.reduce((sum, item) => sum + item.quantidade, 0);
  const basketItem = (id) => state.basket.find((item) => String(item.id) === String(id));
  const isDemoCatalog = () => state.source === 'fallback';
  const isApiCatalog = () => state.source === 'api';

  function render() {
    const mobileDock = window.matchMedia?.('(max-width: 760px)').matches ?? window.innerWidth <= 760;
    const existingMain = root.querySelector('.menu-main');
    const wasMobileDock = mobileDock && root.classList.contains('has-cart-dock');
    const previousScroll = wasMobileDock && existingMain ? existingMain.scrollTop : window.scrollY;
    const list = visibleProducts();
    root.innerHTML = `
      <header class="menu-header">
        <div class="menu-header-inner">
          <img class="menu-brand-mark" src="/logo.png" alt="">
          <div class="menu-brand-copy">
            <strong>Dinho's Canal 6</strong>
            <span>Cardápio · Praia do Canal 6</span>
          </div>
        </div>
      </header>
      <main class="menu-main">
        <section class="menu-hero">
          <div class="eyebrow">FEITO NA PRAIA, COM CARINHO</div>
          <h1>Nosso cardápio</h1>
          <p>Escolha seus favoritos e aproveite o dia à beira-mar.</p>
        </section>
        ${state.source === 'fallback' ? `<div class="menu-notice demo-notice"><span aria-hidden="true">ⓘ</span><div><b>Compra de demonstração</b><p>O catálogo online está indisponível. Você pode testar uma compra local; não há cobrança nem envio de pedido ao servidor.</p></div></div>` : ''}
        ${state.source === 'loading' ? '<p class="menu-loading" role="status">Atualizando cardápio…</p>' : ''}
        ${state.confirmation ? confirmationView() : ''}
        <div class="menu-tools">
          <label class="searchbox menu-search">
            <span aria-hidden="true">⌕</span>
            <input id="menu-search" type="search" placeholder="Buscar no cardápio…" value="${escapeHtml(state.search)}" aria-label="Buscar produtos">
          </label>
          <span class="menu-result-count">${list.length} ${list.length === 1 ? 'item' : 'itens'} no cardápio</span>
        </div>
        <nav class="menu-categories" aria-label="Filtrar por categoria">
          ${categories().map((category) => `<button type="button" class="menu-category ${state.category === category ? 'active' : ''}" data-category="${escapeHtml(category)}" aria-pressed="${state.category === category}">${escapeHtml(category)}</button>`).join('')}
        </nav>
        <div class="menu-shop-layout">
          <section class="public-product-grid" aria-label="Produtos do cardápio">
            ${list.length ? list.map(productCard).join('') : '<div class="menu-empty">Não encontramos itens com essa busca.</div>'}
          </section>
          ${basketView()}
        </div>
        <footer class="menu-footnote">Dinho's Canal 6 <span>·</span> Disponibilidade sujeita ao estoque do dia</footer>
      </main>`;
    root.classList.toggle('has-cart-dock', mobileDock && basketCount() > 0);
    if (basketCount()) root.insertAdjacentHTML('beforeend', mobileCartDock());
    if (mobileDock && basketCount()) root.querySelector('.menu-main').scrollTop = previousScroll;
    else if (wasMobileDock) window.scrollTo(0, previousScroll);
    bindEvents();
  }

  function mobileCartDock() {
    return `<div class="menu-cart-dock" role="region" aria-label="Resumo do carrinho"><div class="menu-cart-dock-summary"><span>${basketCount()} ${basketCount() === 1 ? 'item' : 'itens'}</span><b>${money(basketTotal())}</b></div><button class="button button-primary" type="button" data-cart-dock>Ver carrinho <span aria-hidden="true">→</span></button></div>`;
  }

  function productCard(product) {
    const stocked = Number(product.estoque) > 0;
    const quantity = basketItem(product.id)?.quantidade || 0;
    const purchasable = ['api', 'fallback'].includes(state.source) && stocked && !state.busy;
    const canAdd = ['api', 'fallback'].includes(state.source);
    return `<article class="card public-product"><span class="tile-category">${escapeHtml(product.categoria || 'Cardápio')}</span><h2>${escapeHtml(product.nome)}</h2>${product.descricao ? `<p class="public-product-description">${escapeHtml(product.descricao)}</p>` : ''}<div class="public-product-bottom"><span class="public-product-price">${stocked ? money(product.preco) : 'Fora de estoque'}</span><span class="public-stock ${stocked ? '' : 'sold-out'}">${stocked ? 'Disponível' : 'Indisponível'}</span></div>${canAdd ? `<button type="button" class="button ${quantity ? 'button-outline' : 'button-primary'} public-add-button" data-add="${escapeHtml(product.id)}" ${purchasable ? '' : 'disabled'}>${stocked ? (quantity ? `${quantity} no carrinho · adicionar` : 'Adicionar ao carrinho') : 'Indisponível'} <span aria-hidden="true">＋</span></button>` : ''}</article>`;
  }

  function basketView() {
    const demo = isDemoCatalog();
    const loading = state.source === 'loading';
    const basketMarkup = state.basket.length
      ? state.basket.map((item) => `<div class="public-basket-row"><div class="public-basket-copy"><b>${escapeHtml(item.nome)}</b><small>${money(item.preco)} cada</small></div><div class="public-quantity"><button type="button" data-quantity="-1" data-id="${escapeHtml(item.id)}" aria-label="Diminuir ${escapeHtml(item.nome)}" ${state.busy ? 'disabled' : ''}>−</button><span>${item.quantidade}</span><button type="button" data-quantity="1" data-id="${escapeHtml(item.id)}" aria-label="Aumentar ${escapeHtml(item.nome)}" ${state.busy ? 'disabled' : ''}>＋</button></div><b class="public-line-total">${money(item.preco * item.quantidade)}</b></div>`).join('')
      : `<div class="public-basket-empty"><span>＋</span><b>Seu carrinho está vazio</b><p>Adicione itens do cardápio para fazer seu pedido.</p></div>`;
    const formMarkup = demo
      ? `<p class="public-demo-checkout-note">Compra de demonstração: não haverá cobrança nem pedido no servidor.</p><form id="checkout-form" class="public-checkout-form demo-checkout-form"><label class="field"><span>Seu nome</span><input name="customerName" type="text" autocomplete="name" maxlength="100" placeholder="Como podemos chamar você?" value="${escapeHtml(state.customerName)}" required ${state.busy ? 'disabled' : ''}></label>${paymentField()}<button class="button button-primary full-width" type="submit" ${!state.basket.length || state.busy ? 'disabled' : ''}>${state.busy ? 'Finalizando demonstração…' : 'Finalizar compra de demonstração'} <span aria-hidden="true">→</span></button></form>`
      : loading
        ? '<p class="public-demo-lock">Aguarde enquanto carregamos o catálogo da loja.</p>'
        : `<form id="checkout-form" class="public-checkout-form"><label class="field"><span>Seu nome</span><input name="customerName" type="text" autocomplete="name" maxlength="100" placeholder="Como podemos chamar você?" value="${escapeHtml(state.customerName)}" required ${state.busy ? 'disabled' : ''}></label>${paymentField()}<button class="button button-primary full-width" type="submit" ${!state.basket.length || state.busy ? 'disabled' : ''}>${state.busy ? 'Enviando pedido…' : 'Fazer pedido'} <span aria-hidden="true">→</span></button><p class="public-payment-note">O pedido usa o estoque da loja; pagamento simulado.</p></form>`;
    return `<aside class="card public-basket ${demo ? 'demo-basket' : ''}" aria-label="Seu pedido"><div class="public-basket-heading"><div><span class="eyebrow">${demo ? 'PEDIDO DE DEMONSTRAÇÃO' : 'PEDIDO NA PRAIA'}</span><h2>Seu carrinho</h2></div><span class="public-basket-count">${basketCount()}</span></div>${basketMarkup}${state.basket.length ? `<div class="public-basket-total"><span>Total</span><b>${money(basketTotal())}</b></div>` : ''}${state.status ? `<div class="public-checkout-message ${state.statusType}" role="status" aria-live="polite">${escapeHtml(state.status)}</div>` : ''}${formMarkup}</aside>`;
  }

  function paymentField() {
    return `<label class="field"><span>Forma de pagamento</span><select name="payment" ${state.busy ? 'disabled' : ''}><option value="PIX" ${state.payment === 'PIX' ? 'selected' : ''}>Pix</option><option value="CARTAO" ${state.payment === 'CARTAO' ? 'selected' : ''}>Cartão</option><option value="DINHEIRO" ${state.payment === 'DINHEIRO' ? 'selected' : ''}>Dinheiro</option></select></label>`;
  }

  function confirmationView() {
    const confirmation = state.confirmation;
    return `<section class="public-success ${confirmation.demo ? 'demo-success' : ''}" role="status"><span class="public-success-mark" aria-hidden="true">✓</span><div><span class="eyebrow">${confirmation.demo ? 'COMPRA DE DEMONSTRAÇÃO' : 'PEDIDO CONFIRMADO'}</span><h2>${confirmation.demo ? 'Demonstração concluída' : `Obrigado, ${escapeHtml(confirmation.customer)}!`}</h2><p>${confirmation.demo ? `Compra local para ${escapeHtml(confirmation.customer)}.` : `Seu pedido`} <b>#${escapeHtml(confirmation.orderId)}</b> ${confirmation.demo ? '— nenhum pedido foi enviado ao servidor.' : 'foi recebido.'} Total: <b>${money(confirmation.total)}</b>.</p></div><button type="button" class="button button-outline button-small" data-dismiss-confirmation>Fechar</button></section>`;
  }

  function bindEvents() {
    const search = root.querySelector('#menu-search');
    search.addEventListener('input', () => {
      const cursor = search.selectionStart;
      state.search = search.value;
      render();
      const next = root.querySelector('#menu-search');
      next.focus();
      next.setSelectionRange(cursor, cursor);
    });
    root.querySelectorAll('[data-category]').forEach((button) => button.addEventListener('click', () => {
      state.category = button.dataset.category;
      render();
    }));
    root.querySelectorAll('[data-add]').forEach((button) => button.addEventListener('click', () => changeQuantity(button.dataset.add, 1)));
    root.querySelectorAll('[data-quantity]').forEach((button) => button.addEventListener('click', () => changeQuantity(button.dataset.id, Number(button.dataset.quantity))));
    const nameInput = root.querySelector('[name="customerName"]');
    if (nameInput) nameInput.addEventListener('input', () => {
      const nextName = nameInput.value;
      if (state.transaction && state.transaction.customerName !== nextName.trim()) state.transaction = null;
      state.customerName = nextName;
    });
    const paymentSelect = root.querySelector('[name="payment"]');
    if (paymentSelect) paymentSelect.addEventListener('change', () => { state.payment = paymentSelect.value; });
    const form = root.querySelector('#checkout-form');
    if (form) form.addEventListener('submit', (event) => {
      event.preventDefault();
      state.customerName = form.elements.customerName.value;
      state.payment = form.elements.payment.value;
      checkout();
    });
    const dismiss = root.querySelector('[data-dismiss-confirmation]');
    if (dismiss) dismiss.addEventListener('click', () => { state.confirmation = null; render(); });
    const dockButton = root.querySelector('[data-cart-dock]');
    if (dockButton) dockButton.addEventListener('click', () => {
      const basket = root.querySelector('.public-basket');
      if (basket?.scrollIntoView) {
        const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        basket.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'center' });
      }
      root.querySelector('[name="customerName"]')?.focus({ preventScroll: true });
    });
  }

  function changeQuantity(id, delta) {
    if ((!isApiCatalog() && !isDemoCatalog()) || state.busy) return;
    const product = catalog.find((entry) => String(entry.id) === String(id));
    if (!product || !product.disponivel || Number(product.estoque) <= 0) return;
    const existing = basketItem(id);
    const nextQuantity = (existing?.quantidade || 0) + delta;
    if (nextQuantity > Number(product.estoque)) {
      state.status = `Só há ${product.estoque} unidade(s) de ${product.nome} em estoque.`;
      state.statusType = 'error';
      render();
      return;
    }
    state.status = '';
    if (state.transaction) state.transaction = null;
    state.basket = nextQuantity <= 0
      ? state.basket.filter((item) => String(item.id) !== String(id))
      : existing
        ? state.basket.map((item) => String(item.id) === String(id) ? { ...item, quantidade: nextQuantity } : item)
        : [...state.basket, { id: product.id, nome: product.nome, preco: Number(product.preco), quantidade: nextQuantity }];
    render();
  }

  async function apiRequest(path, { method = 'GET', body, csrfToken, cartToken } = {}) {
    const headers = { Accept: 'application/json' };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (csrfToken) headers['X-XSRF-TOKEN'] = csrfToken;
    if (cartToken) headers['X-Cart-Token'] = cartToken;
    let response;
    try {
      response = await fetch(path, {
        method,
        credentials: 'same-origin',
        headers,
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
    } catch (_) {
      throw new Error('Não foi possível conectar à loja. Sua cesta continua salva nesta página; confira a conexão e tente novamente.');
    }
    const text = await response.text();
    let data = null;
    if (text) {
      try { data = JSON.parse(text); } catch (_) { data = { message: text }; }
    }
    if (!response.ok) {
      const validationDetails = data?.details && typeof data.details === 'object' ? Object.values(data.details).filter(Boolean).join(' ') : '';
      const detail = [data?.message || data?.error || (response.status === 402 ? 'Pagamento recusado. Escolha outra forma de pagamento e tente novamente.' : `A loja não aceitou o pedido (erro ${response.status}).`), validationDetails]
        .filter(Boolean)
        .join(' ');
      throw new Error(detail);
    }
    return data;
  }

  async function checkout() {
    const customerName = state.customerName.trim();
    if (!customerName) {
      state.status = 'Informe seu nome para continuar.';
      state.statusType = 'error';
      render();
      root.querySelector('[name="customerName"]')?.focus();
      return;
    }
    if (!state.basket.length || (!isApiCatalog() && !isDemoCatalog()) || state.busy) return;
    state.status = '';
    state.statusType = 'info';
    state.busy = true;
    render();
    try {
      // API products always use the real cart/checkout path, even if they are
      // seeded or otherwise look like demo products. Local checkout is only
      // for the explicit empty/offline-catalog fallback state.
      if (isDemoCatalog()) {
        if (typeof demoStore.criarPedidoDemo !== 'function') {
          throw new Error('A compra de demonstração não está disponível nesta versão do catálogo.');
        }
        const result = demoStore.criarPedidoDemo(state.basket, state.payment, customerName);
        if (result?.error) throw new Error(result.error);
        if (result?.pedidoId == null) throw new Error('A demonstração não retornou a confirmação da compra.');
        const demoTotal = Number(result.valorTotal);
        state.confirmation = {
          orderId: result.pedidoId,
          total: Number.isFinite(demoTotal) ? demoTotal : basketTotal(),
          customer: customerName,
          demo: true,
        };
        state.basket = [];
        state.transaction = null;
        state.status = '';
        return;
      }
      if (!state.transaction) {
        state.transaction = { customerName, csrfToken: '', comandaNumero: '', cartId: '', cartToken: '', added: new Set() };
      }
      const transaction = state.transaction;
      if (!transaction.csrfToken) {
        const csrf = await apiRequest('/api/auth/csrf');
        if (!csrf?.token) throw new Error('A loja não conseguiu preparar uma compra segura. Atualize a página e tente novamente.');
        transaction.csrfToken = csrf.token;
      }
      if (!transaction.comandaNumero) {
        const comanda = await apiRequest('/api/comandas/cliente', { method: 'POST', csrfToken: transaction.csrfToken, body: { nomeCliente: customerName } });
        if (!comanda?.numero) throw new Error('A loja não confirmou a abertura da sua comanda. Tente novamente.');
        transaction.comandaNumero = String(comanda.numero);
      }
      if (!transaction.cartId || !transaction.cartToken) {
        const cart = await apiRequest('/api/carrinhos', { method: 'POST', csrfToken: transaction.csrfToken, body: { comandaNumero: transaction.comandaNumero } });
        if (cart?.id == null || !cart.accessToken) throw new Error('A loja não conseguiu preparar seu carrinho. Tente novamente.');
        transaction.cartId = cart.id;
        transaction.cartToken = cart.accessToken;
      }
      for (const item of state.basket) {
        if (transaction.added.has(String(item.id))) continue;
        await apiRequest(`/api/carrinhos/${encodeURIComponent(transaction.cartId)}/itens`, {
          method: 'POST',
          csrfToken: transaction.csrfToken,
          cartToken: transaction.cartToken,
          body: { produtoId: Number(item.id), quantidade: item.quantidade },
        });
        transaction.added.add(String(item.id));
      }
      const result = await apiRequest(`/api/carrinhos/${encodeURIComponent(transaction.cartId)}/checkout`, {
        method: 'POST',
        csrfToken: transaction.csrfToken,
        cartToken: transaction.cartToken,
        body: { formaPagamento: state.payment },
      });
      if (result?.pedidoId == null) throw new Error('O pedido foi enviado, mas a confirmação não trouxe o número do pedido. Entre em contato com a equipe.');
      const orderTotal = Number(result.valorTotal);
      state.confirmation = { orderId: result.pedidoId, total: Number.isFinite(orderTotal) ? orderTotal : basketTotal(), customer: customerName };
      state.basket = [];
      state.transaction = null;
      state.status = '';
      refreshProductsAfterPurchase();
    } catch (error) {
      state.status = error.message || 'Não foi possível concluir a compra. Sua cesta continua intacta; tente novamente.';
      state.statusType = 'error';
    } finally {
      state.busy = false;
      render();
    }
  }

  function refreshProductsAfterPurchase() {
    fetch('/api/produtos', { headers: { Accept: 'application/json' }, credentials: 'same-origin' })
      .then((response) => response.ok ? response.json() : null)
      .then((items) => { if (Array.isArray(items) && items.length) { catalog = normalizeProducts(items); render(); } })
      .catch(() => {});
  }

  function normalizeProducts(items) {
    return items.filter((item) => Number.isSafeInteger(Number(item.id)) && Number(item.id) > 0).map((item) => ({
      id: Number(item.id),
      nome: String(item.nome || 'Produto'),
      descricao: String(item.descricao || ''),
      categoria: categoryName(item.categoria),
      preco: Number(item.preco) || 0,
      estoque: Number(item.quantidadeEstoque) || 0,
      disponivel: item.disponibilidade === true,
    }));
  }

  window.addEventListener('dinhos:change', () => {
    if (state.source !== 'fallback') return;
    catalog = demoStore.db.products.map((product) => ({
      id: product.id,
      nome: product.nome,
      descricao: product.descricao || '',
      categoria: categoryName(product.categoria),
      preco: Number(product.preco) || 0,
      estoque: Number(product.estoque) || 0,
      disponivel: product.disponivel !== false,
    }));
    render();
  });
  window.addEventListener('storage', (event) => {
    if (event.key === 'dinhos-db') window.location.reload();
  });
  render();
  fetch('/api/produtos', { headers: { Accept: 'application/json' }, credentials: 'same-origin' })
    .then((response) => response.ok ? response.json() : Promise.reject(new Error('Catálogo indisponível')))
    .then((items) => {
      // The local demo catalog is selected only when the API has no usable
      // product rows; product data itself has no "demo" classification.
      if (!Array.isArray(items) || items.length === 0) {
        state.source = 'fallback';
        render();
        return;
      }
      const products = normalizeProducts(items);
      if (!products.length) {
        state.source = 'fallback';
        render();
        return;
      }
      catalog = products;
      state.source = 'api';
      state.category = 'Todos';
      render();
    })
    .catch(() => {
      state.source = 'fallback';
      render();
    });
})();
