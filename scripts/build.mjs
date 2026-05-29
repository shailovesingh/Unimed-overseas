import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';
import { marked } from 'marked';
import site from '../site.config.json' with { type: 'json' };

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const ASSETS_SRC = path.join(ROOT, 'assets');
const ASSETS_DIST = path.join(DIST, 'assets');

const PAGES = [
  { src: 'index.md', out: 'index.html', depth: 0 },
  { src: 'about.md', out: 'about.html', depth: 0 },
  { src: 'contact.md', out: 'contact.html', depth: 0 },
  ...site.destinations.map((d) => ({
    src: `destinations/${d.slug}.md`,
    out: `destinations/${d.slug}.html`,
    depth: 1,
  })),
];

function pageHref(depth, file) {
  return `${depth === 0 ? '' : '../'}${file}`;
}

function assetPrefix(depth) {
  return depth === 0 ? 'assets' : '../assets';
}

marked.setOptions({ gfm: true, breaks: false });

marked.use({
  renderer: {
    link({ href, title, text }) {
      const t = title ? ` title="${title}"` : '';
      const isWhatsApp = href?.includes('wa.me');
      const isExternal = href?.startsWith('http');
      const cls = isWhatsApp
        ? 'btn btn-cta btn-emerald'
        : isExternal
          ? 'btn btn-cta btn-gold'
          : 'text-link';
      const target = isExternal ? ' target="_blank" rel="noopener noreferrer"' : '';
      return `<a href="${href}" class="${cls}"${t}${target}>${text}</a>`;
    },
  },
});

function rewriteMdLinks(html, depth) {
  const prefix = depth === 0 ? '' : '../';
  return html
    .replace(/href="\.\/([^"]+)\.md"/g, (_, p) => `href="${prefix}${p}.html"`)
    .replace(/href="([^"]+)\.md"/g, (_, p) => {
      if (p.startsWith('http') || p.startsWith('mailto:') || p.startsWith('tel:')) {
        return `href="${p}"`;
      }
      if (p.startsWith('../')) {
        return `href="${p.replace(/\.md$/, '.html')}"`;
      }
      return `href="${prefix}${p.replace(/^\.\//, '').replace(/\.md$/, '.html')}"`;
    });
}

function buildNav(depth) {
  const home = pageHref(depth, 'index.html');
  const about = pageHref(depth, 'about.html');
  const contact = pageHref(depth, 'contact.html');

  const destLinks = site.destinations
    .map(
      (d) =>
        `<li role="none"><a role="menuitem" href="${depth === 0 ? `destinations/${d.slug}.html` : `${d.slug}.html`}">${d.flag} ${d.name}</a></li>`
    )
    .join('\n');

  const logoSrc = `${assetPrefix(depth)}/${site.logo}`;

  return `<header class="site-header" role="banner">
  <div class="header-inner">
    <a class="brand" href="${home}">
      <img class="brand-logo" src="${logoSrc}" alt="${site.logoAlt}" width="200" height="56" decoding="async">
    </a>
    <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav" aria-label="Open menu">
      <span></span><span></span><span></span>
    </button>
    <nav id="site-nav" class="site-nav" aria-label="Main">
      <ul class="nav-list">
        <li class="nav-item nav-dropdown">
          <button type="button" class="nav-dropdown-trigger" aria-expanded="false" aria-haspopup="true">
            Destinations <span class="chevron" aria-hidden="true">▾</span>
          </button>
          <ul class="nav-dropdown-menu" role="menu">
            ${destLinks}
          </ul>
        </li>
        <li class="nav-item"><a href="${about}">About</a></li>
        <li class="nav-item"><a href="${contact}">Contact</a></li>
        <li class="nav-item">
          <a class="btn btn-nav-cta" href="https://wa.me/${site.whatsapp.replace('+', '')}" target="_blank" rel="noopener noreferrer">WhatsApp</a>
        </li>
      </ul>
    </nav>
  </div>
</header>`;
}

function buildWelcomeModal() {
  const phoneOptions = site.phoneCodes
    .map(
      (p) =>
        `<option value="${p.code}"${p.default ? ' selected' : ''}>${p.label}</option>`
    )
    .join('\n');

  const countryOptions = site.destinations
    .map((d) => `<option value="${d.name}">${d.flag} ${d.name}</option>`)
    .join('\n');

  const budgetOptions = site.budgetRanges
    .map(
      (b) =>
        `<label class="checkbox-label"><input type="checkbox" name="budget" value="${b}"> ${b}</label>`
    )
    .join('\n');

  return `<div id="welcome-dialog" class="welcome-overlay" role="dialog" aria-modal="true" aria-labelledby="welcome-dialog-title" hidden>
  <div class="welcome-backdrop" data-close-dialog></div>
  <div class="welcome-card">
    <button type="button" class="welcome-close" data-close-dialog aria-label="Close registration dialog">&times;</button>
    <h2 id="welcome-dialog-title">🎓 MBBS Admission Intake 2026-2027 Open!</h2>
    <p class="welcome-lead">Fill out this quick profile sheet to instantly unlock official university fee brochures, hostel videos, and direct scholarship eligibility evaluations.</p>
    <form id="enquiry-form" class="enquiry-form" data-whatsapp="${site.whatsapp.replace('+', '')}" novalidate>
      <fieldset>
        <legend>1. Candidate Details</legend>
        <label class="field">
          <span>Full Name</span>
          <input type="text" name="fullName" required placeholder="Enter student's full name" autocomplete="name">
        </label>
        <label class="field field-phone">
          <span>Mobile Number</span>
          <div class="phone-row">
            <select name="countryCode" class="country-code-select" aria-label="Country code">${phoneOptions}</select>
            <input type="tel" name="mobile" required placeholder="Enter 10-digit mobile number" inputmode="numeric" autocomplete="tel-national">
          </div>
        </label>
        <label class="field">
          <span>Email Address</span>
          <input type="email" name="email" required placeholder="name@example.com" autocomplete="email">
        </label>
      </fieldset>
      <fieldset>
        <legend>2. Academic Preferences</legend>
        <label class="field">
          <span>Expected / Scored NEET-UG Score</span>
          <input type="number" name="neetScore" min="0" max="720" placeholder="e.g., 380">
        </label>
        <label class="field">
          <span>Preferred Target Country</span>
          <select name="country" required>
            <option value="" disabled selected>Select Country</option>
            ${countryOptions}
          </select>
        </label>
        <div class="field">
          <span>Estimated Budget Range</span>
          <div class="checkbox-group">${budgetOptions}</div>
        </div>
      </fieldset>
      <button type="submit" class="btn btn-cta btn-gold btn-block">🚀 Submit Details &amp; Explore Site</button>
    </form>
  </div>
</div>`;
}

function buildFooter(depth) {
  const home = pageHref(depth, 'index.html');
  return `<footer class="site-footer">
  <div class="footer-inner">
    <p><strong>${site.brand}</strong> — Your Dream, Our Guidance, Global Success.</p>
    <p>Sanganer, Sector 5, Pratap Nagar, Jaipur, Rajasthan 302033</p>
    <p>
      <a class="btn btn-cta btn-emerald" href="https://wa.me/${site.whatsapp.replace('+', '')}" target="_blank" rel="noopener noreferrer">💬 WhatsApp ${site.whatsappDisplay}</a>
    </p>
    <p class="footer-copy">© 2026 Unimed Overseas. <a href="${home}">Home</a></p>
  </div>
</footer>`;
}

function minifyCSS(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '') // remove comments
    .replace(/\s*([{}|:;,])\s*/g, '$1') // remove spaces around braces
    .replace(/\s+/g, ' ') // collapse spaces
    .trim();
}

function minifyJS(js) {
  return js; // Verbatim copy for 100% safety
}

function layoutPage({ title, description, depth, content, showWelcome, isHome, slug }) {
  const assets = assetPrefix(depth);
  const nav = buildNav(depth);
  const welcomeHtml = showWelcome ? buildWelcomeModal() : '';

  const mainContent = isHome 
    ? content 
    : `<article class="content-panel">${content}</article>`;

  const mainClass = isHome ? 'site-main-home' : 'site-main';

  // Absolute domain mapping for high-fidelity social OG card structures
  const BASE_URL = 'https://unimedoverseas.com';
  const relativeSlug = slug === 'index' ? '' : (slug.endsWith('.html') ? slug : `${slug}.html`);
  const pageUrl = `${BASE_URL}/${relativeSlug}`;
  const ogImageUrl = `${BASE_URL}/assets/images/logo.png`;

  // Dynamically Inject structured JSON-LD Schema markup for Google Maps local optimization & Course guides
  let schemaHtml = '';
  if (isHome) {
    schemaHtml = `
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    "name": "Unimed Overseas",
    "url": "${BASE_URL}",
    "logo": "${ogImageUrl}",
    "description": "${description}",
    "sameAs": [
      "https://www.instagram.com/unimedoverseas"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "${site.whatsapp}",
      "contactType": "admissions counseling",
      "areaServed": "IN",
      "availableLanguage": ["English", "Hindi"]
    },
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Sanganer, Sector 5, Pratap Nagar",
      "addressLocality": "Jaipur",
      "addressRegion": "Rajasthan",
      "postalCode": "302033",
      "addressCountry": "IN"
    }
  }
  </script>`;
  } else if (slug.startsWith('destinations/')) {
    const country = slug.split('/')[1];
    const countryCap = country.charAt(0).toUpperCase() + country.slice(1);
    schemaHtml = `
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Guide",
    "name": "${title}",
    "description": "${description}",
    "url": "${pageUrl}",
    "image": "${BASE_URL}/assets/images/${country}-destination.png",
    "inLanguage": "en",
    "about": {
      "@type": "EducationalProgram",
      "name": "MBBS / MD in ${countryCap}",
      "provider": {
        "@type": "EducationalOrganization",
        "name": "Unimed Overseas",
        "url": "${BASE_URL}"
      }
    }
  }
  </script>`;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="theme-color" content="#0A5C70">
  <meta name="color-scheme" content="light">
  <meta name="robots" content="index, follow">
  
  <!-- Primary Meta Tags -->
  <title>${title}</title>
  <meta name="description" content="${description || ''}">
  <link rel="canonical" href="${pageUrl}">
  
  <!-- Favicons and touch icons for modern SERP presence -->
  <link rel="icon" type="image/x-icon" href="${assets}/images/favicon.ico">
  <link rel="icon" type="image/png" sizes="32x32" href="${assets}/images/favicon-32x32.png">
  <link rel="icon" type="image/png" sizes="16x16" href="${assets}/images/favicon-16x16.png">
  <link rel="apple-touch-icon" sizes="180x180" href="${assets}/images/apple-touch-icon.png">
  
  <!-- Open Graph / Facebook Previews -->
  <meta property="og:type" content="${isHome ? 'website' : 'article'}">
  <meta property="og:url" content="${pageUrl}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description || ''}">
  <meta property="og:image" content="${ogImageUrl}">
  <meta property="og:site_name" content="Unimed Overseas">
  
  <!-- Twitter Card Previews -->
  <meta property="twitter:card" content="summary_large_image">
  <meta property="twitter:url" content="${pageUrl}">
  <meta property="twitter:title" content="${title}">
  <meta property="twitter:description" content="${description || ''}">
  <meta property="twitter:image" content="${ogImageUrl}">

  <!-- Performance preconnections -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="preconnect" href="https://wa.me">
  <link rel="preconnect" href="https://api.whatsapp.com">
  
  <!-- Asynchronous non-blocking CSS loading -->
  <link rel="preload" href="${assets}/css/main.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
  <noscript><link rel="stylesheet" href="${assets}/css/main.css"></noscript>
  
  <!-- Asynchronous Google Fonts loading -->
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800&display=swap" rel="stylesheet" media="print" onload="this.media='all'">
  <noscript><link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,600;9..40,700&family=Plus+Jakarta+Sans:wght@400;600;800&display=swap" rel="stylesheet"></noscript>
  
  ${schemaHtml}
</head>
<body class="theme-light${showWelcome ? ' has-welcome-pending' : ''}" data-show-welcome="${showWelcome ? 'true' : 'false'}">
  ${nav}
  <main id="main-content" class="${mainClass}" tabindex="-1">
    ${mainContent}
  </main>
  ${buildFooter(depth)}
  ${welcomeHtml}
  <a href="https://wa.me/${site.whatsapp.replace('+', '')}" class="floating-whatsapp" target="_blank" rel="noopener noreferrer" aria-label="Chat on WhatsApp">💬</a>
  <script src="${assets}/js/app.js" defer></script>
</body>
</html>`;
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(s, d);
    } else {
      if (entry.name.endsWith('.css')) {
        const rawCss = fs.readFileSync(s, 'utf8');
        fs.writeFileSync(d, minifyCSS(rawCss), 'utf8');
      } else if (entry.name.endsWith('.js')) {
        const rawJs = fs.readFileSync(s, 'utf8');
        fs.writeFileSync(d, minifyJS(rawJs), 'utf8');
      } else {
        fs.copyFileSync(s, d);
      }
    }
  }
}

function stripWelcomeBlock(body) {
  return body.replace(/:::welcome-dialog-popup[\s\S]*?:::/g, '').trim();
}

function build() {
  if (fs.existsSync(DIST)) fs.rmSync(DIST, { recursive: true });
  fs.mkdirSync(DIST, { recursive: true });
  copyDir(ASSETS_SRC, ASSETS_DIST);

  for (const page of PAGES) {
    const srcPath = path.join(ROOT, page.src);
    if (!fs.existsSync(srcPath)) {
      console.warn(`Skip missing: ${page.src}`);
      continue;
    }

    const raw = fs.readFileSync(srcPath, 'utf8');
    const { data, content } = matter(raw);
    const body = stripWelcomeBlock(content);
    let html = marked.parse(body);
    html = rewriteMdLinks(html, page.depth);

    const slug = page.src.replace('.md', '');
    const doc = layoutPage({
      title: data.title || 'Unimed Overseas',
      description: data.description || '',
      depth: page.depth,
      content: html,
      showWelcome: Boolean(data.show_welcome_dialog),
      isHome: page.src === 'index.md',
      slug,
    });

    const outPath = path.join(DIST, page.out);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, doc, 'utf8');
    console.log(`Built ${page.out}`);
  }

  fs.copyFileSync(
    path.join(ROOT, 'site.config.json'),
    path.join(DIST, 'site.config.json')
  );

  console.log('\n✓ Build complete → dist/');
}

build();
