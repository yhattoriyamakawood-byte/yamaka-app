/* ===== 動画学習（選択 / ランダム）===== */
(function(){
  var DATA = window.VIDEO_DATA || [];
  var CATS = ['建物','土地','お金','関係者','その他'];
  var KEY_W = 'hop_video_watched', KEY_P = 'hop_video_pref';
  var watched = {}, pref = { pool:'全部', unw:true, sound:true };
  try{ watched = JSON.parse(localStorage.getItem(KEY_W)||'{}')||{}; }catch(e){}
  try{ var p = JSON.parse(localStorage.getItem(KEY_P)||'null'); if(p) pref = Object.assign(pref,p); }catch(e){}
  function save(){ try{ localStorage.setItem(KEY_W, JSON.stringify(watched)); localStorage.setItem(KEY_P, JSON.stringify(pref)); }catch(e){} }
  function $(id){ return document.getElementById(id); }
  function src(v){ return 'v/'+v.id+'.mp4'; }
  function poster(v){ return 'v/'+v.id+'.jpg'; }
  function nav(){ return document.querySelector('.nav-item[data-nav="video"]'); }
  function go(id){ navigate(id, nav()); }
  function mark(v){ if(!watched[v.id]){ watched[v.id]=Date.now(); save(); } }
  function shuffle(a){ a=a.slice(); for(var i=a.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)); var t=a[i]; a[i]=a[j]; a[j]=t; } return a; }
  var CHEV = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  /* ---------- ホーム ---------- */
  window.goVideoHub = function(){ stopAll(); renderHub(); go('video'); };
  function renderHub(){
    var done = DATA.filter(function(v){ return watched[v.id]; }).length;
    $('vh-done').textContent = done; $('vh-total').textContent = DATA.length;
    $('vh-bar').style.width = (DATA.length? done/DATA.length*100 : 0)+'%';
    var h = '';
    ['全部'].concat(CATS).forEach(function(c){ h += '<button class="vh-chip'+(pref.pool===c?' on':'')+'" onclick="vfPool(\''+c+'\')">'+(c==='全部'?'全部':c)+'</button>'; });
    $('vh-chips').innerHTML = h;
    $('vh-unw').classList.toggle('on', !!pref.unw);
    $('vh-unw').textContent = (pref.unw?'✓ ':'')+'未視聴を優先';
  }
  window.vfPool = function(c){ pref.pool = c; save(); renderHub(); };
  window.vfToggleUnwatched = function(){ pref.unw = !pref.unw; save(); renderHub(); };

  /* ---------- 選択：テーマ一覧 ---------- */
  window.vsOpen = function(){
    stopAll();
    var h = '';
    CATS.forEach(function(c){
      var subs = [], seen = {};
      DATA.forEach(function(v){ if(v.cat===c && !seen[v.sub]){ seen[v.sub]=1; subs.push(v.sub); } });
      h += '<div class="vs-cat"><i></i>'+c+'</div>';
      subs.forEach(function(s){
        var list = DATA.filter(function(v){ return v.cat===c && v.sub===s; });
        var d = list.filter(function(v){ return watched[v.id]; }).length;
        h += '<div class="vs-row tap" data-c="'+c+'" data-s="'+s+'"><div class="t">'+s+'</div><div class="c">'+d+' / '+list.length+'</div><div class="chev">'+CHEV+'</div></div>';
      });
    });
    $('vs-body').innerHTML = h;
    Array.prototype.forEach.call($('vs-body').querySelectorAll('.vs-row'), function(el){
      el.onclick = function(){ vlOpen(el.getAttribute('data-c'), el.getAttribute('data-s')); };
    });
    go('vselect');
  };

  /* ---------- 選択：動画一覧 ---------- */
  var curList = [], curIdx = 0, curCat = '', curSub = '';
  function vlOpen(c, s){
    curCat = c; curSub = s;
    curList = DATA.filter(function(v){ return v.cat===c && v.sub===s; });
    $('vl-title').textContent = s;
    var h = '';
    curList.forEach(function(v, i){
      h += '<div class="vl-item tap'+(watched[v.id]?' done':'')+'" data-i="'+i+'"><div class="th" style="background-image:url('+poster(v)+')"></div><div class="tt"><div class="no">'+c+' ／ '+(i+1)+'本目</div>'+v.title+'</div><div class="ck">'+(watched[v.id]?'✓':'')+'</div></div>';
    });
    $('vl-body').innerHTML = h;
    Array.prototype.forEach.call($('vl-body').querySelectorAll('.vl-item'), function(el){
      el.onclick = function(){ vfPlayList(curList, parseInt(el.getAttribute('data-i'),10)); };
    });
    go('vlist');
  }

  /* ---------- ランダム（スクロール）再生 ---------- */
  var feed = [], cur = -1, io = null, soundOn = true, needTap = false, feedMode = 'random';
  function buildOrder(){
    var pool = DATA.filter(function(v){ return pref.pool==='全部' || v.cat===pref.pool; });
    if(!pref.unw) return shuffle(pool);
    var un = pool.filter(function(v){ return !watched[v.id]; }), wa = pool.filter(function(v){ return watched[v.id]; });
    return shuffle(un).concat(shuffle(wa));
  }
  function itemEl(v, i){
    var s = document.createElement('section'); s.className = 'vf-item'; s.setAttribute('data-i', i);
    s.innerHTML = '<video playsinline webkit-playsinline preload="none" poster="'+poster(v)+'"></video>'
      +'<div class="vf-pause"></div><button class="vf-snd">🔊 タップして音を出す</button>'
      +'<div class="vf-info"><span class="tag">'+v.cat+' ／ '+v.sub+'</span><div class="ti">'+v.title+'</div><div class="cr">音声：VOICEVOX:WhiteCUL</div></div>'
      +'<div class="vf-prog"><i></i></div>';
    var vid = s.querySelector('video');
    vid.addEventListener('click', function(){ togglePlay(s, vid); });
    s.querySelector('.vf-snd').addEventListener('click', function(e){ e.stopPropagation(); soundOn = true; needTap = false; applySound(); });
    vid.addEventListener('timeupdate', function(){
      if(!vid.duration) return;
      s.querySelector('.vf-prog i').style.width = (vid.currentTime/vid.duration*100)+'%';
      if(vid.currentTime/vid.duration > 0.8) mark(feed[i]);
    });
    vid.addEventListener('ended', function(){ mark(feed[i]); next(); });
    return s;
  }
  function togglePlay(s, vid){
    if(vid.paused){ vid.play().catch(function(){}); s.classList.remove('paused'); }
    else { vid.pause(); s.classList.add('paused'); }
  }
  function appendBatch(){
    var order = buildOrder(), box = $('vf-scroll'), start = feed.length;
    order.forEach(function(v, k){ feed.push(v); var el = itemEl(v, start+k); box.appendChild(el); io.observe(el); });
  }
  function openFeed(list, startIdx, mode){
    stopAll();
    feedMode = mode;
    var box = $('vf-scroll'); box.innerHTML = ''; feed = []; cur = -1; soundOn = true; needTap = false;
    io = new IntersectionObserver(function(es){
      es.forEach(function(e){ if(e.isIntersecting && e.intersectionRatio >= 0.6){ activate(parseInt(e.target.getAttribute('data-i'),10)); } });
    }, { root: box, threshold: [0.6] });
    if(mode === 'random'){ appendBatch(); }
    else { list.forEach(function(v, k){ feed.push(v); var el = itemEl(v, k); box.appendChild(el); io.observe(el); }); }
    if(!feed.length){ alert('この対象には動画がありません'); return; }
    go('vfeed');
    box.scrollTop = startIdx * box.clientHeight;
    setTimeout(function(){ activate(startIdx, true); }, 30);
    var hint = document.createElement('div'); hint.className = 'vf-hint';
    hint.textContent = (startIdx < feed.length-1) ? '↑ 上にスワイプで次の動画' : '↓ 下にスワイプで前の動画';
    items()[startIdx].appendChild(hint);
    updateMuteIcon();
  }
  window.vfStart = function(){ openFeed(null, 0, 'random'); };
  window.vfPlayList = function(list, idx){ openFeed(list, idx, 'list'); };
  function items(){ return $('vf-scroll').children; }
  function load(i){
    var el = items()[i]; if(!el) return;
    var vid = el.querySelector('video');
    if(!vid.getAttribute('src')){ vid.src = src(feed[i]); vid.preload = 'auto'; }
  }
  function unload(i){
    var el = items()[i]; if(!el) return;
    var vid = el.querySelector('video');
    if(vid.getAttribute('src')){ vid.pause(); vid.removeAttribute('src'); vid.load(); }
    el.classList.remove('paused'); el.querySelector('.vf-prog i').style.width = '0';
  }
  function activate(i, force){
    if(i === cur && !force) return;
    cur = i;
    var n = items().length;
    for(var j=0;j<n;j++){ if(Math.abs(j-i) > 1) unload(j); }
    load(i-1>=0?i-1:i); load(i); load(i+1);
    for(var k=0;k<n;k++){ if(k!==i){ var o = items()[k].querySelector('video'); if(o && !o.paused) o.pause(); } }
    var el = items()[i]; if(!el) return;
    var vid = el.querySelector('video'); el.classList.remove('paused');
    vid.currentTime = 0;
    playWithSound(vid, el);
    if(feedMode==='random' && i >= n-3) appendBatch();
  }
  function playWithSound(vid, el){
    vid.muted = !soundOn;
    var pr = vid.play();
    if(pr && pr.catch) pr.catch(function(){
      vid.muted = true; needTap = true;
      var p2 = vid.play(); if(p2 && p2.catch) p2.catch(function(){});
      el.querySelector('.vf-snd').classList.add('show');
    });
    if(!soundOn) el.querySelector('.vf-snd').classList.remove('show');
  }
  function applySound(){
    var el = items()[cur]; if(!el) return;
    var vid = el.querySelector('video'); vid.muted = !soundOn;
    el.querySelector('.vf-snd').classList.remove('show');
    if(vid.paused && !el.classList.contains('paused')) vid.play().catch(function(){});
    updateMuteIcon();
  }
  function next(){
    var el = items()[cur+1]; if(!el && feedMode==='random'){ appendBatch(); el = items()[cur+1]; }
    if(el) el.scrollIntoView({ behavior:'smooth', block:'start' });
  }
  function updateMuteIcon(){
    $('vf-mute').style.opacity = soundOn ? '1' : '.6';
    $('vf-mute-ic').innerHTML = soundOn
      ? '<path d="M11 5L6 9H3v6h3l5 4V5z" stroke-linejoin="round"/><path d="M15.5 8.5a5 5 0 010 7M18.5 5.5a9 9 0 010 13" stroke-linecap="round"/>'
      : '<path d="M11 5L6 9H3v6h3l5 4V5z" stroke-linejoin="round"/><path d="M16 9l5 6M21 9l-5 6" stroke-linecap="round"/>';
  }
  window.vfToggleMute = function(){ soundOn = !soundOn; applySound(); updateMuteIcon(); };
  window.vfClose = function(){ var m = feedMode; stopAll(); if(m==='list') vlOpen(curCat, curSub); else goVideoHub(); };

  function stopAll(){
    Array.prototype.forEach.call(document.querySelectorAll('#screen-vfeed video'), function(v){
      try{ v.pause(); }catch(e){}
      if(v.getAttribute('src')){ v.removeAttribute('src'); v.load(); }
    });
    if(io){ io.disconnect(); io = null; }
    var box = $('vf-scroll'); if(box) box.innerHTML = '';
    feed = []; cur = -1;
  }
  /* 他の画面に移るときは再生を止める */
  var _show = window.showScreen;
  window.showScreen = function(id){
    if(id !== 'vfeed'){
      var act = document.querySelector('.screen.active');
      if(act && act.id==='screen-vfeed') stopAll();
    }
    _show(id);
  };
  document.addEventListener('keydown', function(e){
    var act = document.querySelector('.screen.active');
    if(!act || act.id !== 'screen-vfeed') return;
    if(e.key==='ArrowDown'){ var el = items()[cur+1]; if(el) el.scrollIntoView({behavior:'smooth'}); e.preventDefault(); }
    if(e.key==='ArrowUp'){ var el2 = items()[cur-1]; if(el2) el2.scrollIntoView({behavior:'smooth'}); e.preventDefault(); }
    if(e.key===' '){ var s = items()[cur]; if(s) togglePlay(s, s.querySelector('video')); e.preventDefault(); }
  });
})();
