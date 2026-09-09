# SOCIALTOOL.STORE — E-commerce Platform

Монгол хэл дээрх MMO tools / дижитал хэрэгсэл худалдаалах цогц e-commerce платформ.

## ✨ Боломжууд

### 🛒 E-commerce
- Бүтээгдэхүүний жагсаалт, ангилал, хайлт, эрэмбэлэлт
- Сагс (cart) дотоод хадгалалттай (localStorage)
- Бүтээгдэхүүний дэлгэрэнгүй хуудас (зураг gallery, YouTube заавар видео, хугацаа badge)
- Checkout — нэр, утас, и-мэйл, Telegram хаяг
- Хэрэглэгчийн бүртгэл + нэвтрэлт (JWT cookie, 30 хоног)
- Миний захиалга / Төлбөрүүд / Профайл account area

### 💳 Wire.mn төлбөрийн интеграц (бодит API)
- **PaymentIntent** үүсгэх (`POST /v1/payment_intents`, Idempotency-Key)
- **Hosted checkout session** үүсгэх → pay.wire.mn URL руу шилжүүлэх
- **Webhook** баталгаажуулалт (HMAC-SHA256 signature шалгадаг)
- **Status polling fallback** — webhook-гүйгээр ч сервер талдаа баталгаажуулдаг
- Төлбөрийн төлөв: Шинэ → Төлбөр хүлээгдэж байна → Төлбөр төлөгдсөн → Хүргэгдсэн / Цуцлагдсан

### 💬 Telegram admin notification
- Шинэ захиалга үүсгэх бүрд admin chat руу мэдэгдэл
- Төлбөр баталгаажсан үед мэдэгдэл
- Шинэ чатын мессеж ирэх бүрд мэдэгдэл

### 🛠 Admin dashboard (`/admin`)
- **Тойм** — өнөөдрийн захиалга, орлого, хүлээгдэж буй, төлөгдсөн
- **Захиалга** — жагсаалт, дэлгэрэнгүй, төлбөрийн төлөв өөрчлөх, хүргэгдсэн гэж тэмдэглэх
- **Бүтээгдэхүүн** — full CRUD, **зураг upload хийх боломжтой**
- **Ангилал** — CRUD
- **Хямдрал** — зарлах, идэвхжүүлэх/унтраах, огнооны интервал
- **Сэтгэгдэл** — CRUD
- **Асуулт (FAQ)** — CRUD
- **Хэрэглэгчид** — бүртгэлтэй хэрэглэгчдийн жагсаалт
- **Чат** — хэрэглэгчтэй шууд чатлах
- **Тохиргоо** — Hero/Promo/Contact/Footer бичвэрүүдийг засах

### 📡 Live chat
- Хэрэглэгч "Админтай холбогдох" товч → шууд чат
- socket.io mini-service (port 3003) + HTTP polling fallback
- Telegram-аар шууд холбогдох товч

## 🚀 Суулгах

### Шаардлагууд
- Node.js 20+ эсвэл Bun 1.0+
- SQLite (file-based, нэмэлт сервер шаардлагагүй)

### Алхамууд

```bash
# 1. Хамааруулгууд суулгах
bun install

# 2. Mini-service хамааруулгууд
cd mini-services/chat-service && bun install && cd ../..

# 3. .env файл үүсгэх
cp .env.example .env
# .env-ийг нээж бодит credentials-аа оруулна уу

# 4. Database үүсгэх
bun run db:push      # schema-г SQLite-д оруулна
bun run prisma/seed.ts  # sample өгөгдөл (8 ангилал, 15 бүтээгдэхүүн, 6 сэтгэгдэл)

# 5. Dev сервер ажиллуулах
bun run dev          # http://localhost:3000

# 6. Chat service (тусдаа terminal)
cd mini-services/chat-service && bun run dev
```

### Admin нэвтрэх (default)
- URL: `/admin`
- Username: `admin` (`.env`-ийн `ADMIN_USERNAME`)
- Password: `admin123` (`.env`-ийн `ADMIN_PASSWORD`) — **заавал өөрчилнө үү**

### Demo хэрэглэгч
- Email: `test@example.com`
- Password: `test123`

## 📁 Бүтэц

```
.
├── prisma/
│   ├── schema.prisma          # Database schema (Category, Product, Order, Payment, Customer, Faq, SiteSetting, Promotion, Review, ChatSession, ChatMessage, AdminUser)
│   └── seed.ts                # Sample өгөгдөл
├── src/
│   ├── app/
│   │   ├── page.tsx           # Нүүр хуудас (Hero, Categories, Products, Promo, Reviews, FAQ, Footer)
│   │   ├── admin/             # Admin dashboard
│   │   ├── api/               # REST API routes
│   │   │   ├── products/      # Public product endpoints
│   │   │   ├── orders/        # Order creation
│   │   │   ├── auth/          # Customer auth (register/login/me/logout)
│   │   │   ├── customer/      # Customer profile + orders
│   │   │   ├── chat/          # Live chat sessions + messages
│   │   │   ├── payment/wire/  # Wire.mn create/callback/status
│   │   │   └── admin/         # Admin CRUD (products/categories/orders/reviews/faqs/promotions/customers/settings)
│   │   └── globals.css        # Brand styling (white + electric blue)
│   ├── components/
│   │   ├── site/              # Public UI (Header, Hero, Products, Cart, Checkout, LiveChat, AuthModal, AccountModal)
│   │   ├── admin/             # Admin UI (Overview, Orders, Products, Categories, Reviews, Faqs, Promotions, Customers, Settings, Chat)
│   │   └── ui/                # shadcn/ui components
│   ├── lib/
│   │   ├── auth.ts            # JWT auth (admin + customer)
│   │   ├── wire.ts            # Wire.mn API integration
│   │   ├── telegram.ts        # Telegram Bot API
│   │   ├── media.ts           # YouTube + image helpers
│   │   ├── format.ts          # ₮ currency, order number, status labels
│   │   └── db.ts              # Prisma client
│   ├── store/cart.ts          # Zustand cart + UI state
│   └── hooks/use-customer.ts  # Customer auth hook
├── mini-services/
│   └── chat-service/          # socket.io real-time chat (port 3003)
├── public/uploads/products/   # Uploaded product images (auto-created)
└── .env                       # Credentials (өөрийнхөө үүсгэнэ)
```

## 🔌 Wire.mn холболт

1. **Wire.mn dashboard** дотроо:
   - Account баталгаажуулна (утас + ДАН)
   - Project үүсгэнэ
   - Connector (оператор) идэвхжүүлнэ
   - Settlement account холбоно
   - API key (sk_live_...) авна
   - **Webhook endpoint бүртгэнэ**: `https://your-domain.com/api/payment/wire/callback`
     - Events: `payment_intent.succeeded`, `payment_intent.failed`
     - Signing secret (`whsec_...`)-ийг `.env`-ийн `WIRE_MN_WEBHOOK_SECRET` болгоно

2. **`.env`** файлд:
   ```
   WIRE_MN_API_KEY=sk_live_...
   WIRE_MN_WEBHOOK_SECRET=whsec_...
   WIRE_MN_DEMO_MODE=false
   ```

3. **Status polling fallback**: webhook тохируулаагүй байсан ч `/api/payment/wire/status` нь Wire.mn API-аас шууд төлбөрийн төлөв татан баталгаажуулдаг (дотоод polling 3-сек тутамд).

## 💬 Telegram bot холболт

1. Telegram дотроо `@BotFather` → `/newbot` → token авна
2. `@userinfobot` руу мэссеж бичээд өөрийн chat ID-ийг авна
3. `.env`-д:
   ```
   TELEGRAM_BOT_TOKEN=1234567890:AA...
   TELEGRAM_ADMIN_CHAT_ID=5485090683
   ```
4. Бот chat-дээ `/start` бичсэнээр message хүлээж авах эрх нээгдэнэ

## 🌐 Domain холболт (Cloudflare)

1. Cloudflare dashboard → Add Site → домайн оруулна
2. DNS A record: `@` → сервер IP (эсвэл CNAME → хостинг provider)
3. Nameserver-ийг Cloudflare рүү шилжүүлнэ
4. SSL/TLS → Full (strict)
5. Wire.mn webhook URL-г `https://your-domain.com/api/payment/wire/callback` болгож шинэчилнэ

## 🎨 Brand

- Primary: `#1677FF` (electric blue)
- Deep: `#0B4DBA`
- Pale background: `#F5F9FF`
- White cards, soft shadows, glass effects
- Mongolian language throughout

## 📜 Scripts

```bash
bun run dev          # Dev server (port 3000)
bun run lint         # ESLint
bun run db:push      # Schema → database
bun run db:generate  # Prisma client generate
bun run db:migrate   # Migrations
bun run db:reset     # Database reset
bun run prisma/seed.ts  # Seed sample data
```

## 🔐 Аюулгүй байдал

- Бүх credentials `.env`-д хадгалагдана — frontend руу илгээгдэхгүй
- Admin auth: bcrypt + JWT (7 хоног)
- Customer auth: bcrypt + JWT cookie (30 хоног)
- Webhook signature: HMAC-SHA256 constant-time compare
- Wire.mn төлбөр **зөвхөн сервер талд** баталгаажна (frontend redirect-д итгэдэггүй)
- Admin API route бүр JWT-ээр хамгаалагдсан
- File upload: admin JWT + MIME type + size limit (5MB)

## 📦 Production deploy

### VPS дээр
```bash
bun install --production
bun run build       # Next.js standalone build
bun run start       # Production server
```

### Docker
- Multi-stage Dockerfile бэлдэх (Node 20-alpine base + Bun)
- Volume: `./db` (SQLite) + `./public/uploads` (images)

### Process manager
- PM2 эсвэл systemd ашиглан dev сервер болон chat service-ийг persistent болгоно

---

© 2026 SOCIALTOOL.STORE. Бүх эрх хуулиар хамгаалагдсан.
