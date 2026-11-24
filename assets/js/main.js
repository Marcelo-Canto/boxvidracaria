/* Box Vidraçaria — interações do site */
(function () {
  "use strict";
  var doc = document.documentElement;
  doc.classList.add("js");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- header: fica sólido ao rolar ---------- */
  var header = document.querySelector("[data-header]");
  function onScroll() {
    if (!header) return;
    header.classList.toggle("is-solid", window.scrollY > 24 || header.classList.contains("menu-open"));
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------- menu móvel ---------- */
  var menuBtn = document.querySelector("[data-menu-btn]");
  var menu = document.querySelector("[data-menu]");
  function setMenu(open) {
    if (!menu || !menuBtn) return;
    menu.hidden = !open;
    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
    header.classList.toggle("menu-open", open);
    document.body.style.overflow = open ? "hidden" : "";
    onScroll();
  }
  if (menuBtn) {
    menuBtn.addEventListener("click", function () { setMenu(menu.hidden); });
    menu.addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !menu.hidden) { setMenu(false); menuBtn.focus(); } });
    window.matchMedia("(min-width: 1100px)").addEventListener("change", function (m) { if (m.matches) setMenu(false); });
  }

  /* ---------- dropdown de serviços ---------- */
  var drop = document.querySelector(".has-drop");
  if (drop) {
    var dropBtn = drop.querySelector(".drop-btn");
    var t;
    function setDrop(open) { drop.classList.toggle("open", open); dropBtn.setAttribute("aria-expanded", String(open)); }
    dropBtn.addEventListener("click", function () { setDrop(!drop.classList.contains("open")); });
    drop.addEventListener("mouseenter", function () { clearTimeout(t); setDrop(true); });
    drop.addEventListener("mouseleave", function () { t = setTimeout(function () { setDrop(false); }, 160); });
    drop.addEventListener("focusout", function (e) { if (!drop.contains(e.relatedTarget)) setDrop(false); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && drop.classList.contains("open")) { setDrop(false); dropBtn.focus(); } });
    document.addEventListener("click", function (e) { if (!drop.contains(e.target)) setDrop(false); });
  }

  /* ---------- vídeo do hero ---------- */
  var hv = document.querySelector(".hero-video");
  if (hv) {
    var conn = navigator.connection || {};
    if (!reduce && !conn.saveData) {
      var mobile = window.matchMedia("(max-width: 767px)").matches;
      hv.src = (mobile && hv.dataset.srcMobile) || hv.dataset.src;
      hv.preload = "auto";
      var p = hv.play();
      if (p && p.catch) p.catch(function () { /* autoplay bloqueado: fica o poster */ });
    }
  }

  /* ---------- revelação ao rolar ---------- */
  var items = document.querySelectorAll("[data-reveal]");
  function done(el) {
    el.classList.add("is-in");
    // depois da entrada, libera as transições próprias do elemento (hover etc.)
    setTimeout(function () { el.removeAttribute("data-reveal"); el.classList.remove("is-in"); }, 1300);
  }
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { done(en.target); io.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.removeAttribute("data-reveal"); });
  }

  /* ---------- vídeos da obra: tocam quando aparecem ---------- */
  var reels = document.querySelectorAll("video[data-autoplay]");
  if (reels.length && "IntersectionObserver" in window) {
    var vio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var v = en.target;
        if (en.isIntersecting && !reduce) { var pp = v.play(); if (pp && pp.catch) pp.catch(function () {}); }
        else v.pause();
      });
    }, { threshold: 0.35 });
    reels.forEach(function (v) { vio.observe(v); });
  }
  reels.forEach(function (v) {
    v.addEventListener("click", function () { if (v.paused) v.play(); else v.pause(); });
  });

  /* ---------- contador do selo "desde" ---------- */
  var cnt = document.querySelector("[data-count]");
  if (cnt && "IntersectionObserver" in window && !reduce) {
    var target = parseInt(cnt.dataset.count, 10), from = 0;
    var cio = new IntersectionObserver(function (en) {
      if (!en[0].isIntersecting) return;
      cio.disconnect();
      var start = performance.now(), dur = 1400;
      (function tick(now) {
        var k = Math.min(1, (now - start) / dur), e = 1 - Math.pow(1 - k, 3);
        cnt.textContent = Math.round(from + (target - from) * e);
        if (k < 1) requestAnimationFrame(tick);
      })(start);
    }, { threshold: 0.6 });
    cio.observe(cnt);
  }

  /* ---------- lightbox da galeria ---------- */
  var lb = document.querySelector("[data-lightbox]");
  if (lb && typeof lb.showModal === "function") {
    var lbImg = lb.querySelector("[data-lb-img]"), lbCap = lb.querySelector("[data-lb-cap]");
    document.querySelectorAll("[data-lb]").forEach(function (b) {
      b.addEventListener("click", function () {
        var img = b.querySelector("img");
        lbImg.src = img.currentSrc || img.src;
        lbImg.alt = img.alt;
        lbCap.textContent = b.dataset.cap || "";
        lb.showModal();
      });
    });
    lb.querySelector("[data-lb-close]").addEventListener("click", function () { lb.close(); });
    lb.addEventListener("click", function (e) { if (e.target === lb) lb.close(); });
  }

  /* ---------- métricas: cliques de contato (Google Analytics 4) ---------- */
  document.addEventListener("click", function (e) {
    var a = e.target.closest("a");
    if (!a || typeof window.gtag !== "function") return;
    var href = a.getAttribute("href") || "";
    var where = a.closest("section, header, footer");
    var local = (a.classList.contains("wa-float") ? "botao-flutuante" : (where && (where.id || where.className.split(" ")[0]))) || "pagina";
    if (href.indexOf("wa.me") > -1) {
      window.gtag("event", "generate_lead", { method: "whatsapp", link_location: local, page_path: location.pathname });
    } else if (href.indexOf("tel:") === 0) {
      window.gtag("event", "generate_lead", { method: "telefone", link_location: local, page_path: location.pathname });
    } else if (href.indexOf("instagram.com") > -1) {
      window.gtag("event", "click_instagram", { link_location: local });
    } else if (href.indexOf("google.com/maps") > -1) {
      window.gtag("event", "click_mapa", { link_location: local });
    }
  });
})();
