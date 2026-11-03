/* Prototype data. Country, university and scholarship names are real; every
   fee, score, date and count is dummy data generated below. */

window.ABV = window.ABV || {};

// Rupees per unit of each currency (approximate, for the "≈ ₹ L" hints only).
ABV.RATES = { CAD: 61, USD: 87, GBP: 112, AUD: 56, EUR: 96, AED: 23.7, RUB: 1.05, NZD: 50, JPY: 0.58 };

ABV.SUBJECTS = [
  { id: "computer-science", name: "Computer Science & IT" },
  { id: "data-science", name: "Data Science & AI" },
  { id: "business", name: "Business & MBA" },
  { id: "engineering", name: "Engineering" },
  { id: "finance", name: "Finance & Accounting" },
  { id: "medicine", name: "Medicine (MBBS)" },
  { id: "health", name: "Nursing & Public Health" },
  { id: "biotech", name: "Biotechnology & Life Sciences" },
  { id: "hospitality", name: "Hospitality & Tourism" },
  { id: "design", name: "Design & Architecture" },
];

ABV.LEVELS = [
  { id: "bachelors", name: "Bachelor's" },
  { id: "masters", name: "Master's" },
  { id: "pg-diploma", name: "PG Diploma" },
];

// fee: tuition per year in local currency by level; months: intake months.
ABV.COUNTRIES = [
  { id: "ca", name: "Canada", currency: "CAD", living: 20635, months: [9, 1, 5], fee: { masters: 26000, bachelors: 34000, "pg-diploma": 17000 }, ugYears: 4, pgYears: 2,
    pitch: "Paid co-op terms during your degree and a clear route from study to work.", work: "Post-graduation work permit of up to 3 years", workWhileStudying: "Up to 24 hours a week during term",
    visa: ["Apply for a study permit after your offer letter", "Show tuition plus living funds for the first year", "Biometrics at a visa centre in India"] },
  { id: "us", name: "United States", currency: "USD", living: 18000, months: [9, 1], fee: { masters: 36000, bachelors: 40000 }, ugYears: 4, pgYears: 2,
    pitch: "The widest choice of universities, and long work rights after STEM degrees.", work: "OPT work rights after your degree, longer for STEM", workWhileStudying: "Up to 20 hours a week on campus",
    visa: ["Get your I-20 from the university", "Pay the SEVIS fee and book an F-1 interview", "Show funds for the first year"] },
  { id: "uk", name: "United Kingdom", currency: "GBP", living: 11000, months: [9, 1], fee: { masters: 22000, bachelors: 21000 }, ugYears: 3, pgYears: 1,
    pitch: "One-year master's degrees, so you graduate sooner and spend less.", work: "Graduate Route work visa after your degree", workWhileStudying: "Up to 20 hours a week during term",
    visa: ["Get a CAS from your university", "Show funds for tuition and 9 months of living", "Pay the immigration health surcharge"] },
  { id: "au", name: "Australia", currency: "AUD", living: 29710, months: [2, 7], fee: { masters: 40000, bachelors: 38000 }, ugYears: 3, pgYears: 2,
    pitch: "Strong demand for IT, nursing and engineering graduates.", work: "Temporary Graduate visa after your degree", workWhileStudying: "Up to 48 hours a fortnight during term",
    visa: ["Get a Confirmation of Enrolment (CoE)", "Show funds and health cover (OSHC)", "Genuine Student statement with your application"] },
  { id: "de", name: "Germany", currency: "EUR", living: 11904, months: [10, 4], fee: { masters: 700, bachelors: 700 }, flatFee: true, ugYears: 3, pgYears: 2,
    pitch: "Public universities charge no tuition, only a small semester fee.", work: "18-month permit to look for work after you graduate", workWhileStudying: "Up to 140 full days a year",
    visa: ["Open a blocked account for living costs", "Book a visa appointment early: slots fill fast", "Health insurance before you enrol"] },
  { id: "ae", name: "United Arab Emirates", currency: "AED", living: 45000, months: [9, 1], fee: { masters: 75000, bachelors: 65000 }, ugYears: 4, pgYears: 2,
    pitch: "Close to home, branch campuses of UK and Australian universities, and tax-free salaries.", work: "Work visa once you have a job offer", workWhileStudying: "Part-time work with university permission",
    visa: ["The university sponsors your student visa", "Medical test and Emirates ID after you arrive", "Renew the visa each year of study"] },
  { id: "ru", name: "Russia", currency: "RUB", living: 300000, months: [9], fee: { masters: 300000, bachelors: 330000 }, medicineFee: 420000, ugYears: 4, pgYears: 2,
    pitch: "Low-cost MBBS programmes taught in English at large state universities.", work: "Most graduates return home or study further", workWhileStudying: "Allowed in holidays and with permission",
    visa: ["Invitation letter from the university", "Student visa at the Russian embassy", "Medical tests after you arrive"] },
  { id: "kg", name: "Kyrgyzstan", currency: "USD", living: 2500, months: [9], fee: { bachelors: 3500 }, medicineFee: 4500, ugYears: 4, pgYears: 2,
    pitch: "Affordable English-medium MBBS, a short flight from Delhi.", work: "Most graduates return to India for the licensing exam", workWhileStudying: "Limited part-time work",
    visa: ["Admission letter from the university", "Student visa through the university", "Register with local authorities after arrival"] },
  { id: "ie", name: "Ireland", currency: "EUR", living: 12000, months: [9, 1], fee: { masters: 19000, bachelors: 18000 }, ugYears: 4, pgYears: 1,
    pitch: "English-speaking, home to European offices of big tech and pharma firms.", work: "Stay-back permission after your degree", workWhileStudying: "Up to 20 hours a week during term",
    visa: ["Apply online, then submit documents at VFS", "Show access to living funds", "Register with immigration after you arrive"] },
  { id: "fr", name: "France", currency: "EUR", living: 10000, months: [9, 1], fee: { masters: 9000, bachelors: 4000 }, ugYears: 3, pgYears: 2,
    pitch: "World-famous business schools and public universities with low fees.", work: "Permit to look for work after a master's", workWhileStudying: "Up to 964 hours a year",
    visa: ["Register on Campus France", "Visa appointment at VFS", "Show funds for living costs"] },
  { id: "nz", name: "New Zealand", currency: "NZD", living: 20000, months: [2, 7], fee: { masters: 38000, bachelors: 34000 }, ugYears: 3, pgYears: 1,
    pitch: "Small classes, safe cities and a post-study work visa.", work: "Post-study work visa of up to 3 years", workWhileStudying: "Up to 25 hours a week during term",
    visa: ["Offer of place from the university", "Show funds and a return ticket", "Medical and police certificates"] },
  { id: "jp", name: "Japan", currency: "JPY", living: 1500000, months: [4, 9], fee: { masters: 820000, bachelors: 820000 }, ugYears: 4, pgYears: 2,
    pitch: "English-taught programmes, low fees and a fast-growing tech sector.", work: "Switch to a work visa once you have a job offer", workWhileStudying: "Up to 28 hours a week with permission",
    visa: ["The university sponsors your Certificate of Eligibility", "Apply for the student visa at the embassy", "Get permission before a part-time job"] },
];

// tier: elite / standard / access / college. offers: subjects. levels: m, b, pg.
var CS = "computer-science", DS = "data-science", BUS = "business", ENG = "engineering", FIN = "finance", MED = "medicine", HEA = "health", BIO = "biotech", HOS = "hospitality", DES = "design";
ABV.UNIVERSITIES = [
  // Canada
  { id: "toronto", name: "University of Toronto", city: "Toronto", country: "ca", tier: "elite", offers: [CS, DS, ENG, BUS, BIO, HEA], levels: ["m", "b"] },
  { id: "ubc", name: "University of British Columbia", city: "Vancouver", country: "ca", tier: "elite", offers: [CS, DS, ENG, FIN, BIO, DES], levels: ["m", "b"] },
  { id: "waterloo", name: "University of Waterloo", city: "Waterloo", country: "ca", tier: "elite", offers: [CS, DS, ENG, FIN], levels: ["m", "b"] },
  { id: "mcgill", name: "McGill University", city: "Montreal", country: "ca", tier: "elite", offers: [CS, BUS, BIO, HEA], levels: ["m", "b"] },
  { id: "conestoga", name: "Conestoga College", city: "Kitchener", country: "ca", tier: "college", offers: [CS, DS, BUS, HOS, HEA, ENG], levels: ["pg"] },
  { id: "seneca", name: "Seneca Polytechnic", city: "Toronto", country: "ca", tier: "college", offers: [CS, DS, BUS, FIN, HOS], levels: ["pg"] },
  // United States
  { id: "mit", name: "Massachusetts Institute of Technology (MIT)", city: "Cambridge, MA", country: "us", tier: "elite", offers: [CS, DS, ENG, BUS, BIO], levels: ["m"] },
  { id: "stanford", name: "Stanford University", city: "Stanford, CA", country: "us", tier: "elite", offers: [CS, DS, ENG, BUS, DES], levels: ["m"] },
  { id: "harvard", name: "Harvard University", city: "Cambridge, MA", country: "us", tier: "elite", offers: [BUS, HEA, DS, BIO], levels: ["m"] },
  { id: "northeastern", name: "Northeastern University", city: "Boston", country: "us", tier: "standard", feeMult: 1.15, offers: [CS, DS, ENG, BUS, FIN, HEA], levels: ["m"] },
  { id: "asu", name: "Arizona State University", city: "Tempe", country: "us", tier: "standard", offers: [CS, DS, ENG, BUS, HOS, DES], levels: ["m", "b"] },
  { id: "usc", name: "University of Southern California", city: "Los Angeles", country: "us", tier: "standard", feeMult: 1.3, offers: [CS, DS, ENG, BUS, DES], levels: ["m", "b"] },
  { id: "nyu", name: "New York University", city: "New York", country: "us", tier: "standard", feeMult: 1.3, offers: [CS, DS, FIN, BUS, DES], levels: ["m", "b"] },
  { id: "iit-chicago", name: "Illinois Institute of Technology", city: "Chicago", country: "us", tier: "access", offers: [CS, DS, ENG], levels: ["m"] },
  // United Kingdom
  { id: "oxford", name: "University of Oxford", city: "Oxford", country: "uk", tier: "elite", offers: [CS, BUS, FIN, BIO], levels: ["m"] },
  { id: "cambridge", name: "University of Cambridge", city: "Cambridge", country: "uk", tier: "elite", offers: [CS, ENG, BUS, BIO], levels: ["m"] },
  { id: "imperial", name: "Imperial College London", city: "London", country: "uk", tier: "elite", offers: [CS, DS, ENG, HEA, BIO, BUS], levels: ["m"] },
  { id: "ucl", name: "University College London", city: "London", country: "uk", tier: "elite", offers: [CS, DS, DES, HEA, FIN], levels: ["m", "b"] },
  { id: "kcl", name: "King's College London", city: "London", country: "uk", tier: "standard", feeMult: 1.2, offers: [CS, DS, HEA, BUS], levels: ["m"] },
  { id: "manchester", name: "University of Manchester", city: "Manchester", country: "uk", tier: "standard", offers: [CS, DS, ENG, FIN, BUS, BIO], levels: ["m", "b"] },
  { id: "leeds", name: "University of Leeds", city: "Leeds", country: "uk", tier: "standard", offers: [CS, DS, BUS, FIN, DES], levels: ["m"] },
  { id: "coventry", name: "Coventry University", city: "Coventry", country: "uk", tier: "access", offers: [CS, DS, BUS, ENG, HEA, HOS], levels: ["m", "b"] },
  { id: "herts", name: "University of Hertfordshire", city: "Hatfield", country: "uk", tier: "access", offers: [CS, DS, BUS, HEA, FIN], levels: ["m"] },
  // Australia
  { id: "melbourne", name: "University of Melbourne", city: "Melbourne", country: "au", tier: "elite", offers: [CS, DS, ENG, BUS, BIO, DES], levels: ["m"] },
  { id: "monash", name: "Monash University", city: "Melbourne", country: "au", tier: "standard", feeMult: 1.1, offers: [CS, DS, ENG, BUS, HEA, BIO], levels: ["m", "b"] },
  { id: "unsw", name: "UNSW Sydney", city: "Sydney", country: "au", tier: "standard", feeMult: 1.15, offers: [CS, DS, ENG, FIN], levels: ["m", "b"] },
  { id: "sydney", name: "University of Sydney", city: "Sydney", country: "au", tier: "elite", offers: [DS, HEA, BUS, DES], levels: ["m"] },
  { id: "deakin", name: "Deakin University", city: "Melbourne", country: "au", tier: "access", offers: [CS, DS, BUS, HEA, HOS, ENG], levels: ["m", "b"] },
  // Germany
  { id: "tum", name: "Technical University of Munich", city: "Munich", country: "de", tier: "elite", offers: [CS, DS, ENG, BUS], levels: ["m"] },
  { id: "rwth", name: "RWTH Aachen University", city: "Aachen", country: "de", tier: "elite", offers: [CS, ENG, DS], levels: ["m"] },
  { id: "tu-berlin", name: "Technische Universität Berlin", city: "Berlin", country: "de", tier: "standard", offers: [CS, ENG, DES], levels: ["m"] },
  { id: "heidelberg", name: "Heidelberg University", city: "Heidelberg", country: "de", tier: "elite", offers: [BIO, HEA, DS], levels: ["m"] },
  // United Arab Emirates
  { id: "hw-dubai", name: "Heriot-Watt University Dubai", city: "Dubai", country: "ae", tier: "standard", offers: [CS, DS, BUS, FIN, ENG], levels: ["m", "b"] },
  { id: "mdx-dubai", name: "Middlesex University Dubai", city: "Dubai", country: "ae", tier: "access", offers: [CS, BUS, DES, HOS], levels: ["m", "b"] },
  { id: "uowd", name: "University of Wollongong in Dubai", city: "Dubai", country: "ae", tier: "standard", offers: [CS, BUS, FIN, ENG], levels: ["m", "b"] },
  { id: "manipal-dubai", name: "Manipal Academy of Higher Education Dubai", city: "Dubai", country: "ae", tier: "access", offers: [CS, BUS, BIO, DES, HOS], levels: ["m", "b"] },
  // Russia
  { id: "sechenov", name: "Sechenov University", city: "Moscow", country: "ru", tier: "standard", offers: [MED], levels: ["b"] },
  { id: "rudn", name: "RUDN University", city: "Moscow", country: "ru", tier: "standard", offers: [MED, BUS, CS], levels: ["b", "m"] },
  { id: "kazan", name: "Kazan Federal University", city: "Kazan", country: "ru", tier: "standard", offers: [MED, CS, ENG], levels: ["b", "m"] },
  // Kyrgyzstan
  { id: "ksma", name: "Kyrgyz State Medical Academy", city: "Bishkek", country: "kg", tier: "standard", offers: [MED], levels: ["b"] },
  { id: "osh", name: "Osh State University", city: "Osh", country: "kg", tier: "access", offers: [MED], levels: ["b"] },
  { id: "ism", name: "International School of Medicine", city: "Bishkek", country: "kg", tier: "access", offers: [MED], levels: ["b"] },
  // Ireland
  { id: "tcd", name: "Trinity College Dublin", city: "Dublin", country: "ie", tier: "elite", offers: [CS, DS, BUS, BIO, FIN], levels: ["m"] },
  { id: "ucd", name: "University College Dublin", city: "Dublin", country: "ie", tier: "standard", feeMult: 1.1, offers: [CS, DS, BUS, FIN, ENG, HEA], levels: ["m"] },
  { id: "galway", name: "University of Galway", city: "Galway", country: "ie", tier: "standard", offers: [CS, DS, BIO, ENG], levels: ["m"] },
  { id: "dcu", name: "Dublin City University", city: "Dublin", country: "ie", tier: "standard", offers: [CS, DS, BUS, FIN], levels: ["m"] },
  // France
  { id: "sorbonne", name: "Sorbonne University", city: "Paris", country: "fr", tier: "standard", offers: [CS, BIO, DES], levels: ["m"] },
  { id: "saclay", name: "Université Paris-Saclay", city: "Paris", country: "fr", tier: "standard", offers: [CS, DS, ENG, BIO], levels: ["m"] },
  { id: "hec", name: "HEC Paris", city: "Paris", country: "fr", tier: "elite", feeMult: 4, offers: [BUS, FIN], levels: ["m"] },
  { id: "essec", name: "ESSEC Business School", city: "Paris", country: "fr", tier: "elite", feeMult: 3.5, offers: [BUS, FIN, HOS, DS], levels: ["m"] },
  // New Zealand
  { id: "auckland", name: "University of Auckland", city: "Auckland", country: "nz", tier: "elite", offers: [CS, DS, ENG, BUS, HEA], levels: ["m", "b"] },
  { id: "otago", name: "University of Otago", city: "Dunedin", country: "nz", tier: "standard", offers: [HEA, BIO, BUS], levels: ["m", "b"] },
  { id: "vuw", name: "Victoria University of Wellington", city: "Wellington", country: "nz", tier: "standard", offers: [CS, DS, DES, FIN], levels: ["m"] },
  { id: "massey", name: "Massey University", city: "Palmerston North", country: "nz", tier: "access", offers: [BUS, HOS, ENG, DS], levels: ["m", "b"] },
  // Japan
  { id: "utokyo", name: "University of Tokyo", city: "Tokyo", country: "jp", tier: "elite", offers: [CS, ENG, DS, BIO], levels: ["m"] },
  { id: "kyoto", name: "Kyoto University", city: "Kyoto", country: "jp", tier: "elite", offers: [ENG, BIO, CS], levels: ["m"] },
  { id: "waseda", name: "Waseda University", city: "Tokyo", country: "jp", tier: "standard", feeMult: 1.6, offers: [BUS, CS, DES, FIN], levels: ["m", "b"] },
];

ABV.SCHOLARSHIPS = {
  ca: [{ name: "Lester B. Pearson International Scholarship", amount: "Full tuition (sample)", note: "University of Toronto, for outstanding school leavers." }, { name: "University entrance awards", amount: "CAD 2,000–10,000 (sample)", note: "Automatic for high marks at most universities." }],
  us: [{ name: "Fulbright-Nehru Master's Fellowship", amount: "Tuition and living (sample)", note: "For Indian professionals with work experience." }, { name: "University merit scholarships", amount: "USD 5,000–20,000 (sample)", note: "Considered with your application." }],
  uk: [{ name: "Chevening Scholarship", amount: "Full funding (sample)", note: "For future leaders, one-year master's." }, { name: "GREAT Scholarships", amount: "GBP 10,000 (sample)", note: "Offered through partner universities." }],
  au: [{ name: "Australia Awards", amount: "Full funding (sample)", note: "Government scholarship, limited places." }, { name: "Destination Australia", amount: "AUD 15,000 a year (sample)", note: "For study at regional campuses." }],
  de: [{ name: "DAAD Scholarship", amount: "EUR 934 a month (sample)", note: "For master's and PhD study." }, { name: "Deutschlandstipendium", amount: "EUR 300 a month (sample)", note: "Merit-based, after the first semester." }],
  ae: [{ name: "University merit scholarship", amount: "Up to 30% off tuition (sample)", note: "Based on your Class XII or degree marks." }],
  ru: [{ name: "Russian Government Scholarship", amount: "Full tuition (sample)", note: "Quota places, applied for through the embassy." }],
  kg: [{ name: "University fee concession", amount: "USD 500 a year (sample)", note: "For high NEET scores." }],
  ie: [{ name: "Government of Ireland International Education Scholarship", amount: "EUR 10,000 + fee waiver (sample)", note: "One year, for master's and PhD." }],
  fr: [{ name: "Charpak Scholarship", amount: "Monthly allowance (sample)", note: "For Indian students, from the French Embassy." }, { name: "Eiffel Excellence Scholarship", amount: "EUR 1,181 a month (sample)", note: "Master's in engineering, business, law and more." }],
  nz: [{ name: "Manaaki New Zealand Scholarship", amount: "Full funding (sample)", note: "Government scholarship for selected countries." }],
  jp: [{ name: "MEXT Scholarship", amount: "Tuition and monthly stipend (sample)", note: "Japanese government, through the embassy." }],
};

/* ---------- dummy programme generator ---------- */
(function () {
  var NAMES = {
    "computer-science": { m: "MSc Computer Science", b: "BSc Computer Science", pg: "PG Diploma in Information Technology" },
    "data-science": { m: "MSc Data Science & AI", b: "BSc Data Science", pg: "PG Diploma in Data Analytics" },
    business: { m: "MBA", b: "BBA", pg: "PG Diploma in Business Management" },
    engineering: { m: "MSc Mechanical Engineering", b: "BEng Civil Engineering", pg: "PG Diploma in Engineering Management" },
    finance: { m: "MSc Finance", b: "BSc Accounting & Finance", pg: "PG Diploma in Financial Planning" },
    medicine: { b: "MBBS (General Medicine)" },
    health: { m: "MSc Public Health", b: "BSc Nursing", pg: "PG Diploma in Healthcare Management" },
    biotech: { m: "MSc Biotechnology", b: "BSc Biomedical Sciences" },
    hospitality: { m: "MSc International Hospitality Management", b: "BA Hospitality & Tourism", pg: "PG Diploma in Hospitality Management" },
    design: { m: "MA Design", b: "BA Architecture" },
  };
  var ABOUT = {
    "computer-science": "Programming, algorithms, systems and cloud computing, with a final project.",
    "data-science": "Statistics, machine learning and data engineering, with a capstone for an employer.",
    business: "Strategy, finance, marketing and leadership, with live consulting projects.",
    engineering: "Design, analysis and manufacturing, with lab work and an industry project.",
    finance: "Corporate finance, investments and accounting, with tools used by banks and firms.",
    medicine: "Six years of medicine taught in English, with clinical rotations. NEET qualification needed.",
    health: "Healthcare systems, epidemiology and practice, with placements.",
    biotech: "Molecular biology, genetics and lab techniques, with a research project.",
    hospitality: "Hotel, travel and events management, with an industry placement.",
    design: "Studio-based design projects, from research to finished work.",
  };
  var SUBJECT_MULT = { "computer-science": 1.05, "data-science": 1.08, business: 1.0, engineering: 1.05, finance: 1.02, medicine: 1, health: 0.95, biotech: 1.0, hospitality: 0.9, design: 1.0 };
  var TIER = { elite: { mult: 1.35, pct: 80, ielts: 7.0 }, standard: { mult: 1, pct: 65, ielts: 6.5 }, access: { mult: 0.8, pct: 55, ielts: 6.0 }, college: { mult: 0.6, pct: 50, ielts: 6.0 } };
  var LEVEL = { m: "masters", b: "bachelors", pg: "pg-diploma" };
  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return ((h >>> 0) % 1000) / 1000; }
  function round(n) { var unit = n >= 100000 ? 10000 : n >= 10000 ? 500 : 100; return Math.max(unit, Math.round(n / unit) * unit); }
  // Intakes are the next start dates after today, so the data stays current whatever month it is.
  var NOW = new Date(), CUR_Y = NOW.getFullYear(), CUR_M = NOW.getMonth() + 1;
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function ym(m) { return (m > CUR_M ? CUR_Y : CUR_Y + 1) + "-" + pad(m); }
  function shift(start, months, day) {
    var y = Number(start.slice(0, 4)), m = Number(start.slice(5, 7)) + months;
    while (m <= 0) { m += 12; y -= 1; }
    return y + "-" + pad(m) + "-" + pad(day);
  }

  ABV.COUNTRIES.forEach(function (c) { c.intakes = c.months.map(function (m) { return MONTHS[m - 1]; }).join(", "); });

  // Flag code (flag-icons), flag colours for accents, and the usual route from Delhi (approximate).
  var EXTRA = {
    ca: { flag: "ca", colors: ["#d52b1e", "#d52b1e"], to: "YYZ", city: "Toronto", flight: "~14h", tz: "−10:30", language: "English and French" },
    us: { flag: "us", colors: ["#b22234", "#3c3b6e"], to: "JFK", city: "New York", flight: "~15h 30m", tz: "−10:30", language: "English" },
    uk: { flag: "gb", colors: ["#012169", "#c8102e"], to: "LHR", city: "London", flight: "~9h 30m", tz: "−5:30", language: "English" },
    au: { flag: "au", colors: ["#012169", "#e4002b"], to: "MEL", city: "Melbourne", flight: "~12h", tz: "+5:30", language: "English" },
    de: { flag: "de", colors: ["#000000", "#dd0000", "#ffce00"], to: "FRA", city: "Frankfurt", flight: "~8h 30m", tz: "−4:30", language: "German; many master's taught in English" },
    ae: { flag: "ae", colors: ["#00732f", "#000000", "#ff0000"], to: "DXB", city: "Dubai", flight: "~3h 30m", tz: "−1:30", language: "Arabic and English" },
    ru: { flag: "ru", colors: ["#0039a6", "#d52b1e"], to: "SVO", city: "Moscow", flight: "~6h", tz: "−2:30", language: "Russian; MBBS taught in English" },
    kg: { flag: "kg", colors: ["#e8112d", "#ffd700"], to: "FRU", city: "Bishkek", flight: "~3h", tz: "+0:30", language: "Kyrgyz and Russian; MBBS in English" },
    ie: { flag: "ie", colors: ["#169b62", "#ff883e"], to: "DUB", city: "Dublin", flight: "~11h with a stop", tz: "−5:30", language: "English" },
    fr: { flag: "fr", colors: ["#0055a4", "#ef4135"], to: "CDG", city: "Paris", flight: "~9h 30m", tz: "−4:30", language: "French; many master's taught in English" },
    nz: { flag: "nz", colors: ["#00247d", "#cc142b"], to: "AKL", city: "Auckland", flight: "~16h with a stop", tz: "+7:30", language: "English" },
    jp: { flag: "jp", colors: ["#bc002d", "#bc002d"], to: "NRT", city: "Tokyo", flight: "~8h", tz: "+3:30", language: "Japanese; English-taught programmes" },
  };
  ABV.COUNTRIES.forEach(function (c) { Object.assign(c, EXTRA[c.id]); });

  var out = [];
  ABV.UNIVERSITIES.forEach(function (u) {
    var c = ABV.COUNTRIES.find(function (x) { return x.id === u.country; });
    var t = TIER[u.tier];
    u.offers.forEach(function (subject) {
      u.levels.forEach(function (lv) {
        var name = NAMES[subject][lv];
        if (!name) return;
        if (subject === "medicine" && lv !== "b") return;
        if (u.country === "us") name = name.replace(/^MSc /, "MS ").replace(/^BSc /, "BS ");
        var id = u.id + "-" + subject + "-" + lv;
        var h = hash(id), h2 = hash(id + "x");
        var level = LEVEL[lv];
        var base = subject === "medicine" ? c.medicineFee : (c.fee[level] || c.fee.masters);
        var fee = c.flatFee ? base : round(base * t.mult * (u.feeMult || 1) * SUBJECT_MULT[subject] * (subject === "business" && lv === "m" ? 1.3 : 1) * (0.9 + h * 0.2));
        var yrs = subject === "medicine" ? 6 : lv === "pg" ? 1 : lv === "b" ? c.ugYears : c.pgYears;
        var months = c.months.slice(0, h2 < 0.55 ? 2 : 1).map(ym).sort();
        // Applications open 9 months before the start and close 1 to 3 months before it.
        var lead = 1 + Math.floor(h * 3);
        var windows = months.map(function (start) { return { start: start, opens: shift(start, -9, 1), closes: shift(start, -lead, 15) }; });
        var ielts = subject === "medicine" ? 6.0 : t.ielts;
        out.push({
          id: id, name: name, uni: u.id, subject: subject, level: level, fee: fee, years: yrs, intakes: months, windows: windows,
          req: { pct: Math.min(90, subject === "medicine" ? 60 : t.pct + Math.round(h2 * 6) - 2), ielts: ielts, toefl: { 6: 80, 6.5: 90, 7: 100 }[ielts], pte: { 6: 55, 6.5: 62, 7: 68 }[ielts] },
          overview: ABOUT[subject] + " Sample description for " + u.name + ".",
        });
      });
    });
  });
  ABV.PROGRAMMES = out;
})();
