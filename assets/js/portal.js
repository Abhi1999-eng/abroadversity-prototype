/* The six sides of the demo (student, counsellor, university, visa consultant,
   stays partner, partner agency) plus the public Stays, Universities and demo-guide pages.
   Each page registers an init in ABV.pages; app.js runs it after the chrome. */
(function () {
  "use strict";
  var D = window.ABV;
  D.pages = D.pages || {};

  // app.js sets ABV.ui when it boots, which is before any init below runs.
  var U, $, $$, esc;
  function ui() { U = D.ui; $ = U.$; $$ = U.$$; esc = U.esc; }

  /* ---------- small helpers ---------- */
  function first(name) { return name.split(" ")[0]; }
  function ago(iso) {
    var m = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
    if (m < 1) return "just now";
    if (m < 60) return m + " min ago";
    var h = Math.round(m / 60);
    if (h < 24) return h + " h ago";
    var d = Math.round(h / 24);
    return d === 1 ? "yesterday" : d + " days ago";
  }
  function waited(iso) {
    var h = Math.floor((Date.now() - new Date(iso).getTime()) / 3600e3);
    if (h < 1) return "under 1h";
    return h < 24 ? h + "h" : Math.floor(h / 24) + "d " + (h % 24) + "h";
  }
  function stageName(id) { return D.STAGES.find(function (s) { return s.id === id; }).name; }
  function pill(stage) { return '<span class="pill pill-' + stage + '">' + stageName(stage) + "</span>"; }
  var UNI_STATUS = { "not-sent": "Not sent yet", submitted: "Received", "under-review": "In review", offer: "Offer made", rejected: "Declined" };
  var RESULT = { good: ["Meets requirements", "ok"], close: ["Close", "warn"], no: ["Not a match yet", "bad"] };
  function resultChip(r) { var x = RESULT[r] || RESULT.close; return '<span class="chip-s chip-' + x[1] + '">' + x[0] + "</span>"; }
  function prog(c) { return D.db.programme(c.programmeId); }
  function uniName(c) { var u = D.db.uniOfCase(c); return u ? u.name : ""; }
  function countryOfCase(c) { var p = prog(c); return p ? U.countryOf(p) : null; }
  function missingDocs(c) { return D.DOCS.filter(function (d) { return c.docs[d.id].status !== "uploaded"; }); }
  function totalCostLakh(p) { var co = U.countryOf(p); return U.lakh(p.fee + co.living, co.currency); }
  function listingProvider(l) { return D.db.provider(l.provider); }
  // Who the student deals with: a partner agency's name, or Abroadversity.
  function brandOf(c) { var a = D.db.agencyOfCase(c); return a ? a.name : "Abroadversity"; }
  function counsellorLabel(x) { var a = x.agencyId && D.db.agency(x.agencyId); return x.name + " · " + (a ? a.name + ", " : "") + x.city; }

  // Redraw keeps whatever the person was typing in fields marked data-keep.
  function keepDrafts(render) {
    return function () {
      var drafts = {};
      $$("[data-keep]").forEach(function (el) { drafts[el.id] = el.value; });
      var focus = document.activeElement && document.activeElement.id;
      render();
      Object.keys(drafts).forEach(function (id) { var el = document.getElementById(id); if (el) el.value = drafts[id]; });
      if (focus && document.getElementById(focus)) document.getElementById(focus).focus();
    };
  }

  // Which person this side is "viewing as": ?as= in the URL, then the last choice, then the first.
  function identity(role, list, fallback) {
    var q = U.params().get("as");
    var id = (q && list.some(function (x) { return x.id === q; })) ? q : D.db.as(role);
    if (!list.some(function (x) { return x.id === id; })) id = fallback || (list[0] && list[0].id);
    D.db.as(role, id);
    return id;
  }
  function go(patch) {
    var q = U.params();
    Object.keys(patch).forEach(function (k) { if (patch[k] === null || patch[k] === "") q.delete(k); else q.set(k, patch[k]); });
    history.replaceState(null, "", location.pathname + "?" + q.toString());
  }

  function shell(o) {
    return '<header class="p-head"><div class="container p-head-row">' +
      '<a class="brand" href="index.html"><span class="brand-mark" aria-hidden="true">A</span>Abroadversity</a>' +
      '<span class="p-role">' + esc(o.role) + "</span>" +
      '<span class="spacer"></span>' +
      '<label class="p-as"><span>Viewing as</span><select class="select" id="as-select">' +
      o.people.map(function (x) { return '<option value="' + x.id + '"' + (x.id === o.current ? " selected" : "") + ">" + esc(x.label) + "</option>"; }).join("") +
      "</select></label>" +
      "</div></header>" +
      '<div class="container p-body" id="p-body"></div>';
  }
  function bindAs(role) {
    $("#as-select").addEventListener("change", function (e) { D.db.as(role, e.target.value); go({ as: e.target.value, case: null, tab: null }); location.reload(); });
  }

  function stats(items) {
    return '<div class="p-stats">' + items.map(function (s) { return '<div class="p-stat' + (s.alert ? " is-alert" : "") + '"><b>' + s.n + "</b><span>" + esc(s.label) + "</span></div>"; }).join("") + "</div>";
  }

  function thread(c, role, name) {
    var list = D.db.messages(c.id);
    return '<section class="panel p-thread"><div class="panel-head"><h3>Messages</h3><span class="small muted">Shared with the student, counsellor and consultant</span></div>' +
      '<div class="msgs">' + (list.length ? list.map(function (m) {
        return '<div class="msg msg-' + m.role + (m.role === role ? " is-me" : "") + '"><div class="msg-meta"><b>' + esc(m.name) + "</b><span>" + ago(m.at) + "</span></div><p>" + esc(m.text) + "</p></div>";
      }).join("") : '<p class="small muted">No messages yet.</p>') + "</div>" +
      '<form class="msg-form" data-msg="' + c.id + '" data-role="' + role + '" data-name="' + esc(name) + '">' +
      '<label class="sr-only" for="msg-' + c.id + '">Message</label>' +
      '<textarea class="input" id="msg-' + c.id + '" rows="2" placeholder="Write a message" data-keep></textarea>' +
      '<button type="submit" class="btn btn-dark">Send</button></form></section>';
  }
  function bindThreads() {
    document.addEventListener("submit", function (e) {
      var f = e.target.closest("[data-msg]");
      if (!f) return;
      e.preventDefault();
      var box = $("textarea", f), text = box.value.trim();
      if (!text) { box.focus(); return; }
      box.value = "";
      D.db.message(f.dataset.msg, f.dataset.role, f.dataset.name, text);
    });
  }

  function timeline(c) {
    var ev = D.db.events(c.id);
    return '<section class="panel"><div class="panel-head"><h3>Timeline</h3></div><ol class="tl">' +
      ev.map(function (e) { return '<li class="tl-' + e.role + '"><span>' + esc(e.text) + "</span><small>" + ago(e.at) + "</small></li>"; }).join("") + "</ol></section>";
  }

  function tracker(c) {
    return '<ol class="tracker">' + D.db.progress(c).map(function (s) {
      return '<li class="' + (s.done ? "is-done" : s.current ? "is-now" : "") + '"><i aria-hidden="true"></i><span>' + esc(s.name) + "</span></li>";
    }).join("") + "</ol>";
  }

  // The four answers next to what the programme asks for.
  function eligibilityTable(c) {
    var p = prog(c), e = c.eligibility, need = p.req;
    var test = { ielts: "IELTS", toefl: "TOEFL", pte: "PTE", none: "No test yet" }[e.test];
    var testNeed = e.test === "none" ? need.ielts : need[e.test];
    var qual = { done: "Completed", final: "Final year", lower: "Below entry level" }[e.qual];
    var total = totalCostLakh(p);
    function row(label, val, req, ok) { return "<tr><td>" + label + "</td><td>" + esc(String(val)) + "</td><td>" + esc(String(req)) + '</td><td><span class="dot dot-' + ok + '" aria-label="' + ok + '"></span></td></tr>'; }
    return '<table class="p-table elig"><thead><tr><th>Check</th><th>Student</th><th>Programme needs</th><th><span class="sr-only">Result</span></th></tr></thead><tbody>' +
      row("Qualification", qual, p.level === "bachelors" ? "Class XII" : "Bachelor’s", e.qual === "done" ? "ok" : e.qual === "final" ? "warn" : "bad") +
      row("Marks", e.pct + "%", need.pct + "%", e.pct >= need.pct ? "ok" : e.pct >= need.pct - 5 ? "warn" : "bad") +
      row("English", e.test === "none" ? test : test + " " + e.score, (e.test === "none" ? "IELTS " : test + " ") + testNeed, e.test === "none" ? "warn" : e.score >= testNeed ? "ok" : "warn") +
      row("Budget a year", e.budget >= 999 ? "Above ₹40 L" : "Up to ₹" + e.budget + " L", "About " + U.rupees(total), e.budget >= total ? "ok" : "warn") +
      "</tbody></table>";
  }

  function docList(c, canUpload) {
    return '<ul class="docs">' + D.DOCS.map(function (d) {
      var x = c.docs[d.id], up = x.status === "uploaded";
      return '<li class="' + (up ? "is-up" : "") + '"><span class="doc-ic" aria-hidden="true">' + (up ? U.CHECK : "") + '</span><div><b>' + esc(d.name) + "</b><small>" + (up ? esc(x.file) + " · " + ago(x.at) : "Not uploaded yet") + "</small></div>" +
        (canUpload ? '<label class="btn btn-ghost btn-sm">' + (up ? "Replace" : "Upload") + '<input type="file" class="sr-only" data-upload="' + d.id + '" data-case="' + c.id + '"></label>' : "") + "</li>";
    }).join("") + "</ul>";
  }

  function listingCard(l, action) {
    var pr = listingProvider(l);
    return '<article class="stay' + (l.full ? " is-full" : "") + '">' +
      '<div class="stay-top"><span class="tag tag-sky">' + esc(l.type) + "</span>" + (l.full ? '<span class="tag tag-amber">Full</span>' : '<span class="small muted">From ' + esc(l.from) + "</span>") + "</div>" +
      "<h3>" + esc(l.title) + "</h3>" +
      '<p class="small muted">' + esc(pr.name) + " · " + esc(pr.city) + "</p>" +
      '<p class="stay-dist">' + U.PIN + esc(l.distance) + "</p>" +
      '<div class="stay-rent"><b>' + U.money(l.rent, l.currency) + "</b><span>a month · " + U.approx(l.rent, l.currency) + "</span></div>" +
      '<p class="stay-am">' + l.amenities.map(esc).join(" · ") + "</p>" +
      (action || "") + "</article>";
  }

  /* ================= STUDENT ================= */
  D.pages.student = function () {
    ui();
    var students = D.db.get().students;
    var sid = identity("student", students);
    var main = $("#portal");
    main.innerHTML = shell({ role: "My journey", current: sid, people: students.map(function (s) { return { id: s.id, label: s.name }; }) });
    bindAs("student");
    bindThreads();

    var render = keepDrafts(function () {
      var s = D.db.student(sid);
      var cases = D.db.cases({ studentId: sid });
      var cid = U.params().get("case");
      var c = cases.find(function (x) { return x.id === cid; }) || cases[0];
      document.title = "My journey · " + s.name + " · Abroadversity";
      var body = '<div class="p-hello"><div><p class="eyebrow">My journey</p><h1>Hi ' + esc(first(s.name)) + "</h1></div>" +
        (cases.length > 1 ? '<div class="p-switch" role="tablist" aria-label="Your applications">' + cases.map(function (x) {
          return '<button type="button" role="tab" aria-selected="' + (x === c) + '" data-case-pick="' + x.id + '">' + esc(prog(x).name) + "<small>" + esc(uniName(x)) + "</small></button>";
        }).join("") + "</div>" : "") + "</div>";
      if (!c) {
        $("#p-body").innerHTML = body + '<div class="empty"><h2>No applications yet</h2><p class="muted">Find a programme and check your eligibility. It lands here, with a counsellor to help.</p><a class="btn btn-primary" href="programmes.html">Find programmes</a></div>';
        return;
      }
      var p = prog(c), u = D.db.uniOfCase(c), co = U.countryOf(p), counsellor = D.db.counsellor(c.counsellorId);
      var bookings = D.db.bookings({ caseId: c.id });
      var confirmed = bookings.find(function (b) { return b.status === "confirmed"; });
      var pending = bookings.find(function (b) { return b.status === "requested"; });
      var miss = missingDocs(c);

      var next;
      if (c.stage === "closed") next = ["This application is closed", c.closedReason || "Your counsellor closed it.", ""];
      else if (c.uni.status === "rejected") next = [u.name + " declined this application", "It happens. " + first(counsellor.name) + " will suggest similar programmes that fit your profile.", ""];
      else if (c.stage === "new") next = [first(counsellor.name) + " will message you within a day", "Save time: upload your documents now, so the application is ready when you talk.", ""];
      else if (c.uni.status === "not-sent") next = miss.length ? ["Upload " + U.plural(miss.length, "document"), "Your counsellor sends the application once these are in.", ""] : ["Your application is being prepared", first(counsellor.name) + " will send it to " + u.name + " shortly.", ""];
      else if (c.uni.status !== "offer") next = [c.uni.status === "submitted" ? "Sent to " + u.name : u.name + " is reviewing your application", "Decisions usually take 2 to 4 weeks. We’ll tell you the moment it arrives.", ""];
      else if (!c.offerAccepted) next = ["You have an offer from " + u.name, c.uni.offerType === "conditional" ? "Condition: " + c.uni.condition + "." : "It is unconditional: no further conditions.", '<button type="button" class="btn btn-primary btn-lg" data-accept="' + c.id + '">Accept the offer</button>'];
      else if (c.stage === "enrolled") next = ["You’re all set for " + u.city, "Offer accepted, visa approved" + (confirmed ? ", room confirmed" : "") + ". Have a great journey!", ""];
      else if (!confirmed && !pending) next = ["Book a room near campus", "Rooms close to " + u.name + " are below. Your counsellor will also connect you with a visa consultant.", '<a class="btn btn-primary" href="#stay">See rooms</a>'];
      else if (!c.consultantId) next = ["Next: your visa", first(counsellor.name) + " will connect you with a visa consultant.", ""];
      else next = ["Your visa is in progress", D.db.consultant(c.consultantId).name + " is working on your file.", ""];

      var near = D.db.listingsNear(u.id).filter(function (l) { return !l.full; }).slice(0, 3);
      var stay = (c.uni.status === "offer" && c.stage !== "closed") ? '<section class="panel" id="stay"><div class="panel-head"><h3>Your stay in ' + esc(u.city) + '</h3><a class="small" href="stays.html?near=' + u.id + '">All stays →</a></div>' +
        (bookings.length ? '<ul class="bookings">' + bookings.map(function (b) {
          var l = D.db.listing(b.listingId);
          return "<li><div><b>" + esc(l.title) + "</b><small>" + esc(listingProvider(l).name) + " · move in " + esc(b.moveIn) + "</small></div>" + '<span class="chip-s chip-' + { requested: "warn", confirmed: "ok", declined: "bad" }[b.status] + '">' + { requested: "Waiting for the partner", confirmed: "Confirmed", declined: "Not available" }[b.status] + "</span></li>";
        }).join("") + "</ul>" : "") +
        (!confirmed && !pending ? (c.offerAccepted ? '<div class="stays">' + near.map(function (l) { return listingCard(l, '<button type="button" class="btn btn-dark btn-block" data-book="' + l.id + '">Request this room</button>'); }).join("") + "</div>" : '<p class="small muted">Accept your offer first, then request a room here.</p>') : "") +
        "</section>" : "";

      var visa = c.consultantId ? (function () {
        var k = D.db.consultant(c.consultantId);
        return '<section class="panel"><div class="panel-head"><h3>Visa</h3><span class="small muted">' + esc(k.name) + " · " + esc(k.person) + "</span></div>" +
          '<ul class="steps-check">' + D.VISA_STEPS.map(function (v) { return '<li class="' + (c.visa[v.id] ? "is-done" : "") + '"><i aria-hidden="true">' + (c.visa[v.id] ? U.CHECK : "") + "</i>" + esc(v.name) + (c.visa[v.id] ? "<small>" + ago(c.visa[v.id]) + "</small>" : "") + "</li>"; }).join("") + "</ul></section>";
      })() : "";

      $("#p-body").innerHTML = body +
        '<div class="p-case-head"><div><h2>' + esc(p.name) + '</h2><p class="muted">' + esc(u.name) + " · " + esc(u.city) + ", " + esc(co.name) + ' · <a href="programme.html?id=' + p.id + '">Programme page</a></p></div>' + pill(c.stage) + "</div>" +
        tracker(c) +
        '<div class="p-grid"><div class="p-main">' +
        '<section class="next-card"><p class="eyebrow">Next for you</p><h3>' + esc(next[0]) + "</h3><p>" + esc(next[1]) + "</p>" + next[2] + "</section>" +
        (c.uni.status === "offer" ? '<section class="panel offer-card"><div class="panel-head"><h3>Your offer</h3>' + (c.offerAccepted ? '<span class="chip-s chip-ok">Accepted</span>' : '<span class="chip-s chip-warn">Waiting for you</span>') + "</div>" +
          "<p><b>" + (c.uni.offerType === "conditional" ? "Conditional offer" : "Unconditional offer") + "</b> from " + esc(u.name) + " for " + esc(p.name) + ", made " + ago(c.uni.at) + ".</p>" +
          (c.uni.condition ? '<p class="small">Condition: ' + esc(c.uni.condition) + "</p>" : "") + "</section>" : "") +
        stay + visa +
        '<section class="panel"><div class="panel-head"><h3>Documents</h3><span class="small muted">' + (D.DOCS.length - miss.length) + " of " + D.DOCS.length + " uploaded</span></div>" + docList(c, c.stage !== "closed") + "</section>" +
        timeline(c) +
        "</div><aside class=\"p-side\">" +
        '<section class="panel person"><span class="avatar" aria-hidden="true">' + esc(U.initials(counsellor.name)) + "</span><div><small>Your counsellor</small><b>" + esc(counsellor.name) + "</b><span>" + esc(brandOf(c)) + ", " + esc(counsellor.city) + " · replies on WhatsApp</span></div></section>" +
        thread(c, "student", s.name) +
        "</aside></div>";
    });
    D.db.on(render);
    render();

    document.addEventListener("click", function (e) {
      var pick = e.target.closest("[data-case-pick]");
      if (pick) { go({ case: pick.dataset.casePick }); render(); return; }
      var acc = e.target.closest("[data-accept]");
      if (acc) { D.db.acceptOffer(acc.dataset.accept); U.toast("Offer accepted"); return; }
      var book = e.target.closest("[data-book]");
      if (book) {
        var c = D.db.cases({ studentId: sid }).find(function (x) { return x.id === (U.params().get("case") || x.id); });
        D.db.requestBooking(sid, book.dataset.book, c && c.id);
        U.toast("Room requested. The partner will confirm.");
      }
    });
    document.addEventListener("change", function (e) {
      var up = e.target.closest("[data-upload]");
      if (!up || !up.files.length) return;
      D.db.uploadDoc(up.dataset.case, up.dataset.upload, up.files[0].name);
      U.toast("Uploaded " + up.files[0].name);
    });
  };

  /* ================= COUNSELLOR ================= */
  D.pages.counsellor = function () {
    ui();
    var cid = identity("counsellor", D.COUNSELLORS);
    var me = D.db.counsellor(cid);
    $("#portal").innerHTML = shell({ role: "Counsellor desk", current: cid, people: D.COUNSELLORS.map(function (x) { return { id: x.id, label: counsellorLabel(x) }; }) });
    bindAs("counsellor");
    bindThreads();
    document.title = "Counsellor desk · Abroadversity";

    var TEMPLATE = function (c) {
      var s = D.db.student(c.studentId), p = prog(c);
      return "Hi " + first(s.name) + ", " + me.name + " from " + brandOf(c) + ". " + (c.agencyId ? "Following up on " : "Thanks for checking ") + p.name + " at " + uniName(c) + ". " +
        (c.eligibility.result === "good" ? "Your profile meets the requirements. " : "You’re close; let’s look at the details together. ") +
        (missingDocs(c).length ? "Could you upload your " + missingDocs(c).map(function (d) { return d.short; }).join(", ") + " on your dashboard? Then I’ll prepare the application." : "Your documents are all in, so I’ll prepare the application today.");
    };

    var render = keepDrafts(function () {
      var q = U.params();
      var scope = q.get("scope") || "mine", stage = q.get("stage") || "active";
      // "Whole team" is the counsellor's own organisation: Abroadversity, or their partner agency.
      var all = D.db.cases(scope === "mine" ? { counsellorId: cid } : { agencyId: me.agencyId || null });
      var byStage = function (st) { return all.filter(function (c) { return st === "active" ? c.stage !== "closed" && c.stage !== "enrolled" : c.stage === st; }); };
      var list = byStage(stage).sort(function (a, b) { return (a.waitingSince ? 0 : 1) - (b.waitingSince ? 0 : 1) || (a.waitingSince || "").localeCompare(b.waitingSince || "") || b.updatedAt.localeCompare(a.updatedAt); });
      var sel = D.db.kase(q.get("case")) || list[0];
      var late = all.filter(function (c) { return c.waitingSince && Date.now() - new Date(c.waitingSince) > 24 * 3600e3; }).length;

      var html = '<div class="p-hello"><div><p class="eyebrow">Leads inbox' + (me.agencyId ? " · " + esc(D.db.agency(me.agencyId).name) : "") + '</p><h1>Good to see you, ' + esc(first(me.name)) + "</h1></div>" +
        '<div class="seg" role="group" aria-label="Whose leads"><button type="button" data-scope="mine" aria-pressed="' + (scope === "mine") + '">My leads</button><button type="button" data-scope="all" aria-pressed="' + (scope === "all") + '">Whole team</button></div></div>' +
        stats([
          { n: byStage("new").length, label: "New leads" },
          { n: late, label: "Waiting over 24h", alert: late > 0 },
          { n: byStage("applied").length, label: "With universities" },
          { n: byStage("offer").length, label: "Offers" },
          { n: byStage("enrolled").length, label: "Enrolled" },
        ]) +
        '<div class="p-tabs" role="tablist" aria-label="Stage">' + [{ id: "active", name: "All open" }].concat(D.STAGES).map(function (st) {
          return '<button type="button" role="tab" aria-selected="' + (st.id === stage) + '" data-stage="' + st.id + '">' + st.name + "<em>" + byStage(st.id).length + "</em></button>";
        }).join("") + "</div>";

      html += '<div class="p-split"><div class="p-list" role="list">' + (list.length ? list.map(function (c) {
        var s = D.db.student(c.studentId), p = prog(c);
        var late_ = c.waitingSince && Date.now() - new Date(c.waitingSince) > 24 * 3600e3;
        return '<button type="button" role="listitem" class="p-row' + (sel && c.id === sel.id ? " is-on" : "") + '" data-open="' + c.id + '">' +
          '<span class="p-row-top"><b>' + esc(s.name) + "</b>" + pill(c.stage) + "</span>" +
          '<span class="p-row-sub">' + esc(p.name) + " · " + esc(uniName(c)) + "</span>" +
          '<span class="p-row-foot">' + resultChip(c.eligibility.result) + (c.waitingSince ? '<span class="wait' + (late_ ? " is-late" : "") + '">Waiting ' + waited(c.waitingSince) + "</span>" : '<span class="small muted">' + ago(c.updatedAt) + "</span>") +
          (scope === "all" ? '<span class="small muted">' + esc(first(D.db.counsellor(c.counsellorId).name)) + "</span>" : "") + "</span></button>";
      }).join("") : '<p class="empty-s">Nothing here.</p>') + "</div>";

      if (sel) html += '<div class="p-detail">' + counsellorDetail(sel) + "</div>";
      html += "</div>";
      $("#p-body").innerHTML = html;
    });

    function counsellorDetail(c) {
      var s = D.db.student(c.studentId), p = prog(c), u = D.db.uniOfCase(c), co = U.countryOf(p);
      var miss = missingDocs(c);
      var bookings = D.db.bookings({ caseId: c.id });
      var act = "";
      if (c.stage === "new") act = '<p class="small">Send the first WhatsApp. The lead moves to Contacted.</p><label class="sr-only" for="wa-' + c.id + '">WhatsApp message</label><textarea class="input" id="wa-' + c.id + '" rows="4" data-keep>' + esc(TEMPLATE(c)) + '</textarea><button type="button" class="btn btn-primary" data-contact="' + c.id + '">Send WhatsApp and mark contacted</button>';
      else if (c.stage === "contacted") act = (miss.length ? '<p class="small"><b>' + U.plural(miss.length, "document") + " missing:</b> " + miss.map(function (d) { return esc(d.short); }).join(", ") + '.</p><div class="chips"><button type="button" class="btn btn-ghost" data-nudge-docs="' + c.id + '">Ask for missing documents</button><button type="button" class="btn btn-dark" data-submit="' + c.id + '">Submit anyway</button></div>' : '<p class="small">All documents are in. Send the application to ' + esc(u.name) + '.</p><button type="button" class="btn btn-primary" data-submit="' + c.id + '">Submit application to ' + esc(u.name) + "</button>");
      else if (c.stage === "applied") act = c.uni.status === "rejected" ? '<p class="small">' + esc(u.name) + " declined" + (c.uni.note ? ": " + esc(c.uni.note) : "") + '. Suggest a similar programme to the student, or close the lead.</p><a class="btn btn-ghost" href="programmes.html?subject=' + p.subject + "&level=" + p.level + '">Find similar programmes</a>' : '<p class="small">With ' + esc(u.name) + ": <b>" + UNI_STATUS[c.uni.status] + "</b> since " + ago(c.uni.at) + ".</p>";
      else if (c.stage === "offer") act = !c.offerAccepted ? '<p class="small">' + (c.uni.offerType === "conditional" ? "Conditional offer: " + esc(c.uni.condition) : "Unconditional offer") + ". Waiting for " + esc(first(s.name)) + ' to accept.</p><button type="button" class="btn btn-ghost" data-nudge-offer="' + c.id + '">Remind ' + esc(first(s.name)) + "</button>" :
        '<p class="small">Offer accepted. Refer ' + esc(first(s.name)) + ' to a visa consultant for ' + esc(co.name) + '.</p><div class="row-form"><label class="sr-only" for="k-' + c.id + '">Consultant</label><select class="select" id="k-' + c.id + '">' +
        D.CONSULTANTS.slice().sort(function (a, b) { return (b.countries.indexOf(co.id) >= 0) - (a.countries.indexOf(co.id) >= 0); }).map(function (k) { return '<option value="' + k.id + '">' + esc(k.name) + " · " + esc(k.city) + (k.countries.indexOf(co.id) >= 0 ? " · handles " + esc(co.name) : "") + "</option>"; }).join("") +
        '</select><button type="button" class="btn btn-primary" data-refer="' + c.id + '">Refer for visa</button></div>';
      else if (c.stage === "visa") act = c.visa.approved ? '<p class="small">Visa approved' + (bookings.some(function (b) { return b.status === "confirmed"; }) ? " and room confirmed" : "") + '. Mark the student as enrolled.</p><button type="button" class="btn btn-primary" data-enrol="' + c.id + '">Mark enrolled</button>' : '<p class="small">' + esc(D.db.consultant(c.consultantId).name) + " has " + D.VISA_STEPS.filter(function (v) { return c.visa[v.id]; }).length + " of " + D.VISA_STEPS.length + " visa steps done.</p>";
      else if (c.stage === "enrolled") act = '<p class="small">Enrolled. Nothing left to do.</p>';
      else act = '<p class="small">Closed: ' + esc(c.closedReason) + '</p><button type="button" class="btn btn-ghost" data-reopen="' + c.id + '">Reopen</button>';

      return '<div class="d-head"><div><h2>' + esc(s.name) + '</h2><p class="small muted">' + esc(s.phone) + (s.city ? " · " + esc(s.city) : "") + " · lead " + ago(c.createdAt) + "</p></div>" + pill(c.stage) + "</div>" +
        '<p class="d-prog"><a href="programme.html?id=' + p.id + '">' + esc(p.name) + "</a> · " + esc(u.name) + ", " + esc(co.name) + " · next intake " + U.intakeLabel(c.eligibility.intake || p.intakes[0]) + "</p>" +
        '<section class="next-card"><p class="eyebrow">Next step</p>' + act + "</section>" +
        '<section class="panel"><div class="panel-head"><h3>Eligibility answers</h3>' + resultChip(c.eligibility.result) + "</div>" + eligibilityTable(c) + "</section>" +
        '<section class="panel"><div class="panel-head"><h3>Documents</h3><span class="small muted">' + (D.DOCS.length - miss.length) + " of " + D.DOCS.length + "</span></div>" + docList(c, false) + "</section>" +
        (bookings.length ? '<section class="panel"><div class="panel-head"><h3>Stay</h3></div><ul class="bookings">' + bookings.map(function (b) { var l = D.db.listing(b.listingId); return "<li><div><b>" + esc(l.title) + "</b><small>" + esc(listingProvider(l).name) + "</small></div>" + '<span class="chip-s chip-' + { requested: "warn", confirmed: "ok", declined: "bad" }[b.status] + '">' + b.status + "</span></li>"; }).join("") + "</ul></section>" : "") +
        thread(c, "counsellor", me.name) +
        timeline(c) +
        (c.stage !== "closed" && c.stage !== "enrolled" ? '<section class="panel close-lead"><div class="row-form"><label class="sr-only" for="why-' + c.id + '">Reason</label><select class="select" id="why-' + c.id + '"><option>Not reachable</option><option>Chose another programme</option><option>Not eligible this year</option><option>Studying in India instead</option></select><button type="button" class="btn btn-ghost" data-close-lead="' + c.id + '">Close lead</button></div></section>' : "");
    }

    D.db.on(render);
    render();
    document.addEventListener("click", function (e) {
      var t;
      if ((t = e.target.closest("[data-scope]"))) { go({ scope: t.dataset.scope, case: null }); render(); return; }
      if ((t = e.target.closest("[data-stage]"))) { go({ stage: t.dataset.stage, case: null }); render(); return; }
      if ((t = e.target.closest("[data-open]"))) { go({ case: t.dataset.open }); render(); if (window.innerWidth < 900) $(".p-detail").scrollIntoView({ behavior: "smooth" }); return; }
      if ((t = e.target.closest("[data-contact]"))) { var box = $("#wa-" + t.dataset.contact); D.db.contact(t.dataset.contact, box ? box.value.trim() : ""); U.toast("Sent on WhatsApp. Lead marked contacted."); return; }
      if ((t = e.target.closest("[data-submit]"))) { D.db.submitToUni(t.dataset.submit); U.toast("Application sent to the university"); return; }
      if ((t = e.target.closest("[data-nudge-docs]"))) {
        var c = D.db.kase(t.dataset.nudgeDocs);
        D.db.message(c.id, "counsellor", me.name, "Hi " + first(D.db.student(c.studentId).name) + ", still need: " + missingDocs(c).map(function (d) { return d.short; }).join(", ") + ". Upload them on your dashboard and I’ll send the application.");
        U.toast("Reminder sent"); return;
      }
      if ((t = e.target.closest("[data-nudge-offer]"))) { var k = D.db.kase(t.dataset.nudgeOffer); D.db.message(k.id, "counsellor", me.name, "Hi " + first(D.db.student(k.studentId).name) + ", a reminder to accept your offer on your dashboard. Rooms near campus go fast."); U.toast("Reminder sent"); return; }
      if ((t = e.target.closest("[data-refer]"))) { D.db.referConsultant(t.dataset.refer, $("#k-" + t.dataset.refer).value); U.toast("Referred for the visa"); return; }
      if ((t = e.target.closest("[data-enrol]"))) { D.db.enrol(t.dataset.enrol); U.toast("Marked enrolled"); return; }
      if ((t = e.target.closest("[data-reopen]"))) { D.db.reopen(t.dataset.reopen); return; }
      if ((t = e.target.closest("[data-close-lead]"))) { D.db.close(t.dataset.closeLead, $("#why-" + t.dataset.closeLead).value); U.toast("Lead closed"); }
    });
  };

  /* ================= UNIVERSITY ================= */
  D.pages.university = function () {
    ui();
    var unis = D.UNIVERSITIES.slice().sort(function (a, b) { return a.name.localeCompare(b.name); });
    var uid = identity("university", unis, "toronto");
    var u = U.byId(D.UNIVERSITIES, uid);
    $("#portal").innerHTML = shell({ role: "Admissions portal", current: uid, people: unis.map(function (x) { return { id: x.id, label: x.name }; }) });
    bindAs("university");
    document.title = "Admissions · " + u.name + " · Abroadversity";
    var programmes = D.PROGRAMMES.filter(function (p) { return p.uni === uid; });

    var render = keepDrafts(function () {
      var q = U.params(), tab = q.get("tab") || "apps";
      var apps = D.db.cases({ uni: uid });
      var sel = D.db.kase(q.get("case"));
      if (!sel || apps.indexOf(sel) < 0) sel = apps[0];
      var html = '<div class="p-hello"><div><p class="eyebrow">Admissions · ' + esc(u.city) + "</p><h1>" + esc(u.name) + "</h1></div></div>" +
        stats([
          { n: apps.filter(function (c) { return c.uni.status === "submitted"; }).length, label: "New applications", alert: apps.some(function (c) { return c.uni.status === "submitted"; }) },
          { n: apps.filter(function (c) { return c.uni.status === "under-review"; }).length, label: "In review" },
          { n: apps.filter(function (c) { return c.uni.status === "offer"; }).length, label: "Offers made" },
          { n: apps.filter(function (c) { return c.offerAccepted; }).length, label: "Offers accepted" },
        ]) +
        '<div class="p-tabs" role="tablist"><button type="button" role="tab" data-tab="apps" aria-selected="' + (tab === "apps") + '">Applications<em>' + apps.length + '</em></button><button type="button" role="tab" data-tab="progs" aria-selected="' + (tab === "progs") + '">Programmes<em>' + programmes.length + "</em></button></div>";

      if (tab === "progs") {
        html += '<section class="panel"><div class="panel-head"><h3>Your programmes on Abroadversity</h3><span class="small muted">Changes show on the website straight away</span></div><div class="table-wrap"><table class="p-table progs"><thead><tr><th>Programme</th><th>Tuition a year</th><th>Intakes</th><th>Applications</th><th>Verified</th><th><span class="sr-only">Actions</span></th></tr></thead><tbody>' +
          programmes.map(function (p) {
            var cur = U.countryOf(p).currency;
            return '<tr><td><b>' + esc(p.name) + "</b><small>" + esc(U.levelName(p.level)) + " · " + U.plural(p.years, "year") + '</small></td><td><label class="money-in"><span>' + cur + '</span><input class="input" type="number" min="0" step="100" id="fee-' + p.id + '" value="' + p.fee + '" data-keep aria-label="Tuition for ' + esc(p.name) + '"></label></td><td>' + p.intakes.map(U.intakeLabel).join(", ") +
              '</td><td><label class="switch"><input type="checkbox" id="open-' + p.id + '"' + (p.closed ? "" : " checked") + '><span>' + (p.closed ? "Paused" : "Open") + "</span></label></td><td>" + (p.verified ? ago(p.verified) : '<span class="muted">Not yet</span>') +
              '</td><td class="t-actions"><button type="button" class="btn btn-dark btn-sm" data-save-prog="' + p.id + '">Save</button><a class="btn-link small" href="programme.html?id=' + p.id + '">View</a></td></tr>';
          }).join("") + "</tbody></table></div></section>";
      } else {
        html += '<div class="p-split"><div class="p-list" role="list">' + (apps.length ? apps.map(function (c) {
          var s = D.db.student(c.studentId), p = prog(c);
          return '<button type="button" role="listitem" class="p-row' + (c === sel ? " is-on" : "") + '" data-open="' + c.id + '"><span class="p-row-top"><b>' + esc(s.name) + '</b><span class="chip-s chip-' + ({ submitted: "warn", "under-review": "sky", offer: "ok", rejected: "bad" }[c.uni.status] || "sky") + '">' + UNI_STATUS[c.uni.status] + '</span></span><span class="p-row-sub">' + esc(p.name) + '</span><span class="p-row-foot"><span class="small muted">Via Abroadversity' + (c.agencyId ? " · " + esc(brandOf(c)) : "") + " · " + ago(c.uni.at) + "</span></span></button>";
        }).join("") : '<p class="empty-s">No applications yet. When a counsellor submits one, it appears here.</p>') + "</div>";
        if (sel) html += '<div class="p-detail">' + uniDetail(sel) + "</div>";
        html += "</div>";
      }
      $("#p-body").innerHTML = html;
    });

    function uniDetail(c) {
      var s = D.db.student(c.studentId), p = prog(c), counsellor = D.db.counsellor(c.counsellorId);
      var st = c.uni.status, act;
      if (st === "submitted" || st === "under-review") {
        act = (st === "submitted" ? '<button type="button" class="btn btn-ghost" data-review="' + c.id + '">Start review</button>' : "") +
          '<fieldset class="decide"><legend>Decision</legend>' +
          '<label class="radio"><input type="radio" name="dec-' + c.id + '" value="unconditional" checked> Unconditional offer</label>' +
          '<label class="radio"><input type="radio" name="dec-' + c.id + '" value="conditional"> Conditional offer</label>' +
          '<label class="radio"><input type="radio" name="dec-' + c.id + '" value="reject"> Decline</label>' +
          '<label class="sr-only" for="note-' + c.id + '">Condition or reason</label><input class="input" id="note-' + c.id + '" data-keep placeholder="Condition or reason, e.g. Final degree result of 65% or above">' +
          '<button type="button" class="btn btn-primary" data-decide="' + c.id + '">Send decision</button></fieldset>';
      } else if (st === "offer") act = "<p><b>" + (c.uni.offerType === "conditional" ? "Conditional offer" : "Unconditional offer") + "</b> sent " + ago(c.uni.at) + (c.uni.condition ? ". Condition: " + esc(c.uni.condition) : "") + ".</p><p class=\"small\">" + (c.offerAccepted ? "Accepted by the student." : "Waiting for the student to accept.") + "</p>";
      else act = "<p>Declined " + ago(c.uni.at) + (c.uni.note ? ": " + esc(c.uni.note) : "") + ".</p>";
      return '<div class="d-head"><div><h2>' + esc(s.name) + '</h2><p class="small muted">' + esc(p.name) + " · applying for " + U.intakeLabel(c.eligibility.intake || p.intakes[0]) + "</p></div>" + '<span class="chip-s chip-sky">' + UNI_STATUS[st] + "</span></div>" +
        '<section class="next-card"><p class="eyebrow">Your decision</p>' + act + "</section>" +
        '<section class="panel"><div class="panel-head"><h3>Applicant against your requirements</h3></div>' + eligibilityTable(c) + "</section>" +
        '<section class="panel"><div class="panel-head"><h3>Documents</h3></div>' + docList(c, false) + "</section>" +
        '<section class="panel person"><span class="avatar" aria-hidden="true">' + esc(U.initials(counsellor.name)) + "</span><div><small>" + (c.agencyId ? esc(brandOf(c)) + ", an Abroadversity partner" : "Abroadversity counsellor") + "</small><b>" + esc(counsellor.name) + "</b><span>Questions about this applicant go to the counsellor</span></div></section>";
    }

    D.db.on(render);
    render();
    document.addEventListener("click", function (e) {
      var t;
      if ((t = e.target.closest("[data-tab]"))) { go({ tab: t.dataset.tab }); render(); return; }
      if ((t = e.target.closest("[data-open]"))) { go({ case: t.dataset.open }); render(); return; }
      if ((t = e.target.closest("[data-review]"))) { D.db.review(t.dataset.review); return; }
      if ((t = e.target.closest("[data-decide]"))) {
        var id = t.dataset.decide, dec = $('input[name="dec-' + id + '"]:checked').value, note = $("#note-" + id).value.trim();
        if (dec === "conditional" && !note) { $("#note-" + id).focus(); U.toast("Write the condition first"); return; }
        D.db.decide(id, dec, note);
        U.toast(dec === "reject" ? "Decision sent" : "Offer sent to the student and counsellor");
        return;
      }
      if ((t = e.target.closest("[data-save-prog]"))) {
        var pid = t.dataset.saveProg, fee = Number($("#fee-" + pid).value);
        if (!fee || fee < 0) { $("#fee-" + pid).focus(); U.toast("Enter a tuition fee"); return; }
        D.db.setProgramme(pid, { fee: fee, closed: !$("#open-" + pid).checked });
        U.toast("Saved. The website shows the new details.");
      }
    });
    document.addEventListener("change", function (e) { if (e.target.closest(".switch input")) e.target.nextElementSibling.textContent = e.target.checked ? "Open" : "Paused"; });
  };

  /* ================= VISA CONSULTANT ================= */
  D.pages.consultant = function () {
    ui();
    var kid = identity("consultant", D.CONSULTANTS);
    var k = D.db.consultant(kid);
    $("#portal").innerHTML = shell({ role: "Visa partner", current: kid, people: D.CONSULTANTS.map(function (x) { return { id: x.id, label: x.name + " · " + x.city }; }) });
    bindAs("consultant");
    bindThreads();
    document.title = "Visa files · " + k.name + " · Abroadversity";

    var render = keepDrafts(function () {
      var files = D.db.cases({ consultantId: kid });
      var sel = D.db.kase(U.params().get("case"));
      if (!sel || files.indexOf(sel) < 0) sel = files[0];
      var approved = files.filter(function (c) { return c.visa.approved; }).length;
      var html = '<div class="p-hello"><div><p class="eyebrow">Visa partner · ' + esc(k.city) + "</p><h1>" + esc(k.name) + '</h1><p class="muted">' + esc(k.person) + " · handles " + k.countries.map(function (id) { return U.byId(D.COUNTRIES, id).name; }).join(", ") + "</p></div></div>" +
        stats([
          { n: files.length - approved, label: "Open visa files" },
          { n: approved, label: "Visas approved" },
          { n: U.rupees(approved * k.fee / 100000), label: "Fees earned (sample)" },
          { n: k.rating + " ★", label: "Student rating" },
        ]) +
        '<div class="p-split"><div class="p-list" role="list">' + (files.length ? files.map(function (c) {
          var s = D.db.student(c.studentId), co = countryOfCase(c), done = D.VISA_STEPS.filter(function (v) { return c.visa[v.id]; }).length;
          return '<button type="button" role="listitem" class="p-row' + (c === sel ? " is-on" : "") + '" data-open="' + c.id + '"><span class="p-row-top"><b>' + esc(s.name) + "</b>" + U.flag(co, "mini-flag") + '</span><span class="p-row-sub">' + esc(uniName(c)) + '</span><span class="p-row-foot"><span class="meter" aria-label="' + done + " of " + D.VISA_STEPS.length + ' steps"><i style="width:' + (done / D.VISA_STEPS.length * 100) + '%"></i></span><span class="small muted">' + done + "/" + D.VISA_STEPS.length + "</span></span></button>";
        }).join("") : '<p class="empty-s">No visa files yet. Counsellors refer students here once they accept an offer.</p>') + "</div>";
        if (sel) html += '<div class="p-detail">' + fileDetail(sel) + "</div>";
      $("#p-body").innerHTML = html + "</div>";
    });

    function fileDetail(c) {
      var s = D.db.student(c.studentId), p = prog(c), co = countryOfCase(c), u = D.db.uniOfCase(c);
      var room = D.db.bookings({ caseId: c.id }).find(function (b) { return b.status === "confirmed"; });
      return '<div class="d-head"><div><h2>' + esc(s.name) + '</h2><p class="small muted">' + esc(s.phone) + " · " + esc(co.name) + " student visa</p></div>" + U.flag(co, "mini-flag") + "</div>" +
        '<section class="panel"><div class="panel-head"><h3>Visa checklist</h3><span class="small muted">The student and counsellor see each step</span></div><ul class="steps-check is-edit">' +
        D.VISA_STEPS.map(function (v) {
          return '<li class="' + (c.visa[v.id] ? "is-done" : "") + '"><label><input type="checkbox" data-step="' + v.id + '" data-case="' + c.id + '"' + (c.visa[v.id] ? " checked" : "") + "> " + esc(v.name) + "</label>" + (c.visa[v.id] ? "<small>" + ago(c.visa[v.id]) + "</small>" : "") + "</li>";
        }).join("") + "</ul></section>" +
        '<section class="panel"><div class="panel-head"><h3>For the visa file</h3></div><dl class="facts">' +
        "<div><dt>Offer</dt><dd>" + (c.uni.offerType === "conditional" ? "Conditional" : "Unconditional") + ", " + esc(p.name) + ", " + esc(u.name) + "</dd></div>" +
        "<div><dt>Course starts</dt><dd>" + U.intakeLabel(c.eligibility.intake || p.intakes[0]) + "</dd></div>" +
        "<div><dt>Funds for year one</dt><dd>" + U.money(p.fee + co.living, co.currency) + " · " + U.approx(p.fee + co.living, co.currency) + "</dd></div>" +
        "<div><dt>Address abroad</dt><dd>" + (room ? esc(D.db.listing(room.listingId).title) + ", " + esc(u.city) : "Room not confirmed yet") + "</dd></div>" +
        "</dl>" +
        '<ol class="steps-line">' + co.visa.map(function (v) { return "<li>" + esc(v) + "</li>"; }).join("") + "</ol></section>" +
        thread(c, "consultant", k.person) +
        timeline(c);
    }

    D.db.on(render);
    render();
    document.addEventListener("click", function (e) { var t = e.target.closest("[data-open]"); if (t) { go({ case: t.dataset.open }); render(); } });
    document.addEventListener("change", function (e) {
      var t = e.target.closest("[data-step]");
      if (!t) return;
      D.db.visaStep(t.dataset.case, t.dataset.step, t.checked);
      if (t.checked && t.dataset.step === "approved") U.toast("Visa approved. The counsellor can mark the student enrolled.");
    });
  };

  /* ================= STAYS PARTNER ================= */
  D.pages.partner = function () {
    ui();
    var pid = identity("partner", D.PROVIDERS);
    var pr = D.db.provider(pid);
    $("#portal").innerHTML = shell({ role: "Stays partner", current: pid, people: D.PROVIDERS.map(function (x) { return { id: x.id, label: x.name + " · " + x.city }; }) });
    bindAs("partner");
    document.title = "Bookings · " + pr.name + " · Abroadversity";
    var mine = D.LISTINGS.filter(function (l) { return l.provider === pid; });

    var render = keepDrafts(function () {
      var tab = U.params().get("tab") || "requests";
      var bookings = D.db.bookings({ provider: pid });
      var waiting = bookings.filter(function (b) { return b.status === "requested"; });
      var html = '<div class="p-hello"><div><p class="eyebrow">Stays partner · ' + esc(pr.city) + "</p><h1>" + esc(pr.name) + "</h1></div></div>" +
        stats([
          { n: waiting.length, label: "Requests to answer", alert: waiting.length > 0 },
          { n: bookings.filter(function (b) { return b.status === "confirmed"; }).length, label: "Confirmed bookings" },
          { n: mine.filter(function (l) { return !l.full; }).length + " / " + mine.length, label: "Rooms open" },
        ]) +
        '<div class="p-tabs" role="tablist"><button type="button" role="tab" data-tab="requests" aria-selected="' + (tab === "requests") + '">Booking requests<em>' + bookings.length + '</em></button><button type="button" role="tab" data-tab="rooms" aria-selected="' + (tab === "rooms") + '">Rooms<em>' + mine.length + "</em></button></div>";
      if (tab === "rooms") {
        html += '<div class="stays">' + mine.map(function (l) {
          return listingCard(l, '<div class="row-form"><label class="money-in"><span>' + l.currency + '</span><input class="input" type="number" min="0" step="10" id="rent-' + l.id + '" value="' + l.rent + '" data-keep aria-label="Monthly rent"></label>' +
            '<label class="switch"><input type="checkbox" id="full-' + l.id + '"' + (l.full ? "" : " checked") + "><span>" + (l.full ? "Full" : "Available") + "</span></label></div>" +
            '<button type="button" class="btn btn-dark btn-block" data-save-room="' + l.id + '">Save</button>');
        }).join("") + "</div>";
      } else {
        html += bookings.length ? '<div class="req-list">' + bookings.map(function (b) {
          var l = D.db.listing(b.listingId), s = D.db.student(b.studentId), c = b.caseId && D.db.kase(b.caseId);
          return '<article class="panel req-item"><div><b>' + esc(s.name) + '</b><p class="small muted">' + esc(l.title) + " · move in " + esc(b.moveIn) + " · " + ago(b.at) + "</p>" +
            (c ? '<p class="small">' + esc(prog(c).name) + " at " + esc(uniName(c)) + (c.uni.status === "offer" ? ' · <span class="chip-s chip-ok">Offer ' + (c.offerAccepted ? "accepted" : "made") + "</span>" : "") + "</p>" : '<p class="small muted">No university offer linked yet</p>') + "</div>" +
            (b.status === "requested" ? '<div class="chips"><button type="button" class="btn btn-ghost" data-decline="' + b.id + '">Decline</button><button type="button" class="btn btn-primary" data-confirm="' + b.id + '">Confirm room</button></div>' : '<span class="chip-s chip-' + (b.status === "confirmed" ? "ok" : "bad") + '">' + (b.status === "confirmed" ? "Confirmed" : "Declined") + "</span>") + "</article>";
        }).join("") + "</div>" : '<div class="empty"><h2>No requests yet</h2><p class="muted">Students request rooms from their dashboard or the Stays page.</p></div>';
      }
      $("#p-body").innerHTML = html;
    });
    D.db.on(render);
    render();
    document.addEventListener("click", function (e) {
      var t;
      if ((t = e.target.closest("[data-tab]"))) { go({ tab: t.dataset.tab }); render(); return; }
      if ((t = e.target.closest("[data-confirm]"))) { D.db.decideBooking(t.dataset.confirm, "confirmed"); U.toast("Room confirmed. The student sees it now."); return; }
      if ((t = e.target.closest("[data-decline]"))) { D.db.decideBooking(t.dataset.decline, "declined"); return; }
      if ((t = e.target.closest("[data-save-room]"))) {
        var id = t.dataset.saveRoom, rent = Number($("#rent-" + id).value);
        if (!rent) { $("#rent-" + id).focus(); return; }
        D.db.setListing(id, { rent: rent, full: !$("#full-" + id).checked });
        U.toast("Saved. The Stays page shows it now.");
      }
    });
    document.addEventListener("change", function (e) { if (e.target.closest(".switch input")) e.target.nextElementSibling.textContent = e.target.checked ? "Available" : "Full"; });
  };

  /* ================= PARTNER AGENCY ================= */
  // A local consultancy on Abroadversity: its own students and counsellor, our catalogue,
  // university submissions, visa and stays partners, and a share of what each student earns.
  D.pages.agency = function () {
    ui();
    var gid = identity("agency", D.AGENCIES);
    var ag = D.db.agency(gid), counsellor = D.db.counsellor(ag.counsellorId);
    $("#portal").innerHTML = shell({ role: "Partner agency", current: gid, people: D.AGENCIES.map(function (x) { return { id: x.id, label: x.name + " · " + x.city }; }) });
    bindAs("agency");
    document.title = "Partner agency · " + ag.name + " · Abroadversity";

    var EARN_STATUS = { expected: ["Expected", "sky"], due: ["Due", "warn"], processing: ["In payout", "sky"], paid: ["Paid", "ok"], none: ["No commission", "bad"] };
    function earnChip(st) { var x = EARN_STATUS[st]; return '<span class="chip-s chip-' + x[1] + '">' + x[0] + "</span>"; }
    function sum(rows, st) { return rows.filter(function (r) { return !st || st.indexOf(r.status) >= 0; }).reduce(function (n, r) { return n + r.amount; }, 0); }
    // Money owed is shown to the rupee (rounded to ₹100), not to the nearest thousand.
    function inr(l) {
      if (!(l > 0)) return "₹0";
      return l >= 1 ? "₹" + (Math.round(l * 100) / 100).toFixed(2) + " L" : "₹" + (Math.round(l * 1000) * 100).toLocaleString("en-IN");
    }
    function share(p) { var l = D.db.commissionLakh(p); return l > 0 ? "≈ " + inr(l) : "No commission"; }

    // One line on where a student stands, from the agency's side.
    function standing(c) {
      var u = D.db.uniOfCase(c), s = D.db.student(c.studentId), miss = missingDocs(c);
      if (c.stage === "closed") return "Closed: " + c.closedReason;
      if (c.stage === "new") return first(counsellor.name) + " to send the first WhatsApp";
      if (c.stage === "contacted") return miss.length ? "Waiting for " + U.plural(miss.length, "document") + " from " + first(s.name) : "Ready to submit to " + u.name;
      if (c.stage === "applied") return c.uni.status === "rejected" ? u.name + " declined" : "With " + u.name + ": " + UNI_STATUS[c.uni.status].toLowerCase();
      if (c.stage === "offer") return c.offerAccepted ? "Offer accepted: refer for the visa" : "Offer made: waiting for " + first(s.name) + " to accept";
      if (c.stage === "visa") return "Visa: " + D.VISA_STEPS.filter(function (v) { return c.visa[v.id]; }).length + " of " + D.VISA_STEPS.length + " steps done with " + D.db.consultant(c.consultantId).name;
      return "Enrolled at " + u.name;
    }

    var render = keepDrafts(function () {
      var q = U.params(), tab = q.get("tab") || "students";
      var cases = D.db.cases({ agencyId: gid });
      var open = cases.filter(function (c) { return c.stage !== "closed" && c.stage !== "enrolled"; });
      var rows = D.db.earnings(gid);
      var html = '<div class="p-hello"><div><p class="eyebrow">Partner agency · ' + esc(ag.city) + "</p><h1>" + esc(ag.name) + '</h1><p class="muted">Your students and your counsellor (' + esc(counsellor.name) + "), on Abroadversity’s programmes, universities, visa and stays partners.</p></div>" +
        '<button type="button" class="btn btn-primary" data-tab="add">Add a student</button></div>' +
        stats([
          { n: open.length, label: "Students in progress" },
          { n: cases.filter(function (c) { return c.stage === "applied"; }).length, label: "With universities" },
          { n: cases.filter(function (c) { return c.offerAccepted; }).length, label: "Offers accepted" },
          { n: cases.filter(function (c) { return c.stage === "enrolled"; }).length, label: "Enrolled" },
          { n: inr(sum(rows, ["paid"])), label: "Paid to you" },
          { n: inr(sum(rows, ["due"])), label: "Due now", alert: sum(rows, ["due"]) > 0 },
        ]) +
        '<div class="p-tabs" role="tablist" aria-label="Agency">' +
        '<button type="button" role="tab" data-tab="students" aria-selected="' + (tab === "students") + '">Students<em>' + cases.length + "</em></button>" +
        '<button type="button" role="tab" data-tab="add" aria-selected="' + (tab === "add") + '">Add a student</button>' +
        '<button type="button" role="tab" data-tab="earnings" aria-selected="' + (tab === "earnings") + '">Earnings<em>' + inr(sum(rows, ["due", "expected"])) + "</em></button></div>";

      if (tab === "add") html += addForm();
      else if (tab === "earnings") html += earnings(rows);
      else html += students(cases, rows);
      $("#p-body").innerHTML = html;
    });
    // The summary reads the form, so it is drawn after any typed values are put back.
    var draw = function () { render(); if ($("#add-form")) summarise(); };

    /* ----- students ----- */
    function students(cases, rows) {
      var sel = D.db.kase(U.params().get("case"));
      if (!sel || cases.indexOf(sel) < 0) sel = cases[0];
      if (!cases.length) return '<div class="empty"><h2>No students yet</h2><p class="muted">Add your first student. ' + esc(first(counsellor.name)) + ' gets them on the counsellor desk straight away.</p><button type="button" class="btn btn-primary" data-tab="add">Add a student</button></div>';
      return '<div class="p-split"><div class="p-list" role="list">' + cases.map(function (c) {
        var s = D.db.student(c.studentId), p = prog(c);
        return '<button type="button" role="listitem" class="p-row' + (c === sel ? " is-on" : "") + '" data-open="' + c.id + '"><span class="p-row-top"><b>' + esc(s.name) + "</b>" + pill(c.stage) + '</span><span class="p-row-sub">' + esc(p.name) + " · " + esc(uniName(c)) + '</span><span class="p-row-foot"><span class="small muted">' + esc(standing(c)) + "</span></span></button>";
      }).join("") + '</div><div class="p-detail">' + studentDetail(sel, rows.filter(function (r) { return r.caseId === sel.id; })) + "</div></div>";
    }

    function studentDetail(c, mine) {
      var s = D.db.student(c.studentId), p = prog(c), u = D.db.uniOfCase(c), co = U.countryOf(p), miss = missingDocs(c);
      var expected = D.db.commissionLakh(p);
      var earn = mine.length ? '<table class="p-table earn"><tbody>' + mine.map(function (r) {
        return "<tr><td><b>" + esc(r.label) + "</b>" + (r.note ? "<small>" + esc(r.note) + "</small>" : "") + "</td><td>" + earnChip(r.status) + '</td><td class="t-num">' + inr(r.amount) + "</td></tr>";
      }).join("") + "</tbody></table>" :
        '<p class="small">' + (expected > 0 ? "Your share of the university commission on this programme: <b>≈ " + inr(expected) + "</b>. It becomes expected once " + esc(first(s.name)) + " accepts an offer, and due on enrolment." : "Public universities in " + esc(co.name) + " pay no agent commission. You still earn on the room and the visa if " + esc(first(s.name)) + " books them here.") + "</p>";
      return '<div class="d-head"><div><h2>' + esc(s.name) + '</h2><p class="small muted">' + esc(s.phone) + (s.city ? " · " + esc(s.city) : "") + " · added " + ago(c.createdAt) + "</p></div>" + pill(c.stage) + "</div>" +
        '<p class="d-prog"><a href="programme.html?id=' + p.id + '">' + esc(p.name) + "</a> · " + esc(u.name) + ", " + esc(co.name) + "</p>" +
        tracker(c) +
        '<section class="next-card"><p class="eyebrow">Where it stands</p><h3>' + esc(standing(c)) + '</h3><p>Your counsellor works this student on the counsellor desk: WhatsApp, documents, submission to the university, visa referral.</p>' +
        '<a class="btn btn-dark" href="counsellor.html?as=' + counsellor.id + "&case=" + c.id + '">Open in ' + esc(first(counsellor.name)) + "’s desk →</a></section>" +
        '<section class="panel"><div class="panel-head"><h3>What you earn on ' + esc(first(s.name)) + "</h3>" + (mine.length ? '<span class="small muted">' + inr(sum(mine)) + " in all</span>" : "") + "</div>" + earn + "</section>" +
        '<section class="panel"><div class="panel-head"><h3>Documents</h3><span class="small muted">' + (D.DOCS.length - miss.length) + " of " + D.DOCS.length + "</span></div>" + docList(c, false) + "</section>" +
        timeline(c);
    }

    /* ----- add a student ----- */
    var COUNTRY_ORDER = D.COUNTRIES.filter(function (co) { return D.PROGRAMMES.some(function (p) { return U.countryOf(p).id === co.id; }); });
    function progsIn(cid) { return D.PROGRAMMES.filter(function (p) { return U.countryOf(p).id === cid && !p.closed; }).sort(function (a, b) { return D.db.commissionLakh(b) - D.db.commissionLakh(a) || a.name.localeCompare(b.name); }); }
    // Best-paying first; the one picked to start is the best-paying a typical profile (65%, IELTS 6.5, ₹40 L) fits.
    function progOptions(cid) {
      var list = progsIn(cid), pick = list.find(function (p) { return p.req.pct <= 65 && p.req.ielts <= 6.5 && totalCostLakh(p) <= 40; }) || list[0];
      return list.map(function (p) { return '<option value="' + p.id + '"' + (p === pick ? " selected" : "") + ">" + esc(p.name) + " · " + esc(U.uniOf(p).name) + " · " + share(p) + "</option>"; }).join("");
    }
    function addForm() {
      var cid = U.params().get("country") || "uk";
      function field(id, label, control, hint) { return '<div class="field"><label for="' + id + '">' + label + "</label>" + control + (hint ? '<span class="hint">' + hint + "</span>" : "") + "</div>"; }
      function opts(list, cur) { return list.map(function (o) { return '<option value="' + o[0] + '"' + (String(o[0]) === String(cur) ? " selected" : "") + ">" + esc(o[1]) + "</option>"; }).join(""); }
      return '<div class="p-grid"><form class="panel a-form" id="add-form" novalidate><div class="panel-head"><h3>Student</h3><span class="small muted">' + esc(first(counsellor.name)) + " gets the lead at once</span></div>" +
        '<div class="a-fields">' +
        field("ad-name", "Full name", '<input class="input" id="ad-name" autocomplete="off" data-keep required>') +
        field("ad-phone", "WhatsApp number", '<input class="input" id="ad-phone" inputmode="tel" autocomplete="off" data-keep required>', "10 digits") +
        field("ad-city", "City", '<input class="input" id="ad-city" autocomplete="off" data-keep>') +
        "</div>" +
        '<div class="panel-head"><h3>Programme</h3><span class="small muted">Sorted by what you earn</span></div><div class="a-fields">' +
        field("ad-country", "Country", '<select class="select" id="ad-country">' + opts(COUNTRY_ORDER.map(function (co) { return [co.id, co.name + (D.COMMISSION[co.id] ? "" : " · no commission")]; }), cid) + "</select>") +
        field("ad-prog", "Programme", '<select class="select" id="ad-prog" data-keep>' + progOptions(cid) + "</select>") +
        "</div>" +
        '<div class="panel-head"><h3>Eligibility</h3><span class="small muted">The same four questions the website asks</span></div><div class="a-fields">' +
        field("ad-qual", "Qualification", '<select class="select" id="ad-qual" data-keep>' + opts([["done", "Completed"], ["final", "Final year"], ["lower", "Below entry level"]], "done") + "</select>") +
        field("ad-pct", "Marks (%)", '<input class="input" id="ad-pct" type="number" min="33" max="100" value="65" data-keep>') +
        field("ad-test", "English test", '<select class="select" id="ad-test" data-keep>' + opts([["ielts", "IELTS"], ["toefl", "TOEFL"], ["pte", "PTE"], ["none", "Not taken yet"]], "ielts") + "</select>") +
        field("ad-score", "Score", '<input class="input" id="ad-score" type="number" step="0.5" min="0" value="6.5" data-keep>') +
        field("ad-budget", "Budget a year", '<select class="select" id="ad-budget" data-keep>' + opts([[15, "Up to ₹15 L"], [25, "Up to ₹25 L"], [40, "Up to ₹40 L"], [999, "Above ₹40 L"]], 40) + "</select>") +
        "</div>" +
        '<button type="submit" class="btn btn-primary btn-lg">Add student and send to ' + esc(first(counsellor.name)) + "’s desk</button></form>" +
        '<aside class="p-side"><section class="panel" id="ad-summary"></section></aside></div>';
    }
    function check(p) {
      var pct = Number($("#ad-pct").value), test = $("#ad-test").value, score = Number($("#ad-score").value), qual = $("#ad-qual").value;
      var testOk = test === "none" ? "warn" : score >= p.req[test] ? "ok" : "warn";
      var marks = pct >= p.req.pct ? "ok" : pct >= p.req.pct - 5 ? "warn" : "bad";
      if (qual === "lower" || marks === "bad") return "no";
      var affordable = Number($("#ad-budget").value) >= totalCostLakh(p);
      return marks === "ok" && testOk === "ok" && qual === "done" && affordable ? "good" : "close";
    }
    function summarise() {
      var p = D.db.programme($("#ad-prog").value), box = $("#ad-summary");
      if (!p) { box.innerHTML = '<p class="small muted">No open programmes in this country.</p>'; return; }
      var u = U.uniOf(p), co = U.countryOf(p), test = $("#ad-test").value, l = D.db.commissionLakh(p);
      box.innerHTML = '<div class="panel-head"><h3>' + esc(p.name) + "</h3>" + resultChip(check(p)) + '</div><p class="small muted">' + esc(u.name) + " · " + esc(u.city) + ", " + esc(co.name) + '</p><dl class="facts">' +
        "<div><dt>Tuition a year</dt><dd>" + U.money(p.fee, co.currency) + "<br><small class=\"muted\">" + U.approx(p.fee, co.currency) + "</small></dd></div>" +
        "<div><dt>Needs</dt><dd>" + p.req.pct + "% · " + (test === "none" ? "IELTS " + p.req.ielts : { ielts: "IELTS", toefl: "TOEFL", pte: "PTE" }[test] + " " + p.req[test]) + "</dd></div>" +
        "<div><dt>Next intake</dt><dd>" + U.intakeLabel(p.intakes[0]) + "</dd></div>" +
        "<div><dt>You earn</dt><dd>" + (l > 0 ? "<b>≈ " + inr(l) + "</b><br><small class=\"muted\">" + Math.round(D.AGENCY_TERMS.commissionShare * 100) + "% of the university’s commission</small>" : "No commission<br><small class=\"muted\">Room and visa referrals still pay</small>") + "</dd></div></dl>";
    }

    /* ----- earnings ----- */
    function earnings(rows) {
      var due = sum(rows, ["due"]);
      var byCase = rows.slice().sort(function (a, b) { return ["due", "expected", "processing", "paid", "none"].indexOf(a.status) - ["due", "expected", "processing", "paid", "none"].indexOf(b.status); });
      var payouts = D.db.payouts(gid);
      var T = D.AGENCY_TERMS;
      return '<div class="p-grid"><div class="p-main">' +
        '<section class="next-card"><p class="eyebrow">Payout</p><h3>' + (due > 0 ? inr(due) + " is due to you" : "Nothing due right now") + "</h3><p>" + (due > 0 ? "Request it and Abroadversity pays to your bank account within 7 working days." : "Commission falls due when a student enrols; referrals when the room is confirmed or the visa approved.") + "</p>" +
        (due > 0 ? '<button type="button" class="btn btn-primary" data-payout>Request payout of ' + inr(due) + "</button>" : "") + "</section>" +
        '<section class="panel"><div class="panel-head"><h3>Every line you earn</h3><span class="small muted">Sample figures</span></div><div class="table-wrap"><table class="p-table earn earn-all"><thead><tr><th>Student</th><th>For</th><th>Status</th><th class="t-num">Amount</th></tr></thead><tbody>' +
        (byCase.length ? byCase.map(function (r) {
          var c = D.db.kase(r.caseId), s = D.db.student(c.studentId);
          return '<tr><td><b>' + esc(s.name) + "</b><small>" + esc(uniName(c)) + "</small></td><td>" + esc(r.label) + (r.note ? "<small>" + esc(r.note) + "</small>" : "") + "</td><td>" + earnChip(r.status) + '</td><td class="t-num">' + inr(r.amount) + "</td></tr>";
        }).join("") : '<tr><td colspan="4" class="muted">Earnings appear once a student accepts an offer.</td></tr>') +
        "</tbody></table></div></section>" +
        (payouts.length ? '<section class="panel"><div class="panel-head"><h3>Payouts</h3></div><ul class="bookings">' + payouts.map(function (x) {
          var amt = sum(rows.filter(function (r) { return x.items.indexOf(r.key) >= 0; }));
          return "<li><div><b>" + esc(x.id) + " · " + inr(amt) + "</b><small>Requested " + ago(x.at) + (x.paidAt ? " · paid " + ago(x.paidAt) : "") + "</small></div>" + earnChip(x.status === "paid" ? "paid" : "processing") + "</li>";
        }).join("") + "</ul></section>" : "") +
        '</div><aside class="p-side"><section class="panel terms"><div class="panel-head"><h3>How you earn</h3><span class="small muted">Pilot terms</span></div><ul class="terms-list">' +
        "<li><b>" + Math.round(T.commissionShare * 100) + "%</b><span>of the commission the university pays, due when your student enrols</span></li>" +
        "<li><b>" + inr(T.roomReferral / 100000) + "</b><span>for each room confirmed through a stays partner</span></li>" +
        "<li><b>" + Math.round(T.visaReferralShare * 100) + "%</b><span>of the visa consultant’s fee, when the visa is approved</span></li>" +
        "<li><b>₹0</b><span>to use Abroadversity. No joining fee, no monthly fee</span></li></ul>" +
        '<table class="p-table rates"><thead><tr><th>Country</th><th class="t-num">Commission</th></tr></thead><tbody>' +
        COUNTRY_ORDER.map(function (co) { var r = D.COMMISSION[co.id] || 0; return "<tr><td>" + U.flag(co, "mini-flag") + " " + esc(co.name) + '</td><td class="t-num">' + (r ? Math.round(r * 100) + "%" : '<span class="muted">None</span>') + "</td></tr>"; }).join("") +
        '</tbody></table><p class="small muted">Commission as a share of year-one tuition. Indicative rates: the real rate comes from each university’s agreement. Public universities in Germany and Japan pay none.</p></section></aside></div>';
    }

    D.db.on(draw);
    draw();
    document.addEventListener("click", function (e) {
      var t;
      if ((t = e.target.closest("[data-tab]"))) { go({ tab: t.dataset.tab, case: null }); draw(); window.scrollTo({ top: 0 }); return; }
      if ((t = e.target.closest("[data-open]"))) { go({ case: t.dataset.open }); draw(); if (window.innerWidth < 900) $(".p-detail").scrollIntoView({ behavior: "smooth" }); return; }
      if (e.target.closest("[data-payout]")) { var x = D.db.requestPayout(gid); if (x) U.toast("Payout " + x.id + " requested"); }
    });
    document.addEventListener("change", function (e) {
      if (e.target.id === "ad-country") {
        go({ country: e.target.value });
        $("#ad-prog").innerHTML = progOptions(e.target.value);
      }
      if (e.target.closest("#add-form")) summarise();
    });
    document.addEventListener("input", function (e) { if (e.target.closest("#add-form")) summarise(); });
    document.addEventListener("submit", function (e) {
      if (e.target.id !== "add-form") return;
      e.preventDefault();
      var name = $("#ad-name"), phone = $("#ad-phone"), bad = null;
      [name, phone].forEach(function (el) { el.removeAttribute("aria-invalid"); });
      if (phone.value.replace(/\D/g, "").length < 10) { phone.setAttribute("aria-invalid", "true"); bad = phone; }
      if (!name.value.trim()) { name.setAttribute("aria-invalid", "true"); bad = name; }
      if (bad) { bad.focus(); U.toast(bad === name ? "Enter the student’s name" : "Enter a 10-digit WhatsApp number"); return; }
      var p = D.db.programme($("#ad-prog").value);
      var made = D.db.createLead({
        programmeId: p.id, name: name.value.trim(), phone: phone.value.trim(), city: $("#ad-city").value.trim(), agencyId: gid,
        eligibility: { qual: $("#ad-qual").value, pct: Number($("#ad-pct").value), test: $("#ad-test").value, score: Number($("#ad-score").value), budget: Number($("#ad-budget").value), result: check(p) },
      });
      $$("#add-form [data-keep]").forEach(function (el) { if (el.tagName === "INPUT") el.value = ""; });
      go({ tab: "students", case: made.kase.id, country: null });
      draw();
      U.toast(first(made.student.name) + " added. " + first(counsellor.name) + " has the lead.");
    });
  };

  /* ================= PUBLIC: STAYS ================= */
  D.pages.stays = function () {
    ui();
    var cities = [];
    D.PROVIDERS.forEach(function (p) { if (cities.indexOf(p.city) < 0) cities.push(p.city); });
    var near = U.params().get("near") || "";
    var nearUni = near && U.byId(D.UNIVERSITIES, near);
    var state = { city: nearUni ? nearUni.city : U.params().get("city") || "" };
    var dlg = $("#book"), picked = null;

    var render = function () {
      var list = D.LISTINGS.filter(function (l) { return !state.city || listingProvider(l).city === state.city; }).sort(function (a, b) { return (a.full - b.full) || U.lakh(a.rent, a.currency) - U.lakh(b.rent, b.currency); });
      $("#stay-city").innerHTML = '<option value="">All cities</option>' + cities.map(function (c) { return '<option' + (c === state.city ? " selected" : "") + ">" + esc(c) + "</option>"; }).join("");
      $("#stay-count").textContent = U.plural(list.length, "room") + (state.city ? " in " + state.city : "");
      $("#stay-list").innerHTML = list.map(function (l) { return listingCard(l, l.full ? '<button type="button" class="btn btn-ghost btn-block" disabled>Full for now</button>' : '<button type="button" class="btn btn-dark btn-block" data-request="' + l.id + '">Request this room</button>'); }).join("");
    };
    D.db.on(render);
    $("#stay-city").addEventListener("change", function (e) { state.city = e.target.value; go({ city: state.city, near: null }); render(); });
    render();
    $("#counselling-slot").outerHTML = U.counsellingBand();

    document.addEventListener("click", function (e) {
      var t = e.target.closest("[data-request]");
      if (t) {
        var l = picked = D.db.listing(t.dataset.request), students = D.db.get().students, me = D.db.as("student");
        dlg.innerHTML = '<form class="modal-wrap" method="dialog" id="book-form"><div class="modal-head"><div><p class="eyebrow">Request a room</p><h2>' + esc(l.title) + "</h2><p>" + esc(listingProvider(l).name) + " confirms within a day. Your counsellor sees the request too.</p></div>" +
          '<button type="button" class="close-btn" data-close aria-label="Close">×</button></div><div class="modal-body">' +
          '<div class="field"><label for="bk-who">Booking as</label><select class="select" id="bk-who">' + students.map(function (s) { return '<option value="' + s.id + '"' + (s.id === me ? " selected" : "") + ">" + esc(s.name) + "</option>"; }).join("") + '</select><span class="hint">Demo: no sign-in. Pick the student you are playing.</span></div>' +
          '<div class="field"><label for="bk-month">Move in</label><select class="select" id="bk-month">' + ["Jan", "Feb", "Apr", "Jul", "Aug", "Sep", "Oct"].map(function (m) { return "<option" + (m === l.from ? " selected" : "") + ">" + m + "</option>"; }).join("") + "</select></div>" +
          '</div><div class="modal-foot"><span class="small muted">' + U.money(l.rent, l.currency) + ' a month</span><button type="submit" class="btn btn-primary btn-lg">Send request</button></div></form>';
        dlg.showModal();
        $("#bk-who").focus();
        return;
      }
      if (e.target === dlg || e.target.closest("[data-close]")) dlg.close();
    });
    dlg.addEventListener("submit", function (e) {
      e.preventDefault();
      var l = picked, sid = $("#bk-who").value;
      // Link the request to the student's application near this room, if there is one.
      var c = D.db.cases({ studentId: sid }).find(function (x) { var u = D.db.uniOfCase(x); return u && (l.near.indexOf(u.id) >= 0 || u.city === listingProvider(l).city); });
      D.db.requestBooking(sid, l.id, c && c.id, $("#bk-month").value);
      D.db.as("student", sid);
      dlg.close();
      U.toast("Request sent to " + listingProvider(l).name);
    });
  };

  /* ================= PUBLIC: UNIVERSITIES ================= */
  D.pages.universities = function () {
    ui();
    $("#uni-dir").innerHTML = D.COUNTRIES.map(function (co) {
      var unis = D.UNIVERSITIES.filter(function (u) { return u.country === co.id; });
      return '<section class="uni-country"><div class="uni-country-head">' + U.flag(co, "mini-flag") + "<h2>" + esc(co.name) + '</h2><a class="small" href="country.html?c=' + co.id + '">Study in ' + esc(co.name) + " →</a></div>" +
        '<div class="uni-cards" style="--cols:3">' + unis.map(function (u) {
          var ps = D.PROGRAMMES.filter(function (p) { return p.uni === u.id; });
          var from = Math.min.apply(null, ps.map(function (p) { return U.lakh(p.fee, co.currency); }));
          return '<a class="uni-card" href="programmes.html?uni=' + u.id + '"><div class="uni-head"><span class="uni-mono" aria-hidden="true">' + esc(U.initials(u.name)) + '</span><div class="uni-txt"><h3>' + esc(u.name) + '</h3><span class="uni-city">' + U.PIN + esc(u.city) + "</span></div></div>" +
            '<dl class="uni-facts"><div><dt>Programmes</dt><dd>' + ps.length + "</dd></div><div><dt>Tuition from</dt><dd>" + (from < 1 ? "No fee" : U.rupees(from)) + "</dd></div><div><dt>Stays nearby</dt><dd>" + D.db.listingsNear(u.id).length + '</dd></div></dl><span class="uni-go">See programmes →</span></a>';
        }).join("") + "</div></section>";
    }).join("");
  };

  /* ================= DEMO GUIDE ================= */
  D.pages.demo = function () {
    ui();
    var db = D.db.get();
    $("#demo-stats").innerHTML = [
      [db.students.length, "students"], [db.cases.length, "applications"], [D.UNIVERSITIES.length, "universities"], [D.CONSULTANTS.length, "visa partners"], [D.AGENCIES.length, "partner agencies"], [D.LISTINGS.length, "rooms"],
    ].map(function (s) { return '<div class="stat"><b>' + s[0] + "</b><span>" + s[1] + "</span></div>"; }).join("");
  };
})();
