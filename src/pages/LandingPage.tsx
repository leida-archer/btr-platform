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
  const eventDate = new Date("2026-05-01T20:00:00-07:00");
  const cd = useCountdown(eventDate);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      {/* NAV */}
      <nav className={`pub-nav ${scrolled ? "pub-nav--scrolled" : ""}`}>
        <div className="pub-nav__inner">
          <div className="pub-nav__left">
            <a href="#tickets" className="btn btn--gradient btn--sm pub-nav__tickets-mobile">Get Tickets</a>
          </div>
          <a href="#" className="pub-nav__logo">
            <img src="/logos/logo-on-dark.svg" alt="Beyond the Rhythm" className="pub-nav__logo-img pub-nav__logo-img--wide" />
            <img src="/logos/logo-on-darkv2.svg" alt="Beyond the Rhythm" className="pub-nav__logo-img pub-nav__logo-img--stacked" />
          </a>
          <ul className="pub-nav__links">
            <li><a href="#events" className="pub-nav__link">Events</a></li>
            <li><a href="#about" className="pub-nav__link">About</a></li>
            <li><a href="#gallery" className="pub-nav__link">Gallery</a></li>
          </ul>
          <div className="pub-nav__right">
            <a href="#tickets" className="btn btn--gradient btn--sm pub-nav__tickets-desktop">Get Tickets</a>
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
          <a href="#events" onClick={() => setMobileMenuOpen(false)}>Events</a>
          <a href="#about" onClick={() => setMobileMenuOpen(false)}>About</a>
          <a href="#gallery" onClick={() => setMobileMenuOpen(false)}>Gallery</a>
          <a href="#tickets" className="btn btn--gradient" onClick={() => setMobileMenuOpen(false)}>Get Tickets</a>
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
          <img src="/logos/2d-primary-gradient-on-dark-tree.svg" alt="Beyond the Rhythm" className="hero__logo" />
          <p className="hero__tagline">Where sound becomes feeling</p>
          <div className="hero__actions">
            <a href="#events" className="btn btn--gradient">Explore Events</a>
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
              <h2 className="countdown-section__title">BtR San Diego</h2>
              <div className="countdown-section__details">
                <span className="countdown-section__detail">May 1, 2026</span>
                <span className="countdown-section__detail">FIT Social</span>
                <span className="countdown-section__detail">San Diego, CA</span>
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
          <div className="ticket-tiers">
            <div className="ticket-card ticket-card--featured">
              <span className="ticket-card__badge" style={{ background: "var(--grad-primary)", color: "#fff" }}>Early Bird</span>
              <h3 className="ticket-card__tier">General Admission</h3>
              <div className="ticket-card__price gradient-text">$65</div>
              <a href="#" className="btn btn--gradient" style={{ width: "100%" }}>Buy Now</a>
            </div>
            <div className="ticket-card" style={{ opacity: 0.5 }}>
              <span className="ticket-card__badge" style={{ background: "rgba(214,36,110,0.15)", color: "#d6246e" }}>Coming Soon</span>
              <h3 className="ticket-card__tier">Standard</h3>
              <div className="ticket-card__price gradient-text">$80</div>
              <span className="btn btn--outline" style={{ width: "100%", opacity: 0.5, pointerEvents: "none" as const }}>Not Yet Available</span>
            </div>
          </div>
        </div>
      </section>

      {/* UPCOMING EVENTS */}
      <section className="events-section" id="events">
        <div className="container">
          <p className="section-label" style={{ textAlign: "center" }}>What's Next</p>
          <h2 className="section-title">Upcoming Events</h2>
          <div className="events__grid">
            <div className="event-card">
              <div className="event-card__image">
                <img src="/images/venue/FIT_Social_Sunset.jpg" alt="BtR San Diego" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <span className="event-card__status event-card__status--onsale">On Sale</span>
              </div>
              <div className="event-card__body">
                <h3 className="event-card__name">BtR San Diego</h3>
                <p className="event-card__date">May 1, 2026 — FIT Social</p>
                <a href="#tickets" className="btn btn--sm btn--outline" style={{ width: "100%" }}>Get Tickets</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* LINEUP */}
      <section className="lineup" id="lineup">
        <div className="container">
          <p className="section-label" style={{ textAlign: "center" }}>The Lineup</p>
          <h2 className="section-title">San Diego Headliners</h2>
          <div className="lineup__grid">
            <div className="artist-card">
              <div className="artist-card__photo">
                <img src="/images/artists/Chmura.jpg" alt="Chmura" />
              </div>
              <div className="artist-card__info">
                <div className="artist-card__name">CHMURA</div>
                <div className="artist-card__genre">Experimental Bass</div>
              </div>
            </div>
            <div className="artist-card">
              <div className="artist-card__photo">
                <img src="/images/artists/Saturna.jpg" alt="Saturna" />
              </div>
              <div className="artist-card__info">
                <div className="artist-card__name">SATURNA</div>
                <div className="artist-card__genre">Experimental Bass</div>
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
            <div>
              <p className="section-label">The Movement</p>
              <h2 className="section-title section-title--left" style={{ marginBottom: 24 }}>More Than Music</h2>
              <p className="about__description">
                Beyond the Rhythm is a collective experience that transcends the ordinary.
                We curate immersive environments where sound, light, and community converge
                to create moments that move your soul.
              </p>
              <p className="about__description">
                From intimate warehouse sessions to open-air festivals, every event is
                designed to push the boundaries of what a music experience can be.
              </p>
              <div className="about__stats">
                <div className="about__stat">
                  <span className="about__stat-number gradient-text">5K+</span>
                  <span className="about__stat-label">Attendees</span>
                </div>
                <div className="about__stat">
                  <span className="about__stat-number gradient-text">28+</span>
                  <span className="about__stat-label">Artists Hosted</span>
                </div>
                <div className="about__stat">
                  <span className="about__stat-number gradient-text">16+</span>
                  <span className="about__stat-label">Events Hosted</span>
                </div>
              </div>
            </div>
            <div className="about__ripple-container">
              <img src="/icons/2-ripple-mono.svg" alt="Ripple" className="about__ripple" style={{ filter: "hue-rotate(-20deg) brightness(1.3)" }} />
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
            <div className="gallery__item gallery__item--wide">
              <img src="/images/gallery/IMG_9559.jpg" alt="Seattle 2025" />
              <div className="gallery__overlay"><span>Seattle 2025</span></div>
            </div>
            <div className="gallery__item">
              <img src="/images/gallery/IMG_9560.jpg" alt="Seattle 2025" />
              <div className="gallery__overlay"><span>Seattle 2025</span></div>
            </div>
            <div className="gallery__item">
              <img src="/images/gallery/IMG_9561.jpg" alt="Seattle 2025" />
              <div className="gallery__overlay"><span>Seattle 2025</span></div>
            </div>
            <div className="gallery__item gallery__item--wide">
              <img src="/images/gallery/IMG_9562.jpg" alt="Seattle 2025" />
              <div className="gallery__overlay"><span>Seattle 2025</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* NEWSLETTER */}
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

      {/* FOOTER */}
      <footer className="pub-footer">
        <div className="container">
          <div className="pub-footer__top">
            <div>
              <img src="/logos/logo-on-dark.svg" alt="Beyond the Rhythm" className="pub-footer__logo" />
              <p className="pub-footer__tagline">Where sound becomes feeling</p>
            </div>
            <div>
              <h4 className="pub-footer__heading">Explore</h4>
              <ul className="pub-footer__links">
                <li><a href="#events">Events</a></li>
                <li><a href="#gallery">Gallery</a></li>
                <li><a href="#tickets">Tickets</a></li>
              </ul>
            </div>
            <div>
              <h4 className="pub-footer__heading">Info</h4>
              <ul className="pub-footer__links">
                <li><a href="#">FAQ</a></li>
                <li><a href="#">Accessibility</a></li>
                <li><a href="#">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="pub-footer__heading">Connect</h4>
              <div className="pub-footer__socials">
                <a href="#" className="pub-footer__social" aria-label="Instagram">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="5"/><circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none"/></svg>
                </a>
                <a href="#" className="pub-footer__social" aria-label="TikTok">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.7a8.19 8.19 0 004.76 1.52V6.77a4.84 4.84 0 01-1-.08z"/></svg>
                </a>
                <a href="#" className="pub-footer__social" aria-label="YouTube">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M23.5 6.19a3.02 3.02 0 00-2.12-2.14C19.54 3.5 12 3.5 12 3.5s-7.54 0-9.38.55A3.02 3.02 0 00.5 6.19 31.67 31.67 0 000 12a31.67 31.67 0 00.5 5.81 3.02 3.02 0 002.12 2.14c1.84.55 9.38.55 9.38.55s7.54 0 9.38-.55a3.02 3.02 0 002.12-2.14A31.67 31.67 0 0024 12a31.67 31.67 0 00-.5-5.81zM9.55 15.57V8.43L15.82 12l-6.27 3.57z"/></svg>
                </a>
                <a href="#" className="pub-footer__social" aria-label="X">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
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
