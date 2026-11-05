/* ZULORA opening v2 - plays the pre-rendered cosmic journey behind the interface.
   Only active when the page address contains ?opening=v2. Otherwise this file does nothing at all.
   It never edits the app's own code. If anything fails, the original opening takes over again. */
(function(){
  var q=location.search;
  if(!/[?&]opening=v2(&|$)/.test(q))return;

  var BASE=(document.currentScript&&document.currentScript.src||'').replace(/[^\/]*$/,'');
  var orig=window.requestAnimationFrame.bind(window),held=null,blocked=true,video=null,timers=[],capT=0,scenes=[],active=true;

  /* 1. Pause the old shader opening while the video plays (the old loop is the function named "loop"). */
  window.requestAnimationFrame=function(cb){
    if(blocked&&cb&&cb.name==='loop'){held=cb;return 987654321}
    return orig(cb)};

  function giveBack(why){
    if(!active)return;active=false;
    try{console.warn('Opening v2 off ->old opening ('+why+')')}catch(e){}
    blocked=false;timers.forEach(clearTimeout);clearTimeout(capT);
    if(video){try{video.pause()}catch(e){}video.remove();video=null}
    var c=document.getElementById('c');if(c)c.style.visibility='';
    if(held){var h=held;held=null;orig(h)}
  }

  function start(man){
    var tier=/[?&]tier=lite/.test(q)?'lite':/[?&]tier=hq/.test(q)?'hq':
      ((navigator.deviceMemory&&navigator.deviceMemory<=2)||(navigator.connection&&(navigator.connection.saveData||/2g/.test(navigator.connection.effectiveType||'')))?'lite':'hq');
    scenes=man.scenes||[];
    video=document.createElement('video');
    video.id='ov2';video.muted=true;video.defaultMuted=true;video.loop=true;video.autoplay=true;video.playsInline=true;
    video.setAttribute('playsinline','');video.setAttribute('webkit-playsinline','');video.setAttribute('muted','');
    video.setAttribute('aria-hidden','true');video.disablePictureInPicture=true;video.preload='auto';
    video.style.cssText='position:fixed;inset:0;width:100%;height:100%;object-fit:cover;z-index:0;background:#02030a;pointer-events:none';
    video.poster=BASE+man.files.poster;
    var st=document.createElement('style');
    st.textContent='body.ws #ov2{display:none}';document.head.appendChild(st);
    var c=document.getElementById('c');c.parentNode.insertBefore(video,c.nextSibling);
    video.src=BASE+man.files[tier];

    var playing=false;
    video.addEventListener('playing',function(){
      if(playing)return;playing=true;clearTimeout(boot);
      c.style.visibility='hidden';caption(true)});
    video.addEventListener('error',function(){giveBack('video error')});
    var boot=setTimeout(function(){if(!playing)giveBack('video too slow')},12000);
    video.addEventListener('timeupdate',function(){if(video.duration&&video.currentTime>video.duration-.06)video.currentTime=0});
    var p=video.play();if(p&&p.catch)p.catch(function(){
      var again=function(){if(video)video.play().catch(function(){})};
      addEventListener('touchstart',again,{once:true,passive:true});addEventListener('pointerdown',again,{once:true})});

    /* 2. Captions follow the video clock. */
    var cur=-2,cap=document.getElementById('cap');
    function caption(){
      if(!active)return;
      var t=video?video.currentTime:0,i=-1;
      for(var k=0;k<scenes.length;k++){var s=scenes[k];if(t>=s.start+.9&&t<s.end-.7){i=k;break}}
      if(i!==cur){
        cur=i;cap.classList.add('off');
        var want=i;
        timers.push(setTimeout(function(){
          if(!active||cur!==want)return;
          if(want>=0){var s=scenes[want];document.getElementById('tag').textContent=s.tag;document.getElementById('line').textContent=s.line;cap.dataset.s=s.style;cap.classList.remove('off')}
        },650));
      }
      capT=setTimeout(caption,250)}

    /* 3. Pause when the tab is hidden or the workspace is open; resume when back. */
    function sync(){
      if(!video)return;
      var off=document.hidden||document.body.classList.contains('ws');
      if(off){video.pause()}else if(video.paused){var q2=video.play();if(q2&&q2.catch)q2.catch(function(){})}
    }
    document.addEventListener('visibilitychange',sync);
    new MutationObserver(sync).observe(document.body,{attributes:true,attributeFilter:['class']});
  }

  function boot(){
    fetch(BASE+'manifest.json',{cache:'no-cache'}).then(function(r){if(!r.ok)throw 0;return r.json()})
      .then(start).catch(function(){giveBack('manifest missing')});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
