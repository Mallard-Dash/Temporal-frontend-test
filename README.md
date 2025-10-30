🔮 Mysteryboxes Inc. - Simulering av Global Logistik
Repo för Chas Academy AI-Assisted Workflow Coding Hackathon (Temporal & bluetext)

Detta projekt är en interaktiv frontend-applikation (HTML/CSS/JavaScript) som simulerar ett komplext, globalt logistikflöde. Syftet är att visuellt demonstrera kraften i stateful och resilienta arbetsflöden, koncept som är centrala för Temporal och bluetext.

Applikationen simulerar ett fiktivt företag, "Mysteryboxes Inc.", och låter användaren se hur olika typer av fel—från enkla nätverksfel till geopolitiska kriser—kan hanteras elegant utan att hela processen kraschar.

🚀 Instruktioner & Körning
Detta är ett rent frontend-projekt och kräver ingen backend eller kompilering.

Klona repot:

Bash

git clone https://github.com/Mallard-Dash/Temporal-frontend-test.git
Öppna index.html:

Det enklaste sättet är att navigera till mappen och dubbelklicka på index.html för att öppna den i din webbläsare.

För bästa upplevelse (särskilt för utveckling), använd en live server-tillägg i din IDE (t.ex. "Live Server" i VS Code).

🗺️ Det Simulerade Flödet
Själva orderprocessen är uppdelad i 8 visuella steg. Beroende på valt scenario kommer flödet att ta olika vägar, hoppa över steg, eller misslyckas på specifika punkter.

📦 Order Mottagen

💳 Betalning OK

🗺️ Lagerallokering (Här bestäms om varan ska skickas från Estland eller Kina)

🏭 Paketerad (Fabrik)

✈️ Transport Påbörjad

🛂 Tullklarering (Hoppas över för EU-interna sändningar)

🚚 Lokal Leverans

🏠 Levererad

🎭 Scenarier & Demonstrerade Koncept
Detta är kärnan i demonstrationen. Vid start väljer användaren ett av fyra scenarier som representerar olika logistiska utmaningar.

1. 🇪🇺 The "EU Standard" Box (Lyckat Flöde)
Vad händer: Allt fungerar perfekt.

Logik: Flödet väljer PATH: ESTONIA (Estland) i steg 3.

Händelse: I steg 6 (Tull) känner flödet av att PATH är inom EU och hoppar automatiskt över steget. Leveransdatumet sätts till ett tidigt datum.

Temporal-koncept: Förgrening (Branching Logic). Ett if/else-block i arbetsflödet (if path === "ESTONIA" ...).

2. 🌏 The "Far East" Box (Enkelt Fel & Retry)
Vad händer: Varan fastnar i tullen på grund av ett "simulerat nätverksfel".

Logik: Flödet väljer PATH: CHINA.

Händelse: Flödet misslyckas på steg 6 (Tull) och ett felmeddelande visas. "Försök igen"-knappen dyker upp.

Lösning: Användaren klickar på "Försök igen". Flödet återupptas exakt på steg 6, men vår simulerade logik (FAILED_KEY) ser att detta är försök #2 och låter det lyckas.

Temporal-koncept: Återförsök (Retries) och Resiliens. Flödet kraschar inte, det bara pausas och återupptas från samma punkt.

3. 🔄 The "Volatile Stock" Box (Avancerat Fel & Omdirigering)
Vad händer: Lagersaldot i Estland är 0 när ordern ska paketeras.

Logik: Flödet väljer optimistiskt PATH: ESTONIA.

Händelse: Flödet misslyckas på steg 4 (Paketering) med felet "Slut i lager".

Lösning: Användaren klickar "Försök igen". Nu händer magin: startWorkflow-funktionen ser att det är ett lagerfel. Istället för att bara försöka igen (vilket skulle misslyckas), "spolar den tillbaka" flödet till steg 3 (Allokering) och tvingar PATH till CHINA.

Temporal-koncept: Avancerad Felhantering. Ett fel på ett spår leder till att flödet automatiskt backar och väljer ett helt annat spår. Detta är omöjligt i traditionella system utan extremt komplex "state"-hantering.

4. 🚨 The "High Risk" Box (Kritiskt Fel & Mänsklig Input)
Vad händer: En geopolitisk kris blockerar transportvägen från Kina. Felet kan inte lösas automatiskt.

Logik: Flödet väljer PATH: CHINA.

Händelse: Flödet misslyckas på steg 5 (Transport). Systemet loggar ett kritiskt fel, sätter status till WAITING_KEY och pausar flödet på obestämd tid.

Lösning (Simulerad): En modal dyker upp, vilket simulerar ett e-postlarm/Slack-meddelande till logistik-teamet. En människa måste nu välja en av tre lösningar (Sverige, Tyskland, Vietnam).

Återupptagning: När människan klickar "Verkställ", skickas en Signal (simulerat) till det pausade flödet. Flödet vaknar, tar emot den nya datan (t.ex. PATH: SWEDEN), uppdaterar leveransdatumet, och hoppar direkt till steg 7 (Lokal Leverans).

Temporal-koncept: Human-in-the-Loop och Signaler. Detta är Temporals absoluta styrka: att kunna pausa ett arbetsflöde i dagar, veckor eller månader i väntan på extern input (en signal) och sedan återuppta det intelligent.

🛠️ Teknisk Djupdykning: Hur "Magin" Simulerats
Eftersom vi inte har en riktig Temporal-server, simulerar vi dess beteende med hjälp av webbläsarens inbyggda lagring:

Simulerad "Temporal Server" (Databas): localStorage

Här sparas allt uthålligt tillstånd (state) som måste överleva en sidomladdning eller krasch.

STATE_KEY: Vilket steg är vi på? (t.ex. 5)

PATH_KEY: Vilken logisk gren följer vi? (t.ex. CHINA)

FAILED_KEY: Har ett fel inträffat (för retry-logik)?

WAITING_KEY: Väntar flödet på mänsklig input?

Simulerad "Workflow Definition": runStep(stepIndex)-funktionen

Detta är vår switch...case-statssida som innehåller all affärslogik, felhantering och förgreningar för varje steg i flödet.

Simulerad "Signal" (Human Input): resumeWithManualInput()-funktionen

Detta är vår "callback" som anropas när modal-fönstret stängs. Den agerar som en signal som "knackar på" det pausade flödet och ger det ny data för att fortsätta.

Simulerad "Activity": simulateActivity()-funktionen

En enkel Promise med en setTimeout som simulerar asynkront arbete (t.ex. API-anrop, databas-skrivningar).

Mallard-Dash 2025