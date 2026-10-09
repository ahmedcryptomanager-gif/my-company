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

  // 5. تحقق نموذج التواصل (contact.html) + إرسال بريد عبر API
  // endpoint الدالة: على Vercel نفس الدومين (/api/contact)، وعلى GitHub Pages عبر رابط Vercel
  var CONTACT_API = (function () {
    if (location.hostname.indexOf('vercel.app') !== -1 || location.hostname === 'alazsoftware.com' || location.hostname.indexOf('alazsoftware') !== -1) {
      return '/api/contact';
    }
    return 'https://my-company-xi-nine.vercel.app/api/contact';
  })();
  var form = document.getElementById('contact-form');
  if (form) {
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var name = form.querySelector('#cf-name');
      var phone = form.querySelector('#cf-phone');
      var email = form.querySelector('#cf-email');
      var msg = form.querySelector('#cf-msg');
      var typeSel = form.querySelector('#cf-type');
      var consent = form.querySelector('#cf-consent');
      var hp = form.querySelector('#cf-website');
      var err = form.querySelector('.form-error');
      var ok = form.querySelector('.form-success');
      if (!name || !phone || !email || !msg) {
        if (err) err.textContent = 'تعذر العثور على حقول النموذج. حدّث الصفحة وحاول مجدداً.';
        return;
      }
      if (err) err.textContent = '';
      if (ok) ok.textContent = '';
      if (hp && hp.value) return; // سبام: تجاهل بصمت
      var phoneRe = /^\+?[0-9][0-9\s-]{5,15}$/;
      var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
      var nameVal = name.value.trim().slice(0, 60);
      var phoneVal = phone.value.trim().slice(0, 17);
      var emailVal = email.value.trim().slice(0, 100);
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
      if (!emailRe.test(emailVal)) {
        if (err) err.textContent = 'يرجى إدخال بريد إلكتروني صحيح.';
        email.focus();
        return;
      }
      if (!msgVal || msgVal.length < 10) {
        if (err) err.textContent = 'يرجى كتابة رسالتك (10 أحرف على الأقل).';
        msg.focus();
        return;
      }
      if (consent && !consent.checked) {
        if (err) err.textContent = 'يرجى الموافقة على مراسلتك بخصوص استفسارك.';
        consent.focus();
        return;
      }
      var typeVal = typeSel ? typeSel.value : '';
      var typeLabel = typeSel && typeSel.options && typeSel.selectedIndex >= 0
        ? typeSel.options[typeSel.selectedIndex].text
        : '';
      var text = encodeURIComponent(
        'الاسم: ' + nameVal + '\nالجوال: ' + phoneVal + '\nالبريد: ' + emailVal +
        (typeLabel ? '\nالنوع: ' + typeLabel : '') + '\n' + msgVal
      );
      var waUrl = 'https://wa.me/967712953014?text=' + text;
      var btn = form.querySelector('button[type="submit"]');
      if (btn) btn.disabled = true;
      if (ok) ok.textContent = 'جارٍ إرسال رسالتك...';
      fetch(CONTACT_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nameVal, phone: phoneVal, email: emailVal, type: typeVal, message: msgVal, website: hp ? hp.value : '' })
      }).then(function (res) {
        if (!res.ok) throw new Error('api');
        if (ok) ok.textContent = 'تم استلام رسالتك! أرسلنا لك رسالة ترحيب على بريدك، ويمكنك أيضاً متابعتنا واتساب.';
        form.reset();
        var wa = document.createElement('p');
        wa.innerHTML = '<a class="btn gold service-cta" target="_blank" rel="noopener">متابعة عبر واتساب</a>';
        wa.querySelector('a').href = waUrl;
        if (ok && ok.parentNode) ok.parentNode.insertBefore(wa, ok.nextSibling);
        setTimeout(function () { if (wa.parentNode) wa.parentNode.removeChild(wa); }, 30000);
      }).catch(function () {
        // بديل واتساب عند تعطل خدمة البريد
        if (ok) ok.textContent = 'تعذر الإرسال بالبريد حالياً — جارٍ تحويلك إلى واتساب...';
        setTimeout(function () {
          var win = window.open(waUrl, '_blank');
          if (win) win.opener = null;
        }, 700);
      }).then(function () {
        if (btn) btn.disabled = false;
      });
    });
  }
})();
