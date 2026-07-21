export type CategorySlug =
  | "electronics"
  | "clothing"
  | "books"
  | "accessories"
  | "home-living"
  | "miscellaneous";

export type Product = {
  id: string;
  slug: string;
  name: string;
  sku: string;
  category: CategorySlug;
  shortDescription: string;
  description: string;
  priceCents: number;
  discountCents?: number;
  stock: number;
  featured?: boolean;
  rating: number;
  image: string;
  imagePosition: string;
};

export const categories = [
  { slug: "electronics", name: "Electronics", icon: "Headphones", description: "Smart essentials for work and play." },
  { slug: "clothing", name: "Clothing", icon: "Shirt", description: "Easy layers made for everyday life." },
  { slug: "books", name: "Books", icon: "BookOpen", description: "Stories and ideas worth keeping." },
  { slug: "accessories", name: "Accessories", icon: "Watch", description: "The useful finishing touches." },
  { slug: "home-living", name: "Home & Living", icon: "Lamp", description: "Warm pieces for calmer spaces." },
  { slug: "miscellaneous", name: "Curious Finds", icon: "Sparkles", description: "Unexpected things you will love." },
] as const;

const A = "/images/randommart-products-a.png";
const B = "/images/randommart-products-b.png";

export const products: Product[] = [
  { id: "p01", slug: "cloud-comfort-headphones", name: "Cloud Comfort Headphones", sku: "EL-HEAD-101", category: "electronics", shortDescription: "Soft over-ear sound for focused days.", description: "Balanced wireless listening with plush ear cushions, a lightweight fit, and up to 30 hours of demo battery life.", priceCents: 12900, discountCents: 9900, stock: 18, featured: true, rating: 4.8, image: A, imagePosition: "18% 34%" },
  { id: "p02", slug: "navy-pocket-speaker", name: "Navy Pocket Speaker", sku: "EL-SPKR-204", category: "electronics", shortDescription: "Room-filling sound in a compact shape.", description: "A durable portable speaker designed for desks, picnics, and unhurried weekends.", priceCents: 7900, stock: 24, featured: true, rating: 4.7, image: A, imagePosition: "78% 32%" },
  { id: "p03", slug: "everyday-smart-watch", name: "Everyday Smart Watch", sku: "EL-WAT-310", category: "electronics", shortDescription: "A clean companion for movement and time.", description: "A simple fitness and notification companion with an understated navy band.", priceCents: 15900, discountCents: 13900, stock: 7, rating: 4.6, image: A, imagePosition: "62% 74%" },
  { id: "p04", slug: "linen-button-shirt", name: "Linen Button Shirt", sku: "CL-SHRT-112", category: "clothing", shortDescription: "Relaxed texture, polished shape.", description: "A breathable everyday shirt with a soft hand-feel and easy, structured collar.", priceCents: 5400, stock: 32, featured: true, rating: 4.9, image: B, imagePosition: "25% 62%" },
  { id: "p05", slug: "harvest-knit-sweater", name: "Harvest Knit Sweater", sku: "CL-KNIT-227", category: "clothing", shortDescription: "A warm knit in our signature tangerine.", description: "A softly textured crewneck made for cool mornings and slow evenings.", priceCents: 6800, discountCents: 5900, stock: 11, rating: 4.8, image: B, imagePosition: "74% 60%" },
  { id: "p06", slug: "weekend-canvas-tote", name: "Weekend Canvas Tote", sku: "CL-TOTE-319", category: "clothing", shortDescription: "Carry-all capacity without the bulk.", description: "A sturdy, washable tote with an inside pocket and reinforced straps.", priceCents: 3200, stock: 40, rating: 4.5, image: B, imagePosition: "91% 24%" },
  { id: "p07", slug: "quiet-rooms", name: "Quiet Rooms", sku: "BK-DES-118", category: "books", shortDescription: "A visual guide to restorative interiors.", description: "A clothbound design book about light, texture, and making space for calm.", priceCents: 3900, stock: 15, featured: true, rating: 4.9, image: B, imagePosition: "58% 88%" },
  { id: "p08", slug: "small-rituals", name: "Small Rituals", sku: "BK-LIFE-202", category: "books", shortDescription: "Thoughtful practices for everyday focus.", description: "An illustrated collection of simple routines for more intentional days.", priceCents: 2400, discountCents: 1900, stock: 26, rating: 4.7, image: B, imagePosition: "68% 90%" },
  { id: "p09", slug: "field-notes-set", name: "Field Notes Set", sku: "BK-NOTE-303", category: "books", shortDescription: "Three tactile notebooks for fresh ideas.", description: "A trio of lay-flat notebooks in sage, cream, and warm sand covers.", priceCents: 1800, stock: 0, rating: 4.4, image: B, imagePosition: "55% 90%" },
  { id: "p10", slug: "amber-day-sunglasses", name: "Amber Day Sunglasses", sku: "AC-SUN-114", category: "accessories", shortDescription: "Warm-toned frames with timeless lines.", description: "Lightweight amber frames with UV400 lenses and a soft travel pouch.", priceCents: 4600, discountCents: 3900, stock: 21, featured: true, rating: 4.8, image: A, imagePosition: "24% 81%" },
  { id: "p11", slug: "minimal-leather-wallet", name: "Minimal Leather Wallet", sku: "AC-WAL-208", category: "accessories", shortDescription: "Slim storage for daily essentials.", description: "A compact card wallet made with responsibly sourced full-grain leather.", priceCents: 3800, stock: 13, rating: 4.6, image: A, imagePosition: "45% 86%" },
  { id: "p12", slug: "woven-catchall-basket", name: "Woven Catchall Basket", sku: "AC-BSK-311", category: "accessories", shortDescription: "Natural texture for small belongings.", description: "A hand-finished woven tray for entryways, shelves, or bedside tables.", priceCents: 2900, stock: 6, rating: 4.7, image: B, imagePosition: "86% 18%" },
  { id: "p13", slug: "orb-table-lamp", name: "Orb Table Lamp", sku: "HM-LAMP-105", category: "home-living", shortDescription: "Soft light in a sculptural silhouette.", description: "A dimmable warm-white lamp with a matte cream base and touch control.", priceCents: 8900, discountCents: 7500, stock: 9, featured: true, rating: 4.9, image: B, imagePosition: "52% 19%" },
  { id: "p14", slug: "sage-studio-vase", name: "Sage Studio Vase", sku: "HM-VASE-219", category: "home-living", shortDescription: "A quiet green accent for every shelf.", description: "A hand-glazed ceramic vase; subtle variations make every piece unique.", priceCents: 4200, stock: 17, rating: 4.8, image: B, imagePosition: "15% 21%" },
  { id: "p15", slug: "textured-cushion-cover", name: "Textured Cushion Cover", sku: "HM-CUSH-328", category: "home-living", shortDescription: "Subtle weave, instant warmth.", description: "A 45 cm woven cushion cover with a hidden zip and washable finish.", priceCents: 2600, stock: 28, rating: 4.5, image: B, imagePosition: "74% 60%" },
  { id: "p16", slug: "morning-pour-carafe", name: "Morning Pour Carafe", sku: "HM-CAR-414", category: "home-living", shortDescription: "Clear lines for the daily table.", description: "A heat-resistant glass carafe sized for coffee, tea, or chilled water.", priceCents: 3600, stock: 19, rating: 4.6, image: B, imagePosition: "46% 25%" },
  { id: "p17", slug: "desktop-focus-timer", name: "Desktop Focus Timer", sku: "MS-TIME-116", category: "miscellaneous", shortDescription: "A satisfying turn toward focused time.", description: "A silent mechanical desk timer with a bold, readable face.", priceCents: 2800, stock: 8, rating: 4.7, image: A, imagePosition: "60% 74%" },
  { id: "p18", slug: "mini-travel-chess", name: "Mini Travel Chess", sku: "MS-GAME-225", category: "miscellaneous", shortDescription: "A pocket-sized game for slow moments.", description: "A magnetic folding chess set in warm beech and dark-stained wood.", priceCents: 3400, stock: 14, rating: 4.6, image: B, imagePosition: "61% 83%" },
  { id: "p19", slug: "cable-calm-kit", name: "Cable Calm Kit", sku: "MS-CABL-337", category: "miscellaneous", shortDescription: "A tidier desk in five small pieces.", description: "Reusable clips and wraps that keep charging cables easy to find.", priceCents: 1600, discountCents: 1200, stock: 37, rating: 4.5, image: A, imagePosition: "76% 72%" },
  { id: "p20", slug: "pocket-tool-card", name: "Pocket Tool Card", sku: "MS-TOOL-441", category: "miscellaneous", shortDescription: "Twelve tiny tools in one flat companion.", description: "A travel-friendly stainless tool card for simple everyday fixes.", priceCents: 2200, stock: 5, rating: 4.4, image: A, imagePosition: "52% 76%" },
];

export const productBySlug = (slug: string) => products.find((product) => product.slug === slug);
export const productById = (id: string) => products.find((product) => product.id === id);
export const categoryName = (slug: string) => categories.find((category) => category.slug === slug)?.name ?? slug;

export function formatMoney(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}
