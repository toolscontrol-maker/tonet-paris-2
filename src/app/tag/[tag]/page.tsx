import Link from 'next/link';
import { getProductsByTag } from '@/lib/shopify';

export const dynamic = 'force-dynamic';

const TAG_LABELS: Record<string, string> = {
  'new-in': 'New In',
  runway: 'Runway',
  mujer: 'Mujer',
  hombre: 'Hombre',
  daily: 'Daily',
};

export default async function TagPage({
  params,
}: {
  params: Promise<{ tag: string }>;
}) {
  const { tag } = await params;
  const products = await getProductsByTag(tag);
  const label = TAG_LABELS[tag] ?? tag;

  return (
    <>
      <section className="tag-section">
        <div className="tag-header">
          <h1 className="tag-title">{label}</h1>
          {products.length > 0 && (
            <span className="tag-count">{products.length} pieces</span>
          )}
        </div>

        {products.length === 0 ? (
          <div className="tag-empty">
            <p>No hay productos en esta categoría aún.</p>
            <Link href="/" className="tag-back">← Volver al inicio</Link>
          </div>
        ) : (
          <div className="shop-grid">
            {products.map((product) => (
              <Link
                key={product.handle}
                href={`/product/${product.handle}`}
                className="shop-col shop-col-link"
              >
                <div className="shop-col-label">
                  {product.title}
                  <span className="shop-now-suffix"> › SHOP NOW</span>
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
        )}
      </section>

      <style>{`
        .tag-section {
          background: #ffffff;
          min-height: 80vh;
          padding-top: 80px;
        }

        .tag-header {
          display: flex;
          align-items: baseline;
          gap: 16px;
          padding: 32px 20px 16px;
          border-bottom: 1px solid #ededed;
        }

        .tag-title {
          font-family: var(--font-brand);
          font-size: clamp(2rem, 5vw, 4rem);
          font-weight: normal;
          letter-spacing: 0.02em;
          color: #000;
          margin: 0;
          line-height: 1;
        }

        .tag-count {
          font-size: 11px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.10em;
          color: #888;
        }

        .tag-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
          padding: 80px 20px;
          color: #888;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .tag-back {
          font-size: 11px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.10em;
          color: #000;
          text-decoration: none;
          border-bottom: 1px solid #000;
          padding-bottom: 2px;
        }

        .shop-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
        }

        .shop-col { min-width: 0; }
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

        .shop-now-suffix { display: none; }
        .shop-col:hover .shop-now-suffix { display: inline; }

        .shop-product {
          display: block;
          padding: 32px 15% 0;
          text-decoration: none;
        }

        .shop-product-img {
          width: 100%;
          aspect-ratio: 2 / 3;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .shop-product-img img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        @media (max-width: 767px) {
          .tag-section { padding-top: 60px; }
          .shop-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .shop-col-label {
            font-size: 0.6875rem;
            padding: 10px 12px;
          }
          .shop-product { padding: 24px 10% 20px; }
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
