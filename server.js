/**
 * frenservosu.com - Unified Server & Frontend Bundle
 * Güncellenmiş Sürüm: Akıllı Sütun Eşleştirme, Görsel Desteği, Toplu Silme ve Araç Detayları
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

// Bellek İçi Ürün ve Ayar Veritabanı Yapısı
let products = [
  { id: 1, no: "KP-8041", n: "Fren Servosu 8\" Tek Diyaframlı", mfr: "TRW", p: 3450, stock: 150, category: "Fren Servoları", img: "", oem: "70093032", vehicle: "RENAULT MEGANE 2" },
  { id: 2, no: "KP-1000", n: "Fren Servosu 10\" Çift Diyaframlı", mfr: "TRW", p: 4200, stock: 120, category: "Fren Servoları", img: "", oem: "70093034", vehicle: "RENAULT CLIO" },
  { id: 3, no: "KP-AN", n: "Fren Servosu Ana Merkezi Dahili", mfr: "BOSCH", p: 5100, stock: 85, category: "Fren Servoları", img: "", oem: "02041257", vehicle: "FIAT DUCATO" },
  { id: 4, no: "BSCH-280", n: "Westinghouse Fren Servosu 280mm", mfr: "BOSCH", p: 26000, stock: 40, category: "Fren Servoları", img: "", oem: "02041258", vehicle: "FORD TRANSIT" }
];

// Otomatik Sütun Tanıma Havuzu (Akıllı Yükleme İçin)
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
        :root { --primary: #e65100; --dark: #1a1a1a; --light: #f5f5f5; --border: #ddd; }
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
        body { background-color: var(--light); color: var(--dark); line-height: 1.6; }
        header { background: #fff; border-bottom: 1px solid var(--border); padding: 15px 5%; display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; z-index: 1000; }
        .logo-area { font-size: 24px; font-weight: bold; color: var(--primary); text-decoration: none; display: flex; align-items: center; gap: 10px; }
        nav ul { display: flex; list-style: none; gap: 20px; align-items: center; }
        nav ul li a { text-decoration: none; color: var(--dark); font-weight: 500; font-size: 14px; }
        nav ul li a:hover { color: var(--primary); }
        .hero { background: linear-gradient(135deg, #1a1a1a 0%, #333 100%); color: #fff; padding: 40px 5%; display: flex; justify-content: space-between; align-items: center; }
        .hero-search { background: #fff; padding: 20px; border-radius: 8px; width: 45%; color: var(--dark); box-shadow: 0 4px 15px rgba(0,0,0,0.3); }
        .hero-search h3 { margin-bottom: 15px; font-size: 18px; color: var(--dark); }
        .search-group { display: flex; gap: 10px; margin-bottom: 10px; }
        .search-group input, .search-group select { flex: 1; padding: 10px; border: 1px solid var(--border); border-radius: 4px; }
        .btn { background: var(--primary); color: #fff; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; font-weight: bold; }
        .btn:hover { background: #bf360c; }
        .container { max-width: 1300px; margin: 30px auto; padding: 0 20px; }
        .section-title { font-size: 22px; margin-bottom: 20px; border-bottom: 2px solid var(--primary); padding-bottom: 5px; display: inline-block; }
        .products-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 20px; }
        .product-card { background: #fff; border: 1px solid var(--border); border-radius: 8px; padding: 15px; display: flex; flex-direction: column; justify-content: space-between; transition: 0.2s; position: relative; }
        .product-card:hover { box-shadow: 0 5px 15px rgba(0,0,0,0.1); }
        .product-img-container { width: 100%; height: 160px; background: #fafafa; display: flex; align-items: center; justify-content: center; margin-bottom: 10px; border-radius: 4px; overflow: hidden; }
        .product-main-img { max-width: 100%; max-height: 100%; object-fit: contain; }
        .product-details h4 { font-size: 15px; margin-bottom: 5px; color: var(--dark); }
        .part-no { font-size: 12px; color: #666; margin-bottom: 8px; }
        .price { font-size: 18px; font-weight: bold; color: var(--primary); margin-bottom: 10px; }
        .admin-panel { background: #fff; padding: 30px; border-radius: 8px; margin-top: 40px; border: 1px solid var(--border); }
        .admin-table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        .admin-table th, .admin-table td { border: 1px solid var(--border); padding: 10px; text-align: left; font-size: 14px; }
        .admin-table th { background: #f0f0f0; }
        .flex-between { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        textarea.smart-input { width: 100%; height: 120px; padding: 10px; border: 1px solid var(--border); border-radius: 4px; margin-bottom: 10px; font-family: monospace; }
    </style>
</head>
<body>
    <header>
        <a href="/" class="logo-area">⚡ frenservosu.com <span style="font-size:12px; font-weight:normal; color:#666;">powered by xparca.com</span></a>
        <nav>
            <ul>
                <li><a href="#kategoriler">KATEGORİLER</a></li>
                <li><a href="#markalar">MARKALAR</a></li>
                <li><a href="#admin">YÖNETİM PANELİ</a></li>
                <li><a href="#sepet">SEPETİM (<span id="cart-count">0</span>)</a></li>
            </ul>
        </nav>
    </header>

    <section class="hero">
        <div>
            <h1 style="font-size: 32px; margin-bottom: 10px;">%100 Şasi Uyumlu Orijinal ve Muadil Fren Sistemleri</h1>
            <p style="color: #bbb;">TRW, ATE, Bosch ve Pierburg yetkili dağıtım ağı güvencesiyle.</p>
        </div>
        <div class="hero-search">
            <h3>Şasi No veya Parça Ara</h3>
            <div class="search-group">
                <input type="text" id="search-input" placeholder="Şasi No (17 hane) veya Parça No...">
                <button class="btn" onclick="searchProducts()">ARA</button>
            </div>
        </div>
    </section>

    <div class="container">
        <h2 class="section-title">Öne Çıkan Fren Ürünleri ve Çözümleri</h2>
        <div class="products-grid" id="product-list">
            <!-- Dinamik Ürün Kartları Buraya Gelecek -->
        </div>

        <!-- Yönetim Paneli Bölümü -->
        <div class="admin-panel" id="admin">
            <div class="flex-between">
                <h2>Yönetim ve Akıllı Toplu Yükleme Paneli</h2>
                <div>
                    <button class="btn" style="background:#d32f2f;" onclick="deleteSelectedProducts()">Seçilenleri Sil</button>
                </div>
            </div>
            
            <div style="margin-bottom: 25px; background: #fafafa; padding: 20px; border-radius: 6px; border:1px solid var(--border);">
                <h3>Akıllı Excel / Toplu Veri Yükleme</h3>
                <p style="font-size: 13px; color: #666; margin-bottom: 10px;">Excel listesini kopyalayıp aşağıdaki alana yapıştırın. Sütunlar otomatik olarak tanınacaktır.</p>
                <textarea class="smart-input" id="bulk-data-input" placeholder="Stok Kodu \t Ürün Adı \t Marka \t Fiyat \t Stok \t OEM \t Araç Uyumluluk"></textarea>
                <button class="btn" onclick="processBulkUpload()">Verileri Otomatik Eşle ve Yükle</button>
            </div>

            <h3>Mevcut Ürün Kataloğu</h3>
            <table class="admin-table">
                <thead>
                    <tr>
                        <th style="width: 40px;"><input type="checkbox" id="select-all" onclick="toggleSelectAll(this)"></th>
                        <th>Görsel</th>
                        <th>Parça No</th>
                        <th>Ürün Adı</th>
                        <th>Üretici Marka</th>
                        <th>Fiyat (₺)</th>
                        <th>Stok</th>
                        <th>Uyumlu Araç</th>
                        <th>İşlem</th>
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
            const res = await fetch('/api/products');
            productsData = await res.json();
            renderProducts(productsData);
            renderAdminTable(productsData);
            document.getElementById('cart-count').innerText = "0";
        }

        function renderProducts(items) {
            const grid = document.getElementById('product-list');
            grid.innerHTML = '';
            items.forEach(p => {
                const imgUrl = p.img && p.img.trim() !== '' ? p.img : 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=300&auto=format&fit=crop&q=80';
                grid.innerHTML += \`
                    <div class="product-card">
                        <div>
                            <div class="product-img-container">
                                <img src="\${imgUrl}" alt="\${p.n}" class="product-main-img" loading="lazy" />
                            </div>
                            <span style="font-size:11px; background:#eee; padding:2px 6px; border-radius:4px; font-weight:bold;">\${p.mfr || 'OEM'}</span>
                            <h4>\${p.n}</h4>
                            <p class="part-no">Parça No: \${p.no} | OEM: \${p.oem || '-'}</p>
                            <p style="font-size:12px; color:#444; margin-bottom:8px;">Uyum: \${p.vehicle || 'Genel Uyumlu'}</p>
                        </div>
                        <div>
                            <div class="price">₺\${Number(p.p).toLocaleString('tr-TR')}</div>
                            <button class="btn" style="width:100%; padding:8px;" onclick="addToCart('\${p.no}')">Sepete Ekle</button>
                        </div>
                    </div>
                \`;
            });
        }

        function renderAdminTable(items) {
            const tbody = document.getElementById('admin-product-table');
            tbody.innerHTML = '';
            items.forEach(p => {
                const imgUrl = p.img && p.img.trim() !== '' ? p.img : 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=100&auto=format&fit=crop&q=80';
                tbody.innerHTML += \`
                    <tr>
                        <td><input type="checkbox" class="product-checkbox" value="\${p.id}"></td>
                        <td><img src="\${imgUrl}" style="width:40px; height:40px; object-fit:contain;"></td>
                        <td>\${p.no}</td>
                        <td>\${p.n}</td>
                        <td>\${p.mfr}</td>
                        <td>₺\${p.p}</td>
                        <td>\${p.stock}</td>
                        <td>\${p.vehicle || '-'}</td>
                        <td><button class="btn" style="background:#d32f2f; padding:4px 8px; font-size:12px;" onclick="deleteProduct(\${p.id})">Sil</button></td>
                    5</tr>
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
    const urlObj = new URL(req.url, 'http://' + req.headers.host);
    
    if (req.method === 'GET' && urlObj.pathname === '/api/products') {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(products));
    } 
    else if (req.method === 'DELETE' && urlObj.pathname.startsWith('/api/admin/product/')) {
        const id = Number(urlObj.pathname.split('/').pop());
        products = products.filter(p => p.id !== id);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: true }));
    }
    else if (req.method === 'POST' && urlObj.pathname === '/api/admin/products/delete-batch') {
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
    else if (req.method === 'POST' && urlObj.pathname === '/api/admin/bulk-upload') {
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

                // İlk satırı başlık olarak al ve akıllı eşle
                const headerRow = rows[0];
                const mapped = autoMatchColumns(headerRow);
                let addedCount = 0;

                // Başlık satırını atlayarak verileri işle
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
                            img: ''
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