// SoundCloud random-track startup and five-page left/right navigation.
(() => {
  const pages = [...document.querySelectorAll('.page[data-page]')];
  const pageNumber = document.querySelector('[data-page-number]');
  const entryOverlay = document.querySelector('#entry-overlay');
  const enterButton = document.querySelector('#enter-button');
  const audioToggle = document.querySelector('#audio-toggle');
  const playerFrame = document.querySelector('#soundcloud-player');
  const profileImage = document.querySelector('#dynamic-profile-pic');
  const carouselTrack = document.querySelector('#carousel-track');
  const carouselCount = document.querySelector('#carousel-count');
  const carouselPrev = document.querySelector('#carousel-prev');
  const carouselNext = document.querySelector('#carousel-next');
  const spawnCursorParticle = (x, y) => {
    const particle = document.createElement('div');
    particle.className = `cursor-rain-particle${Math.random() < 0.5 ? ' is-white' : ''}`;
    particle.setAttribute('aria-hidden', 'true');
    particle.style.left = `${x}px`;
    particle.style.top = `${y}px`;
    particle.style.setProperty('--fall-distance', `${50 + Math.random() * 30}px`);
    const removeParticle = () => particle.remove();
    particle.addEventListener('animationend', removeParticle, { once: true });
    document.body.append(particle);
    window.setTimeout(removeParticle, 800);
  };
  window.addEventListener('mousemove', event => spawnCursorParticle(event.clientX, event.clientY), { passive: true });
  window.addEventListener('touchmove', event => {
    const touch = event.touches[0];
    if (touch) spawnCursorParticle(touch.clientX, touch.clientY);
  }, { passive: true });

  if (!pages.length) return;

  // Swap or extend these public SoundCloud track URLs to customize the randomizer.
  const soundCloudTracks = [
    'https://soundcloud.com/projectsulfur/hilang?si=1d5408f2606a418fbb9091b7ae701158&utm_source=clipboard&utm_medium=text&utm_campaign=social_sharing',
    'https://soundcloud.com/sbadahoe/shawty?si=44d404cf9273438ea84be38d3e116adb&utm_source=clipboard&utm_medium=text&utm_campaign=social_sharing',
    'https://soundcloud.com/sbadahoe/prajurit-perang?si=4832b144363e4f18b220ec02622e34da&utm_source=clipboard&utm_medium=text&utm_campaign=social_sharing'
  ];
  const profileImages = [
    'assets/profile-1.jpg',
    'assets/profile-2.jpg',
    'assets/profile-3.jpg',
    'assets/profile-4.jpg',
    'assets/profile-5.jpg'
  ];

  let current = Math.max(0, pages.findIndex(page => page.classList.contains('is-active')));
  let entered = false;
  let widget = null;
  let widgetReady = false;
  let shouldBePaused = false;
  let apiWaitTimer = null;
  let carouselIndex = 0;
  let lastAudioTouch = 0;

  const updateAudioIcon = playing => {
    audioToggle?.classList.toggle('is-playing', Boolean(playing));
    audioToggle?.setAttribute('aria-label', playing ? 'Pause background music' : 'Play background music');
    audioToggle?.setAttribute('aria-pressed', String(Boolean(playing)));
  };

  const randomizeProfileImage = () => {
    if (!profileImage || !profileImages.length) return;
    const source = profileImages[Math.floor(Math.random() * profileImages.length)];
    profileImage.hidden = false;
    const fallback = profileImage.nextElementSibling;
    if (fallback) fallback.hidden = true;
    profileImage.src = source;
  };

  const renderPage = (next, direction = 1) => {
    current = Math.max(0, Math.min(next, pages.length - 1));
    pages.forEach((page, index) => {
      const active = index === current;
      page.hidden = !active;
      page.classList.toggle('is-active', active);
      page.style.setProperty('--page-shift', `${direction < 0 ? '-12px' : '12px'}`);
      page.setAttribute('aria-hidden', String(!active));
    });
    if (current === 0) randomizeProfileImage();
    if (pageNumber) pageNumber.textContent = String(current + 1).padStart(2, '0');
    const pageScroller = document.querySelector('.pages');
    if (pageScroller) pageScroller.scrollTop = 0;
  };

  const bindWidget = () => {
    if (!playerFrame || !window.SC?.Widget || widget) return;
    try {
      widget = window.SC.Widget(playerFrame);
      const events = window.SC.Widget.Events;
      widget.bind(events.READY, () => {
        widgetReady = true;
        if (shouldBePaused) widget.pause();
        else widget.play();
      });
      widget.bind(events.PLAY, () => { shouldBePaused = false; updateAudioIcon(true); });
      widget.bind(events.PAUSE, () => { shouldBePaused = true; updateAudioIcon(false); });
      widget.bind(events.FINISH, () => updateAudioIcon(false));
    } catch (_) {
      widget = null;
    }
  };

  const loadRandomSoundCloudTrack = () => {
    if (!playerFrame || !soundCloudTracks.length) return;
    const track = soundCloudTracks[Math.floor(Math.random() * soundCloudTracks.length)];
    const params = new URLSearchParams({
      url: track,
      auto_play: 'true',
      hide_related: 'true',
      show_comments: 'false',
      show_user: 'true',
      show_reposts: 'false',
      visual: 'true'
    });
    shouldBePaused = false;
    updateAudioIcon(false);
    playerFrame.addEventListener('load', bindWidget, { once: true });
    playerFrame.src = `https://w.soundcloud.com/player/?${params.toString()}`;

    // If the API script arrives after the iframe, keep checking briefly for its constructor.
    if (apiWaitTimer) window.clearInterval(apiWaitTimer);
    apiWaitTimer = window.setInterval(() => {
      if (window.SC?.Widget) {
        bindWidget();
        window.clearInterval(apiWaitTimer);
        apiWaitTimer = null;
      }
    }, 250);
    window.setTimeout(() => {
      if (apiWaitTimer) { window.clearInterval(apiWaitTimer); apiWaitTimer = null; }
    }, 10000);
  };

  const enterZine = () => {
    if (entered) return;
    entered = true;
    entryOverlay?.classList.add('is-dismissed');
    entryOverlay?.setAttribute('aria-hidden', 'true');
    if (audioToggle) audioToggle.hidden = false;
    loadRandomSoundCloudTrack();
    if (window.SC?.Widget && playerFrame) window.SC.Widget(playerFrame).play();
    if (widget) { shouldBePaused = false; widget.play(); }
  };

  enterButton?.addEventListener('click', enterZine);
  enterButton?.addEventListener('touchstart', enterZine, { passive: true });
  const toggleAudio = () => {
    if (!entered) return;
    if (widgetReady && widget) {
      widget.isPaused(paused => {
        if (paused) { shouldBePaused = false; widget.play(); }
        else { shouldBePaused = true; widget.pause(); }
      });
    } else {
      shouldBePaused = !shouldBePaused;
      updateAudioIcon(false);
    }
  };
  audioToggle?.addEventListener('touchend', event => {
    event.preventDefault();
    lastAudioTouch = Date.now();
    toggleAudio();
  });
  audioToggle?.addEventListener('click', () => {
    if (Date.now() - lastAudioTouch < 700) return;
    toggleAudio();
  });

  let carouselAnimating = false;
  let suppressCarouselClick = false;
  const updateCarouselCount = () => {
    const photos = carouselTrack ? [...carouselTrack.querySelectorAll('.carousel-photo')] : [];
    if (carouselCount && photos.length) carouselCount.textContent = `${String(carouselIndex + 1).padStart(2, '0')} / ${String(photos.length).padStart(2, '0')}`;
  };

  const moveCarousel = direction => {
    if (!carouselTrack || carouselAnimating) return;
    const photos = [...carouselTrack.querySelectorAll('.carousel-photo')];
    if (photos.length < 2) return;
    const first = photos[0];
    const gap = parseFloat(getComputedStyle(carouselTrack).columnGap || getComputedStyle(carouselTrack).gap) || 0;
    const step = first.getBoundingClientRect().width + gap;
    if (!step) return;
    carouselAnimating = true;
    if (direction < 0) {
      carouselTrack.prepend(photos[photos.length - 1]);
      carouselTrack.style.transition = 'none';
      carouselTrack.style.transform = `translateX(${-step}px)`;
      void carouselTrack.offsetWidth;
      carouselTrack.style.transition = '';
      requestAnimationFrame(() => { carouselTrack.style.transform = 'translateX(0)'; });
    } else {
      carouselTrack.style.transform = `translateX(${-step}px)`;
    }

    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      clearTimeout(fallbackTimer);
      carouselTrack.removeEventListener('transitionend', onTransitionEnd);
      if (direction > 0) carouselTrack.append(carouselTrack.firstElementChild);
      carouselTrack.style.transition = 'none';
      carouselTrack.style.transform = 'translateX(0)';
      void carouselTrack.offsetWidth;
      carouselTrack.style.transition = '';
      carouselIndex = (carouselIndex + direction + photos.length) % photos.length;
      updateCarouselCount();
      carouselAnimating = false;
    };
    const onTransitionEnd = event => {
      if (event.target === carouselTrack && event.propertyName === 'transform') finish();
    };
    carouselTrack.addEventListener('transitionend', onTransitionEnd);
    const fallbackTimer = window.setTimeout(finish, 450);
  };

  const carouselViewport = document.querySelector('.carousel-viewport');
  let swipeStart = null;
  carouselViewport?.addEventListener('touchstart', event => {
    const touch = event.changedTouches[0];
    if (touch) swipeStart = { x: touch.clientX, y: touch.clientY };
  }, { passive: true });
  carouselViewport?.addEventListener('touchend', event => {
    const touch = event.changedTouches[0];
    if (!touch || !swipeStart) return;
    const dx = touch.clientX - swipeStart.x;
    const dy = touch.clientY - swipeStart.y;
    swipeStart = null;
    if (Math.abs(dx) < 35 || Math.abs(dx) < Math.abs(dy)) return;
    suppressCarouselClick = true;
    window.setTimeout(() => { suppressCarouselClick = false; }, 500);
    moveCarousel(dx < 0 ? 1 : -1);
  }, { passive: true });
  carouselViewport?.addEventListener('touchcancel', () => { swipeStart = null; }, { passive: true });
  carouselViewport?.addEventListener('click', event => {
    if (!suppressCarouselClick) return;
    event.preventDefault();
    event.stopPropagation();
    suppressCarouselClick = false;
  }, true);
  // Carousel interactions stop before the document-level page-turn handler.
  const carousel = document.querySelector('.carousel');
  carousel?.addEventListener('click', event => event.stopPropagation());
  carouselTrack?.addEventListener('click', event => {
    if (event.target instanceof Element && event.target.closest('.carousel-photo')) event.stopPropagation();
  });
  carouselPrev?.addEventListener('click', event => { event.stopPropagation(); moveCarousel(-1); });
  carouselNext?.addEventListener('click', event => { event.stopPropagation(); moveCarousel(1); });

  // Delegated window-half navigation ignores every interactive element and image.
  const ignoreTurn = 'a, button, audio, iframe, img, video, input, textarea, select, label, [contenteditable="true"]';
  document.addEventListener('click', event => {
    if (!entered || !(event.target instanceof Element) || event.target.closest(ignoreTurn)) return;
    const rightHalf = event.clientX >= window.innerWidth / 2;
    if (rightHalf) renderPage(current === pages.length - 1 ? 0 : current + 1, 1);
    else renderPage(Math.max(0, current - 1), -1);
  });

  renderPage(current);
  updateAudioIcon(false);
  updateCarouselCount();
})();
