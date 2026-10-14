"use strict";

const http = require("http"), fs = require("fs"), path = require("path"), crypto = require("crypto");
const PORT = +process.env.PORT || 3000;
const ADMIN_PASS = process.env.ADMIN_PASSWORD || "admin123";
const DB_FILE = process.env.DB_FILE || path.join(__dirname, "data", "db.json");

// Veritabanı ve klasör hazırlığı
if (!fs.existsSync(path.dirname(DB_FILE))) {
    fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
}
if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ products: [], orders: [], settings: {}, users: [], categories: ["servo", "pompalar", "tamir-kitleri", "diger"], vehicles: {} }, null, 2));
}

function readDB() {
    try { return JSON.parse(fs.readFileSync(DB_FILE, "utf8")); } catch (e) { return { products: [], orders: [], settings: {}, users: [], categories: [], vehicles: {} }; }
}

function writeDB(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf8");
}

const server = http.createServer((req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = url.pathname;

    // CORS ve temel headerlar
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        res.writeHead(204);
        res.end();
        return;
    }

    // API: Ürünleri Listele
    if (pathname === "/api/products" && req.method === "GET") {
        const db = readDB();
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify(db.products));
        return;
    }

    // API: Site Ayarları
    if (pathname === "/api/settings" && req.method === "GET") {
        const db = readDB();
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify(db.settings || {}));
        return;
    }

    // Ana Sayfa - Profesyonel E-Ticaret Arayüzü
    if (pathname === "/" || pathname === "/index.html") {
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end(`<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FrenServosu.com - Orijinal Fren Sistemleri ve Yedek Parça</title>
    <style>
        :root{--navy:#12306b;--org:#f08a1c;--bd:#d5dbe8;--bg:#f4f6fa;--tx:#1a2238}
        *{box-sizing:border-box}
        body{margin:0;background:var(--bg);color:var(--tx);font:15px/1.4 system-ui,sans-serif}
        header{background:var(--navy);color:#fff;padding:12px 24px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px}
        .logo{font-size:22px;font-weight:700;color:#fff;text-decoration:none;display:flex;align-items:center;gap:8px}
        .nav-links{display:flex;gap:20px;align-items:center;font-weight:500;font-size:14px}
        .nav-links a{color:#fff;text-decoration:none}
        .nav-links a:hover{color:var(--org)}
        main{max-width:1250px;margin:0 auto;padding:20px}
        .hero{background:linear-gradient(135deg, #12306b 0%, #1a365d 100%);color:#fff;border-radius:12px;padding:40px;margin-bottom:30px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:20px}
        .hero-left{max-width:550px}
        .hero-left h1{margin:0 0 15px;font-size:32px}
        .search-box{background:#fff;padding:15px;border-radius:8px;display:flex;gap:10px;box-shadow:0 4px 12px rgba(0,0,0,0.15)}
        .search-box input{flex:1;border:1px solid var(--bd);padding:10px;border-radius:6px;font-size:15px;outline:none}
        .btn{background:var(--org);color:#fff;border:none;padding:10px 20px;border-radius:6px;font-weight:600;cursor:pointer}
        .btn:hover{opacity:0.9}
        .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:20px}
        .card{background:#fff;border:1px solid var(--bd);border-radius:8px;padding:15px;display:flex;flex-direction:column;justify-content:space-between}
        .card h3{margin:10px 0 5px;font-size:16px}
        .price{color:var(--org);font-size:18px;font-weight:700;margin:10px 0}
    </style>
</head>
<body>
    <header>
        <a href="/" class="logo">FrenServosu.com</a>
        <div class="nav-links">
            <a href="/">Anasayfa</a>
            <a href="#kategoriler">Kategoriler</a>
            <a href="#iletisim">İletişim</a>
            <a href="/admin.html" style="color:var(--org)">Yönetim Paneli</a>
        </div>
    </header>
    <main>
        <section class="hero">
            <div class="hero-left">
                <h1>Şasi No ile Uyumlu Fren Sistemleri</h1>
                <p>TRW, ATE, Bosch ve Delphi orijinal yedek parça dağıtım ağı.</p>
                <div class="search-box">
                    <input type="text" id="searchInput" placeholder="17 haneli Şasi No veya Parça Numarası...">
                    <button class="btn" onclick="searchParts()">BUL</button>
                </div>
            </div>
        </section>
        <h2>Ürün Kataloğu ve Çözümler</h2>
        <div class="grid" id="productGrid">
            <!-- Ürünler dinamik yüklenecek -->
        </div>
    </main>
    <script>
        async function loadProducts() {
            try {
                const res = await fetch('/api/products');
                const products = await res.json();
                const grid = document.getElementById('productGrid');
                if(!products.length) {
                    grid.innerHTML = '<p>Henüz ürün eklenmemiş. Yönetim panelinden ürün ekleyebilirsiniz.</p>';
                    return;
                }
                grid.innerHTML = products.map(p => \`
                    <div class="card">
                        <div>
                            <h3>\${p.n}</h3>
                            <p style="font-size:13px;color:#666">Parça No: \${p.no} | Mfr: \${p.mfr || '-'}</p>
                        </div>
                        <div class="price">₺\${p.p}</div>
                        <button class="btn" onclick="alert('Sepete eklendi: \${p.n}')">Sepete Ekle</button>
                    </div>
                \`).join('');
            } catch(e) { console.error(e); }
        }
        loadProducts();
    </script>
</body>
</html>`);
        return;
    }

    // Yönetim Paneli Sayfası
    if (pathname === "/admin.html") {
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end(`<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <title>Yönetim - FrenServosu</title>
    <style>
        body{font-family:system-ui,sans-serif;background:#f4f6fa;margin:0;padding:40px}
        .box{background:#fff;max-width:400px;margin:0 auto;padding:25px;border-radius:8px;border:1px solid #d5dbe8}
        input{width:100%;padding:10px;margin:10px 0;border:1px solid #d5dbe8;border-radius:6px;box-sizing:border-box}
        button{background:#f08a1c;color:#fff;border:none;padding:10px;width:100%;border-radius:6px;font-weight:600;cursor:pointer}
    </style>
</head>
<body>
    <div class="box">
        <h2>Yönetici Girişi</h2>
        <p style="font-size:13px;color:#666">Şifre: admin123 (Veya .env ayarındaki şifre)</p>
        <input type="password" id="pass" placeholder="Şifre">
        <button onclick="login()">Giriş Yap</button>
    </div>
    <script>
        function login() {
