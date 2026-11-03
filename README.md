# Abroadversity prototype

Live: https://abhi1999-eng.github.io/abroadversity-prototype/

Static HTML, CSS and JS for the new student journey: home finder → programme list → programme page with the eligibility check, plus a country page. Country, university and scholarship names are real; fees, scores and dates are dummy data generated in `assets/js/data.js`.

Run it:

```bash
python3 serve.py
```

Then open http://localhost:5500.

- `assets/css/styles.css`: the theme (tokens at the top)
- `assets/js/data.js`: subjects, levels, countries, universities, programmes
- `assets/js/app.js`: header/footer, programme card, and one init per page
