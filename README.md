# Wydarzenia dla dzieci w Zurychu

Statyczna strona z wydarzeniami dla dzieci w wieku 2–8 lat (Oerlikon, Zurych, okolice i Winterthur). Interfejs jest po polsku. Cotygodniowa aktualizacja to edycja plików JSON — kod zostaje bez zmian.

Po publikacji strona jest pod adresem [https://nublogb.github.io/kids-events-zh/](https://nublogb.github.io/kids-events-zh/).

## Uruchomienie lokalne

```bash
npm install
npm test
npm run dev
```

Podgląd zbudowanej wersji (z tą samą ścieżką co GitHub Pages):

```bash
npm run build
npm run preview
```

## Jak zaktualizować wydarzenia

Edytuj tylko `public/events.json`, potem zrób commit i wypchnij na `main`. Workflow GitHub Actions zbuduje stronę i opublikuje ją na GitHub Pages.

Data w nagłówku („Ostatnia aktualizacja”) bierze się z pola `updatedAt`. Przy każdej zbiórce terminów ustaw je na dzień aktualizacji, w formacie `RRRR-MM-DD`.

### Pola wydarzenia

| Pole | Znaczenie |
| --- | --- |
| `dateText` | Tekst daty tak, jak ma go widzieć rodzic (z godziną, serią terminów albo dopiskiem „stale”). |
| `startDate` | Pierwszy dzień, `RRRR-MM-DD`. `null` dla zajęć stałych — trafiają do sekcji „Stałe zajęcia” i nie znikają z kalendarza. |
| `endDate` | Opcjonalny ostatni dzień. Bez tego pola wydarzenie znika dzień po `startDate`. Dla kursu albo kilku spektakli wpisz ostatni dzień, inaczej semestr zniknie tuż po starcie. |
| `title` | Nazwa. Link w karcie prowadzi do `url`. |
| `url` | Adres strony wydarzenia (`http` albo `https`). |
| `description` | Krótki opis: co się dzieje, cena, język. |
| `age` | Wiek tak, jak w źródle. Filtr 2–8 lat czyta widełki (`2–5 lat`, `od 4 lat`, `roczniki 2018–2020`). „Rodziny”, „wszyscy” i „brak info” zostają widoczne przy każdym wieku. Rocznik jest liczony względem roku z `startDate` (dziecko z rocznika 2018 w 2026 ma 8 lat). |
| `place` | Sala, adres albo dzielnica. |
| `area` | Jedno z: `Oerlikon`, `Zurych`, `Okolice`, `Winterthur`. |
| `category` | Jedno z: `teatr`, `muzyka`, `sport`, `zwierzęta/natura`, `warsztaty`, `biblioteka`, `campy/ferie`, `festyny`, `stałe`. Kategoria `stałe` jest tylko dla wpisów z `startDate: null`. |
| `registration` | Jak się zapisać. Gdy nie wiadomo, wpisz `brak info`. |
| `isNew` | `true` pokazuje plakietkę „Nowe”. Po kolejnej aktualizacji ustaw z powrotem `false`, chyba że wpis nadal jest nowy. |

Kolejność w pliku nie ma znaczenia: strona sortuje terminy rosnąco po `startDate`. Zajęcia stałe są alfabetycznie w osobnej sekcji.

Wpis jest ukrywany, gdy jego ostatni dzień (`endDate`, a gdy go nie ma — `startDate`) jest wcześniejszy niż dzisiejsza data w strefie Europy/Zurych. Dzień wydarzenia zostaje na liście.

Trzy daty w obecnym pliku są doprecyzowane względem źródła, bo sam opis ich nie podawał:

- Oerliker Singmüüs: 8 wtorków od 20.10.2026, więc `endDate` to 8.12.2026.
- Wildpflanzen Jahreskurs: kurs na 12 dni bez daty końca, więc zostaje na liście do 28.11.2027.
- Ferienkurse Sportamt: ferie zimowe szkół Stadt Zürich 15–26.02.2027.
- Räbeliächtli PLATZ: „listopad 2026” bez dnia, więc `startDate` to 30.11.2026 i wpis widać przez cały listopad.

## Źródła

Zakładka „Źródła” czyta `public/sources.json`. Każda sekcja ma `title`, `intro` i listę `items` z polami `name`, `detail` oraz `links` (`label`, `url`).

## Publikacja

Workflow `.github/workflows/deploy.yml` na pushu do `main` uruchamia testy, buduje Vite z `base` `/kids-events-zh/` i wgrywa katalog `dist` na GitHub Pages.

W repozytorium, w **Settings → Pages → Build and deployment → Source**, musi być wybrane **GitHub Actions**. Bez tego workflow zbuduje stronę, ale Pages jej nie pokaże.
