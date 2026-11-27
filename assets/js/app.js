/* Abroadversity prototype: shared chrome, programme cards, and one init per page. */
(function () {
  "use strict";
  var D = window.ABV;

  /* ---------- helpers ---------- */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function byId(list, id) { return list.find(function (x) { return x.id === id; }); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function params() { return new URLSearchParams(location.search); }
  function plural(n, one, many) { return n + " " + (n === 1 ? one : many || one + "s"); }

  function uniOf(p) { return byId(D.UNIVERSITIES, p.uni); }
  function countryOf(p) { return byId(D.COUNTRIES, uniOf(p).country); }
  function subjectName(id) { var s = byId(D.SUBJECTS, id); return s ? s.name : ""; }
  function levelName(id) { var l = byId(D.LEVELS, id); return l ? l.name : ""; }

  function money(amount, cur) { return cur + " " + Math.round(amount).toLocaleString("en-US"); }
  function lakh(amount, cur) { return (amount * D.RATES[cur]) / 100000; }
  function rupees(l) {
    if (l >= 1) return "₹" + (Math.round(l * 10) / 10).toString() + " L";
    return "₹" + (Math.round(l * 100) * 1000).toLocaleString("en-IN");
  }
  function approx(amount, cur) { return "≈ " + rupees(lakh(amount, cur)); }
  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  function monthOf(ym) { return MONTHS[Number(ym.slice(5, 7)) - 1]; }
  function intakeLabel(ym) { return monthOf(ym) + " " + ym.slice(0, 4); }
  function intakeShort(ym) { return monthOf(ym) + " " + ym.slice(2, 4); }
  function tuitionLakh(p) { return lakh(p.fee, countryOf(p).currency); }
  function totalLakh(p) { var c = countryOf(p); return lakh(p.fee + c.living, c.currency); }
  function years(n) { return plural(n, "year"); }
  var PLANE = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path transform="rotate(90 12 12)" fill="currentColor" d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></svg>';
  // A hard-edged stripe in the flag's colours, used as a thin accent.
  function stripe(c) {
    var n = c.colors.length;
    return "linear-gradient(90deg," + c.colors.map(function (col, i) { return col + " " + (i * 100 / n) + "% " + ((i + 1) * 100 / n) + "%"; }).join(",") + ")";
  }
  function icon(paths) { return '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + paths + "</svg>"; }
  var ICONS = {
    "computer-science": icon('<polyline points="8 6 2 12 8 18"/><polyline points="16 6 22 12 16 18"/>'),
    "data-science": icon('<path d="M4 20V11M10 20V5M16 20v-7M21 20H3"/>'),
    business: icon('<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18"/>'),
    engineering: icon('<circle cx="12" cy="12" r="3.5"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1"/>'),
    finance: icon('<polyline points="3 17 9 11 13 15 21 7"/><polyline points="15 7 21 7 21 13"/>'),
    medicine: icon('<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>'),
    health: icon('<path d="M3 12h4l2-5 4 10 2-5h6"/>'),
    biotech: icon('<path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.7 3h10.6a2 2 0 0 0 1.7-3l-5-9V3M7.5 15h9"/>'),
    hospitality: icon('<path d="M3 18h18M5 18a7 7 0 0 1 14 0M12 8V6M10 6h4"/>'),
    design: icon('<path d="M12 3l7 7-7 11-7-11z"/><circle cx="12" cy="11" r="2"/>'),
  };
  var PIN = icon('<path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/>');
  var CLOCK = icon('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>');
  var CASE = icon('<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>');
  function flag(c, cls) { return '<span class="fi fi-' + c.flag + " " + cls + '" role="img" aria-label="Flag of ' + esc(c.name) + '"></span>'; }

  // An intake is "ongoing" while its applications are open today.
  function today() { var d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  function openWindow(p) { var t = today(); return p.windows.find(function (w) { return w.opens <= t && t <= w.closes; }) || null; }
  function nextWindow(p) { var t = today(); return p.windows.find(function (w) { return w.closes >= t; }) || p.windows[p.windows.length - 1]; }
  function dateLabel(iso, withYear) { var s = Number(iso.slice(8, 10)) + " " + MONTHS[Number(iso.slice(5, 7)) - 1]; return withYear === false ? s : s + " " + iso.slice(0, 4); }

  var store = {
    get: function (k, fallback) { try { var v = sessionStorage.getItem(k); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; } },
    set: function (k, v) { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* private mode */ } },
  };
  function prefs() { return store.get("abv.prefs", {}); }
  function savePrefs(patch) { store.set("abv.prefs", Object.assign(prefs(), patch)); }

  function toast(msg) {
    var t = document.createElement("div");
    t.className = "toast"; t.setAttribute("role", "status"); t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 2200);
  }

  /* ---------- shared chrome ---------- */
  var NAV = [
    { label: "Programmes", href: "programmes.html", key: "list" },
    { label: "Countries", href: "index.html#countries", key: "country" },
    { label: "Universities", href: "universities.html", key: "universities" },
    { label: "Stays", href: "stays.html", key: "stays" },
    { label: "Counselling", href: "#counselling" },
    { label: "My journey", href: "student.html", key: "student" },
  ];

  // Every page opens with the demo bar: one link per side of Abroadversity.
  var SIDES = [
    { key: "site", label: "Website", href: "index.html" },
    { key: "student", label: "Student", href: "student.html" },
    { key: "counsellor", label: "Counsellor", href: "counsellor.html" },
    { key: "university", label: "University", href: "university.html" },
    { key: "consultant", label: "Visa consultant", href: "consultant.html" },
    { key: "partner", label: "Stays partner", href: "accommodation.html" },
    { key: "agency", label: "Partner agency", href: "agency.html" },
  ];
  function demoBar(page) {
    var side = { student: "student", counsellor: "counsellor", university: "university", consultant: "consultant", partner: "partner", agency: "agency", demo: "" }[page];
    if (side === undefined) side = "site";
    return '<div class="demo-bar"><div class="container demo-row">' +
      '<a class="demo-tag" href="demo.html">Demo</a>' +
      '<nav class="demo-sides" aria-label="Demo sides"><span class="demo-label">View as</span>' +
      SIDES.map(function (s) { return '<a href="' + s.href + '"' + (s.key === side ? ' aria-current="page"' : "") + ">" + s.label + "</a>"; }).join("") +
      "</nav>" +
      '<span class="demo-note">Dummy data, saved in this browser</span>' +
      '<button type="button" class="demo-reset" data-reset>Reset demo</button>' +
      "</div></div>";
  }

  function navLinks(active) {
    return NAV.map(function (n) {
      return '<a href="' + n.href + '"' + (n.soon ? " data-soon" : "") + (n.key === active ? ' aria-current="page"' : "") + ">" + n.label + "</a>";
    }).join("");
  }

  function renderChrome(page) {
    document.body.insertAdjacentHTML("afterbegin", demoBar(page));
    var head = $("[data-site-header]");
    if (head) {
      head.outerHTML =
        '<header class="site-head"><div class="container head-row">' +
        '<a class="brand" href="index.html" aria-label="Abroadversity home"><span class="brand-mark" aria-hidden="true">A</span>Abroadversity</a>' +
        '<nav class="main-nav" aria-label="Main">' + navLinks(page) + "</nav>" +
        '<span class="spacer"></span>' +
        '<a class="btn btn-primary head-cta" href="programmes.html">Find programmes</a>' +
        '<button class="menu-btn" type="button" aria-expanded="false" aria-controls="mobile-nav">Menu</button>' +
        "</div>" +
        '<div class="mobile-nav" id="mobile-nav" hidden><div class="container"><nav aria-label="Main">' + navLinks(page) +
        '<a class="btn btn-primary btn-block" href="programmes.html">Find programmes</a></nav></div></div>' +
        "</header>";
    }
    var foot = $("[data-site-footer]");
    if (foot) {
      foot.outerHTML =
        '<footer class="site-foot"><div class="container foot-grid">' +
        '<div><a class="brand" href="index.html"><span class="brand-mark" aria-hidden="true">A</span>Abroadversity</a>' +
        "<p>Find a programme abroad you can get into and afford, then apply with free help from our counsellors.</p></div>" +
        '<div><h4>Explore</h4><ul><li><a href="programmes.html">Programmes</a></li><li><a href="index.html#countries">Countries</a></li><li><a href="universities.html">Universities</a></li><li><a href="stays.html">Student stays</a></li></ul></div>' +
        '<div><h4>Get help</h4><ul><li><a href="#" data-counsel>Free counselling</a></li><li><a href="programmes.html">Check eligibility</a></li><li><a href="student.html">My journey</a></li></ul></div>' +
        '<div><h4>Partners</h4><ul><li><a href="university.html">For universities</a></li><li><a href="consultant.html">For visa consultants</a></li><li><a href="accommodation.html">For stays partners</a></li><li><a href="agency.html">For agencies</a></li><li><a href="counsellor.html">Counsellor desk</a></li><li><a href="demo.html">How the demo works</a></li></ul></div>' +
        "</div></footer>";
    }

    document.addEventListener("click", function (e) {
      if (e.target.closest("[data-reset]")) {
        if (!D.db) return;
        D.db.reset();
        ["student", "counsellor", "university", "consultant", "partner", "agency"].forEach(function (r) { D.db.as(r, ""); });
        toast("Demo data reset");
        setTimeout(function () { location.reload(); }, 600);
        return;
      }
      var soon = e.target.closest("[data-soon]");
      if (soon) { e.preventDefault(); toast("Not in the prototype yet"); return; }
      var menu = e.target.closest(".menu-btn");
      if (menu) {
        var nav = $("#mobile-nav");
        var open = menu.getAttribute("aria-expanded") === "true";
        menu.setAttribute("aria-expanded", String(!open));
        nav.hidden = open;
        menu.textContent = open ? "Menu" : "Close";
      }
      var book = e.target.closest("[data-counsel]");
      if (book) { e.preventDefault(); openBooking(D.ctx || {}); return; }
      var counsel = e.target.closest('a[href="#counselling"]');
      if (counsel && !$("#counselling")) { e.preventDefault(); location.href = "index.html#counselling"; }
    });
  }

  function counsellingBand() {
    return '<section class="section" id="counselling"><div class="container"><div class="band">' +
      '<div><h2>Not sure where to start?</h2><p>Talk to a counsellor for free. Tell us your marks, budget and plans, and get a shortlist on WhatsApp within a day.</p></div>' +
      '<div class="actions"><button type="button" class="btn btn-primary btn-lg" data-counsel>Book a free call</button><a class="btn btn-ghost btn-lg" href="#" data-soon>WhatsApp us</a></div>' +
      "</div></div></section>";
  }

  /* ---------- Book a free call ---------- */
  var SLOTS = [["morning", "Morning", "9am – 12pm", 12], ["afternoon", "Afternoon", "12 – 4pm", 16], ["evening", "Evening", "4 – 8pm", 20]];
  var DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  var CHECK = icon('<circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.5 2.5L16 9.5"/>');
  function pad2(n) { return (n < 10 ? "0" : "") + n; }

  // The next three days we can call, starting today while an evening slot is still left.
  function callDays() {
    var now = new Date(), out = [];
    for (var i = now.getHours() < 19 ? 0 : 1; out.length < 3; i++) {
      var d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
      out.push({ value: d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate()), label: i === 0 ? "Today" : i === 1 ? "Tomorrow" : DAY_NAMES[d.getDay()], date: d.getDate() + " " + MONTHS[d.getMonth()], today: i === 0 });
    }
    return out;
  }

  var bookForm, bookDone, doneTimer, doneTicker;
  function openBooking(ctx) {
    if (!bookForm) {
      bookForm = document.createElement("dialog"); bookForm.className = "modal"; bookForm.setAttribute("aria-labelledby", "book-title");
      bookDone = document.createElement("dialog"); bookDone.className = "modal modal-sm"; bookDone.setAttribute("aria-labelledby", "booked-title");
      document.body.append(bookForm, bookDone);
      bookForm.addEventListener("click", function (e) { if (e.target === bookForm || e.target.closest("[data-close]")) bookForm.close(); });
      bookDone.addEventListener("click", function (e) { if (e.target === bookDone || e.target.closest("[data-okay]")) bookDone.close(); });
      bookDone.addEventListener("close", function () { clearTimeout(doneTimer); clearInterval(doneTicker); });
    }
    var days = callDays();
    var level = ctx.level || prefs().level || "";
    bookForm.innerHTML =
      '<form class="modal-wrap" novalidate>' +
      '<div class="modal-head"><div><p class="eyebrow">Free counselling</p><h2 id="book-title">Talk to a counsellor</h2>' +
      "<p>Tell us when to call. A counsellor will help you shortlist programmes, check eligibility and plan your application.</p>" +
      (ctx.about ? '<span class="ctx-chip">About: ' + esc(ctx.about) + "</span>" : "") + "</div>" +
      '<button type="button" class="close-btn" data-close aria-label="Close">×</button></div>' +
      '<div class="modal-body">' +
      '<div class="field"><label for="b-name">Your name</label><input class="input" id="b-name" autocomplete="name" placeholder="e.g. Aarav Sharma"><span class="error" hidden></span></div>' +
      '<div class="field"><label for="b-phone">Phone number</label><div class="phone-in"><span>+91</span><input class="input" id="b-phone" inputmode="tel" autocomplete="tel-national" placeholder="10-digit mobile number"></div><span class="error" hidden></span></div>' +
      '<div class="field"><label for="b-level">Level you want to study</label><select class="select" id="b-level"><option value="">Choose a level</option>' +
      D.LEVELS.map(function (l) { return '<option value="' + l.id + '"' + (l.id === level ? " selected" : "") + ">" + esc(l.name) + "</option>"; }).join("") +
      '<option value="not-sure">Not sure yet</option></select><span class="error" hidden></span></div>' +
      '<fieldset class="choices" id="b-day"><legend>When can we call?</legend><div class="choice-row">' +
      days.map(function (d) { return '<label class="choice"><input type="radio" name="b-day" value="' + d.value + '" data-label="' + d.label + '" data-date="' + d.date + '"' + (d.today ? " data-today" : "") + "><span><b>" + d.label + "</b><small>" + d.date + "</small></span></label>"; }).join("") +
      '</div><span class="error" hidden></span></fieldset>' +
      '<fieldset class="choices" id="b-slot"><legend>Best time to call</legend><div class="choice-row">' +
      SLOTS.map(function (s) { return '<label class="choice"><input type="radio" name="b-slot" value="' + s[0] + '" data-end="' + s[3] + '" data-range="' + s[2] + '"><span><b>' + s[1] + "</b><small>" + s[2] + "</small></span></label>"; }).join("") +
      '</div><span class="error" hidden></span></fieldset>' +
      "</div>" +
      '<div class="modal-foot"><span class="small muted">Free, and we only call at the time you pick.</span><button type="submit" class="btn btn-primary btn-lg">Book my free call</button></div>' +
      "</form>";

    var form = $("form", bookForm);
    function err(el, msg) {
      var holder = el.closest(".field, fieldset"), box = holder.querySelector(".error");
      if (el.tagName === "FIELDSET") el.setAttribute("aria-invalid", msg ? "true" : "false"); else el.setAttribute("aria-invalid", msg ? "true" : "false");
      box.hidden = !msg; box.textContent = msg || "";
      return !msg;
    }
    function picked(name) { return $('input[name="' + name + '"]:checked', bookForm); }
    var checks = {
      "b-name": function () { return $("#b-name", bookForm).value.trim().length < 2 ? "Enter your name so the counsellor knows who to ask for." : ""; },
      "b-phone": function () { var d = $("#b-phone", bookForm).value.replace(/\D/g, "").replace(/^91(?=\d{10}$)/, ""); return /^[6-9]\d{9}$/.test(d) ? "" : "Enter a 10-digit Indian mobile number."; },
      "b-level": function () { return $("#b-level", bookForm).value ? "" : "Choose a level, or pick “Not sure yet”."; },
      "b-day": function () { return picked("b-day") ? "" : "Pick a day for the call."; },
      "b-slot": function () { return picked("b-slot") ? "" : "Pick a time for the call."; },
    };
    // Validate on blur; clear as soon as the field becomes valid.
    form.addEventListener("focusout", function (e) { if (checks[e.target.id]) err(e.target, checks[e.target.id]()); });
    form.addEventListener("input", function (e) { if (checks[e.target.id] && e.target.getAttribute("aria-invalid") === "true" && !checks[e.target.id]()) err(e.target, ""); });
    form.addEventListener("change", function (e) {
      if (e.target.name === "b-day") {
        err($("#b-day", bookForm), "");
        // Today: slots that have already ended can't be picked.
        var hour = new Date().getHours(), today = e.target.hasAttribute("data-today");
        $$('input[name="b-slot"]', bookForm).forEach(function (s) { s.disabled = today && Number(s.dataset.end) <= hour + 1; if (s.disabled) s.checked = false; });
      }
      if (e.target.name === "b-slot") err($("#b-slot", bookForm), "");
    });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var first = null;
      Object.keys(checks).forEach(function (id) { var el = $("#" + id, bookForm); if (!err(el, checks[id]()) && !first) first = el; });
      if (first) { (first.tagName === "FIELDSET" ? $("input:not(:disabled)", first) : first).focus(); return; }
      var day = picked("b-day"), slot = picked("b-slot");
      var phone = $("#b-phone", bookForm).value.replace(/\D/g, "").slice(-10);
      var call = { at: new Date().toISOString(), name: $("#b-name", bookForm).value.trim(), phone: "+91" + phone, level: $("#b-level", bookForm).value, day: day.value, slot: slot.value, context: ctx };
      try { var all = JSON.parse(localStorage.getItem("abv.calls") || "[]"); all.push(call); localStorage.setItem("abv.calls", JSON.stringify(all)); } catch (x) { /* storage blocked */ }
      bookForm.close();
      showBooked(call, day, slot);
    });

    bookForm.showModal();
    $("#b-name", bookForm).focus();
  }

  // Confirmation that closes itself after 10 seconds.
  function showBooked(call, day, slot) {
    var when = day.dataset.label === "Today" ? "today" : day.dataset.label === "Tomorrow" ? "tomorrow" : "on " + day.dataset.label;
    var shown = call.phone.replace(/^\+91(\d{5})(\d{5})$/, "+91 $1 $2");
    bookDone.innerHTML =
      '<div class="modal-wrap done-wrap" role="status">' +
      '<span class="done-ic">' + CHECK + "</span>" +
      '<h2 id="booked-title">Call successfully booked</h2>' +
      "<p>We’ll call <b>" + shown + "</b> " + when + ", " + esc(day.dataset.date) + ", between " + esc(slot.dataset.range) + ".</p>" +
      '<p class="small muted">' + esc(call.name.split(" ")[0]) + ", keep your latest marks and English score handy.</p>" +
      '<button type="button" class="btn btn-primary btn-lg btn-block" data-okay>Okay</button>' +
      '<div class="auto-close" aria-hidden="true"><span class="auto-bar"><i></i></span><span class="small muted" data-count>Closes in 10s</span></div>' +
      "</div>";
    bookDone.showModal();
    $("[data-okay]", bookDone).focus();
    var left = 10;
    clearTimeout(doneTimer); clearInterval(doneTicker);
    doneTicker = setInterval(function () { left -= 1; var c = $("[data-count]", bookDone); if (c) c.textContent = "Closes in " + left + "s"; }, 1000);
    doneTimer = setTimeout(function () { if (bookDone.open) bookDone.close(); }, 10000);
  }

  /* ---------- programme card ---------- */
  function passCard(p, opts) {
    opts = opts || {};
    var u = uniOf(p), c = countryOf(p);
    var tags = [];
    var live = openWindow(p);
    var free = tuitionLakh(p) < 1;
    // At most one status pill (the most useful one), then the duration pill, which every card has.
    if (p.closed) tags.push('<span class="tag tag-amber">Applications paused</span>');
    else if (live) tags.push('<span class="tag tag-live">Ongoing intake · apply by ' + dateLabel(live.closes, false) + "</span>");
    else if (!free && opts.budget && tuitionLakh(p) <= opts.budget) tags.push('<span class="tag tag-green">Fits your budget</span>');
    else if (p.intakes.length > 1) tags.push('<span class="tag tag-amber">' + p.intakes.length + " intakes</span>");
    tags.push('<span class="tag tag-sky">' + p.years + "-year " + (p.level === "pg-diploma" ? "diploma" : "degree") + "</span>");
    return '<a class="pass" href="programme.html?id=' + p.id + '"><div class="pass-in">' +
      '<div class="pass-main">' +
      '<div class="pass-title"><h3>' + esc(p.name) + "</h3><span>" + esc(u.name) + " · " + esc(u.city) + ", " + esc(c.name) + "</span></div>" +
      (tags.length ? '<div class="pass-tags">' + tags.join("") + "</div>" : "") +
      '<div class="pass-facts">' +
      '<div class="fact"><small>Tuition / yr</small>' + (free ? "<b>No tuition</b><span>" + money(p.fee, c.currency) + " fees</span>" : "<b>" + money(p.fee, c.currency) + "</b><span>" + approx(p.fee, c.currency) + "</span>") + "</div>" +
      '<div class="fact"><small>Duration</small><b>' + years(p.years) + "</b><span>Full time</span></div>" +
      '<div class="fact"><small>English</small><b>IELTS ' + p.req.ielts.toFixed(1) + "</b><span>Min. " + p.req.pct + "% marks</span></div>" +
      "</div></div>" +
      '<div class="pass-stub">' +
      '<div class="stub-field"><small>Route</small><b>IN <i aria-hidden="true">→</i> ' + c.id.toUpperCase() + "</b></div>" +
      '<div class="stub-field"><small>Next intake</small><b>' + intakeShort(nextWindow(p).start) + "</b></div>" +
      '<span class="stub-go">View details →</span>' +
      "</div></div></a>";
  }

  function match(f) {
    return D.PROGRAMMES.filter(function (p) {
      if (f.subject && p.subject !== f.subject) return false;
      if (f.level && p.level !== f.level) return false;
      if (f.country && countryOf(p).id !== f.country) return false;
      return true;
    });
  }

  function options(list, selected, anyLabel) {
    return (anyLabel !== undefined ? '<option value="">' + anyLabel + "</option>" : "") +
      list.map(function (x) { return '<option value="' + x.id + '"' + (x.id === selected ? " selected" : "") + ">" + esc(x.name) + "</option>"; }).join("");
  }

  /* ================= HOME ================= */
  function initHome() {
    var pr = prefs();
    var form = $("#finder");
    var subj = $("#f-subject"), lvl = $("#f-level"), ctry = $("#f-country");
    // Every field starts on "Any", so a student who isn't sure yet still sees everything.
    ctry.innerHTML = options(D.COUNTRIES, pr.country || "", "Any country");
    lvl.innerHTML = options(D.LEVELS, pr.level || "", "Any level");
    subj.innerHTML = options(D.SUBJECTS, pr.subject || "", "Any subject");

    function update() {
      var n = match({ subject: subj.value, level: lvl.value, country: ctry.value }).length;
      var all = !subj.value && !lvl.value && !ctry.value;
      $("#finder-go").textContent = n ? (all ? "Show all " : "Show ") + plural(n, "programme") + " →" : "See all programmes →";
      $("#finder-note").textContent = n ? "Fees, intakes and entry requirements. No sign-up." : "Nothing for this mix yet. Try another level, or any country.";
    }
    [subj, lvl, ctry].forEach(function (el) { el.addEventListener("change", update); });
    update();

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      savePrefs({ subject: subj.value, level: lvl.value, country: ctry.value });
      var q = new URLSearchParams();
      var n = match({ subject: subj.value, level: lvl.value, country: ctry.value }).length;
      if (n) { if (ctry.value) q.set("country", ctry.value); if (lvl.value) q.set("level", lvl.value); if (subj.value) q.set("subject", subj.value); }
      location.href = "programmes.html" + (q.toString() ? "?" + q : "");
    });

    // Departures board: busiest country + subject routes, soonest intake first.
    var routes = {};
    D.PROGRAMMES.forEach(function (p) {
      var key = countryOf(p).id + "|" + p.subject;
      var r = routes[key] || (routes[key] = { country: countryOf(p).id, subject: p.subject, count: 0, next: p.intakes[0] });
      r.count += 1;
      if (p.intakes[0] < r.next) r.next = p.intakes[0];
    });
    var rows = Object.keys(routes).map(function (k) { return routes[k]; })
      .sort(function (a, b) { return b.count - a.count || a.next.localeCompare(b.next); }).slice(0, 6);
    $("#board-rows").innerHTML = rows.map(function (r) {
      return '<a class="board-row" href="programmes.html?subject=' + r.subject + "&country=" + r.country + '">' +
        '<span class="route">IN→' + r.country.toUpperCase() + "</span>" +
        '<span class="what">' + esc(subjectName(r.subject)) + "</span>" +
        '<span class="when">' + intakeShort(r.next) + "</span>" +
        '<span class="count">' + r.count + "</span></a>";
    }).join("");

    $("#stats").innerHTML = [
      [D.PROGRAMMES.length, "programmes with fees and intakes"],
      [D.UNIVERSITIES.length, "universities"],
      [D.COUNTRIES.length, "countries"],
      ["1 min", "eligibility check, free"],
    ].map(function (s) { return '<div class="stat"><b>' + s[0] + "</b><span>" + s[1] + "</span></div>"; }).join("");

    $("#country-cards").innerHTML = D.COUNTRIES.map(function (c) {
      var list = match({ country: c.id });
      var cheapest = Math.min.apply(null, list.map(tuitionLakh));
      return '<a class="country-card" href="country.html?c=' + c.id + '" style="--stripe:' + stripe(c) + '">' +
        '<div class="cc-head">' + flag(c, "cc-flag") + '<div class="cc-name"><h3>' + esc(c.name) + '</h3><span class="cc-route">DEL ' + PLANE + " " + c.to + " · " + esc(c.flight) + "</span></div></div>" +
        '<div class="cc-stats"><div><b>' + list.length + "</b><span>programmes</span></div>" +
        "<div><b>" + (cheapest < 1 ? "No fee" : rupees(cheapest)) + "</b><span>tuition from / yr</span></div>" +
        "<div><b>" + esc(c.intakes) + "</b><span>intakes</span></div></div>" +
        '<p class="cc-work"><small>After you graduate</small>' + esc(c.work) + "</p>" +
        '<span class="cc-go">Explore ' + esc(c.name) + " →</span></a>";
    }).join("");

    $("#featured").innerHTML = [["toronto", "computer-science"], ["manchester", "data-science"], ["tum", "computer-science"]].map(function (f) {
      return D.PROGRAMMES.find(function (p) { return p.uni === f[0] && p.subject === f[1] && p.level === "masters"; });
    }).filter(Boolean).map(function (p) { return passCard(p); }).join("");
    $("#counselling-slot").outerHTML = counsellingBand();
  }

  /* ================= PROGRAMME LIST ================= */
  function initList() {
    var q = params();
    var pr = prefs();
    var state = {
      subject: q.has("subject") ? q.get("subject") : "",
      level: q.get("level") || "",
      countries: (q.get("country") || "").split(",").filter(Boolean),
      budget: Number(q.get("budget")) || (pr.budget || 0),
      intakes: (q.get("intake") || "").split(",").filter(Boolean),
      durations: (q.get("dur") || "").split(",").filter(Boolean),
      sort: q.get("sort") || "fee",
      uni: q.get("uni") || "",
      limit: 20,
    };
    var PAGE = 20;
    // The slider runs from the cheapest to the dearest tuition (in lakh) for the chosen subject
    // and level; its top end means "any budget".
    function budgetRange() {
      var l = base().map(tuitionLakh);
      if (!l.length) return { min: 0, max: 1, lo: 0, hi: 1 };
      var min = Math.min.apply(null, l), max = Math.max.apply(null, l);
      return { min: min, max: max, lo: Math.floor(min * 10) / 10, hi: Math.ceil(max * 10) / 10 };
    }
    function budgetOn() { return state.budget > 0 && state.budget < budgetRange().hi; }
    var aside = $("#filters");

    function base() { return match({ subject: state.subject, level: state.level }); }
    function durKey(p) { return p.years >= 3 ? "3+" : String(p.years); }
    function apply(list) {
      var capped = budgetOn();
      return list.filter(function (p) {
        if (state.uni && p.uni !== state.uni) return false;
        if (state.countries.length && state.countries.indexOf(countryOf(p).id) < 0) return false;
        if (capped && tuitionLakh(p) > state.budget) return false;
        if (state.intakes.length && !p.intakes.some(function (i) { return state.intakes.indexOf(monthOf(i)) >= 0; })) return false;
        if (state.durations.length && state.durations.indexOf(durKey(p)) < 0) return false;
        return true;
      }).sort(function (a, b) {
        if (state.sort === "intake") return a.intakes[0].localeCompare(b.intakes[0]);
        if (state.sort === "duration") return a.years - b.years || tuitionLakh(a) - tuitionLakh(b);
        return tuitionLakh(a) - tuitionLakh(b);
      });
    }

    function checks(name, items, selected) {
      return items.map(function (it) {
        return '<label class="check"><input type="checkbox" name="' + name + '" value="' + it.value + '"' + (selected.indexOf(it.value) >= 0 ? " checked" : "") + ">" + esc(it.label) + (it.count !== undefined ? "<em>" + it.count + "</em>" : "") + "</label>";
      }).join("");
    }

    function renderFilters() {
      var b = base();
      var countries = D.COUNTRIES.map(function (c) { return { value: c.id, label: c.name, count: b.filter(function (p) { return countryOf(p).id === c.id; }).length }; })
        .filter(function (c) { return c.count || state.countries.indexOf(c.value) >= 0; });
      var months = [];
      D.PROGRAMMES.forEach(function (p) { p.intakes.forEach(function (i) { var m = monthOf(i); if (months.indexOf(m) < 0) months.push(m); }); });
      months.sort(function (x, y) { return MONTHS.indexOf(x) - MONTHS.indexOf(y); });
      var range = budgetRange();
      var budget = budgetOn() ? state.budget : range.hi;
      aside.innerHTML =
        '<div class="filters-head"><h3>Filters</h3><button type="button" class="btn-link" data-clear>Clear all</button>' +
        '<button type="button" class="close-btn filters-close" aria-label="Close filters">×</button></div>' +
        '<div class="fgroup"><span class="label">Country</span>' + (countries.length ? checks("country", countries, state.countries) : '<span class="muted small">No countries for this mix</span>') + "</div>" +
        '<div class="field"><label for="l-level">Level</label><select class="select" id="l-level" name="level">' + options(D.LEVELS, state.level, "Any level") + "</select></div>" +
        '<div class="field"><label for="l-subject">Subject</label><select class="select" id="l-subject" name="subject">' + options(D.SUBJECTS, state.subject, "Any subject") + "</select></div>" +
        '<div class="fgroup"><span class="label">Tuition per year</span>' +
        '<input type="range" id="l-budget" name="budget" min="' + range.lo + '" max="' + range.hi + '" step="0.1" value="' + budget + '" aria-describedby="budget-out">' +
        '<div class="range-ends"><span>' + rupees(range.min) + "</span><span>" + rupees(range.max) + "</span></div>" +
        '<span id="budget-out" class="range-out">' + (budget >= range.hi ? "Any budget" : "Up to " + rupees(budget)) + "</span></div>" +
        '<div class="fgroup wrap"><span class="label">Intake month</span>' + checks("intake", months.map(function (m) { return { value: m, label: m }; }), state.intakes) + "</div>" +
        '<div class="fgroup"><span class="label">Duration</span>' + checks("dur", [{ value: "1", label: "1 year" }, { value: "2", label: "2 years" }, { value: "3+", label: "3 years or more" }], state.durations) + "</div>" +
        '<button type="button" class="btn btn-primary btn-block filters-apply" data-apply></button>';
    }

    function renderResults() {
      var list = apply(base());
      var n = list.length;
      var what = (state.level ? levelName(state.level) + " " : "") + "programme" + (n === 1 ? "" : "s") + (state.subject ? " in " + subjectName(state.subject) : "") + (state.uni && byId(D.UNIVERSITIES, state.uni) ? " at " + byId(D.UNIVERSITIES, state.uni).name : "");
      $("#list-title").textContent = n + " " + what;
      $("#result-count").textContent = "Fees are per year, with an approximate rupee value";
      var apply_ = $("[data-apply]"); if (apply_) apply_.textContent = "Show " + plural(n, "programme");
      $("#filters-count").textContent = activeChips().length ? " · " + activeChips().length : "";

      $("#active").innerHTML = activeChips().map(function (c) {
        return '<button type="button" class="af" data-remove="' + c.key + '" data-value="' + c.value + '" aria-label="Remove ' + esc(c.label) + '">' + esc(c.label) + '<span aria-hidden="true">×</span></button>';
      }).join("");

      var rest = n - Math.min(n, state.limit);
      $("#results").innerHTML = n ? list.slice(0, state.limit).map(function (p) { return passCard(p, { budget: budgetOn() ? state.budget : 0 }); }).join("") +
        (rest ? '<button type="button" class="btn btn-ghost btn-block" data-more>Show ' + Math.min(PAGE, rest) + " more · " + rest + " left</button>" : "") :
        '<div class="empty"><h3>No programmes match all your filters</h3><p class="muted">Remove a filter, or ask a counsellor: we may know a programme that is not listed yet.</p>' +
        '<div class="chips"><button type="button" class="btn btn-dark" data-clear>Clear filters</button><button type="button" class="btn btn-ghost" data-counsel>Talk to a counsellor</button></div></div>';

      var u = new URLSearchParams();
      if (state.uni) u.set("uni", state.uni);
      if (state.subject) u.set("subject", state.subject);
      if (state.level) u.set("level", state.level);
      if (state.countries.length) u.set("country", state.countries.join(","));
      if (budgetOn()) u.set("budget", state.budget);
      if (state.intakes.length) u.set("intake", state.intakes.join(","));
      if (state.durations.length) u.set("dur", state.durations.join(","));
      if (state.sort !== "fee") u.set("sort", state.sort);
      history.replaceState(null, "", "programmes.html" + (u.toString() ? "?" + u : ""));
      savePrefs({ subject: state.subject, level: state.level, budget: budgetOn() ? state.budget : 0 });
      document.title = $("#list-title").textContent + " · Abroadversity";
    }

    function activeChips() {
      var out = [];
      if (state.uni) out.push({ key: "uni", value: "", label: byId(D.UNIVERSITIES, state.uni).name });
      if (state.subject) out.push({ key: "subject", value: state.subject, label: subjectName(state.subject) });
      if (state.level) out.push({ key: "level", value: state.level, label: levelName(state.level) });
      state.countries.forEach(function (c) { out.push({ key: "country", value: c, label: byId(D.COUNTRIES, c).name }); });
      if (budgetOn()) out.push({ key: "budget", value: "", label: "Up to " + rupees(state.budget) });
      state.intakes.forEach(function (m) { out.push({ key: "intake", value: m, label: m + " intake" }); });
      state.durations.forEach(function (d) { out.push({ key: "dur", value: d, label: d === "3+" ? "3+ years" : plural(Number(d), "year") }); });
      return out;
    }

    function readForm() {
      state.subject = $("#l-subject").value;
      state.level = $("#l-level").value;
      state.countries = $$('input[name="country"]:checked', aside).map(function (i) { return i.value; });
      state.intakes = $$('input[name="intake"]:checked', aside).map(function (i) { return i.value; });
      state.durations = $$('input[name="dur"]:checked', aside).map(function (i) { return i.value; });
      state.budget = Number($("#l-budget").value);
    }

    function setSheet(open) {
      aside.classList.toggle("is-open", open);
      $("#scrim").hidden = !open;
      $("#filters-btn").setAttribute("aria-expanded", String(open));
      if (open) { var f = $("select, input, button", aside); if (f) f.focus(); }
    }

    aside.addEventListener("change", function (e) {
      readForm();
      state.limit = PAGE;
      if (e.target.name === "subject" || e.target.name === "level") renderFilters();
      renderResults();
    });
    aside.addEventListener("input", function (e) {
      if (e.target.id !== "l-budget") return;
      var v = Number(e.target.value);
      $("#budget-out").textContent = v >= budgetRange().hi ? "Any budget" : "Up to " + rupees(v);
    });
    document.addEventListener("click", function (e) {
      if (e.target.closest("[data-more]")) { state.limit += PAGE; renderResults(); return; }
      if (e.target.closest("[data-clear]")) {
        state.limit = PAGE;
        state.uni = ""; state.subject = ""; state.level = ""; state.countries = []; state.budget = 0; state.intakes = []; state.durations = [];
        renderFilters(); renderResults(); return;
      }
      var rm = e.target.closest("[data-remove]");
      if (rm) {
        state.limit = PAGE;
        var k = rm.dataset.remove, v = rm.dataset.value;
        if (k === "uni") state.uni = "";
        if (k === "subject") state.subject = "";
        if (k === "level") state.level = "";
        if (k === "budget") state.budget = 0;
        if (k === "country") state.countries = state.countries.filter(function (x) { return x !== v; });
        if (k === "intake") state.intakes = state.intakes.filter(function (x) { return x !== v; });
        if (k === "dur") state.durations = state.durations.filter(function (x) { return x !== v; });
        renderFilters(); renderResults(); return;
      }
      if (e.target.closest("#filters-btn")) { setSheet(true); return; }
      if (e.target.closest(".filters-close") || e.target.closest("[data-apply]") || e.target.id === "scrim") { setSheet(false); $("#filters-btn").focus(); }
    });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && aside.classList.contains("is-open")) setSheet(false); });
    $("#sort").value = state.sort;
    $("#sort").addEventListener("change", function (e) { state.sort = e.target.value; state.limit = PAGE; renderResults(); });

    renderFilters();
    renderResults();
    $("#counselling-slot").outerHTML = counsellingBand();
  }

  /* ================= PROGRAMME PAGE ================= */
  function initProgramme() {
    var p = byId(D.PROGRAMMES, params().get("id") || "");
    var main = $("#programme");
    if (!p) {
      main.innerHTML = '<div class="container section"><div class="empty"><h2>We couldn’t find that programme</h2><p class="muted">It may have been removed or renamed.</p><a class="btn btn-dark" href="programmes.html">See all programmes</a></div></div>';
      return;
    }
    var u = uniOf(p), c = countryOf(p);
    var live = openWindow(p), next = nextWindow(p);
    D.ctx = { programme: p.id, level: p.level, about: p.name + " at " + u.name };
    var listHref = "programmes.html?subject=" + p.subject;
    document.title = p.name + " at " + u.name + " · Abroadversity";

    var similar = D.PROGRAMMES.filter(function (x) { return x.id !== p.id && x.subject === p.subject && x.level === p.level; });
    if (similar.length < 2) similar = similar.concat(D.PROGRAMMES.filter(function (x) { return x.id !== p.id && x.subject === p.subject && similar.indexOf(x) < 0; }));
    similar = similar.slice(0, 2);

    main.innerHTML =
      '<section class="page-head prog-head"><div class="container">' +
      '<nav class="crumbs" aria-label="Breadcrumb"><a href="programmes.html">Programmes</a><span>/</span><a href="' + listHref + '">' + esc(subjectName(p.subject)) + '</a><span>/</span><a href="' + listHref + "&level=" + p.level + '">' + esc(levelName(p.level)) + "</a></nav>" +
      '<div class="prog-title"><div><h1>' + esc(p.name) + '</h1><p class="sub">' + esc(u.name) + " · " + esc(u.city) + ', <a href="country.html?c=' + c.id + '">' + esc(c.name) + "</a></p></div>" +
      '<span class="code">IN → ' + c.id.toUpperCase() + "</span></div>" +
      '<div class="key-facts">' +
      '<div class="key-fact"><small>Tuition / year</small><b>' + money(p.fee, c.currency) + "</b><span>" + approx(p.fee, c.currency) + "</span></div>" +
      '<div class="key-fact"><small>Duration</small><b>' + years(p.years) + "</b><span>Full time, on campus</span></div>" +
      '<div class="key-fact"><small>Intakes</small><b>' + p.intakes.map(intakeLabel).join(", ") + "</b>" + (live ? '<span class="live-text">' + intakeLabel(live.start) + " intake is ongoing</span>" : "<span>" + plural(p.intakes.length, "start date") + "</span>") + "</div>" +
      '<div class="key-fact"><small>Apply by</small><b>' + dateLabel(next.closes) + "</b><span>For the " + intakeLabel(next.start) + " intake</span></div>" +
      "</div>" +
      (p.verified ? '<p class="verified small">' + CHECK + " Fees and intakes verified by " + esc(u.name) + " on " + dateLabel(p.verified.slice(0, 10)) + "</p>" : "") +
      "</div></section>" +

      '<div class="container prog-layout"><div class="prog-main">' +
      '<section class="panel"><h2>Overview</h2><p>' + esc(p.overview) + "</p></section>" +
      '<section class="panel"><h2>Entry requirements</h2><div class="req-grid">' +
      '<div class="req"><small>Previous study</small><b>' + (p.subject === "medicine" ? "Class XII with Physics, Chemistry, Biology + NEET" : p.level === "bachelors" ? "Class XII completed" : "Bachelor’s degree in a related subject") + "</b></div>" +
      '<div class="req"><small>Minimum marks</small><b>' + p.req.pct + "% overall</b></div>" +
      '<div class="req"><small>IELTS Academic</small><b>' + p.req.ielts.toFixed(1) + " overall</b></div>" +
      '<div class="req"><small>Also accepted</small><b>TOEFL iBT ' + p.req.toefl + " · PTE " + p.req.pte + "</b></div>" +
      '</div><p class="small muted">Not sure you qualify? The eligibility check compares your marks and scores with these numbers.</p></section>' +
      '<section class="panel"><h2>Cost per year</h2><table class="cost-table"><tbody>' +
      "<tr><td>Tuition<small>Paid to the university</small></td><td>" + money(p.fee, c.currency) + "<small>" + approx(p.fee, c.currency) + "</small></td></tr>" +
      "<tr><td>Living costs<small>Estimate for " + esc(u.city) + "</small></td><td>" + money(c.living, c.currency) + "<small>" + approx(c.living, c.currency) + "</small></td></tr>" +
      '<tr class="total"><td>Total per year</td><td>' + approx(p.fee + c.living, c.currency) + "</td></tr>" +
      "</tbody></table></section>" +
      '<section class="panel"><h2>How to apply with Abroadversity</h2><ol class="how">' +
      "<li><div><b>Check your eligibility</b>One minute. You see the answer straight away.</div></li>" +
      "<li><div><b>A counsellor reviews your documents</b>Transcripts, English score, SOP and passport, on WhatsApp.</div></li>" +
      "<li><div><b>We submit the application with you</b>And follow up with the university until you hear back.</div></li>" +
      "<li><div><b>Offer, then visa</b>Help with funds, the visa file and pre-departure.</div></li>" +
      "</ol></section>" +
      (similar.length ? '<section class="stack"><div class="section-head"><h2>Similar programmes</h2></div><div class="passes">' + similar.map(function (x) { return passCard(x); }).join("") + "</div></section>" : "") +
      "</div>" +

      '<aside class="cta-card" aria-label="Check eligibility">' +
      "<h3>Can I get into this programme?</h3>" +
      (p.closed ? '<p class="live-note"><span class="tag tag-amber">Applications paused</span>' + esc(u.name) + " is not taking new applications right now. Check anyway and a counsellor will tell you when it reopens.</p>" :
        live ? '<p class="live-note"><span class="tag tag-live">Ongoing intake</span>' + intakeLabel(live.start) + " applications close on " + dateLabel(live.closes) + ".</p>" : "") +
      "<p>Answer four questions about your marks, English test and budget. You see the result right away.</p>" +
      '<button type="button" class="btn btn-primary btn-lg btn-block" data-check>Check eligibility</button>' +
      '<p class="secondary">or <button type="button" class="btn-link" data-counsel>talk to a counsellor</button></p>' +
      '<ul class="ticks"><li>Free, no sign-up</li><li>A counsellor replies on WhatsApp within a day</li><li>Your answers stay with this programme</li></ul>' +
      "</aside></div>" +
      '<div class="mobile-cta"><span class="fee"><b>' + money(p.fee, c.currency) + "</b>a year · " + approx(p.fee, c.currency) + '</span><button type="button" class="btn btn-primary" data-check>Check eligibility</button></div>';

    $("#counselling-slot").outerHTML = counsellingBand();
    setupCheck(p);
  }

  /* ---------- eligibility check ---------- */
  function setupCheck(p) {
    var c = countryOf(p);
    var dlg = $("#check");
    var step = 1;
    var answers = {};
    var isBachelors = p.level === "bachelors";
    var qualOptions = isBachelors
      ? [["done", "Class XII, completed"], ["final", "Class XII, appearing this year"], ["lower", "Class X only"]]
      : [["done", "Bachelor’s degree, completed"], ["final", "Bachelor’s, in final year"], ["lower", "Class XII only"]];
    var budgets = [[15, "Up to ₹15 L a year"], [25, "₹15–25 L a year"], [40, "₹25–40 L a year"], [999, "More than ₹40 L a year"]];
    var pr = prefs();
    var defaultBudget = pr.budget ? (budgets.find(function (b) { return pr.budget <= b[0]; }) || budgets[3])[0] : 25;
    var RANGES = { ielts: [0, 9, 0.5], toefl: [0, 120, 5], pte: [10, 90, 4] };

    function opt(list, sel) { return list.map(function (o) { return '<option value="' + o[0] + '"' + (String(o[0]) === String(sel) ? " selected" : "") + ">" + o[1] + "</option>"; }).join(""); }

    dlg.innerHTML =
      '<form class="check-wrap" id="check-form" novalidate>' +
      '<div class="check-head"><div class="row"><div><h2>Check eligibility</h2><p>' + esc(p.name) + " · " + esc(uniOf(p).name) + "</p></div>" +
      '<button type="button" class="close-btn" data-close aria-label="Close">×</button></div>' +
      '<div class="progress" aria-hidden="true"><i class="on"></i><i></i><i></i></div></div>' +

      '<div class="check-body" data-step="1">' +
      '<div class="field"><label for="c-qual">Your highest qualification</label><select class="select" id="c-qual">' + opt(qualOptions, "done") + "</select></div>" +
      '<div class="field"><label for="c-pct">Marks in that qualification (%)</label><input class="input" id="c-pct" inputmode="decimal" placeholder="e.g. 72" autocomplete="off"><span class="hint">CGPA? Multiply by 9.5 for a rough percentage.</span><span class="error" hidden></span></div>' +
      '<div class="two"><div class="field"><label for="c-test">English test</label><select class="select" id="c-test">' + opt([["ielts", "IELTS Academic"], ["toefl", "TOEFL iBT"], ["pte", "PTE Academic"], ["none", "Not taken yet"]], "ielts") + "</select></div>" +
      '<div class="field" id="score-field"><label for="c-score">Overall score</label><input class="input" id="c-score" inputmode="decimal" placeholder="e.g. 7.0" autocomplete="off"><span class="error" hidden></span></div></div>' +
      '<div class="two"><div class="field"><label for="c-intake">When do you want to start?</label><select class="select" id="c-intake">' + opt(p.windows.filter(function (w) { return w.closes >= today(); }).concat(p.windows.every(function (w) { return w.closes < today(); }) ? p.windows : []).map(function (w) { return [w.start, intakeLabel(w.start) + (w === openWindow(p) ? " (ongoing)" : "")]; }), nextWindow(p).start) + "</select></div>" +
      '<div class="field"><label for="c-budget">Budget, all costs</label><select class="select" id="c-budget">' + opt(budgets, defaultBudget) + "</select></div></div>" +
      '<p class="small muted">We already know the programme, level and country, so we don’t ask again.</p>' +
      "</div>" +

      '<div class="check-body" data-step="2" hidden><div id="result"></div>' +
      '<p class="small" style="font-weight:600">Where should a counsellor send your next steps?</p>' +
      '<div class="field"><label for="c-name">Your name</label><input class="input" id="c-name" autocomplete="name"><span class="error" hidden></span></div>' +
      '<div class="field"><label for="c-phone">WhatsApp number</label><input class="input" id="c-phone" inputmode="tel" autocomplete="tel" placeholder="10-digit mobile number"><span class="error" hidden></span></div>' +
      '<div class="field"><label for="c-email">Email <span class="muted">(optional)</span></label><input class="input" id="c-email" inputmode="email" autocomplete="email"><span class="error" hidden></span></div>' +
      "</div>" +

      '<div class="check-body" data-step="3" hidden><div id="done"></div></div>' +

      '<div class="check-foot"><span class="small muted" id="step-label">Step 1 of 2</span>' +
      '<div class="chips"><button type="button" class="btn btn-ghost" data-back hidden>Back</button><button type="submit" class="btn btn-primary" id="check-next">See my result</button></div></div>' +
      "</form>";

    var form = $("#check-form", dlg);

    function fieldError(input, msg) {
      var err = input.parentElement.querySelector(".error");
      input.setAttribute("aria-invalid", msg ? "true" : "false");
      if (err) { err.hidden = !msg; err.textContent = msg || ""; }
      return !msg;
    }
    var validators = {
      "c-pct": function (v) { var n = Number(v); if (!v.trim()) return "Enter your marks as a percentage."; if (isNaN(n) || n < 33 || n > 100) return "Enter a number between 33 and 100."; return ""; },
      "c-score": function (v) {
        var t = $("#c-test", dlg).value; if (t === "none") return "";
        var r = RANGES[t], n = Number(v);
        if (!v.trim()) return "Enter your overall score.";
        if (isNaN(n) || n < r[0] || n > r[1]) return "Enter a score between " + r[0] + " and " + r[1] + ".";
        return "";
      },
      "c-name": function (v) { return v.trim().length < 2 ? "Enter your name so the counsellor knows who to ask for." : ""; },
      "c-phone": function (v) { var d = v.replace(/\D/g, "").replace(/^91(?=\d{10}$)/, ""); return /^[6-9]\d{9}$/.test(d) ? "" : "Enter a 10-digit Indian mobile number."; },
      "c-email": function (v) { return !v.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? "" : "Check the email address, or leave it empty."; },
    };
    // Validate on blur; clear the message as soon as the input becomes valid.
    form.addEventListener("focusout", function (e) { var f = validators[e.target.id]; if (f) fieldError(e.target, f(e.target.value)); });
    form.addEventListener("input", function (e) { var f = validators[e.target.id]; if (f && e.target.getAttribute("aria-invalid") === "true" && !f(e.target.value)) fieldError(e.target, ""); });
    $("#c-test", dlg).addEventListener("change", function (e) {
      var none = e.target.value === "none";
      $("#score-field", dlg).hidden = none;
      $("#c-score", dlg).placeholder = { ielts: "e.g. 7.0", toefl: "e.g. 95", pte: "e.g. 65" }[e.target.value] || "";
      fieldError($("#c-score", dlg), "");
    });

    function validStep(ids) {
      var firstBad = null;
      ids.forEach(function (id) { var el = $("#" + id, dlg); if (!fieldError(el, validators[id](el.value)) && !firstBad) firstBad = el; });
      if (firstBad) firstBad.focus();
      return !firstBad;
    }

    function evaluate() {
      var rows = [], bad = false, warn = false;
      var q = answers.qual, pct = answers.pct, test = answers.test, score = answers.score, budget = answers.budget;
      if (q === "done") rows.push(["ok", isBachelors ? "Class XII completed: meets the entry level" : "Bachelor’s completed: meets the entry level"]);
      else if (q === "final") { warn = true; rows.push(["warn", "Final-year students can apply with marks so far; the offer becomes final with your result"]); }
      else { bad = true; rows.push(["bad", isBachelors ? "This programme needs Class XII first" : "This programme needs a Bachelor’s degree first"]); }

      if (pct >= p.req.pct) rows.push(["ok", pct + "% meets the " + p.req.pct + "% minimum"]);
      else if (pct >= p.req.pct - 5) { warn = true; rows.push(["warn", pct + "% is just under " + p.req.pct + "%. Some students are still admitted; a counsellor will check"]); }
      else { bad = true; rows.push(["bad", pct + "% is below the " + p.req.pct + "% minimum"]); }

      var testName = { ielts: "IELTS", toefl: "TOEFL", pte: "PTE" }[test];
      if (test === "none") { warn = true; rows.push(["warn", "No English test yet: you need IELTS " + p.req.ielts.toFixed(1) + " or equal. We can help you book one"]); }
      else {
        var need = p.req[test], margin = { ielts: 0.5, toefl: 5, pte: 4 }[test];
        if (score >= need) rows.push(["ok", testName + " " + score + " meets the " + need + " needed"]);
        else if (score >= need - margin) { warn = true; rows.push(["warn", testName + " " + score + " is just under " + need + ". A retake or a pre-sessional English course can close the gap"]); }
        else { bad = true; rows.push(["bad", testName + " " + score + " is below the " + need + " needed"]); }
      }

      var total = totalLakh(p), tuition = tuitionLakh(p);
      if (budget >= total) rows.push(["ok", "About " + rupees(total) + " a year with living costs fits your budget"]);
      else if (budget >= tuition) { warn = true; rows.push(["warn", "Tuition fits, but with living costs it is about " + rupees(total) + " a year. Scholarships can close the gap"]); }
      else { warn = true; rows.push(["warn", "About " + rupees(total) + " a year is above your budget. We’ll suggest cheaper options too"]); }

      var level = bad ? "no" : warn ? "close" : "good";
      var title = { good: "You meet the listed requirements", close: "You’re close", no: "Not a match yet" }[level];
      var line = { good: "A counsellor will confirm and help you apply for " + intakeLabel(answers.intake) + ".", close: "A counsellor will check the points below with you.", no: "A counsellor can suggest programmes that fit your profile." }[level];
      return { level: level, html: '<div class="result ' + (level === "no" ? "no" : level) + '" role="status"><h3>' + title + "</h3><p class=\"small\">" + line + "</p><ul>" + rows.map(function (r) { return '<li class="' + r[0] + '">' + esc(r[1]) + "</li>"; }).join("") + "</ul></div>" };
    }

    function show(n) {
      step = n;
      $$("[data-step]", dlg).forEach(function (s) { s.hidden = Number(s.dataset.step) !== n; });
      $$(".progress i", dlg).forEach(function (b, i) { b.classList.toggle("on", i < n); });
      $("[data-back]", dlg).hidden = n !== 2;
      var next = $("#check-next", dlg);
      next.hidden = false;
      if (n === 1) { $("#step-label", dlg).textContent = "Step 1 of 2"; next.textContent = "See my result"; }
      if (n === 2) { $("#step-label", dlg).textContent = "Step 2 of 2"; next.textContent = "Send to a counsellor"; }
      if (n === 3) { $("#step-label", dlg).textContent = "Done"; next.textContent = "Close"; }
      $("[data-step='" + n + "']", dlg).scrollTop = 0;
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (step === 1) {
        if (!validStep(["c-pct", "c-score"])) return;
        answers = {
          qual: $("#c-qual", dlg).value, pct: Number($("#c-pct", dlg).value), test: $("#c-test", dlg).value,
          score: Number($("#c-score", dlg).value), intake: $("#c-intake", dlg).value, budget: Number($("#c-budget", dlg).value),
        };
        answers.result = evaluate();
        $("#result", dlg).innerHTML = answers.result.html;
        show(2);
        $("#c-name", dlg).focus();
        return;
      }
      if (step === 2) {
        if (!validStep(["c-name", "c-phone", "c-email"])) return;
        var name = $("#c-name", dlg).value.trim();
        // The lead lands in a counsellor's inbox with the programme and answers attached.
        var made = D.db.createLead({
          programmeId: p.id, name: name, phone: $("#c-phone", dlg).value.trim(), email: $("#c-email", dlg).value.trim(),
          eligibility: { qual: answers.qual, pct: answers.pct, test: answers.test, score: answers.score, intake: answers.intake, budget: answers.budget, result: answers.result.level },
        });
        D.db.as("student", made.student.id);
        var counsellor = D.db.counsellor(made.kase.counsellorId);
        var cheaper = D.PROGRAMMES.filter(function (x) { return x.id !== p.id && x.subject === p.subject && totalLakh(x) <= answers.budget; }).slice(0, 2);
        $("#done", dlg).innerHTML =
          '<div class="result good" role="status"><h3>Sent. Thanks, ' + esc(name.split(" ")[0]) + "</h3>" +
          '<p class="small">' + esc(counsellor.name) + " will message you on WhatsApp within one working day about " + esc(p.name) + " at " + esc(uniOf(p).name) + ". Your answers are attached, so you won’t be asked again.</p>" +
          '<p class="small"><a class="btn btn-dark" href="student.html?as=' + made.student.id + "&case=" + made.kase.id + '">Track it in My journey →</a></p></div>' +
          (cheaper.length ? '<p class="small" style="font-weight:600">Also within your budget</p><div class="passes on-card">' + cheaper.map(function (x) { return passCard(x); }).join("") + "</div>" : "");
        show(3);
        return;
      }
      dlg.close();
    });
    dlg.addEventListener("click", function (e) {
      if (e.target === dlg || e.target.closest("[data-close]")) dlg.close();
      if (e.target.closest("[data-back]")) show(1);
    });
    document.addEventListener("click", function (e) {
      if (!e.target.closest("[data-check]")) return;
      show(1);
      dlg.showModal();
      $("#c-pct", dlg).focus();
    });
  }

  /* ================= COUNTRY ================= */
  function initCountry() {
    var c = byId(D.COUNTRIES, params().get("c") || "");
    var main = $("#country");
    if (!c) {
      main.innerHTML = '<div class="container section"><div class="empty"><h2>We couldn’t find that country</h2><a class="btn btn-dark" href="index.html#countries">See all countries</a></div></div>';
      return;
    }
    document.title = "Study in " + c.name + " · Abroadversity";
    D.ctx = { country: c.id, about: "Studying in " + c.name };
    var list = match({ country: c.id });
    var fees = list.map(function (p) { return p.fee; });
    var minFee = Math.min.apply(null, fees), maxFee = Math.max.apply(null, fees);
    var unis = D.UNIVERSITIES.filter(function (u) { return u.country === c.id; });
    var subjects = D.SUBJECTS.map(function (s) { return { s: s, n: list.filter(function (p) { return p.subject === s.id; }).length }; }).filter(function (x) { return x.n; });
    var schol = D.SCHOLARSHIPS[c.id] || [];
    var cheapest = lakh(minFee, c.currency);
    var sorted = list.map(tuitionLakh).sort(function (x, y) { return x - y; });
    var typicalL = sorted[Math.floor(sorted.length / 2)], livingL = lakh(c.living, c.currency);

    main.innerHTML =
      '<section class="country-hero" style="--stripe:' + stripe(c) + '"><div class="container">' +
      '<nav class="crumbs" aria-label="Breadcrumb"><a href="index.html#countries">Countries</a><span>/</span><span>' + esc(c.name) + "</span></nav>" +
      '<div class="ch-grid"><div class="ch-copy">' +
      '<div class="title">' + flag(c, "ch-flag") + "<h1>Study in " + esc(c.name) + "</h1></div>" +
      '<p class="lede">' + esc(c.pitch) + "</p>" +
      '<div class="actions"><a class="btn btn-primary btn-lg" href="programmes.html?country=' + c.id + '">See ' + plural(list.length, "programme") + ' →</a><button type="button" class="btn btn-ghost btn-lg" data-counsel>Talk to a counsellor</button></div>' +
      "</div>" +
      '<aside class="route-pass" aria-label="Your route to ' + esc(c.name) + '">' +
      '<div class="rp-head"><span>Your route</span>' + flag(c, "rp-flag") + "</div>" +
      '<div class="rp-route"><div><b>DEL</b><small>New Delhi</small></div><span class="rp-line">' + PLANE + '</span><div class="rp-to"><b>' + c.to + "</b><small>" + esc(c.city) + "</small></div></div>" +
      '<dl class="rp-facts">' +
      "<div><dt>Flight</dt><dd>" + esc(c.flight) + "</dd></div>" +
      "<div><dt>Time vs India</dt><dd>" + esc(c.tz) + "</dd></div>" +
      "<div><dt>Currency</dt><dd>1 " + c.currency + " ≈ ₹" + D.RATES[c.currency] + "</dd></div>" +
      "<div><dt>Language</dt><dd>" + esc(c.language) + "</dd></div>" +
      "</dl></aside></div>" +
      '<div class="key-facts">' +
      '<div class="key-fact"><small>Tuition from</small><b>' + (cheapest < 1 ? "No tuition" : rupees(cheapest) + " / year") + "</b><span>" + money(minFee, c.currency) + "</span></div>" +
      '<div class="key-fact"><small>Living costs</small><b>' + approx(c.living, c.currency).replace("≈ ", "") + " / year</b><span>Estimate</span></div>" +
      '<div class="key-fact"><small>Intakes</small><b>' + esc(c.intakes) + "</b><span>Main start dates</span></div>" +
      '<div class="key-fact"><small>After you graduate</small><b style="font-size:15px">' + esc(c.work) + "</b></div>" +
      "</div>" +
      "</div></section>" +

      '<nav class="jump" aria-label="On this page"><div class="container">' +
      '<a href="#subjects">Subjects</a><a href="#universities">Universities</a><a href="#costs">Costs & visa</a>' +
      (schol.length ? '<a href="#scholarships">Scholarships</a>' : "") + '<a href="#faqs">FAQs</a>' +
      "</div></nav>" +

      '<section class="section" id="subjects"><div class="container">' +
      '<div class="section-head row"><div class="stack"><p class="eyebrow">Study options</p><h2>What you can study in ' + esc(c.name) + "</h2></div>" +
      '<a class="btn btn-ghost" href="programmes.html?country=' + c.id + '">All ' + list.length + " programmes →</a></div>" +
      '<div class="subj-grid" style="--cols:' + columnsFor(subjects.length) + '">' + subjects.map(function (x) {
        var from = Math.min.apply(null, list.filter(function (p) { return p.subject === x.s.id; }).map(tuitionLakh));
        return '<a class="subj" href="programmes.html?subject=' + x.s.id + "&country=" + c.id + '">' +
          '<span class="subj-ic">' + (ICONS[x.s.id] || "") + "</span>" +
          '<span class="subj-txt"><b>' + esc(x.s.name) + "</b><span>" + plural(x.n, "programme") + " · from " + (from < 1 ? "no tuition" : rupees(from) + "/yr") + "</span></span>" +
          '<span class="subj-go" aria-hidden="true">→</span></a>';
      }).join("") + "</div>" +
      "</div></section>" +

      '<section class="section band-white" id="universities"><div class="container">' +
      '<div class="section-head"><p class="eyebrow">Universities</p><h2>Where you could study</h2><p>' + plural(unis.length, "university", "universities") + " in " + esc(c.name) + " with programmes on Abroadversity.</p></div>" +
      '<div class="uni-cards" style="--cols:' + columnsFor(unis.length) + '">' + unis.map(function (u) {
        var up = list.filter(function (p) { return p.uni === u.id; });
        var from = Math.min.apply(null, up.map(tuitionLakh));
        var next = up.map(function (p) { return nextWindow(p).start; }).sort()[0];
        return '<a class="uni-card" href="programmes.html?uni=' + u.id + '">' +
          '<div class="uni-head"><span class="uni-mono" aria-hidden="true">' + initials(u.name) + '</span><div class="uni-txt"><h3>' + esc(u.name) + '</h3><span class="uni-city">' + PIN + esc(u.city) + "</span></div></div>" +
          '<dl class="uni-facts"><div><dt>Programmes</dt><dd>' + up.length + "</dd></div><div><dt>Tuition from</dt><dd>" + (from < 1 ? "No fee" : rupees(from)) + "</dd></div><div><dt>Next intake</dt><dd>" + intakeShort(next) + "</dd></div></dl>" +
          '<span class="uni-go">See programmes →</span></a>';
      }).join("") + "</div>" +
      "</div></section>" +

      '<section class="section" id="costs"><div class="container">' +
      '<div class="section-head"><p class="eyebrow">Money and visa</p><h2>What a year costs, and the paperwork</h2></div>' +
      '<div class="split">' +
      '<div class="panel cost-panel"><div class="panel-head"><h3>A typical year</h3><span class="small muted">Middle-priced programme</span></div>' +
      '<div class="cost-total"><b>' + rupees(typicalL + livingL) + "</b><span>a year, about " + rupees((typicalL + livingL) / 12) + " a month</span></div>" +
      '<div class="cost-bar" role="img" aria-label="Tuition ' + rupees(typicalL) + ", living " + rupees(livingL) + '"><span class="seg-t" style="flex:' + Math.max(typicalL, 0.4) + '"></span><span class="seg-l" style="flex:' + livingL + '"></span></div>' +
      '<ul class="cost-legend">' +
      '<li><i class="sw-t"></i><span>Tuition</span><b>' + (typicalL < 1 ? "No tuition" : rupees(typicalL)) + "</b><small>" + (maxFee === minFee ? money(minFee, c.currency) : money(minFee, c.currency) + " – " + maxFee.toLocaleString("en-US")) + " across programmes</small></li>" +
      '<li><i class="sw-l"></i><span>Living</span><b>' + rupees(livingL) + "</b><small>" + money(c.living, c.currency) + " estimate</small></li>" +
      "</ul></div>" +
      '<div class="panel visa-panel"><div class="panel-head"><h3>Student visa in 3 steps</h3></div>' +
      '<ol class="steps-line">' + c.visa.map(function (v) { return "<li>" + esc(v) + "</li>"; }).join("") + "</ol>" +
      '<div class="work-tiles">' +
      '<div class="work-tile"><span class="wt-ic">' + CLOCK + "</span><small>While you study</small><b>" + esc(c.workWhileStudying) + "</b></div>" +
      '<div class="work-tile"><span class="wt-ic">' + CASE + "</span><small>After you graduate</small><b>" + esc(c.work) + "</b></div>" +
      "</div></div>" +
      "</div></div></section>" +

      (schol.length ? '<section class="section band-white" id="scholarships"><div class="container">' +
        '<div class="section-head"><p class="eyebrow">Funding</p><h2>Scholarships for students from India</h2></div>' +
        '<div class="vouchers">' + schol.map(function (s) {
          return '<div class="voucher"><div class="v-amt"><small>Worth · sample</small><b>' + esc(s.amount.replace(/\s*\(sample\)/, "")) + '</b></div><div class="v-body"><h3>' + esc(s.name) + "</h3><p>" + esc(s.note) + "</p></div></div>";
        }).join("") + "</div></div></section>" : "") +

      '<section class="section" id="faqs"><div class="container faq-grid">' +
      '<div class="faq-side"><p class="eyebrow">FAQs</p><h2>Questions students ask about ' + esc(c.name) + '</h2><p class="muted">Can’t find your answer? A counsellor replies on WhatsApp within a day.</p><button type="button" class="btn btn-dark" data-counsel>Ask a counsellor</button></div>' +
      '<div class="faq">' +
      faq("How much does it cost to study in " + c.name + "?", "Tuition on our programmes runs from " + (cheapest < 1 ? "no fee at public universities" : rupees(cheapest) + " a year") + ", and living costs are about " + approx(c.living, c.currency).replace("≈ ", "") + " a year. Each programme page shows the total.") +
      faq("Can I work while I study?", c.workWhileStudying + ". After you graduate: " + c.work.charAt(0).toLowerCase() + c.work.slice(1) + ".") +
      faq("Which English test should I take?", "IELTS Academic is accepted everywhere we list. Most programmes also take TOEFL iBT and PTE Academic; the programme page shows the score you need.") +
      faq("When should I apply?", "The main intakes are " + c.intakes + ". Apply 6 to 9 months before you want to start, so there is time for the visa.") +
      "</div></div></section>";

    // Highlight the jump link for the section in view.
    var jumpLinks = $$(".jump a");
    if ("IntersectionObserver" in window) {
      var seen = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) jumpLinks.forEach(function (l) { l.classList.toggle("is-on", l.getAttribute("href") === "#" + en.target.id); });
        });
      }, { rootMargin: "-40% 0px -55% 0px" });
      $$("main#country section[id]").forEach(function (s) { seen.observe(s); });
    }

    $("#counselling-slot").outerHTML = counsellingBand();
  }

  // Three or four columns, whichever leaves the last row fuller (7 cards: 4 + 3, not 3 + 3 + 1).
  function columnsFor(n) {
    if (n <= 2) return 2;
    var fill = function (c) { return (n % c || c) / c; };
    return fill(4) > fill(3) ? 4 : 3;
  }
  // TCD, UCD, TUM, MIT: an acronym already in the name wins, otherwise the initials.
  function initials(name) {
    var words = name.replace(/[()]/g, " ").split(/\s+/).filter(Boolean);
    var acro = words.find(function (w) { return /^[A-Z]{2,5}$/.test(w); });
    if (acro) return acro;
    return words.filter(function (w) { return !/^(of|the|in|and|de|du|la)$/i.test(w); }).slice(0, 3).map(function (w) { return w[0].toUpperCase(); }).join("");
  }

  function faq(q, a) { return "<details><summary>" + esc(q) + "</summary><p>" + esc(a) + "</p></details>"; }

  /* ---------- shared with the portals (portal.js) ---------- */
  D.ui = {
    $: $, $$: $$, byId: byId, esc: esc, params: params, plural: plural, toast: toast,
    uniOf: uniOf, countryOf: countryOf, subjectName: subjectName, levelName: levelName,
    money: money, lakh: lakh, rupees: rupees, approx: approx, intakeLabel: intakeLabel, dateLabel: dateLabel,
    passCard: passCard, flag: flag, initials: initials, counsellingBand: counsellingBand, icon: icon, PIN: PIN, CHECK: CHECK,
  };

  /* ---------- boot ---------- */
  var page = document.body.dataset.page;
  renderChrome(page);
  D.pages = D.pages || {};
  (D.pages[page] || { home: initHome, list: initList, programme: initProgramme, country: initCountry }[page] || function () {})();
})();
