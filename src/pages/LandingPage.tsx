import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";

function Particles() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    for (let i = 0; i < 30; i++) {
      const p = document.createElement("div");
      p.className = "hero__particle";
      p.style.left = Math.random() * 100 + "%";
      p.style.animationDuration = 8 + Math.random() * 12 + "s";
      p.style.animationDelay = Math.random() * 10 + "s";
      const colors = [
        "rgba(214,36,110,0.4)",
        "rgba(232,101,43,0.3)",
        "rgba(242,169,34,0.3)",
        "rgba(139,92,246,0.25)",
      ];
      p.style.background = colors[Math.floor(Math.random() * colors.length)];
      p.style.width = p.style.height = 2 + Math.random() * 3 + "px";
      el.appendChild(p);
    }
  }, []);
  return <div className="hero__particles" ref={ref} />;
}

function useCountdown(target: Date) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const diff = Math.max(0, target.getTime() - now);
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return { d, h, m, s };
}

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const eventDate = new Date("2026-09-05T20:00:00-07:00");
  const cd = useCountdown(eventDate);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const logoEl = document.getElementById("ff-logo") as HTMLImageElement | null;
    if (!logoEl) return;
    const processLogo = () => {
      const src = new Image();
      src.onload = () => {
        const c = document.createElement("canvas");
        c.width = src.width; c.height = src.height;
        const ctx = c.getContext("2d")!;
        const grad = ctx.createLinearGradient(0, 0, c.width, c.height);
        grad.addColorStop(0, "#8b5cf6");
        grad.addColorStop(0.33, "#d6246e");
        grad.addColorStop(0.66, "#e8652b");
        grad.addColorStop(1, "#f2a922");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, c.width, c.height);
        const gradData = ctx.getImageData(0, 0, c.width, c.height);
        ctx.drawImage(src, 0, 0);
        const imgData = ctx.getImageData(0, 0, c.width, c.height);
        const cx = c.width / 2, cy = c.height / 2, radius = c.width * 0.46;
        for (let i = 0; i < imgData.data.length; i += 4) {
          const px = (i / 4) % c.width, py = Math.floor((i / 4) / c.width);
          const dist = Math.sqrt((px - cx) ** 2 + (py - cy) ** 2);
          const r = imgData.data[i], g = imgData.data[i+1], b = imgData.data[i+2];
          const isGreen = g > 80 && g > r * 1.05 && g > b * 1.05;
          if (dist <= radius && isGreen) {
            imgData.data[i] = gradData.data[i];
            imgData.data[i+1] = gradData.data[i+1];
            imgData.data[i+2] = gradData.data[i+2];
            imgData.data[i+3] = 255;
          } else {
            imgData.data[i+3] = 0;
          }
        }
        ctx.putImageData(imgData, 0, 0);
        logoEl.src = c.toDataURL();
      };
      src.src = "/images/fesser-logo.png";
    };
    if (logoEl.complete) processLogo();
    else logoEl.addEventListener("load", processLogo);
  }, []);

  return (
    <>
      {/* NAV */}
      <nav className={`pub-nav ${scrolled ? "pub-nav--scrolled" : ""}`}>
        <div className="pub-nav__inner">
          <div className="pub-nav__left">
            <span className="btn btn--gradient btn--sm btn--muted pub-nav__tickets-mobile" aria-disabled="true">Get Tickets</span>
          </div>
          <a href="#" className="pub-nav__logo">
            <img src="/logos/logo-on-dark.svg" alt="Beyond the Rhythm" className="pub-nav__logo-img pub-nav__logo-img--wide" />
            <img src="/logos/logo-on-darkv2.svg" alt="Beyond the Rhythm" className="pub-nav__logo-img pub-nav__logo-img--stacked" />
          </a>
          <ul className="pub-nav__links">
            <li><a href="#tickets" className="pub-nav__link">Events</a></li>
            <li><a href="#about" className="pub-nav__link">About</a></li>
            <li><a href="#gallery" className="pub-nav__link">Gallery</a></li>
          </ul>
          <div className="pub-nav__right">
            <span className="btn btn--gradient btn--sm btn--muted pub-nav__tickets-desktop" aria-disabled="true">Get Tickets</span>
            <Link to="/login" className="pub-nav__team">Team</Link>
            <button
              className="pub-nav__hamburger"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div className="pub-mobile-menu">
          <a href="#tickets" onClick={() => setMobileMenuOpen(false)}>Events</a>
          <a href="#about" onClick={() => setMobileMenuOpen(false)}>About</a>
          <a href="#gallery" onClick={() => setMobileMenuOpen(false)}>Gallery</a>
          <span className="btn btn--gradient btn--muted" aria-disabled="true">Get Tickets</span>
          <Link to="/login" className="btn btn--outline" onClick={() => setMobileMenuOpen(false)}>Team Login</Link>
        </div>
      )}

      {/* HERO */}
      <header className="hero" id="hero">
        <div className="hero__bg">
          <div className="hero__gradient-overlay" />
          <Particles />
        </div>
        <div className="hero__content">
          <img src="/logos/logo_gradient_ripple_tree_btr.svg" alt="Beyond the Rhythm" className="hero__logo" />
          <p className="hero__tagline">The power of music has the power to heal</p>
          <div className="hero__actions">
            <a href="#tickets" className="btn btn--gradient">Explore Events</a>
            <a href="#about" className="btn btn--outline">Learn More</a>
          </div>
        </div>
        <div className="hero__scroll-hint">
          <span>Scroll</span>
          <div className="hero__scroll-line" />
        </div>
      </header>

      {/* COUNTDOWN + TICKETS */}
      <section className="countdown-section" id="tickets">
        <div className="container">
          <div className="countdown-section__inner">
            <div>
              <h2 className="countdown-section__title">BtR Hollywood</h2>
              <div className="countdown-section__details">
                <span className="countdown-section__detail">September 5, 2026</span>
                <span className="countdown-section__detail">Los Angeles, CA</span>
              </div>
            </div>
            <div className="countdown">
              <div className="countdown__block">
                <span className="countdown__number gradient-text">{cd.d}</span>
                <span className="countdown__label">Days</span>
              </div>
              <span className="countdown__sep">:</span>
              <div className="countdown__block">
                <span className="countdown__number gradient-text">{String(cd.h).padStart(2, "0")}</span>
                <span className="countdown__label">Hours</span>
              </div>
              <span className="countdown__sep">:</span>
              <div className="countdown__block">
                <span className="countdown__number gradient-text">{String(cd.m).padStart(2, "0")}</span>
                <span className="countdown__label">Min</span>
              </div>
              <span className="countdown__sep">:</span>
              <div className="countdown__block">
                <span className="countdown__number gradient-text">{String(cd.s).padStart(2, "0")}</span>
                <span className="countdown__label">Sec</span>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <div className="event-card" style={{ maxWidth: 420, width: "100%" }}>
              <div className="event-card__image">
                <img src="/images/venue/BtR_Hollywood.jpg" alt="BtR Hollywood" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <span className="event-card__status event-card__status--soon">Coming Soon</span>
              </div>
              <div className="event-card__body">
                <h3 className="event-card__name">BtR Hollywood</h3>
                <p className="event-card__date">September 5, 2026 — Los Angeles, CA</p>
                <button type="button" className="btn btn--sm btn--gradient btn--muted" style={{ width: "100%" }} disabled>Get Tickets</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* LINEUP */}
      <section className="lineup" id="lineup">
        <div className="container">
          <p className="section-label" style={{ textAlign: "center" }}>The Lineup</p>
          <h2 className="section-title">Hollywood Headliners</h2>
          <div className="lineup__grid">
            <div className="artist-card">
              <div className="artist-card__photo">
                <img src="/images/artists/SoDown.jpg" alt="SoDown" style={{ objectPosition: "50% 42%" }} />
              </div>
              <div className="artist-card__info">
                <div className="artist-card__name">SODOWN</div>
              </div>
            </div>
            <div className="artist-card">
              <div className="artist-card__photo">
                <img src="/images/artists/Manic_Focus.jpg" alt="Manic Focus" style={{ objectPosition: "50% 18%" }} />
              </div>
              <div className="artist-card__info">
                <div className="artist-card__name">MANIC FOCUS</div>
              </div>
            </div>
          </div>
          <p className="lineup__more">+ more to be announced</p>
        </div>
      </section>

      {/* ABOUT */}
      <section className="about" id="about">
        <div className="container">
          <div className="about__grid">
            <div className="about__text">
              <p className="section-label">The Movement</p>
              <h2 className="section-title section-title--left" style={{ marginBottom: 24 }}>More Than Music</h2>
              <p className="about__description">
                Beyond the Rhythm is the music-driven fundraising program for Fesser &amp; Friends
                Inc. — a registered 501(c)(3) non-profit operating two orphanages in the
                Democratic Republic of the Congo. What started as a small group of friends
                trying to do their part has grown into something far bigger and more beautiful
                than we ever imagined.
              </p>
              <div className="about__stats">
                <div className="about__stat">
                  <span className="about__stat-number gradient-text">200k+</span>
                  <span className="about__stat-label">Meals Served</span>
                </div>
                <div className="about__stat">
                  <span className="about__stat-number gradient-text">100+</span>
                  <span className="about__stat-label">Children Reunited</span>
                </div>
                <div className="about__stat">
                  <span className="about__stat-number gradient-text">20+</span>
                  <span className="about__stat-label">Staff Employed</span>
                </div>
                <div className="about__stat">
                  <span className="about__stat-number gradient-text">2</span>
                  <span className="about__stat-label">Centers Operating</span>
                </div>
              </div>
              <div className="about__ripple-container">
                <a href="https://www.fesserandfriends.org" target="_blank" rel="noopener noreferrer"><img src="/images/fesser-logo.png" alt="Fesser &amp; Friends" className="about__ripple" id="ff-logo" /></a>
                <p className="about__ff-caption">click to learn more</p>
              </div>
            </div>

            <div className="count-in">
              <div className="count-in__header">
                <h3 className="count-in__title">Join the Movement</h3>
                <span className="count-in__subtitle">Drop your info and we'll be in touch.</span>
              </div>
              <form className="count-in__form" action="https://formspree.io/f/mredqgpp" method="POST" onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const btn = form.querySelector("button[type=submit]") as HTMLButtonElement;
                btn.textContent = "Sending...";
                btn.disabled = true;
                fetch(form.action, { method: "POST", body: new FormData(form), headers: { Accept: "application/json" } })
                  .then(() => { form.innerHTML = '<div style="text-align:center;padding:40px 0"><h3 style="font-family:var(--font-heading);font-size:1.3rem;margin-bottom:8px">You\'re In!</h3><p style="color:var(--color-mist);font-size:0.9rem">We\'ll be in touch soon. Welcome to the movement.</p></div>'; })
                  .catch(() => { btn.textContent = "Count Me In"; btn.disabled = false; });
              }}>
                <div><label className="count-in__label">Name</label><input className="count-in__input" type="text" name="name" placeholder="Your name..." required /></div>
                <div><label className="count-in__label">Email</label><input className="count-in__input" type="email" name="email" placeholder="your@email.com..." required /></div>
                <div className="count-in__row">
                  <div><label className="count-in__label">Phone <span className="opt">(Optional)</span></label><input className="count-in__input" type="tel" name="phone" placeholder="Phone number..." /></div>
                  <div><label className="count-in__label">Instagram <span className="opt">(Optional)</span></label><input className="count-in__input" type="text" name="instagram" placeholder="@handle..." /></div>
                </div>
                <div><label className="count-in__label">Best Way to Reach You</label>
                  <select className="count-in__select" name="preferred_contact"><option value="">Select one...</option><option value="Email">Email</option><option value="Phone">Phone</option><option value="Instagram DM">Instagram DM</option></select>
                </div>
                <div className="count-in__comments-wrap"><label className="count-in__label">Comments <span className="opt">(Optional)</span></label>
                  <textarea className="count-in__textarea" name="comments" placeholder="Anything you want to say..." rows={2}></textarea>
                </div>
                <input type="hidden" name="_subject" value="New BtR Landing Page Submission" />
                <button type="submit" className="btn btn--gradient" style={{ width: "100%", marginTop: 4 }}>Count Me In</button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* GALLERY */}
      <section className="gallery" id="gallery">
        <div className="container">
          <p className="section-label" style={{ textAlign: "center" }}>Moments</p>
          <h2 className="section-title">Gallery</h2>
          <div className="gallery__grid">
            <div className="gallery__item">
              <img src="/images/gallery/sd26-fire.jpg" alt="San Diego 2026" />
              <div className="gallery__overlay"><span>San Diego 2026</span></div>
            </div>
            <div className="gallery__item gallery__item--wide">
              <img src="/images/gallery/sd26-decks.jpg" alt="San Diego 2026" />
              <div className="gallery__overlay"><span>San Diego 2026</span></div>
            </div>
            <div className="gallery__item gallery__item--wide">
              <img src="/images/gallery/sd26-dome.jpg" alt="San Diego 2026" style={{ objectPosition: "50% 72%" }} />
              <div className="gallery__overlay"><span>San Diego 2026</span></div>
            </div>
            <div className="gallery__item">
              <img src="/images/gallery/sd26-rooftop.jpg" alt="San Diego 2026" />
              <div className="gallery__overlay"><span>San Diego 2026</span></div>
            </div>
            <div className="gallery__item gallery__item--pano">
              <img src="/images/gallery/sd26-venue.jpg" alt="San Diego 2026" />
              <div className="gallery__overlay"><span>San Diego 2026</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* NEWSLETTER — hidden for now, re-enable when ready
      <section className="newsletter">
        <div className="container">
          <div className="newsletter__inner">
            <div className="newsletter__text">
              <h2 className="newsletter__title">Stay in the Loop</h2>
              <p className="newsletter__subtitle">Get early access to tickets, lineup announcements, and exclusive content.</p>
            </div>
            <div className="newsletter__form">
              <div className="newsletter__input-wrap">
                <input type="email" placeholder="Your email address" className="newsletter__input" />
                <button className="btn btn--sm newsletter__btn">Subscribe</button>
              </div>
            </div>
          </div>
        </div>
      </section>
      */}

      {/* FOOTER */}
      <footer className="pub-footer">
        <div className="container">
          <div className="pub-footer__top">
            <div>
              <img src="/logos/logo-on-dark.svg" alt="Beyond the Rhythm" className="pub-footer__logo" />
              <p className="pub-footer__tagline">The power of music has the power to heal</p>
            </div>
            <div>
              <h4 className="pub-footer__heading">Explore</h4>
              <ul className="pub-footer__links">
                <li><a href="#tickets">Events</a></li>
                <li><a href="#gallery">Gallery</a></li>
                <li><a href="#tickets">Tickets</a></li>
              </ul>
            </div>
            <div>
              <h4 className="pub-footer__heading">Info</h4>
              <ul className="pub-footer__links">
                <li><a href="https://www.fesserandfriends.org/contact" target="_blank" rel="noopener noreferrer">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="pub-footer__heading">Connect</h4>
              <div className="pub-footer__socials">
                <a href="https://www.instagram.com/beyondtherhythm.official" target="_blank" rel="noopener noreferrer" className="pub-footer__social" aria-label="Instagram">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="5"/><circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none"/></svg>
                </a>
                <a href="https://www.tiktok.com/@beyondtherhythm.official?_r=1&_t=ZP-95anv6cSKDf" target="_blank" rel="noopener noreferrer" className="pub-footer__social" aria-label="TikTok">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.7a8.19 8.19 0 004.76 1.52V6.77a4.84 4.84 0 01-1-.08z"/></svg>
                </a>
              </div>
            </div>
          </div>
          <div className="pub-footer__bottom">
            &copy; 2026 Beyond the Rhythm. All rights reserved.
          </div>
        </div>
      </footer>
    </>
  );
}
