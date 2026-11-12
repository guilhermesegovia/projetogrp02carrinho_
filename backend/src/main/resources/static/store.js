/* Local-only demo store. All data is intentionally kept in this browser. */
(function (global) {
  'use strict';
  const KEY = 'dinhos-db';
  const SESSION = 'dinhos-me';
  const uid = () => Math.random().toString(36).slice(2, 10);
  const now = () => new Date().toISOString();
  const normalizeCategory = (value) => {
    const name = String(value ?? '').trim().replace(/\s+/g, ' ');
    if (!name) return '';
    if (/^bebidas?$/i.test(name)) return 'Bebidas';
    return name.split(' ').map((word) => word.charAt(0).toLocaleUpperCase('pt-BR') + word.slice(1).toLocaleLowerCase('pt-BR')).join(' ');
  };
  const categoryKey = (value) => normalizeCategory(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');
  const product = (nome, categoria, custo, preco, estoque, sku) => ({
    id: uid(), nome, descricao: '', sku, categoria, custo, preco, estoque,
    minimo: 10, disponivel: true, criado: now(),
  });
  function seed() {
    return {
      seq: 100,
      users: [{ id: uid(), nome: 'Dinho', email: 'admin@dinhos.com', senha: 'admin123', role: 'admin', ativo: true, criado: now() }],
      products: [
        product('Água de coco', 'Bebidas', 3, 8, 60, 'BEB-01'),
        product('Cerveja lata', 'Bebidas', 3.5, 8, 120, 'BEB-02'),
        product('Caipirinha', 'Drinks', 5, 18, 40, 'DRK-01'),
        product('Refrigerante', 'Bebidas', 2.5, 7, 8, 'BEB-03'),
        product('Isca de peixe', 'Petiscos', 18, 45, 25, 'PET-01'),
        product('Camarão alho e óleo', 'Petiscos', 30, 69, 15, 'PET-02'),
        product('Queijo coalho', 'Petiscos', 4, 12, 50, 'PET-03'),
        product('Aluguel cadeira', 'Serviços', 0, 10, 40, 'SRV-01'),
        product('Aluguel guarda-sol', 'Serviços', 0, 15, 20, 'SRV-02'),
      ], comandas: [], pedidos: [], movs: [],
    };
  }
  let db;
  try { db = JSON.parse(localStorage.getItem(KEY)) || seed(); } catch (_) { db = seed(); }
  let migratedProducts = false;
  const canonicalCategories = new Map();
  if (Array.isArray(db.products)) db.products.forEach((item) => {
    let normalized = normalizeCategory(item.categoria);
    const key = categoryKey(normalized);
    if (key && canonicalCategories.has(key)) normalized = canonicalCategories.get(key);
    else if (key) canonicalCategories.set(key, normalized);
    if (item.categoria !== normalized) { item.categoria = normalized; migratedProducts = true; }
    if (item.arquivado === undefined) { item.arquivado = false; migratedProducts = true; }
  });
  const state = { db, me: null };
  try {
    const cached = JSON.parse(localStorage.getItem(SESSION));
    state.me = cached && db.users.find((user) => user.id === cached.id && user.ativo) || null;
  } catch (_) { state.me = null; }
  const save = () => { localStorage.setItem(KEY, JSON.stringify(state.db)); notify(); };
  const notify = () => global.dispatchEvent(new CustomEvent('dinhos:change'));
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const total = (items, discount = 0) => Math.max(0, items.reduce((sum, item) => sum + item.preco * item.qtd, 0) - discount);
  const brl = (value) => Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  let repairedComandas = false;
  if (!Array.isArray(state.db.comandas)) state.db.comandas = [];
  state.db.comandas.forEach((comanda) => {
    if (!Array.isArray(comanda.itens)) comanda.itens = [];
    const computedTotal = total(comanda.itens, Number(comanda.desconto) || 0);
    if (comanda.valorTotal !== computedTotal) {
      comanda.valorTotal = computedTotal;
      repairedComandas = true;
    }
  });
  if (repairedComandas || migratedProducts) localStorage.setItem(KEY, JSON.stringify(state.db));
  const validStock = (value) => {
    if (value === null || value === undefined || value === '') return false;
    const stock = Number(value);
    return Number.isFinite(stock) && Number.isInteger(stock) && stock >= 0;
  };
  function moveStock(data, productId, type, quantity, reason, usuario) {
    const item = data.products.find((entry) => entry.id === productId);
    if (!item) throw new Error('Produto não encontrado');
    const before = validStock(item.estoque) ? Number(item.estoque) : 0;
    const delta = type === 'saída' ? -quantity : type === 'ajuste' ? quantity - before : quantity;
    const after = before + delta;
    if (after < 0) throw new Error(`Estoque insuficiente de ${item.nome}`);
    data.movs.unshift({ id: uid(), productId, nome: item.nome, tipo: type, qtd: quantity, antes: before, depois: after, data: now(), usuario: usuario || state.me?.nome || '?', motivo: reason });
    item.estoque = after;
  }
  const store = {
    get db() { return state.db; }, get me() { return state.me; },
    normalizeCategory,
    productCategories() {
      const categories = new Map();
      state.db.products.forEach((item) => {
        const name = normalizeCategory(item.categoria);
        const key = categoryKey(name);
        if (key && !categories.has(key)) categories.set(key, name);
      });
      return [...categories.values()].sort((a, b) => a.localeCompare(b, 'pt-BR'));
    },
    can(...roles) { return !!state.me && (state.me.role === 'admin' || roles.includes(state.me.role)); },
    login(email, password) {
      const user = state.db.users.find((entry) => entry.email.toLowerCase() === email.toLowerCase() && entry.senha === password && entry.ativo);
      if (!user) return false;
      state.me = user; localStorage.setItem(SESSION, JSON.stringify(user)); notify(); return true;
    },
    logout() { state.me = null; localStorage.removeItem(SESSION); notify(); },
    saveUser(user) {
      const data = clone(state.db);
      if (user.id) Object.assign(data.users.find((entry) => entry.id === user.id), user);
      else data.users.push({ id: uid(), criado: now(), ativo: true, role: 'atendente', nome: '', email: '', senha: '', ...user });
      state.db = data;
      if (state.me) state.me = data.users.find((entry) => entry.id === state.me.id) || state.me;
      if (state.me) localStorage.setItem(SESSION, JSON.stringify(state.me));
      save();
    },
    saveProduct(productData) {
      const data = clone(state.db);
      const incoming = { ...productData };
      if (Object.prototype.hasOwnProperty.call(incoming, 'categoria')) incoming.categoria = normalizeCategory(incoming.categoria);
      if (incoming.id) {
        const existing = data.products.find((entry) => entry.id === incoming.id);
        if (Object.prototype.hasOwnProperty.call(incoming, 'estoque') && !validStock(incoming.estoque)) delete incoming.estoque;
        if (existing) Object.assign(existing, incoming);
      } else {
        const stock = Object.prototype.hasOwnProperty.call(incoming, 'estoque') && validStock(incoming.estoque) ? Number(incoming.estoque) : 0;
        data.products.push({ id: uid(), descricao: '', sku: '', categoria: '', custo: 0, preco: 0, estoque: stock, minimo: 5, disponivel: true, criado: now(), ...incoming, estoque: stock });
      }
      state.db = data; save();
    },
    archiveProduct(productId) {
      const data = clone(state.db);
      const existing = data.products.find((entry) => entry.id === productId);
      if (!existing) return;
      existing.arquivado = true;
      existing.disponivel = false;
      state.db = data; save();
    },
    restoreProduct(productId) {
      const data = clone(state.db);
      const existing = data.products.find((entry) => entry.id === productId);
      if (!existing) return;
      existing.arquivado = false;
      existing.disponivel = false;
      state.db = data; save();
    },
    stock(productId, type, quantity, reason) {
      const data = clone(state.db);
      try { moveStock(data, productId, type, quantity, reason); state.db = data; save(); return ''; }
      catch (error) { return error.message; }
    },
    abrirComanda(cliente, local) {
      const data = clone(state.db); data.seq++;
      data.comandas.unshift({ id: uid(), numero: data.seq, cliente, local, aberta: now(), responsavel: state.me.nome, itens: [], desconto: 0, valorTotal: 0, status: 'aberta' });
      state.db = data; save();
    },
    updComanda(id, patch) {
      const data = clone(state.db);
      const comanda = data.comandas.find((entry) => entry.id === id);
      Object.assign(comanda, patch);
      comanda.valorTotal = total(comanda.itens || [], Number(comanda.desconto) || 0);
      state.db = data; save();
    },
    criarPedido(items, payment, comandaId) {
      const data = clone(state.db);
      try {
        items.forEach((item) => moveStock(data, item.productId, 'saída', item.qtd, 'Venda'));
        const check = comandaId && data.comandas.find((entry) => entry.id === comandaId);
        if (comandaId && !check) throw new Error('Comanda não encontrada');
        if (check) {
          items.forEach((item) => { const found = check.itens.find((entry) => entry.productId === item.productId); found ? found.qtd += item.qtd : check.itens.push({ ...item }); });
          check.valorTotal = total(check.itens, Number(check.desconto) || 0);
          if (check.status === 'aberta') check.status = 'em atendimento';
        }
        data.seq++;
        data.pedidos.unshift({ id: uid(), numero: data.seq, data: now(), responsavel: state.me.nome, itens: clone(items), pagamento: check ? 'Na comanda' : payment, status: 'novo', comanda: check?.numero, historico: [{ status: 'novo', data: now(), usuario: state.me.nome }] });
        state.db = data; save(); return '';
      } catch (error) { return error.message; }
    },
    criarPedidoDemo(items, payment, customerName) {
      const name = typeof customerName === 'string' ? customerName.trim() : '';
      if (!name) return { error: 'Informe o nome do cliente' };
      if (!Array.isArray(items) || !items.length) return { error: 'Adicione itens ao pedido' };
      const data = clone(state.db);
      try {
        const orderItems = items.map((item) => {
          const qtd = Number(item.quantidade);
          if (!Number.isInteger(qtd) || qtd <= 0) throw new Error('Quantidade inválida');
          const product = data.products.find((entry) => String(entry.id) === String(item.id));
          if (!product || !product.disponivel) throw new Error('Produto não encontrado ou indisponível');
          if (qtd > product.estoque) throw new Error(`Estoque insuficiente de ${product.nome}`);
          const orderItem = { productId: product.id, nome: product.nome, preco: product.preco, qtd };
          moveStock(data, product.id, 'saída', qtd, 'Venda demo', name);
          return orderItem;
        });
        const paymentNames = { PIX: 'Pix', CARTAO: 'Cartão', DINHEIRO: 'Dinheiro' };
        data.seq++;
        data.pedidos.unshift({
          id: uid(), numero: data.seq, data: now(), cliente: name, responsavel: name,
          itens: orderItems, pagamento: paymentNames[payment] || payment, status: 'novo',
          historico: [{ status: 'novo', data: now(), usuario: name }],
        });
        state.db = data;
        save();
        return { pedidoId: data.seq, valorTotal: total(orderItems) };
      } catch (error) { return { error: error.message }; }
    },
    statusPedido(id, status) {
      const data = clone(state.db); const pedido = data.pedidos.find((entry) => entry.id === id);
      if (!pedido || pedido.status === 'cancelado' || pedido.status === 'entregue') return;
      if (status === 'cancelado') {
        pedido.itens.forEach((item) => moveStock(data, item.productId, 'devolução', item.qtd, `Cancelamento pedido #${pedido.numero}`));
        if (pedido.comanda) {
          const comanda = data.comandas.find((entry) => String(entry.numero) === String(pedido.comanda));
          if (comanda) {
            pedido.itens.forEach((item) => {
              const comandaItem = comanda.itens.find((entry) => String(entry.productId) === String(item.productId));
              if (comandaItem) {
                comandaItem.qtd -= item.qtd;
                if (comandaItem.qtd <= 0) comanda.itens.splice(comanda.itens.indexOf(comandaItem), 1);
              }
            });
            comanda.valorTotal = total(comanda.itens, Number(comanda.desconto) || 0);
          }
        }
      }
      pedido.status = status; pedido.historico.push({ status, data: now(), usuario: state.me.nome }); state.db = data; save();
    },
  };
  store.total = total;
  store.brl = brl;
  global.DinhosStore = store;
})(window);
