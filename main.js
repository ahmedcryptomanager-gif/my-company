// شركة العز - التفاعلات الرئيسية
(function () {
  'use strict';

  // 1. قائمة الموبايل (همبرغر)
  var toggle = document.querySelector('.menu-toggle');
  var nav = document.getElementById('main-nav');
  function closeNav() {
    if (!nav || !toggle) return;
    nav.classList.remove('open');
    toggle.classList.remove('active');
    toggle.setAttribute('aria-expanded', 'false');
  }
  if (toggle && nav) {
    toggle.addEventListener('click', function (ev) {
      ev.stopPropagation();
      var open = nav.classList.toggle('open');
      toggle.classList.toggle('active', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'إغلاق القائمة' : 'فتح القائمة');
    });
    // إغلاق القائمة عند الضغط على رابط
    Array.prototype.forEach.call(nav.querySelectorAll('a'), function (a) {
      a.addEventListener('click', closeNav);
    });
    // إغلاق بـ Escape أو النقر خارجها
    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape') closeNav();
    });
    document.addEventListener('click', function (ev) {
      if (nav.classList.contains('open') && !nav.contains(ev.target)) closeNav();
    });
  }

  // 2. تمييز الصفحة الحالية
  try {
    var page = location.pathname.split('/').pop() || 'index.html';
    Array.prototype.forEach.call(document.querySelectorAll('nav a'), function (a) {
      var href = a.getAttribute('href');
      if (href === page || (page === '' && href === 'index.html')) {
        a.setAttribute('aria-current', 'page');
        a.classList.add('active');
      }
    });
  } catch (e) {}

  // 3. زر العودة للأعلى
  var topBtn = document.createElement('button');
  topBtn.className = 'back-to-top';
  topBtn.setAttribute('aria-label', 'العودة إلى الأعلى');
  topBtn.textContent = '↑';
  document.body.appendChild(topBtn);
  window.addEventListener('scroll', function () {
    topBtn.classList.toggle('show', window.scrollY > 600);
  }, { passive: true });
  topBtn.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // 4. ظهور تدريجي للبطاقات عند التمرير
  var revealEls = document.querySelectorAll('.service-card, .project, .process > div');
  if ('IntersectionObserver' in window && revealEls.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('visible');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(function (el) {
      el.classList.add('reveal');
      io.observe(el);
    });
  }

  // 5. تحقق نموذج التواصل (contact.html)
  var form = document.getElementById('contact-form');
  if (form) {
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var name = form.querySelector('#cf-name');
      var phone = form.querySelector('#cf-phone');
      var msg = form.querySelector('#cf-msg');
      var typeSel = form.querySelector('#cf-type');
      var err = form.querySelector('.form-error');
      var ok = form.querySelector('.form-success');
      if (!name || !phone || !msg) {
        if (err) err.textContent = 'تعذر العثور على حقول النموذج. حدّث الصفحة وحاول مجدداً.';
        return;
      }
      if (err) err.textContent = '';
      if (ok) ok.textContent = '';
      var phoneRe = /^\+?[0-9][0-9\s-]{5,15}$/;
      var nameVal = name.value.trim().slice(0, 60);
      var phoneVal = phone.value.trim().slice(0, 17);
      var msgVal = msg.value.trim().slice(0, 1000);
      if (!nameVal || nameVal.length < 2) {
        if (err) err.textContent = 'يرجى إدخال الاسم (حرفان على الأقل).';
        name.focus();
        return;
      }
      if (!phoneRe.test(phoneVal) || /--/.test(phoneVal)) {
        if (err) err.textContent = 'يرجى إدخال رقم هاتف صحيح.';
        phone.focus();
        return;
      }
      if (!msgVal || msgVal.length < 10) {
        if (err) err.textContent = 'يرجى كتابة رسالتك (10 أحرف على الأقل).';
        msg.focus();
        return;
      }
      var typeLabel = typeSel && typeSel.options && typeSel.selectedIndex >= 0
        ? typeSel.options[typeSel.selectedIndex].text
        : '';
      var text = encodeURIComponent(
        'الاسم: ' + nameVal + '\nالجوال: ' + phoneVal +
        (typeLabel ? '\nالنوع: ' + typeLabel : '') + '\n' + msgVal
      );
      if (ok) ok.textContent = 'تم التحقق بنجاح! جارٍ تحويلك إلى واتساب...';
      setTimeout(function () {
        var win = window.open('https://wa.me/967712953014?text=' + text, '_blank');
        if (win) win.opener = null;
      }, 700);
    });
  }
})();
