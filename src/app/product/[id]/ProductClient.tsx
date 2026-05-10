"use client";

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useUI } from '@/context/UIContext';
import { useCart } from '@/context/CartContext';
import { useTranslation } from '@/lib/i18n';
import { useLocale } from '@/context/LocaleContext';
import { Product, ShopifyVariant, RecommendedProduct } from '@/lib/shopify';
import ProductInfoBlock from '@/components/ProductInfoBlock';
import ProductInfoDrawer from '@/components/ProductInfoDrawer';
import { useTranslatedText } from '@/hooks/useTranslatedText';
import RecommendedCard from '@/components/RecommendedCard';
import { useWishlist } from '@/context/WishlistContext';

interface Props {
  product: Product;
}

function TranslatedDesc({ text, className }: { text?: string | null; className?: string }) {
  const translated = useTranslatedText(text);
  if (!translated) return null;
  return <p className={className}>{translated}</p>;
}

export default function ProductClient({ product }: Props) {
  const [recommended, setRecommended] = useState<RecommendedProduct[]>([]);

  useEffect(() => {
    import('@/lib/shopify').then(({ getRecommendedProducts }) => {
      getRecommendedProducts(product.handle, 4)
        .then(setRecommended)
        .catch(() => {});
    });
  }, [product.handle]);
  const images = product.images.length > 0 ? product.images : [product.imageUrl].filter(Boolean);
  const [activeImage, setActiveImage] = useState(0);
  const [displayImageUrl, setDisplayImageUrl] = useState<string>(() => images[0] ?? product.imageUrl);
  const [showMoreDetails, setShowMoreDetails] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<ShopifyVariant>(
    product.variants[0] ?? { id: '', title: '', availableForSale: true, price: { amount: String(product.price), currencyCode: product.currencyCode }, selectedOptions: [] }
  );
  const [adding, setAdding] = useState(false);
  const [activeDrawer, setActiveDrawer] = useState<string | null>(null);
  
  // Notify Me Modal State
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [notifySize, setNotifySize] = useState('');
  const [notifyEmail, setNotifyEmail] = useState('');
  const [notifyConsent1, setNotifyConsent1] = useState(false);
  const [notifyConsent2, setNotifyConsent2] = useState(false);
  const [notifyError, setNotifyError] = useState(false);
  const { t } = useTranslation();
  const { formatPrice } = useLocale();
  const { toggle, has } = useWishlist();
  const inWishlist = has(product.handle);
  const wishlistItem = {
    handle: product.handle,
    title: product.title,
    imageUrl: product.imageUrl,
    price: product.price,
    currencyCode: product.currencyCode,
    collectionTitle: '',
  };
  const [selectedColor, setSelectedColor] = useState<string>(
    () => product.variants[0]?.selectedOptions.find(o => {
      const n = o.name.toLowerCase(); return n === 'color' || n === 'colour';
    })?.value ?? ''
  );
  const [selectedSize, setSelectedSize] = useState<string>(
    () => product.variants[0]?.selectedOptions.find(o =>
      o.name.toLowerCase() === 'size'
    )?.value ?? ''
  );
  const { openCart } = useUI();
  const { addToCart } = useCart();

  const colorOptionName = useMemo(() => {
    for (const v of product.variants)
      for (const o of v.selectedOptions) {
        const n = o.name.toLowerCase();
        if (n === 'color' || n === 'colour') return o.name;
      }
    return null;
  }, []);

  const sizeOptionName = useMemo(() => {
    for (const v of product.variants)
      for (const o of v.selectedOptions)
        if (o.name.toLowerCase() === 'size') return o.name;
    return null;
  }, []);

  const colorOptions = useMemo(() => {
    if (!colorOptionName) return [];
    const seen = new Set<string>();
    const result: { value: string; imageUrl: string }[] = [];
    for (const v of product.variants) {
      const opt = v.selectedOptions.find(o => o.name === colorOptionName);
      if (opt && !seen.has(opt.value)) {
        seen.add(opt.value);
        result.push({ value: opt.value, imageUrl: v.image?.url ?? '' });
      }
    }
    return result;
  }, [colorOptionName]);

  const sizeOptions = useMemo(() => {
    if (!sizeOptionName) return [];
    const seen = new Set<string>();
    const result: string[] = [];
    for (const v of product.variants) {
      const opt = v.selectedOptions.find(o => o.name === sizeOptionName);
      if (opt && !seen.has(opt.value)) { seen.add(opt.value); result.push(opt.value); }
    }
    return result;
  }, [sizeOptionName]);

  const priceFormatted = parseFloat(selectedVariant.price.amount).toLocaleString('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const hasMultipleVariants = product.variants.length > 1;

  async function handleAddToBag() {
    if (!selectedVariant.id || adding) return;
    setAdding(true);
    try {
      await addToCart(selectedVariant.id, 1);
      openCart();
    } finally {
      setAdding(false);
    }
  }

  function findVariant(color: string, size: string): ShopifyVariant | undefined {
    return product.variants.find(v => {
      const c = colorOptionName ? v.selectedOptions.find(o => o.name === colorOptionName)?.value : undefined;
      const s = sizeOptionName ? v.selectedOptions.find(o => o.name === sizeOptionName)?.value : undefined;
      if (colorOptionName && sizeOptionName) return c === color && s === size;
      if (colorOptionName) return c === color;
      if (sizeOptionName) return s === size;
      return false;
    });
  }

  function handleColorChange(colorValue: string) {
    setSelectedColor(colorValue);
    const colorImg = colorOptions.find(c => c.value === colorValue)?.imageUrl;
    if (colorImg) {
      setDisplayImageUrl(colorImg);
      const idx = images.indexOf(colorImg);
      setActiveImage(idx >= 0 ? idx : 0);
    }
    const next = findVariant(colorValue, selectedSize);
    if (next) {
      setSelectedVariant(next);
    } else {
      const fallback = product.variants.find(v =>
        colorOptionName
          ? v.selectedOptions.find(o => o.name === colorOptionName)?.value === colorValue
          : false
      );
      if (fallback) {
        setSelectedVariant(fallback);
        const s = sizeOptionName ? fallback.selectedOptions.find(o => o.name === sizeOptionName)?.value ?? '' : '';
        setSelectedSize(s);
      }
    }
  }

  function handleSizeChange(sizeValue: string) {
    setSelectedSize(sizeValue);
    const next = findVariant(selectedColor, sizeValue);
    if (next) setSelectedVariant(next);
  }

  function isSizeAvailable(size: string): boolean {
    const v = findVariant(selectedColor, size);
    return v?.availableForSale ?? false;
  }

  const STANDARD_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
  const outOfStockSizes = STANDARD_SIZES.filter(size => !isSizeAvailable(size));

  function handleNotifySubmit() {
    if (!notifyEmail || !notifyConsent1) {
      setNotifyError(true);
      return;
    }
    setNotifyError(false);
    // Simulate API call
    setShowNotifyModal(false);
    setNotifySize('');
    setNotifyEmail('');
    setNotifyConsent1(false);
    setNotifyConsent2(false);
  }

  return (
    <>
      <div className="pdp-layout">
        <div className="pdp-gallery">
          <img
            key={displayImageUrl}
            src={displayImageUrl}
            alt={product.title}
            className="pdp-main-img"
          />
        </div>

        <div className="pdp-info">
          <div className="pdp-sticky-block">
            <div className="pdp-title-row">
              <h1 className="pdp-title">{product.title}</h1>
              <span className="pdp-price">{priceFormatted} {selectedVariant.price.currencyCode}</span>
            </div>
            {(selectedColor || selectedVariant.title) && (
              <p className="pdp-colour-label">
                {selectedColor || selectedVariant.title}
              </p>
            )}
          </div>

          <div className="pdp-swatches">
            {colorOptions.length > 0
              ? colorOptions.map((col) => (
                  <button
                    key={col.value}
                    className={`swatch-thumb ${selectedColor === col.value ? 'active' : ''}`}
                    onClick={() => handleColorChange(col.value)}
                    title={col.value}
                  >
                    <img src={col.imageUrl || product.imageUrl} alt={col.value} />
                  </button>
                ))
              : images.map((img, i) => (
                  <button
                    key={i}
                    className={`swatch-thumb ${activeImage === i ? 'active' : ''}`}
                    onClick={() => { setActiveImage(i); setDisplayImageUrl(img); }}
                  >
                    <img src={img} alt={`View ${i + 1}`} />
                  </button>
                ))
            }
          </div>

          {sizeOptions.length > 0 ? (
            <>
              <div className="pdp-sizes">
                {STANDARD_SIZES.map((size) => {
                  const available = isSizeAvailable(size);
                  return (
                    <button
                      key={size}
                      className={`pdp-size-btn${selectedSize === size ? ' active' : ''}${!available ? ' sold-out' : ''}`}
                      onClick={() => available ? handleSizeChange(size) : undefined}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
              {outOfStockSizes.length > 0 && (
                <p className="pdp-out-of-stock">
                  Out of stock? <button className="pdp-notify-link" onClick={() => setShowNotifyModal(true)}>Get notified</button>
                </p>
              )}
            </>
          ) : hasMultipleVariants && (
            <div className="pdp-variants">
              {product.variants.map((v) => (
                <button
                  key={v.id}
                  className={`pdp-variant-btn ${selectedVariant.id === v.id ? 'active' : ''} ${!v.availableForSale ? 'sold-out' : ''}`}
                  onClick={() => setSelectedVariant(v)}
                  disabled={!v.availableForSale}
                >
                  {v.title}
                </button>
              ))}
            </div>
          )}

          <div className="pdp-atb-row">
            <button
              className="pdp-atb-btn"
              onClick={handleAddToBag}
              disabled={adding || !selectedVariant.availableForSale}
            >
              {adding ? t('common.adding') : selectedVariant.availableForSale ? t('common.addToBag') : t('common.soldOut')}
            </button>
            <button className="pdp-wish-btn" aria-label="Add to wishlist" onClick={() => toggle(wishlistItem)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill={inWishlist ? '#111' : 'none'} stroke="#111" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </button>
          </div>

          <ProductInfoBlock
            title={t('common.freeDelivery')}
            badge={t('common.enterPostalCode')}
            subtitle={t('common.deliveryEstimate')}
            onClick={() => setActiveDrawer('delivery')}
          />
          <ProductInfoBlock
            title={t('common.giftWrapping')}
            subtitle={t('common.giftWrappingDesc')}
            borderBottom
            onClick={() => setActiveDrawer('gift')}
          />

          <ProductInfoDrawer
            isOpen={activeDrawer === 'delivery'}
            onClose={() => setActiveDrawer(null)}
            title={t('common.drawerDeliveryTitle')}
          >
            {product.description && (
              <TranslatedDesc text={product.description} />
            )}
            <p><strong>{t('common.drawerDeliveryLabel')}</strong><br />{t('common.drawerDeliveryBody')}</p>
            <p style={{ marginTop: '16px' }}><strong>{t('common.drawerReturnsLabel')}</strong><br />{t('common.drawerReturnsBody')}</p>
          </ProductInfoDrawer>

          <ProductInfoDrawer
            isOpen={activeDrawer === 'gift'}
            onClose={() => setActiveDrawer(null)}
            title={t('common.drawerGiftTitle')}
            heroImage="/logotipo.png"
          >
            <p>{t('common.drawerGiftBody')}</p>
            <p style={{ marginTop: '14px' }}>{t('common.drawerGiftNote1')}</p>
            <p style={{ marginTop: '14px' }}>{t('common.drawerGiftNote2')}</p>
          </ProductInfoDrawer>

          <div className="pdp-desc-wrapper">
            <TranslatedDesc text={product.description} className={`pdp-desc${showMoreDetails ? ' expanded' : ''}`} />
            {product.description && product.description.length > 200 && (
              <>
                {!showMoreDetails && <div className="pdp-desc-blur" />}
                <button className="pdp-show-more" onClick={() => setShowMoreDetails(prev => !prev)}>
                  {showMoreDetails ? 'Show less' : 'Show more'}
                </button>
              </>
            )}
          </div>

          <div className="pdp-need-help">
            <Link href="/contact">{t('common.needHelp')}</Link>
          </div>
        </div>
      </div>

      {/* ── RECOMMENDED SECTION ── */}
      {recommended.length > 0 && (
        <section className="rec-section">
          <p className="rec-label">{t('common.recommended')}</p>
          <div className="rec-grid">
            {recommended.map((p) => (
              <RecommendedCard key={p.handle} product={p} />
            ))}
          </div>
        </section>
      )}



      {showNotifyModal && (
        <div className="notify-modal-backdrop" onClick={() => setShowNotifyModal(false)}>
          <div className="notify-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="notify-modal-header">
              <span className="notify-modal-title">NOTIFY ME</span>
              <button className="notify-modal-close" onClick={() => setShowNotifyModal(false)}>X CLOSE</button>
            </div>
            <div className="notify-modal-body">
              <p className="notify-modal-desc">Select your size and we will email you when this product is back in stock.</p>
              
              <div className="notify-sizes-grid">
                {outOfStockSizes.map((size) => (
                  <button 
                    key={size}
                    className={`notify-size-btn ${notifySize === size ? 'active' : ''}`}
                    onClick={() => setNotifySize(size)}
                  >
                    {size}
                  </button>
                ))}
              </div>

              <div className={`notify-input-group ${notifyError && !notifyEmail ? 'has-error' : ''}`}>
                <input 
                  type="email" 
                  placeholder="EMAIL ADDRESS" 
                  className="notify-email-input" 
                  value={notifyEmail}
                  onChange={(e) => {
                    setNotifyEmail(e.target.value);
                    if (notifyError && e.target.value) setNotifyError(false);
                  }}
                />
                {notifyError && !notifyEmail && <span className="notify-error-text">This field is required.</span>}
              </div>

              <div className="notify-checkbox-group">
                <label className="notify-checkbox-label">
                  <input type="checkbox" checked={notifyConsent1} onChange={(e) => {
                    setNotifyConsent1(e.target.checked);
                    if (notifyError && e.target.checked) setNotifyError(false);
                  }} />
                  <span className="checkmark"></span>
                  <span className="checkbox-text">
                    I confirm that I have read and understood the <a href="/privacy">Privacy Policy</a>
                  </span>
                </label>
                {notifyError && !notifyConsent1 && <span className="notify-error-text" style={{marginLeft: '32px', display: 'block', marginTop: '-12px', marginBottom: '12px'}}>Privacy Policy consent is required.</span>}
                
                <label className="notify-checkbox-label">
                  <input type="checkbox" checked={notifyConsent2} onChange={(e) => setNotifyConsent2(e.target.checked)} />
                  <span className="checkmark"></span>
                  <span className="checkbox-text">
                    I would like to receive updates about new launches and other inspirational content
                  </span>
                </label>
              </div>

              <p className="notify-recaptcha">
                This site is protected by reCAPTCHA and the Google <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer">Privacy Policy</a> and <a href="https://policies.google.com/terms" target="_blank" rel="noreferrer">Terms of Service</a> apply.
              </p>

              <button 
                className="notify-submit-btn"
                onClick={handleNotifySubmit}
              >
                NOTIFY ME
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .pdp-layout {
          display: grid;
          grid-template-columns: 1fr;
          font-family: 'HK Grotesk', 'Inter', sans-serif;
          font-size: 11px;
          font-weight: 400;
          color: #000;
        }

        .pdp-gallery {
          background: #ffffff;
        }
        .pdp-main-img {
          width: 100%;
          aspect-ratio: 2 / 3;
          height: auto;
          object-fit: contain;
          display: block;
          background: #ffffff;
        }

        .pdp-info {
          padding: 24px 20px 120px 20px;
        }

        .pdp-title-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 6px;
          gap: 16px;
        }
        .pdp-title {
          font-size: 14px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.07em;
          line-height: 1.2;
          margin: 0;
          flex: 1;
        }
        .pdp-price {
          font-size: 13px;
          font-weight: 400;
          letter-spacing: 0.03em;
          white-space: nowrap;
        }
        .pdp-colour-label { margin: 5px 0 14px 0; font-size: 11px; font-weight: 400; color: #555; text-transform: uppercase; letter-spacing: 0.10em; }

        .pdp-swatches {
          display: flex;
          gap: 0;
          margin-bottom: 16px;
          flex-wrap: wrap;
          border: 1px solid #e0e0e0;
          width: fit-content;
        }
        .swatch-thumb {
          width: 53px;
          height: 84px;
          padding: 0;
          border: 2px solid transparent;
          border-right: 1px solid #e0e0e0;
          border-radius: 0;
          cursor: pointer;
          background: #f5f5f5;
          transition: border-color 0.15s;
          flex-shrink: 0;
          box-sizing: border-box;
          overflow: hidden;
        }
        .swatch-thumb:last-child { border-right: none; }
        .swatch-thumb.active { border: 2px solid #99bbff; }
        .swatch-thumb img { width: 100%; height: 100%; object-fit: contain; display: block; background: #f5f5f5; border-radius: 0; }

        /* SIZE SELECTOR — Tonet Paris style */
        .pdp-sizes {
          display: flex;
          flex-wrap: wrap;
          margin: 12px 0 20px;
          border: 1px solid #e0e0e0;
        }
        .pdp-size-btn {
          flex: 1 0 auto;
          padding: 12px 16px;
          font-size: 11px;
          font-family: inherit;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          border: none;
          border-right: 1px solid #e0e0e0;
          border-radius: 0;
          background: #ffffff;
          cursor: pointer;
          color: #111;
          min-width: 44px;
          text-align: center;
          transition: background 0.12s, box-shadow 0.12s;
        }
        .pdp-size-btn:last-child { border-right: none; }
        .pdp-size-btn:hover:not(.sold-out):not(.active) { background: #f5f5f5; }
        .pdp-size-btn.active { background: #99bbff; color: #111; box-shadow: inset 0 0 0 2px #6699ee; border-radius: 0; }
        .pdp-size-btn.sold-out { color: #ccc; cursor: not-allowed; text-decoration: line-through; }

        .pdp-out-of-stock {
          font-size: 10px;
          font-weight: 400;
          letter-spacing: 0.06em;
          color: #666;
          margin: -8px 0 18px;
        }
        .pdp-notify-link { 
          color: #0000cc; 
          text-decoration: none; 
          background: none; 
          border: none; 
          padding: 0; 
          font: inherit; 
          cursor: pointer; 
        }
        .pdp-notify-link:hover { text-decoration: underline; }

        /* NOTIFY MODAL */
        .notify-modal-backdrop {
          position: fixed;
          top: 0; left: 0; width: 100vw; height: 100vh;
          background: rgba(0,0,0,0.4);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .notify-modal-content {
          background: #fff;
          width: 100%;
          max-width: 440px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.1);
          font-family: 'HK Grotesk', 'Inter', sans-serif;
        }
        .notify-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid #e0e0e0;
        }
        .notify-modal-title {
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.1em;
        }
        .notify-modal-close {
          background: none; border: none; cursor: pointer;
          font-size: 11px; font-weight: 500; color: #0000cc;
          letter-spacing: 0.05em; padding: 0;
        }
        .notify-modal-body {
          padding: 24px 20px;
        }
        .notify-modal-desc {
          font-size: 12px;
          line-height: 1.5;
          margin: 0 0 20px 0;
          color: #111;
        }
        .notify-sizes-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: -1px; /* To overlap borders */
          border: 1px solid #e0e0e0;
          margin-bottom: 24px;
        }
        .notify-size-btn {
          background: #fff;
          border: 1px solid #e0e0e0;
          padding: 14px;
          font-size: 12px;
          text-align: left;
          cursor: pointer;
          color: #111;
          margin-top: -1px;
          margin-left: -1px;
        }
        .notify-size-btn:hover { background: #f5f5f5; }
        .notify-size-btn.active { background: #f5f5f5; font-weight: 500; }
        
        .notify-input-group {
          margin-bottom: 20px;
        }
        .notify-email-input {
          width: 100%;
          padding: 14px 16px;
          font-size: 11px;
          border: 1px solid #ccc;
          outline: none;
          font-family: inherit;
          text-transform: uppercase;
        }
        .notify-email-input::placeholder { color: #888; }
        .notify-input-group.has-error .notify-email-input {
          border-color: #d0021b;
          color: #d0021b;
        }
        .notify-input-group.has-error .notify-email-input::placeholder {
          color: #d0021b;
        }
        .notify-error-text {
          color: #d0021b;
          font-size: 10px;
          margin-top: 6px;
          display: block;
        }
        .notify-checkbox-group {
          margin-bottom: 20px;
        }
        .notify-checkbox-label {
          display: flex;
          align-items: flex-start;
          margin-bottom: 16px;
          cursor: pointer;
          font-size: 11px;
          line-height: 1.5;
          color: #111;
          position: relative;
        }
        .notify-checkbox-label input {
          position: absolute; opacity: 0; cursor: pointer; height: 0; width: 0;
        }
        .notify-checkbox-label .checkmark {
          min-width: 18px;
          height: 18px;
          border: 1px solid #999;
          margin-right: 12px;
          display: flex; align-items: center; justify-content: center;
          margin-top: -1px;
        }
        .notify-checkbox-label input:checked ~ .checkmark {
          background: #111; border-color: #111;
        }
        .notify-checkbox-label input:checked ~ .checkmark:after {
          content: "";
          width: 4px; height: 8px;
          border: solid white;
          border-width: 0 1.5px 1.5px 0;
          transform: rotate(45deg);
          margin-bottom: 2px;
        }
        .notify-checkbox-label a { color: #0000cc; text-decoration: underline; }
        
        .notify-recaptcha {
          font-size: 9px;
          color: #666;
          line-height: 1.4;
          margin-bottom: 24px;
        }
        .notify-recaptcha a { color: #0000cc; text-decoration: underline; }

        .notify-submit-btn {
          width: 100%;
          background: #000;
          color: #fff;
          border: none;
          padding: 16px;
          font-size: 11px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          cursor: pointer;
        }
        .notify-submit-btn:hover { background: #222; }

        /* Fallback variant buttons */
        .pdp-variants {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin: 12px 0 20px;
        }
        .pdp-variant-btn {
          padding: 8px 14px;
          font-size: 11px;
          font-family: inherit;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          border: 1px solid #ccc;
          background: #ffffff;
          cursor: pointer;
          transition: border-color 0.2s, background 0.2s;
        }
        .pdp-variant-btn.active { border-color: #000; background: #000; color: #fff; }
        .pdp-variant-btn.sold-out { opacity: 0.4; cursor: not-allowed; }
        .pdp-variant-btn:hover:not(.sold-out):not(.active) { border-color: #000; }

        .pdp-atb-row {
          display: flex;
          height: 50px;
          margin-bottom: 36px;
          border: 1px solid #111;
        }
        .pdp-atb-btn {
          flex: 1;
          background: #111;
          color: #fff;
          border: none;
          border-radius: 0;
          padding: 0 24px;
          font-size: 11px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.16em;
          line-height: 1.2;
          cursor: pointer;
          font-family: inherit;
          transition: opacity 0.2s;
        }
        .pdp-atb-btn:hover { opacity: 0.85; }
        .pdp-wish-btn {
          width: 50px;
          align-self: stretch;
          border: none;
          border-left: 1px solid #111;
          border-radius: 0;
          background: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          flex-shrink: 0;
          padding: 0;
        }


        .pdp-desc-wrapper { position: relative; margin: 20px 0 0 0; }
        .pdp-desc {
          font-size: 12px;
          font-weight: 400;
          line-height: 1.75;
          letter-spacing: 0.01em;
          margin: 0;
          display: -webkit-box;
          -webkit-line-clamp: 4;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .pdp-desc.expanded {
          display: block;
          -webkit-line-clamp: unset;
          overflow: visible;
        }
        .pdp-desc-blur {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 48px;
          background: linear-gradient(to bottom, transparent, rgba(255,255,255,0.95));
          pointer-events: none;
        }
        .pdp-details { list-style: none; padding: 0; margin: 0 0 8px 0; font-size: 11px; font-weight: 400; line-height: 1.9; letter-spacing: 0.02em; }
        .pdp-details .faded { color: #bbb; }
        .pdp-show-more {
          background: none; border: none; color: #0000cc;
          font-size: 11px; font-weight: 400; padding: 0; cursor: pointer; font-family: inherit; margin-bottom: 24px; letter-spacing: 0.04em;
        }
        .pdp-need-help a { color: #0000cc; font-size: 11px; font-weight: 400; letter-spacing: 0.04em; text-decoration: none; }
        .pdp-need-help a:hover { text-decoration: underline; }

        @media (min-width: 768px) {
          .pdp-breadcrumb {
            padding-top: 70px;
            padding-left: 0;
          }

          .pdp-layout {
            grid-template-columns: 1fr 1fr;
            align-items: start;
          }

          .pdp-main-img {
            width: 100%;
            height: calc(100vh - 60px);
            object-fit: contain;
            position: sticky;
            top: 60px;
            background: #ffffff;
          }

          .pdp-info {
            position: sticky;
            top: 100px;
            padding: 0 48px 80px 48px;
            max-height: calc(100vh - 100px);
            overflow-y: auto;
            scrollbar-width: none;
          }
          .pdp-info::-webkit-scrollbar { display: none; }

          .pdp-sticky-block {
            position: sticky;
            top: 0;
            z-index: 5;
            background: #ffffff;
            padding-top: 40px;
            padding-bottom: 12px;
            margin: 0 -48px;
            padding-left: 48px;
            padding-right: 48px;
          }

          .pdp-atb-row {
            position: sticky;
            top: 114px;
            z-index: 4;
            background: #ffffff;
            margin-bottom: 36px;
          }


        }

        /* ── RECOMMENDED ── */
        .rec-section {
          padding: 48px 24px 80px;
          font-family: 'HK Grotesk', 'Inter', sans-serif;
        }
        .rec-label {
          font-size: 11px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          color: #111;
          margin: 0 0 24px;
        }
        .rec-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0;
        }
        @media (max-width: 767px) {
          .rec-section { padding: 32px 0 100px; }
          .rec-label { padding-left: 16px; }
          .rec-grid { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>
    </>
  );
}
