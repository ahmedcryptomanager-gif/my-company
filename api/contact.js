// POST /api/contact — يستقبل نموذج التواصل ويرسل بريدين عبر Resend:
// 1) إشعار للمالك 2) رسالة ترحيب للزائر. يعمل على Vercel Serverless.
'use strict';

var ALLOWED_ORIGINS = [
  'https://my-company-xi-nine.vercel.app',
  'https://alazsoftware.com',
  'https://www.alazsoftware.com',
  'https://alaz-software.vercel.app',
  'https://ahmedcryptomanager-gif.github.io'
];

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

module.exports = async function handler(req, res) {
  var origin = req.headers.origin || '';
  if (ALLOWED_ORIGINS.indexOf(origin) !== -1) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Vary', 'Origin');
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'method' });
  }

  var body = req.body || {};
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) { body = {}; }
  }
  // honeypot ضد السبام
  if (body.website) {
    return res.status(200).json({ ok: true });
  }

  var name = String(body.name || '').trim().slice(0, 60);
  var phone = String(body.phone || '').trim().slice(0, 17);
  var email = String(body.email || '').trim().slice(0, 100);
  var type = String(body.type || '').trim().slice(0, 20);
  var message = String(body.message || '').trim().slice(0, 1000);

  var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var phoneRe = /^\+?[0-9][0-9\s-]{5,15}$/;
  if (!name || name.length < 2 || !phoneRe.test(phone) || /--/.test(phone) || !emailRe.test(email) || !message || message.length < 10) {
    return res.status(400).json({ ok: false, error: 'validation' });
  }

  var apiKey = process.env.RESEND_API_KEY;
  var ownerEmail = process.env.OWNER_EMAIL || 'info@alazsoftware.com';
  var fromEmail = process.env.FROM_EMAIL || 'onboarding@resend.dev';
  if (!apiKey) {
    return res.status(500).json({ ok: false, error: 'config' });
  }

  var typeLabels = { company: 'موقع شركة', store: 'متجر إلكتروني', system: 'نظام / لوحة تحكم', seo: 'تحسين SEO', other: 'أخرى' };
  var typeLabel = typeLabels[type] || type || 'غير محدد';

  var ownerSubject = 'رسالة جديدة من موقع العز: ' + name;
  var ownerHtml = '<div dir="rtl"><h2>رسالة تواصل جديدة</h2>' +
    '<p><strong>الاسم:</strong> ' + esc(name) + '</p>' +
    '<p><strong>الجوال:</strong> <span dir="ltr">' + esc(phone) + '</span></p>' +
    '<p><strong>البريد:</strong> ' + esc(email) + '</p>' +
    '<p><strong>النوع:</strong> ' + esc(typeLabel) + '</p>' +
    '<p><strong>الرسالة:</strong></p><p>' + esc(message).replace(/\n/g, '<br>') + '</p></div>';

  var guestSubject = 'شكراً لتواصلك مع شركة العز يا ' + name + ' ✓';
  var guestHtml = '<div dir="rtl"><h2>أهلاً ' + esc(name) + ' 👋</h2>' +
    '<p>شكراً لتواصلك مع <strong>شركة العز للحلول الرقمية</strong>. استلمنا رسالتك بخصوص <strong>' + esc(typeLabel) + '</strong> وسنرد عليك خلال ساعات العمل.</p>' +
    '<p>ملخص طلبك:</p><p>' + esc(message).replace(/\n/g, '<br>') + '</p>' +
    '<p>تحتاج رداً أسرع؟ راسلنا واتساب: <span dir="ltr">+967 712953014</span></p>' +
    '<p>— فريق شركة العز</p></div>';

  try {
    var send = async function (to, subject, html) {
      var r = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: 'شركة العز <' + fromEmail + '>', to: [to], subject: subject, html: html })
      });
      if (!r.ok) {
        var err = new Error('resend failed');
        err.providerStatus = r.status;
        try { await r.text(); } catch (e) {}
        throw err;
      }
      try {
        var data = await r.json();
        return data && data.id ? data.id : '';
      } catch (e) { return ''; }
    };
    var ownerId = await send(ownerEmail, ownerSubject, ownerHtml);
    var guestId = await send(email, guestSubject, guestHtml);
    return res.status(200).json({ ok: true });
  } catch (e) {
    var code = (e && e.providerStatus) ? e.providerStatus : 0;
    try { console.error('contact mail failed, provider status: ' + code); } catch (x) {}
    // code: حالة HTTP من مزود البريد فقط (401 مفتاح، 403 مرسل/مستلم، 422 تحقق) — بلا تفاصيل داخلية
    return res.status(502).json({ ok: false, error: 'send', code: code });
  }
};
