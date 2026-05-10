import Link from 'next/link';
import { getProducts } from '@/lib/shopify';
import HeroSection from '@/components/HeroSection';

export const dynamic = 'force-dynamic';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default async function Home() {
  const products = shuffle(await getProducts());

  return (
    <>
      {/* ─── HERO: randomized images from /public/hero/ ─── */}
      <HeroSection />

      {/* ─── PRODUCTS SECTION ─── */}
      <section className="shop-section" id="gallery">
        <div className="shop-grid">
          {products.slice(0, 4).map((product) => (
            <Link
              key={product.handle}
              href={`/product/${product.handle}`}
              className="shop-col shop-col-link"
            >
              <div className="shop-col-label">
                {product.title}<span className="shop-now-suffix"> › SHOP NOW</span>
              </div>
              {product.imageUrl && (
                <div className="shop-product shop-product--collection">
                  <div className="shop-product-img">
                    <img src={product.imageUrl} alt={product.title} />
                  </div>
                </div>
              )}
            </Link>
          ))}
        </div>
      </section>

      <style>{`
        /* ═══════════════════════════════════════════════════
           HERO — 2 blocks of 125vh, Tonet Paris style
        ═══════════════════════════════════════════════════ */

        /* Force the hero to start at the very top with no gap */
        body { padding-top: 0 !important; }
        main { margin-top: 0 !important; padding-top: 0 !important; }

        .hero-wrapper {
          display: flex;
          flex-direction: column;
          margin-top: 0;
        }

        .hero-block {
          position: relative;
          height: 125vh;
          overflow: hidden;
          contain: paint;
        }

        .hero-block--split { display: flex; }
        .hero-block--full  { display: flex; }

        .hero-panel {
          flex: 1;
          display: block;
          position: relative;
          background-size: cover;
          background-position: center top;
          text-decoration: none;
          transition: filter 0.4s ease, transform 0.8s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
          will-change: transform;
          transform: translateZ(0);
        }

        .hero-panel:hover {
          filter: brightness(0.88);
          transform: scale(1.03) translateZ(0);
        }

        .shop-label {
          position: absolute;
          top: 120px;
          left: 20px;
          color: rgba(255,255,255,0.92);
          font-size: 0.7rem;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          z-index: 10;
        }

        /* Sticky brand anchor */
        .hero-brand-anchor {
          position: sticky;
          top: 50vh;
          height: 0;
          overflow: visible;
          z-index: 6;
          pointer-events: none;
          margin-bottom: 15vh;
        }

        .hero-brand-text {
          position: absolute;
          top: 0;
          left: 50%;
          transform: translate(-50%, -50%);
          font-family: var(--font-brand);
          font-size: clamp(2rem, 16vw, 18rem);
          font-weight: normal;
          color: #000;
          white-space: nowrap;
          letter-spacing: -0.02em;
          pointer-events: none;
        }

        .hero-block--split .hero-panel + .hero-panel {
          border-left: 1px solid rgba(255,255,255,0.12);
        }

        /* ═══════════════════════════════════════════════════
           PRODUCT SECTION — 4 columns, Tonet Paris style
        ═══════════════════════════════════════════════════ */

        .shop-section {
          background: #ffffff;
          position: relative;
          z-index: 10;
          margin-bottom: 0;
          padding-bottom: 0;
        }

        .shop-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
        }

        .shop-col {
          min-width: 0;
        }
        .shop-col-link {
          display: block;
          text-decoration: none;
          color: inherit;
        }
        .shop-col-link:hover { opacity: 1; }
        .shop-product--collection { cursor: pointer; }

        .shop-col-label {
          position: relative;
          padding: 12px 16px;
          font-size: 0.82rem;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: #000;
          text-align: left;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .shop-now-suffix {
          display: none;
        }

        .shop-col:hover .shop-now-suffix {
          display: inline;
        }

        .shop-product {
          display: block;
          padding: 32px 15% 0;
          text-decoration: none;
        }

        /* Image wrapper: portrait 3:4 ratio, float-like appearance */
        .shop-product-img {
          width: 100%;
          aspect-ratio: 3 / 4;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .shop-product-img img {
          width: 100%;
          height: 100%;
          object-fit: contain;   /* show full product, floating look */
          transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .shop-product:hover .shop-product-img img {
          transform: scale(1.04);
        }



        .shop-col-empty {
          height: 400px;
        }

        /* ═══════════════════════════════════════════════════
           MOBILE — 2 columns, labels not sticky
        ═══════════════════════════════════════════════════ */
        @media (max-width: 767px) {
          .shop-col {
            flex: 0 0 50vw;
            width: 50vw;
          }
          /* Hero */
          .hero-block { height: auto; }
          .hero-block--split { flex-direction: column; }
          .hero-block--split .hero-panel { height: 125vw; flex: none; }
          .hero-block--full  .hero-panel { height: 125vw; }
          .hero-brand-text { font-size: 20vw; }
          .hero-brand-anchor { margin-bottom: 8vh; }
          .shop-label { top: 80px; }

          /* Shop grid: 2 columns */
          .shop-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .shop-col-label {
            font-size: 0.6875rem;
            padding: 10px 12px;
          }

          .shop-product {
            padding: 24px 10% 20px;
          }
        }

        @media (min-width: 768px) and (max-width: 1024px) {
          .shop-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
      `}</style>
    </>
  );
}
