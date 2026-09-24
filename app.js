(function(){
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });

  // ---- smooth scroll (like the reference site) ----
  let lenis = null;
  try{
    lenis = new Lenis({ smoothWheel:true, lerp:0.1 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function(time){ lenis.raf(time*1000); });
    gsap.ticker.lagSmoothing(0);
  }catch(e){ /* Lenis optional */ }

  // anchor links work with Lenis
  document.querySelectorAll('a[href^="#"]').forEach(function(a){
    a.addEventListener('click', function(ev){
      var id = a.getAttribute('href');
      if(id.length > 1 && document.querySelector(id)){
        ev.preventDefault();
        if(lenis){ lenis.scrollTo(id, {offset:0, duration:1.4}); }
        else{ document.querySelector(id).scrollIntoView({behavior:'smooth'}); }
      }
    });
  });

  var isMobile = window.matchMedia('(max-width: 700px)').matches;
  var CABIN_SCALE = isMobile ? 9 : 7.2; // overshoot guarantees the frame leaves the viewport on any aspect

  /* Window geometry in source-image fractions (measured from main.webp,
     5000x2500). Hole is slightly larger than the white area so compression
     jaggies on the rim fall inside transparency. Measured from layout size
     (offsetWidth/offsetHeight), which GSAP zoom transforms cannot distort —
     so the hole never drifts off the window mid-scroll. */
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

  /* Sky photo box: sized to the photo's exact cover rect. Clouds live inside
     the wrap, so their % positions are true photo fractions — the scroll
     glide carries clouds and photo as one. No ScrollTrigger on the clouds. */
  var skyLayer = document.getElementById('skyLayer');
  var skyPhotoWrap = document.getElementById('skyPhotoWrap');
  var skyPhoto = document.getElementById('skyPhoto');
  var skyTravel = { y: 0 };
  function fitSky(){
    if(!skyLayer || !skyPhotoWrap || !skyPhoto || !skyPhoto.naturalWidth) return;
    var W = skyLayer.offsetWidth, H = skyLayer.offsetHeight;
    if(!W || !H) return;
    var iw = skyPhoto.naturalWidth, ih = skyPhoto.naturalHeight;
    var s = Math.max(W/iw, H/ih); // object-fit:cover scale
    var rw = iw*s, rh = ih*s;
    skyPhotoWrap.style.width = rw.toFixed(1)+'px';
    skyPhotoWrap.style.height = rh.toFixed(1)+'px';
    skyPhotoWrap.style.left = ((W-rw)/2).toFixed(1)+'px';
    skyTravel.y = -(rh - H);
  }
  function fitSkyThenRefresh(){ fitSky(); ScrollTrigger.refresh(); }
  if(skyPhoto.complete && skyPhoto.naturalWidth){ fitSky(); }
  else{ skyPhoto.addEventListener('load', fitSkyThenRefresh); }
  window.addEventListener('resize', fitSky);
  ScrollTrigger.addEventListener('refresh', fitSky);

  // ---- intro: gentle settle on load (touches ONLY #stage + text —
  // never cabin/sky scale, which belong to the scrub timeline; sharing those
  // caused the blink/zoom snap when scrolling during the first second) ----
  var intro = gsap.timeline({defaults:{ease:'power3.out'}});
  intro.from('#stage',{opacity:0, scale:1.05, duration:1.4},0)
       .from('.hero-copy .eyebrow',{y:18, opacity:0, duration:.8},.3)
       .from('.hero-copy h1',{y:60, opacity:0, duration:1},.4)
       .from('.hero-copy p',{y:26, opacity:0, duration:.9},.6)
       .from('nav',{y:-24, opacity:0, duration:.8},.5)
       .from('.scroll-hint',{opacity:0, duration:.8},.9)
       .from('.drift',{opacity:0, duration:1.4},.7)
       .from('.puff',{opacity:0, duration:1.4},.8);

  // ---- main scroll zoom: pin + scrub ----
  var tl = gsap.timeline({
    defaults:{ease:'none'},
    scrollTrigger:{
      trigger:'#flight',
      start:'top top',
      end:'+=350%',
      scrub:true,
      pin:true,
      anticipatePin:1,
      invalidateOnRefresh:true,
      onUpdate:function(self){
        document.getElementById('progressBar').style.transform = 'scaleX(' + self.progress + ')';
        // fake altimeter for delight
        var alt = Math.round(3200 + self.progress * (45500 - 3200));
        document.getElementById('altNum').textContent = alt.toLocaleString('en-US');
      }
    }
  });

  // 0.00 - 0.22 : hero copy drifts up & out, hint fades
  tl.to('#heroCopy',{yPercent:-34, opacity:0, scale:.96, duration:.22, ease:'power1.in'},0);
  tl.to('#scrollHint',{opacity:0, duration:.12},0);

  // 0.00 - 1.00 : THE ZOOM — cabin rushes past camera, sky drifts slower (depth)
  tl.to('#cabinLayer',{scale:CABIN_SCALE, xPercent: -0.4, duration:1, ease:'power1.inOut',
      transformOrigin:'50.2% 49%'},0);
  // Phase 1 — push through the window, parked on the sky's very top edge
  tl.to('#skyLayer',{scale:1.18, yPercent:0, duration:.3, ease:'power1.inOut'},0);
  // Phase 2 — starts early, while the window is still opening: the layer grows
  // while the photo wrap glides up through its full length. Clouds ride
  // inside the wrap, so they scroll with the photo itself.
  tl.to('#skyLayer',{scale:1.45, duration:.85, ease:'power1.inOut'},.15);
  tl.to('#skyPhotoWrap',{y:function(){ return skyTravel.y; }, duration:.85, ease:'power1.inOut'},.15);

  // cloud band: non-stop right-to-left marquee (no yoyo / direction change).
  // The track holds 2 copies; sliding -50% lands exactly on the 2nd copy,
  // so the repeat is invisible. Runs on the wrapper so it never fights the
  // scroll-scrubbed parent.
  gsap.fromTo('#driftSingle',{xPercent:0},{xPercent:-50, duration:22, ease:'none', repeat:-1});
  // puffs breathe on their own too — wide infinite sweeps, opposite phases
  gsap.fromTo('#puffA img',{xPercent:25},{xPercent:-25, duration:10, ease:'none', repeat:-1, yoyo:true});
  gsap.fromTo('#puffB img',{xPercent:-30},{xPercent:30, duration:14, ease:'none', repeat:-1, yoyo:true});

  // 0.80 - 1.00 : cabin fully gone (it has left the frame anyway), sky settles full-bleed
  tl.to('#cabinLayer',{opacity:0, duration:.12, ease:'power1.out'},.84);
  // 0.68 - 1.00 : photo foot melts into the blue sheet, cabin hands off
  tl.to('#skyFade',{opacity:1, duration:.2, ease:'power1.out'},.68);
  tl.to('.vignette',{opacity:0, duration:.2},.8);

  window.addEventListener('load', function(){ ScrollTrigger.refresh(); });
})();
