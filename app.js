(function(){
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });

  // ---- smooth scroll ----
  let lenis = null;
  try{
    lenis = new Lenis({ smoothWheel:true, lerp:0.1 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function(time){ lenis.raf(time*1000); });
    gsap.ticker.lagSmoothing(0);
  }catch(e){ /* Lenis optional */ }

  var isMobile = window.matchMedia('(max-width: 700px)').matches;
  var CABIN_SCALE = isMobile ? 9 : 7.2; // text is INSIDE #cabinLayer, so it rides this zoom for free

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

  // ---- intro: touches ONLY #stage + text (never cabin/sky scale, which
  // belong to the scrub timeline) ----
  var intro = gsap.timeline({defaults:{ease:'power3.out'}});
  intro.from('#stage',{opacity:0, scale:1.05, duration:1.4},0)
       .from('.h-top',{y:60, opacity:0, duration:1},.35)
       .from('.h-mid',{y:60, opacity:0, duration:1},.45)
       .from('.h-bottom-left',{y:26, opacity:0, duration:.9},.65)
       .from('#windowBrand',{opacity:0, duration:1},.7)
       .from('#bookRow',{y:16, opacity:0, duration:.8},.8)
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
      end:'+=350%',
      scrub:true,
      pin:true,
      anticipatePin:1,
      invalidateOnRefresh:true,
      onUpdate:function(self){
        document.getElementById('progressBar').style.transform = 'scaleX(' + self.progress + ')';
      }
    }
  });

  // the label glides up and docks at the top by progress .8 — just as the
  // cabin fades out (.84), so it is already headered when the img is gone.
  // ease none keeps it 1:1 with the scrollbar the whole way.
  tl.to(windowBrand, {y:function(){ return -(window.innerHeight*0.49 - 34); },
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
  tl.to('#cabinLayer',{opacity:0, duration:.12, ease:'power1.out'},.84);
  tl.to('#skyFade',{opacity:1, duration:.2, ease:'power1.out'},.68);
  tl.to('.vignette',{opacity:0, duration:.2},.8);

  window.addEventListener('load', function(){ ScrollTrigger.refresh(); });
})();
