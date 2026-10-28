(function () {
  'use strict';
  const store = window.DinhosStore;
  const root = document.getElementById('app');
  const tabs = [
    ['comandas', 'Comandas', '▤', ['atendente', 'gerente']],
    ['pedidos', 'Pedidos', '◷', ['atendente', 'gerente']], ['produtos', 'Produtos', '◇', ['gerente']],
    ['estoque', 'Estoque', '▦', ['gerente']], ['relatorios', 'Relatórios', '⌁', ['gerente']], ['usuarios', 'Usuários', '♙', []],
  ];
  const paymentOptions = ['Pix', 'Dinheiro', 'Cartão de crédito', 'Cartão de débito'];
  const ui = { tab: 'comandas', productSearch: '', orderStatus: '', orderNumber: '', orderDate: '', comandaFilter: 'ativas', reportDate: new Date().toISOString().slice(0, 10), cart: [], cartComanda: '', cartPayment: 'Pix', stockProduct: '', stockType: 'entrada', stockQty: 1, productForm: null, userForm: null, productListSearch: '', message: '', error: '' };
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const validStock = (value) => value !== null && value !== undefined && String(value).trim() !== '' && Number.isInteger(Number(value)) && Number(value) >= 0;
  const stockValue = (value) => validStock(value) ? Number(value) : 0;
  const categoryName = (value) => /^bebidas?$/i.test(String(value ?? '').trim()) ? 'Bebidas' : String(value ?? '').trim();
  const { brl, total } = store;
  const date = (value) => value ? new Date(value).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '—';
  const options = (values, selected, emptyLabel) => `${emptyLabel ? `<option value="">${esc(emptyLabel)}</option>` : ''}${values.map((entry) => { const value = typeof entry === 'object' ? entry.value : entry; const label = typeof entry === 'object' ? entry.label : entry; return `<option value="${esc(value)}" ${String(value) === String(selected) ? 'selected' : ''}>${esc(label)}</option>`; }).join('')}`;
  const select = (values, selected, attrs = '', emptyLabel = '') => `<select ${attrs}>${options(values, selected, emptyLabel)}</select>`;
  const input = (label, name, value = '', type = 'text', attrs = '') => `<label class="field"><span>${esc(label)}</span><input name="${esc(name)}" type="${type}" value="${esc(value)}" ${attrs}></label>`;
  const card = (content, cls = '') => `<section class="card ${cls}">${content}</section>`;
  const btn = (label, action, cls = 'button', extra = '') => `<button type="button" class="${cls}" data-action="${action}" ${extra}>${label}</button>`;
  const badge = (text, danger = false) => `<span class="badge ${danger ? 'danger' : ''}">${esc(text)}</span>`;
  function render() {
    if (!store.me) { root.innerHTML = login(); return; }
    const available = tabs.filter((tab) => store.can(...tab[3]));
    if (!available.some((tab) => tab[0] === ui.tab)) ui.tab = available[0]?.[0] || 'comandas';
    const current = available.find((tab) => tab[0] === ui.tab);
    root.innerHTML = `<div class="app-shell"><header class="topbar"><div class="top-inner"><img class="brand-mark" src="logo.png" alt=""><div class="brand-copy"><strong>Dinho's Canal 6</strong><span>Gestão do carrinho de praia</span></div><div class="user-chip"><span class="online-dot"></span><span>${esc(store.me.nome)} <small>· ${esc(store.me.role)}</small></span></div><button class="button button-light button-small" data-action="logout">Sair <span aria-hidden="true">↗</span></button></div></header><nav class="tabs" aria-label="Seções">${available.map(([id, label, icon]) => `<button class="tab ${ui.tab === id ? 'active' : ''}" data-tab="${id}" aria-current="${ui.tab === id ? 'page' : 'false'}"><span>${icon}</span>${label}</button>`).join('')}</nav><main class="main"><div class="page-heading"><div><div class="eyebrow">DINHO'S · CANAL 6</div><h1>${current[1]}</h1><p>${headingNote(ui.tab)}</p></div><div class="today"><span>●</span> Operação local <b>${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</b></div></div><div class="view" key="${ui.tab}">${screen()}</div><footer>Feito para o dia a dia na praia <span>·</span> Seus dados ficam neste dispositivo</footer></main></div>`;
  }
  function headingNote(tab) {
    return ({ venda: 'Registre pedidos e acompanhe o que sai do balcão.', comandas: 'Acompanhe as mesas, os guarda-sóis e as contas abertas.', pedidos: 'Da cozinha até a entrega, sem perder nenhum pedido.', produtos: 'Cuide do cardápio, dos preços e da disponibilidade.', estoque: 'Entradas, saídas e ajustes em um só lugar.', relatorios: 'Um retrato simples das vendas e do movimento.', usuarios: 'Gerencie quem pode acessar o sistema.' })[tab];
  }
  function login() {
    return `<main class="login-screen"><div class="login-art"><div class="sun"></div><div class="login-caption"><span>CANAL 6 · PRAIA</span><h2>Um bom dia<br>começa por aqui.</h2><p>Vendas, comandas e operação do seu carrinho — em um só lugar.</p></div><div class="wave wave-one"></div><div class="wave wave-two"></div></div><form class="login-card" id="login-form"><img src="logo.png" class="login-logo" alt="Dinho's Canal 6"><div class="eyebrow">BEM-VINDO DE VOLTA</div><h1>Entrar no sistema</h1><p class="muted">Acesse sua operação do Canal 6.</p>${input('E-mail', 'email', 'admin@dinhos.com', 'email', 'autocomplete="username" required')}${input('Senha', 'senha', '', 'password', 'autocomplete="current-password" required')}<p class="form-error">${esc(ui.error)}</p><button class="button button-primary login-submit">Entrar <span>→</span></button><p class="demo-note">Acesso inicial <b>admin@dinhos.com</b> / <b>admin123</b></p><a class="public-menu-link" href="/">Voltar ao cardápio público <span aria-hidden="true">↗</span></a></form></main>`;
  }
  function screen() {
    return ({ venda: venda, comandas: comandas, pedidos: pedidos, produtos: produtos, estoque: estoque, relatorios: relatorios, usuarios: usuarios })[ui.tab]();
  }
  function venda() {
    const open = store.db.comandas.filter((comanda) => !['fechada', 'cancelada'].includes(comanda.status));
    const products = store.db.products.filter((product) => product.disponivel && (product.nome + product.sku + product.categoria).toLowerCase().includes(ui.productSearch.toLowerCase()));
    const productGrid = products.length ? products.map((product) => {
      const count = ui.cart.find((item) => item.productId === product.id)?.qtd || 0;
      return `<button class="product-tile" data-action="add-cart" data-id="${product.id}" ${product.estoque === 0 ? 'disabled' : ''}><span class="tile-category">${esc(product.categoria || 'Cardápio')}</span><strong>${esc(product.nome)}</strong><span class="tile-bottom"><b>${brl(product.preco)}</b><small class="${product.estoque <= product.minimo ? 'low-text' : ''}">${product.estoque ? `${product.estoque} un.` : 'Esgotado'}</small></span>${count ? `<span class="cart-count">${count} no carrinho</span>` : ''}</button>`;
    }).join('') : '<div class="empty-state">Nenhum produto encontrado.</div>';
    return `<div class="sale-layout"><div class="catalog"><div class="section-intro"><div><h2>Cardápio</h2><p>Toque em um produto para adicionar ao pedido.</p></div><span class="count-label">${products.length} produtos</span></div><label class="searchbox"><span>⌕</span><input data-ui="productSearch" placeholder="Buscar produto, código ou categoria…" value="${esc(ui.productSearch)}"></label><div class="product-grid">${productGrid}</div></div>${card(`<div class="cart-head"><div><span class="eyebrow">PEDIDO ATUAL</span><h2>Carrinho</h2></div>${ui.cart.length ? btn('Limpar', 'clear-cart', 'text-button') : ''}</div>${ui.cart.length ? ui.cart.map((item) => `<div class="cart-row"><div class="cart-product"><b>${esc(item.nome)}</b><small>${brl(item.preco)} cada</small></div><div class="quantity"><button data-action="cart-minus" data-id="${item.productId}" aria-label="Diminuir">−</button><span>${item.qtd}</span><button data-action="cart-plus" data-id="${item.productId}" aria-label="Aumentar">+</button></div><b class="line-total">${brl(item.preco * item.qtd)}</b></div>`).join('') : '<div class="cart-empty"><span class="empty-basket">＋</span><b>Seu carrinho está vazio</b><p>Escolha um item do cardápio para começar.</p></div>'}<div class="cart-controls"><label class="field"><span>Vincular a uma comanda</span>${select(open.map((entry) => ({ value: entry.id, label: `#${entry.numero} · ${entry.cliente} (${entry.local})` })), ui.cartComanda, 'data-ui="cartComanda"', 'Venda avulsa · pagar agora')}</label>${!ui.cartComanda ? `<label class="field"><span>Forma de pagamento</span>${select(paymentOptions, ui.cartPayment, 'data-ui="cartPayment"')}</label>` : ''}<p class="form-error">${esc(ui.message)}</p><div class="total-line"><span>Total do pedido</span><b>${brl(total(ui.cart))}</b></div><button class="button button-primary full-width" data-action="send-order" ${ui.cart.length ? '' : 'disabled'}>Enviar pedido <span>→</span></button></div>`, 'cart-card')}</div>`;
  }
  function comandas() {
    const list = store.db.comandas.filter((entry) => ui.comandaFilter === 'ativas' ? !['fechada', 'cancelada'].includes(entry.status) : ui.comandaFilter === 'todas' || entry.status === ui.comandaFilter);
    return `<form class="card inline-form" id="comanda-form">${input('Nome do cliente', 'cliente', '', 'text', 'placeholder="Ex.: Ana Souza" required maxlength="60"')}${input('Local', 'local', '', 'text', 'placeholder="Ex.: guarda-sol 12" maxlength="40"')}<button class="button button-primary">＋ Abrir comanda</button><label class="field filter-field"><span>Mostrar</span>${select(['ativas', 'todas', 'aberta', 'em atendimento', 'aguardando pagamento', 'fechada', 'cancelada'], ui.comandaFilter, 'data-ui="comandaFilter"')}</label></form><div class="card-grid">${list.length ? list.map(comandaCard).join('') : '<div class="empty-state">Nenhuma comanda nesta lista.</div>'}</div>`;
  }
  function comandaCard(comanda) {
    const active = !['fechada', 'cancelada'].includes(comanda.status);
    const orders = store.db.pedidos.filter((entry) => entry.comanda === comanda.numero);
    return card(`<div class="entity-top"><div><div class="number-mark">#${comanda.numero}</div><h3>${esc(comanda.cliente)}</h3><p>${esc(comanda.local)} · ${date(comanda.aberta)}</p><p>Atendido por ${esc(comanda.responsavel)}</p></div>${badge(comanda.status, comanda.status === 'cancelada')}</div><div class="item-list">${comanda.itens.length ? comanda.itens.map((item) => `<div><span>${item.qtd} × ${esc(item.nome)}</span><b>${brl(item.preco * item.qtd)}</b></div>`).join('') : '<p class="muted">Sem itens — adicione pela aba Venda.</p>'}</div>${active ? `<label class="discount-field">Desconto <span>R$</span><input type="number" min="0" step="0.01" value="${comanda.desconto}" data-action="discount" data-id="${comanda.id}"></label>` : ''}<div class="total-line"><span>Total da comanda</span><b>${brl(total(comanda.itens, comanda.desconto))}</b></div>${comanda.pagamento ? `<p class="muted tiny">Pago com ${esc(comanda.pagamento)} em ${date(comanda.fechada)}</p>` : ''}<p class="muted tiny">${orders.length} pedido(s)</p>${active ? `<div class="action-row">${comanda.status !== 'aguardando pagamento' ? btn('Pedir conta', 'ask-bill', 'button button-outline button-small', `data-id="${comanda.id}"`) : `<div class="settle-row">${select(paymentOptions, 'Pix', `data-payment="${comanda.id}"`)}${btn('Fechar e receber', 'close-bill', 'button button-primary button-small', `data-id="${comanda.id}"`)}</div>`}${store.can('gerente') ? btn('Cancelar', 'cancel-comanda', 'text-button danger-text', `data-id="${comanda.id}"`) : ''}</div>` : ''}`, 'entity-card');
  }
  function pedidos() {
    const status = ['novo', 'em preparação', 'pronto', 'entregue', 'cancelado'];
    const list = store.db.pedidos.filter((order) => (!ui.orderStatus || order.status === ui.orderStatus) && (!ui.orderNumber || String(order.numero).includes(ui.orderNumber)) && (!ui.orderDate || order.data.startsWith(ui.orderDate)));
    return `<div class="card filter-bar">${select(status, ui.orderStatus, 'data-ui="orderStatus"', 'Todos os status')}<input data-ui="orderNumber" placeholder="Nº do pedido" value="${esc(ui.orderNumber)}"><input type="date" data-ui="orderDate" value="${esc(ui.orderDate)}"></div><div class="card-grid">${list.length ? list.map((order) => {
      const next = { novo: 'em preparação', 'em preparação': 'pronto', pronto: 'entregue' }[order.status];
      return card(`<div class="entity-top"><div><div class="number-mark">Pedido #${order.numero}</div><p>${date(order.data)} · ${esc(order.responsavel)}</p><p>${order.comanda ? `Comanda #${order.comanda}` : esc(order.pagamento)}</p></div>${badge(order.status, order.status === 'cancelado')}</div><div class="item-list order-items">${order.itens.map((item) => `<div>${item.qtd} × ${esc(item.nome)}</div>`).join('')}</div><div class="total-line"><span>Valor</span><b>${brl(total(order.itens))}</b></div>${next ? `<div class="action-row">${btn(`Avançar · ${next}`, 'next-order', 'button button-primary button-small', `data-id="${order.id}" data-status="${next}"`)}${btn('Cancelar', 'cancel-order', 'text-button danger-text', `data-id="${order.id}"`)}</div>` : ''}<details class="history"><summary>Histórico do pedido</summary>${order.historico.map((entry) => `<p>${date(entry.data)} — ${esc(entry.status)} (${esc(entry.usuario)})</p>`).join('')}</details>`, 'entity-card');
    }).join('') : '<div class="empty-state">Nenhum pedido encontrado.</div>'}</div>`;
  }
  function productForm() {
    const product = ui.productForm || { nome: '', sku: '', categoria: '', descricao: '', custo: 0, preco: 0, estoque: 0, minimo: 5 };
    const stockValid = validStock(product.estoque);
    const stockDisabled = Boolean(product.id) && stockValid;
    const stockField = input(product.id ? 'Estoque' : 'Estoque inicial', 'estoque', stockValid ? stockValue(product.estoque) : '', 'number', `min="0" step="1" ${stockDisabled ? 'disabled' : 'required'}`);
    return `<form id="product-form" class="form-stack"><div class="form-title"><span class="eyebrow">CARDÁPIO</span><h2>${product.id ? 'Editar produto' : 'Novo produto'}</h2></div>${input('Nome do produto', 'nome', product.nome, 'text', 'required')}${input('Código / SKU', 'sku', product.sku)}${input('Categoria', 'categoria', categoryName(product.categoria))}${input('Descrição', 'descricao', product.descricao)}<div class="two-fields">${input('Custo', 'custo', product.custo, 'number', 'min="0" step="0.01"')}${input('Preço de venda', 'preco', product.preco, 'number', 'min="0.01" step="0.01" required')}</div><div class="two-fields">${stockField}${input('Estoque mínimo', 'minimo', product.minimo, 'number', 'min="0"')}</div>${stockDisabled ? '<p class="muted tiny">Para alterar este saldo, use a aba Estoque.</p>' : ''}<p class="form-error">${esc(ui.error)}</p><div class="action-row"><button class="button button-primary">Salvar produto</button>${product.id ? btn('Cancelar', 'cancel-product-edit', 'button button-outline') : ''}</div></form>`;
  }
  function produtos() {
    const list = store.db.products.filter((product) => (product.nome + product.sku + product.categoria).toLowerCase().includes(ui.productListSearch.toLowerCase())).sort((a, b) => a.nome.localeCompare(b.nome));
    return `<div class="management-layout">${card(productForm(), 'form-card')}<section class="card table-card"><div class="table-heading"><div><span class="eyebrow">SEU CARDÁPIO</span><h2>Produtos <small>${list.length}</small></h2></div><label class="searchbox compact"><span>⌕</span><input data-ui="productListSearch" placeholder="Pesquisar…" value="${esc(ui.productListSearch)}"></label></div><div class="table-scroll"><table><thead><tr><th>Produto</th><th>Categoria</th><th>Custo</th><th>Venda</th><th>Estoque</th><th></th></tr></thead><tbody>${list.map((product) => `<tr class="${product.disponivel ? '' : 'inactive-row'}"><td><b>${esc(product.nome)}</b><small>${esc(product.sku)}</small></td><td>${esc(categoryName(product.categoria))}</td><td>${brl(product.custo)}</td><td><b>${brl(product.preco)}</b></td><td class="${stockValue(product.estoque) <= (Number(product.minimo) || 0) ? 'low-text' : ''}">${stockValue(product.estoque)}</td><td class="table-actions">${btn('Editar', 'edit-product', 'button button-outline button-small', `data-id="${product.id}"`)}${btn(product.disponivel ? 'Desativar' : 'Ativar', 'toggle-product', 'text-button', `data-id="${product.id}"`)}</td></tr>`).join('')}</tbody></table></div></section></div>`;
  }
  function estoque() {
    const low = store.db.products.filter((product) => product.disponivel && stockValue(product.estoque) <= (Number(product.minimo) || 0));
    return `${low.length ? `<div class="alert-card"><span>!</span><div><b>Estoque baixo</b><p>${low.map((product) => `${esc(product.nome)} (${stockValue(product.estoque) === 0 ? 'sem estoque' : stockValue(product.estoque)})`).join(' · ')}</p></div></div>` : ''}${card(`<form id="stock-form" class="inline-form stock-form"><label class="field"><span>Produto</span>${select(store.db.products.map((product) => ({ value: product.id, label: `${product.nome} (${stockValue(product.estoque)})` })), ui.stockProduct || store.db.products[0]?.id, 'name="productId"')}</label><label class="field"><span>Movimentação</span>${select(['entrada', 'saída', 'ajuste', 'devolução'], ui.stockType, 'name="tipo"')}</label>${input(ui.stockType === 'ajuste' ? 'Novo saldo' : 'Quantidade', 'qtd', ui.stockQty, 'number', `min="${ui.stockType === 'ajuste' ? '0' : '1'}" step="1" required`)}${input('Motivo', 'motivo', '', 'text', 'placeholder="Ex.: reposição do dia" maxlength="100"')}<button class="button button-primary">Registrar movimento</button><p class="form-error">${esc(ui.error)}</p></form>`, 'stock-entry')}<section class="card table-card"><div class="table-heading"><div><span class="eyebrow">MOVIMENTO DE MERCADORIA</span><h2>Movimentações <small>${Math.min(store.db.movs.length, 200)}</small></h2></div></div><div class="table-scroll"><table><thead><tr><th>Data</th><th>Produto</th><th>Tipo</th><th>Qtd.</th><th>Saldo</th><th>Usuário</th><th>Motivo</th></tr></thead><tbody>${store.db.movs.slice(0, 200).map((move) => `<tr><td>${date(move.data)}</td><td>${esc(move.nome)}</td><td>${esc(move.tipo)}</td><td>${move.qtd}</td><td>${move.antes} → ${move.depois}</td><td>${esc(move.usuario)}</td><td>${esc(move.motivo)}</td></tr>`).join('') || '<tr><td colspan="7" class="muted">Ainda não há movimentações.</td></tr>'}</tbody></table></div></section>`;
  }
  function relatorios() {
    const day = ui.reportDate;
    const orders = store.db.pedidos.filter((order) => order.status !== 'cancelado' && (!day || order.data.startsWith(day)));
    const costs = (id) => store.db.products.find((product) => product.id === id)?.custo || 0;
    let revenue = 0; let cost = 0; const top = {}; const payments = {};
    orders.forEach((order) => order.itens.forEach((item) => { revenue += item.preco * item.qtd; cost += costs(item.productId) * item.qtd; top[item.nome] = (top[item.nome] || 0) + item.qtd; }));
    store.db.comandas.filter((comanda) => comanda.status === 'fechada' && (!day || comanda.fechada?.startsWith(day))).forEach((comanda) => { payments[comanda.pagamento] = (payments[comanda.pagamento] || 0) + total(comanda.itens, comanda.desconto); });
    orders.filter((order) => !order.comanda).forEach((order) => { payments[order.pagamento] = (payments[order.pagamento] || 0) + total(order.itens); });
    return `<div class="report-date"><label class="field"><span>Dia do relatório</span><input type="date" data-ui="reportDate" value="${esc(day)}"></label><span>Valores de pedidos não cancelados${day ? ` · ${new Date(`${day}T12:00:00`).toLocaleDateString('pt-BR')}` : ''}</span></div><div class="stats-grid">${stat('Faturamento', brl(revenue), 'R$')}${stat('Lucro bruto', brl(revenue - cost), '↗')}${stat('Pedidos', orders.length, '▤')}${stat('Ticket médio', brl(orders.length ? revenue / orders.length : 0), '◉')}</div><div class="report-grid">${card(`<div class="table-heading"><div><span class="eyebrow">DESTAQUES</span><h2>Mais vendidos</h2></div><span class="report-icon">✳</span></div>${Object.entries(top).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, qty], index) => `<div class="rank-row"><span class="rank">${String(index + 1).padStart(2, '0')}</span><span>${esc(name)}</span><b>${qty} un.</b></div>`).join('') || '<p class="muted">Sem vendas neste período.</p>'}`)}${card(`<div class="table-heading"><div><span class="eyebrow">CAIXA</span><h2>Recebido por forma de pagamento</h2></div><span class="report-icon">＄</span></div>${Object.entries(payments).map(([name, value]) => `<div class="payment-row"><span>${esc(name)}</span><b>${brl(value)}</b></div>`).join('') || '<p class="muted">Nenhum recebimento neste período.</p>'}`)}</div>`;
  }
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
    if (target.dataset.ui) { ui[target.dataset.ui] = target.value; render(); }
    if (target.name === 'tipo') { ui.stockType = target.value; render(); }
    if (target.name === 'productId') ui.stockProduct = target.value;
    if (target.dataset.action === 'discount') store.updComanda(target.dataset.id, { desconto: Math.max(0, Number(target.value) || 0) });
  });
  root.addEventListener('click', (event) => {
    const tab = event.target.closest('[data-tab]');
    if (tab) { ui.tab = tab.dataset.tab; ui.message = ''; ui.error = ''; render(); return; }
    const control = event.target.closest('[data-action]'); if (!control) return;
    const { action, id } = control.dataset;
    if (action === 'logout') store.logout();
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
    if (action === 'next-order') store.statusPedido(id, control.dataset.status);
    if (action === 'cancel-order' && confirm('Cancelar pedido? O estoque será devolvido.')) store.statusPedido(id, 'cancelado');
    if (action === 'edit-product') { ui.productForm = { ...store.db.products.find((entry) => entry.id === id) }; ui.error = ''; render(); }
    if (action === 'cancel-product-edit') { ui.productForm = null; ui.error = ''; render(); }
    if (action === 'toggle-product') { const product = store.db.products.find((entry) => entry.id === id); store.saveProduct({ id, disponivel: !product.disponivel }); }
    if (action === 'edit-user') { const user = store.db.users.find((entry) => entry.id === id); ui.userForm = { id, nome: user.nome, email: user.email, senha: '', role: user.role }; ui.error = ''; render(); }
    if (action === 'toggle-user') { const user = store.db.users.find((entry) => entry.id === id); store.saveUser({ id, ativo: !user.ativo }); }
  });
  root.addEventListener('submit', (event) => {
    event.preventDefault(); const form = event.target; const data = formData(form);
    if (form.id === 'login-form') { if (!store.login(data.email, data.senha)) { ui.error = 'E-mail ou senha inválidos'; render(); } }
    if (form.id === 'comanda-form') { if (data.cliente.trim()) store.abrirComanda(data.cliente.trim(), data.local.trim() || '—'); }
    if (form.id === 'product-form') {
      const existing = ui.productForm?.id ? store.db.products.find((entry) => entry.id === ui.productForm.id) : null;
      const stockRequired = !existing || !validStock(existing.estoque);
      const hasStock = Object.prototype.hasOwnProperty.call(data, 'estoque');
      const rawStock = data.estoque;
      const product = {
        ...data,
        categoria: categoryName(data.categoria),
        custo: Number(data.custo),
        preco: Number(data.preco),
        minimo: Number(data.minimo),
      };
      delete product.estoque;
      if (!product.nome.trim() || product.preco <= 0 || product.custo < 0) { ui.error = 'Preencha nome e valores válidos.'; render(); return; }
      if (hasStock) {
        if (!validStock(rawStock)) { ui.error = 'Estoque deve ser um número inteiro maior ou igual a zero.'; render(); return; }
        product.estoque = Number(rawStock);
      } else if (stockRequired) {
        ui.error = 'Informe um estoque inteiro maior ou igual a zero para este produto.';
        render();
        return;
      }
      if (ui.productForm?.id) product.id = ui.productForm.id;
      store.saveProduct(product); ui.productForm = null; ui.error = '';
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
})();
