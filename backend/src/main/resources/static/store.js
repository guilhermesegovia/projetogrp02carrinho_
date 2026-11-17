/* Browser-local store used by legacy administrative sections. */
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
  const state = { db, me: null, externalSession: false };
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
    // The admin shell supplies the authenticated backend user for legacy local
    // tabs; unlike login(), this bridge never writes credentials or session data.
    useSessionUser(user) { state.externalSession = Boolean(user); state.me = user ? { id: user.id, nome: user.nome || user.name || user.email || 'Equipe', email: user.email || '', role: user.role || 'atendente' } : null; },
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
      state.me = user; state.externalSession = false; localStorage.setItem(SESSION, JSON.stringify(user)); notify(); return true;
    },
    logout() { state.me = null; state.externalSession = false; localStorage.removeItem(SESSION); notify(); },
    saveUser(user) {
      const data = clone(state.db);
      if (user.id) Object.assign(data.users.find((entry) => entry.id === user.id), user);
      else data.users.push({ id: uid(), criado: now(), ativo: true, role: 'atendente', nome: '', email: '', senha: '', ...user });
      state.db = data;
      if (state.me) state.me = data.users.find((entry) => entry.id === state.me.id) || state.me;
      if (state.me && !state.externalSession) localStorage.setItem(SESSION, JSON.stringify(state.me));
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
    importCatalogProducts(products) {
      if (!Array.isArray(products)) throw new Error('O arquivo não contém uma lista válida de produtos.');
      const data = clone(state.db);
      const result = { created: 0, updated: 0, errors: [] };
      const normalizeMatch = (value) => String(value ?? '').trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').toLocaleLowerCase('pt-BR');
      for (const [index, raw] of products.entries()) {
        const row = index + 1;
        const nome = String(raw?.nome ?? '').trim();
        const categoria = normalizeCategory(raw?.categoria);
        const sku = String(raw?.sku ?? '').trim();
        const preco = Number(raw?.preco);
        const estoque = Number(raw?.estoque);
        const minimo = Number(raw?.minimo);
        const custo = Number(raw?.custo);
        if (!nome || !categoria || !Number.isFinite(preco) || preco <= 0 || !validStock(estoque)
          || !Number.isInteger(minimo) || minimo < 0 || !Number.isFinite(custo) || custo < 0
          || typeof raw?.disponivel !== 'boolean' || (raw?.arquivado !== undefined && typeof raw.arquivado !== 'boolean')) {
          result.errors.push(`Produto ${row}: campos inválidos.`);
          continue;
        }
        const match = sku
          ? data.products.filter((product) => normalizeMatch(product.sku) === normalizeMatch(sku))
          : data.products.filter((product) => normalizeMatch(product.nome) === normalizeMatch(nome) && categoryKey(product.categoria) === categoryKey(categoria));
        if (match.length > 1) {
          result.errors.push(`Produto ${row} (${nome}): há mais de um produto correspondente no catálogo atual.`);
          continue;
        }
        const fields = {
          nome,
          descricao: String(raw.descricao ?? ''),
          sku,
          categoria,
          custo,
          preco,
          estoque: Number(estoque),
          minimo,
          disponivel: raw.disponivel,
          arquivado: raw.arquivado === true,
        };
        if (match.length === 1) {
          const existing = match[0];
          Object.assign(existing, fields, { id: existing.id, ...(existing.serverId == null ? {} : { serverId: existing.serverId }) });
          result.updated += 1;
        } else {
          data.products.push({ id: uid(), criado: now(), ...fields });
          result.created += 1;
        }
      }
      if (result.created || result.updated) { state.db = data; save(); }
      return result;
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
    criarPedidoTeste(cliente, items, mesa) {
      try {
        const nome = String(cliente ?? '').trim();
        if (!nome) throw new Error('Informe seu nome para continuar.');
        if (!Array.isArray(items) || !items.length) throw new Error('Adicione ao menos um item ao pedido.');
        const data = clone(state.db);
        const normalized = items.map((entry) => {
          const product = data.products.find((item) => String(item.id) === String(entry.id ?? entry.productId));
          const quantity = Number(entry.quantidade ?? entry.qtd);
          if (!product || product.arquivado || !product.disponivel) throw new Error('Um dos produtos não está disponível. Atualize o cardápio e tente novamente.');
          if (!Number.isInteger(quantity) || quantity < 1) throw new Error(`Informe uma quantidade válida para ${product.nome}.`);
          if (!validStock(product.estoque) || Number(product.estoque) < quantity) throw new Error(`Estoque insuficiente de ${product.nome}.`);
          const price = Number(product.preco);
          if (!Number.isFinite(price) || price < 0) throw new Error(`Preço inválido para ${product.nome}.`);
          return { product, quantity, price };
        });
        const timestamp = new Date();
        const localDate = [timestamp.getFullYear(), String(timestamp.getMonth() + 1).padStart(2, '0'), String(timestamp.getDate()).padStart(2, '0')].join('-');
        const localTime = [String(timestamp.getHours()).padStart(2, '0'), String(timestamp.getMinutes()).padStart(2, '0'), String(timestamp.getSeconds()).padStart(2, '0')].join(':');
        const orderId = `TESTE-${timestamp.getTime()}-${uid().toUpperCase()}`;
        const orderItems = normalized.map(({ product, quantity, price }) => ({ quantidade: quantity, precoUnitario: price, produto: { id: product.id, nome: product.nome }, productId: product.id }));
        const orderTotal = orderItems.reduce((sum, item) => sum + item.precoUnitario * item.quantidade, 0);
        const localTimestamp = `${localDate}T${localTime}`;
        normalized.forEach(({ product, quantity }) => moveStock(data, product.id, 'saída', quantity, `Pedido de teste ${orderId}`, nome));
        const comanda = {
          id: orderId,
          numero: orderId,
          origem: 'TESTE_LOCAL',
          nomeCliente: nome,
          dataAbertura: localTimestamp,
          status: 'aberta',
          mesa: mesa?.numero != null ? { numero: mesa.numero } : null,
          valorTotal: orderTotal,
          pedidos: [],
        };
        const order = {
          id: orderId,
          numero: orderId,
          origem: 'TESTE_LOCAL',
          data: localTimestamp,
          status: 'PENDENTE',
          valorTotal: orderTotal,
          itens: orderItems,
          comanda: { nomeCliente: nome, numero: orderId, mesa: comanda.mesa },
        };
        comanda.pedidos.push(order);
        data.pedidos.unshift(order);
        data.comandas.unshift(comanda);
        state.db = data;
        save();
        return { order };
      } catch (error) { return { error: error.message || 'Não foi possível registrar o pedido de teste.' }; }
    },
    statusPedidoTeste(id, status) {
      const data = clone(state.db);
      const pedido = (data.pedidos || []).find((entry) => entry.origem === 'TESTE_LOCAL' && String(entry.id) === String(id));
      if (!pedido) return 'Pedido de teste local não encontrado.';
      if (pedido.status === 'ENTREGUE' || pedido.status === 'CANCELADO') return 'Este pedido de teste já foi finalizado.';
      const stages = ['PENDENTE', 'EM_PREPARO', 'PRONTO', 'ENTREGUE'];
      const currentIndex = stages.indexOf(pedido.status);
      const timestamp = now();
      const comandaNumero = pedido.comanda?.numero ?? pedido.comanda;
      const comanda = (data.comandas || []).find((entry) => entry.origem === 'TESTE_LOCAL' && String(entry.numero) === String(comandaNumero));
      if (status === 'CANCELADO') {
        if (!comanda) return 'A comanda local deste pedido de teste não foi encontrada.';
        if (!Array.isArray(data.movs)) data.movs = [];
        try {
          (pedido.itens || []).forEach((item) => {
            const quantity = Number(item.quantidade ?? item.qtd);
            if (!Number.isInteger(quantity) || quantity < 1) throw new Error('O pedido tem uma quantidade inválida e não pode ser cancelado.');
            moveStock(data, item.productId ?? item.produto?.id, 'devolução', quantity, `Cancelamento pedido de teste #${pedido.numero || pedido.id}`);
          });
        } catch (error) { return error.message; }
        pedido.status = 'CANCELADO';
        comanda.status = 'cancelada';
        comanda.cancelada = timestamp;
      } else {
        if (currentIndex < 0 || currentIndex >= stages.length - 1 || status !== stages[currentIndex + 1]) {
          return 'Selecione somente a próxima etapa do pedido de teste.';
        }
        pedido.status = status;
      }
      if (!Array.isArray(pedido.historico)) pedido.historico = [];
      pedido.historico.push({ status: pedido.status, data: timestamp, usuario: state.me?.nome || 'Equipe' });
      if (Array.isArray(comanda?.pedidos)) {
        const mirror = comanda.pedidos.find((entry) => String(entry.id) === String(pedido.id));
        if (mirror) {
          mirror.status = pedido.status;
          if (!Array.isArray(mirror.historico)) mirror.historico = [];
          mirror.historico.push({ status: pedido.status, data: timestamp, usuario: state.me?.nome || 'Equipe' });
        }
      }
      state.db = data;
      save();
      return '';
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
