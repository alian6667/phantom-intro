/* TAKE YOUR HEART — interactive intro
   Flow: calling card → click → shatter → subway standby → click → phone SNS UI → sub pages */
(function () {
  'use strict';
  var $ = function (s) { return document.querySelector(s);
};

  var stageCard = $('#stage-card');
  var shatterLayer = $('#shatter-layer');
  var shatterFlash = $('#shatter-flash');
  var stageSubway = $('#stage-subway');
  var stagePhone = $('#stage-phone');
  var commandWipe = $('#command-wipe');
  var subwayHint = $('#subway-hint');
  var subwayVideo = $('#subway-video');

  var state = 'card';      // card → subway → phone → sub
  var lock = false;
  var currentSub = null;

  /* ================= subway video: single seamless loop (no crossfade) ================= */
  subwayVideo.muted = true;
  subwayVideo.playsInline = true;
  subwayVideo.preload = 'auto';
  subwayVideo.loop = true;
  // try to start immediately; if blocked, retry on first user gesture
  function startVideo() {
    var p = subwayVideo.play();
    if (p && typeof p.catch === 'function') {
      p.catch(function () {
        document.addEventListener('pointerdown', function retry() {
          subwayVideo.play().catch(function () {});
          document.removeEventListener('pointerdown', retry);
        }, { once: true });
      });
    }
  }

  /* ================= subway background music ================= */
  var subwayBgm = $('#subwayBgm');
  function playSubwayBgm() {
    if (!subwayBgm) return;
    subwayBgm.volume = 0.6;
    var p = subwayBgm.play();
    if (p && typeof p.catch === 'function') p.catch(function () {});
  }
  function stopSubwayBgm() {
    if (!subwayBgm) return;
    subwayBgm.pause();
  }

  /* ================= calling card background music ================= */
  var cardBgm = $('#cardBgm');
  var cardBgmUnlocked = false;   // becomes true after first successful play
  function playCardBgm() {
    if (!cardBgm) return;
    cardBgm.volume = 0.6;
    var p = cardBgm.play();
    if (p && typeof p.then === 'function') {
      p.then(function () { cardBgmUnlocked = true; })
       .catch(function () { /* blocked; will retry on next user gesture */ });
    } else {
      cardBgmUnlocked = true;
    }
  }
  function stopCardBgm() {
    if (!cardBgm) return;
    cardBgm.pause();
  }
  // try autoplay on load; if blocked, retry on EVERY user click until success
  playCardBgm();
  document.addEventListener('click', function unlockCardBgm() {
    if (!cardBgmUnlocked && state === 'card' && cardBgm && cardBgm.paused) {
      playCardBgm();
    }
  });
  // also try on pointerdown for better browser compatibility
  document.addEventListener('pointerdown', function () {
    if (!cardBgmUnlocked && state === 'card' && cardBgm && cardBgm.paused) {
      playCardBgm();
    }
  });
  startVideo();

  /* ================= future page background music ================= */
  var futureBgm = $('#futureBgm');
  function playFutureBgm() {
    if (!futureBgm) return;
    futureBgm.volume = 0.6;
    var p = futureBgm.play();
    if (p && typeof p.catch === 'function') p.catch(function () {});
  }
  function stopFutureBgm() {
    if (!futureBgm) return;
    futureBgm.pause();
  }
  /* ---------- profile page background audio ---------- */
  var profileBgm = $('#profileBgm');
  function playProfileBgm() {
    if (!profileBgm) return;
    profileBgm.volume = 0.7;
    var p = profileBgm.play();
    if (p && p.catch) p.catch(function () { /* autoplay blocked; will retry on next user gesture */ });
  }
  function stopProfileBgm() {
    if (!profileBgm) return;
    profileBgm.pause();
  }
  /* ---------- hobby main page background audio ---------- */
  var hobbyBgm = $('#hobbyBgm');
  function playHobbyBgm() {
    if (!hobbyBgm) return;
    hobbyBgm.volume = 0.7;
    var p = hobbyBgm.play();
    if (p && p.catch) p.catch(function () { /* autoplay blocked; retry on next gesture */ });
  }
  function stopHobbyBgm() {
    if (!hobbyBgm) return;
    hobbyBgm.pause();
  }

  /* ================= real-time clock (phone + subway board + corner tag) ================= */
  var clockPhone = $('#clock-phone');
  var clockSubway = $('#clock-subway');
  var clockBoard = $('#clock-board');
  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function tickClock() {
    var d = new Date();
    var hm = pad(d.getHours()) + ':' + pad(d.getMinutes());
    var hms = hm + ':' + pad(d.getSeconds());
    if (clockPhone) clockPhone.textContent = hm;
    if (clockSubway) clockSubway.textContent = hm;
    if (clockBoard) clockBoard.textContent = hms;
  }
  tickClock();
  setInterval(tickClock, 1000);

  /* ================= shatter transition ================= */
  function buildShards(x, y) {
    shatterLayer.innerHTML = '';
    var w = window.innerWidth, h = window.innerHeight;
    var diag = Math.sqrt(w * w + h * h);
    var R = diag * 0.75;
    var N = 22;
    var step = (Math.PI * 2) / N;
    var i, a0, a1, ax, ay, p1x, p1y, p2x, p2y;

    function addShard(pts, big) {
      // shrink polygon toward its centroid → crack gaps
      var cx = (pts[0][0] + pts[1][0] + pts[2][0]) / 3;
      var cy = (pts[0][1] + pts[1][1] + pts[2][1]) / 3;
      var k = big ? 0.968 : 0.94;
      var sp = pts.map(function (p) {
        return [cx + (p[0] - cx) * k, cy + (p[1] - cy) * k];
      });
      var el = document.createElement('div');
      el.className = 'shard';
      el.style.clipPath = 'polygon(' +
        sp[0][0].toFixed(1) + 'px ' + sp[0][1].toFixed(1) + 'px,' +
        sp[1][0].toFixed(1) + 'px ' + sp[1][1].toFixed(1) + 'px,' +
        sp[2][0].toFixed(1) + 'px ' + sp[2][1].toFixed(1) + 'px)';

      // flight vector from click point through shard centroid
      var dx = cx - x, dy = cy - y;
      var len = Math.sqrt(dx * dx + dy * dy) || 1;
      dx /= len; dy /= len;
      var dist = Math.max(w, h) * (0.55 + Math.random() * 0.95);
      var rot = (Math.random() - 0.5) * 260;
      var dur = 0.85 + Math.random() * 0.5;
      var delay = Math.random() * 0.12;
      el.dataset.fx = (dx * dist).toFixed(0);
      el.dataset.fy = (dy * dist + Math.max(w, h) * 0.25).toFixed(0); // slight gravity
      el.dataset.fr = rot.toFixed(0);
      el.dataset.fd = dur.toFixed(2);
      el.dataset.fdel = (delay + 0.28).toFixed(2);
      shatterLayer.appendChild(el);
    }

    // outer wedges (fan around click point)
    for (i = 0; i < N; i++) {
      a0 = i * step + (Math.random() - 0.5) * step * 0.9;
      a1 = (i + 1) * step + (Math.random() - 0.5) * step * 0.9;
      ax = x + (Math.random() - 0.5) * 60;
      ay = y + (Math.random() - 0.5) * 60;
      p1x = x + Math.cos(a0) * R * (0.9 + Math.random() * 0.35);
      p1y = y + Math.sin(a0) * R * (0.9 + Math.random() * 0.35);
      p2x = x + Math.cos(a1) * R * (0.9 + Math.random() * 0.35);
      p2y = y + Math.sin(a1) * R * (0.9 + Math.random() * 0.35);
      addShard([[ax, ay], [p1x, p1y], [p2x, p2y]], true);
    }
    // inner small shards near impact point
    for (i = 0; i < 8; i++) {
      a0 = Math.random() * Math.PI * 2;
      a1 = a0 + 0.4 + Math.random() * 0.7;
      ax = x + (Math.random() - 0.5) * 30;
      ay = y + (Math.random() - 0.5) * 30;
      var r2 = 60 + Math.random() * 160;
      addShard([[ax, ay],
        [x + Math.cos(a0) * r2, y + Math.sin(a0) * r2],
        [x + Math.cos(a1) * r2, y + Math.sin(a1) * r2]], false);
    }

    // burning core at impact point
    var core = document.createElement('div');
    core.className = 'core';
    var cs = Math.round(Math.min(w, h) * 0.34);
    core.style.cssText = 'left:' + x + 'px;top:' + y + 'px;width:' + cs + 'px;height:' + cs + 'px;';
    shatterLayer.appendChild(core);
  }

  function shatter(x, y, done) {
    // freeze current card visual into shards, hide original
    buildShards(x, y);
    shatterLayer.classList.add('on');
    shatterFlash.style.left = x + 'px';
    shatterFlash.style.top = y + 'px';
    shatterFlash.classList.add('on');
    stageCard.style.visibility = 'hidden';

    // reveal subway underneath (videos already playing)
    stageSubway.classList.add('visible');
    shatterLayer.classList.add('shake');

    // launch shards after crack moment
    setTimeout(function () {
      var shards = shatterLayer.querySelectorAll('.shard');
      var maxEnd = 0;
      shards.forEach(function (el) {
        var d = parseFloat(el.dataset.fd), del = parseFloat(el.dataset.fdel);
        maxEnd = Math.max(maxEnd, d + del);
        el.style.transition =
          'transform ' + d + 's cubic-bezier(.55,.06,.68,.19) ' + del + 's,' +
          'opacity .38s ease-in ' + (d + del - 0.34) + 's';
        el.style.transform = 'translate(' + el.dataset.fx + 'px,' + el.dataset.fy + 'px) rotate(' + el.dataset.fr + 'deg)';
        el.style.opacity = '0';
      });
      shatterLayer.classList.remove('shake');
      setTimeout(function () {
        shatterLayer.classList.remove('on');
        shatterLayer.innerHTML = '';
        shatterFlash.classList.remove('on');
        stageCard.style.display = 'none';
        done();
      }, (maxEnd + 0.1) * 1000);
    }, 290);
  }

  /* ================= state transitions ================= */
  stageCard.addEventListener('click', function (e) {
    if (lock || state !== 'card') return;
    e.stopPropagation();
    lock = true;
    // user gesture: ensure subway video is running before reveal
    subwayVideo.play().catch(function () {});
    stopCardBgm();
    shatter(e.clientX, e.clientY, function () {
      state = 'subway';
      playSubwayBgm();
      lock = false;
    });
  });

  stageSubway.addEventListener('click', function () {
    if (lock || state !== 'subway') return;
    openPhone();
  });

  /* ================= hand+phone frame sequence ================= */
  var frameEls = [], FRAME_MS = 145, frameDone = false;

  (function initFrames() {
    var imgs = $('.handphone').querySelectorAll('img.frame');
    for (var i = 0; i < imgs.length; i++) frameEls.push(imgs[i]);
  })();

  function showFrame(i) {
    for (var k = 0; k < frameEls.length; k++) {
      frameEls[k].classList.toggle('on', k === i);
    }
  }

  function playFrames() {
    showFrame(0);
    stagePhone.classList.remove('ui-ready');
    if (frameDone) {
      showFrame(frameEls.length - 1);
      stagePhone.classList.add('ui-ready');
      return;
    }
    var i = 0;
    var timer = setInterval(function () {
      i++;
      if (i >= frameEls.length) {
        clearInterval(timer);
        frameDone = true;
        stagePhone.classList.add('ui-ready');
        return;
      }
      showFrame(i);
    }, FRAME_MS);
  }

  function openPhone() {
    lock = true;
    stopSubwayBgm();
    stagePhone.classList.add('on');
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        stagePhone.classList.add('show');
        playFrames();
      });
    });
    setTimeout(function () {
      state = 'phone';
      lock = false;
    }, 500);
  }

  function closePhone() {
    lock = true;
    stagePhone.classList.remove('show', 'ui-ready');
    frameDone = false;
    setTimeout(function () {
      stagePhone.classList.remove('on');
      state = 'subway';
      playSubwayBgm();
      lock = false;
    }, 650);
  }

  $('#phone-dim').addEventListener('click', function () {
    if (lock || state !== 'phone') return;
    closePhone();
  });
  $('#phone-return').addEventListener('click', function (e) {
    e.stopPropagation();
    if (lock || state !== 'phone') return;
    closePhone();
  });

  /* ================= command wipe → sub page ================= */
  function commandTo(pageId) {
    lock = true;
    commandWipe.classList.add('on');
    // force reflow so bars restart
    void commandWipe.offsetWidth;
    commandWipe.classList.add('go');

    setTimeout(function () {
      if (currentSub) {
        $('#page-' + currentSub).classList.remove('active');
        if (currentSub === 'future') stopFutureBgm();
        if (currentSub === 'profile') stopProfileBgm();
        if (currentSub === 'hobby') stopHobbyBgm();
        currentSub = null;
      }
      if (pageId) {
        stagePhone.classList.remove('show', 'on');
        if (pageId === 'hobby') resetHobby();
        $('#page-' + pageId).classList.add('active');
        currentSub = pageId;
        state = 'sub';
        stopSubwayBgm();
        if (pageId === 'profile') playProfileBgm();
        if (pageId === 'hobby') playHobbyBgm();
      } else {
        stagePhone.classList.add('on');
        requestAnimationFrame(function () {
          requestAnimationFrame(function () { stagePhone.classList.add('show'); });
        });
        state = 'phone';
        stopProfileBgm();
        playSubwayBgm();
      }
    }, 470);

    setTimeout(function () {
      commandWipe.classList.remove('go', 'on');
      lock = false;
    }, 1020);
  }

  document.querySelectorAll('.menu-btn').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (lock || state !== 'phone') return;
      if (btn.dataset.page === 'future') { playFuture(); return; }
      commandTo(btn.dataset.page);
    });
  });

  document.querySelectorAll('[data-back]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (lock || state !== 'sub') return;
      commandTo(null);
    });
  });

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape' || lock) return;
    if (state === 'sub') {
      if (currentSub === 'hobby' && $('#page-hobby-detail').classList.contains('active')) closeHobbyDetail();
      else commandTo(null);
    }
    else if (state === 'phone') closePhone();
  });

  /* ================= hobbies page : 网络 / 现实 → cards → detail ================= */
  var HOBBY = {
    net: {
      cards: [
        { id: 'music', cn: '音乐', en: 'MUSIC', tag: '网络 · 01' },
        { id: 'game', cn: '游戏', en: 'GAMES', tag: '网络 · 02' }
      ]
    },
    real: {
      cards: [
        { id: 'beads', cn: '拼豆', en: 'PERLER BEADS', tag: '现实 · 01' },
        { id: 'record', cn: '记录', en: 'RECORD', tag: '现实 · 02' }
      ]
    }
  };

  var HOB_DETAIL = {
    music: {
      cn: '音乐', en: 'MUSIC', tag: '网络 · ONLINE',
      items: [
        { h: '喜欢的歌手', p: '许嵩 周杰伦 科莫 比伯 霉霉 Caravan Palace' },
        { h: '喜欢的歌——风格特点', p: 'phonk 古典乐 摇滚 歌剧 流行歌曲 各种语言的等等等等，甚至是老一辈的歌，没有特定风格偏向，好听的歌都有被喜欢的资格，我的歌品绝对好！' },
        { h: 'KTV 状态', p: '出奇地爱唱，也是出奇地容易跑调，虽然自我感觉良好，但被舍友阻止的时候心悄悄碎了...只能颅内自嗨了' }
      ]
    },
    game: {
      cn: '游戏', en: 'GAMES', tag: '网络 · ONLINE',
      items: [
        { h: '目前主打fps类', p: '三角洲行动（又爱又恨最典） 无畏契约（端游已被虐老实，手游我想你了）' },
        { h: '目前主玩二游类', p: '蔚蓝档案（嘎啦给木，但是要打枪） 重返未来1999（美学鉴赏、剧情深度） 崩坏星穹铁道（可恶的膨胀神游，我想你以前的优质剧情了）' },
        { h: '广泛涉猎的来', p: '目前还玩phigros 冰与火之舞这类音游，还有很多市面上的游戏大多都玩过，但是退坑，电脑上涉猎较少，ps4略有涉及），什么游戏或许我都能跟你唠上两句捏' }
      ]
    },
    beads: {
      cn: '拼豆', en: 'PERLER BEADS', tag: '现实 · REAL',
      note: '拼豆店一坐就是一天、一下午，出乎意料的也是一种锻炼耐力的方式，我居然真能规规矩矩坐着拼这一颗颗小东西一整天？！拼完非常有成就感，但是我的马内也就这么水灵灵地流走了...',
      items: [
        { h: '一颗一颗拼起来', p: '把喜欢的图案做成实体，耐心值直接拉满。熨完那一刻最爽。' },
        { h: '常用作品', p: '角色头像、迷你挂件、钥匙扣，做多了会开始给朋友批量生产。' },
        { h: '战绩', p: '一坐就是一下午，桌上永远散着几盒没收拾的豆子。' }
      ]
    },
    record: {
      cn: '记录', en: 'RECORDS', tag: '现实 · REAL',
      note: '喜欢旅行，喜欢拍照记录生活。相机定格的不只是画面，是转瞬即逝的日常。随手拍下旅游的风景、月亮、地上的树叶、朋友聚会的时光……把细碎的美好收好，不必追求完美构图，拍照记录生活，记录自己的每一份快乐。',
      items: []
    }
  };

  var hbCards = $('#hbCards');
  var hobbyGroup = null;

  function renderHobbyCards(group) {
    var g = HOBBY[group];
    hbCards.classList.remove('in');
    hbCards.innerHTML = '';
    g.cards.forEach(function (c) {
      var el = document.createElement('button');
      el.className = 'hb-card';
      el.dataset.hobby = c.id;
      el.innerHTML =
        '<span class="tag">' + c.tag + '</span>' +
        '<span class="thumb"><img src="assets/cards/' + c.id + '.jpg" alt=""></span>' +
        '<span class="nm">' + c.cn + '</span>' +
        '<span class="en">' + c.en + '</span>';
      hbCards.appendChild(el);
    });
    void hbCards.offsetWidth;
    hbCards.classList.add('in');
  }

  function setHobbyGroup(group) {
    hobbyGroup = group;
    var mains = document.querySelectorAll('.hb-main');
    for (var i = 0; i < mains.length; i++) {
      mains[i].classList.toggle('on', mains[i].dataset.group === group);
    }
    if (group) renderHobbyCards(group);
    else hbCards.classList.remove('in');
  }

  document.querySelectorAll('.hb-main').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (lock || state !== 'sub') return;
      var g = btn.dataset.group;
      setHobbyGroup(hobbyGroup === g ? null : g);
    });
  });

  hbCards.addEventListener('click', function (e) {
    var card = e.target.closest ? e.target.closest('.hb-card') : null;
    if (!card || lock || state !== 'sub') return;
    openHobbyDetail(card.dataset.hobby);
  });

  /* ---------- pink crystal-shard wipe (ref: BA transition) ---------- */
  var polyWipeEl = $('#poly-wipe');
  var SHARD_GRAD = [
    'linear-gradient(135deg,#ffe4f0 0%,#ffbbd7 52%,#ff9cc4 100%)',
    'linear-gradient(135deg,#ffffff 0%,#fff4fa 46%,#ffe1ef 100%)',
    'linear-gradient(135deg,#e9fff9 0%,#aaf2df 58%,#82e8d2 100%)',
    'linear-gradient(135deg,#f6ffff 0%,#cdf2ff 48%,#a6e3fb 100%)',
    'linear-gradient(135deg,#fff7fe 0%,#fbdcff 58%,#efbaff 100%)',
    'linear-gradient(135deg,#f8f4ff 0%,#e0d6ff 54%,#cabaff 100%)'
  ];
  var SHARD_SHAPE = [
    'polygon(50% 0,100% 100%,0 100%)',
    'polygon(0 0,100% 14%,72% 100%)',
    'polygon(0 18%,100% 0,86% 100%)',
    'polygon(16% 0,100% 0,50% 100%)',
    'polygon(0 0,100% 48%,44% 100%)'
  ];

  function polyWipe(mid, done) {
    var W = window.innerWidth, H = window.innerHeight;
    polyWipeEl.innerHTML = '<div class="wash"></div><div class="flash"></div>';
    var cols = 4, rows = 3, i = 0;
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++, i++) {
        var sh = document.createElement('i');
        sh.className = 'shard';
        var w = W * (0.46 + Math.random() * 0.22);
        var h = H * (0.54 + Math.random() * 0.24);
        var x = (c + 0.5) * (W / cols) - w * 0.5 + (Math.random() - 0.5) * W * 0.1;
        var y = (r + 0.5) * (H / rows) - h * 0.5 + (Math.random() - 0.5) * H * 0.1;
        sh.style.cssText =
          'left:' + x.toFixed(0) + 'px;top:' + y.toFixed(0) + 'px;' +
          'width:' + w.toFixed(0) + 'px;height:' + h.toFixed(0) + 'px;' +
          'background:' + SHARD_GRAD[(r * cols + c) % SHARD_GRAD.length] + ';' +
          'clip-path:' + SHARD_SHAPE[(r * 3 + c * 2) % SHARD_SHAPE.length] + ';' +
          '--r:' + ((Math.random() - 0.5) * 46).toFixed(0) + 'deg;' +
          'transition-delay:' + ((i % 5) * 0.025).toFixed(3) + 's;';
        polyWipeEl.appendChild(sh);
      }
    }
    /* scattered white plus marks, like the reference */
    for (var p = 0; p < 11; p++) {
      var plus = document.createElement('i');
      plus.className = 'plus';
      plus.style.cssText =
        'left:' + (Math.random() * 92 + 3).toFixed(1) + '%;' +
        'top:' + (Math.random() * 88 + 5).toFixed(1) + '%;' +
        '--pl:' + (14 + Math.random() * 26).toFixed(0) + 'px;' +
        'transition-delay:' + (0.06 + Math.random() * 0.22).toFixed(2) + 's;';
      polyWipeEl.appendChild(plus);
    }
    var em = document.createElement('div');
    em.className = 'emblem';
    em.innerHTML = '<svg viewBox="0 0 100 100"><use href="#star4"/></svg>';
    polyWipeEl.appendChild(em);

    polyWipeEl.classList.add('on');
    void polyWipeEl.offsetWidth;
    polyWipeEl.classList.add('in');

    setTimeout(function () { if (mid) mid(); }, 430);
    setTimeout(function () {
      polyWipeEl.classList.remove('in');
      polyWipeEl.classList.add('out');
    }, 830);
    setTimeout(function () {
      polyWipeEl.classList.remove('on', 'out');
      polyWipeEl.innerHTML = '';
      if (done) done();
    }, 1400);
  }

  /* ---------- beads gallery : curtain + rotating carousel ---------- */
  var beadPhotos = null, beadSlots = [], beadTimer = null, beadBusy = false;
  // 5 slots: 0=far-left(hidden), 1=left, 2=center, 3=right, 4=far-right(hidden)
  var BEAD_POS = [
    { tx:'-60%', sc:0.38, rot:-13, zi:2, op:0 },
    { tx:'-30%', sc:0.66, rot:-6,  zi:5, op:1 },
    { tx:'0',    sc:1.00, rot:0,   zi:10, op:1 },
    { tx:'30%',  sc:0.66, rot:6,   zi:5, op:1 },
    { tx:'60%',  sc:0.38, rot:13,  zi:2, op:0 }
  ];
  function applyBeadSlot(photo, slot, instant) {
    var p = BEAD_POS[slot];
    photo.style.transition = instant ? 'none' : '';
    photo.style.setProperty('--tx', p.tx);
    photo.style.setProperty('--sc', p.sc);
    photo.style.setProperty('--rot', p.rot + 'deg');
    photo.style.setProperty('--zi', p.zi);
    photo.style.setProperty('--op', p.op);
    if (instant) { void photo.offsetWidth; photo.style.transition = ''; }
  }
  function rotateBeads() {
    if (beadBusy || !beadPhotos) return;
    beadBusy = true;
    beadSlots = beadSlots.map(function (s) { return (s + 1) % 5; });
    for (var i = 0; i < beadPhotos.length; i++) applyBeadSlot(beadPhotos[i], beadSlots[i], false);
    setTimeout(function () {
      for (var i = 0; i < beadPhotos.length; i++) {
        if (beadSlots[i] === 4) { beadSlots[i] = 0; applyBeadSlot(beadPhotos[i], 0, true); }
      }
      beadBusy = false;
    }, 920);
  }
  function startBeadsCarousel() {
    var page = $('#page-hobby-detail');
    var gallery = page.querySelector('.hd-gallery.bead');
    if (!gallery) return;
    stopBeadsCarousel();
    beadPhotos = gallery.querySelectorAll('.bead-photo');
    beadSlots = [0, 1, 2, 3];
    for (var i = 0; i < beadPhotos.length; i++) applyBeadSlot(beadPhotos[i], beadSlots[i], true);
    void gallery.offsetWidth;
    page.classList.add('curtains-open');
    beadTimer = setInterval(rotateBeads, 2400);
  }
  function stopBeadsCarousel() {
    if (beadTimer) { clearInterval(beadTimer); beadTimer = null; }
    beadBusy = false;
    var page = $('#page-hobby-detail');
    if (page) page.classList.remove('curtains-open');
  }

  /* ---------- record gallery : horizontal staggered carousel ---------- */
  var recPhotos = null, recStart = 0, recTimer = null, recBusy = false;
  // 5 visible slots laid out left-to-right (平铺, not stacked):
  // 0=exiting(left+up,faded) 1=main(center,largest) 2=right-medium 3=far-right-small 4=entering(far-right,faded)
  var REC_SLOT_COUNT = 5;
  var REC_POS = [
    { tx:'-22%', ty:'-62%', sc:0.95, rot:0, zi:2, op:0 },
    { tx:'0',    ty:'0',    sc:1.00, rot:0, zi:10,op:1 },
    { tx:'27%',  ty:'7%',   sc:0.60, rot:0, zi:6, op:1 },
    { tx:'50%',  ty:'5%',   sc:0.45, rot:0, zi:4, op:1 },
    { tx:'80%',  ty:'0',    sc:0.35, rot:0, zi:2, op:0 }
  ];
  function applyRecSlot(photo, slot, instant) {
    var p = REC_POS[slot];
    photo.style.transition = instant ? 'none' : '';
    photo.style.setProperty('--tx', p.tx);
    photo.style.setProperty('--ty', p.ty);
    photo.style.setProperty('--sc', p.sc);
    photo.style.setProperty('--rot', p.rot + 'deg');
    photo.style.setProperty('--zi', p.zi);
    photo.style.setProperty('--op', p.op);
    if (instant) { void photo.offsetWidth; photo.style.transition = ''; }
  }
  function hideRecPhoto(photo, instant) {
    photo.style.transition = instant ? 'none' : '';
    photo.style.setProperty('--tx', '120%');
    photo.style.setProperty('--ty', '0');
    photo.style.setProperty('--sc', '0.3');
    photo.style.setProperty('--rot', '0deg');
    photo.style.setProperty('--zi', '1');
    photo.style.setProperty('--op', '0');
    if (instant) { void photo.offsetWidth; photo.style.transition = ''; }
  }
  // recStart = index of the photo currently sitting at slot 0.
  // photo i occupies slot (i - recStart + n) % n ; only slots 0..REC_SLOT_COUNT-1 are visible.
  function renderRec(instant) {
    var n = recPhotos.length;
    for (var i = 0; i < n; i++) {
      var slot = (i - recStart + n) % n;
      if (slot < REC_SLOT_COUNT) applyRecSlot(recPhotos[i], slot, instant);
      else hideRecPhoto(recPhotos[i], instant);
    }
  }
  function setRecordBg() {
    var page = $('#page-hobby-detail');
    var bg = page.querySelector('.hd-rec-bg');
    if (!bg || !recPhotos) return;
    // the main (center) photo lives at slot 1
    var mainIdx = (recStart + 1) % recPhotos.length;
    var img = recPhotos[mainIdx].querySelector('img');
    if (img) bg.style.backgroundImage = "url('" + img.src + "')";
    updateRecProgress(mainIdx);
  }
  // build / refresh the left vertical photo-progress timeline
  function updateRecProgress(mainIdx) {
    var page = $('#page-hobby-detail');
    var bar = page.querySelector('.rec-progress');
    if (!bar || !recPhotos) return;
    var n = recPhotos.length;
    // build dots once
    if (bar.childElementCount !== n) {
      bar.innerHTML = '';
      for (var i = 0; i < n; i++) {
        var d = document.createElement('span');
        d.className = 'dot';
        d.style.top = (i === 0 ? 6 : i === n - 1 ? 94 : (6 + (88 * i / (n - 1)))) + '%';
        bar.appendChild(d);
      }
    }
    var dots = bar.querySelectorAll('.dot');
    for (var j = 0; j < dots.length; j++) {
      dots[j].classList.toggle('active', j === mainIdx);
    }
  }
  function rotateRecords() {
    if (recBusy || !recPhotos) return;
    recBusy = true;
    // photos drift right -> left: advance the start pointer so each photo's slot decreases
    recStart = (recStart + 1) % recPhotos.length;
    renderRec(false);
    setRecordBg();
    setTimeout(function () { recBusy = false; }, 920);
  }
  function startRecordCarousel() {
    var page = $('#page-hobby-detail');
    var gallery = page.querySelector('.hd-gallery.rec');
    if (!gallery) return;
    stopRecordCarousel();
    // move note inside the left column so big title + small text sit together
    var left = page.querySelector('.hd-left');
    var note = $('#hdNote');
    if (left && note && note.parentNode !== left) left.appendChild(note);
    recPhotos = gallery.querySelectorAll('.hd-photo');
    // start with the first photo as the main (center) one at slot 1
    recStart = (recPhotos.length - 1) % recPhotos.length;
    renderRec(true);
    setRecordBg();
    void gallery.offsetWidth;
    recTimer = setInterval(rotateRecords, 2800);
  }
  function stopRecordCarousel() {
    if (recTimer) { clearInterval(recTimer); recTimer = null; }
    recBusy = false;
    // move note back outside .hd-wrap to restore the original structure
    var page = $('#page-hobby-detail');
    var note = $('#hdNote');
    var wrap = page.querySelector('.hd-wrap');
    if (note && wrap && note.parentNode !== wrap.parentNode) {
      wrap.parentNode.insertBefore(note, wrap.nextSibling);
    }
  }

  function renderHobbyDetail(id) {
    var d = HOB_DETAIL[id];
    if (!d) return;
    $('#hdTag').textContent = d.tag;
    $('#hdTitle').textContent = d.cn;
    $('#hdEn').textContent = d.en;
    $('#hdIco').innerHTML = '<img src="assets/cards/' + id + '.jpg" alt="">';
    $('#hdNote').textContent = d.note || '';
    $('#page-hobby-detail').classList.toggle('music', id === 'music');
    $('#page-hobby-detail').classList.toggle('game', id === 'game');
    $('#page-hobby-detail').classList.toggle('beads', id === 'beads');
    $('#page-hobby-detail').classList.toggle('record', id === 'record');
    var box = $('#hdCards');
    box.innerHTML = '';
    d.items.forEach(function (it) {
      var el = document.createElement('div');
      el.className = 'hd-card';
      el.innerHTML = '<h4>' + it.h + '</h4><p>' + it.p + '</p>';
      box.appendChild(el);
    });
  }

  function openHobbyDetail(id) {
    lock = true;
    stopHobbyBgm();
    polyWipe(function () {
      renderHobbyDetail(id);
      $('#page-hobby').classList.remove('active');
      $('#page-hobby-detail').classList.add('active');
      // keep curtains closed during wipe; open after transition completes
    }, function () {
      if (id === 'beads') startBeadsCarousel(); else stopBeadsCarousel();
      if (id === 'record') startRecordCarousel(); else stopRecordCarousel();
      if (id === 'music') { playMusicBgm(); stopRecordBgm(); stopBeadsBgm(); stopGameBgm(); }
      else if (id === 'record') { playRecordBgm(); stopMusicBgm(); stopBeadsBgm(); stopGameBgm(); }
      else if (id === 'beads') { playBeadsBgm(); stopMusicBgm(); stopRecordBgm(); stopGameBgm(); }
      else if (id === 'game') { playGameBgm(); stopMusicBgm(); stopRecordBgm(); stopBeadsBgm(); }
      else { stopMusicBgm(); stopRecordBgm(); stopBeadsBgm(); stopGameBgm(); }
      lock = false;
    });
  }

  /* ---------- music page background audio ---------- */
  var musicBgm = null, musicUnlocked = false;
  function getMusicBgm() {
    if (!musicBgm) musicBgm = $('#musicBgm');
    return musicBgm;
  }
  function playMusicBgm() {
    var a = getMusicBgm();
    if (!a) return;
    a.volume = 0.7;
    var p = a.play();
    if (p && p.catch) p.catch(function () { /* autoplay blocked; will retry on next user gesture */ });
  }
  function stopMusicBgm() {
    var a = getMusicBgm();
    if (!a) return;
    a.pause();
  }
  /* ---------- record page background audio ---------- */
  var recordBgm = null;
  function getRecordBgm() {
    if (!recordBgm) recordBgm = $('#recordBgm');
    return recordBgm;
  }
  function playRecordBgm() {
    var a = getRecordBgm();
    if (!a) return;
    a.volume = 0.7;
    var p = a.play();
    if (p && p.catch) p.catch(function () { /* autoplay blocked; will retry on next user gesture */ });
  }
  function stopRecordBgm() {
    var a = getRecordBgm();
    if (!a) return;
    a.pause();
  }
  /* ---------- beads page background audio ---------- */
  var beadsBgm = null;
  function getBeadsBgm() {
    if (!beadsBgm) beadsBgm = $('#beadsBgm');
    return beadsBgm;
  }
  function playBeadsBgm() {
    var a = getBeadsBgm();
    if (!a) return;
    a.volume = 0.7;
    var p = a.play();
    if (p && p.catch) p.catch(function () { /* autoplay blocked; will retry on next user gesture */ });
  }
  function stopBeadsBgm() {
    var a = getBeadsBgm();
    if (!a) return;
    a.pause();
  }
  /* ---------- game page background audio ---------- */
  var gameBgm = null;
  function getGameBgm() {
    if (!gameBgm) gameBgm = $('#gameBgm');
    return gameBgm;
  }
  function playGameBgm() {
    var a = getGameBgm();
    if (!a) return;
    a.volume = 0.7;
    var p = a.play();
    if (p && p.catch) p.catch(function () { /* autoplay blocked; will retry on next user gesture */ });
  }
  function stopGameBgm() {
    var a = getGameBgm();
    if (!a) return;
    a.pause();
  }
  // unlock audio on first user gesture (browser autoplay policy)
  document.addEventListener('click', function () {
    if (musicUnlocked) return;
    musicUnlocked = true;
    var page = $('#page-hobby-detail');
    var ma = getMusicBgm();
    var ra = getRecordBgm();
    var ba = getBeadsBgm();
    var ga = getGameBgm();
    if (ma && ma.paused && page.classList.contains('music')) playMusicBgm();
    if (ra && ra.paused && page.classList.contains('record')) playRecordBgm();
    if (ba && ba.paused && page.classList.contains('beads')) playBeadsBgm();
    if (ga && ga.paused && page.classList.contains('game')) playGameBgm();
    if (profileBgm && profileBgm.paused && currentSub === 'profile') playProfileBgm();
    if (hobbyBgm && hobbyBgm.paused && currentSub === 'hobby' && !$('#page-hobby-detail').classList.contains('active')) playHobbyBgm();
  }, { once: false });

  function closeHobbyDetail() {
    lock = true;
    stopBeadsCarousel();
    stopRecordCarousel();
    stopMusicBgm();
    stopRecordBgm();
    stopBeadsBgm();
    stopGameBgm();
    polyWipe(function () {
      $('#page-hobby-detail').classList.remove('active');
      $('#page-hobby').classList.add('active');
      playHobbyBgm();
    }, function () {
      lock = false;
    });
  }

  function resetHobby() {
    stopBeadsCarousel();
    stopRecordCarousel();
    stopMusicBgm();
    stopRecordBgm();
    stopBeadsBgm();
    stopGameBgm();
    $('#page-hobby-detail').classList.remove('active');
    setHobbyGroup(null);
    hbCards.innerHTML = '';
    hbCards.classList.remove('in');
  }

  var hdBack = $('.hd-back');
  if (hdBack) {
    hdBack.addEventListener('click', function () {
      if (lock) return;
      closeHobbyDetail();
    });
  }

  /* ================= profile page : 4-sector rotating disc ================= */
  var PF = [
    {
      n: '01', en: 'NAME', name: '我的名字',
      t: '我的名字-林欣怡',
      lead: '来自江苏无锡江阴，目前是软件工程262的团支书。',
      list: [
        '纯种南方人，江南水乡但不爱吃鱼虾海鲜，吃不动辣跟爱吃甜食是真的www',
        '你怎么知道无锡苏超冠军？是的，我蹭到了外卖福利！'
      ]
    },
    {
      n: '02', en: 'CHARACTER', name: '性格特点',
      t: '性格特点',
      lead: '本人活泼开朗、很好说话很好相处。高强度上网冲浪：我懂你的梗！让你的话题不会掉在地上~',
      list: [
        '热心肠、力所能及帮帮。我们班的同学belike：团支书xxx怎么填？团支书你知不知道xxx怎么弄？人民的团支书，随叫随到，消息秒回，背后的辛酸苦辣只有我懂喝喝。。'
      ]
    },
    {
      n: '03', en: 'STRENGTH', name: '我的长处',
      t: '我的长处',
      lead: '逻辑与文采好。鲁迅青少年文学赛二等奖，高中写的文章上过公众号，书面工作能力出色，也是一点比别人调ai更强的原因？；',
      list: [
        '办事态度端正。大事绝不掉链子，存疑的地方必须搞清楚，交接等事务仔细对比，保留备份，确保万无一失；',
        '谦虚且听劝，集体意识强。不懂就问，不会就学，脸皮厚厚的所以我不懂装懂达咩！团队合作，大家建议都听都考虑，有错及时改。'
      ]
    },
    {
      n: '04', en: 'WEAKNESS', name: '我的弱势',
      t: '我的弱势',
      lead: '七宗罪之懒惰。拖延症轻度患者，有点拖拉...貌似是人之常情？但我也有我自己的节奏安排，规定时间内必完成；',
      list: [
        '还需戒骄戒躁。有时候面对麻烦的事会有耐心不足与急急急急急，今后还需调节，如果有人给我一句”别急“我也能很快平复自己；',
        '补药对我一味的打压式教育啊...我也需要一点夸奖与鼓励www'
      ]
    }
  ];

  var pcDisc = $('#pcDisc');
  if (pcDisc) {
    var pcActive = 0;
    var pcPanel = $('#pcPanel'), pcH = $('#pcH'), pcLead = $('#pcLead'), pcList = $('#pcList');
    var pcMeta = $('#pcMeta'), pcNum = $('#pcNum'), pcIdName = $('#pcIdName');
    var pcHubNum = $('#pcHubNum'), pcDots = $('#pcDots');
    var pcWNum = $('#pcWNum'), pcWEn = $('#pcWEn'), pcWCn = $('#pcWCn');
    var pfPage = $('#page-profile');
    var pcBgEl = $('#pcBg'), pcLensImg = $('#pcLensImg'), bgFlip = 0;

    // 双层交叉淡入，切换板块时背景图衔接更顺
    var setBg = function (i) {
      var url = "url('assets/profile/p" + (i + 1) + ".jpg')";
      var next = 1 - bgFlip;
      [pcBgEl, pcLensImg].forEach(function (box) {
        var l = box.children;
        l[next].style.backgroundImage = url;
        l[next].classList.add('on');
        l[bgFlip].classList.remove('on');
      });
      bgFlip = next;
    };

    var pcRender = function (i) {
      var d = PF[i];
      pcH.textContent = d.t;
      pcLead.textContent = d.lead;
      pcList.innerHTML = '';
      d.list.forEach(function (li) {
        var el = document.createElement('li');
        el.textContent = li;
        pcList.appendChild(el);
      });
      pcMeta.textContent = d.n + ' — ' + d.en;
      pcNum.textContent = String(i + 1);
      pcIdName.textContent = d.name;
      pcHubNum.textContent = d.n;
      if (pcWNum) pcWNum.textContent = d.n;
      if (pcWEn) pcWEn.textContent = d.en;
      if (pcWCn) pcWCn.textContent = d.name;
      // 背景与当前扇面使用同一张图
      setBg(i);
      var dots = pcDots.children;
      for (var k = 0; k < dots.length; k++) dots[k].classList.toggle('on', k === i);
    };

    var pcLabs = pcDisc.querySelectorAll('.pc-lab');

    var pcSelect = function (i) {
      i = ((i % 4) + 4) % 4;
      if (i === pcActive) return;
      pcActive = i;
      pcDisc.style.transform = 'rotate(' + (-90 * i) + 'deg)';
      // 镜片内画面反向自转，保证放大后的背景不跟着旋转
      if (pcLensImg) pcLensImg.style.transform = 'rotate(' + (90 * i) + 'deg)';
      // counter-rotate each label so every caption stays upright and readable
      for (var k = 0; k < pcLabs.length; k++) {
        pcLabs[k].style.setProperty('--b', (90 * i - 90 * k) + 'deg');
      }
      pcPanel.classList.add('fade');
      setTimeout(function () {
        pcRender(i);
        pcPanel.classList.remove('fade');
      }, 170);
    };

    pcDisc.addEventListener('click', function (e) {
      var lab = e.target.closest ? e.target.closest('.pc-lab') : null;
      if (lab) {
        pcSelect(parseInt(lab.dataset.i, 10));
        return;
      }
      var r = pcDisc.getBoundingClientRect();
      var deg = Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)) * 180 / Math.PI + 90;
      deg = ((deg % 360) + 360) % 360;
      var local = (((deg + 90 * pcActive) % 360) + 360) % 360;
      pcSelect((Math.round(local / 90) + 1) % 4);
    });

    pcDots.addEventListener('click', function (e) {
      var idx = Array.prototype.indexOf.call(pcDots.children, e.target);
      if (idx > -1) pcSelect(idx);
    });

    document.addEventListener('keydown', function (e) {
      if (state !== 'sub' || currentSub !== 'profile') return;
      if (e.key === 'ArrowRight') pcSelect(pcActive + 1);
      if (e.key === 'ArrowLeft') pcSelect(pcActive - 1);
    });

    pcRender(0);
  }

  /* ================= future cinematic : intro → flash → video → freeze → keyed overlay ================= */
  var FC_LINES = [
    ['大学生毕业即失业', 12, 9, -4], ['35岁危机', 54, 9, 3], ['内卷', 84, 9, -2],
    ['ai取代人类岗位', 26, 16, 2], ['本科大学生遍地走', 66, 16, -3], ['竞争', 90, 16, 4],
    ['岗位紧张，一些职业几乎不招', 10, 23, 3], ['想要工作就得考研读博', 62, 23, -4],
    ['选修课抢课', 30, 30, -2], ['社团活动', 78, 30, 5],
    ['挤满的日程课表', 16, 37, 4], ['开不完的会', 64, 37, -3],
    ['内卷', 14, 64, -3], ['ai取代人类岗位', 60, 64, 2],
    ['本科大学生遍地走', 32, 71, -4], ['35岁危机', 80, 71, 3],
    ['竞争', 12, 78, 2], ['大学生毕业即失业', 54, 78, -5], ['选修课抢课', 86, 78, 4],
    ['开不完的会', 22, 85, -2], ['挤满的日程课表', 68, 85, 3],
    ['社团活动', 8, 92, 4], ['想要工作就得考研读博', 46, 92, -3]
  ];

  var cineEl = $('#future-cinema');
  var fcIntro = $('#fcIntro');
  var fcMain = $('#fcMain');
  var fcFlash = $('#fcFlash');
  var fcWord = $('#fcWord');
  var fcVideo = $('#fcVideo');
  var fcScene = $('#fcScene');
  var fcFxEl = $('#fcFx');
  var fcRevealed = false, fcFinished = false;

  function fcPlay(v) {
    if (!v) return;
    v.muted = false;
    var p = v.play();
    if (p && p.catch) {
      p.catch(function () {
        v.muted = true;
        var q = v.play();
        if (q && q.catch) q.catch(function () {});
      });
    }
  }

  function playFuture() {
    lock = true;
    stopSubwayBgm();
    stopProfileBgm();
    fcRevealed = false;
    fcFinished = false;
    cineEl.classList.add('run');
    cineEl.classList.remove('reveal');
    fcVideo.classList.remove('reveal');
    fcMain.classList.remove('on');
    fcFlash.classList.remove('on', 'red');
    fcVideo.classList.remove('on');
    fcIntro.style.display = '';
    Array.prototype.forEach.call(fcIntro.querySelectorAll('.fc-line'), function (n) { n.remove(); });
    fcScene.pause(); fcScene.currentTime = 0; fcScene.onended = null;
    fcFxEl.pause(); fcFxEl.currentTime = 0; fcFxEl.ontimeupdate = null; fcFxEl.onended = null;
    fcFxEl.classList.remove('on');

    var scatterAt = 3000;
    var step = 210;
    var flashAt = scatterAt + FC_LINES.length * step + 900;

    setTimeout(function () { fcMain.classList.add('on'); }, 120);

    setTimeout(function () {
      FC_LINES.forEach(function (L, i) {
        setTimeout(function () {
          var d = document.createElement('div');
          d.className = 'fc-line';
          d.textContent = '“' + L[0] + '”';
          d.style.left = L[1] + '%';
          d.style.top = L[2] + '%';
          d.style.setProperty('--r', L[3] + 'deg');
          fcIntro.appendChild(d);
          requestAnimationFrame(function () { d.classList.add('on'); });
        }, i * step);
      });
    }, scatterAt);

    setTimeout(function () {
      fcIntro.style.display = 'none';
      fcFlash.classList.add('on');
      var words = ['痛苦', '疲惫', '疯狂'];
      var n = 0;
      var beat = 420;
      var tick = setInterval(function () {
        if (n >= words.length) { clearInterval(tick); return; }
        fcFlash.classList.toggle('red', n % 2 === 0);
        fcWord.textContent = words[n];
        fcWord.style.left = (50 + Math.random() * 32 - 16) + '%';
        fcWord.style.top = (50 + Math.random() * 36 - 18) + '%';
        fcWord.style.transform = 'translate(-50%,-50%) rotate(' + (Math.random() * 16 - 8) + 'deg) scale(' + (0.92 + Math.random() * 0.3) + ')';
        n++;
        if (n >= words.length) clearInterval(tick);
      }, beat);

      setTimeout(function () {
        clearInterval(tick);
        fcFlash.classList.remove('on', 'red');
        setTimeout(startFutureVideo, 1000);
      }, beat * words.length + 40);
    }, flashAt);
  }

  function startFutureVideo() {
    fcVideo.classList.add('on');
    fcScene.currentTime = 0;
    fcPlay(fcScene);
    var frozen = false;
    var freezeNow = function () {
      if (frozen || fcFinished) return;
      frozen = true;
      fcScene.onended = null;
      fcScene.pause();
      setTimeout(function () {
        if (fcFinished) return;
        fcFxEl.currentTime = 0;
        fcFxEl.classList.add('on');
        fcPlay(fcFxEl);
        fcFxEl.ontimeupdate = function () {
          // the whole 阿哈时刻/飘卡牌 green part stays on the frozen scene;
          // the swap happens once the clip cuts to the opaque 红毯转场 shot, so it is invisible
          if (fcFxEl.currentTime >= 2.5) revealFuturePage();
        };
        fcFxEl.onended = finishFuture;
      }, 400);
    };
    fcScene.onended = freezeNow;
    // safety net in case 'ended' never fires
    setTimeout(function () { if (!frozen) freezeNow(); }, 11700);
  }

  // keyed greenscreen now sits on top of the real 未来展望 page: swap the black stage
  // and the frozen frame out so the page shows through the transparent green areas
  function revealFuturePage() {
    if (fcRevealed) return;
    fcRevealed = true;
    cineEl.classList.add('reveal');
    fcVideo.classList.add('reveal');
    stagePhone.classList.remove('show', 'on');
    if (currentSub) $('#page-' + currentSub).classList.remove('active');
    $('#page-future').classList.add('active');
    currentSub = 'future';
    state = 'sub';
    playFutureBgm();
  }

  // animation ends on a full-green frame → keyed away → we are already looking at the page.
  // Just drop the cinema layer. No green flash, no replay.
  function finishFuture() {
    if (fcFinished) return;
    fcFinished = true;
    fcFxEl.ontimeupdate = null;
    fcFxEl.onended = null;
    fcFxEl.pause();
    revealFuturePage();
    cineEl.classList.remove('run', 'reveal');
    fcVideo.classList.remove('on', 'reveal');
    fcFxEl.classList.remove('on');
    setTimeout(function () { lock = false; }, 60);
  }

})();
