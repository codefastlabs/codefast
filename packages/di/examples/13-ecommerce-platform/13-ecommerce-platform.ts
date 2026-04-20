/**
 * Example 13 — Real-World E-Commerce Platform
 *
 * A full-scale, production-grade e-commerce backend demonstrating every
 * DI feature in a domain-rich context:
 *
 *   Domain Contexts (Bounded Contexts / DDD):
 *   ```text
 *   ├── Catalog       — products, categories, inventory, pricing rules
 *   ├── Cart          — shopping cart (scoped per request/session)
 *   ├── Orders        — order lifecycle, fulfillment, shipping
 *   ├── Payments      — multi-gateway (Stripe, PayPal, COD), retry logic
 *   ├── Users         — accounts, addresses, loyalty points
 *   ├── Notifications — email, SMS, push (multi-binding pipeline)
 *   ├── Search        — Elasticsearch adapter, facets, ranking
 *   └── Analytics     — event tracking, conversion funnel, A/B tests
 *   ```
 *
 *   Infrastructure:
 *   ```text
 *   ├── PostgreSQL     — main data store (async activation, pooled)
 *   ├── Redis          — session, cart, rate-limiting, pub/sub
 *   ├── S3             — media/images
 *   ├── Elasticsearch  — search index
 *   ├── Email (SES)    — transactional email
 *   └── SMS (Twilio)   — order status alerts
 *   ```
 *
 *   DI Features Exercised:
 *   ```text
 *   ✅ Module.create / Module.createAsync for every bounded context
 *   ✅ Async onActivation / onDeactivation for infrastructure lifecycle
 *   ✅ singleton / transient / scoped — correctly applied per service
 *   ✅ Multi-binding (resolveAll) for notification channels & payment gateways
 *   ✅ Named bindings for env-specific overrides (e.g. dev vs prod payment gateway)
 *   ✅ Tagged bindings for shipping carrier selection
 *   ✅ Child containers per HTTP request (scoped cart, user session)
 *   ✅ Optional injection for optional integrations (analytics, A/B testing)
 *   ✅ container.validate() scope-rule check before serving traffic
 *   ✅ container.initializeAsync() eager singleton warm-up
 *   ✅ await using for guaranteed graceful shutdown
 *   ✅ @injectable + @inject decorators throughout
 *   ✅ @postConstruct for cache warm-up
 *   ✅ @preDestroy for resource cleanup
 *   ✅ module.import() diamond-dedup (infra modules imported by many contexts)
 *   ✅ whenParentIs constraint for context-aware logger injection
 *   ✅ container.generateDependencyGraph() for architecture visualization
 *   ✅ resolveOptional for optional A/B test service
 *   ```
 *
 *   Scenario walkthrough (main()):
 *   ```text
 *   1.  Bootstrap infrastructure (DB, Redis, S3, ES) — async modules
 *   2.  Load all domain modules
 *   3.  Warm up singletons (catalog cache, pricing rules)
 *   4.  Validate scope rules — catch captive-dependency bugs before traffic
 *   5.  Simulate customer journey:
 *       a. Guest browses catalog, searches "running shoes"
 *       b. Guest registers / logs in
 *       c. Customer adds items to cart (per-request scoped container)
 *       d. Customer applies discount coupon
 *       e. Checkout: address selection, shipping quote, payment
 *       f. Payment processed via Stripe (primary) or PayPal (fallback)
 *       g. Order created → fulfillment workflow triggered
 *       h. Notification pipeline: email receipt + SMS update
 *       i. Loyalty points awarded
 *       j. Analytics event emitted
 *   6.  Graceful shutdown via await using — all connections closed in order
 *   ```
 */

import {
  Container,
  inject,
  injectable,
  Module,
  postConstruct,
  preDestroy,
  token,
} from "@codefast/di";

// ============================================================================
// ─── TOKENS ─────────────────────────────────────────────────────────────────
// ============================================================================

// Infrastructure
const AppConfigToken = token<AppConfig>("AppConfig");
const DatabaseToken = token<Database>("Database");
const RedisToken = token<RedisClient>("RedisClient");
const S3Token = token<S3Client>("S3Client");
const ElasticToken = token<ElasticClient>("ElasticClient");
const LoggerToken = token<Logger>("Logger");
const EventBusToken = token<EventBus>("EventBus");
const IdGeneratorToken = token<IdGenerator>("IdGenerator");

// Catalog
const ProductRepoToken = token<ProductRepository>("ProductRepository");
const CategoryRepoToken = token<CategoryRepository>("CategoryRepository");
const InventoryServiceToken = token<InventoryService>("InventoryService");
const PricingServiceToken = token<PricingService>("PricingService");
const CatalogServiceToken = token<CatalogService>("CatalogService");
const SearchServiceToken = token<SearchService>("SearchService");

// Cart
const CartRepoToken = token<CartRepository>("CartRepository");
const CartServiceToken = token<CartService>("CartService");
const CouponServiceToken = token<CouponService>("CouponService");

// Orders
const OrderRepoToken = token<OrderRepository>("OrderRepository");
const OrderServiceToken = token<OrderService>("OrderService");
const FulfillmentServiceToken = token<FulfillmentService>("FulfillmentService");
const ShippingCarrierToken = token<ShippingCarrier>("ShippingCarrier"); // multi-binding

// Payments
const PaymentGatewayToken = token<PaymentGateway>("PaymentGateway"); // multi-binding
const PaymentServiceToken = token<PaymentService>("PaymentService");

// Users
const UserRepoToken = token<UserRepository>("UserRepository");
const UserServiceToken = token<UserService>("UserService");
const AddressRepoToken = token<AddressRepository>("AddressRepository");
const LoyaltyServiceToken = token<LoyaltyService>("LoyaltyService");
const SessionToken = token<UserSession>("UserSession"); // scoped

// Notifications
const NotificationChannelToken = token<NotificationChannel>("NotificationChannel"); // multi-binding
const NotificationServiceToken = token<NotificationService>("NotificationService");

// Analytics
const AnalyticsServiceToken = token<AnalyticsService>("AnalyticsService"); // optional
const AbTestServiceToken = token<AbTestService>("AbTestService"); // optional
const CheckoutApplicationServiceToken = token<CheckoutApplicationService>(
  "CheckoutApplicationService",
);

// ============================================================================
// ─── DOMAIN TYPES ───────────────────────────────────────────────────────────
// ============================================================================

interface AppConfig {
  readonly env: "development" | "staging" | "production";
  readonly dbUrl: string;
  readonly redisUrl: string;
  readonly s3Bucket: string;
  readonly esUrl: string;
  readonly stripeKey: string;
  readonly paypalClientId: string;
  readonly jwtSecret: string;
  readonly sesRegion: string;
  readonly twilioSid: string;
  readonly defaultCurrency: string;
  readonly loyaltyPointsPerDollar: number;
}

interface Logger {
  info(msg: string, meta?: Record<string, unknown>): void;
  warn(msg: string, meta?: Record<string, unknown>): void;
  error(msg: string, err?: unknown, meta?: Record<string, unknown>): void;
  child(bindings: Record<string, unknown>): Logger;
}

// ---- Products ---------------------------------------------------------------

interface Product {
  id: string;
  sku: string;
  name: string;
  categoryId: string;
  basePrice: number; // cents
  currency: string;
  description: string;
  imageKeys: string[];
  attributes: Record<string, string>; // { color, size, brand, … }
  tags: string[];
  active: boolean;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
}

interface InventoryEntry {
  productId: string;
  warehouseId: string;
  quantity: number;
  reserved: number;
}

interface PriceResult {
  productId: string;
  originalPrice: number;
  finalPrice: number;
  discountPercent: number;
  appliedRules: string[];
}

// ---- Cart -------------------------------------------------------------------

interface CartItem {
  productId: string;
  sku: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface Cart {
  id: string;
  userId: string | null; // null = guest
  items: CartItem[];
  couponCode: string | null;
  discountAmount: number;
  subtotal: number;
  total: number;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}

interface CouponResult {
  valid: boolean;
  discountAmount: number;
  reason?: string;
}

// ---- Orders -----------------------------------------------------------------

type OrderStatus =
  | "pending_payment"
  | "payment_confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

interface OrderItem {
  productId: string;
  sku: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface ShippingAddress {
  fullName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
}

interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  status: OrderStatus;
  subtotal: number;
  shippingCost: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  currency: string;
  paymentId: string | null;
  trackingNumber: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface ShippingQuote {
  carrierId: string;
  carrierName: string;
  serviceLevel: string;
  estimatedDays: number;
  cost: number;
}

// ---- Payments ---------------------------------------------------------------

type PaymentStatus = "pending" | "authorized" | "captured" | "failed" | "refunded";

interface PaymentIntent {
  id: string;
  gateway: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  orderId: string;
  metadata: Record<string, unknown>;
}

// ---- Users ------------------------------------------------------------------

interface User {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  tier: "bronze" | "silver" | "gold" | "platinum";
  loyaltyPoints: number;
  createdAt: Date;
}

interface Address {
  id: string;
  userId: string;
  isDefault: boolean;
  fullName: string;
  addressLine1: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
}

interface UserSession {
  userId: string;
  email: string;
  tier: User["tier"];
  cartId: string | null;
  requestId: string;
}

// ---- Notifications ----------------------------------------------------------

interface NotificationPayload {
  userId: string;
  email?: string;
  phone?: string;
  template: string;
  data: Record<string, unknown>;
  priority: "high" | "normal" | "low";
}

interface NotificationResult {
  channel: string;
  success: boolean;
  messageId?: string;
  error?: string;
}

// ---- Analytics / A/B --------------------------------------------------------

interface TrackEvent {
  event: string;
  userId: string | null;
  properties: Record<string, unknown>;
  timestamp: Date;
}

interface AbVariant {
  experimentId: string;
  variant: "control" | "treatment_a" | "treatment_b";
}

// ============================================================================
// ─── INFRASTRUCTURE IMPLEMENTATIONS ─────────────────────────────────────────
// ============================================================================

// ---- Logger -----------------------------------------------------------------

class ConsoleLogger implements Logger {
  constructor(private readonly bindings: Record<string, unknown> = {}) {}

  info(msg: string, meta?: Record<string, unknown>): void {
    this.format("INFO", msg, meta);
  }

  warn(msg: string, meta?: Record<string, unknown>): void {
    this.format("WARN", msg, meta);
  }

  error(msg: string, _err?: unknown, meta?: Record<string, unknown>): void {
    this.format("ERROR", msg, meta);
  }

  child(bindings: Record<string, unknown>): Logger {
    return new ConsoleLogger({ ...this.bindings, ...bindings });
  }

  private format(level: string, msg: string, meta?: Record<string, unknown>): void {
    const line = {
      level,
      msg,
      ...this.bindings,
      ...(meta ?? {}),
      ts: new Date().toISOString(),
    };
    console.log(JSON.stringify(line));
  }
}

// ---- IdGenerator ------------------------------------------------------------

class UlidGenerator implements IdGenerator {
  private counter = 0;
  generate(prefix = ""): string {
    return `${prefix}${Date.now()}_${(++this.counter).toString().padStart(4, "0")}`;
  }
}

interface IdGenerator {
  generate(prefix?: string): string;
}

// ---- EventBus ---------------------------------------------------------------

type EventHandler<T = unknown> = (event: T) => void | Promise<void>;

interface EventBus {
  publish<T>(topic: string, event: T): Promise<void>;
  subscribe<T>(topic: string, handler: EventHandler<T>): void;
}

class InMemoryEventBus implements EventBus {
  private readonly handlers = new Map<string, EventHandler[]>();
  private readonly log: Logger;

  constructor(logger: Logger) {
    this.log = logger.child({ service: "EventBus" });
  }

  subscribe<T>(topic: string, handler: EventHandler<T>): void {
    if (!this.handlers.has(topic)) {
      this.handlers.set(topic, []);
    }
    this.handlers.get(topic)!.push(handler as EventHandler);
  }

  async publish<T>(topic: string, event: T): Promise<void> {
    const handlers = this.handlers.get(topic) ?? [];
    this.log.info("event published", { topic, handlerCount: handlers.length });
    await Promise.all(handlers.map((handler) => Promise.resolve(handler(event))));
  }
}

// ---- Database ---------------------------------------------------------------

interface Database {
  connect(): Promise<void>;
  query<T>(sql: string, params?: unknown[]): Promise<T[]>;
  execute(sql: string, params?: unknown[]): Promise<{ rowCount: number }>;
  transaction<T>(fn: (db: Database) => Promise<T>): Promise<T>;
  healthCheck(): Promise<boolean>;
  close(): Promise<void>;
}

class MockDatabase implements Database {
  private connected = false;
  private readonly log: Logger;
  private queryCount = 0;

  constructor(
    logger: Logger,
    private readonly url: string,
  ) {
    this.log = logger.child({ service: "Database" });
  }

  async connect(): Promise<void> {
    await delay(10);
    this.connected = true;
    this.log.info("connected", { url: this.url });
  }

  async close(): Promise<void> {
    await delay(5);
    this.connected = false;
    this.log.info("connection pool closed");
  }

  async query<T>(sql: string, params?: unknown[]): Promise<T[]> {
    this.ensureConnected();
    await delay(2);
    this.queryCount++;
    this.log.info("query", { sql: sql.substring(0, 60), paramCount: params?.length ?? 0 });
    return [] as T[];
  }

  async execute(sql: string, params?: unknown[]): Promise<{ rowCount: number }> {
    this.ensureConnected();
    await delay(2);
    this.log.info("execute", { sql: sql.substring(0, 60), paramCount: params?.length ?? 0 });
    return { rowCount: 1 };
  }

  async transaction<T>(fn: (db: Database) => Promise<T>): Promise<T> {
    this.log.info("BEGIN");
    try {
      const result = await fn(this);
      this.log.info("COMMIT");
      return result;
    } catch (err) {
      this.log.warn("ROLLBACK");
      throw err;
    }
  }

  async healthCheck(): Promise<boolean> {
    return this.connected;
  }

  private ensureConnected(): void {
    if (!this.connected) {
      throw new Error("Database not connected");
    }
  }
}

// ---- Redis ------------------------------------------------------------------

interface RedisClient {
  connect(): Promise<void>;
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<void>;
  healthCheck(): Promise<boolean>;
  quit(): Promise<void>;
}

class MockRedis implements RedisClient {
  private readonly store = new Map<string, { value: string; expiresAt?: number }>();
  private connected = false;
  private readonly log: Logger;

  constructor(logger: Logger) {
    this.log = logger.child({ service: "Redis" });
  }

  async connect(): Promise<void> {
    await delay(5);
    this.connected = true;
    this.log.info("connected");
  }

  async quit(): Promise<void> {
    await delay(2);
    this.connected = false;
    this.log.info("disconnected");
  }

  async get(key: string): Promise<string | null> {
    const entry = this.store.get(key);
    if (!entry) {
      return null;
    }
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    this.store.set(key, {
      value,
      expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined,
    });
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }

  async incr(key: string): Promise<number> {
    const current = Number(this.store.get(key)?.value ?? "0");
    const next = current + 1;
    await this.set(key, String(next));
    return next;
  }

  async expire(key: string, seconds: number): Promise<void> {
    const entry = this.store.get(key);
    if (entry) {
      this.store.set(key, { ...entry, expiresAt: Date.now() + seconds * 1000 });
    }
  }

  async healthCheck(): Promise<boolean> {
    return this.connected;
  }
}

// ---- S3 Client --------------------------------------------------------------

interface S3Client {
  getSignedUrl(key: string, expiresIn?: number): string;
  upload(key: string, data: Buffer): Promise<void>;
}

class MockS3 implements S3Client {
  constructor(private readonly bucket: string) {}
  getSignedUrl(key: string): string {
    return `https://cdn.example.com/${this.bucket}/${key}`;
  }
  async upload(key: string, _data: Buffer): Promise<void> {
    await delay(20);
    console.log(`  [S3] uploaded: ${key}`);
  }
}

// ---- Elasticsearch ----------------------------------------------------------

interface ElasticClient {
  index(idx: string, id: string, doc: unknown): Promise<void>;
  search<T>(idx: string, query: unknown): Promise<T[]>;
  healthCheck(): Promise<boolean>;
}

class MockElastic implements ElasticClient {
  private readonly indices = new Map<string, Map<string, unknown>>();
  private readonly log: Logger;

  constructor(logger: Logger) {
    this.log = logger.child({ service: "Elasticsearch" });
  }

  async index(idx: string, id: string, doc: unknown): Promise<void> {
    if (!this.indices.has(idx)) {
      this.indices.set(idx, new Map());
    }
    this.indices.get(idx)!.set(id, doc);
  }

  async search<T>(idx: string, query: unknown): Promise<T[]> {
    this.log.info("search", { index: idx, query });
    await delay(5);
    return [] as T[];
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }
}

// ============================================================================
// ─── CATALOG DOMAIN ─────────────────────────────────────────────────────────
// ============================================================================

interface ProductRepository {
  findById(id: string): Promise<Product | undefined>;
  findBySku(sku: string): Promise<Product | undefined>;
  findByCategory(categoryId: string, limit?: number): Promise<Product[]>;
  search(query: string, filters?: Partial<Product["attributes"]>): Promise<Product[]>;
  save(product: Product): Promise<Product>;
  listActive(limit?: number, offset?: number): Promise<Product[]>;
}

@injectable([inject(DatabaseToken), inject(LoggerToken)])
class PostgresProductRepository implements ProductRepository {
  private readonly log: Logger;

  constructor(
    private readonly db: Database,
    logger: Logger,
  ) {
    this.log = logger.child({ repo: "ProductRepository" });
  }

  async findById(id: string): Promise<Product | undefined> {
    const rows = await this.db.query<Product>(
      "SELECT * FROM products WHERE id = $1 AND active = true",
      [id],
    );
    return rows[0] ?? makeFakeProduct(id);
  }

  async findBySku(sku: string): Promise<Product | undefined> {
    const rows = await this.db.query<Product>("SELECT * FROM products WHERE sku = $1", [sku]);
    return rows[0] ?? makeFakeProduct(`prod-sku-${sku}`);
  }

  async findByCategory(categoryId: string, limit = 20): Promise<Product[]> {
    await this.db.query("SELECT * FROM products WHERE category_id=$1 LIMIT $2", [
      categoryId,
      limit,
    ]);
    return [makeFakeProduct("p1"), makeFakeProduct("p2")];
  }

  async search(query: string): Promise<Product[]> {
    this.log.info("db search", { query });
    await this.db.query("SELECT * FROM products WHERE to_tsvector(name) @@ plainto_tsquery($1)", [
      query,
    ]);
    return [makeFakeProduct("search-result-1"), makeFakeProduct("search-result-2")];
  }

  async save(product: Product): Promise<Product> {
    await this.db.execute(
      "INSERT INTO products(id, sku, name, base_price) VALUES ($1,$2,$3,$4) ON CONFLICT(id) DO UPDATE SET name=$3",
      [product.id, product.sku, product.name, product.basePrice],
    );
    return product;
  }

  async listActive(limit = 50, offset = 0): Promise<Product[]> {
    await this.db.query("SELECT * FROM products WHERE active=true LIMIT $1 OFFSET $2", [
      limit,
      offset,
    ]);
    return [
      makeFakeProduct("featured-1"),
      makeFakeProduct("featured-2"),
      makeFakeProduct("featured-3"),
    ];
  }
}

interface CategoryRepository {
  findById(id: string): Promise<Category | undefined>;
  findBySlug(slug: string): Promise<Category | undefined>;
  listAll(): Promise<Category[]>;
}

@injectable([inject(DatabaseToken)])
class PostgresCategoryRepository implements CategoryRepository {
  constructor(private readonly db: Database) {}

  async findById(id: string): Promise<Category | undefined> {
    await this.db.query("SELECT * FROM categories WHERE id=$1", [id]);
    return { id, name: "Running Shoes", slug: "running-shoes", parentId: "sports" };
  }

  async findBySlug(slug: string): Promise<Category | undefined> {
    await this.db.query("SELECT * FROM categories WHERE slug=$1", [slug]);
    return { id: "cat-001", name: slug, slug, parentId: null };
  }

  async listAll(): Promise<Category[]> {
    await this.db.query("SELECT * FROM categories ORDER BY name");
    return [
      { id: "cat-sports", name: "Sports", slug: "sports", parentId: null },
      { id: "cat-shoes", name: "Shoes", slug: "shoes", parentId: "cat-sports" },
    ];
  }
}

interface InventoryService {
  getAvailable(productId: string): Promise<number>;
  reserve(productId: string, quantity: number): Promise<boolean>;
  release(productId: string, quantity: number): Promise<void>;
  isInStock(productId: string, quantity?: number): Promise<boolean>;
}

@injectable([inject(DatabaseToken), inject(RedisToken), inject(LoggerToken)])
class InventoryServiceImpl implements InventoryService {
  private readonly log: Logger;

  constructor(
    private readonly db: Database,
    private readonly cache: RedisClient,
    logger: Logger,
  ) {
    this.log = logger.child({ service: "InventoryService" });
  }

  async getAvailable(productId: string): Promise<number> {
    const cached = await this.cache.get(`inv:${productId}`);
    if (cached) {
      return Number(cached);
    }
    await this.db.query<InventoryEntry>(
      "SELECT product_id, warehouse_id, quantity, reserved FROM inventory WHERE product_id=$1",
      [productId],
    );
    // Simulate stock spread across multiple warehouses, then derive availability.
    const inventoryEntries: InventoryEntry[] = [
      { productId, warehouseId: "wh-hcm", quantity: 20, reserved: 4 },
      { productId, warehouseId: "wh-hn", quantity: 18, reserved: 3 },
      { productId, warehouseId: "wh-dn", quantity: 12, reserved: 1 },
    ];
    const availableQuantity = inventoryEntries.reduce(
      (totalAvailable, entry) => totalAvailable + Math.max(0, entry.quantity - entry.reserved),
      0,
    );
    await this.cache.set(`inv:${productId}`, String(availableQuantity), 60);
    return availableQuantity;
  }

  async reserve(productId: string, quantity: number): Promise<boolean> {
    this.log.info("reserving inventory", { productId, quantity });
    await this.db.execute(
      "UPDATE inventory SET reserved=reserved+$1 WHERE product_id=$2 AND quantity-reserved>=$1",
      [quantity, productId],
    );
    await this.cache.del(`inv:${productId}`);
    return true;
  }

  async release(productId: string, quantity: number): Promise<void> {
    await this.db.execute("UPDATE inventory SET reserved=reserved-$1 WHERE product_id=$2", [
      quantity,
      productId,
    ]);
    await this.cache.del(`inv:${productId}`);
  }

  async isInStock(productId: string, quantity = 1): Promise<boolean> {
    return (await this.getAvailable(productId)) >= quantity;
  }
}

interface PricingService {
  getPrice(productId: string, userId?: string): Promise<PriceResult>;
  getBulkPrices(productIds: string[], userId?: string): Promise<Map<string, PriceResult>>;
  applyCoupon(cart: Cart, couponCode: string): Promise<CouponResult>;
}

@injectable([inject(DatabaseToken), inject(RedisToken), inject(LoggerToken)])
class PricingServiceImpl implements PricingService {
  private readonly log: Logger;

  constructor(
    private readonly db: Database,
    private readonly cache: RedisClient,
    logger: Logger,
  ) {
    this.log = logger.child({ service: "PricingService" });
  }

  @postConstruct()
  async warmUpPricingRules(): Promise<void> {
    this.log.info("warming up pricing rules cache...");
    await this.db.query("SELECT * FROM pricing_rules WHERE active=true");
    await this.cache.set("pricing:rules:loaded", "true", 3600);
    this.log.info("pricing rules cached");
  }

  @preDestroy()
  async flushPricingCache(): Promise<void> {
    this.log.info("flushing pricing cache");
    await this.cache.del("pricing:rules:loaded");
  }

  async getPrice(productId: string, userId?: string): Promise<PriceResult> {
    const cacheKey = `price:${productId}:${userId ?? "guest"}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return JSON.parse(cached) as PriceResult;
    }

    await this.db.query(
      "SELECT base_price, discount_rules FROM products LEFT JOIN pricing_rules ON ... WHERE product_id=$1",
      [productId],
    );

    // Simulate tiered pricing: gold/platinum users get 10% off
    const basePrice = 9999; // $99.99
    const userTierDiscount = userId ? 10 : 0;
    const finalPrice = Math.round(basePrice * (1 - userTierDiscount / 100));

    const result: PriceResult = {
      productId,
      originalPrice: basePrice,
      finalPrice,
      discountPercent: userTierDiscount,
      appliedRules: userTierDiscount ? ["LOYALTY_TIER_DISCOUNT"] : [],
    };
    await this.cache.set(cacheKey, JSON.stringify(result), 300);
    return result;
  }

  async getBulkPrices(productIds: string[], userId?: string): Promise<Map<string, PriceResult>> {
    const prices = new Map<string, PriceResult>();
    await Promise.all(
      productIds.map(async (id) => {
        prices.set(id, await this.getPrice(id, userId));
      }),
    );
    return prices;
  }

  async applyCoupon(cart: Cart, couponCode: string): Promise<CouponResult> {
    this.log.info("applying coupon", { couponCode, cartId: cart.id });
    await this.db.query(
      "SELECT * FROM coupons WHERE code=$1 AND active=true AND expires_at>NOW()",
      [couponCode],
    );

    // Simulate: WELCOME20 = 20% off, SAVE10 = $10 off
    if (couponCode === "WELCOME20") {
      return { valid: true, discountAmount: Math.round(cart.subtotal * 0.2) };
    }
    if (couponCode === "SAVE10") {
      return { valid: true, discountAmount: 1000 };
    }
    return { valid: false, discountAmount: 0, reason: "Coupon not found or expired" };
  }
}

interface CatalogService {
  getProduct(id: string): Promise<Product | undefined>;
  listFeatured(): Promise<Array<Product & { price: PriceResult }>>;
  getCategory(slug: string): Promise<Category | undefined>;
  listCategories(): Promise<Category[]>;
}

@injectable([
  inject(ProductRepoToken),
  inject(CategoryRepoToken),
  inject(PricingServiceToken),
  inject(InventoryServiceToken),
  inject(LoggerToken),
])
class CatalogServiceImpl implements CatalogService {
  private readonly log: Logger;

  constructor(
    private readonly products: ProductRepository,
    private readonly categories: CategoryRepository,
    private readonly pricing: PricingService,
    private readonly inventory: InventoryService,
    logger: Logger,
  ) {
    this.log = logger.child({ service: "CatalogService" });
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const product = await this.products.findById(id);
    if (product) {
      const inStock = await this.inventory.isInStock(id);
      this.log.info("product fetched", { id, inStock });
    }
    return product;
  }

  async listFeatured(): Promise<Array<Product & { price: PriceResult }>> {
    const featuredProducts = await this.products.listActive(6);
    const prices = await this.pricing.getBulkPrices(featuredProducts.map((product) => product.id));
    return featuredProducts.map((product) => ({ ...product, price: prices.get(product.id)! }));
  }

  async getCategory(slug: string): Promise<Category | undefined> {
    return this.categories.findBySlug(slug);
  }

  async listCategories(): Promise<Category[]> {
    return this.categories.listAll();
  }
}

interface SearchService {
  search(query: string, filters?: Record<string, string>): Promise<Product[]>;
  indexProduct(product: Product): Promise<void>;
}

@injectable([inject(ElasticToken), inject(ProductRepoToken), inject(LoggerToken)])
class ElasticSearchService implements SearchService {
  private readonly log: Logger;

  constructor(
    private readonly es: ElasticClient,
    private readonly products: ProductRepository,
    logger: Logger,
  ) {
    this.log = logger.child({ service: "SearchService" });
  }

  async search(query: string, filters?: Record<string, string>): Promise<Product[]> {
    this.log.info("searching products", { query, filters });
    const esQuery = {
      multi_match: { query, fields: ["name^3", "description", "tags"] },
      filter: filters ? Object.entries(filters).map(([k, v]) => ({ term: { [k]: v } })) : [],
    };
    const results = await this.es.search<{ id: string }>("products", esQuery);
    // Hydrate from DB for full data
    if (results.length === 0) {
      return this.products.search(query);
    }
    return Promise.all(results.map((r) => this.products.findById(r.id).then((p) => p!)));
  }

  async indexProduct(product: Product): Promise<void> {
    await this.es.index("products", product.id, {
      name: product.name,
      description: product.description,
      tags: product.tags,
      attributes: product.attributes,
      basePrice: product.basePrice,
      categoryId: product.categoryId,
    });
  }
}

// ============================================================================
// ─── CART DOMAIN ────────────────────────────────────────────────────────────
// ============================================================================

interface CartRepository {
  findById(id: string): Promise<Cart | undefined>;
  findByUserId(userId: string): Promise<Cart | undefined>;
  save(cart: Cart): Promise<Cart>;
  delete(id: string): Promise<void>;
}

@injectable([inject(RedisToken), inject(LoggerToken)])
class RedisCartRepository implements CartRepository {
  private readonly log: Logger;

  constructor(
    private readonly redis: RedisClient,
    logger: Logger,
  ) {
    this.log = logger.child({ repo: "CartRepository" });
  }

  async findById(id: string): Promise<Cart | undefined> {
    const data = await this.redis.get(`cart:${id}`);
    if (!data) {
      return undefined;
    }
    return JSON.parse(data) as Cart;
  }

  async findByUserId(userId: string): Promise<Cart | undefined> {
    const id = await this.redis.get(`cart:user:${userId}`);
    if (!id) {
      return undefined;
    }
    return this.findById(id);
  }

  async save(cart: Cart): Promise<Cart> {
    const updated = { ...cart, updatedAt: new Date() };
    await this.redis.set(`cart:${cart.id}`, JSON.stringify(updated), 86400); // 24h TTL
    if (cart.userId) {
      await this.redis.set(`cart:user:${cart.userId}`, cart.id, 86400);
    }
    this.log.info("cart saved", { cartId: cart.id, itemCount: cart.items.length });
    return updated;
  }

  async delete(id: string): Promise<void> {
    await this.redis.del(`cart:${id}`);
  }
}

interface CartService {
  getOrCreate(session: UserSession): Promise<Cart>;
  addItem(cartId: string, productId: string, quantity: number): Promise<Cart>;
  removeItem(cartId: string, productId: string): Promise<Cart>;
  updateQuantity(cartId: string, productId: string, quantity: number): Promise<Cart>;
  applyCoupon(cartId: string, couponCode: string): Promise<Cart>;
  checkout(cartId: string): Promise<Cart>;
  clear(cartId: string): Promise<void>;
}

@injectable([
  inject(CartRepoToken),
  inject(ProductRepoToken),
  inject(PricingServiceToken),
  inject(InventoryServiceToken),
  inject(CouponServiceToken),
  inject(LoggerToken),
  inject(IdGeneratorToken),
])
class CartServiceImpl implements CartService {
  private readonly log: Logger;

  constructor(
    private readonly cartRepo: CartRepository,
    private readonly productRepo: ProductRepository,
    private readonly pricing: PricingService,
    private readonly inventory: InventoryService,
    private readonly couponService: CouponService,
    logger: Logger,
    private readonly idGen: IdGenerator,
  ) {
    this.log = logger.child({ service: "CartService" });
  }

  async getOrCreate(session: UserSession): Promise<Cart> {
    if (session.cartId) {
      const existing = await this.cartRepo.findById(session.cartId);
      if (existing) {
        return existing;
      }
    }
    if (session.userId) {
      const userCart = await this.cartRepo.findByUserId(session.userId);
      if (userCart) {
        return userCart;
      }
    }
    const newCart: Cart = {
      id: this.idGen.generate("cart-"),
      userId: session.userId,
      items: [],
      couponCode: null,
      discountAmount: 0,
      subtotal: 0,
      total: 0,
      currency: "USD",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    return this.cartRepo.save(newCart);
  }

  async addItem(cartId: string, productId: string, quantity: number): Promise<Cart> {
    this.log.info("adding item to cart", { cartId, productId, quantity });
    const [cart, product] = await Promise.all([
      this.cartRepo.findById(cartId),
      this.productRepo.findById(productId),
    ]);
    if (!cart) {
      throw new Error(`Cart ${cartId} not found`);
    }
    if (!product) {
      throw new Error(`Product ${productId} not found`);
    }

    const inStock = await this.inventory.isInStock(productId, quantity);
    if (!inStock) {
      throw new Error(`Insufficient inventory for ${productId}`);
    }

    const priceResult = await this.pricing.getPrice(productId, cart.userId ?? undefined);
    const existing = cart.items.find((i) => i.productId === productId);

    let updatedItems: CartItem[];
    if (existing) {
      updatedItems = cart.items.map((item) =>
        item.productId === productId
          ? {
              ...item,
              quantity: item.quantity + quantity,
              totalPrice: (item.quantity + quantity) * priceResult.finalPrice,
            }
          : item,
      );
    } else {
      updatedItems = [
        ...cart.items,
        {
          productId,
          sku: product.sku,
          name: product.name,
          quantity,
          unitPrice: priceResult.finalPrice,
          totalPrice: quantity * priceResult.finalPrice,
        },
      ];
    }

    return this.cartRepo.save(this.recalculate({ ...cart, items: updatedItems }));
  }

  async removeItem(cartId: string, productId: string): Promise<Cart> {
    const cart = await this.cartRepo.findById(cartId);
    if (!cart) {
      throw new Error(`Cart ${cartId} not found`);
    }
    return this.cartRepo.save(
      this.recalculate({
        ...cart,
        items: cart.items.filter((i) => i.productId !== productId),
      }),
    );
  }

  async updateQuantity(cartId: string, productId: string, quantity: number): Promise<Cart> {
    const cart = await this.cartRepo.findById(cartId);
    if (!cart) {
      throw new Error(`Cart ${cartId} not found`);
    }
    if (quantity <= 0) {
      return this.removeItem(cartId, productId);
    }
    return this.cartRepo.save(
      this.recalculate({
        ...cart,
        items: cart.items.map((i) =>
          i.productId === productId ? { ...i, quantity, totalPrice: quantity * i.unitPrice } : i,
        ),
      }),
    );
  }

  async applyCoupon(cartId: string, couponCode: string): Promise<Cart> {
    const cart = await this.cartRepo.findById(cartId);
    if (!cart) {
      throw new Error(`Cart ${cartId} not found`);
    }
    const result = await this.couponService.validate(couponCode, cart);
    if (!result.valid) {
      throw new Error(result.reason ?? "Invalid coupon");
    }
    return this.cartRepo.save(
      this.recalculate({
        ...cart,
        couponCode,
        discountAmount: result.discountAmount,
      }),
    );
  }

  async checkout(cartId: string): Promise<Cart> {
    const cart = await this.cartRepo.findById(cartId);
    if (!cart) {
      throw new Error(`Cart ${cartId} not found`);
    }
    if (cart.items.length === 0) {
      throw new Error("Cart is empty");
    }
    // Reserve inventory for all items
    await Promise.all(
      cart.items.map((item) => this.inventory.reserve(item.productId, item.quantity)),
    );
    this.log.info("cart checked out, inventory reserved", { cartId, total: cart.total });
    return cart;
  }

  async clear(cartId: string): Promise<void> {
    await this.cartRepo.delete(cartId);
  }

  private recalculate(cart: Cart): Cart {
    const subtotal = cart.items.reduce((sum, i) => sum + i.totalPrice, 0);
    return { ...cart, subtotal, total: Math.max(0, subtotal - cart.discountAmount) };
  }
}

interface CouponService {
  validate(code: string, cart: Cart): Promise<CouponResult>;
}

@injectable([inject(PricingServiceToken)])
class CouponServiceImpl implements CouponService {
  constructor(private readonly pricing: PricingService) {}

  async validate(code: string, cart: Cart): Promise<CouponResult> {
    return this.pricing.applyCoupon(cart, code);
  }
}

// ============================================================================
// ─── ORDER DOMAIN ────────────────────────────────────────────────────────────
// ============================================================================

interface OrderRepository {
  findById(id: string): Promise<Order | undefined>;
  findByUserId(userId: string): Promise<Order[]>;
  save(order: Order): Promise<Order>;
  updateStatus(id: string, status: OrderStatus, meta?: Partial<Order>): Promise<Order>;
}

@injectable([inject(DatabaseToken), inject(LoggerToken)])
class PostgresOrderRepository implements OrderRepository {
  private readonly log: Logger;

  constructor(
    private readonly db: Database,
    logger: Logger,
  ) {
    this.log = logger.child({ repo: "OrderRepository" });
  }

  async findById(id: string): Promise<Order | undefined> {
    await this.db.query("SELECT * FROM orders WHERE id=$1", [id]);
    return makeFakeOrder(id);
  }

  async findByUserId(userId: string): Promise<Order[]> {
    await this.db.query("SELECT * FROM orders WHERE user_id=$1 ORDER BY created_at DESC", [userId]);
    return [makeFakeOrder("ord-001")];
  }

  async save(order: Order): Promise<Order> {
    await this.db.transaction(async (db) => {
      await db.execute(
        "INSERT INTO orders(id,user_id,status,total) VALUES($1,$2,$3,$4) ON CONFLICT(id) DO UPDATE SET status=$3",
        [order.id, order.userId, order.status, order.total],
      );
      await Promise.all(
        order.items.map((item) =>
          db.execute(
            "INSERT INTO order_items(order_id,product_id,quantity,unit_price) VALUES($1,$2,$3,$4)",
            [order.id, item.productId, item.quantity, item.unitPrice],
          ),
        ),
      );
    });
    this.log.info("order saved", { orderId: order.id, status: order.status, total: order.total });
    return order;
  }

  async updateStatus(id: string, status: OrderStatus, meta?: Partial<Order>): Promise<Order> {
    await this.db.execute(
      "UPDATE orders SET status=$1, tracking_number=$2, updated_at=NOW() WHERE id=$3",
      [status, meta?.trackingNumber ?? null, id],
    );
    this.log.info("order status updated", { orderId: id, status });
    return { ...makeFakeOrder(id), status, ...meta } as Order;
  }
}

interface ShippingCarrier {
  carrierId: string;
  carrierName: string;
  getQuote(address: ShippingAddress, items: OrderItem[]): Promise<ShippingQuote>;
  createShipment(orderId: string, address: ShippingAddress): Promise<string>; // trackingNumber
}

// Multi-binding: FedEx
class FedExCarrier implements ShippingCarrier {
  carrierId = "fedex";
  carrierName = "FedEx";

  async getQuote(address: ShippingAddress, items: OrderItem[]): Promise<ShippingQuote> {
    await delay(8);
    const weight = items.reduce((sum, i) => sum + i.quantity, 0);
    return {
      carrierId: this.carrierId,
      carrierName: this.carrierName,
      serviceLevel: "Ground",
      estimatedDays: 5,
      cost: 599 + weight * 50,
    };
  }

  async createShipment(orderId: string): Promise<string> {
    await delay(10);
    return `FEDEX-${orderId}-${Date.now()}`;
  }
}

// Multi-binding: UPS
class UpsCarrier implements ShippingCarrier {
  carrierId = "ups";
  carrierName = "UPS";

  async getQuote(address: ShippingAddress, items: OrderItem[]): Promise<ShippingQuote> {
    await delay(8);
    const weight = items.reduce((sum, i) => sum + i.quantity, 0);
    return {
      carrierId: this.carrierId,
      carrierName: this.carrierName,
      serviceLevel: "Ground",
      estimatedDays: 4,
      cost: 649 + weight * 45,
    };
  }

  async createShipment(orderId: string): Promise<string> {
    await delay(10);
    return `UPS-${orderId}-${Date.now()}`;
  }
}

// Multi-binding: DHL
class DhlCarrier implements ShippingCarrier {
  carrierId = "dhl";
  carrierName = "DHL Express";

  async getQuote(_address: ShippingAddress, _items: OrderItem[]): Promise<ShippingQuote> {
    await delay(8);
    return {
      carrierId: this.carrierId,
      carrierName: this.carrierName,
      serviceLevel: "Express",
      estimatedDays: 2,
      cost: 1499,
    };
  }

  async createShipment(orderId: string): Promise<string> {
    await delay(10);
    return `DHL-${orderId}-${Date.now()}`;
  }
}

interface FulfillmentService {
  fulfill(order: Order): Promise<Order>;
  getShippingQuotes(address: ShippingAddress, items: OrderItem[]): Promise<ShippingQuote[]>;
  shipOrder(orderId: string, carrierId: string, address: ShippingAddress): Promise<string>;
}

@injectable([inject(OrderRepoToken), inject(ShippingCarrierToken), inject(LoggerToken)])
class FulfillmentServiceImpl implements FulfillmentService {
  private readonly log: Logger;

  constructor(
    private readonly orderRepo: OrderRepository,
    private readonly carriers: ShippingCarrier[], // resolveAll — all registered carriers
    logger: Logger,
  ) {
    this.log = logger.child({ service: "FulfillmentService" });
  }

  async fulfill(order: Order): Promise<Order> {
    this.log.info("fulfilling order", { orderId: order.id });
    return this.orderRepo.updateStatus(order.id, "processing");
  }

  async getShippingQuotes(address: ShippingAddress, items: OrderItem[]): Promise<ShippingQuote[]> {
    const quotes = await Promise.all(this.carriers.map((c) => c.getQuote(address, items)));
    return quotes.sort((a, b) => a.cost - b.cost);
  }

  async shipOrder(orderId: string, carrierId: string, address: ShippingAddress): Promise<string> {
    const carrier = this.carriers.find((c) => c.carrierId === carrierId);
    if (!carrier) {
      throw new Error(`Unknown carrier: ${carrierId}`);
    }
    const tracking = await carrier.createShipment(orderId, address);
    await this.orderRepo.updateStatus(orderId, "shipped", { trackingNumber: tracking });
    this.log.info("order shipped", { orderId, carrierId, tracking });
    return tracking;
  }
}

interface OrderService {
  createFromCart(
    cart: Cart,
    userId: string,
    address: ShippingAddress,
    shippingCost: number,
  ): Promise<Order>;
  getOrder(id: string): Promise<Order | undefined>;
  getUserOrders(userId: string): Promise<Order[]>;
  cancelOrder(id: string): Promise<Order>;
}

@injectable([
  inject(OrderRepoToken),
  inject(FulfillmentServiceToken),
  inject(EventBusToken),
  inject(LoggerToken),
  inject(IdGeneratorToken),
])
class OrderServiceImpl implements OrderService {
  private readonly log: Logger;

  constructor(
    private readonly orderRepo: OrderRepository,
    private readonly fulfillment: FulfillmentService,
    private readonly eventBus: EventBus,
    logger: Logger,
    private readonly idGen: IdGenerator,
  ) {
    this.log = logger.child({ service: "OrderService" });
  }

  async createFromCart(
    cart: Cart,
    userId: string,
    address: ShippingAddress,
    shippingCost: number,
  ): Promise<Order> {
    const taxAmount = Math.round(cart.subtotal * 0.08); // 8% tax
    const order: Order = {
      id: this.idGen.generate("ord-"),
      userId,
      items: cart.items.map((i) => ({ ...i })),
      shippingAddress: address,
      status: "pending_payment",
      subtotal: cart.subtotal,
      shippingCost,
      taxAmount,
      discountAmount: cart.discountAmount,
      total: cart.subtotal + shippingCost + taxAmount - cart.discountAmount,
      currency: cart.currency,
      paymentId: null,
      trackingNumber: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const saved = await this.orderRepo.save(order);
    await this.eventBus.publish("order.created", { orderId: saved.id, userId, total: saved.total });
    this.log.info("order created", { orderId: saved.id, total: saved.total });
    return saved;
  }

  async getOrder(id: string): Promise<Order | undefined> {
    return this.orderRepo.findById(id);
  }

  async getUserOrders(userId: string): Promise<Order[]> {
    return this.orderRepo.findByUserId(userId);
  }

  async cancelOrder(id: string): Promise<Order> {
    const order = await this.orderRepo.updateStatus(id, "cancelled");
    await this.eventBus.publish("order.cancelled", { orderId: id });
    return order;
  }
}

// ============================================================================
// ─── PAYMENT DOMAIN ─────────────────────────────────────────────────────────
// ============================================================================

interface PaymentGateway {
  gatewayId: string;
  displayName: string;
  charge(
    amount: number,
    currency: string,
    orderId: string,
    meta?: Record<string, unknown>,
  ): Promise<PaymentIntent>;
  refund(paymentId: string, amount?: number): Promise<boolean>;
  supports(currency: string): boolean;
}

// Multi-binding: Stripe (primary)
class StripeGateway implements PaymentGateway {
  gatewayId = "stripe";
  displayName = "Stripe";
  private readonly log: Logger;

  constructor(
    private readonly apiKey: string,
    logger: Logger,
  ) {
    this.log = logger.child({ gateway: "stripe" });
  }

  async charge(amount: number, currency: string, orderId: string): Promise<PaymentIntent> {
    await delay(15);
    this.log.info("stripe charge", { amount, currency, orderId });
    return {
      id: `pi_stripe_${Date.now()}`,
      gateway: this.gatewayId,
      amount,
      currency,
      status: "captured",
      orderId,
      metadata: { stripePaymentIntentId: `pi_${Date.now()}` },
    };
  }

  async refund(paymentId: string): Promise<boolean> {
    await delay(10);
    this.log.info("stripe refund", { paymentId });
    return true;
  }

  supports(_currency: string): boolean {
    return true;
  }
}

// Multi-binding: PayPal (secondary/fallback)
class PayPalGateway implements PaymentGateway {
  gatewayId = "paypal";
  displayName = "PayPal";
  private readonly log: Logger;

  constructor(
    private readonly clientId: string,
    logger: Logger,
  ) {
    this.log = logger.child({ gateway: "paypal" });
  }

  async charge(amount: number, currency: string, orderId: string): Promise<PaymentIntent> {
    await delay(20);
    this.log.info("paypal charge", { amount, currency, orderId });
    return {
      id: `paypal_${Date.now()}`,
      gateway: this.gatewayId,
      amount,
      currency,
      status: "captured",
      orderId,
      metadata: { paypalOrderId: `PP-${Date.now()}` },
    };
  }

  async refund(paymentId: string): Promise<boolean> {
    await delay(12);
    this.log.info("paypal refund", { paymentId });
    return true;
  }

  supports(currency: string): boolean {
    return ["USD", "EUR", "GBP", "AUD"].includes(currency);
  }
}

// Multi-binding: COD (Cash on Delivery) — for certain markets
class CashOnDeliveryGateway implements PaymentGateway {
  gatewayId = "cod";
  displayName = "Cash on Delivery";

  async charge(amount: number, currency: string, orderId: string): Promise<PaymentIntent> {
    return {
      id: `cod_${Date.now()}`,
      gateway: this.gatewayId,
      amount,
      currency,
      status: "pending",
      orderId,
      metadata: { requiresCashCollection: true },
    };
  }

  async refund(): Promise<boolean> {
    return false;
  } // COD doesn't support automated refunds
  supports(currency: string): boolean {
    return currency === "VND" || currency === "USD";
  }
}

interface PaymentService {
  processPayment(order: Order, gatewayId: string): Promise<PaymentIntent>;
  refundPayment(paymentId: string, gatewayId: string, amount?: number): Promise<boolean>;
  listAvailableGateways(currency: string): PaymentGateway[];
}

@injectable([
  inject(PaymentGatewayToken),
  inject(OrderRepoToken),
  inject(EventBusToken),
  inject(LoggerToken),
])
class PaymentServiceImpl implements PaymentService {
  private readonly log: Logger;

  constructor(
    private readonly gateways: PaymentGateway[], // resolveAll — all gateways
    private readonly orderRepo: OrderRepository,
    private readonly eventBus: EventBus,
    logger: Logger,
  ) {
    this.log = logger.child({ service: "PaymentService" });
  }

  listAvailableGateways(currency: string): PaymentGateway[] {
    return this.gateways.filter((g) => g.supports(currency));
  }

  async processPayment(order: Order, gatewayId: string): Promise<PaymentIntent> {
    const gateway = this.gateways.find((g) => g.gatewayId === gatewayId);
    if (!gateway) {
      throw new Error(`Payment gateway ${gatewayId} not found`);
    }

    this.log.info("processing payment", {
      orderId: order.id,
      gateway: gatewayId,
      amount: order.total,
      currency: order.currency,
    });

    let intent: PaymentIntent;
    try {
      intent = await gateway.charge(order.total, order.currency, order.id);
    } catch (err) {
      this.log.error("payment failed, attempting fallback", err, { orderId: order.id });
      // Auto-fallback: try next supported gateway
      const fallback = this.gateways.find(
        (g) => g.gatewayId !== gatewayId && g.supports(order.currency),
      );
      if (!fallback) {
        throw err;
      }
      this.log.info("retrying with fallback gateway", { fallback: fallback.gatewayId });
      intent = await fallback.charge(order.total, order.currency, order.id);
    }

    await this.orderRepo.updateStatus(order.id, "payment_confirmed", {
      paymentId: intent.id,
    } as Partial<Order>);
    await this.eventBus.publish("payment.completed", {
      orderId: order.id,
      paymentId: intent.id,
      amount: intent.amount,
    });
    this.log.info("payment successful", { paymentId: intent.id, gateway: intent.gateway });
    return intent;
  }

  async refundPayment(paymentId: string, gatewayId: string, amount?: number): Promise<boolean> {
    const gateway = this.gateways.find((g) => g.gatewayId === gatewayId);
    if (!gateway) {
      throw new Error(`Gateway ${gatewayId} not found`);
    }
    return gateway.refund(paymentId, amount);
  }
}

// ============================================================================
// ─── USER DOMAIN ─────────────────────────────────────────────────────────────
// ============================================================================

interface UserRepository {
  findById(id: string): Promise<User | undefined>;
  findByEmail(email: string): Promise<User | undefined>;
  save(user: User): Promise<User>;
  updateLoyaltyPoints(userId: string, delta: number): Promise<number>;
}

@injectable([inject(DatabaseToken), inject(RedisToken), inject(LoggerToken)])
class PostgresUserRepository implements UserRepository {
  private readonly log: Logger;

  constructor(
    private readonly db: Database,
    private readonly cache: RedisClient,
    logger: Logger,
  ) {
    this.log = logger.child({ repo: "UserRepository" });
  }

  async findById(id: string): Promise<User | undefined> {
    const cached = await this.cache.get(`user:${id}`);
    if (cached) {
      return JSON.parse(cached) as User;
    }
    await this.db.query("SELECT * FROM users WHERE id=$1", [id]);
    const user = makeFakeUser(id);
    await this.cache.set(`user:${id}`, JSON.stringify(user), 600);
    return user;
  }

  async findByEmail(email: string): Promise<User | undefined> {
    await this.db.query("SELECT * FROM users WHERE email=$1", [email]);
    return makeFakeUser("user-found-by-email");
  }

  async save(user: User): Promise<User> {
    await this.db.execute(
      "INSERT INTO users(id,email,full_name,tier) VALUES($1,$2,$3,$4) ON CONFLICT(id) DO UPDATE SET full_name=$3",
      [user.id, user.email, user.fullName, user.tier],
    );
    await this.cache.del(`user:${user.id}`);
    this.log.info("user saved", { userId: user.id, email: user.email });
    return user;
  }

  async updateLoyaltyPoints(userId: string, delta: number): Promise<number> {
    await this.db.execute("UPDATE users SET loyalty_points=loyalty_points+$1 WHERE id=$2", [
      delta,
      userId,
    ]);
    await this.cache.del(`user:${userId}`);
    this.log.info("loyalty points updated", { userId, delta });
    return delta; // simplified: return new total
  }
}

interface AddressRepository {
  findByUserId(userId: string): Promise<Address[]>;
  save(address: Address): Promise<Address>;
  setDefault(addressId: string, userId: string): Promise<void>;
}

@injectable([inject(DatabaseToken)])
class PostgresAddressRepository implements AddressRepository {
  constructor(private readonly db: Database) {}

  async findByUserId(userId: string): Promise<Address[]> {
    await this.db.query("SELECT * FROM addresses WHERE user_id=$1", [userId]);
    return [makeFakeAddress("addr-001", userId)];
  }

  async save(address: Address): Promise<Address> {
    await this.db.execute(
      "INSERT INTO addresses(id,user_id,full_name,address_line1,city,country) VALUES($1,$2,$3,$4,$5,$6)",
      [
        address.id,
        address.userId,
        address.fullName,
        address.addressLine1,
        address.city,
        address.country,
      ],
    );
    return address;
  }

  async setDefault(addressId: string, userId: string): Promise<void> {
    await this.db.execute("UPDATE addresses SET is_default=(id=$1) WHERE user_id=$2", [
      addressId,
      userId,
    ]);
  }
}

interface LoyaltyService {
  awardPoints(userId: string, orderTotal: number): Promise<number>;
  redeemPoints(userId: string, points: number): Promise<boolean>;
  getBalance(userId: string): Promise<number>;
}

@injectable([inject(UserRepoToken), inject(AppConfigToken), inject(LoggerToken)])
class LoyaltyServiceImpl implements LoyaltyService {
  private readonly log: Logger;

  constructor(
    private readonly users: UserRepository,
    private readonly config: AppConfig,
    logger: Logger,
  ) {
    this.log = logger.child({ service: "LoyaltyService" });
  }

  async awardPoints(userId: string, orderTotal: number): Promise<number> {
    const points = Math.floor((orderTotal / 100) * this.config.loyaltyPointsPerDollar);
    const newBalance = await this.users.updateLoyaltyPoints(userId, points);
    this.log.info("loyalty points awarded", { userId, points, orderTotal });
    return newBalance;
  }

  async redeemPoints(userId: string, points: number): Promise<boolean> {
    const user = await this.users.findById(userId);
    if (!user || user.loyaltyPoints < points) {
      return false;
    }
    await this.users.updateLoyaltyPoints(userId, -points);
    this.log.info("loyalty points redeemed", { userId, points });
    return true;
  }

  async getBalance(userId: string): Promise<number> {
    const user = await this.users.findById(userId);
    return user?.loyaltyPoints ?? 0;
  }
}

interface UserService {
  register(email: string, fullName: string): Promise<User>;
  authenticate(email: string): Promise<User | undefined>;
  getProfile(userId: string): Promise<User | undefined>;
  getAddresses(userId: string): Promise<Address[]>;
  addAddress(userId: string, addr: Omit<Address, "id" | "userId" | "isDefault">): Promise<Address>;
}

@injectable([
  inject(UserRepoToken),
  inject(AddressRepoToken),
  inject(EventBusToken),
  inject(LoggerToken),
  inject(IdGeneratorToken),
])
class UserServiceImpl implements UserService {
  private readonly log: Logger;

  constructor(
    private readonly users: UserRepository,
    private readonly addresses: AddressRepository,
    private readonly eventBus: EventBus,
    logger: Logger,
    private readonly idGen: IdGenerator,
  ) {
    this.log = logger.child({ service: "UserService" });
  }

  async register(email: string, fullName: string): Promise<User> {
    const existing = await this.users.findByEmail(email);
    if (existing) {
      this.log.warn("registration attempt for existing email", { email });
      return existing;
    }
    const user: User = {
      id: this.idGen.generate("usr-"),
      email,
      fullName,
      phone: null,
      tier: "bronze",
      loyaltyPoints: 0,
      createdAt: new Date(),
    };
    const saved = await this.users.save(user);
    await this.eventBus.publish("user.registered", { userId: saved.id, email });
    this.log.info("user registered", { userId: saved.id, email });
    return saved;
  }

  async authenticate(email: string): Promise<User | undefined> {
    return this.users.findByEmail(email);
  }

  async getProfile(userId: string): Promise<User | undefined> {
    return this.users.findById(userId);
  }

  async getAddresses(userId: string): Promise<Address[]> {
    return this.addresses.findByUserId(userId);
  }

  async addAddress(
    userId: string,
    addr: Omit<Address, "id" | "userId" | "isDefault">,
  ): Promise<Address> {
    const address: Address = {
      id: this.idGen.generate("addr-"),
      userId,
      isDefault: false,
      ...addr,
    };
    return this.addresses.save(address);
  }
}

// ============================================================================
// ─── NOTIFICATION DOMAIN ────────────────────────────────────────────────────
// ============================================================================

interface NotificationChannel {
  channelId: string;
  canHandle(payload: NotificationPayload): boolean;
  send(payload: NotificationPayload): Promise<NotificationResult>;
}

// Multi-binding: Email
@injectable([inject(AppConfigToken), inject(LoggerToken)])
class EmailChannel implements NotificationChannel {
  channelId = "email";
  private readonly log: Logger;

  constructor(
    private readonly config: AppConfig,
    logger: Logger,
  ) {
    this.log = logger.child({ channel: "email" });
  }

  canHandle(payload: NotificationPayload): boolean {
    return !!payload.email;
  }

  async send(payload: NotificationPayload): Promise<NotificationResult> {
    await delay(10);
    this.log.info("sending email", {
      to: payload.email,
      template: payload.template,
      userId: payload.userId,
    });
    return { channel: this.channelId, success: true, messageId: `ses-${Date.now()}` };
  }
}

// Multi-binding: SMS
@injectable([inject(AppConfigToken), inject(LoggerToken)])
class SmsChannel implements NotificationChannel {
  channelId = "sms";
  private readonly log: Logger;

  constructor(
    private readonly config: AppConfig,
    logger: Logger,
  ) {
    this.log = logger.child({ channel: "sms" });
  }

  canHandle(payload: NotificationPayload): boolean {
    return !!payload.phone && payload.priority === "high";
  }

  async send(payload: NotificationPayload): Promise<NotificationResult> {
    await delay(8);
    this.log.info("sending SMS", { to: payload.phone, template: payload.template });
    return { channel: this.channelId, success: true, messageId: `twilio-${Date.now()}` };
  }
}

// Multi-binding: Push notification
@injectable([inject(LoggerToken)])
class PushChannel implements NotificationChannel {
  channelId = "push";
  private readonly log: Logger;

  constructor(logger: Logger) {
    this.log = logger.child({ channel: "push" });
  }

  canHandle(payload: NotificationPayload): boolean {
    return payload.priority === "high" || payload.priority === "normal";
  }

  async send(payload: NotificationPayload): Promise<NotificationResult> {
    await delay(3);
    this.log.info("sending push notification", {
      userId: payload.userId,
      template: payload.template,
    });
    return { channel: this.channelId, success: true, messageId: `push-${Date.now()}` };
  }
}

interface NotificationService {
  send(payload: NotificationPayload): Promise<NotificationResult[]>;
  sendOrderConfirmation(order: Order, user: User): Promise<void>;
  sendShippingUpdate(order: Order, user: User, trackingNumber: string): Promise<void>;
}

@injectable([inject(NotificationChannelToken), inject(LoggerToken)])
class NotificationServiceImpl implements NotificationService {
  private readonly log: Logger;

  constructor(
    private readonly channels: NotificationChannel[], // resolveAll — all channels
    logger: Logger,
  ) {
    this.log = logger.child({ service: "NotificationService" });
  }

  async send(payload: NotificationPayload): Promise<NotificationResult[]> {
    const applicableChannels = this.channels.filter((c) => c.canHandle(payload));
    this.log.info("dispatching notification", {
      template: payload.template,
      channelCount: applicableChannels.length,
    });
    return Promise.all(applicableChannels.map((c) => c.send(payload)));
  }

  async sendOrderConfirmation(order: Order, user: User): Promise<void> {
    await this.send({
      userId: user.id,
      email: user.email,
      phone: user.phone ?? undefined,
      template: "order_confirmation",
      data: {
        orderId: order.id,
        total: order.total,
        currency: order.currency,
        items: order.items.length,
        customerName: user.fullName,
      },
      priority: "high",
    });
  }

  async sendShippingUpdate(order: Order, user: User, trackingNumber: string): Promise<void> {
    await this.send({
      userId: user.id,
      email: user.email,
      phone: user.phone ?? undefined,
      template: "shipping_update",
      data: {
        orderId: order.id,
        trackingNumber,
        customerName: user.fullName,
      },
      priority: "high",
    });
  }
}

interface CheckoutApplicationService {
  runCheckout(requestId: string): Promise<void>;
}

@injectable([
  inject(SessionToken),
  inject(LoggerToken),
  inject(CatalogServiceToken),
  inject(CartServiceToken),
  inject(OrderServiceToken),
  inject(PaymentServiceToken),
  inject(UserServiceToken),
  inject(FulfillmentServiceToken),
  inject(NotificationServiceToken),
  inject(AnalyticsServiceToken),
  inject(AbTestServiceToken),
])
class CheckoutApplicationServiceImpl implements CheckoutApplicationService {
  constructor(
    private readonly session: UserSession,
    private readonly logger: Logger,
    private readonly catalogService: CatalogService,
    private readonly cartService: CartService,
    private readonly orderService: OrderService,
    private readonly paymentService: PaymentService,
    private readonly userService: UserService,
    private readonly fulfillmentService: FulfillmentService,
    private readonly notificationService: NotificationService,
    private readonly analyticsService?: AnalyticsService,
    private readonly abTestService?: AbTestService,
  ) {}

  async runCheckout(requestId: string): Promise<void> {
    const requestLogger = this.logger.child({ requestId, userId: this.session.userId });
    requestLogger.info("-> checkout request started");

    await this.runAbTest(requestLogger);
    const cart = await this.loadCartWithFeaturedItems(requestLogger);
    const discountedCart = await this.applyCouponSafely(cart, requestLogger);
    const { user, shippingAddress } = await this.loadCheckoutContext();
    const { checkedOutCart, cheapestQuote } = await this.quoteShipping(
      discountedCart,
      shippingAddress,
      requestLogger,
    );
    const order = await this.createOrder(
      checkedOutCart,
      shippingAddress,
      cheapestQuote,
      requestLogger,
    );
    const { payment, tracking } = await this.completePaymentAndShipping(
      order,
      shippingAddress,
      cheapestQuote,
      requestLogger,
    );
    await this.sendShippingNotification(order, user, tracking);
    await this.trackCheckoutAnalytics(order, payment, cheapestQuote, checkedOutCart);
    await this.finalizeCheckout(discountedCart, order, payment, tracking, requestLogger);
  }

  private async runAbTest(requestLogger: Logger): Promise<void> {
    if (!this.abTestService) {
      return;
    }
    const variant = await this.abTestService.getVariant(
      this.session.userId,
      "checkout_redesign_2024",
    );
    requestLogger.info("a/b variant", { variant: variant.variant });
  }

  private async loadCartWithFeaturedItems(requestLogger: Logger): Promise<Cart> {
    let cart = await this.cartService.getOrCreate(this.session);
    requestLogger.info("cart loaded", { cartId: cart.id, itemCount: cart.items.length });

    const featuredProducts = await this.catalogService.listFeatured();
    requestLogger.info(`adding ${Math.min(3, featuredProducts.length)} items to cart`);

    for (const product of featuredProducts.slice(0, 3)) {
      cart = await this.cartService.addItem(cart.id, product.id, 1);
    }
    return cart;
  }

  private async applyCouponSafely(cart: Cart, requestLogger: Logger): Promise<Cart> {
    try {
      const updatedCart = await this.cartService.applyCoupon(cart.id, "WELCOME20");
      requestLogger.info("coupon applied", {
        couponCode: "WELCOME20",
        discount: updatedCart.discountAmount,
      });
      return updatedCart;
    } catch (err) {
      requestLogger.warn("coupon failed", { err });
      return cart;
    }
  }

  private async loadCheckoutContext(): Promise<{
    user: User | undefined;
    shippingAddress: ShippingAddress;
  }> {
    const user = await this.userService.getProfile(this.session.userId);
    const addresses = await this.userService.getAddresses(this.session.userId);
    return { user, shippingAddress: addresses[0]! };
  }

  private async quoteShipping(
    cart: Cart,
    shippingAddress: ShippingAddress,
    requestLogger: Logger,
  ): Promise<{ checkedOutCart: Cart; cheapestQuote: ShippingQuote }> {
    const checkedOutCart = await this.cartService.checkout(cart.id);
    const shippingQuotes = await this.fulfillmentService.getShippingQuotes(
      shippingAddress,
      checkedOutCart.items as OrderItem[],
    );
    requestLogger.info("shipping quotes received", {
      carriers: shippingQuotes.map(
        (quote) =>
          `${quote.carrierName} $${(quote.cost / 100).toFixed(2)} (${quote.estimatedDays}d)`,
      ),
    });
    return { checkedOutCart, cheapestQuote: shippingQuotes[0]! };
  }

  private async createOrder(
    checkedOutCart: Cart,
    shippingAddress: ShippingAddress,
    cheapestQuote: ShippingQuote,
    requestLogger: Logger,
  ): Promise<Order> {
    const order = await this.orderService.createFromCart(
      checkedOutCart,
      this.session.userId,
      shippingAddress,
      cheapestQuote.cost,
    );
    requestLogger.info("order created", {
      orderId: order.id,
      total: `$${(order.total / 100).toFixed(2)}`,
      currency: order.currency,
    });
    return order;
  }

  private async completePaymentAndShipping(
    order: Order,
    shippingAddress: ShippingAddress,
    cheapestQuote: ShippingQuote,
    requestLogger: Logger,
  ): Promise<{ payment: PaymentIntent; tracking: string }> {
    const availableGateways = this.paymentService.listAvailableGateways(order.currency);
    requestLogger.info("available payment gateways", {
      gateways: availableGateways.map((gateway) => gateway.displayName),
    });

    const payment = await this.paymentService.processPayment(order, "stripe");
    requestLogger.info("payment processed", {
      paymentId: payment.id,
      gateway: payment.gateway,
      status: payment.status,
    });

    const tracking = await this.fulfillmentService.shipOrder(
      order.id,
      cheapestQuote.carrierId,
      shippingAddress,
    );
    requestLogger.info("order shipped", { orderId: order.id, tracking });
    return { payment, tracking };
  }

  private async sendShippingNotification(
    order: Order,
    user: User | undefined,
    tracking: string,
  ): Promise<void> {
    if (!user) {
      return;
    }
    await this.notificationService.sendShippingUpdate(order, user, tracking);
  }

  private async trackCheckoutAnalytics(
    order: Order,
    payment: PaymentIntent,
    cheapestQuote: ShippingQuote,
    checkedOutCart: Cart,
  ): Promise<void> {
    if (!this.analyticsService) {
      return;
    }
    await this.analyticsService.track({
      event: "checkout_completed",
      userId: this.session.userId,
      properties: {
        orderId: order.id,
        total: order.total,
        currency: order.currency,
        itemCount: order.items.length,
        gateway: payment.gateway,
        carrier: cheapestQuote.carrierId,
        couponUsed: !!checkedOutCart.couponCode,
      },
      timestamp: new Date(),
    });
  }

  private async finalizeCheckout(
    cart: Cart,
    order: Order,
    payment: PaymentIntent,
    tracking: string,
    requestLogger: Logger,
  ): Promise<void> {
    await this.cartService.clear(cart.id);
    requestLogger.info("<- checkout completed ✅", {
      orderId: order.id,
      paymentId: payment.id,
      tracking,
    });
  }
}

// ============================================================================
// ─── ANALYTICS (optional integration) ───────────────────────────────────────
// ============================================================================

interface AnalyticsService {
  track(event: TrackEvent): Promise<void>;
  identify(userId: string, traits: Record<string, unknown>): Promise<void>;
}

@injectable([inject(LoggerToken)])
class SegmentAnalyticsService implements AnalyticsService {
  private readonly log: Logger;

  constructor(logger: Logger) {
    this.log = logger.child({ service: "Analytics" });
  }

  async track(event: TrackEvent): Promise<void> {
    this.log.info("analytics.track", { event: event.event, userId: event.userId });
  }

  async identify(userId: string, traits: Record<string, unknown>): Promise<void> {
    this.log.info("analytics.identify", { userId, traitKeys: Object.keys(traits) });
  }
}

interface AbTestService {
  getVariant(userId: string, experimentId: string): Promise<AbVariant>;
  track(userId: string, experimentId: string, converted: boolean): Promise<void>;
}

@injectable([inject(RedisToken), inject(LoggerToken)])
class AbTestServiceImpl implements AbTestService {
  private readonly log: Logger;

  constructor(
    private readonly redis: RedisClient,
    logger: Logger,
  ) {
    this.log = logger.child({ service: "AbTest" });
  }

  async getVariant(userId: string, experimentId: string): Promise<AbVariant> {
    const key = `ab:${experimentId}:${userId}`;
    const cached = await this.redis.get(key);
    if (cached) {
      return JSON.parse(cached) as AbVariant;
    }
    // Deterministic assignment based on userId hash
    const variants = ["control", "treatment_a", "treatment_b"] as const;
    const variant = variants[userId.charCodeAt(userId.length - 1) % 3]!;
    const result: AbVariant = { experimentId, variant };
    await this.redis.set(key, JSON.stringify(result), 86400 * 30);
    this.log.info("variant assigned", { userId, experimentId, variant });
    return result;
  }

  async track(userId: string, experimentId: string, converted: boolean): Promise<void> {
    this.log.info("ab test conversion", { userId, experimentId, converted });
  }
}

// ============================================================================
// ─── MODULES ─────────────────────────────────────────────────────────────────
// ============================================================================

// ---- Infrastructure (async) -------------------------------------------------

const InfraModule = Module.createAsync("Infrastructure", async (builder) => {
  const config = await loadAppConfig();
  builder.bind(AppConfigToken).toConstantValue(config);
  builder.bind(LoggerToken).toConstantValue(new ConsoleLogger({ app: "ecommerce" }));
  builder.bind(IdGeneratorToken).to(UlidGenerator).singleton();

  // Database: async connect on activation, close on deactivation
  builder
    .bind(DatabaseToken)
    .toDynamicAsync(async (ctx) => {
      const cfg = ctx.resolve(AppConfigToken);
      const log = ctx.resolve(LoggerToken);
      return new MockDatabase(log, cfg.dbUrl);
    })
    .singleton()
    .onActivation(async (_ctx, db) => {
      await db.connect();
      return db;
    })
    .onDeactivation(async (db) => {
      await db.close();
    });

  // Redis: async connect, close on deactivation
  builder
    .bind(RedisToken)
    .toDynamicAsync(async (ctx) => {
      const log = ctx.resolve(LoggerToken);
      return new MockRedis(log);
    })
    .singleton()
    .onActivation(async (_ctx, redis) => {
      await redis.connect();
      return redis;
    })
    .onDeactivation(async (redis) => {
      await redis.quit();
    });

  // S3
  builder
    .bind(S3Token)
    .toDynamic((ctx) => {
      const cfg = ctx.resolve(AppConfigToken);
      return new MockS3(cfg.s3Bucket);
    })
    .singleton();

  // Elasticsearch
  builder
    .bind(ElasticToken)
    .toDynamic((ctx) => {
      const log = ctx.resolve(LoggerToken);
      return new MockElastic(log);
    })
    .singleton();

  // In-memory EventBus (replace with Kafka/RabbitMQ binding in production)
  builder
    .bind(EventBusToken)
    .toDynamic((ctx) => new InMemoryEventBus(ctx.resolve(LoggerToken)))
    .singleton();
});

// ---- Catalog ----------------------------------------------------------------

const CatalogModule = Module.create("Catalog", (builder) => {
  builder.bind(ProductRepoToken).to(PostgresProductRepository).singleton();
  builder.bind(CategoryRepoToken).to(PostgresCategoryRepository).singleton();
  builder.bind(InventoryServiceToken).to(InventoryServiceImpl).singleton();
  builder.bind(PricingServiceToken).to(PricingServiceImpl).singleton();
  // @postConstruct handles cache warm-up; @preDestroy handles flush
  builder.bind(CatalogServiceToken).to(CatalogServiceImpl).singleton();
  builder.bind(SearchServiceToken).to(ElasticSearchService).singleton();
});

// ---- Cart -------------------------------------------------------------------

const CartModule = Module.create("Cart", (builder) => {
  builder.import(CatalogModule);
  builder.bind(CartRepoToken).to(RedisCartRepository).singleton();
  builder.bind(CouponServiceToken).to(CouponServiceImpl).singleton();
  builder.bind(CartServiceToken).to(CartServiceImpl).singleton();
});

// ---- Orders -----------------------------------------------------------------

const ShippingModule = Module.create("Shipping", (builder) => {
  // Multi-binding: all shipping carriers under the same token
  // container.bind() (not module) is used to append multiple carriers
  // Below we bind directly in this module since it owns the carrier set
  builder.bind(ShippingCarrierToken).toConstantValue(new FedExCarrier());
  builder.bind(ShippingCarrierToken).toConstantValue(new UpsCarrier());
  builder.bind(ShippingCarrierToken).toConstantValue(new DhlCarrier());
});

const OrderModule = Module.create("Orders", (builder) => {
  builder.import(ShippingModule);
  builder.bind(OrderRepoToken).to(PostgresOrderRepository).singleton();
  builder.bind(FulfillmentServiceToken).to(FulfillmentServiceImpl).singleton();
  builder.bind(OrderServiceToken).to(OrderServiceImpl).singleton();
});

// ---- Payments ---------------------------------------------------------------

const PaymentModule = Module.createAsync("Payments", async (builder) => {
  const config = await loadAppConfig();

  // Multi-binding: all payment gateways under PaymentGatewayToken
  builder
    .bind(PaymentGatewayToken)
    .toDynamic((ctx) => new StripeGateway(config.stripeKey, ctx.resolve(LoggerToken)))
    .singleton();
  builder
    .bind(PaymentGatewayToken)
    .toDynamic((ctx) => new PayPalGateway(config.paypalClientId, ctx.resolve(LoggerToken)))
    .singleton();
  builder.bind(PaymentGatewayToken).toConstantValue(new CashOnDeliveryGateway());

  builder.bind(PaymentServiceToken).to(PaymentServiceImpl).singleton();
});

// ---- Users ------------------------------------------------------------------

const UserModule = Module.create("Users", (builder) => {
  builder.bind(UserRepoToken).to(PostgresUserRepository).singleton();
  builder.bind(AddressRepoToken).to(PostgresAddressRepository).singleton();
  builder.bind(LoyaltyServiceToken).to(LoyaltyServiceImpl).singleton();
  builder.bind(UserServiceToken).to(UserServiceImpl).singleton();
  // SessionToken is scoped — bound per-request in child container
});

// ---- Notifications ----------------------------------------------------------

const NotificationModule = Module.create("Notifications", (builder) => {
  // Multi-binding: all channels under same token
  builder.bind(NotificationChannelToken).to(EmailChannel).singleton();
  builder.bind(NotificationChannelToken).to(SmsChannel).singleton();
  builder.bind(NotificationChannelToken).to(PushChannel).singleton();
  builder.bind(NotificationServiceToken).to(NotificationServiceImpl).singleton();
});

// ---- Analytics (optional features) -----------------------------------------

const AnalyticsModule = Module.create("Analytics", (builder) => {
  builder.bind(AnalyticsServiceToken).to(SegmentAnalyticsService).singleton();
  builder.bind(AbTestServiceToken).to(AbTestServiceImpl).singleton();
});

// ---- Root app module --------------------------------------------------------

const AppModule = Module.create("App", (builder) => {
  builder.import(
    CatalogModule,
    CartModule,
    OrderModule,
    UserModule,
    NotificationModule,
    AnalyticsModule,
  );
  // Placeholder scoped session token — overridden per request in child container
  builder.bind(SessionToken).toConstantValue({
    userId: "bootstrap",
    email: "bootstrap@example.com",
    tier: "bronze",
    cartId: null,
    requestId: "bootstrap",
  } satisfies UserSession);
  builder.bind(CheckoutApplicationServiceToken).to(CheckoutApplicationServiceImpl).scoped();
});

// ============================================================================
// ─── APPLICATION BOOTSTRAP & REQUEST HANDLING ───────────────────────────────
// ============================================================================

async function bootstrap() {
  console.log("\n╔══════════════════════════════════════════════════╗");
  console.log("║  🛒  E-Commerce Platform — DI Bootstrap          ║");
  console.log("╚══════════════════════════════════════════════════╝\n");

  // 1. Build root container from async infrastructure + all domain modules
  const container = await Container.fromModulesAsync(InfraModule, PaymentModule, AppModule);

  // 2. Eagerly warm up all singletons (connects DB, Redis, etc.)
  console.log("\n[Bootstrap] Initialising all singletons...");
  await container.initializeAsync();

  // 3. Validate scope rules — catches captive-dependency bugs
  container.validate();
  console.log("[Bootstrap] ✅ Container validated — no scope violations");

  // 4. Register event handlers (cross-cutting concerns via EventBus)
  const eventBus = container.resolve(EventBusToken);
  const loyalty = container.resolve(LoyaltyServiceToken);
  const notif = container.resolve(NotificationServiceToken);
  const userSvc = container.resolve(UserServiceToken);

  eventBus.subscribe<{ orderId: string; userId: string; total: number }>(
    "order.created",
    async ({ userId, total }) => {
      // Award loyalty points on every order
      await loyalty.awardPoints(userId, total);
    },
  );

  eventBus.subscribe<{ orderId: string; userId: string }>(
    "order.created",
    async ({ orderId, userId }) => {
      const [order, user] = await Promise.all([
        container.resolve(OrderServiceToken).getOrder(orderId),
        userSvc.getProfile(userId),
      ]);
      if (order && user) {
        await notif.sendOrderConfirmation(order, user);
      }
    },
  );

  console.log("[Bootstrap] 📡 Event handlers registered");
  console.log("[Bootstrap] 🚀 Platform ready to serve requests\n");

  return container;
}

// ---- Per-request handler ----------------------------------------------------

async function handleCheckoutRequest(
  rootContainer: ReturnType<typeof Container.create>,
  requestId: string,
  session: UserSession,
): Promise<void> {
  // Each request gets an isolated scoped child container
  const requestContainer = rootContainer.createChild();
  requestContainer.bind(SessionToken).toConstantValue(session);
  const checkoutApplicationService = requestContainer.resolve(CheckoutApplicationServiceToken);
  await checkoutApplicationService.runCheckout(requestId);
}

// ============================================================================
// ─── MAIN ────────────────────────────────────────────────────────────────────
// ============================================================================

async function main(): Promise<void> {
  await using platform = {
    container: null as unknown as Awaited<ReturnType<typeof bootstrap>>,
    [Symbol.asyncDispose]: async function () {
      console.log("\n[Shutdown] Initiating graceful shutdown...");
      await this.container.dispose();
      console.log("[Shutdown] ✅ All connections closed. Goodbye!");
    },
  };

  platform.container = await bootstrap();

  // ── Register user & simulate full customer journey ──────────────────────

  const userSvc = platform.container.resolve(UserServiceToken);

  // New customer registers
  const alice = await userSvc.register("alice@example.com", "Alice Nguyen");
  console.log(`\n[Customer] Registered: ${alice.fullName} (${alice.id})`);

  // Add a shipping address
  await userSvc.addAddress(alice.id, {
    fullName: "Alice Nguyen",
    addressLine1: "123 Le Loi St",
    city: "Ho Chi Minh City",
    state: "HCMC",
    postalCode: "700000",
    country: "VN",
    phone: "+84901234567",
  });

  // Simulate 3 concurrent requests (different users)
  const sessions: UserSession[] = [
    { userId: alice.id, email: alice.email, tier: "bronze", cartId: null, requestId: "req-001" },
    {
      userId: "usr-bob",
      email: "bob@example.com",
      tier: "gold",
      cartId: null,
      requestId: "req-002",
    },
    {
      userId: "usr-carol",
      email: "carol@example.com",
      tier: "platinum",
      cartId: null,
      requestId: "req-003",
    },
  ];

  console.log("\n[Server] Processing 3 concurrent checkout requests...\n");
  await Promise.all(sessions.map((s) => handleCheckoutRequest(platform.container, s.requestId, s)));

  // ── Browse catalog ─────────────────────────────────────────────────────

  console.log("\n[Catalog] Searching for 'running shoes'...");
  const searchSvc = platform.container.resolve(SearchServiceToken);
  const results = await searchSvc.search("running shoes", { brand: "Nike" });
  console.log(`[Catalog] Found ${results.length} results`);

  // ── Dependency graph ──────────────────────────────────────────────────
  const dot = platform.container.generateDependencyGraph();
  const lineCount = dot.split("\n").length;
  console.log(
    `\n[Graph] Dependency graph: ${lineCount} lines (paste at graphviz.org to visualize)`,
  );

  // ── Container snapshot ────────────────────────────────────────────────
  const snapshot = platform.container.inspect();
  console.log(`[Inspect] Total bindings registered: ${snapshot.bindings.length}`);

  const singletons = snapshot.bindings.filter((b) => b.scope === "singleton").length;
  const transients = snapshot.bindings.filter((b) => b.scope === "transient").length;
  const scoped = snapshot.bindings.filter((b) => b.scope === "scoped").length;
  console.log(`[Inspect] Singletons: ${singletons}, Transients: ${transients}, Scoped: ${scoped}`);
}

main().catch(console.error);

// ============================================================================
// ─── UTILITIES & FAKE DATA BUILDERS ─────────────────────────────────────────
// ============================================================================

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function loadAppConfig(): Promise<AppConfig> {
  await delay(5);
  return {
    env: "development",
    dbUrl: "postgres://localhost:5432/ecommerce_dev",
    redisUrl: "redis://localhost:6379",
    s3Bucket: "ecommerce-media-dev",
    esUrl: "http://localhost:9200",
    stripeKey: "sk_test_xxx",
    paypalClientId: "AYclient-xxx",
    jwtSecret: "dev-jwt-secret-change-in-prod",
    sesRegion: "us-east-1",
    twilioSid: "AC-xxx",
    defaultCurrency: "USD",
    loyaltyPointsPerDollar: 10,
  };
}

function makeFakeProduct(id: string): Product {
  return {
    id,
    sku: `SKU-${id.toUpperCase()}`,
    name: `Running Shoe Model ${id}`,
    categoryId: "cat-shoes",
    basePrice: 9999,
    currency: "USD",
    description: "High-performance running shoe with responsive cushioning.",
    imageKeys: [`products/${id}/main.jpg`],
    attributes: { color: "black", size: "42", brand: "Nike", material: "mesh" },
    tags: ["running", "sport", "shoes", "nike"],
    active: true,
  };
}

function makeFakeOrder(id: string): Order {
  return {
    id,
    userId: "usr-alice",
    items: [
      {
        productId: "prod-001",
        sku: "SKU-PROD-001",
        name: "Running Shoe",
        quantity: 2,
        unitPrice: 9999,
        totalPrice: 19998,
      },
    ],
    shippingAddress: {
      fullName: "Alice Nguyen",
      addressLine1: "123 Le Loi St",
      city: "Ho Chi Minh City",
      state: "HCMC",
      postalCode: "700000",
      country: "VN",
      phone: "+84901234567",
    },
    status: "pending_payment",
    subtotal: 19998,
    shippingCost: 599,
    taxAmount: 1600,
    discountAmount: 0,
    total: 22197,
    currency: "USD",
    paymentId: null,
    trackingNumber: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function makeFakeUser(id: string): User {
  return {
    id,
    email: `${id}@example.com`,
    fullName: "Alice Nguyen",
    phone: "+84901234567",
    tier: "gold",
    loyaltyPoints: 450,
    createdAt: new Date("2024-01-01"),
  };
}

function makeFakeAddress(id: string, userId: string): Address {
  return {
    id,
    userId,
    isDefault: true,
    fullName: "Alice Nguyen",
    addressLine1: "123 Le Loi St",
    city: "Ho Chi Minh City",
    state: "HCMC",
    postalCode: "700000",
    country: "VN",
    phone: "+84901234567",
  };
}
