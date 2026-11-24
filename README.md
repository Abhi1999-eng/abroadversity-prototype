# Abroadversity demo

Live: https://demo.abroadversity.com/ (start at `demo.html`)

Static HTML, CSS and JS. One student journey, seen from five sides that share the same data:

| Side | Page | What it does |
| --- | --- | --- |
| Website | `index.html`, `programmes.html`, `programme.html`, `country.html`, `universities.html`, `stays.html` | Find a programme, check eligibility (creates a lead), browse universities and rooms |
| Student | `student.html` | Progress tracker, documents, offer, room, visa steps, messages |
| Counsellor | `counsellor.html` | Leads inbox by stage and waiting time: contact, submit, refer for visa, enrol |
| University | `university.html` | Review applications and send offers; edit fees and pause intakes (the website updates) |
| Visa consultant | `consultant.html` | Visa files referred by counsellors, step by step |
| Stays partner | `accommodation.html` | Confirm room requests; edit rent and availability |

There is no sign-in: every side has a "Viewing as" switch, and the demo bar at the top links them all. `demo.html` walks through the whole flow in seven steps.

Country, university and scholarship names are real. Fees, scores, dates, students, counsellors, consultants and stays partners are dummy data. The shared data lives in the browser's localStorage, so open two tabs side by side to watch a change arrive; "Reset demo" restores the seed.

Run it:

```bash
python3 serve.py
```

Then open http://localhost:5500/demo.html.

- `assets/css/styles.css`: the theme (tokens at the top), then the portal styles
- `assets/js/data.js`: subjects, levels, countries, universities, programmes
- `assets/js/store.js`: the shared demo data, its seed, and every action (lead, offer, booking, visa step)
- `assets/js/portal.js`: the student, counsellor, university, consultant and stays pages
- `assets/js/app.js`: header/footer, demo bar, programme card, and the public pages
