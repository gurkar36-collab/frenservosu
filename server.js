/**
 * frenservosu.com - Kararlı İlk Temel Sürüm
 */
const http = require('http');

let products = [
  { id: 1, no: "KP-8041", n: "Fren Servosu 8\" Tek Diyaframlı", mfr: "TRW", p: 3450, stock: 150, category: "Fren Servoları", img: "", oem: "70093032", vehicle: "RENAULT MEGANE 2" },
  { id: 2, no: "KP-1000", n: "Fren Servosu 10\" Çift Diyaframlı", mfr: "TRW", p: 4200, stock: 120, category: "Fren Servoları", img: "", oem: "70093034", vehicle: "RENAULT CLIO" },
  { id: 3, no: "KP-AN", n: "Fren Servosu Ana Merkezi Dahili", mfr: "BOSCH", p: 5100, stock: 85, category: "Ana Merkez", img: "", oem: "02041257", vehicle: "FIAT DUCATO" },
  { id: 4, no: "BSCH-280", n: "Westinghouse Fren Servosu 280mm", mfr: "BOSCH", p: 26000, stock: 40, category: "Disk Balata", img: "", oem: "02041258", vehicle: "FORD TRANSIT" }
];

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
        .search-group input { flex: 1; padding: 10px; border: 1px solid var(--border); border-radius: 4px; }
        .btn { background: var(--primary); color: #fff; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; font-weight: bold; }
        .btn:hover { background: #bf360c; }
        .container { max-width: 1300px; margin: 30px auto; padding: 0 20px; }
        .section-title { font-size: 22px; margin-bottom: 20px; border-bottom: 2px solid var(--primary); padding-bottom: 5px; display: inline-block; }
        .products-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 20px; }
        .product-card { background: #fff; border: 1px solid var(--border); border-radius: 8px; padding: 15px; display: flex; flex-direction: column; justify-content: space-between; }
        .product-details h4 { font-size: 15px; margin-bottom: 5px; color: var(--dark); }
        .part-no { font-size: 12px; color: #666; margin-bottom: 8px; }
        .price { font-size: 18px; font-weight: bold; color: var(--primary); margin-bottom: 10px; }
    </style>
</head>
<body>
    <header>
        <a href="/" class="logo-area">⚡ frenservosu.com <span style="font-size:12px; font-weight:normal; color:#666;">powered by xparca.com</span></a>
        <nav>
            <ul>
                <li><a href="#">KATEGORİLER</a></li>
                <li><a href="#">MARKALAR</a></li>
                <li><a href="#">İLETİŞİM</a></li>
                <li><a href="#sepet">SEPETİM (<span id="cart-count">0</span>)</a></li>
            </ul>
        </nav>
    </header>

    <section class="hero">
        <div>
            <h1 style="font-size: 32px; margin-bottom: 10px;">Orijinal ve Muadil Fren Sistemleri</h1>
            <p style="color: #bbb;">TRW, ATE, Bosch ve Pierburg güvencesiyle.</p>
        </div>
        <div class="hero-search">
            <h3>Parça Ara</h3>
            <div class="search-group">
                <input type="text" id="search-input" placeholder="Parça adı veya numarası...">
                <button class="btn" onclick="searchProducts()">ARA</button>
            </div>
        </div>
    </section>

    <div class="container">
        <h2 class="section-title">Ürün Kataloğu</h2>
        <div class="products-grid" id="product-list"></div>
    </div>

    <script>
        let productsData = [];

        async function fetchProducts() {
            const res = await fetch('/api/products');
            productsData = await res.json();
            renderProducts(productsData);
        }

        function renderProducts(items) {
            const grid = document.getElementById('product-list');
            grid.innerHTML = '';
            items.forEach(p => {
                grid.innerHTML += \`
                    <div class="product-card">
                        <div class="product-details">
                            <h4>\${p.n}</h4>
                            <p class="part-no">Parça No: \${p.no}</p>
                            <p class="price">₺\${p.p}</p>
                        </div>
                        <button class="btn" style="width:100%; padding:8px;" onclick="alert('Sepete eklendi!')">Sepete Ekle</button>
                    </div>
                \`;
            });
        }

        function searchProducts() {
            const query = document.getElementById('search-input').value.toLowerCase();
            const filtered = productsData.filter(p => p.n.toLowerCase().includes(query) || p.no.toLowerCase().includes(query));
            renderProducts(filtered);
        }

        fetchProducts();
    </script>
</body>
</html>`;

const server = http.createServer((req, res) => {
    if (req.method === 'GET' && req.url === '/api/products') {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(products));
    } else {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(EMBEDDED_HTML);
    }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log('Sunucu çalışıyor...');
});
