# Wydarzenia dla dzieci w Zurychu

Statyczna strona z wydarzeniami dla dzieci w wieku 2–8 lat (Oerlikon, Zurych, okolice i Winterthur). Interfejs jest po polsku. Cotygodniowa aktualizacja to edycja `public/events.json`. Nowy plik zdjęcia dokładamy tylko wtedy, gdy wydarzenie dostaje własną fotografię — istniejący obrazek z `public/images/` wystarczy podmienić w JSON.

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
| `age` | Wiek tak, jak w źródle. |
| `ageMin`, `ageMax` | Najmłodszy i najstarszy wiek, który pasuje do `age`. `null` i `null` znaczy „każdy wiek” (rodziny, wszyscy, brak info) i zostaje przy obu filtrach wieku. `ageMax: null` przy liczbie w `ageMin` znaczy „od tego wieku w górę”. Przy zmianie `age` popraw też te dwie liczby: filtr czyta je, nie zgaduje od nowa. Rocznik jest liczony względem roku z `startDate` (dziecko z rocznika 2018 w 2026 ma 8 lat). |
| `place` | Sala, adres albo dzielnica. |
| `lat`, `lng` | Współrzędne WGS84 pinezki na mapie (Leaflet, kafelki OpenStreetMap, bez klucza API). Widok startowy to Zurych-Oerlikon. |
| `image` | Ścieżka względem `public/`, na przykład `images/tonhalle.jpg`. Strona nie podlinkowuje cudzych adresów: plik leży w repozytorium. |
| `area` | Jedno z: `Oerlikon`, `Zurych`, `Okolice`, `Winterthur`. |
| `category` | Jedno z: `teatr`, `muzyka`, `sport`, `zwierzęta/natura`, `warsztaty`, `biblioteka`, `campy/ferie`, `festyny`, `stałe`. Kategoria `stałe` jest tylko dla wpisów z `startDate: null`. |
| `registration` | Jak się zapisać. Gdy nie wiadomo, wpisz `brak info`. |
| `isNew` | `true` pokazuje plakietkę „Nowe”. Po kolejnej aktualizacji ustaw z powrotem `false`, chyba że wpis nadal jest nowy. |

Kolejność w pliku nie ma znaczenia: strona sortuje terminy rosnąco po `startDate`. Zajęcia stałe są alfabetycznie w osobnej sekcji.

### Mapa i zdjęcia

Każde wydarzenie ma pinezkę. Kolor i ikona biorą się z kategorii, a gęste miejsca (na przykład kilka spektakli w Theater Stadelhofen) zwijają się w klastry. Kliknięcie pinezki podświetla kartę na liście, kliknięcie karty przybliża mapę. Filtr „Tylko widoczny obszar mapy” zostawia na liście i na mapie tylko to, co jest w kadrze. Na wąskim ekranie przełącznik „Lista / Mapa” pokazuje jedną z tych części.

Filtr daty liczy się według kalendarza Europy/Zurych, a tydzień zaczyna się w poniedziałek. „Ten tydzień” trwa od dziś do najbliższej niedzieli, „Ten weekend” od piątku do niedzieli tego tygodnia (w sobotę i niedzielę: od dziś do niedzieli), „Następny tydzień” to kolejny poniedziałek–niedziela, „Następny miesiąc” to cały następny miesiąc kalendarzowy. Wydarzenie wielodniowe zostaje, gdy jego zakres nachodzi na wybrany. Zajęcia stałe, bez `startDate`, widać przy „Wszystkie daty”.

Ikona kalendarza na karcie otwiera Google Calendar albo pobiera plik `.ics` (Apple / iCal). Godziny biorą się z `dateText`, gdy da się je odczytać dla jednego dnia. Kurs na wiele dni trafia do kalendarza jako wydarzenie całodniowe, a godziny zostają w opisie. Strefa to Europa/Zurych.

Zdjęcie karty to `image`. Najpierw bierzemy fotografię ze strony wydarzenia (`og:image` albo główne zdjęcie treści) i zapisujemy ją w `public/images/`. Gdy strona jej nie ma, wstawiamy ilustrację dopasowaną do tematu, też zapisaną w repozytorium: książki, lodowisko, scena, zwierzęta, instrumenty, rękodzieło, boisko. Logo organizatora nie zastępuje zdjęcia.

Kilka pinezek jest przybliżeniem, bo źródło nie podaje jednej sali:

- Wildpflanzen Jahreskurs (`różne tereny zielone w Zurychu`) stoi w Irchelparku.
- Ferienkurse Sportamt (`różne`) stoją przy biurze Sportamt, Werdstrasse 75.
- Piłka nożna (`Sihlfeld / Steinkluppe / Hardhof`) stoi przy Sihlfeldstrasse.
- Simply Theatre stoi przy Gladbachstrasse 119.

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
