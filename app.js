

const prebuiltPCs = [
  {
    id: 'pb1', name: 'Nova Pro', type: 'Gaming', price: 1499.99,
    image: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&w=800&q=80',
    cpu: 'AMD Ryzen 5 7600X', gpu: 'NVIDIA RTX 4070', ram: '32GB DDR5', storage: '1TB NVMe SSD'
  },
  {
    id: 'pb2', name: 'Creator Studio', type: 'Workstation', price: 2199.99,
    image: 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?auto=format&fit=crop&w=800&q=80',
    cpu: 'Intel Core i9-13900K', gpu: 'NVIDIA RTX 4080', ram: '64GB DDR5', storage: '2TB NVMe SSD'
  },
  {
    id: 'pb3', name: 'Apex Elite', type: 'Enthusiast', price: 2999.99,
    image: 'https://images.unsplash.com/photo-1624705002806-5d72df19c3ad?auto=format&fit=crop&w=800&q=80',
    cpu: 'AMD Ryzen 9 7950X3D', gpu: 'NVIDIA RTX 4090', ram: '64GB DDR5', storage: '4TB NVMe SSD'
  }
];

const pcParts = [
  { id: 'cpu1', category: 'CPU',         name: 'AMD Ryzen 7 7800X3D',         price: 399.99,  specs: '8 Cores, 16 Threads, 5.0 GHz Max Boost' },
  { id: 'cpu2', category: 'CPU',         name: 'Intel Core i7-13700K',         price: 409.99,  specs: '16 Cores, 24 Threads, 5.4 GHz Max Boost' },
  { id: 'gpu1', category: 'GPU',         name: 'NVIDIA GeForce RTX 4080 Super',price: 999.99,  specs: '16GB GDDR6X, 2550 MHz Core Clock' },
  { id: 'gpu2', category: 'GPU',         name: 'AMD Radeon RX 7900 XTX',       price: 949.99,  specs: '24GB GDDR6, 2500 MHz Core Clock' },
  { id: 'mb1',  category: 'Motherboard', name: 'ASUS ROG Strix B650E-F',       price: 259.99,  specs: 'AM5 Socket, ATX, PCIe 5.0' },
  { id: 'mb2',  category: 'Motherboard', name: 'MSI MAG Z790 Tomahawk',        price: 239.99,  specs: 'LGA 1700 Socket, ATX, DDR5' },
  { id: 'ram1', category: 'RAM',         name: 'Corsair Vengeance RGB 32GB',   price: 119.99,  specs: 'DDR5-6000, CL30, 2×16GB' },
  { id: 'ram2', category: 'RAM',         name: 'G.Skill Trident Z5 Neo 64GB',  price: 214.99,  specs: 'DDR5-6000, CL30, 2×32GB' },
  { id: 'psu1', category: 'PSU',         name: 'Corsair RM850x',               price: 134.99,  specs: '850W, 80+ Gold, Fully Modular' },
  { id: 'psu2', category: 'PSU',         name: 'SeaSonic FOCUS GX-1000',       price: 169.99,  specs: '1000W, 80+ Gold, Fully Modular' },
  { id: 'cs1',  category: 'Case',        name: 'Fractal Design North',         price: 139.99,  specs: 'Mid Tower, ATX, Wood Front Panel' },
  { id: 'cs2',  category: 'Case',        name: 'Lian Li O11 Dynamic EVO',      price: 159.99,  specs: 'Mid Tower, ATX, Dual Chamber' }
];

const BUILDER_SLOTS = ['CPU', 'GPU', 'Motherboard', 'RAM', 'PSU', 'Case'];

let cart      = [];
let wishlist  = [];
let activeVoucher = null;
const voucherRules = {
  SAVE10: { name: 'SAVE10', description: '10% off your cart total', type: 'percent', value: 10 },
  PC5OFF: { name: 'PC5OFF', description: '$5 off orders over $50', type: 'flat', value: 5, minTotal: 50 }
};
let builderState = { CPU: null, GPU: null, Motherboard: null, RAM: null, PSU: null, Case: null };

function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + name).classList.add('active');

  document.querySelectorAll('.nav-links button').forEach(b => b.classList.remove('active'));
  const nb = document.getElementById('nav-' + name);
  if (nb) nb.classList.add('active');

  const renderers = {
    home:      renderHome,
    prebuilts: renderPrebuilts,
    builder:   renderBuilder,
    parts:     renderParts,
    cart:      renderCart,
    wishlist:  renderWishlist,
  };
  if (renderers[name]) renderers[name]();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

let toastTimer = null;
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2800);
}

function updateBadges() {
  const cc = document.getElementById('cart-count');
  const wc = document.getElementById('wish-count');
  cc.textContent = cart.length;
  wc.textContent = wishlist.length;
  cc.classList.toggle('visible', cart.length > 0);
  wc.classList.toggle('visible', wishlist.length > 0);
}

function getVoucherDiscount(subtotal) {
  if (!activeVoucher) return 0;
  if (activeVoucher.type === 'percent') {
    return +(subtotal * activeVoucher.value / 100).toFixed(2);
  }
  if (activeVoucher.type === 'flat') {
    return Math.min(activeVoucher.value, subtotal);
  }
  return 0;
}

function applyVoucher() {
  const code = document.getElementById('voucher-code')?.value.trim().toUpperCase();
  if (!code) {
    showToast('Enter a voucher code to apply.');
    return;
  }

  const voucher = voucherRules[code];
  if (!voucher) {
    showToast('That voucher code is not valid.');
    return;
  }

  const subtotal = cart.reduce((sum, i) => sum + ((i.unitPrice || i.price) * (i.quantity || 1)), 0);
  if (voucher.minTotal && subtotal < voucher.minTotal) {
    showToast(`Add $${(voucher.minTotal - subtotal).toFixed(2)} more to use ${code}.`);
    return;
  }

  activeVoucher = voucher;
  showToast(`Voucher ${code} applied! ${voucher.description}`);
  renderCart();
}

function clearVoucher() {
  if (!activeVoucher) return;
  activeVoucher = null;
  showToast('Voucher removed.');
  renderCart();
}

function addToCart(item) {
  cart.push({ ...item, cartId: Date.now() + '_' + Math.random(), quantity: 1, notes: '', unitPrice: item.price });
  updateBadges();
  showToast(`${item.name} added to cart!`);
}

function removeFromCart(cartId) {
  cart = cart.filter(i => i.cartId !== cartId);
  updateBadges();
  renderCart();
}

function renderCart() {
  const el = document.getElementById('cart-content');
  if (cart.length === 0) {
    el.innerHTML = `
      <div class="empty-state">
        <p>Your cart is empty.</p>
        <button class="btn btn-primary" onclick="showPage('parts')">Browse Components</button>
      </div>`;
    return;
  }

  const subtotal = cart.reduce((sum, i) => sum + ((i.unitPrice || i.price) * (i.quantity || 1)), 0);
  const discount = getVoucherDiscount(subtotal);
  const total = Math.max(0, subtotal - discount);
  el.innerHTML = `
    <div>
      ${cart.map(i => {
        const itemTotal = ((i.unitPrice || i.price) * (i.quantity || 1)).toFixed(2);
        const unitPrice = (i.unitPrice || i.price).toFixed(2);
        return `
        <div class="list-row animate-fade-in">
          <div class="list-row-info">
            <div class="list-row-name">${i.name}</div>
            ${i.category ? `<div class="list-row-sub">${i.category}</div>` : ''}
            <div class="list-row-sub">Qty: ${i.quantity || 1}</div>
            <div class="list-row-sub">Unit: $${unitPrice} • Total: $${itemTotal}</div>
          </div>
          <span class="price" style="margin-right:1rem">$${itemTotal}</span>
          <button class="btn btn-secondary btn-sm" onclick="openEditModal('${i.cartId}', 'cart')" style="margin-right:0.5rem">Edit</button>
          <button class="btn btn-secondary btn-sm" onclick="removeFromCart('${i.cartId}')">Remove</button>
        </div>`;
      }).join('')}
    </div>
    <div class="cart-total-box">
      <div class="summary-total">
        <span>Subtotal</span>
        <span>$${subtotal.toFixed(2)}</span>
      </div>
      ${activeVoucher ? `
      <div class="summary-total">
        <span>${activeVoucher.name} discount</span>
        <span>-$${discount.toFixed(2)}</span>
      </div>
      <div class="summary-total" style="font-size:0.95rem;color:var(--text-secondary);gap:0.5rem;">
        <span>Voucher applied</span>
        <button class="btn btn-secondary btn-sm" onclick="clearVoucher()">Remove</button>
      </div>
      ` : ''}
      <div class="summary-total">
        <span>Total</span>
        <span class="text-gradient">$${total.toFixed(2)}</span>
      </div>
      <button class="btn btn-primary" style="width:100%;margin-bottom:0.5rem" onclick="showToast('Checkout coming soon!')">Proceed to Checkout</button>
      <button class="btn btn-secondary" style="width:100%" onclick="clearCart()">Clear Cart</button>
    </div>`;
}

function toggleWishlist(item) {
  const idx = wishlist.findIndex(w => w.id === item.id);
  if (idx >= 0) {
    wishlist.splice(idx, 1);
    showToast('Removed from wishlist.');
  } else {
    wishlist.push(item);
    showToast(`${item.name} saved to wishlist!`);
  }
  updateBadges();
}

function renderWishlist() {
  const el = document.getElementById('wishlist-content');
  if (wishlist.length === 0) {
    el.innerHTML = `
      <div class="empty-state">
        <p>Your wishlist is empty.</p>
        <button class="btn btn-secondary" onclick="showPage('prebuilts')">Browse Pre-builts</button>
      </div>`;
    return;
  }
  el.innerHTML = `<div class="grid grid-cols-3">${wishlist.map(item => prebuiltCardHTML(item)).join('')}</div>`;
}

function renderHome() {
  document.getElementById('home-prebuilts').innerHTML =
    prebuiltPCs.map(pc => prebuiltCardHTML(pc)).join('');
}

function renderPrebuilts() {
  document.getElementById('prebuilts-grid').innerHTML =
    prebuiltPCs.map(pc => prebuiltCardHTML(pc)).join('');
}

function prebuiltCardHTML(pc) {
  
  const safe = JSON.stringify(pc).replace(/'/g, "\\'");
  return `
  <div class="card animate-fade-in">
    <div class="card-img-wrapper">
      <img class="card-img" src="${pc.image}" alt="${pc.name}" style="height:250px" loading="lazy" />
    </div>
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:1rem">
      <div>
        <span class="badge" style="margin-bottom:0.5rem">${pc.type}</span>
        <h3>${pc.name}</h3>
      </div>
      <span class="price">$${pc.price.toFixed(2)}</span>
    </div>
    <ul class="specs-list">
      <li><strong>CPU:</strong> ${pc.cpu}</li>
      <li><strong>GPU:</strong> ${pc.gpu}</li>
      <li><strong>RAM:</strong> ${pc.ram}</li>
      <li><strong>Storage:</strong> ${pc.storage}</li>
    </ul>
    <div style="display:flex;gap:0.5rem">
      <button class="btn btn-primary" style="flex:1" onclick='addToCart(${safe})'>Add to Cart</button>
      <button class="btn btn-secondary btn-sm" onclick='toggleWishlist(${safe})'>♡</button>
    </div>
  </div>`;
}

// ═══════════════════════════════════════════════
//  PARTS CATALOG
// ═══════════════════════════════════════════════

function renderParts() {
  const search = (document.getElementById('parts-search')?.value || '').toLowerCase();
  const cat    = document.getElementById('parts-category')?.value || 'All';

  const filtered = pcParts.filter(p =>
    (cat === 'All' || p.category === cat) &&
    p.name.toLowerCase().includes(search)
  );

  const grid  = document.getElementById('parts-grid');
  const empty = document.getElementById('parts-empty');

  if (filtered.length === 0) {
    grid.innerHTML = '';
    empty.style.display = 'block';
    return;
  }

  empty.style.display = 'none';
  grid.innerHTML = filtered.map(part => {
    const safe = JSON.stringify(part).replace(/'/g, "\\'");
    return `
    <div class="card animate-fade-in">
      <span class="badge" style="align-self:flex-start;margin-bottom:1rem">${part.category}</span>
      <h4 style="font-size:1rem;margin-bottom:0.5rem;min-height:2.8rem">${part.name}</h4>
      <p class="text-secondary" style="font-size:0.85rem;flex:1;margin-bottom:1.5rem;line-height:1.5">${part.specs}</p>
      <div class="price" style="margin-bottom:1.5rem">$${part.price.toFixed(2)}</div>
      <div style="display:flex;flex-direction:column;gap:0.5rem">
        <button class="btn btn-primary" onclick='addToCart(${safe})'>Add to Cart</button>
        <button class="btn btn-secondary" onclick='selectForBuilder(${safe})'>Add to Builder</button>
      </div>
    </div>`;
  }).join('');
}

// ═══════════════════════════════════════════════
//  BUILDER
// ═══════════════════════════════════════════════

function getBuilderTotal() {
  return Object.values(builderState).reduce((sum, p) => sum + (p?.price || 0), 0);
}

function selectForBuilder(part) {
  builderState[part.category] = part;
  showToast(`${part.name} added to builder!`);
  showPage('builder');
}

function removeFromBuilder(slot) {
  builderState[slot] = null;
  renderBuilder();
}

function goChoosePart(category) {
  document.getElementById('parts-category').value = category;
  showPage('parts');
  renderParts();
}

function addBuildToCart() {
  const filled = Object.values(builderState).filter(Boolean);
  if (filled.length === 0) {
    showToast('Your builder is empty — choose some parts first!');
    return;
  }
  addToCart({
    id:       'build_' + Date.now(),
    name:     'Custom Build',
    price:    getBuilderTotal(),
    category: 'Custom Build'
  });
}

function renderBuilder() {
  const total = getBuilderTotal();
  document.getElementById('builder-total').textContent   = '$' + total.toFixed(2);
  document.getElementById('summary-total-val').textContent = '$' + total.toFixed(2);

  // Slots
  document.getElementById('builder-slots').innerHTML = BUILDER_SLOTS.map(slot => {
    const part = builderState[slot];
    return `
    <div class="slot-row">
      <div class="slot-icon">
        ${slotIcon(slot)}
      </div>
      <div class="slot-info">
        <div class="slot-label">${slot}</div>
        ${part
          ? `<div class="slot-name">${part.name}</div>`
          : `<div class="slot-empty">Select a ${slot}</div>`}
      </div>
      ${part ? `<span class="slot-price">$${part.price.toFixed(2)}</span>` : ''}
      ${part
        ? `<button class="btn btn-secondary btn-sm" onclick="removeFromBuilder('${slot}')">✕ Remove</button>`
        : `<button class="btn btn-primary  btn-sm" onclick="goChoosePart('${slot}')">Choose</button>`}
    </div>`;
  }).join('');

  // Summary list
  document.getElementById('summary-list').innerHTML = BUILDER_SLOTS.map(slot => `
    <li>
      <span class="text-secondary">${slot}</span>
      <span style="font-weight:500">${builderState[slot] ? '$' + builderState[slot].price.toFixed(2) : '—'}</span>
    </li>`).join('');
}

function slotIcon(slot) {
  const icons = {
    CPU: `<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9"  y1="1"  x2="9"  y2="4"/><line x1="15" y1="1"  x2="15" y2="4"/><line x1="9"  y1="20" x2="9"  y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9"  x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1"  y1="9"  x2="4"  y2="9"/><line x1="1"  y1="14" x2="4"  y2="14"/></svg>`,
    GPU: `<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="10" rx="2"/><path d="M6 7V5M10 7V5M14 7V5M18 7V5"/><circle cx="8" cy="12" r="1.5"/><circle cx="16" cy="12" r="1.5"/></svg>`,
    Motherboard: `<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="2"/><rect x="6" y="6" width="5" height="5"/><rect x="13" y="6" width="5" height="5"/><path d="M6 15h12M9 18v2M15 18v2"/></svg>`,
    RAM: `<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="12" rx="1"/><path d="M7 6V4M11 6V4M15 6V4M19 6V4M7 18v2M11 18v2M15 18v2M19 18v2"/></svg>`,
    PSU: `<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="12" rx="2"/><path d="M12 10v4M10 12h4"/></svg>`,
    Case: `<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M9 6h6M9 10h2"/><circle cx="15" cy="18" r="1"/></svg>`
  };
  return icons[slot] || '';
}

// ═══════════════════════════════════════════════
//  EDIT MODAL & UPDATE UI
// ═══════════════════════════════════════════════

let editingItem = null;
let editingType = null;

function openEditModal(id, type) {
  editingType = type;
  let item = null;
  
  if (type === 'part') {
    item = readPart(id);
  } else if (type === 'prebuilt') {
    item = readPrebuilt(id);
  } else if (type === 'cart') {
    item = readCartItem(id);
  }
  
  if (!item) {
    showToast('Item not found!');
    return;
  }
  
  editingItem = { ...item, originalId: id };
  renderEditModal();
}

function renderEditModal() {
  if (!editingItem) return;
  
  const isCart = editingType === 'cart';
  
  let fieldsHTML = '';
  
  if (isCart) {
    const unitPrice = (editingItem.unitPrice || editingItem.price || 0).toFixed(2);
    fieldsHTML = `
      <div class="form-group">
        <label>Item Name</label>
        <input type="text" id="edit-name" value="${editingItem.name}" disabled style="background-color:#f1f5f9;cursor:not-allowed" />
      </div>
      <div class="form-group">
        <label>Unit Price</label>
        <input type="number" id="edit-price" value="${unitPrice}" disabled style="background-color:#f1f5f9;cursor:not-allowed" step="0.01" />
      </div>
      <div class="form-group">
        <label>Quantity</label>
        <input type="number" id="edit-quantity" value="${editingItem.quantity || 1}" min="1" max="100" />
      </div>
      <div class="form-group">
        <label>Notes (Optional)</label>
        <textarea id="edit-notes" placeholder="Add special instructions or notes..." style="resize:vertical;min-height:80px">${editingItem.notes || ''}</textarea>
      </div>`;
  }
  
  const modal = document.getElementById('edit-modal');
  if (!modal) {
    // Create modal if it doesn't exist
    const modalHTML = `
    <div id="edit-modal" class="modal" style="display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center">
      <div style="background:var(--bg);border:1px solid var(--border);border-radius:12px;padding:2rem;max-width:500px;width:90%;max-height:80vh;overflow-y:auto">
        <h3 id="edit-title" style="margin-bottom:1.5rem">Edit Cart Item</h3>
        <div id="edit-fields"></div>
        <div style="display:flex;gap:1rem;margin-top:2rem">
          <button class="btn btn-primary" style="flex:1" onclick="saveEdit()">Save Changes</button>
          <button class="btn btn-secondary" style="flex:1" onclick="closeEditModal()">Cancel</button>
        </div>
      </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
  }
  
  document.getElementById('edit-title').textContent = `Edit Cart Item`;
  document.getElementById('edit-fields').innerHTML = fieldsHTML;
  document.getElementById('edit-modal').style.display = 'flex';
}

function closeEditModal() {
  const modal = document.getElementById('edit-modal');
  if (modal) modal.style.display = 'none';
  editingItem = null;
  editingType = null;
}

function saveEdit() {
  if (!editingItem || !editingType) return;
  
  if (editingType === 'cart') {
    const updates = {
      quantity: parseInt(document.getElementById('edit-quantity').value) || 1,
      notes: document.getElementById('edit-notes').value
    };
    updateCartItem(editingItem.originalId, updates);
  }
  
  closeEditModal();
}

// ═══════════════════════════════════════════════
//  CRUD OPERATIONS - PC PARTS
// ═══════════════════════════════════════════════

function createPart(partData) {
  const newPart = {
    id: partData.id || 'part_' + Date.now(),
    category: partData.category,
    name: partData.name,
    price: partData.price,
    specs: partData.specs
  };
  pcParts.push(newPart);
  showToast(`${newPart.name} added to catalog!`);
  return newPart;
}

function readPart(partId) {
  return pcParts.find(p => p.id === partId);
}

function readAllParts() {
  return [...pcParts];
}

function readPartsByCategory(category) {
  return pcParts.filter(p => p.category === category);
}

function updatePart(partId, updates) {
  const part = readPart(partId);
  if (!part) {
    showToast('Part not found!');
    return null;
  }
  Object.assign(part, updates);
  showToast(`${part.name} updated!`);
  return part;
}

function deletePart(partId) {
  const idx = pcParts.findIndex(p => p.id === partId);
  if (idx < 0) {
    showToast('Part not found!');
    return false;
  }
  const deleted = pcParts.splice(idx, 1)[0];
  showToast(`${deleted.name} removed from catalog!`);
  return true;
}

// ═══════════════════════════════════════════════
//  CRUD OPERATIONS - PREBUILT PCs
// ═══════════════════════════════════════════════

function createPrebuilt(pcData) {
  const newPC = {
    id: pcData.id || 'pb_' + Date.now(),
    name: pcData.name,
    type: pcData.type,
    price: pcData.price,
    image: pcData.image,
    cpu: pcData.cpu,
    gpu: pcData.gpu,
    ram: pcData.ram,
    storage: pcData.storage
  };
  prebuiltPCs.push(newPC);
  showToast(`${newPC.name} added to prebuilts!`);
  return newPC;
}

function readPrebuilt(pcId) {
  return prebuiltPCs.find(pc => pc.id === pcId);
}

function readAllPrebuilts() {
  return [...prebuiltPCs];
}

function readPrebuiltsByType(type) {
  return prebuiltPCs.filter(pc => pc.type === type);
}

function updatePrebuilt(pcId, updates) {
  const pc = readPrebuilt(pcId);
  if (!pc) {
    showToast('Prebuilt PC not found!');
    return null;
  }
  Object.assign(pc, updates);
  showToast(`${pc.name} updated!`);
  return pc;
}

function deletePrebuilt(pcId) {
  const idx = prebuiltPCs.findIndex(pc => pc.id === pcId);
  if (idx < 0) {
    showToast('Prebuilt PC not found!');
    return false;
  }
  const deleted = prebuiltPCs.splice(idx, 1)[0];
  showToast(`${deleted.name} removed from prebuilts!`);
  return true;
}

// ═══════════════════════════════════════════════
//  CRUD OPERATIONS - CART ITEMS
// ═══════════════════════════════════════════════

function createCartItem(item) {
  const cartItem = { ...item, cartId: Date.now() + '_' + Math.random(), quantity: 1, notes: '', unitPrice: item.price };
  cart.push(cartItem);
  updateBadges();
  showToast(`${item.name} added to cart!`);
  return cartItem;
}

function readCartItem(cartId) {
  return cart.find(i => i.cartId === cartId);
}

function readAllCartItems() {
  return [...cart];
}

function updateCartItem(cartId, updates) {
  const item = readCartItem(cartId);
  if (!item) {
    showToast('Cart item not found!');
    return null;
  }
  Object.assign(item, updates);
  renderCart();
  return item;
}

function deleteCartItem(cartId) {
  const idx = cart.findIndex(i => i.cartId === cartId);
  if (idx < 0) {
    showToast('Item not in cart!');
    return false;
  }
  const deleted = cart.splice(idx, 1)[0];
  updateBadges();
  renderCart();
  showToast(`${deleted.name} removed from cart!`);
  return true;
}

function clearCart() {
  if (cart.length === 0) {
    showToast('Cart is already empty!');
    return false;
  }
  cart = [];
  updateBadges();
  renderCart();
  showToast('Cart cleared!');
  return true;
}

function getCartTotal() {
  const subtotal = cart.reduce((sum, i) => sum + ((i.unitPrice || i.price) * (i.quantity || 1)), 0);
  const discount = getVoucherDiscount(subtotal);
  return Math.max(0, subtotal - discount);
}

// ═══════════════════════════════════════════════
//  CRUD OPERATIONS - WISHLIST
// ═══════════════════════════════════════════════

function createWishlistItem(item) {
  if (wishlist.findIndex(w => w.id === item.id) >= 0) {
    showToast(`${item.name} is already in your wishlist!`);
    return null;
  }
  wishlist.push(item);
  updateBadges();
  showToast(`${item.name} added to wishlist!`);
  return item;
}

function readWishlistItem(itemId) {
  return wishlist.find(w => w.id === itemId);
}

function readAllWishlistItems() {
  return [...wishlist];
}

function updateWishlistItem(itemId, updates) {
  const item = readWishlistItem(itemId);
  if (!item) {
    showToast('Item not in wishlist!');
    return null;
  }
  Object.assign(item, updates);
  renderWishlist();
  return item;
}

function deleteWishlistItem(itemId) {
  const idx = wishlist.findIndex(w => w.id === itemId);
  if (idx < 0) {
    showToast('Item not in wishlist!');
    return false;
  }
  const deleted = wishlist.splice(idx, 1)[0];
  updateBadges();
  renderWishlist();
  showToast(`${deleted.name} removed from wishlist!`);
  return true;
}

function clearWishlist() {
  if (wishlist.length === 0) {
    showToast('Wishlist is already empty!');
    return false;
  }
  wishlist = [];
  updateBadges();
  renderWishlist();
  showToast('Wishlist cleared!');
  return true;
}

function moveWishlistToCart(itemId) {
  const item = readWishlistItem(itemId);
  if (!item) {
    showToast('Item not in wishlist!');
    return false;
  }
  deleteWishlistItem(itemId);
  createCartItem(item);
  showToast(`${item.name} moved to cart!`);
  return true;
}

// ═══════════════════════════════════════════════
//  INIT
// ═══════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
  renderHome();
  renderPrebuilts();
  renderBuilder();
});