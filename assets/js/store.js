/* Demo back end. Everything the five sides of Abroadversity share lives in one
   object in localStorage, so a change made as the counsellor shows up on the
   student's, university's and partners' pages, in this tab and in any other
   open tab. Partners (counsellors, consultants, stays) are fictional. */

(function () {
  "use strict";
  var D = window.ABV;
  var KEY = "abv.demo.v2";

  /* ---------- people and partners (fixed) ---------- */
  D.COUNSELLORS = [
    { id: "c1", name: "Neha Kapoor", city: "New Delhi", focus: "Canada, UK, Germany" },
    { id: "c2", name: "Arjun Verma", city: "Bengaluru", focus: "USA, Australia, Ireland" },
    // Counsellors at partner agencies work their own students on the same desk.
    { id: "c3", name: "Vikram Singh", city: "Patna", focus: "UK, Australia, Germany", agencyId: "g1" },
    { id: "c4", name: "Shalini Gupta", city: "Lucknow", focus: "UK, Ireland", agencyId: "g2" },
  ];

  // Partner agencies: local consultancies that bring their own students. Fictional.
  D.AGENCIES = [
    { id: "g1", name: "BrightPath Overseas", city: "Patna", owner: "Vikram Singh", counsellorId: "c3", region: "Bihar, Jharkhand and Nepal", since: "2026" },
    { id: "g2", name: "Horizon Study Abroad", city: "Lucknow", owner: "Shalini Gupta", counsellorId: "c4", region: "Uttar Pradesh", since: "2026" },
  ];

  // What a partner agency earns. Commission is a share of the first-year tuition the university pays
  // on enrolment; rates by country are indicative and the real rate comes from each university's agreement.
  // Public universities in Germany and Japan pay agents no commission.
  D.COMMISSION = { ca: 0.12, us: 0.1, uk: 0.15, au: 0.18, de: 0, ae: 0.1, ru: 0.05, kg: 0.05, ie: 0.15, fr: 0.05, nz: 0.15, jp: 0 };
  D.AGENCY_TERMS = { commissionShare: 0.7, roomReferral: 4000, visaReferralShare: 0.1 };

  D.CONSULTANTS = [
    { id: "k1", name: "VisaPath Consultants", person: "Ritu Malhotra", city: "New Delhi", countries: ["ca", "uk", "de", "ie"], fee: 15000, rating: 4.8, files: 640 },
    { id: "k2", name: "ClearRoute Visa Services", person: "Sameer Khan", city: "Mumbai", countries: ["us", "au", "nz", "ae"], fee: 18000, rating: 4.7, files: 410 },
    { id: "k3", name: "NorthStar Overseas", person: "Harpreet Sandhu", city: "Chandigarh", countries: ["ca", "au", "nz", "uk"], fee: 12000, rating: 4.6, files: 520 },
  ];

  D.PROVIDERS = [
    { id: "p1", name: "Maple Student Living", city: "Toronto", country: "ca", contact: "Emily Chen" },
    { id: "p2", name: "Northern Quarter Living", city: "Manchester", country: "uk", contact: "Tom Ellis" },
    { id: "p3", name: "Isar Student Homes", city: "Munich", country: "de", contact: "Lena Vogt" },
    { id: "p4", name: "Yarra House", city: "Melbourne", country: "au", contact: "Priya Das" },
    { id: "p5", name: "Bloomsbury Rooms", city: "London", country: "uk", contact: "Sarah Hughes" },
    { id: "p6", name: "Back Bay Residences", city: "Boston", country: "us", contact: "Mike Rivera" },
  ];

  // rent is per month in local currency.
  D.LISTINGS = [
    { id: "l1", provider: "p1", title: "Ensuite room, Spadina Avenue", type: "Ensuite", rent: 1450, currency: "CAD", near: ["toronto"], distance: "8 min walk to University of Toronto", from: "Sep", amenities: ["Bills included", "Gym", "Study rooms"] },
    { id: "l2", provider: "p1", title: "Studio, Kensington Market", type: "Studio", rent: 1950, currency: "CAD", near: ["toronto"], distance: "12 min by streetcar to University of Toronto", from: "Jan", amenities: ["Own kitchen", "Laundry", "24h security"] },
    { id: "l3", provider: "p1", title: "Shared flat room, North York", type: "Shared flat", rent: 980, currency: "CAD", near: ["toronto", "seneca"], distance: "10 min walk to Seneca Polytechnic", from: "Sep", amenities: ["Bills included", "Furnished"] },
    { id: "l4", provider: "p2", title: "Ensuite room, Oxford Road", type: "Ensuite", rent: 780, currency: "GBP", near: ["manchester"], distance: "5 min walk to University of Manchester", from: "Sep", amenities: ["Bills included", "Cinema room", "Bike store"] },
    { id: "l5", provider: "p2", title: "Studio, Northern Quarter", type: "Studio", rent: 1050, currency: "GBP", near: ["manchester"], distance: "15 min by bus to University of Manchester", from: "Sep", amenities: ["Own kitchen", "Gym"] },
    { id: "l6", provider: "p3", title: "Room in shared flat, Schwabing", type: "Shared flat", rent: 650, currency: "EUR", near: ["tum"], distance: "10 min by U-Bahn to TUM", from: "Oct", amenities: ["Furnished", "Registration (Anmeldung) help"] },
    { id: "l7", provider: "p3", title: "Studio, Garching", type: "Studio", rent: 980, currency: "EUR", near: ["tum"], distance: "6 min walk to TUM Garching campus", from: "Oct", amenities: ["Own kitchen", "Bills included"] },
    { id: "l8", provider: "p4", title: "Ensuite room, Carlton", type: "Ensuite", rent: 1600, currency: "AUD", near: ["melbourne", "monash"], distance: "7 min walk to University of Melbourne", from: "Feb", amenities: ["Bills included", "Rooftop", "Gym"] },
    { id: "l9", provider: "p5", title: "Ensuite room, Bloomsbury", type: "Ensuite", rent: 1150, currency: "GBP", near: ["ucl", "kcl", "imperial"], distance: "10 min walk to UCL, 15 min to King's", from: "Sep", amenities: ["Bills included", "Study rooms"] },
    { id: "l10", provider: "p6", title: "Shared apartment room, Fenway", type: "Shared flat", rent: 1600, currency: "USD", near: ["northeastern", "mit", "harvard"], distance: "6 min walk to Northeastern University", from: "Sep", amenities: ["Furnished", "Laundry", "Bills included"] },
  ];

  D.STAGES = [
    { id: "new", name: "New" },
    { id: "contacted", name: "Contacted" },
    { id: "applied", name: "Applied" },
    { id: "offer", name: "Offer" },
    { id: "visa", name: "Visa" },
    { id: "enrolled", name: "Enrolled" },
    { id: "closed", name: "Closed" },
  ];

  D.DOCS = [
    { id: "transcript", name: "Marksheets and transcripts", short: "marksheets" },
    { id: "english", name: "English test score report", short: "English score report" },
    { id: "sop", name: "Statement of purpose (SOP)", short: "SOP" },
    { id: "passport", name: "Passport, first and last page", short: "passport copy" },
    { id: "lor", name: "Two recommendation letters", short: "recommendation letters" },
  ];

  D.VISA_STEPS = [
    { id: "funds", name: "Proof of funds checked" },
    { id: "forms", name: "Visa forms filled" },
    { id: "biometrics", name: "Biometrics appointment booked" },
    { id: "submitted", name: "Visa application submitted" },
    { id: "approved", name: "Visa approved" },
  ];

  /* ---------- seed: one journey at every stage ---------- */
  function ago(hours) { return new Date(Date.now() - hours * 3600e3).toISOString(); }

  function seed() {
    var db = { students: [], cases: [], messages: [], events: [], bookings: [], payouts: [], overrides: {}, listingOverrides: {}, seq: 100 };
    function student(id, name, phone, city) { db.students.push({ id: id, name: name, phone: phone, email: name.split(" ")[0].toLowerCase() + "@example.com", city: city, createdAt: ago(400) }); }
    student("s1", "Aarav Sharma", "+91 98110 23456", "New Delhi");
    student("s2", "Diya Patel", "+91 98250 11223", "Ahmedabad");
    student("s3", "Priya Nair", "+91 94470 33445", "Kochi");
    student("s4", "Rohan Mehta", "+91 98200 55667", "Mumbai");
    student("s5", "Meera Joshi", "+91 98500 77889", "Pune");
    student("s6", "Sneha Iyer", "+91 98400 99001", "Chennai");
    student("s7", "Karan Gill", "+91 98140 12121", "Ludhiana");
    student("s8", "Ananya Rao", "+91 98450 34343", "Bengaluru");
    // Students a partner agency brought in.
    student("s9", "Aditya Kumar", "+91 70040 11223", "Patna");
    student("s10", "Pooja Singh", "+91 70040 22334", "Muzaffarpur");
    student("s11", "Saurabh Jha", "+91 70040 33445", "Darbhanga");
    student("s12", "Nisha Kumari", "+91 70040 44556", "Gaya");
    student("s13", "Amit Raj", "+91 70040 55667", "Ranchi");
    student("s14", "Kavya Mishra", "+91 70040 66778", "Patna");
    student("s15", "Ritika Srivastava", "+91 70070 77889", "Lucknow");

    function docs(done) {
      var out = {};
      D.DOCS.forEach(function (d) { out[d.id] = done.indexOf(d.id) >= 0 ? { status: "uploaded", file: d.id + ".pdf", at: ago(60) } : { status: "missing" }; });
      return out;
    }
    function visa(done) {
      var out = {};
      D.VISA_STEPS.forEach(function (s, i) { out[s.id] = done.indexOf(s.id) >= 0 ? ago(100 - i * 20) : null; });
      return out;
    }
    function kase(o) {
      var c = Object.assign({ agencyId: null, consultantId: null, uni: { status: "not-sent" }, offerAccepted: false, visa: visa([]), docs: docs([]), waitingSince: null, closedReason: "" }, o);
      c.updatedAt = c.updatedAt || c.createdAt;
      db.cases.push(c);
      return c;
    }
    function elig(qual, pct, test, score, budget, result) { return { qual: qual, pct: pct, test: test, score: score, budget: budget, result: result }; }
    function ev(caseId, role, text, h) { db.events.push({ id: "e" + db.seq++, caseId: caseId, role: role, text: text, at: ago(h) }); }
    function msg(caseId, role, name, text, h) { db.messages.push({ id: "m" + db.seq++, caseId: caseId, role: role, name: name, text: text, at: ago(h) }); }

    kase({ id: "a1", studentId: "s1", programmeId: "toronto-computer-science-m", counsellorId: "c1", stage: "new", createdAt: ago(3), waitingSince: ago(3), eligibility: elig("done", 78, "ielts", 7, 40, "good") });
    ev("a1", "student", "Checked eligibility: meets the listed requirements", 3);

    kase({ id: "a2", studentId: "s2", programmeId: "northeastern-computer-science-m", counsellorId: "c2", stage: "new", createdAt: ago(27), waitingSince: ago(27), eligibility: elig("final", 68, "ielts", 6.5, 40, "close") });
    ev("a2", "student", "Checked eligibility: close, final-year student", 27);

    kase({ id: "a3", studentId: "s3", programmeId: "kcl-health-m", counsellorId: "c1", stage: "contacted", createdAt: ago(70), waitingSince: ago(5), docs: docs(["transcript", "english"]), eligibility: elig("done", 71, "ielts", 7, 40, "good") });
    ev("a3", "student", "Checked eligibility: meets the listed requirements", 70);
    ev("a3", "counsellor", "Neha Kapoor contacted Priya on WhatsApp", 66);
    msg("a3", "counsellor", "Neha Kapoor", "Hi Priya, Neha from Abroadversity. Your profile fits King's well. Could you upload your marksheets, IELTS report and a first draft of your SOP?", 66);
    msg("a3", "student", "Priya Nair", "Uploaded marksheets and IELTS. SOP draft by tomorrow.", 5);
    ev("a3", "student", "Uploaded 2 documents", 5);

    kase({ id: "a4", studentId: "s4", programmeId: "toronto-data-science-m", counsellorId: "c1", stage: "applied", createdAt: ago(240), docs: docs(["transcript", "english", "sop", "passport", "lor"]), uni: { status: "submitted", at: ago(30) }, eligibility: elig("done", 82, "ielts", 7.5, 999, "good") });
    ev("a4", "student", "Checked eligibility: meets the listed requirements", 240);
    ev("a4", "counsellor", "Neha Kapoor contacted Rohan on WhatsApp", 230);
    ev("a4", "student", "Uploaded 5 documents", 120);
    ev("a4", "counsellor", "Application submitted to University of Toronto", 30);
    msg("a4", "counsellor", "Neha Kapoor", "Rohan, your application is with the University of Toronto. Decisions usually take 2 to 4 weeks.", 30);

    kase({ id: "a5", studentId: "s5", programmeId: "toronto-computer-science-m", counsellorId: "c1", stage: "applied", createdAt: ago(400), docs: docs(["transcript", "english", "sop", "passport", "lor"]), uni: { status: "under-review", at: ago(48) }, eligibility: elig("done", 74, "toefl", 102, 40, "good") });
    ev("a5", "student", "Checked eligibility: meets the listed requirements", 400);
    ev("a5", "counsellor", "Application submitted to University of Toronto", 120);
    ev("a5", "university", "University of Toronto started reviewing the application", 48);

    kase({ id: "a6", studentId: "s6", programmeId: "manchester-data-science-m", counsellorId: "c1", stage: "offer", createdAt: ago(600), waitingSince: ago(20), docs: docs(["transcript", "english", "sop", "passport", "lor"]), uni: { status: "offer", offerType: "conditional", condition: "Final degree result of 65% or above", at: ago(20) }, eligibility: elig("final", 69, "ielts", 7, 40, "close") });
    ev("a6", "counsellor", "Application submitted to University of Manchester", 300);
    ev("a6", "university", "University of Manchester made a conditional offer", 20);
    msg("a6", "counsellor", "Neha Kapoor", "Congratulations Sneha! Manchester has made you a conditional offer. Accept it on your dashboard, then we can sort your room and visa.", 19);

    kase({ id: "a7", studentId: "s7", programmeId: "tum-computer-science-m", counsellorId: "c1", consultantId: "k1", stage: "visa", createdAt: ago(1200), docs: docs(["transcript", "english", "sop", "passport", "lor"]), uni: { status: "offer", offerType: "unconditional", at: ago(400) }, offerAccepted: true, visa: visa(["funds", "forms"]), eligibility: elig("done", 80, "ielts", 7, 15, "good") });
    ev("a7", "university", "Technical University of Munich made an unconditional offer", 400);
    ev("a7", "student", "Accepted the offer", 380);
    ev("a7", "counsellor", "Referred to VisaPath Consultants for the visa", 300);
    ev("a7", "consultant", "VisaPath Consultants: visa forms filled", 60);
    msg("a7", "consultant", "Ritu Malhotra", "Karan, your blocked account proof looks good. Next: biometrics at VFS Delhi. I will send slots.", 60);

    kase({ id: "a8", studentId: "s8", programmeId: "monash-data-science-m", counsellorId: "c2", consultantId: "k2", stage: "enrolled", createdAt: ago(2400), docs: docs(["transcript", "english", "sop", "passport", "lor"]), uni: { status: "offer", offerType: "unconditional", at: ago(1500) }, offerAccepted: true, visa: visa(["funds", "forms", "biometrics", "submitted", "approved"]), eligibility: elig("done", 85, "pte", 70, 40, "good") });
    ev("a8", "consultant", "ClearRoute Visa Services: visa approved", 200);
    ev("a8", "counsellor", "Marked as enrolled", 150);

    /* BrightPath Overseas (Patna): its own counsellor, its own students, one at every stage. */
    var ALL = ["transcript", "english", "sop", "passport", "lor"];
    kase({ id: "a9", agencyId: "g1", studentId: "s9", programmeId: "coventry-computer-science-m", counsellorId: "c3", stage: "new", createdAt: ago(2), waitingSince: ago(2), eligibility: elig("done", 66, "ielts", 6.5, 30, "good") });
    ev("a9", "counsellor", "BrightPath Overseas added the student", 2);

    kase({ id: "a10", agencyId: "g1", studentId: "s10", programmeId: "herts-health-m", counsellorId: "c3", stage: "contacted", createdAt: ago(90), waitingSince: ago(30), docs: docs(["transcript", "passport"]), eligibility: elig("done", 61, "ielts", 6, 30, "good") });
    ev("a10", "counsellor", "BrightPath Overseas added the student", 90);
    ev("a10", "counsellor", "Vikram Singh contacted Pooja on WhatsApp", 85);
    msg("a10", "counsellor", "Vikram Singh", "Pooja, your Hertfordshire application is ready except your IELTS report, SOP and two recommendation letters. Upload them and I will submit.", 85);

    kase({ id: "a11", agencyId: "g1", studentId: "s11", programmeId: "leeds-business-m", counsellorId: "c3", stage: "applied", createdAt: ago(300), docs: docs(ALL), uni: { status: "under-review", at: ago(70) }, eligibility: elig("done", 72, "ielts", 7, 40, "good") });
    ev("a11", "counsellor", "BrightPath Overseas added the student", 300);
    ev("a11", "counsellor", "Application submitted to University of Leeds", 140);
    ev("a11", "university", "University of Leeds started reviewing the application", 70);

    kase({ id: "a12", agencyId: "g1", studentId: "s12", programmeId: "deakin-data-science-m", counsellorId: "c3", consultantId: "k2", stage: "visa", createdAt: ago(900), docs: docs(ALL), uni: { status: "offer", offerType: "unconditional", at: ago(500) }, offerAccepted: true, visa: visa(["funds", "forms", "biometrics"]), eligibility: elig("done", 64, "pte", 62, 40, "good") });
    ev("a12", "university", "Deakin University made an unconditional offer", 500);
    ev("a12", "student", "Accepted the offer from Deakin University", 470);
    ev("a12", "counsellor", "Referred to ClearRoute Visa Services for the visa", 400);
    ev("a12", "partner", "Yarra House confirmed the room", 300);

    kase({ id: "a13", agencyId: "g1", studentId: "s13", programmeId: "coventry-data-science-m", counsellorId: "c3", consultantId: "k1", stage: "enrolled", createdAt: ago(3000), docs: docs(ALL), uni: { status: "offer", offerType: "unconditional", at: ago(2200) }, offerAccepted: true, visa: visa(["funds", "forms", "biometrics", "submitted", "approved"]), eligibility: elig("done", 63, "ielts", 6.5, 30, "good") });
    ev("a13", "consultant", "VisaPath Consultants: visa approved", 1700);
    ev("a13", "counsellor", "Marked as enrolled", 1400);

    kase({ id: "a14", agencyId: "g1", studentId: "s14", programmeId: "tum-computer-science-m", counsellorId: "c3", consultantId: "k1", stage: "enrolled", createdAt: ago(2600), docs: docs(ALL), uni: { status: "offer", offerType: "unconditional", at: ago(1900) }, offerAccepted: true, visa: visa(["funds", "forms", "biometrics", "submitted", "approved"]), eligibility: elig("done", 84, "ielts", 7.5, 15, "good") });
    ev("a14", "consultant", "VisaPath Consultants: visa approved", 600);
    ev("a14", "counsellor", "Marked as enrolled", 240);

    /* Horizon Study Abroad (Lucknow). */
    kase({ id: "a15", agencyId: "g2", studentId: "s15", programmeId: "herts-computer-science-m", counsellorId: "c4", stage: "applied", createdAt: ago(200), docs: docs(ALL), uni: { status: "submitted", at: ago(40) }, eligibility: elig("done", 68, "ielts", 6.5, 30, "good") });
    ev("a15", "counsellor", "Application submitted to University of Hertfordshire", 40);

    // Amit's commission was paid out last month.
    db.payouts.push({ id: "P-1041", agencyId: "g1", items: ["a13:commission", "a13:visa"], status: "paid", at: ago(900), paidAt: ago(700) });

    db.bookings.push({ id: "b1", caseId: "a7", studentId: "s7", listingId: "l6", status: "requested", moveIn: "Oct", at: ago(10) });
    db.bookings.push({ id: "b2", caseId: "a8", studentId: "s8", listingId: "l8", status: "confirmed", moveIn: "Feb", at: ago(300), decidedAt: ago(290) });
    db.bookings.push({ id: "b3", caseId: "a12", studentId: "s12", listingId: "l8", status: "confirmed", moveIn: "Feb", at: ago(320), decidedAt: ago(300) });
    db.bookings.push({ id: "b4", caseId: "a14", studentId: "s14", listingId: "l7", status: "confirmed", moveIn: "Oct", at: ago(900), decidedAt: ago(880) });
    ev("a7", "student", "Requested a room: Room in shared flat, Schwabing", 10);
    ev("a8", "partner", "Yarra House confirmed the room", 290);
    return db;
  }

  /* ---------- load, save, sync ---------- */
  var db, listeners = [];
  function read() { try { var raw = localStorage.getItem(KEY); return raw ? JSON.parse(raw) : null; } catch (e) { return null; } }
  function load() { db = read() || seed(); }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) { /* storage blocked: the demo still works in this tab */ }
    applyOverrides();
    listeners.forEach(function (fn) { fn(); });
  }
  load();
  // Another tab changed the data: reload and redraw.
  window.addEventListener("storage", function (e) { if (e.key === KEY) { load(); applyOverrides(); listeners.forEach(function (fn) { fn(); }); } });

  // Universities edit fees and close intakes; stays partners edit rent. The public pages read these.
  var BASE_FEE = {};
  D.PROGRAMMES.forEach(function (p) { BASE_FEE[p.id] = p.fee; });
  var BASE_RENT = {};
  D.LISTINGS.forEach(function (l) { BASE_RENT[l.id] = l.rent; });
  function applyOverrides() {
    D.PROGRAMMES.forEach(function (p) {
      var o = db.overrides[p.id] || {};
      p.fee = o.fee || BASE_FEE[p.id];
      p.closed = !!o.closed;
      p.verified = o.verified || null;
    });
    D.LISTINGS.forEach(function (l) {
      var o = db.listingOverrides[l.id] || {};
      l.rent = o.rent || BASE_RENT[l.id];
      l.full = !!o.full;
    });
  }
  applyOverrides();

  /* ---------- lookups ---------- */
  function find(list, id) { return list.find(function (x) { return x.id === id; }); }
  function nextId(prefix) { db.seq += 1; return prefix + db.seq; }
  function now() { return new Date().toISOString(); }
  function programme(id) { return find(D.PROGRAMMES, id); }
  function uniOfCase(c) { var p = programme(c.programmeId); return p ? find(D.UNIVERSITIES, p.uni) : null; }

  function log(c, role, text) { db.events.push({ id: nextId("e"), caseId: c.id, role: role, text: text, at: now() }); c.updatedAt = now(); }
  function counsellorActed(c) { c.waitingSince = null; }
  function studentActed(c) { if (c.stage !== "closed") c.waitingSince = c.waitingSince || now(); }

  var api = {
    on: function (fn) { listeners.push(fn); },
    reset: function () { db = seed(); save(); },
    get: function () { return db; },
    find: find,
    programme: programme,
    uniOfCase: uniOfCase,
    student: function (id) { return find(db.students, id); },
    kase: function (id) { return find(db.cases, id); },
    counsellor: function (id) { return find(D.COUNSELLORS, id); },
    consultant: function (id) { return find(D.CONSULTANTS, id); },
    provider: function (id) { return find(D.PROVIDERS, id); },
    listing: function (id) { return find(D.LISTINGS, id); },
    cases: function (filter) {
      filter = filter || {};
      return db.cases.filter(function (c) {
        if (filter.studentId && c.studentId !== filter.studentId) return false;
        if (filter.counsellorId && c.counsellorId !== filter.counsellorId) return false;
        if (filter.consultantId && c.consultantId !== filter.consultantId) return false;
        if (filter.agencyId !== undefined && (c.agencyId || null) !== filter.agencyId) return false;
        if (filter.uni) { var u = uniOfCase(c); if (!u || u.id !== filter.uni || c.uni.status === "not-sent") return false; }
        return true;
      }).sort(function (a, b) { return b.updatedAt.localeCompare(a.updatedAt); });
    },
    messages: function (caseId) { return db.messages.filter(function (m) { return m.caseId === caseId; }); },
    events: function (caseId) { return db.events.filter(function (e) { return e.caseId === caseId; }).sort(function (a, b) { return b.at.localeCompare(a.at); }); },
    bookings: function (filter) {
      filter = filter || {};
      return db.bookings.filter(function (b) {
        if (filter.studentId && b.studentId !== filter.studentId) return false;
        if (filter.caseId && b.caseId !== filter.caseId) return false;
        if (filter.provider) { var l = find(D.LISTINGS, b.listingId); if (!l || l.provider !== filter.provider) return false; }
        return true;
      }).sort(function (a, b) { return b.at.localeCompare(a.at); });
    },
    listingsNear: function (uniId) {
      var u = find(D.UNIVERSITIES, uniId);
      return D.LISTINGS.filter(function (l) { return l.near.indexOf(uniId) >= 0 || (u && find(D.PROVIDERS, l.provider).city === u.city); });
    },
    overrides: function (id) { return db.overrides[id] || {}; },

    /* ---------- the student ---------- */
    // The eligibility check on a programme page: finds the student by phone or adds them, then opens a case.
    createLead: function (form) {
      var digits = form.phone.replace(/\D/g, "").slice(-10);
      var phone = "+91 " + digits.slice(0, 5) + " " + digits.slice(5);
      var s = db.students.find(function (x) { return x.phone.replace(/\D/g, "").slice(-10) === digits; });
      if (!s) { s = { id: nextId("s"), name: form.name, phone: phone, email: form.email || "", city: form.city || "", createdAt: now() }; db.students.push(s); }
      var open = db.cases.find(function (c) { return c.studentId === s.id && c.programmeId === form.programmeId && c.stage !== "closed"; });
      if (open) { open.eligibility = form.eligibility; log(open, "student", "Checked eligibility again"); studentActed(open); save(); return { student: s, kase: open }; }
      // Abroadversity's counsellors take new leads in turn; a partner agency's student goes to its own counsellor.
      var agency = form.agencyId ? find(D.AGENCIES, form.agencyId) : null;
      var load_ = agency ? [{ id: agency.counsellorId }] : D.COUNSELLORS.filter(function (co) { return !co.agencyId; }).map(function (co) { return { id: co.id, n: db.cases.filter(function (c) { return c.counsellorId === co.id && c.stage === "new"; }).length }; }).sort(function (a, b) { return a.n - b.n; });
      var docs = {};
      D.DOCS.forEach(function (d) { docs[d.id] = { status: "missing" }; });
      var c = { id: nextId("a"), agencyId: agency ? agency.id : null, studentId: s.id, programmeId: form.programmeId, counsellorId: load_[0].id, consultantId: null, stage: "new", createdAt: now(), updatedAt: now(), waitingSince: now(), eligibility: form.eligibility, docs: docs, uni: { status: "not-sent" }, offerAccepted: false, visa: {}, closedReason: "" };
      D.VISA_STEPS.forEach(function (v) { c.visa[v.id] = null; });
      db.cases.push(c);
      if (agency) log(c, "counsellor", agency.name + " added the student");
      else log(c, "student", "Checked eligibility: " + { good: "meets the listed requirements", close: "close", no: "not a match yet" }[form.eligibility.result]);
      save();
      return { student: s, kase: c };
    },
    uploadDoc: function (caseId, docId, file) {
      var c = api.kase(caseId);
      c.docs[docId] = { status: "uploaded", file: file, at: now() };
      log(c, "student", "Uploaded " + find(D.DOCS, docId).short);
      studentActed(c); save();
    },
    acceptOffer: function (caseId) {
      var c = api.kase(caseId);
      c.offerAccepted = true;
      log(c, "student", "Accepted the offer from " + uniOfCase(c).name);
      studentActed(c); save();
    },
    requestBooking: function (studentId, listingId, caseId, moveIn) {
      var l = find(D.LISTINGS, listingId);
      var b = { id: nextId("b"), caseId: caseId || null, studentId: studentId, listingId: listingId, status: "requested", moveIn: moveIn || l.from, at: now() };
      db.bookings.push(b);
      var c = caseId && api.kase(caseId);
      if (c) { log(c, "student", "Requested a room: " + l.title); studentActed(c); }
      save();
      return b;
    },
    message: function (caseId, role, name, text) {
      var c = api.kase(caseId);
      db.messages.push({ id: nextId("m"), caseId: caseId, role: role, name: name, text: text, at: now() });
      c.updatedAt = now();
      if (role === "student") studentActed(c); else if (role === "counsellor") counsellorActed(c);
      save();
    },

    /* ---------- the counsellor ---------- */
    contact: function (caseId, text) {
      var c = api.kase(caseId), co = api.counsellor(c.counsellorId), s = api.student(c.studentId);
      if (text) db.messages.push({ id: nextId("m"), caseId: caseId, role: "counsellor", name: co.name, text: text, at: now() });
      if (c.stage === "new") c.stage = "contacted";
      log(c, "counsellor", co.name + " contacted " + s.name.split(" ")[0] + " on WhatsApp");
      counsellorActed(c); save();
    },
    submitToUni: function (caseId) {
      var c = api.kase(caseId);
      c.stage = "applied";
      c.uni = { status: "submitted", at: now() };
      log(c, "counsellor", "Application submitted to " + uniOfCase(c).name);
      counsellorActed(c); save();
    },
    referConsultant: function (caseId, consultantId) {
      var c = api.kase(caseId), k = api.consultant(consultantId);
      c.consultantId = consultantId;
      c.stage = "visa";
      log(c, "counsellor", "Referred to " + k.name + " for the visa");
      counsellorActed(c); save();
    },
    enrol: function (caseId) {
      var c = api.kase(caseId);
      c.stage = "enrolled";
      log(c, "counsellor", "Marked as enrolled");
      counsellorActed(c); save();
    },
    close: function (caseId, reason) {
      var c = api.kase(caseId);
      c.stage = "closed"; c.closedReason = reason; c.waitingSince = null;
      log(c, "counsellor", "Closed: " + reason);
      save();
    },
    reopen: function (caseId) {
      var c = api.kase(caseId);
      c.stage = c.uni.status === "offer" ? "offer" : c.uni.status !== "not-sent" ? "applied" : "contacted";
      c.closedReason = "";
      log(c, "counsellor", "Reopened");
      save();
    },

    /* ---------- the university ---------- */
    review: function (caseId) {
      var c = api.kase(caseId);
      c.uni.status = "under-review"; c.uni.at = now();
      log(c, "university", uniOfCase(c).name + " started reviewing the application");
      save();
    },
    decide: function (caseId, decision, note) {
      var c = api.kase(caseId), u = uniOfCase(c);
      if (decision === "reject") {
        c.uni = { status: "rejected", note: note, at: now() };
        log(c, "university", u.name + " declined the application" + (note ? ": " + note : ""));
        c.waitingSince = c.waitingSince || now();
      } else {
        c.uni = { status: "offer", offerType: decision, condition: decision === "conditional" ? note : "", at: now() };
        c.stage = "offer";
        log(c, "university", u.name + " made " + (decision === "conditional" ? "a conditional" : "an unconditional") + " offer");
      }
      save();
    },
    setProgramme: function (id, patch) {
      var o = db.overrides[id] || (db.overrides[id] = {});
      Object.assign(o, patch, { verified: now() });
      if (o.fee === BASE_FEE[id]) delete o.fee;
      save();
    },

    /* ---------- the visa consultant ---------- */
    visaStep: function (caseId, stepId, done) {
      var c = api.kase(caseId), k = api.consultant(c.consultantId);
      c.visa[stepId] = done ? now() : null;
      if (done) log(c, "consultant", k.name + ": " + find(D.VISA_STEPS, stepId).name.toLowerCase());
      if (done && stepId === "approved") c.waitingSince = c.waitingSince || now();
      save();
    },

    /* ---------- the stays partner ---------- */
    decideBooking: function (bookingId, status) {
      var b = find(db.bookings, bookingId), l = find(D.LISTINGS, b.listingId), pr = find(D.PROVIDERS, l.provider);
      b.status = status; b.decidedAt = now();
      var c = b.caseId && api.kase(b.caseId);
      if (c) log(c, "partner", pr.name + (status === "confirmed" ? " confirmed the room" : " could not offer the room"));
      save();
    },
    setListing: function (id, patch) {
      var o = db.listingOverrides[id] || (db.listingOverrides[id] = {});
      Object.assign(o, patch);
      if (o.rent === BASE_RENT[id]) delete o.rent;
      save();
    },
  };

  /* ---------- partner agencies ---------- */
  api.agency = function (id) { return find(D.AGENCIES, id); };
  api.agencyOfCase = function (c) { return c && c.agencyId ? find(D.AGENCIES, c.agencyId) : null; };
  // Rupees (in lakh) the agency earns on one programme: its share of the university's commission.
  api.commissionLakh = function (p) {
    var u = find(D.UNIVERSITIES, p.uni), rate = D.COMMISSION[u.country] || 0;
    return (p.fee * D.RATES[find(D.COUNTRIES, u.country).currency] / 100000) * rate * D.AGENCY_TERMS.commissionShare;
  };
  // Every line an agency earns, with where it stands: expected, due, in payout, paid, or none.
  api.earnings = function (agencyId) {
    var paidOut = {};
    db.payouts.filter(function (x) { return x.agencyId === agencyId; }).forEach(function (x) { x.items.forEach(function (k) { paidOut[k] = x; }); });
    var rows = [];
    db.cases.filter(function (c) { return c.agencyId === agencyId; }).forEach(function (c) {
      var p = programme(c.programmeId), u = uniOfCase(c);
      function add(kind, label, amount, status, note) {
        var key = c.id + ":" + kind, x = paidOut[key];
        if (x) status = x.status === "paid" ? "paid" : "processing";
        rows.push({ key: key, caseId: c.id, kind: kind, label: label, amount: amount, status: status, note: note || "", payout: x || null });
      }
      if (c.uni.status === "offer" && c.offerAccepted && c.stage !== "closed") {
        var rate = D.COMMISSION[u.country] || 0;
        if (!rate) add("commission", "University commission", 0, "none", "Public university: no agent commission");
        else add("commission", "University commission", api.commissionLakh(p), c.stage === "enrolled" ? "due" : "expected", c.stage === "enrolled" ? "University pays after enrolment" : "Due once the student enrols");
      }
      if (db.bookings.some(function (b) { return b.caseId === c.id && b.status === "confirmed"; })) add("room", "Room referral", D.AGENCY_TERMS.roomReferral / 100000, "due");
      if (c.consultantId && c.visa.approved) add("visa", "Visa referral", api.consultant(c.consultantId).fee * D.AGENCY_TERMS.visaReferralShare / 100000, "due");
    });
    return rows;
  };
  api.payouts = function (agencyId) { return db.payouts.filter(function (x) { return x.agencyId === agencyId; }).sort(function (a, b) { return b.at.localeCompare(a.at); }); };
  api.requestPayout = function (agencyId) {
    var due = api.earnings(agencyId).filter(function (r) { return r.status === "due" && r.amount > 0; });
    if (!due.length) return null;
    db.seq += 1;
    var x = { id: "P-" + (1000 + db.seq), agencyId: agencyId, items: due.map(function (r) { return r.key; }), status: "processing", at: now() };
    db.payouts.push(x);
    save();
    return x;
  };

  // Where a journey stands, from the student's side: done steps and the one that is next.
  api.progress = function (c) {
    var steps = [
      { id: "check", name: "Eligibility checked", done: true },
      { id: "contacted", name: "Counsellor in touch", done: c.stage !== "new" },
      { id: "applied", name: "Application sent", done: c.uni.status !== "not-sent" },
      { id: "offer", name: "Offer accepted", done: c.uni.status === "offer" && c.offerAccepted },
      { id: "visa", name: "Visa", done: !!c.visa.approved },
      { id: "enrolled", name: "Enrolled", done: c.stage === "enrolled" },
    ];
    var current = steps.find(function (s) { return !s.done; });
    steps.forEach(function (s) { s.current = s === current && c.stage !== "closed"; });
    return steps;
  };

  // The identity each side is "viewing as" (no login in the demo).
  api.as = function (role, id) {
    var k = "abv.as." + role;
    if (id !== undefined) { try { localStorage.setItem(k, id); } catch (e) { /* ignore */ } return id; }
    try { return localStorage.getItem(k) || ""; } catch (e) { return ""; }
  };

  D.db = api;
})();
