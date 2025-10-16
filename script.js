<script type="module">
  // Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-analytics.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  const firebaseConfig = {
    apiKey: "AIzaSyBGPcIf_PsIwoUSwgD7-AOjl0Y-N83b8YE",
    authDomain: "gestionalebar.firebaseapp.com",
    projectId: "gestionalebar",
    storageBucket: "gestionalebar.firebasestorage.app",
    messagingSenderId: "189700423445",
    appId: "1:189700423445:web:3d850fe9ac50ae1a8c331c",
    measurementId: "G-VSZB6RZGYE"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);
</script>

// Simple static gestionale bar script
(() => {
  const LS_PRODUCTS = 'bar_products_v2';
  const LS_EXP = 'bar_expirations_v2';
  const LS_SALES = 'bar_sales_v2';

  const defaultProducts = [
    { id: id(), name: "Caffè", price: 1.20, category: "Bevande", stock: 120, threshold: 10 },
    { id: id(), name: "Cappuccino", price: 1.80, category: "Bevande", stock: 90, threshold: 10 },
    { id: id(), name: "Brioche", price: 1.50, category: "Colazione", stock: 50, threshold: 6 },
    { id: id(), name: "Panino", price: 3.50, category: "Tavola Calda", stock: 30, threshold: 4 },
    { id: id(), name: "Acqua", price: 1.00, category: "Bevande", stock: 200, threshold: 20 },
    { id: id(), name: "Birra", price: 3.00, category: "Bevande", stock: 60, threshold: 8 },
    { id: id(), name: "Pasta del giorno", price: 6.50, category: "Piatti", stock: 15, threshold: 3 }
  ];

  let products = JSON.parse(localStorage.getItem(LS_PRODUCTS) || 'null') || defaultProducts;
  let expirations = JSON.parse(localStorage.getItem(LS_EXP) || '[]');
  let sales = JSON.parse(localStorage.getItem(LS_SALES) || '[]');
  saveAll();

  // DOM refs
  const main = document.getElementById('main');
  const modal = document.getElementById('modal');
  const pName = document.getElementById('p-name');
  const pPrice = document.getElementById('p-price');
  const pCat = document.getElementById('p-cat');
  const pStock = document.getElementById('p-stock');
  const pTh = document.getElementById('p-th');
  const btnSave = document.getElementById('modal-save');
  const btnCancel = document.getElementById('modal-cancel');

  document.getElementById('btn-products').addEventListener('click', ()=> { renderProducts(); });
  document.getElementById('btn-stock').addEventListener('click', ()=> { renderStock(); });
  document.getElementById('btn-exp').addEventListener('click', ()=> { renderExpirations(); });
  document.getElementById('btn-reports').addEventListener('click', ()=> { renderReports(); });

  askNotification();
  renderPOS(); // initial

  // Utility
  function id(){ return Math.random().toString(36).slice(2,9); }
  function fmt(n){ return Number(n).toFixed(2); }
  function saveAll(){ localStorage.setItem(LS_PRODUCTS, JSON.stringify(products)); localStorage.setItem(LS_EXP, JSON.stringify(expirations)); localStorage.setItem(LS_SALES, JSON.stringify(sales)); }
  function askNotification(){ if('Notification' in window && Notification.permission === 'default') Notification.requestPermission().catch(()=>{}); }
  function notify(t,b){ if('Notification' in window && Notification.permission === 'granted') new Notification(t,{body:b}); }

  // POS view
  let cart = [];
  function renderPOS(){
    main.innerHTML = '';
    const wrapper = el('div','grid grid-3');
    const left = el('div','card');
    const right = el('div','card');

    // search + add
    const sr = el('div'); sr.style.display='flex'; sr.style.gap='10px'; sr.style.marginBottom='12px';
    const search = el('input'); search.placeholder='Cerca...'; search.style.flex='1'; search.style.padding='10px'; search.style.borderRadius='8px'; search.style.border='1px solid rgba(255,255,255,0.04)'; search.style.background='transparent';
    const add = el('button'); add.textContent='+ Nuovo'; add.className='btn-primary'; add.addEventListener('click', ()=> openModal());
    sr.appendChild(search); sr.appendChild(add);
    left.appendChild(sr);

    const grid = el('div','products-grid');
    function refreshGrid(){ grid.innerHTML=''; products.filter(p=>p.name.toLowerCase().includes(search.value.toLowerCase())).forEach(p=>{
      const b = el('button','product-btn');
      b.innerHTML = `<div class="title">${p.name}</div><div class="price">€${fmt(p.price)}</div><div class="stock">Scorte: ${p.stock}</div>`;
      b.addEventListener('click', ()=> addToCart(p.id));
      grid.appendChild(b);
    }); }
    search.addEventListener('input', refreshGrid);
    refreshGrid();
    left.appendChild(grid);

    // Receipt
    const title = el('h3'); title.textContent='Scontrino'; right.appendChild(title);
    const list = el('div','receipt'); right.appendChild(list);

    const totWrap = el('div'); totWrap.style.marginTop='12px';
    const totalDisplay = el('div'); totalDisplay.style.fontWeight='700'; totalDisplay.textContent='Totale: €0.00';
    totWrap.appendChild(totalDisplay);

    const btns = el('div'); btns.style.marginTop='12px'; btns.style.display='grid'; btns.style.gridTemplateColumns='1fr 1fr'; btns.style.gap='8px';
    const payCash = el('button'); payCash.className='btn-primary'; payCash.textContent='Contanti'; payCash.addEventListener('click', ()=> checkout('contanti'));
    const payPOS = el('button'); payPOS.className='btn-outline'; payPOS.textContent='POS'; payPOS.addEventListener('click', ()=> checkout('POS'));
    btns.appendChild(payCash); btns.appendChild(payPOS);

    const cancel = el('button'); cancel.className='btn-outline'; cancel.style.marginTop='10px'; cancel.textContent='Annulla'; cancel.addEventListener('click', ()=> { cart=[]; refreshCart(); });
    right.appendChild(totWrap); right.appendChild(btns); right.appendChild(cancel);

    wrapper.appendChild(left); wrapper.appendChild(right); main.appendChild(wrapper);

    function addToCart(productId, qty=1){
      const p = products.find(x=>x.id===productId);
      if(!p) return;
      if(p.stock < qty){ alert('Scorte insufficienti per '+p.name); return; }
      const existing = cart.find(c=>c.id===productId);
      if(existing) existing.qty += qty; else cart.push({ id:p.id, name:p.name, price:p.price, qty });
      refreshCart();
    }
    function refreshCart(){ list.innerHTML=''; if(cart.length===0) list.innerHTML='<div class="small">Carrello vuoto</div>'; cart.forEach(c=>{
      const row = el('div','item-row'); row.innerHTML = `<div>${c.name} <div class="small">€${fmt(c.price)} x ${c.qty}</div></div><div>€${fmt(c.price*c.qty)}</div>`;
      list.appendChild(row);
    }); const tot = cart.reduce((s,i)=>s+i.price*i.qty,0); totalDisplay.textContent='Totale: €'+fmt(tot); }
    function checkout(method){
      if(cart.length===0) return;
      const total = cart.reduce((s,i)=>s+i.price*i.qty,0);
      sales.unshift({ id:id(), date:new Date().toISOString(), items: [...cart], total, method });
      // Deduct stock
      products = products.map(p=>{ const c = cart.find(ci=>ci.id===p.id); if(!c) return p; return {...p, stock: Math.max(0, p.stock - c.qty)} });
      cart = []; saveAll(); refreshGrid(); refreshCart(); alert('Vendita registrata: €'+fmt(total)+' ('+method+')');
    }
  }

  // Products view
  function renderProducts(){
    main.innerHTML='';
    const sec = el('div','card');
    const header = el('div'); header.style.display='flex'; header.style.justifyContent='space-between'; header.style.alignItems='center'; header.style.marginBottom='12px';
    const h = el('h3'); h.textContent='Gestione prodotti'; header.appendChild(h);
    const add = el('button'); add.className='btn-primary'; add.textContent='+ Aggiungi'; add.addEventListener('click', ()=> openModal());
    header.appendChild(add);
    sec.appendChild(header);

    const grid = el('div','products-grid'); products.forEach(p=>{
      const card = el('div','card'); card.style.padding='12px'; card.style.display='flex'; card.style.justifyContent='space-between'; card.style.alignItems='center';
      const left = el('div'); left.innerHTML = `<div style="font-weight:700">${p.name}</div><div class="small">${p.category} · €${fmt(p.price)}</div><div class="small">Scorte: ${p.stock}</div>`;
      const actions = el('div');
      const mod = el('button'); mod.className='btn-outline'; mod.style.marginRight='6px'; mod.textContent='Modifica'; mod.addEventListener('click', ()=> openModal(p));
      const del = el('button'); del.className='btn-outline'; del.textContent='Elimina'; del.addEventListener('click', ()=> { if(confirm('Rimuovere prodotto?')){ products = products.filter(x=>x.id!==p.id); expirations = expirations.filter(e=>e.productId!==p.id); saveAll(); renderProducts(); } });
      actions.appendChild(mod); actions.appendChild(del);
      card.appendChild(left); card.appendChild(actions); grid.appendChild(card);
    });
    sec.appendChild(grid); main.appendChild(sec);
  }

  // Stock view
  function renderStock(){
    main.innerHTML='';
    const sec = el('div','card');
    const h = el('h3'); h.textContent='Scorte'; sec.appendChild(h);
    products.forEach(p=>{
      const row = el('div'); row.style.display='flex'; row.style.justifyContent='space-between'; row.style.alignItems='center'; row.style.padding='8px'; row.style.marginTop='8px'; row.style.borderRadius='8px'; row.style.background='rgba(255,255,255,0.01)';
      const left = el('div'); left.innerHTML = `<div style="font-weight:700">${p.name}</div><div class="small">Scorte: ${p.stock} · Soglia: ${p.threshold}</div>`;
      const actions = el('div');
      const edit = el('button'); edit.className='btn-outline'; edit.textContent='Modifica'; edit.addEventListener('click', ()=> {
        const delta = Number(prompt('Quantità da aggiungere (usa negativo per scalare)', '10'));
        if(!Number.isFinite(delta)) return; p.stock = Math.max(0, p.stock + delta); saveAll(); renderStock();
      });
      const expBtn = el('button'); expBtn.className='btn-primary'; expBtn.style.marginLeft='8px'; expBtn.textContent='Aggiungi scadenza'; expBtn.addEventListener('click', ()=> {
        const q = Number(prompt('Quantità', '10')); const date = prompt('Data YYYY-MM-DD', (new Date()).toISOString().slice(0,10)); if(!q||!date) return; expirations.push({ id:id(), productId:p.id, date, qty:q }); saveAll(); renderStock();
      });
      actions.appendChild(edit); actions.appendChild(expBtn); row.appendChild(left); row.appendChild(actions); sec.appendChild(row);
    });
    main.appendChild(sec);
  }

  // Expirations view
  function expiringSoon(days=7){ const now=new Date(); const soon=new Date(); soon.setDate(now.getDate()+days); return expirations.filter(e=> { const d=new Date(e.date); return d<=soon && d>=now; }).sort((a,b)=> new Date(a.date)-new Date(b.date)); }
  function renderExpirations(){
    main.innerHTML='';
    const sec = el('div','card'); const h = el('h3'); h.textContent='Scadenze & Reminders'; sec.appendChild(h);
    const soon = expiringSoon(7);
    if(soon.length===0){ const p = el('div'); p.className='small'; p.textContent='Nessuna scadenza imminente'; sec.appendChild(p); }
    soon.forEach(e=>{
      const row = el('div'); row.style.display='flex'; row.style.justifyContent='space-between'; row.style.alignItems='center'; row.style.padding='8px'; row.style.marginTop='8px'; const prod = products.find(p=>p.id===e.productId) || {name:'-'};
      row.innerHTML = `<div><div style="font-weight:700">${prod.name}</div><div class="small">Qty: ${e.qty} · ${e.date}</div></div>`;
      const actions = el('div');
      const scarta = el('button'); scarta.className='btn-outline'; scarta.textContent='Scarta'; scarta.addEventListener('click', ()=> { if(confirm('Rimuovere dalla scorta?')){ products = products.map(p=> p.id===e.productId ? {...p, stock: Math.max(0, p.stock - e.qty)} : p); expirations = expirations.filter(x=>x.id!==e.id); saveAll(); renderExpirations(); } });
      const edit = el('button'); edit.className='btn-primary'; edit.textContent='Modifica'; edit.addEventListener('click', ()=> { const nd = prompt('Nuova data YYYY-MM-DD', e.date); if(nd){ e.date=nd; saveAll(); renderExpirations(); } });
      actions.appendChild(scarta); actions.appendChild(edit); row.appendChild(actions); sec.appendChild(row);
    });
    // All expirations
    const all = el('div'); all.style.marginTop='12px'; const title = el('div'); title.textContent='Tutte le scadenze'; title.style.fontWeight='700'; all.appendChild(title);
    expirations.forEach(e=>{ const row = el('div'); row.style.display='flex'; row.style.justifyContent='space-between'; row.style.alignItems='center'; row.style.padding='8px'; row.style.marginTop='8px'; const prod = products.find(p=>p.id===e.productId) || {name:'-'}; row.innerHTML=`<div><div style="font-weight:700">${prod.name}</div><div class="small">${e.date} · Qty: ${e.qty}</div></div>`; const del = el('button'); del.className='btn-outline'; del.textContent='Elimina'; del.addEventListener('click', ()=> { expirations = expirations.filter(x=>x.id!==e.id); saveAll(); renderExpirations(); }); row.appendChild(del); all.appendChild(row); });
    sec.appendChild(all); main.appendChild(sec);
    if(soon.length>0){ const body = soon.map(s=> (products.find(p=>p.id===s.productId)||{name:'?'}).name+': '+s.qty+' - '+s.date).join('\n'); notify('Prodotti in scadenza: '+soon.length, body); }
  }

  // Reports
  function renderReports(){
    main.innerHTML='';
    const sec = el('div','card'); const h = el('h3'); h.textContent='Report'; sec.appendChild(h);
    const today = sales.filter(s=> new Date(s.date).toDateString()===new Date().toDateString()).reduce((sum,s)=>sum+s.total,0);
    const left = el('div'); left.style.marginTop='8px'; left.innerHTML=`<div style="font-size:14px;color:var(--muted)">Vendite oggi</div><div style="font-weight:700;font-size:22px">€${fmt(today)}</div>`;
    sec.appendChild(left);
    const map = {}; sales.forEach(s=> s.items.forEach(i=> map[i.id] = (map[i.id]||0)+i.qty));
    const ol = el('ol'); ol.style.marginTop='8px'; Object.entries(map).sort((a,b)=>b[1]-a[1]).slice(0,10).forEach(([id,qty])=>{ const li = el('li'); li.textContent = (products.find(p=>p.id===id)||{name:'?'}).name + ' — ' + qty; ol.appendChild(li); });
    if(ol.children.length===0){ const p = el('div'); p.className='small'; p.textContent='Ancora nessuna vendita'; sec.appendChild(p);} else sec.appendChild(ol);
    main.appendChild(sec);
  }

  // Modal logic
  let editing = null;
  function openModal(product){
    editing = product || null;
    pName.value = product ? product.name : '';
    pPrice.value = product ? product.price : '';
    pCat.value = product ? product.category : '';
    pStock.value = product ? product.stock : '';
    pTh.value = product ? product.threshold : 5;
    modal.classList.remove('hidden');
  }
  btnCancel.addEventListener('click', ()=> { modal.classList.add('hidden'); });
  btnSave.addEventListener('click', ()=> {
    const data = { id: editing ? editing.id : id(), name: pName.value || 'Nuovo prodotto', price: Number(pPrice.value)||0, category: pCat.value||'', stock: Number(pStock.value)||0, threshold: Number(pTh.value)||5 };
    if(editing){ products = products.map(p=> p.id===editing.id ? data : p); } else { products.push(data); }
    saveAll(); modal.classList.add('hidden'); renderProducts();
  });

  // Small helpers
  function el(tag, cls){ const e = document.createElement(tag); if(cls) e.className = cls; return e; }
  // expose for debugging
  window._gb = { products, expirations, sales };

})();
