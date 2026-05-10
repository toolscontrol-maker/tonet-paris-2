"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUI } from "@/context/UIContext";
import { useCart } from "@/context/CartContext";
import { useTranslation } from "@/lib/i18n";
import { useAuth } from "@/context/AuthContext";

export default function Navbar() {
  const { openCart, openSearch, openMenu } = useUI();
  const { cartCount } = useCart();
  const { t } = useTranslation();
  const { user } = useAuth();
  const pathname = usePathname();
  const accountHref = user ? '/account' : '/login';
  const accountLabel = user ? user.firstName : t('nav.account');

  const isHome = pathname === "/";
  const isProduct = pathname.startsWith("/product/");
  const isCollection = pathname.startsWith("/collection/");
  const isTag = pathname.startsWith("/tag/");
  const hasSubnav = isProduct || isCollection;

  const [collections, setCollections] = useState<{handle: string; title: string}[]>([]);
  useEffect(() => {
    if (!hasSubnav) return;
    const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
    const token = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_PUBLIC_TOKEN;
    if (!domain || !token) return;
    fetch(`https://${domain}/api/2024-10/graphql.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Shopify-Storefront-Access-Token': token },
      body: JSON.stringify({ query: '{ collections(first: 10) { edges { node { handle title } } } }' }),
    })
      .then(r => r.json())
      .then(d => setCollections(d.data?.collections?.edges?.map((e: any) => ({ handle: e.node.handle, title: e.node.title })) ?? []))
      .catch(() => {});
  }, [hasSubnav]);

  const currentCollectionHandle = isCollection ? pathname.split('/collection/')[1]?.split('/')[0] : '';
  const [subnavOpen, setSubnavOpen] = useState(false);
  const currentCollection = collections.find(c => c.handle === currentCollectionHandle);

  // All pages now start below the header, ensuring it doesn't overlap content.
  useEffect(() => {
    const body = document.body;
    if (isHome) {
      body.style.paddingTop = '0';
    } else {
      body.style.paddingTop = hasSubnav ? "87px" : "47px";
    }

    return () => {
      body.style.paddingTop = "47px";
    };
  }, [hasSubnav, isHome]);

  const solid = true;

  return (
    <>
      <header className={`acne-header ${solid ? "solid" : "transparent"}`}>
        <div className="acne-header-inner">
          {/* LEFT: Nav links (desktop) | Hamburger (mobile) */}
          <div className="acne-nav-left">
            <nav className="acne-nav-links desktop-only">
              <Link href="/tag/new-in" className={isTag && pathname.includes('/tag/new-in') ? 'nav-active' : ''}>New In</Link>
              <Link href="/tag/mujer" className={isTag && pathname.includes('/tag/mujer') ? 'nav-active' : ''}>Mujer</Link>
              <Link href="/tag/hombre" className={isTag && pathname.includes('/tag/hombre') ? 'nav-active' : ''}>Hombre</Link>
              <Link href="/tag/runway" className={isTag && pathname.includes('/tag/runway') ? 'nav-active' : ''}>Runway</Link>
              <Link href="/tag/daily" className={isTag && pathname.includes('/tag/daily') ? 'nav-active' : ''}>Daily</Link>
            </nav>
            <div className="acne-mobile-left mobile-only">
              <button className="acne-icon-btn" aria-label="Menu" onClick={openMenu}>
                <svg width="18" height="12" viewBox="0 0 18 12" fill="none">
                  <line x1="0" y1="1" x2="18" y2="1" stroke="currentColor" strokeWidth="1.5"/>
                  <line x1="0" y1="6" x2="18" y2="6" stroke="currentColor" strokeWidth="1.5"/>
                  <line x1="0" y1="11" x2="18" y2="11" stroke="currentColor" strokeWidth="1.5"/>
                </svg>
              </button>
              <div className="acne-icon-sep" />
              <button className="acne-icon-btn" aria-label="Search" onClick={openSearch}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
                </svg>
              </button>
              <div className="acne-icon-sep" />
            </div>
          </div>

          {!isHome && (
            <Link href="/" className="acne-logo">
              <span className="acne-logo-text">TONET PARIS<sup>®</sup></span>
            </Link>
          )}

          {/* RIGHT: SEARCH HELP ACCOUNT BAG (desktop) | ACCOUNT BAG (mobile) */}
          <div className="acne-nav-right">
            <button className="acne-text-btn desktop-only" aria-label="Search" onClick={openSearch}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
              </svg>
              <span>{t('nav.search')}</span>
            </button>
            <Link href="#" className="acne-text-btn desktop-only" aria-label="Help">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10"/>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              <span>{t('nav.help')}</span>
            </Link>
            <Link href={accountHref} className="acne-text-btn desktop-only" aria-label="Account">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              <span>{accountLabel}</span>
            </Link>
            <div className="acne-icon-sep mobile-only" />
            <Link href={accountHref} className="acne-icon-btn mobile-only" aria-label="Account">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </Link>
            <div className="acne-icon-sep mobile-only" />
            <button className="acne-bag-btn" onClick={openCart} aria-label="Open bag">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#a3ff00" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 0 1-8 0"/>
              </svg>
              <span className="bag-count">{String(cartCount).padStart(2, "0")}</span>
            </button>
          </div>
        </div>

        {/* ── SECONDARY STICKY NAV (Product Only) ── */}
        {(isProduct || isCollection) && (
          <div className="acne-subnav">
            <div className="acne-subnav-inner">
              <Link href="/" className="back-link">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
                <span>{t('nav.gallery')}</span>
              </Link>
              <div className="subnav-right">
                {currentCollection && (
                  <span className="subnav-current">{currentCollection.title}</span>
                )}
                <button className="subnav-toggle" onClick={() => setSubnavOpen(!subnavOpen)} aria-label="All collections">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d={subnavOpen ? "M1 7L5 3L9 7" : "M1 3L5 7L9 3"} />
                  </svg>
                </button>
              </div>
              {subnavOpen && (
                <div className="subnav-dropdown">
                  {collections.map(c => (
                    <Link
                      key={c.handle}
                      href={`/collection/${c.handle}`}
                      className={`subnav-drop-item${currentCollectionHandle === c.handle ? ' active' : ''}`}
                      onClick={() => setSubnavOpen(false)}
                    >
                      {c.title}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      <style>{`
        .acne-header {
          position: fixed;
          top: 0;
          left: 0; right: 0;
          z-index: 500;
          transition: background-color 0.25s ease, border-bottom-color 0.25s ease;
        }
        .acne-header.transparent {
          background: transparent;
        }
        .acne-header.solid {
          background: #ffffff;
          border-bottom: 1px solid #ededed;
        }

        .acne-header-inner {
          display: flex;
          align-items: stretch;
          justify-content: space-between;
          height: 47px;
          padding: 0 10px;
          position: relative;
        }

        .acne-logo {
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          z-index: 1;
          text-decoration: none;
          display: flex;
          align-items: baseline;
          gap: 8px;
          color: #000;
          white-space: nowrap;
          line-height: 1;
        }
        .acne-logo-star {
          font-size: 34px;
          line-height: 1;
          color: #000;
        }
        .acne-logo-text {
          font-family: var(--font-brand);
          font-size: 37.5px;
          font-weight: normal;
          letter-spacing: 0.01em;
          color: #000;
          line-height: 1;
        }
        .acne-logo-text sup {
          font-size: 9px;
          vertical-align: super;
          letter-spacing: 0.04em;
        }

        .acne-nav-left { display: flex; align-items: stretch; flex: 1; }
        .acne-nav-links { display: flex; align-items: center; gap: 28px; }
        .acne-nav-links a {
          font-size: 11px;
          font-family: 'HK Grotesk', 'Inter', sans-serif;
          font-weight: 400;
          text-transform: uppercase;
          text-decoration: none;
          color: #000;
          letter-spacing: 0.10em;
          line-height: 1.2;
          position: relative;
        }
        .acne-nav-links a.nav-active::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          right: 0;
          height: 1px;
          background: #000;
        }

        .acne-nav-right { flex: 1; display: flex; align-items: stretch; justify-content: flex-end; }
        .acne-text-btn {
          display: flex; align-items: center; gap: 5px;
          font-size: 11px;
          font-family: 'HK Grotesk', 'Inter', sans-serif;
          font-weight: 400;
          text-transform: uppercase;
          color: #000;
          text-decoration: none;
          background: none; border: none; cursor: pointer; padding: 0 12px;
          height: 100%;
          letter-spacing: 0.10em;
        }

        .acne-bag-btn {
          display: flex; align-items: center; gap: 8px;
          background: none; border: none; cursor: pointer; color: #000;
          padding: 0 0 0 12px; height: 100%;
        }
        .bag-count { font-size: 11px; font-weight: 400; letter-spacing: 0.08em; text-transform: uppercase; }

        .acne-icon-btn {
          display: flex; align-items: center; justify-content: center;
          background: none; border: none; cursor: pointer; color: #000;
          padding: 0 12px; height: 100%;
        }

        .acne-icon-sep { width: 1px; height: 100%; background: #ededed; }
        .acne-mobile-left { display: flex; align-items: stretch; }

        /* ── SUBNAV ── */
        .acne-subnav {
          height: 40px;
          background: #ffffff;
          border-top: 1px solid #ededed;
          border-bottom: 1px solid #ededed;
          display: flex;
          align-items: center;
        }
        .acne-subnav-inner {
          max-width: 100%;
          width: 100%;
          padding: 0 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: relative;
        }
        .back-link {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 400;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #000;
        }
        .subnav-right {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .subnav-current {
          font-size: 11px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #000;
        }
        .subnav-toggle {
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          color: #000;
        }
        .subnav-dropdown {
          position: absolute;
          top: 100%;
          right: 0;
          background: #ffffff;
          border: 1px solid #ededed;
          border-top: none;
          display: flex;
          flex-direction: column;
          min-width: 200px;
          z-index: 600;
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        }
        .subnav-drop-item {
          padding: 12px 20px;
          font-size: 11px;
          font-weight: 400;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #768194;
          text-decoration: none;
          border-bottom: 1px solid #f0f0f0;
          transition: background 0.12s, color 0.12s;
        }
        .subnav-drop-item:last-child { border-bottom: none; }
        .subnav-drop-item:hover { background: #f8f8f8; color: #000; }
        .subnav-drop-item.active { color: #000; font-weight: 500; }

        .desktop-only { display: flex !important; }
        .mobile-only  { display: none !important; }

        @media (max-width: 767px) {
          .desktop-only { display: none !important; }
          .mobile-only  { display: flex !important; }
          .acne-header-inner { padding: 0; height: 48px; align-items: stretch; }
          .acne-logo {
            top: 50%;
            transform: translate(-50%, -50%);
            gap: 6px;
            max-width: calc(100vw - 120px);
            overflow: hidden;
          }
          .acne-logo-star {
            font-size: 26px;
            flex-shrink: 0;
          }
          .acne-logo-text {
            font-size: 25px;
            letter-spacing: 0.04em;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          .acne-bag-btn { padding: 0 14px; height: 100%; }
          .acne-icon-btn { height: 100%; }
          .acne-text-btn { height: 100%; }
          .acne-nav-left { align-items: stretch; }
          .acne-nav-right { align-items: stretch; }
          .acne-subnav-inner { padding: 0 16px; }
        }
      `}</style>
    </>
  );
}
