/**
 * frenservosu.com - Unified Server & Frontend Bundle
 * Kesin Çözüm ve Tam Sürüm: Açılır Kategoriler, Marka Filtreleri, Görsel Render ve Akıllı Yükleme
 */
const http = require('http');
const fs = require('fs');
const url = require('url');

let products = [
  { id: 1, no: "KP-8041", n: "Fren Servosu 8\" Tek Diyaframlı", mfr: "TRW", p: 3450, stock: 150, category: "Fren Servoları", img: "https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=300&auto=format&fit=crop&q=80", oem: "70093032", vehicle: "RENAULT MEGANE 2" },
  { id: 2, no: "KP-1000", n: "Fren Servosu 10\" Çift Diyaframlı", mfr: "TRW", p: 4200, stock: 120, category: "Fren Servoları", img: "https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=300&auto=format&fit=crop&q=80", oem: "70093034", vehicle: "RENAULT CLIO" },
  { id: 3, no: "KP-AN", n: "Fren Servosu Ana Merkezi Dahili", mfr: "BOSCH", p: 5100, stock: 85, category: "Ana Merkez", img: "https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=300&auto=format&fit=crop&q=80", oem: "02041257", vehicle: "FIAT DUCATO" },
  { id: 4, no: "BSCH-280", n: "Westinghouse Fren Servosu 280mm", mfr: "BOSCH", p: 26000, stock: 40, category: "Disk Balata", img: "https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=300&auto=format&fit=crop&q=80", oem: "02041258", vehicle: "FORD TRANSIT" }
];

const COLUMN_MAPPINGS = {
  no: [/stok\s*kodu/i, /ürün\s*kodu/i, /parça\s*no/i, /part\s*no/i, /kod/i],
  name: [/ürün\s*adı/i, /malzeme\s*adı/i, /açıklama/i, /ürün/i],
  mfr: [/marka/i, /üretici/i, /imalatçı/i],
  p: [/fiyat/i, /liste\s*fiyatı/i, /tutar/i, /satış\s*fiyatı/i],
  stock: [/bakiye/i, /adet/i, /stok/i, /mevcut/i, /miktar/i],
  oem: [/oem/i, /orjinal\s*kod/i, /oem\s*no/i],
  vehicle: [/araç/i, /uyumluluk/i, /model/i]
};

function autoMatchColumns(headerRow) {
  let detectedIndices = { no: -1, name: -1, mfr: -1, p: -1, stock: -1, oem: -1, vehicle: -1 };
  headerRow.forEach((cell, index) => {
    if (!cell) return;
    const cleanCell = cell.toString().trim().toLowerCase();
    for (const [field, regexList] of Object.entries(COLUMN_MAPPINGS)) {
      for (const regex of regexList) {
        if (regex.test(cleanCell) && detectedIndices[field] === -1) {
          detectedIndices[field] = index;
          break;
        }
      }
    }
  });
  return detectedIndices;
}

const EMBEDDED_HTML = `<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>frenservosu.com - Profesyonel Fren Sistemleri ve Yedek Parça</title>
    <style>
        :root { --primary: #e65100; --dark: #1a1a1a; --light: #f8f9fa; --border: #e0e0e0; }
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
        body { background-color: var(--light); color: var(--dark); line-height: 1.6; }
        
        header { background: #fff; border-bottom: 1px solid var(--border); padding: 12px 5%; display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; z-index: 1000; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
        .logo-area { font-size: 22px; font-weight: bold; color: var(--primary); text-decoration: none; display: flex; align-items: center; gap: 8px; }
        
        nav ul { display: flex; list-style: none; gap: 25px; align-items: center; }
        nav ul li { position: relative; }
        nav ul li a { text-decoration: none; color: var(--dark); font-weight: 600; font-size: 13px; cursor: pointer; transition: 0.2s; }
        nav ul li a:hover, nav ul li a.active { color: var(--primary); }
        
        /* Açılır Mega Menü */
        .dropdown-menu { display: none; position: absolute; top: 100%; left: 0; background: #fff; border: 1px solid var(--border); box-shadow: 0 8px 16px rgba(0,0,0,0.1); width: 220px; border-radius: 4px; padding: 10px 0; z-index: 1100; }
        .dropdown-menu a { display: block; padding: 8px 15px; color: var(--dark); font-size: 13px; font-weight: normal; }
        .dropdown-menu a:hover { background: #fff3e0; color: var(--primary); }
        nav ul li:hover .dropdown-menu { display: block; }

        .hero { background: linear-gradient(135deg, #1a1a1a 0%, #2c2c2c 100%); color: #fff; padding: 35px 5%; display: flex; justify-content: space-between; align-items: center; gap: 20px; }
        .hero-search { background: #fff; padding: 20px; border-radius: 8px; width: 48%; color: var(--dark); box-shadow: 0 4px 20px rgba(0,0,0,0.4); }
        .hero-search h3 { margin-bottom: 12px; font-size: 16px; color: var(--dark); }
        .search-group { display: flex; gap: 8px; margin-bottom: 8px; }
        .search-group input { flex: 1; padding: 9px; border: 1px solid var(--border); border-radius: 4px; font-size: 13px; }
        
        .btn { background: var(--primary); color: #fff; border: none; padding: 9px 18px; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 13px; transition: 0.2s; }
        .btn:hover { background: #bf360c; }
        
        .container { max-width: 1280px; margin: 30px auto; padding: 0 20px; }
        .section-title { font-size: 20px; margin-bottom: 15px; border-bottom: 2px solid var(--primary); padding-bottom: 5px; display: inline-block; font-weight: bold; }
        
        .brands-bar { display: flex; gap: 15px; margin-bottom: 25px; overflow-x: auto; padding-bottom: 5px; }
        .brand-chip { background: #fff; border: 1px solid var(--border); padding: 8px 20px; border-radius: 20px; font-weight: bold; font-size: 13px; cursor: pointer; white-space: nowrap; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
        .brand-chip:hover, .brand-chip.active { border-color: var(--primary); color: var(--primary); background: #fff3e0; }

        .products-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 18px; }
        .product-card { background: #fff; border: 1px solid var(--border); border-radius: 8px; padding: 15px; display: flex; flex-direction: column; justify-content: space-between; transition: 0.2s; position: relative; }
        .product-card:hover { box-shadow: 0 6px 16px rgba(0,0,0,0.08); border-color: #d1d1d1; }
        .product-img-container { width: 100%; height: 150px; background: #fff; display: flex; align-items: center; justify-content: center; margin-bottom: 10px; border-radius: 4px; overflow: hidden; }
        .product-main-img { max-width: 100%; max-height: 100%; object-fit: contain; }
        .product-details h4 { font-size: 14px; margin-bottom: 6px; color: var(--dark); height: 38px; overflow: hidden; }
        .part-no { font-size: 12px; color: #666; margin-bottom: 6px; }
        .price { font-size: 17px; font-weight: bold; color: var(--primary); margin-bottom: 10px; }
        
        .admin-panel { background: #fff; padding: 25px; border-radius: 8px; margin-top: 40px; border: 1px solid var(--border); box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
        .admin-table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        .admin-table th, .admin-table td { border: 1px solid var(--border); padding: 9px; text-align: left; font-size: 13px; }
        .admin-table th { background: #f4f4f4; }
        .flex-between { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
        textarea.smart-input { width: 100%; height: 110px; padding: 10px; border: 1px solid var(--border); border-radius: 4px; margin-bottom: 10px; font-family: monospace; font-size: 12px; }
    </style>
</head>
<body>
    <header>
        <a href="/" class="logo-area">⚡ frenservosu.com <span style="font-size:11px; font-weight:normal; color:#666;">powered by xparca.com</span></a>
        <nav>
            <ul>
                <li>
                    <a href="#" class="active">KATEGORİLER ▾</a>
                    <div class="dropdown-menu">
                        <a onclick="filterByCategory('TÜMÜ')">Tüm Kategoriler</a>
                        <a onclick="filterByCategory('Fren Servoları')">Fren Servoları</a>
                        <a onclick="filterByCategory('Ana Merkez')">Ana Merkez</a>
                        <a onclick="filterByCategory('Disk Balata')">Disk Balata</a>
                        <a onclick="filterByCategory('Vakum Pompası')">Vakum Pompası</a>
                        <a onclick="filterByCategory('Tamir Takımı')">Tamir Takımı</a>
                    </div>
                </li>
                <li><a href="#markalar">MARKALAR</a></li>
                <li><a href="#admin">YÖNETİM PANELİ</a></li>
                <li><a href="#sepet">SEPETİM (<span id="cart-count">0</span>)</a></li>
            </ul>
        </nav>
    </header>

    <section class="hero">
        <div>
            <h1 style="font-size: 28px; margin-bottom: 8px;">Şasi No ile Uyumlu Fren Sistemleri</h1>
            <p style="color: #bbb; font-size: 14px;">TRW, ATE, Bosch ve Pierburg orijinal yedek parça dağıtım ağı.</p>
        </div>
        <div class="hero-search">
            <h3>Şasi No veya Parça Numarası ile Ara</h3>
            <div class="search-group">
                <input type="text" id="search-input" placeholder="17 haneli Şasi No veya Parça No...">
                <button class="btn" onclick="searchProducts()">ARA</button>
            </div>
        </div>
    </section>

    <div class="container" id="markalar">
        <!-- Öne Çıkan Markalar Filtre Barı -->
        <div class="brands-bar">
            <div class="brand-chip active" onclick="filterByBrand('TÜMÜ')">Tüm Markalar</div>
            <div class="brand-chip" onclick="filterByBrand('TRW')">TRW</div>
            <div class="brand-chip" onclick="filterByBrand('BOSCH')">BOSCH</div>
            <div class="brand-chip" onclick="filterByBrand('ATE')">ATE</div>
            <div class="brand-chip" onclick="filterByBrand('PIERBURG')">PIERBURG</div>
        </div>

        <h2 class="section-title">Ürün Kataloğu ve Çözümler</h2>
        <div class="products-grid" id="product-list">
            <!-- Ürün Kartları Buraya Dolacak -->
        </div>

        <!-- Yönetim Paneli -->
        <div class="admin-panel" id="admin">
            <div class="flex-between">
                <h2>Yönetim Paneli & Akıllı Toplu Yükleme</h2>
                <div>
                    <button class="btn" style="background:#d32f2f;" onclick="deleteSelectedProducts()">Seçilenleri Sil</button>
                </div>
            </div>
            
            <div style="margin-bottom: 20px; background: #fafafa; padding: 18px; border-radius: 6px; border:1px solid var(--border);">
                <h3>Akıllı Excel / Toplu Veri Yükleme</h3>
                <p style="font-size: 12px; color: #666; margin-bottom: 8px;">Excel veya tablo içeriğini doğrudan kopyalayıp buraya yapıştırın. Sütunlar otomatik algılanacaktır.</p>
                <textarea class="smart-input" id="bulk-data-input" placeholder="Stok Kodu \t Ürün Adı \t Marka \t Fiyat \t Stok \t OEM \t Araç Uyumluluk"></textarea>
                <button class="btn" onclick="processBulkUpload()">Verileri Otomatik Eşle ve Aktar</button>
            </div>

            <h3>Kayıtlı Ürün Listesi</h3>
            <table class="admin-table">
                <thead>
                    <tr>
                        <th style="width: 35px;"><input type="checkbox" id="select-all" onclick="toggleSelectAll(this)"></th>
                        <th style="width: 50px;">Görsel</th>
                        <th>Parça No</th>
                        <th>Ürün Adı</th>
                        <th>Kategori</th>
                        <th>Üretici Marka</th>
                        <th>Fiyat (₺)</th>
                        <th>Stok</th>
                        <th>Uyumlu Araç</th>
                        <th style="width: 60px;">İşlem</th>
                    </tr>
                </thead>
                <tbody id="admin-product-table">
                    <!-- Tablo İçeriği -->
                </tbody>
            </table>
        </div>
    </div>

    <script>
        let productsData = [];

        async function fetchProducts() {
            try {
                const res = await fetch('/api/products');
                productsData = await res.json();
                renderProducts(productsData);
                renderAdminTable(productsData);
            } catch(e) {
                console.error("Ürünler yüklenemedi", e);
            }
        }

        function renderProducts(items) {
            const grid = document.getElementById('product-list');
            grid.innerHTML = '';
            if(!items || items.length === 0) {
                grid.innerHTML = '<p style="grid-column: 1/-1; text-align:center; padding:20px; color:#666;">Hiç ürün bulunamadı.</p>';
                return;
            }
            items.forEach(p => {
                const imgUrl = p.img && p.img.trim() !== '' ? p.img : 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=300&auto=format&fit=crop&q=80';
                grid.innerHTML += \`
                    <div class="product-card">
                        <div>
                            <div class="product-img-container">
                                <img src="\${imgUrl}" alt="\${p.n}" class="product-main-img" loading="lazy" />
                            </div>
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:5px;">
                                <span style="font-size:10px; background:#fff3e0; color:var(--primary); padding:2px 6px; border-radius:4px; font-weight:bold;">\${p.mfr || 'OEM'}</span>
                                <span style="font-size:10px; color:#666;">\${p.category || 'Fren'}</span>
                            </div>
                            <h4>\${p.n}</h4>
                            <p class="part-no">Parça No: \${p.no} | OEM: \${p.oem || '-'}</p>
                            <p style="font-size:11px; color:#555; margin-bottom:8px;">Uyum: <b>\${p.vehicle || 'Genel Uyum'}</b></p>
                        </div>
                        <div>
                            <div class="price">₺\${Number(p.p).toLocaleString('tr-TR')}</div>
                            <button class="btn" style="width:100%; padding:7px; font-size:12px;" onclick="addToCart('\${p.no}')">Sepete Ekle</button>
                        </div>
                    </div>
                \`;
            });
        }

        function renderAdminTable(items) {
            const tbody = document.getElementById('admin-product-table');
            tbody.innerHTML = '';
            if(!items) return;
            items.forEach(p => {
                const imgUrl = p.img && p.img.trim() !== '' ? p.img : 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=100&auto=format&fit=crop&q=80';
                tbody.innerHTML += \`
                    <tr>
                        <td><input type="checkbox" class="product-checkbox" value="\${p.id}"></td>
                        <td><img src="\${imgUrl}" style="width:35px; height:35px; object-fit:contain;"></td>
                        <td>\${p.no}</td>
                        <td>\${p.n}</td>
                        <td>\${p.category || '-'}</td>
                        <td>\${p.mfr}</td>
                        <td>₺\${p.p}</td>
                        <td>\${p.stock}</td>
                        <td>\${p.vehicle || '-'}</td>
                        <td><button class="btn" style="background:#d32f2f; padding:3px 8px; font-size:11px;" onclick="deleteProduct(\${p.id})">Sil</button></td>
                    </tr>
                \`;
            });
        }

        function searchProducts() {
            const query = document.getElementById('search-input').value.toLowerCase();
            const filtered = productsData.filter(p => 
                p.n.toLowerCase().includes(query) || 
                p.no.toLowerCase().includes(query) || 
                (p.vehicle && p.vehicle.toLowerCase().includes(query)) ||
                (p.oem && p.oem.toLowerCase().includes(query))
            );
            renderProducts(filtered);
        }

        function filterByCategory(cat) {
            if(cat === 'TÜMÜ') {
                renderProducts(productsData);
            } else {
                const filtered = productsData.filter(p => p.category && p.category.toLowerCase() === cat.toLowerCase());
                renderProducts(filtered);
            }
        }

        function filterByBrand(brand) {
            document.querySelectorAll('.brand-chip').forEach(el => el.classList.remove('active'));
            event.target.classList.add('active');
            if(brand === 'TÜMÜ') {
                renderProducts(productsData);
            } else {
                const filtered = productsData.filter(p => p.mfr && p.mfr.toUpperCase() === brand.toUpperCase());
                renderProducts(filtered);
            }
        }

        function toggleSelectAll(master) {
            const checkboxes = document.querySelectorAll('.product-checkbox');
            checkboxes.forEach(cb => cb.checked = master.checked);
        }

        async function deleteProduct(id) {
            if(!confirm('Bu ürünü silmek istediğinize emin misiniz?')) return;
            await fetch('/api/admin/product/' + id, { method: 'DELETE' });
            fetchProducts();
        }

        async function deleteSelectedProducts() {
            const selectedIds = Array.from(document.querySelectorAll('.product-checkbox:checked')).map(cb => Number(cb.value));
            if(selectedIds.length === 0) {
                alert('Lütfen silinecek ürünleri seçin.');
                return;
            }
            if(!confirm(selectedIds.length + ' adet ürünü silmek istediğinize emin misiniz?')) return;
            
            await fetch('/api/admin/products/delete-batch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: selectedIds })
            });
            fetchProducts();
        }

        async function processBulkUpload() {
            const rawText = document.getElementById('bulk-data-input').value;
            if(!rawText.trim()) {
                alert('Lütfen veri yapıştırın.');
                return;
            }
            const rows = rawText.split('\\n').map(r => r.split('\\t'));
            const res = await fetch('/api/admin/bulk-upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rows })
            });
            const result = await res.json();
            alert(result.message);
            document.getElementById('bulk-data-input').value = '';
            fetchProducts();
        }

        function addToCart(no) {
            alert('Ürün sepete eklendi (Parça No: ' + no + ')');
        }

        fetchProducts();
    </script>
</body>
</html>`;

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    
    if (req.method === 'GET' && pathname === '/api/products') {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(products));
    } 
    else if (req.method === 'DELETE' && pathname.startsWith('/api/admin/product/')) {
        const id = Number(pathname.split('/').pop());
        products = products.filter(p => p.id !== id);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: true }));
    }
    else if (req.method === 'POST' && pathname === '/api/admin/products/delete-batch') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                if (data.ids && Array.isArray(data.ids)) {
                    products = products.filter(p => !data.ids.includes(p.id));
                }
                res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({ success: true }));
            } catch(e) {
                res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({ success: false, error: 'Geçersiz veri' }));
            }
        });
    }
    else if (req.method === 'POST' && pathname === '/api/admin/bulk-upload') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                const rows = data.rows;
                if (!rows || rows.length === 0) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ message: 'Boş veri' }));
                    return;
                }

                const headerRow = rows[0];
                const mapped = autoMatchColumns(headerRow);
                let addedCount = 0;

                for (let i = 1; i < rows.length; i++) {
                    const row = rows[i];
                    if (!row || row.length < 2) continue;

                    const no = mapped.no !== -1 ? row[mapped.no] : (row[0] || 'PARCA-' + Date.now());
                    const name = mapped.name !== -1 ? row[mapped.name] : (row[1] || 'Oto Yedek Parça');
                    const mfr = mapped.mfr !== -1 ? row[mapped.mfr] : 'OEM';
                    const price = mapped.p !== -1 ? parseFloat(row[mapped.p]?.toString().replace(/[^0-9,.]/g, '').replace(',', '.')) || 1000 : 1000;
                    const stock = mapped.stock !== -1 ? parseInt(row[mapped.stock]) || 50 : 50;
                    const oem = mapped.oem !== -1 ? row[mapped.oem] : '';
                    const vehicle = mapped.vehicle !== -1 ? row[mapped.vehicle] : '';

                    if (no && name) {
                        products.push({
                            id: Date.now() + Math.random(),
                            no: no.trim(),
                            n: name.trim(),
                            mfr: mfr.trim(),
                            p: price,
                            stock: stock,
                            oem: oem ? oem.trim() : '',
                            vehicle: vehicle ? vehicle.trim() : 'GENEL UYUMLU',
                            category: 'Fren Servoları',
                            img: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=300&auto=format&fit=crop&q=80'
                        });
                        addedCount++;
                    }
                }

                res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({ success: true, message: addedCount + ' adet ürün başarıyla içe aktarıldı!' }));
            } catch (err) {
                res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({ success: false, error: err.message }));
            }
        });
    } 
    else {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(EMBEDDED_HTML);
    }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log('frenservosu.com sunucusu ' + PORT + ' portunda çalışıyor...');
});