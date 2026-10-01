(function(){
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });

  // ---- smooth scroll (snappy, not floaty) ----
  let lenis = null;
  try{
    lenis = new Lenis({ smoothWheel:true, lerp:0.13 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function(time){ lenis.raf(time*1000); });
    gsap.ticker.lagSmoothing(0);
  }catch(e){ /* Lenis optional */ }

  var isMobile = window.matchMedia('(max-width: 700px)').matches;
  // Desktop zoom needs only ~5.5x to fully clear the window hole —
  // 7.2x just pushed deeper into empty sky (dead scroll + raster cost).
  var CABIN_SCALE = isMobile ? 4.2 : 5.5;
  // Short pin: less dead sky-scroll before the content, snappier handoff.
  // Mobile: pin releases the moment the cabin fades out — no empty scroll.
  var SCROLL_LEN = isMobile ? '+=60%' : '+=200%';
  // Vignette settles BEFORE unpin (ends .95) so the release into
  // content is already a clean sky — no last-frame pop.
  var T_CABIN_OUT = isMobile ? 0.88 : 0.84,
      T_SKYFADE = isMobile ? 0.73 : 0.68,
      D_SKYFADE = isMobile ? 0.27 : 0.2,
      T_VIG = isMobile ? 0.85 : 0.8,
      D_VIG = isMobile ? 0.15 : 0.15;

  /* Window hole geometry in source-image fractions (main.webp 5000x2500).
     Measured from layout size (offsetWidth/offsetHeight), which GSAP zoom
     transforms cannot distort — so the hole never drifts mid-scroll. */
  var WIN = { cx:0.502, cy:0.49, rx:0.104, ry:0.283, iw:5000, ih:2500 };
  var cabinImg = document.getElementById('cabinImg');
  function fitMask(){
    if(!cabinImg || !cabinImg.naturalWidth) return;
    var W = cabinImg.offsetWidth, H = cabinImg.offsetHeight;
    if(!W || !H) return;
    var iw = cabinImg.naturalWidth, ih = cabinImg.naturalHeight;
    var s = Math.max(W/iw, H/ih); // object-fit:cover scale
    var rw = iw*s, rh = ih*s;
    var ox = (W-rw)/2, oy = (H-rh)/2;
    cabinImg.style.setProperty('--mx', (ox + WIN.cx*rw).toFixed(1)+'px');
    cabinImg.style.setProperty('--my', (oy + WIN.cy*rh).toFixed(1)+'px');
    cabinImg.style.setProperty('--mrx', (WIN.rx*rw).toFixed(1)+'px');
    cabinImg.style.setProperty('--mry', (WIN.ry*rh).toFixed(1)+'px');
  }
  if(cabinImg && cabinImg.complete && cabinImg.naturalWidth){ fitMask(); }
  if(cabinImg){ cabinImg.addEventListener('load', fitMask); }
  window.addEventListener('resize', fitMask);
  ScrollTrigger.addEventListener('refresh', fitMask);

  /* Sky photo box: clouds live inside the wrap so they glide with the photo. */
  var skyLayer = document.getElementById('skyLayer');
  var skyPhotoWrap = document.getElementById('skyPhotoWrap');
  var skyPhoto = document.getElementById('skyPhoto');
  var skyTravel = { y: 0 };
  function fitSky(){
    if(!skyLayer || !skyPhotoWrap || !skyPhoto || !skyPhoto.naturalWidth) return;
    var W = skyLayer.offsetWidth, H = skyLayer.offsetHeight;
    if(!W || !H) return;
    var iw = skyPhoto.naturalWidth, ih = skyPhoto.naturalHeight;
    var s = Math.max(W/iw, H/ih);
    var rw = iw*s, rh = ih*s;
    // DESKTOP ONLY crop: square sky (2240x2240) leaves a near-viewport
    // tail below the fold on wide screens. Keep viewport + a 55vh drift;
    // only the bottom excess is cropped (photo anchored top).
    // Mobile portrait has ~zero overflow, so keep full travel there.
    var over = rh - H;
    if(over < 0) over = 0;
    var drift = isMobile ? over : Math.min(over, window.innerHeight * 0.55);
    skyPhotoWrap.style.width = rw.toFixed(1)+'px';
    skyPhotoWrap.style.height = (H + drift).toFixed(1)+'px';
    skyPhotoWrap.style.left = ((W-rw)/2).toFixed(1)+'px';
    skyTravel.y = -drift;
  }
  function fitSkyThenRefresh(){ fitSky(); ScrollTrigger.refresh(); }
  if(skyPhoto.complete && skyPhoto.naturalWidth){ fitSky(); }
  else{ skyPhoto.addEventListener('load', fitSkyThenRefresh); }
  window.addEventListener('resize', fitSky);
  ScrollTrigger.addEventListener('refresh', fitSky);

  // ---- intro: touches ONLY #stage + text (never cabin/sky scale, which
  // belong to the scrub timeline) ----
  var intro = gsap.timeline({defaults:{ease:'power3.out'}});
  intro.from('#stage',{opacity:0, scale:1.05, duration:1.4},0)
       .from('.h-top',{y:60, opacity:0, duration:1},.35)
       .from('.h-mid',{y:60, opacity:0, duration:1},.45)
       .from('.h-bottom-left',{y:26, opacity:0, duration:.9},.65)
       .from('#windowBrand',{opacity:0, duration:1},.7)
       .from('#journeyRow',{y:16, opacity:0, duration:.8},.85)
       .from('nav',{y:-24, opacity:0, duration:.8},.5)
       .from('.drift',{opacity:0, duration:1.4},.7);

  // ---- THE window label travels: the same #windowBrand node rides from the
  // window center up to the top header on scroll and stays there (it is
  // position:fixed, outside the pinned stage, so it survives after unpin).
  // Click = back to the main view (top). ----
  var windowBrand = document.getElementById('windowBrand');
  gsap.set(windowBrand, {xPercent:-50, yPercent:-50, y:0, scale:1});
  windowBrand.addEventListener('click', function(ev){
    ev.preventDefault();
    if(lenis){ lenis.scrollTo(0, {duration:1.6}); }
    else{ window.scrollTo({top:0, behavior:'smooth'}); }
  });

  // ---- main scroll zoom: pin + scrub.
  // Cabin text needs NO tween of its own — it is a child of #cabinLayer and
  // inherits the cabin zoom + fade automatically. ----
  var tl = gsap.timeline({
    defaults:{ease:'none'},
    scrollTrigger:{
      trigger:'#flight',
      start:'top top',
      end:SCROLL_LEN,
      scrub:true,
      pin:true,
      anticipatePin:1,
      invalidateOnRefresh:true,
      onUpdate:function(self){
        document.getElementById('progressBar').style.transform = 'scaleX(' + self.progress + ')';
      }
    }
  });

  // the label glides up and docks on the navbar line by progress .8 — just
  // as the cabin fades out (.84), so it is already headered when the img is
  // gone. ease none keeps it 1:1 with the scrollbar the whole way.
  // Dock target = vertical center of #siteNav (same line as the nav items),
  // measured live so padding/font changes can't misalign it.
  tl.to(windowBrand, {y:function(){
      var siteNav = document.getElementById('siteNav');
      var center = siteNav ? siteNav.offsetHeight / 2 : 30;
      return -(window.innerHeight * 0.49 - center);
    },
    scale:.8, duration:.45, ease:'none'}, 0);

  // THE ZOOM — cabin (image + text as one) rushes past camera, sky drifts slower
  tl.to('#cabinLayer',{scale:CABIN_SCALE, xPercent:-0.4, duration:1, ease:'power1.inOut',
      transformOrigin:'50.2% 49%'},0);
  tl.to('#skyLayer',{scale:1.18, yPercent:0, duration:.3, ease:'power1.inOut'},0);
  tl.to('#skyLayer',{scale:1.45, duration:.85, ease:'power1.inOut'},.15);
  tl.to('#skyPhotoWrap',{y:function(){ return skyTravel.y; }, duration:.85, ease:'power1.inOut'},.15);

  // cloud band marquee (runs on the wrapper, never fights the scrubbed parent)
  gsap.fromTo('#driftSingle',{xPercent:0},{xPercent:-50, duration:22, ease:'none', repeat:-1});

  // cabin (with text) hands off to full-bleed sky
  tl.to('#cabinLayer',{opacity:0, duration:.12, ease:'power1.out'},T_CABIN_OUT);
  tl.to('#skyFade',{opacity:1, duration:D_SKYFADE, ease:'power1.out'},T_SKYFADE);
  tl.to('.vignette',{opacity:0, duration:D_VIG},T_VIG);

  // ---- anchor links: work with Lenis + pinned ScrollTrigger ----
  document.querySelectorAll('[data-scroll]').forEach(function(a){
    a.addEventListener('click', function(ev){
      var id = a.getAttribute('href');
      if(!id || id.charAt(0) !== '#') return;
      var el = document.querySelector(id);
      if(!el) return;
      ev.preventDefault();
      document.getElementById('navLinks').classList.remove('open');
      document.getElementById('navToggle').setAttribute('aria-expanded','false');
      var siteNav = document.getElementById('siteNav');
      if(siteNav) siteNav.classList.remove('menu-open');
      if(lenis){ lenis.scrollTo(el, {duration:1.6}); }
      else{ el.scrollIntoView({behavior:'smooth'}); }
    });
  });

  // ---- mobile menu ----
  var nav = document.getElementById('siteNav');
  var toggle = document.getElementById('navToggle');
  var links = document.getElementById('navLinks');
  if(toggle && links){
    toggle.addEventListener('click', function(){
      var open = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      if(nav) nav.classList.toggle('menu-open', open);
    });
  }

  // ---- sticky Book button: jumps to contact, hides over contact/footer ----
  var stickyBook = document.getElementById('stickyBook');
  if(stickyBook){
    stickyBook.addEventListener('click', function(){
      var el = document.getElementById('contact');
      if(!el) return;
      if(lenis){ lenis.scrollTo(el, {duration:1.6}); }
      else{ el.scrollIntoView({behavior:'smooth'}); }
    });
    // never overlap the footer: instead of hiding, dock the button just
    // above the footer's top edge while it is on screen.
    var footEl = document.querySelector('.footer');
    var bookMQ = window.matchMedia('(max-width:560px)');
    var bookTicking = false;
    function dockBookBtn(){
      bookTicking = false;
      if(!footEl) return;
      var dockGap = bookMQ.matches ? 8 : 10; // small gap so it hugs the footer edge
      var overlap = window.innerHeight - footEl.getBoundingClientRect().top;
      stickyBook.style.bottom = overlap > 0 ? (dockGap + overlap) + 'px' : '';
    }
    function queueDock(){
      if(bookTicking) return;
      bookTicking = true;
      requestAnimationFrame(dockBookBtn);
    }
    if(footEl){
      if(lenis){ lenis.on('scroll', queueDock); }
      window.addEventListener('scroll', queueDock, {passive:true});
      window.addEventListener('resize', queueDock);
      ScrollTrigger.addEventListener('refresh', queueDock);
      dockBookBtn();
    }
  }

  // ---- about statement: letter-by-letter scroll scrub ----
  var aboutStatement = document.getElementById('aboutStatement');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(aboutStatement && !reduceMotion){
    var fullText = aboutStatement.textContent.trim();
    aboutStatement.setAttribute('aria-label', fullText);
    aboutStatement.textContent = '';
    var chars = [];
    fullText.split(/(\s+)/).forEach(function(tok){
      if(!tok) return;
      if(/^\s+$/.test(tok)){ aboutStatement.appendChild(document.createTextNode(' ')); return; }
      var w = document.createElement('span');
      w.className = 'w'; w.setAttribute('aria-hidden','true');
      tok.split('').forEach(function(c){
        var s = document.createElement('span');
        s.className = 'ch'; s.textContent = c;
        w.appendChild(s); chars.push(s);
      });
      aboutStatement.appendChild(w);
    });
    gsap.fromTo(chars, {opacity:.13}, {opacity:1, ease:'none', stagger:.06,
      scrollTrigger:{trigger:'#about', start:'top 90%', end:'top 10%', scrub:1}});
  }

  // ---- about: rows slide in from their own side (no zoom, lead static) ----
  if(!reduceMotion){
    gsap.utils.toArray('.about-row').forEach(function(row, i){
      var photo = row.querySelector('.about-photo');
      var texts = row.querySelectorAll('.about-text h3, .about-text p');
      if(!photo) return;
      var flip = (i % 2 === 1); // even rows render the photo on the right
      gsap.set(photo, {x: flip ? 90 : -90});
      gsap.set(texts, {x: flip ? -60 : 60});
      var tl = gsap.timeline({
        scrollTrigger:{trigger:row, start:'top 92%', end:'top 55%', scrub:1}
      });
      tl.to(photo, {x:0, ease:'none', duration:1}, 0)
        .to(texts, {x:0, ease:'none', stagger:0.15, duration:0.8}, 0.15);
    });
  }

  // ---- advantages: text from the left, cards + images from the right ----
  if(!reduceMotion){
    var advTitle = document.getElementById('advTitle');
    var advLead = document.getElementById('advLead');
    if(advTitle || advLead){
      var introParts = [];
      if(advTitle) introParts.push(advTitle);
      if(advLead) introParts.push(advLead);
      gsap.set(introParts, {x:-70, opacity:0});
      gsap.to(introParts, {x:0, opacity:1, ease:'none', stagger:0.2,
        scrollTrigger:{trigger:'#advantages .adv-intro', start:'top 85%', end:'top 50%', scrub:1}});
    }
    gsap.utils.toArray('.adv-list li').forEach(function(card, i){
      var thumb = card.querySelector('.adv-thumb');
      var copy = card.querySelectorAll('h3, p');
      gsap.set(card, {x:90, opacity:0});
      if(thumb) gsap.set(thumb, {x:40, scale:1.3, opacity:0});
      if(copy.length) gsap.set(copy, {x:40, opacity:0});
      var ctl = gsap.timeline({
        scrollTrigger:{trigger:card, start:'top 92%', end:'top 55%', scrub:1}
      });
      ctl.to(card, {x:0, opacity:1, ease:'none', duration:1}, 0)
        .to(thumb, {x:0, scale:1, opacity:1, ease:'none', duration:1}, 0)
        .to(copy, {x:0, opacity:1, ease:'none', stagger:0.15, duration:0.8}, 0.15);
    });
  }

  // ---- reveals for content sections ----
  gsap.utils.toArray('.reveal').forEach(function(el){
    gsap.to(el, {
      opacity:1, y:0, duration:.9, ease:'power3.out',
      scrollTrigger:{ trigger: el, start:'top 88%' }
    });
  });

  // ---- demo contact form ----
  var form = document.getElementById('contactForm');
  if(form){
    form.addEventListener('submit', function(){
      var note = document.getElementById('formNote');
      if(note) note.textContent = 'Thanks — we will reply shortly. (Connect backend to receive messages.)';
      form.reset();
    });
  }

  window.addEventListener('load', function(){ ScrollTrigger.refresh(); });
})();
