(function () {
  'use strict';
  const store = window.DinhosStore;
  const root = document.getElementById('app');
  store.useSessionUser(null);
  const tabs = [
    ['comandas', 'Comandas', '▤', ['atendente', 'gerente']],
    ['pedidos', 'Pedidos', '◷', ['atendente', 'gerente']], ['mesas', 'Mesas / QR', '▦', ['atendente', 'gerente']], ['produtos', 'Produtos', '◇', ['gerente']],
    ['estoque', 'Estoque', '▦', ['gerente']], ['relatorios', 'Relatórios', '⌁', ['gerente']], ['usuarios', 'Usuários', '♙', []],
  ];
  const paymentOptions = ['Pix', 'Dinheiro', 'Cartão de crédito', 'Cartão de débito'];
  const today = new Date();
  const localToday = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const ui = { tab: 'comandas', productSearch: '', orderStatus: '', orderNumber: '', orderDate: '', comandaFilter: 'ativas', reportDate: localToday, cart: [], cartComanda: '', cartPayment: 'Pix', stockProduct: '', stockType: 'entrada', stockQty: 1, productForm: null, userForm: null, productListSearch: '', productNotice: '', productSyncBusy: false, productImportBusy: false, message: '', error: '', backendUser: null, authLoading: true, csrfToken: '', csrfDisabled: false, backendOrders: [], backendComandas: [], backendTables: [], ordersLoading: false, comandasLoading: false, tablesLoading: false, backendMessage: '' };
  let ordersRequest = 0;
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const validStock = (value) => value !== null && value !== undefined && String(value).trim() !== '' && Number.isInteger(Number(value)) && Number(value) >= 0;
  const stockValue = (value) => validStock(value) ? Number(value) : 0;
  const categoryName = store.normalizeCategory;
  const categoryKey = (value) => categoryName(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');
  const { brl, total } = store;
  const date = (value) => value ? new Date(value).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '—';
  const options = (values, selected, emptyLabel) => `${emptyLabel ? `<option value="">${esc(emptyLabel)}</option>` : ''}${values.map((entry) => { const value = typeof entry === 'object' ? entry.value : entry; const label = typeof entry === 'object' ? entry.label : entry; return `<option value="${esc(value)}" ${String(value) === String(selected) ? 'selected' : ''}>${esc(label)}</option>`; }).join('')}`;
  const select = (values, selected, attrs = '', emptyLabel = '') => `<select ${attrs}>${options(values, selected, emptyLabel)}</select>`;
  const input = (label, name, value = '', type = 'text', attrs = '') => `<label class="field"><span>${esc(label)}</span><input name="${esc(name)}" type="${type}" value="${esc(value)}" ${attrs}></label>`;
  const card = (content, cls = '') => `<section class="card ${cls}">${content}</section>`;
  const btn = (label, action, cls = 'button', extra = '') => `<button type="button" class="${cls}" data-action="${action}" ${extra}>${label}</button>`;
  const badge = (text, danger = false) => `<span class="badge ${danger ? 'danger' : ''}">${esc(text)}</span>`;
  const orderStatuses = { PENDENTE: 'Pendente', EM_PREPARO: 'Em preparo', PRONTO: 'Pronto', ENTREGUE: 'Entregue', CANCELADO: 'Cancelado', TESTE: 'Pendente · teste' };
  async function api(path, { method = 'GET', body, csrf = false } = {}) {
    const headers = { Accept: 'application/json' };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (csrf && !ui.csrfDisabled) headers['X-XSRF-TOKEN'] = await getCsrf();
    let response;
    try { response = await fetch(path, { method, credentials: 'same-origin', headers, ...(body === undefined ? {} : { body: JSON.stringify(body) }) }); }
    catch (_) { throw new Error('Não foi possível conectar ao servidor. Confira a conexão e tente novamente.'); }
    const text = await response.text();
    let data = null;
    if (text) { try { data = JSON.parse(text); } catch (_) { data = { message: text }; } }
    if (!response.ok) throw new Error(data?.message || data?.error || `A solicitação falhou (erro ${response.status}).`);
    return data;
  }
  async function getCsrf() {
    if (!ui.csrfToken) {
      const data = await api('/api/auth/csrf');
      ui.csrfToken = data?.token || data?.csrfToken || '';
      if (!ui.csrfToken) throw new Error('Não foi possível preparar uma sessão segura. Atualize a página.');
    }
    return ui.csrfToken;
  }
  function listFrom(data) { return Array.isArray(data) ? data : Array.isArray(data?.content) ? data.content : Array.isArray(data?.items) ? data.items : Array.isArray(data?.pedidos) ? data.pedidos : Array.isArray(data?.mesas) ? data.mesas : []; }
  function localTestOrders() { return (store.db.pedidos || []).filter((order) => order.origem === 'TESTE_LOCAL'); }
  function localTestComandas() { return (store.db.comandas || []).filter((comanda) => comanda.origem === 'TESTE_LOCAL'); }
  function remoteTestOrders() { return ui.backendOrders.filter((order) => order.origem === 'TESTE_REMOTO'); }
  function remoteTestComandas() { return ui.backendComandas.filter((comanda) => comanda.origem === 'TESTE_REMOTO'); }
  function realBackendOrders() { return ui.backendOrders.filter((order) => !['TESTE_REMOTO', 'TESTE_LOCAL'].includes(order.origem)); }
  function currentUser(data) {
    const user = data?.user || data?.usuario || data?.principal || data?.data || data;
    if (!user || !(user.id || user.email || user.nome || user.name)) return null;
    let role = String(user.role || user.perfil || 'atendente').replace(/^ROLE_/i, '').toLowerCase();
    if (role === 'admin') role = 'admin';
    if (role.includes('gerente')) role = 'gerente';
    if (role === 'funcionario') role = 'gerente';
    return { ...user, id: user.id ?? user.email, nome: user.nome || user.name || user.email, role };
  }
  async function loadOrders(preserveMessage = false) {
    const request = ++ordersRequest;
    ui.ordersLoading = true; ui.backendOrders = []; if (!preserveMessage) ui.backendMessage = ''; render();
    let orders = [];
    let tests = [];
    try {
      orders = listFrom(await api('/api/pedidos'));
    } catch (error) {
      if (request === ordersRequest) ui.backendMessage = error.message;
    }
    try { tests = listFrom(await api('/api/pedidos/testes')).filter((order) => order.origem === 'TESTE_REMOTO'); }
    catch (_) { /* Remote test orders are optional until the server feature is enabled. */ }
    if (request === ordersRequest) {
      ui.backendOrders = [...orders.filter((order) => !['TESTE_REMOTO', 'TESTE_LOCAL'].includes(order.origem)), ...tests];
      ui.ordersLoading = false;
      render();
    }
  }
  async function loadComandas() {
    ui.comandasLoading = true; ui.backendComandas = []; ui.backendMessage = ''; render();
    let remoteTests = [];
    try {
      const comandas = listFrom(await api('/api/comandas'));
      ui.backendComandas = await Promise.all(comandas.map(async (comanda) => {
        try {
          const pedidos = listFrom(await api(`/api/comandas/${encodeURIComponent(comanda.numero)}/pedidos`));
          return { ...comanda, pedidos };
        } catch (error) {
          throw new Error(`Não foi possível carregar os pedidos da comanda #${comanda.numero}: ${error.message}`);
        }
      }));
    } catch (error) { ui.backendComandas = []; ui.backendMessage = error.message; }
    try { remoteTests = listFrom(await api('/api/comandas/testes')).filter((comanda) => comanda.origem === 'TESTE_REMOTO'); } catch (_) { /* Remote test comandas are optional until the server feature is enabled. */ }
    finally { ui.backendComandas = [...ui.backendComandas, ...remoteTests, ...localTestComandas()]; ui.comandasLoading = false; render(); }
  }
  async function loadTables() {
    ui.tablesLoading = true; ui.backendMessage = ''; render();
    try { ui.backendTables = listFrom(await api('/api/mesas')); }
    catch (error) { ui.backendMessage = error.message; }
    finally { ui.tablesLoading = false; render(); }
  }
  function render() {
    if (ui.authLoading) { root.innerHTML = '<main class="login-screen auth-loading" role="status">Verificando acesso seguro…</main>'; return; }
    if (!ui.backendUser) { root.innerHTML = login(); return; }
    store.useSessionUser(ui.backendUser);
    const available = tabs.filter((tab) => store.can(...tab[3]));
    if (!available.some((tab) => tab[0] === ui.tab)) ui.tab = available[0]?.[0] || 'comandas';
    const current = available.find((tab) => tab[0] === ui.tab);
      root.innerHTML = `<div class="app-shell"><header class="topbar"><div class="top-inner"><img class="brand-mark" src="logo.png" alt=""><div class="brand-copy"><strong>Dinho's Canal 6</strong><span>Gestão do carrinho de praia</span></div><div class="user-chip"><span class="online-dot"></span><span>${esc(ui.backendUser.nome)} <small>· ${esc(ui.backendUser.role)}</small></span></div><button class="button button-light button-small" data-action="logout">Sair <span aria-hidden="true">↗</span></button></div></header><nav class="tabs" aria-label="Seções">${available.map(([id, label, icon]) => `<button class="tab ${ui.tab === id ? 'active' : ''}" data-tab="${id}" aria-current="${ui.tab === id ? 'page' : 'false'}"><span>${icon}</span>${label}</button>`).join('')}</nav><main class="main"><div class="page-heading"><div><div class="eyebrow">DINHO'S · CANAL 6</div><h1>${current[1]}</h1><p>${headingNote(ui.tab)}</p></div><div class="today"><span>●</span> Sessão da equipe <b>${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</b></div></div><div class="view" key="${ui.tab}">${screen()}</div><footer>Pedidos, comandas e mesas vêm do servidor <span>·</span> Produtos, estoque, usuários e vendas manuais usam dados locais deste navegador</footer></main></div>`;
  }
  function headingNote(tab) {
    return ({ venda: 'Registre pedidos e acompanhe o que sai do balcão.', comandas: 'Acompanhe as mesas, os guarda-sóis e as contas abertas.', pedidos: 'Acompanhe os pedidos recebidos pela loja.', mesas: 'Cadastre mesas e prepare os QR codes para impressão.', produtos: 'Cuide do cardápio, dos preços e da disponibilidade.', estoque: 'Entradas, saídas e ajustes em um só lugar.', relatorios: 'Um retrato simples das vendas e do movimento.', usuarios: 'Gerencie quem pode acessar o sistema.' })[tab];
  }
  function login() {
    return `<main class="login-screen"><div class="login-art"><div class="sun"></div><div class="login-caption"><span>CANAL 6 · PRAIA</span><h2>Um bom dia<br>começa por aqui.</h2><p>Vendas, comandas e operação do seu carrinho — em um só lugar.</p></div><div class="wave wave-one"></div><div class="wave wave-two"></div></div><form class="login-card" id="login-form"><img src="logo.png" class="login-logo" alt="Dinho's Canal 6"><div class="eyebrow">BEM-VINDO DE VOLTA</div><h1>Entrar no sistema</h1><p class="muted">Acesse sua operação do Canal 6.</p>${input('E-mail', 'email', '', 'email', 'autocomplete="username" required')}${input('Senha', 'senha', '', 'password', 'autocomplete="current-password" required')}<p class="form-error" role="alert">${esc(ui.error)}</p><button class="button button-primary login-submit" ${ui.authLoading ? 'disabled' : ''}>Entrar <span>→</span></button><a class="public-menu-link" href="/">Voltar ao cardápio público <span aria-hidden="true">↗</span></a></form></main>`;
  }
  function screen() {
    return ({ venda: venda, comandas: comandas, pedidos: pedidos, mesas: mesas, produtos: produtos, estoque: estoque, relatorios: relatorios, usuarios: usuarios })[ui.tab]();
  }
  function venda() {
    const open = store.db.comandas.filter((comanda) => !['fechada', 'cancelada'].includes(comanda.status));
    const products = store.db.products.filter((product) => !product.arquivado && product.disponivel && (product.nome + product.sku + product.categoria).toLowerCase().includes(ui.productSearch.toLowerCase()));
    const productGrid = products.length ? products.map((product) => {
      const count = ui.cart.find((item) => item.productId === product.id)?.qtd || 0;
      return `<button class="product-tile" data-action="add-cart" data-id="${product.id}" ${product.estoque === 0 ? 'disabled' : ''}><span class="tile-category">${esc(product.categoria || 'Cardápio')}</span><strong>${esc(product.nome)}</strong><span class="tile-bottom"><b>${brl(product.preco)}</b><small class="${product.estoque <= product.minimo ? 'low-text' : ''}">${product.estoque ? `${product.estoque} un.` : 'Esgotado'}</small></span>${count ? `<span class="cart-count">${count} no carrinho</span>` : ''}</button>`;
    }).join('') : '<div class="empty-state">Nenhum produto encontrado.</div>';
    return `<div class="sale-layout"><div class="catalog"><div class="section-intro"><div><h2>Cardápio</h2><p>Toque em um produto para adicionar ao pedido.</p></div><span class="count-label">${products.length} produtos</span></div><label class="searchbox"><span>⌕</span><input data-ui="productSearch" placeholder="Buscar produto, código ou categoria…" value="${esc(ui.productSearch)}"></label><div class="product-grid">${productGrid}</div></div>${card(`<div class="cart-head"><div><span class="eyebrow">PEDIDO ATUAL</span><h2>Carrinho</h2></div>${ui.cart.length ? btn('Limpar', 'clear-cart', 'text-button') : ''}</div>${ui.cart.length ? ui.cart.map((item) => `<div class="cart-row"><div class="cart-product"><b>${esc(item.nome)}</b><small>${brl(item.preco)} cada</small></div><div class="quantity"><button data-action="cart-minus" data-id="${item.productId}" aria-label="Diminuir">−</button><span>${item.qtd}</span><button data-action="cart-plus" data-id="${item.productId}" aria-label="Aumentar">+</button></div><b class="line-total">${brl(item.preco * item.qtd)}</b></div>`).join('') : '<div class="cart-empty"><span class="empty-basket">＋</span><b>Seu carrinho está vazio</b><p>Escolha um item do cardápio para começar.</p></div>'}<div class="cart-controls"><label class="field"><span>Vincular a uma comanda</span>${select(open.map((entry) => ({ value: entry.id, label: `#${entry.numero} · ${entry.cliente} (${entry.local})` })), ui.cartComanda, 'data-ui="cartComanda"', 'Venda avulsa · pagar agora')}</label>${!ui.cartComanda ? `<label class="field"><span>Forma de pagamento</span>${select(paymentOptions, ui.cartPayment, 'data-ui="cartPayment"')}</label>` : ''}<p class="form-error">${esc(ui.message)}</p><div class="total-line"><span>Total do pedido</span><b>${brl(total(ui.cart))}</b></div><button class="button button-primary full-width" data-action="send-order" ${ui.cart.length ? '' : 'disabled'}>Enviar pedido <span>→</span></button></div>`, 'cart-card')}</div>`;
  }
  function comandas() {
    const list = ui.backendComandas.filter((entry) => {
      const status = normalizeComandaStatus(entry.status);
      return ui.comandaFilter === 'ativas' ? !['fechada', 'cancelada'].includes(status) : ui.comandaFilter === 'todas' || status === ui.comandaFilter;
    });
    return `${ui.backendMessage ? `<p class="backend-alert" role="alert">${esc(ui.backendMessage)}</p>` : ''}<div class="card filter-bar comandas-filter-bar"><label class="field filter-field"><span>Mostrar</span>${select(['ativas', 'todas', 'aberta', 'em atendimento', 'aguardando pagamento', 'fechada', 'cancelada'], ui.comandaFilter, 'data-ui="comandaFilter"')}</label><button type="button" class="button button-outline button-small" data-action="refresh-comandas">Atualizar comandas</button></div>${ui.comandasLoading ? '<p class="menu-loading" role="status">Carregando comandas…</p>' : `<div class="card-grid">${list.length ? list.map(comandaCard).join('') : '<div class="empty-state">Nenhuma comanda nesta lista.</div>'}</div>`}`;
  }
  function normalizeComandaStatus(status) { return String(status || '').toLowerCase().replace(/_/g, ' ').trim(); }
  function comandaCard(comanda) {
    const pedidos = Array.isArray(comanda.pedidos) ? comanda.pedidos : [];
    const itens = pedidos.flatMap((pedido) => Array.isArray(pedido.itens) ? pedido.itens.map((item) => ({ ...item, pedidoId: pedido.id })) : []);
    const status = normalizeComandaStatus(comanda.status) || '—';
    const statusLabel = status.replace(/\b\w/g, (letter) => letter.toLocaleUpperCase('pt-BR'));
    const mesa = comanda.mesa?.numero;
    const testOrigin = comanda.origem === 'TESTE_LOCAL' ? 'Teste local · não enviado ao servidor' : comanda.origem === 'TESTE_REMOTO' ? 'Teste remoto · salvo no servidor' : '';
    return card(`<div class="entity-top"><div><div class="number-mark">#${esc(comanda.numero)}</div><h3>${esc(comanda.nomeCliente || 'Cliente')}</h3><p>${mesa != null ? `Mesa ${esc(mesa)}` : 'Sem mesa vinculada'} · ${date(comanda.dataAbertura)}</p></div><div>${testOrigin ? badge(testOrigin) : ''}${badge(statusLabel, status === 'cancelada')}</div></div>${itens.length ? `<div class="item-list">${itens.map((item) => { const quantity = Number(item.quantidade) || 0; const price = Number(item.precoUnitario) || 0; return `<div><span>${quantity} × ${esc(item.produto?.nome || 'Produto')} <small class="muted">· pedido #${esc(item.pedidoId)}</small></span><b>${brl(price * quantity)}</b></div>`; }).join('')}</div>` : '<p class="muted">Ainda não há itens nesta comanda.</p>'}<div class="total-line"><span>Total da comanda</span><b>${brl(comanda.valorTotal)}</b></div><p class="muted tiny">${pedidos.length} pedido(s)</p>`, 'entity-card');
  }
  function pedidos() {
    const list = [...ui.backendOrders, ...localTestOrders()].filter((order) => (!ui.orderStatus || order.status === ui.orderStatus) && (!ui.orderNumber || String(order.id).includes(ui.orderNumber)) && (!ui.orderDate || String(order.data || '').startsWith(ui.orderDate)));
    return `${ui.backendMessage ? `<p class="backend-alert" role="alert">${esc(ui.backendMessage)}</p>` : ''}<div class="card filter-bar">${select(Object.entries(orderStatuses).map(([value, label]) => ({ value, label })), ui.orderStatus, 'data-ui="orderStatus"', 'Todos os status')}<input data-ui="orderNumber" aria-label="Buscar pelo número do pedido" placeholder="Nº do pedido" value="${esc(ui.orderNumber)}"><input type="date" aria-label="Filtrar pedidos pela data" data-ui="orderDate" value="${esc(ui.orderDate)}"><button type="button" class="button button-outline button-small" data-action="refresh-orders">Atualizar pedidos</button></div>${ui.ordersLoading ? '<p class="menu-loading" role="status">Carregando pedidos…</p>' : `<div class="card-grid">${list.length ? list.map((order) => {
      const stages = ['PENDENTE', 'EM_PREPARO', 'PRONTO', 'ENTREGUE'];
      const current = order.status === 'TESTE' ? 0 : stages.indexOf(order.status);
      const nextStatuses = current < 0 || current >= stages.length - 1 ? [] : [stages[current + 1]];
      const customer = order.comanda?.nomeCliente || 'Cliente';
      const mesa = order.comanda?.mesa?.numero;
      const items = Array.isArray(order.itens) ? order.itens : [];
      const terminal = order.status === 'ENTREGUE' || order.status === 'CANCELADO';
      const testOrigin = order.origem === 'TESTE_LOCAL' ? 'Teste local · não enviado ao servidor' : order.origem === 'TESTE_REMOTO' ? 'Teste remoto · salvo no servidor' : '';
      return card(`<div class="entity-top"><div><div class="number-mark">Pedido #${esc(order.id)}</div><p>${date(order.data)}</p><p><b>${esc(customer)}</b>${mesa != null ? ` · Mesa ${esc(mesa)}` : ''}</p></div><div>${testOrigin ? badge(testOrigin) : ''}${badge(orderStatuses[order.status] || order.status, order.status === 'CANCELADO')}</div></div><div class="item-list order-items">${items.map((item) => `<div><span>${Number(item.quantidade) || 0} × ${esc(item.produto?.nome || 'Produto')}</span><b>${brl((Number(item.precoUnitario) || 0) * (Number(item.quantidade) || 0))}</b></div>`).join('') || '<p class="muted">Este pedido não tem itens.</p>'}</div><div class="total-line"><span>Total</span><b>${brl(order.valorTotal)}</b></div>${!terminal ? `<div class="order-controls"><label class="field"><span>Atualizar status</span><select data-order-status="${esc(order.id)}" data-order-origin="${esc(order.origem || 'REAL')}" aria-label="Atualizar status do pedido ${esc(order.id)}">${options([{ value: order.status, label: orderStatuses[order.status] || order.status }, ...nextStatuses.map((status) => ({ value: status, label: orderStatuses[status] }))], order.status)}</select></label>${btn('Cancelar pedido', 'cancel-order', 'text-button danger-text', `data-id="${esc(order.id)}" data-origin="${esc(order.origem || 'REAL')}"`)}</div>` : ''}`, 'entity-card');
    }).join('') : '<div class="empty-state">Nenhum pedido encontrado.</div>'}</div>`}`;
  }
  function mesas() {
    return `${ui.backendMessage ? `<p class="backend-alert" role="alert">${esc(ui.backendMessage)}</p>` : ''}${card(`<form id="mesa-form" class="inline-form"><label class="field"><span>Número da mesa</span><input name="numero" type="number" min="1" step="1" inputmode="numeric" required aria-label="Número da nova mesa" placeholder="Ex.: 12"></label><button class="button button-primary">＋ Cadastrar mesa</button></form>`, 'mesa-create-card')}<section class="mesa-toolbar"><div><h2>Mesas cadastradas</h2><p>Imprima um cartão para cada mesa ou salve todos os QR codes.</p></div><div class="action-row"><a class="button button-outline button-small" href="/api/mesas/qrcodes.zip" download>Baixar todos os QR codes</a><button class="button button-primary button-small" type="button" data-action="print-mesas">Imprimir cartões</button><button class="button button-outline button-small" type="button" data-action="refresh-tables">Atualizar</button></div></section>${ui.tablesLoading ? '<p class="menu-loading" role="status">Carregando mesas…</p>' : `<div class="mesa-grid">${ui.backendTables.length ? ui.backendTables.map((mesa) => card(`<div class="mesa-card-heading"><span class="eyebrow">DINHO'S · CANAL 6</span><strong>Mesa ${esc(mesa.numero)}</strong></div><img class="mesa-qr" src="/api/mesas/${encodeURIComponent(mesa.id)}/qrcode.png" alt="QR code da Mesa ${esc(mesa.numero)}"><p>Aponte a câmera para abrir o cardápio.</p><a class="text-button mesa-download" href="/api/mesas/${encodeURIComponent(mesa.id)}/qrcode.png" download="mesa-${esc(mesa.numero)}.png">Baixar QR code desta mesa</a>`, 'mesa-card')).join('') : '<div class="empty-state">Nenhuma mesa cadastrada ainda.</div>'}</div>`}`;
  }
  function productForm() {
    const product = ui.productForm || { nome: '', sku: '', categoria: '', descricao: '', custo: 0, preco: 0, estoque: 0, minimo: 5 };
    const stockValid = validStock(product.estoque);
    const stockDisabled = Boolean(product.id) && stockValid;
    const stockField = input(product.id ? 'Estoque' : 'Estoque inicial', 'estoque', stockValid ? stockValue(product.estoque) : '', 'number', `min="0" step="1" ${stockDisabled ? 'disabled' : 'required'}`);
    const categoryOptions = store.productCategories();
    return `<form id="product-form" class="form-stack"><div class="form-title"><span class="eyebrow">CARDÁPIO</span><h2>${product.id ? 'Editar produto' : 'Novo produto'}</h2></div>${input('Nome do produto', 'nome', product.nome, 'text', 'required maxlength="100"')}${input('Código / SKU', 'sku', product.sku)}<label class="field"><span>Categoria</span>${select(categoryOptions, categoryName(product.categoria), 'name="categoria" required', 'Selecione uma categoria')}</label>${input('Descrição', 'descricao', product.descricao)}<div class="two-fields">${input('Custo', 'custo', product.custo, 'number', 'min="0" step="0.01"')}${input('Preço de venda', 'preco', product.preco, 'number', 'min="0.01" step="0.01" required')}</div><div class="two-fields">${stockField}${input('Estoque mínimo', 'minimo', product.minimo ?? 5, 'number', 'min="0" step="1" required')}</div>${stockDisabled ? '<p class="muted tiny">Para alterar este saldo, use a aba Estoque.</p>' : ''}<p class="muted tiny">As categorias vêm dos produtos já cadastrados.</p><p class="form-error">${esc(ui.error)}</p><div class="action-row"><button class="button button-primary">Salvar produto</button>${product.id ? btn('Cancelar', 'cancel-product-edit', 'button button-outline') : ''}</div></form>`;
  }
  function produtos() {
    const list = store.db.products.filter((product) => (product.nome + product.sku + product.categoria).toLowerCase().includes(ui.productListSearch.toLowerCase())).sort((a, b) => a.nome.localeCompare(b.nome));
       return `<div class="management-layout">${card(productForm(), 'form-card')}<section class="card table-card"><div class="table-heading"><div><span class="eyebrow">SEU CARDÁPIO</span><h2>Produtos <small>${list.length}</small></h2></div><div class="action-row"><button type="button" class="button button-outline button-small" data-action="export-catalog">Exportar catálogo</button><button type="button" class="button button-outline button-small" data-action="choose-catalog-import" ${ui.productImportBusy ? 'disabled' : ''}>${ui.productImportBusy ? 'Importando…' : 'Importar catálogo'}</button><button type="button" class="button button-outline button-small" data-action="sync-products" title="${ui.backendUser.role === 'admin' ? 'Enviar e atualizar produtos na nuvem' : 'A sincronização exige perfil de administrador'}" ${ui.productSyncBusy || ui.backendUser.role !== 'admin' ? 'disabled' : ''}>${ui.productSyncBusy ? 'Salvando…' : 'Salvar na nuvem (Recomendado)'}</button><label class="searchbox compact"><span>⌕</span><input data-ui="productListSearch" placeholder="Pesquisar…" value="${esc(ui.productListSearch)}"></label></div></div><input id="catalog-import-file" type="file" accept="application/json,.json" hidden>${ui.productNotice ? `<p class="success-note" role="status">${esc(ui.productNotice)}</p>` : ''}<div class="table-scroll"><table><thead><tr><th>Produto</th><th>Categoria</th><th>Custo</th><th>Venda</th><th>Estoque</th><th>Ações</th></tr></thead><tbody>${list.map((product) => `<tr class="${product.arquivado || !product.disponivel ? 'inactive-row' : ''}"><td><b>${esc(product.nome)}</b><small>${esc(product.sku)}</small>${product.arquivado ? '<small class="archived-label">Excluído · fora do cardápio</small>' : ''}</td><td>${esc(categoryName(product.categoria))}</td><td>${brl(product.custo)}</td><td><b>${brl(product.preco)}</b></td><td class="${stockValue(product.estoque) <= (Number(product.minimo) || 0) ? 'low-text' : ''}">${stockValue(product.estoque)}</td><td class="table-actions">${btn('Editar', 'edit-product', 'button button-outline button-small', `data-id="${product.id}"`)}${product.arquivado ? btn('Restaurar', 'restore-product', 'text-button', `data-id="${product.id}"`) : `${btn(product.disponivel ? 'Desativar' : 'Ativar', 'toggle-product', 'text-button', `data-id="${product.id}"`)}${btn('Excluir', 'archive-product', 'text-button danger-text', `data-id="${product.id}" aria-label="Excluir ${esc(product.nome)}"`)}`}</td></tr>`).join('') || '<tr><td colspan="6" class="muted">Nenhum produto encontrado.</td></tr>'}</tbody></table></div></section></div>`;
  }
  function estoque() {
    const low = store.db.products.filter((product) => product.disponivel && stockValue(product.estoque) <= (Number(product.minimo) || 0));
    const activeProducts = store.db.products.filter((product) => !product.arquivado);
    const selectedProduct = activeProducts.some((product) => product.id === ui.stockProduct) ? ui.stockProduct : activeProducts[0]?.id;
    return `${low.length ? `<div class="alert-card"><span>!</span><div><b>Estoque baixo</b><p>${low.map((product) => `${esc(product.nome)} (${stockValue(product.estoque) === 0 ? 'sem estoque' : stockValue(product.estoque)})`).join(' · ')}</p></div></div>` : ''}${card(`<form id="stock-form" class="inline-form stock-form"><label class="field"><span>Produto</span>${select(activeProducts.map((product) => ({ value: product.id, label: `${product.nome} (${stockValue(product.estoque)})` })), selectedProduct, 'name="productId"', activeProducts.length ? '' : 'Nenhum produto ativo')}</label><label class="field"><span>Movimentação</span>${select(['entrada', 'saída', 'ajuste', 'devolução'], ui.stockType, 'name="tipo"')}</label>${input(ui.stockType === 'ajuste' ? 'Novo saldo' : 'Quantidade', 'qtd', ui.stockQty, 'number', `min="${ui.stockType === 'ajuste' ? '0' : '1'}" step="1" required`)}${input('Motivo', 'motivo', '', 'text', 'placeholder="Ex.: reposição do dia" maxlength="100"')}<button class="button button-primary" ${activeProducts.length ? '' : 'disabled'}>Registrar movimento</button><p class="form-error">${esc(ui.error)}</p></form>`, 'stock-entry')}<section class="card table-card"><div class="table-heading"><div><span class="eyebrow">MOVIMENTO DE MERCADORIA</span><h2>Movimentações <small>${Math.min(store.db.movs.length, 200)}</small></h2></div></div><div class="table-scroll"><table><thead><tr><th>Data</th><th>Produto</th><th>Tipo</th><th>Qtd.</th><th>Saldo</th><th>Usuário</th><th>Motivo</th></tr></thead><tbody>${store.db.movs.slice(0, 200).map((move) => `<tr><td>${date(move.data)}</td><td>${esc(move.nome)}</td><td>${esc(move.tipo)}</td><td>${move.qtd}</td><td>${move.antes} → ${move.depois}</td><td>${esc(move.usuario)}</td><td>${esc(move.motivo)}</td></tr>`).join('') || '<tr><td colspan="7" class="muted">Ainda não há movimentações.</td></tr>'}</tbody></table></div></section>`;
  }
  function relatorios() {
    const day = ui.reportDate;
    const orders = realBackendOrders().filter((order) => String(order.status || '').toUpperCase() !== 'CANCELADO' && (!day || orderDay(order.data) === day));
    const remoteTests = remoteTestOrders().filter((order) => String(order.status || '').toUpperCase() !== 'CANCELADO' && (!day || orderDay(order.data) === day));
    const testOrders = localTestOrders().filter((order) => String(order.status || '').toUpperCase() !== 'CANCELADO' && (!day || orderDay(order.data) === day));
    const testTotal = testOrders.reduce((sum, order) => sum + (Number(order.valorTotal) || 0), 0);
    const remoteTestTotal = remoteTests.reduce((sum, order) => sum + (Number(order.valorTotal) || 0), 0);
    let revenue = 0; let itemsSold = 0; const top = {};
    orders.forEach((order) => {
      const items = Array.isArray(order.itens) ? order.itens : [];
      revenue += Number(order.valorTotal) || 0;
      items.forEach((item) => {
        const quantity = Number(item.quantidade) || 0;
        itemsSold += quantity;
        const name = item.produto?.nome || 'Produto';
        top[name] = (top[name] || 0) + quantity;
      });
    });
    return `${ui.backendMessage ? `<p class="backend-alert" role="alert">${esc(ui.backendMessage)}</p>` : ''}<div class="report-date"><label class="field"><span>Dia do relatório</span><input type="date" data-ui="reportDate" value="${esc(day)}"></label><span>Vendas reais e testes locais/remotos são exibidos separadamente${day ? ` · ${new Date(`${day}T12:00:00`).toLocaleDateString('pt-BR')}` : ''}</span></div>${ui.ordersLoading ? '<p class="menu-loading" role="status">Carregando vendas…</p>' : ''}${ui.backendMessage ? '' : `<div class="stats-grid">${stat('Faturamento real', brl(revenue), 'R$')}${stat('Itens vendidos', itemsSold, '▤')}${stat('Pedidos reais', orders.length, '◷')}${stat('Ticket médio real', brl(orders.length ? revenue / orders.length : 0), '◉')}</div><div class="report-grid">${card(`<div class="table-heading"><div><span class="eyebrow">DESTAQUES</span><h2>Mais vendidos · vendas reais</h2></div><span class="report-icon">✳</span></div>${Object.entries(top).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, qty], index) => `<div class="rank-row"><span class="rank">${String(index + 1).padStart(2, '0')}</span><span>${esc(name)}</span><b>${qty} un.</b></div>`).join('') || '<p class="muted">Sem vendas neste período.</p>'}`)}${card(`<div class="table-heading"><div><span class="eyebrow">CAIXA</span><h2>Pagamentos</h2></div><span class="report-icon">＄</span></div><p class="muted">Os pedidos carregados não incluem o detalhamento por forma de pagamento.</p>`)}</div>`}${card(`<div class="table-heading"><div><span class="eyebrow">APRESENTAÇÃO</span><h2>Testes no servidor · não são vendas reais</h2></div><span class="report-icon">◷</span></div><div class="stats-grid">${stat('Pedidos de teste remotos', remoteTests.length, '◷')}${stat('Total dos testes remotos', brl(remoteTestTotal), 'R$')}</div><p class="muted">Estes pedidos foram salvos no servidor como testes, mas não entram no faturamento real.</p>`) }${card(`<div class="table-heading"><div><span class="eyebrow">APRESENTAÇÃO</span><h2>Testes locais · somente neste navegador</h2></div><span class="report-icon">◷</span></div><div class="stats-grid">${stat('Pedidos de teste locais', testOrders.length, '◷')}${stat('Total dos testes locais', brl(testTotal), 'R$')}</div><p class="muted">Estes valores não foram enviados ao servidor e não entram no faturamento real.</p>`)}`;
  }
  function orderDay(value) { return String(value ?? '').match(/^\d{4}-\d{2}-\d{2}/)?.[0] || ''; }
  function stat(label, value, icon) { return card(`<span class="stat-icon">${icon}</span><p>${label}</p><strong>${value}</strong><span class="stat-foot">no período selecionado</span>`, 'stat-card'); }
  function usuarios() {
    const user = ui.userForm || { nome: '', email: '', senha: '', role: 'atendente' };
    return `<div class="management-layout">${card(`<form id="user-form" class="form-stack"><div class="form-title"><span class="eyebrow">EQUIPE</span><h2>${user.id ? 'Editar usuário' : 'Novo usuário'}</h2></div>${input('Nome', 'nome', user.nome, 'text', 'required')}${input('E-mail', 'email', user.email, 'email', 'required')}${input(user.id ? 'Nova senha (opcional)' : 'Senha', 'senha', '', 'password', `${user.id ? '' : 'required'} minlength="6"`)}<label class="field"><span>Perfil de acesso</span>${select(['atendente', 'gerente', 'admin'], user.role, 'name="role"')}</label><p class="form-error">${esc(ui.error)}</p><button class="button button-primary">Salvar usuário</button></form>`, 'form-card')}<section class="card table-card"><div class="table-heading"><div><span class="eyebrow">ACESSO AO SISTEMA</span><h2>Usuários <small>${store.db.users.length}</small></h2></div></div><div class="table-scroll"><table><thead><tr><th>Nome</th><th>E-mail</th><th>Perfil</th><th>Cadastro</th><th></th></tr></thead><tbody>${store.db.users.map((entry) => `<tr class="${entry.ativo ? '' : 'inactive-row'}"><td><b>${esc(entry.nome)}</b></td><td>${esc(entry.email)}</td><td>${badge(entry.role)}</td><td>${date(entry.criado)}</td><td class="table-actions">${btn('Editar', 'edit-user', 'button button-outline button-small', `data-id="${entry.id}"`)}${entry.id !== store.me.id ? btn(entry.ativo ? 'Desativar' : 'Ativar', 'toggle-user', 'text-button', `data-id="${entry.id}"`) : ''}</td></tr>`).join('')}</tbody></table></div></section></div>`;
  }
  function formData(form) { return Object.fromEntries(new FormData(form).entries()); }
  function keepFocus(element, callback) {
    const field = element.dataset.ui; const start = element.selectionStart; const end = element.selectionEnd;
    callback(); render(); const next = root.querySelector(`[data-ui="${field}"]`); if (next) { next.focus(); if (typeof start === 'number') next.setSelectionRange(start, end); }
  }
  root.addEventListener('input', (event) => {
    const target = event.target;
    if (target.dataset.ui) {
      ui[target.dataset.ui] = target.value;
      if (['productSearch', 'productListSearch', 'orderNumber'].includes(target.dataset.ui)) keepFocus(target, () => { ui[target.dataset.ui] = target.value; });
    }
  });
  root.addEventListener('change', (event) => {
    const target = event.target;
    if (target.id === 'catalog-import-file') {
      const file = target.files?.[0];
      target.value = '';
      if (file) importCatalogFile(file);
      return;
    }
    if (target.dataset.orderStatus) { updateOrderStatus(target.dataset.orderStatus, target.value, target.dataset.orderOrigin); return; }
    if (target.dataset.ui) { ui[target.dataset.ui] = target.value; render(); }
    if (target.name === 'tipo') { ui.stockType = target.value; render(); }
    if (target.name === 'productId') ui.stockProduct = target.value;
    if (target.dataset.action === 'discount') store.updComanda(target.dataset.id, { desconto: Math.max(0, Number(target.value) || 0) });
  });
  root.addEventListener('click', (event) => {
    const tab = event.target.closest('[data-tab]');
    if (tab) { ui.tab = tab.dataset.tab; ui.message = ''; ui.error = ''; render(); if (ui.tab === 'pedidos' || ui.tab === 'relatorios') loadOrders(); if (ui.tab === 'comandas') loadComandas(); if (ui.tab === 'mesas') loadTables(); return; }
    const control = event.target.closest('[data-action]'); if (!control) return;
    const { action, id } = control.dataset;
    if (action === 'logout') { logout(); return; }
    if (action === 'refresh-orders') { loadOrders(); return; }
    if (action === 'refresh-comandas') { loadComandas(); return; }
    if (action === 'refresh-tables') { loadTables(); return; }
    if (action === 'export-catalog') { exportCatalog(); return; }
    if (action === 'choose-catalog-import') { root.querySelector('#catalog-import-file')?.click(); return; }
    if (action === 'sync-products') { syncProductsToCloud(); return; }
    if (action === 'print-mesas') { window.print(); return; }
    if (action === 'clear-cart') { ui.cart = []; ui.message = ''; render(); }
    if (action === 'add-cart' || action === 'cart-plus' || action === 'cart-minus') {
      const product = store.db.products.find((entry) => entry.id === id);
      const existing = ui.cart.find((entry) => entry.productId === id);
      const quantity = (existing?.qtd || 0) + (action === 'cart-minus' ? -1 : 1);
      if (quantity > product.estoque) { ui.message = `Só há ${product.estoque} de ${product.nome} em estoque`; }
      else { ui.message = ''; ui.cart = quantity <= 0 ? ui.cart.filter((entry) => entry.productId !== id) : existing ? ui.cart.map((entry) => entry.productId === id ? { ...entry, qtd: quantity } : entry) : [...ui.cart, { productId: id, nome: product.nome, preco: product.preco, qtd: quantity }]; }
      render();
    }
    if (action === 'send-order') { const error = store.criarPedido(ui.cart, ui.cartPayment, ui.cartComanda || undefined); if (error) ui.message = error; else { ui.cart = []; ui.message = ''; } render(); }
    if (action === 'ask-bill') { store.updComanda(id, { status: 'aguardando pagamento' }); }
    if (action === 'close-bill') { const payment = root.querySelector(`[data-payment="${id}"]`)?.value || 'Pix'; store.updComanda(id, { status: 'fechada', pagamento: payment, fechada: new Date().toISOString() }); }
    if (action === 'cancel-comanda' && confirm('Cancelar comanda?')) store.updComanda(id, { status: 'cancelada' });
    if (action === 'cancel-order' && confirm('Cancelar este pedido?')) cancelOrder(id, control.dataset.origin);
    if (action === 'edit-product') { ui.productForm = { ...store.db.products.find((entry) => entry.id === id) }; ui.error = ''; ui.productNotice = ''; render(); }
    if (action === 'cancel-product-edit') { ui.productForm = null; ui.error = ''; render(); }
    if (action === 'toggle-product') { const product = store.db.products.find((entry) => entry.id === id); if (product && !product.arquivado) store.saveProduct({ id, disponivel: !product.disponivel }); }
    if (action === 'archive-product') {
      const product = store.db.products.find((entry) => entry.id === id);
       if (product && confirm(`Excluir “${product.nome}” do cardápio? Ele será desativado, mas continuará nos pedidos e relatórios anteriores.`)) {
        store.archiveProduct(id);
        if (ui.productForm?.id === id) ui.productForm = null;
         ui.productNotice = `${product.nome} foi excluído do cardápio. O histórico foi preservado.`;
        ui.error = '';
        render();
      }
    }
    if (action === 'restore-product') {
      const product = store.db.products.find((entry) => entry.id === id);
      if (product) {
        store.restoreProduct(id);
        ui.productNotice = `${product.nome} foi restaurado como inativo. Ative-o para voltar a vender.`;
        render();
      }
    }
    if (action === 'edit-user') { const user = store.db.users.find((entry) => entry.id === id); ui.userForm = { id, nome: user.nome, email: user.email, senha: '', role: user.role }; ui.error = ''; render(); }
    if (action === 'toggle-user') { const user = store.db.users.find((entry) => entry.id === id); store.saveUser({ id, ativo: !user.ativo }); }
  });
  root.addEventListener('submit', (event) => {
    event.preventDefault(); const form = event.target; const data = formData(form);
    if (form.id === 'login-form') { authenticate(data); return; }
    if (form.id === 'mesa-form') { createTable(data); return; }
    if (form.id === 'comanda-form') { if (data.cliente.trim()) store.abrirComanda(data.cliente.trim(), data.local.trim() || '—'); }
    if (form.id === 'product-form') {
      const existing = ui.productForm?.id ? store.db.products.find((entry) => entry.id === ui.productForm.id) : null;
      const stockRequired = !existing || !validStock(existing.estoque);
      const hasStock = Object.prototype.hasOwnProperty.call(data, 'estoque');
      const rawStock = data.estoque;
      const product = {
        ...data,
        nome: data.nome.trim(),
        categoria: categoryName(data.categoria),
        custo: Number(data.custo),
        preco: Number(data.preco),
        minimo: Number(data.minimo),
      };
      const categoryKeyExists = store.productCategories().some((category) => categoryKey(category) === categoryKey(product.categoria));
      const showProductError = (message) => {
        ui.error = message;
        ui.productForm = { ...(ui.productForm || {}), ...data };
        render();
      };
      delete product.estoque;
      if (!product.nome) { showProductError('Informe o nome do produto.'); return; }
      if (!product.categoria || !categoryKeyExists) { showProductError('Selecione uma categoria já cadastrada.'); return; }
      if (!Number.isFinite(product.preco) || product.preco <= 0 || !Number.isFinite(product.custo) || product.custo < 0) { showProductError('Informe valores válidos para custo e preço de venda.'); return; }
      if (!Number.isInteger(product.minimo) || product.minimo < 0) { showProductError('Informe um estoque mínimo inteiro maior ou igual a zero.'); return; }
      if (hasStock) {
        if (!validStock(rawStock)) { showProductError('Estoque deve ser um número inteiro maior ou igual a zero.'); return; }
        product.estoque = Number(rawStock);
      } else if (stockRequired) {
        showProductError('Informe um estoque inteiro maior ou igual a zero para este produto.'); return;
      }
      if (ui.productForm?.id) product.id = ui.productForm.id;
      store.saveProduct(product); ui.productForm = null; ui.error = ''; ui.productNotice = 'Produto salvo com sucesso.'; render();
    }
    if (form.id === 'user-form') {
      const existing = ui.userForm?.id;
      if (!data.nome.trim() || !/^\S+@\S+\.\S+$/.test(data.email) || (!existing && data.senha.length < 6)) { ui.error = 'Informe nome, e-mail válido e senha (mín. 6 caracteres).'; render(); return; }
      if (store.db.users.some((user) => user.email.toLowerCase() === data.email.toLowerCase() && user.id !== existing)) { ui.error = 'Este e-mail já está cadastrado.'; render(); return; }
      if (existing) { data.id = existing; if (!data.senha) delete data.senha; } else if (!data.senha) delete data.senha;
      store.saveUser(data); ui.userForm = null; ui.error = '';
    }
    if (form.id === 'stock-form') {
      const quantity = Number(data.qtd);
      if (!Number.isInteger(quantity) || quantity < (data.tipo === 'ajuste' ? 0 : 1)) { ui.error = 'Informe uma quantidade válida.'; render(); return; }
      ui.error = store.stock(data.productId, data.tipo, quantity, data.motivo || data.tipo); render();
    }
  });
  window.addEventListener('dinhos:change', render);
  render();
  async function authenticate(data) {
    ui.error = ''; ui.authLoading = true; render();
    try {
      const csrf = await api('/api/auth/csrf');
      ui.csrfToken = csrf?.token || csrf?.csrfToken || '';
      ui.csrfDisabled = !ui.csrfToken;
      if (ui.csrfDisabled) {
        if (!store.login(data.email.trim(), data.senha)) throw new Error('E-mail ou senha inválidos.');
        ui.backendUser = currentUser(store.me);
      } else {
        await api('/api/auth/login', { method: 'POST', csrf: true, body: { email: data.email.trim(), senha: data.senha } });
        const response = await api('/api/auth/me');
        ui.backendUser = currentUser(response);
      }
      if (!ui.backendUser) throw new Error('A sessão não foi confirmada. Confira seus dados e tente novamente.');
      ui.tab = 'pedidos';
    } catch (error) {
      ui.backendUser = null;
      ui.error = error.message || 'Não foi possível entrar. Confira seus dados.';
    } finally { ui.authLoading = false; render(); if (ui.backendUser && ui.tab === 'pedidos') loadOrders(); }
  }
  async function logout() {
    if (!ui.csrfDisabled) {
      try { await api('/api/auth/logout', { method: 'POST', csrf: true }); }
      catch (error) { ui.backendMessage = error.message; }
    }
    const localSession = ui.csrfDisabled;
    ui.backendUser = null; ui.csrfToken = ''; ui.error = ''; ui.authLoading = false;
    if (localSession) store.logout(); else store.useSessionUser(null);
    render();
  }
  async function updateOrderStatus(id, status, origin = 'REAL') {
    if (origin === 'TESTE_LOCAL') {
      const error = store.statusPedidoTeste(id, status);
      if (error) { ui.backendMessage = error; render(); }
      return;
    }
    const path = origin === 'TESTE_REMOTO'
      ? `/api/pedidos/testes/${encodeURIComponent(id)}/status?status=${encodeURIComponent(status)}`
      : `/api/pedidos/${encodeURIComponent(id)}/status?status=${encodeURIComponent(status)}`;
    try {
      await api(path, { method: 'PATCH', csrf: true });
      ui.backendMessage = '';
    } catch (error) { ui.backendMessage = error.message; }
    await loadOrders(true);
  }
  async function cancelOrder(id, origin = 'REAL') {
    if (origin === 'TESTE_LOCAL') {
      const error = store.statusPedidoTeste(id, 'CANCELADO');
      if (error) { ui.backendMessage = error; render(); }
      return;
    }
    if (origin === 'TESTE_REMOTO') {
      try {
        await api(`/api/pedidos/testes/${encodeURIComponent(id)}/cancelar`, { method: 'POST', csrf: true });
        ui.backendMessage = '';
      } catch (error) { ui.backendMessage = error.message; }
      await loadOrders(true);
      return;
    }
    await cancelBackendOrder(id);
  }
  async function cancelBackendOrder(id) {
    try {
      await api(`/api/pedidos/${encodeURIComponent(id)}/cancelar`, { method: 'POST', csrf: true });
      ui.backendMessage = '';
    } catch (error) { ui.backendMessage = error.message; }
    await loadOrders(true);
  }
  function exportCatalog() {
    const products = (store.db.products || []).map((product) => ({
      nome: product.nome,
      descricao: product.descricao || '',
      sku: product.sku || '',
      categoria: product.categoria,
      custo: Number(product.custo),
      preco: Number(product.preco),
      estoque: stockValue(product.estoque),
      minimo: Number(product.minimo) || 0,
      disponivel: product.disponivel === true,
      arquivado: product.arquivado === true,
    }));
    const payload = { format: 'dinhos-catalog', version: 1, exportedAt: new Date().toISOString(), products };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dinhos-catalogo-${localToday}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    ui.productNotice = `Catálogo exportado: ${products.length} produto(s), incluindo estoque e itens arquivados. O arquivo não contém usuários nem pedidos.`;
    render();
  }
  async function importCatalogFile(file) {
    if (ui.productImportBusy) return;
    ui.productImportBusy = true; ui.productNotice = ''; render();
    try {
      const payload = JSON.parse(await file.text());
      if (!payload || payload.format !== 'dinhos-catalog' || payload.version !== 1 || !Array.isArray(payload.products) || payload.products.length === 0) {
        throw new Error('Arquivo inválido. Selecione um JSON exportado como catálogo Dinho’s.');
      }
      const products = payload.products.map((product, index) => {
        const row = index + 1;
        if (!product || typeof product !== 'object' || Array.isArray(product)
          || typeof product.nome !== 'string' || !product.nome.trim()
          || typeof product.categoria !== 'string' || !product.categoria.trim()
          || (product.descricao !== undefined && typeof product.descricao !== 'string')
          || (product.sku !== undefined && typeof product.sku !== 'string')
          || typeof product.preco !== 'number' || !Number.isFinite(product.preco) || product.preco <= 0
          || typeof product.estoque !== 'number' || !validStock(product.estoque)
          || typeof product.custo !== 'number' || !Number.isFinite(product.custo) || product.custo < 0
          || typeof product.minimo !== 'number' || !Number.isInteger(product.minimo) || product.minimo < 0
          || typeof product.disponivel !== 'boolean'
          || (product.arquivado !== undefined && typeof product.arquivado !== 'boolean')) {
          throw new Error(`Produto ${row} inválido: confira nome, categoria, preço, estoque e disponibilidade.`);
        }
        return {
          nome: product.nome.trim(), descricao: product.descricao || '', sku: product.sku || '',
          categoria: categoryName(product.categoria), custo: product.custo, preco: product.preco,
          estoque: Number(product.estoque), minimo: product.minimo, disponivel: product.disponivel,
          arquivado: product.arquivado === true,
        };
      });
      const result = store.importCatalogProducts(products);
      const imported = result.created + result.updated;
      ui.productNotice = `Catálogo importado: ${imported} produto(s), ${result.created} novo(s), ${result.updated} atualizado(s), ${result.errors.length} erro(s).${result.errors.length ? ` ${result.errors[0]}` : ''} Agora você pode usar “Salvar na nuvem (Recomendado)”.`;
    } catch (error) {
      ui.productNotice = `Não foi possível importar o catálogo: ${error.message || 'arquivo inválido.'}`;
    } finally { ui.productImportBusy = false; render(); }
  }
  function cloudProductPayload(product, serverStock) {
    const payload = {
      nome: String(product.nome || '').trim(),
      descricao: String(product.descricao || ''),
      preco: Number(product.preco),
      estoqueMinimo: Number(product.minimo) || 0,
      categoria: categoryName(product.categoria),
      disponibilidade: product.disponivel === true,
    };
    if (serverStock !== undefined) payload.quantidadeEstoque = serverStock;
    return payload;
  }
  function cloudProductKey(product) { return `${categoryKey(product.nome)}\u0000${categoryKey(product.categoria)}`; }
  function cloudProductId(product) { return product?.id ?? product?.produtoId ?? product?.serverId ?? null; }
  function cloudProductChanged(serverProduct, payload) {
    return String(serverProduct.nome || '') !== payload.nome
      || String(serverProduct.descricao || '') !== payload.descricao
      || Number(serverProduct.preco) !== payload.preco
      || Number(serverProduct.estoqueMinimo) !== payload.estoqueMinimo
      || categoryKey(serverProduct.categoria) !== categoryKey(payload.categoria)
      || serverProduct.disponibilidade !== payload.disponibilidade;
  }
  async function syncProductsToCloud() {
    if (ui.productSyncBusy) return;
    ui.productSyncBusy = true; ui.productNotice = ''; render();
    const result = { created: 0, associated: 0, updated: 0, errors: [] };
    try {
      let serverProducts = listFrom(await api('/api/produtos'));
      const localIds = store.db.products.filter((product) => !product.arquivado).map((product) => product.id);
      const linkedIds = new Set(store.db.products.map((product) => product.serverId == null ? '' : String(product.serverId)).filter(Boolean));
      const usedServerIds = new Set();
      for (const localId of localIds) {
        let local = store.db.products.find((product) => product.id === localId);
        if (!local) continue;
        try {
          let server = local.serverId == null ? null : serverProducts.find((product) => String(cloudProductId(product)) === String(local.serverId));
          let associatedByMatch = false;
          if (local.serverId != null && !server) throw new Error(`O produto ${local.nome} está associado ao ID ${local.serverId}, que não aparece no catálogo do servidor.`);
          if (!server) {
            const candidates = serverProducts.filter((product) => cloudProductKey(product) === cloudProductKey(local)
              && !usedServerIds.has(String(cloudProductId(product)))
              && (!linkedIds.has(String(cloudProductId(product))) || String(local.serverId) === String(cloudProductId(product))));
            if (candidates.length === 1) { server = candidates[0]; associatedByMatch = true; }
          }
          if (!server) {
            const payload = cloudProductPayload(local, stockValue(local.estoque));
            const existingServerIds = new Set(serverProducts.map((product) => String(cloudProductId(product))));
            const created = await api('/api/produtos', { method: 'POST', csrf: true, body: payload });
            let serverId = cloudProductId(created?.produto || created?.data || created);
            if (serverId == null) {
              serverProducts = listFrom(await api('/api/produtos'));
              const candidates = serverProducts.filter((product) => cloudProductKey(product) === cloudProductKey(local)
                && !existingServerIds.has(String(cloudProductId(product))));
              if (candidates.length === 1) { server = candidates[0]; serverId = cloudProductId(server); }
            } else {
              server = { ...payload, id: serverId };
              serverProducts.push(server);
            }
            if (serverId == null) throw new Error(`O servidor criou ${local.nome}, mas não retornou um identificador único; confira o catálogo antes de repetir.`);
            store.saveProduct({ id: local.id, serverId });
            linkedIds.add(String(serverId)); usedServerIds.add(String(serverId)); result.created += 1;
            continue;
          }

          const serverId = cloudProductId(server);
          if (serverId == null) throw new Error(`Não foi possível identificar o produto correspondente a ${local.nome}.`);
          usedServerIds.add(String(serverId));
          if (associatedByMatch && local.serverId == null) {
            store.saveProduct({ id: local.id, serverId });
            linkedIds.add(String(serverId));
            result.associated += 1;
            local = store.db.products.find((product) => product.id === localId) || local;
          }

          const serverStock = Number(server.quantidadeEstoque);
          if (!Number.isInteger(serverStock) || serverStock < 0) throw new Error(`O servidor não informou um estoque válido para ${local.nome}; o saldo local não será enviado.`);
          if (Number(local.estoque) !== serverStock) {
            store.saveProduct({ id: local.id, serverId, estoque: serverStock });
            local = store.db.products.find((product) => product.id === localId) || local;
          }
          const payload = cloudProductPayload(local, serverStock);
          if (cloudProductChanged(server, payload)) {
            await api(`/api/produtos/${encodeURIComponent(serverId)}`, { method: 'PUT', csrf: true, body: payload });
            Object.assign(server, payload);
            result.updated += 1;
          }
        } catch (error) { result.errors.push(`${local.nome}: ${error.message}`); }
      }
      ui.productNotice = `Salvo na nuvem: ${result.created} criado(s), ${result.associated} associado(s), ${result.updated} atualizado(s), ${result.errors.length} erro(s).${result.errors.length ? ` ${result.errors[0]}` : ''}`;
    } catch (error) {
      ui.productNotice = `Não foi possível salvar o catálogo na nuvem: ${error.message}`;
    } finally { ui.productSyncBusy = false; render(); }
  }
  async function createTable(data) {
    const numero = Number(data.numero);
    if (!Number.isInteger(numero) || numero < 1) { ui.backendMessage = 'Informe um número de mesa válido.'; render(); return; }
    try {
      await api('/api/mesas', { method: 'POST', csrf: true, body: { numero } });
      ui.backendMessage = '';
      await loadTables();
    } catch (error) { ui.backendMessage = error.message; render(); }
  }
  async function rehydrateSession() {
    try {
      const csrf = await api('/api/auth/csrf');
      ui.csrfToken = csrf?.token || csrf?.csrfToken || '';
      ui.csrfDisabled = !ui.csrfToken;
      if (!ui.csrfDisabled) {
        const session = await api('/api/auth/me');
        ui.backendUser = currentUser(session);
        if (ui.backendUser) {
          store.useSessionUser(ui.backendUser);
          ui.tab = 'pedidos';
        }
      }
    } catch (_) { ui.backendUser = null; }
    finally {
      ui.authLoading = false;
      render();
      if (ui.backendUser && ui.tab === 'pedidos') loadOrders();
    }
  }
  rehydrateSession();
})();
