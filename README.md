# Pixel Space Assault

> **GAME FULLY AI GENERATED**

Pixel Space Assault to responsywna, pixelowa gra typu space shooter uruchamiana
bezpośrednio w przeglądarce. Pilotujesz statek, niszczysz przeciwników, zbierasz
coiny i ulepszenia oraz walczysz z bossem na końcu każdego levelu.

## Funkcje

- 5 stages po 5 levels, czyli łącznie 25 leveli.
- Boss na końcu każdego levelu.
- Rosnąca trudność i trzy typy zwykłych przeciwników.
- HP, score, coiny i zapis rekordów.
- Ulepszenia działające jednocześnie: Multi Shot (`M`), Auto Aim (`A`),
  Rapid Fire (`R`) oraz Heal (`+`).
- Sklep z kategoriami Starting Weapons, Skins i Support Ships.
- Stany przedmiotów `LOCKED`, `OWNED` i `EQUIPPED`.
- Statystyki oraz stan sklepu zapisywane przez `localStorage`.
- Responsywny Canvas o stałej wewnętrznej rozdzielczości 800×600.

## Sterowanie — komputer

- Strzałki lub `WASD`: ruch statku.
- Spacja: strzelanie.
- Mysz: przytrzymaj przycisk na planszy i przesuwaj kursor, aby poruszać się
  i jednocześnie strzelać.
- `Escape`: powrót do menu głównego.

## Sterowanie — telefon i tablet

Przytrzymaj palec na planszy i przesuwaj go. Statek podąża za palcem i strzela,
dopóki ekran pozostaje wciśnięty. Interfejs używa Pointer Events, dlatego ta
sama obsługa działa dla myszy, dotyku i rysika.

## Struktura projektu

```text
pixel-space-assault/
├── index.html
├── css/
│   └── style.css
├── js/
│   └── game.js
├── README.md
└── .gitignore
```

## Uruchomienie lokalne

Nie trzeba niczego instalować ani budować. Otwórz `index.html` w nowoczesnej
przeglądarce internetowej.

Postęp, statystyki i zakupione przedmioty są zapisywane lokalnie dla adresu,
pod którym działa gra. Wyczyszczenie danych witryny usuwa ten zapis.

## Technologie i prywatność

Projekt używa wyłącznie HTML, CSS, vanilla JavaScript i HTML Canvas. Nie używa
zewnętrznych bibliotek, frameworków, CDN, fontów, assetów, API ani usług
sieciowych. Gra nie wysyła danych poza przeglądarkę.

## GitHub Pages

Po wysłaniu repozytorium na GitHub można opublikować grę bez procesu budowania:

1. Otwórz `Settings` → `Pages` w repozytorium.
2. Wybierz `Deploy from a branch`.
3. Wybierz branch z projektem oraz katalog `/(root)`.
4. Zapisz ustawienia i poczekaj na zakończenie publikacji.

## Future Features

- Działanie zakupionych broni, skinów i statków wsparcia.
- Więcej typów przeciwników i bossów.
- Efekty dźwiękowe i muzyka z lokalnych, własnych assetów.
- Ekran ustawień i możliwość zmiany sterowania.
- Pauza i obsługa gamepada.
- Lepsze efekty wizualne, animacje i balans rozgrywki.
- Eksport i import lokalnego zapisu.
