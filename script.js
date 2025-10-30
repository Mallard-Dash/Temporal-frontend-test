document.addEventListener("DOMContentLoaded", () => {

    // --- Konfiguration ---
    const steps = [
        { id: "step-1", name: "Order Mottagen" },
        { id: "step-2", name: "Betalning OK" },
        { id: "step-3", name: "Lagerallokering" },
        { id: "step-4", name: "Paketerad (Fabrik)" },
        { id: "step-5", name: "Transport Påbörjad" },
        { id: "step-6", name: "Tullklarering" },
        { id: "step-7", name: "Lokal Leverans" },
        { id: "step-8", name: "Levererad" }
    ];
    const scenarios = {
        "ESTONIA_OK": { name: "The 'EU Standard' Box", price: "99" },
        "CHINA_CUSTOMS_FAIL": { name: "The 'Far East' Box", price: "199" },
        "ESTONIA_FAIL_REROUTE": { name: "The 'Volatile Stock' Box", price: "149" },
        "CHINA_CRISIS_FAIL": { name: "The 'High Risk' Box", price: "499" }
    };
    const BASE_DATE = new Date(); // Startdatum för alla beräkningar

    // --- State-nycklar (Vår "Temporal Database") ---
    const STATE_KEY = "workflow_step";
    const FAILED_KEY = "workflow_has_failed";
    const SCENARIO_KEY = "workflow_scenario";
    const PATH_KEY = "workflow_path";
    const WAITING_KEY = "workflow_waiting_human"; // NY! För att veta om modalen ska visas

    // --- Element-referenser ---
    const views = {
        config: document.getElementById("config-view"),
        checkout: document.getElementById("checkout-view"),
        workflow: document.getElementById("workflow-view")
    };
    const logOutput = document.getElementById("log-output");
    const retryButton = document.getElementById("retryButton");
    const resetButton = document.getElementById("resetButton");
    const deliveryDateEl = document.getElementById("delivery-date");
    
    // Modal-element
    const modalOverlay = document.getElementById("intervention-modal-overlay");
    const confirmInterventionButton = document.getElementById("confirm-intervention-button");

    // --- Helper-funktioner ---

    function showView(viewId) {
        for (const key in views) {
            views[key].style.display = (key === viewId) ? "block" : "none";
        }
    }
    
    // Uppdaterad logg-funktion för att hantera specialklasser
    function log(message, type = 'info') {
        let prefix = "ℹ️";
        if (type === 'success') prefix = "✅";
        if (type === 'error') prefix = "❌";
        if (type === 'warn') prefix = "⚠️";
        
        const logEntry = document.createElement('div');
        logEntry.className = 'log-entry';
        logEntry.textContent = `[${new Date().toLocaleTimeString()}] ${prefix} ${message}`;
        if(type === 'suggestion') {
            logEntry.classList.add('log-suggestion');
        }
        
        logOutput.prepend(logEntry);
    }

    // NY! Funktion för affärsförslag
    function logBusinessSuggestion(cost, solution) {
        log(`Affärsförslag genererat baserat på manuell åtgärd:`, 'suggestion');
        const message = `
FÖRSLAG: Det valda alternativet (${solution}) ökade kostnaden med ${cost}%.
För framtida "High Risk"-ordrar, överväg att automatiskt erbjuda kunden två val i kassan:
1. Standard (Långsam/Billig): Vänta på osäker Kina-transport (Est. 30-45 dagar).
2. Premium (Snabb/Dyr): Garanterad leverans från ${solution} (Est. 2-5 dagar) för +${cost}%.
Detta flyttar kostnadsbeslutet till kunden och säkrar marginalen.`;
        
        const logEntry = document.createElement('div');
        logEntry.className = 'log-entry log-suggestion';
        logEntry.style.whiteSpace = "pre-wrap";
        logEntry.style.fontFamily = "monospace";
        logEntry.textContent = message;
        logOutput.prepend(logEntry);
    }

    function simulateActivity(duration) {
        return new Promise(resolve => setTimeout(resolve, duration));
    }

    // NY! Funktion för att formatera datum
    function formatDate(date) {
        return date.toLocaleDateString("sv-SE", {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });
    }

    // NY! Funktion för att uppdatera leveransdatum
    function updateDeliveryDate(daysToAdd) {
        const newDate = new Date(BASE_DATE.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
        localStorage.setItem("delivery_date", newDate.toISOString());
        deliveryDateEl.textContent = formatDate(newDate);
        return newDate;
    }

    function updateUI(currentStepIndex, state = 'active') {
        steps.forEach((step, index) => {
            const el = document.getElementById(step.id);
            if (!el) return;
            el.classList.remove("active", "completed", "error", "warning");

            if (index < currentStepIndex) {
                el.classList.add("completed");
            } else if (index === currentStepIndex) {
                el.classList.add(state);
            }
        });
    }

    // --- Kärnlogik ---

    /**
     * HUVUD-LOGIK: Kör ett steg i arbetsflödet
     */
    async function runStep(stepIndex) {
        if (stepIndex >= steps.length) {
            log("Arbetsflöde slutfört! Din Mysterybox är levererad.", "success");
            retryButton.style.display = "none";
            clearWorkflowState(false);
            return;
        }

        const currentStep = steps[stepIndex];
        const scenario = sessionStorage.getItem(SCENARIO_KEY);
        let path = localStorage.getItem(PATH_KEY);
        let hasFailed = localStorage.getItem(FAILED_KEY) === 'true';

        log(`▶️ Startar steg: ${currentStep.name}...`);
        updateUI(stepIndex, 'active');
        localStorage.setItem(STATE_KEY, stepIndex.toString());

        try {
            await simulateActivity(1500);

            // --- Steg-specifik logik ---
            switch (stepIndex) {
                case 0: // Order Mottagen
                    updateDeliveryDate(14); // Standardestimat
                    break;
                case 2: // Lagerallokering
                    log("Allokerar lager...");
                    if (path) {
                        log(`Använder befintlig allokering: ${path}`, 'warn');
                    } else if (scenario === "ESTONIA_FAIL_REROUTE" && !hasFailed) {
                        path = "ESTONIA";
                        log("Försöker allokera från Estland (EU)...");
                    } else if (scenario === "ESTONIA_OK") {
                        path = "ESTONIA";
                        log("Hittade lager i Estland (EU). Leverans uppdaterad.");
                        updateDeliveryDate(7); // Snabbare
                    } else {
                        path = "CHINA";
                        log("Hittade lager i Kina. Leverans uppdaterad.");
                        updateDeliveryDate(30); // Långsammare
                    }
                    localStorage.setItem(PATH_KEY, path);
                    break;

                case 3: // Paketering
                    log(`Paketeras på fabrik i ${path}...`);
                    if (scenario === "ESTONIA_FAIL_REROUTE" && path === "ESTONIA" && !hasFailed) {
                        await simulateActivity(1000);
                        localStorage.setItem(FAILED_KEY, 'true');
                        throw new Error("Lagerfel i Estland: Varan slut i lager.");
                    }
                    break;

                case 4: // Transport
                    log(`Transport påbörjad från ${path}...`);
                    if (scenario === "CHINA_CRISIS_FAIL" && path === "CHINA" && !hasFailed) {
                        await simulateActivity(2000);
                        localStorage.setItem(FAILED_KEY, 'true');
                        throw new Error("Geopolitisk kris: Transportväg blockerad. Kräver manuell åtgärd.");
                    }
                    break;

                case 5: // Tullklarering
                    if (path === "ESTONIA" || path === "GERMANY" || path === "SWEDEN") {
                        log("Skippar tull (EU-intern transport).");
                        updateUI(stepIndex, 'completed');
                        runStep(stepIndex + 1);
                        return;
                    }
                    
                    log("Hanteras av tull (Import från Kina/Vietnam)...");
                    updateDeliveryDate(parseInt(localStorage.getItem("delivery_date_days") || 30) + 7); // Tull lägger på 7 dagar
                    if (scenario === "CHINA_CUSTOMS_FAIL" && !hasFailed) {
                        await simulateActivity(1000);
                        localStorage.setItem(FAILED_KEY, 'true');
                        throw new Error("Tullproblem: Saknar dokumentation.");
                    }
                    break;
            }
            
            // --- STEGET LYCKADES ---
            log(`✔️ Slutförde steg: ${currentStep.name}`);
            updateUI(stepIndex, 'completed');
            runStep(stepIndex + 1);

        } catch (error) {
            // --- STEGET MISSLYCKADES ---
            log(`❌ FEL: ${error.message}`, 'error');
            
            // Hantera KRITISKT FEL (Krig/Blockad)
            if (scenario === "CHINA_CRISIS_FAIL") {
                log("🛑 FLÖDET KAN INTE ÅTERUPPTAS.", 'error');
                log("Eskalerar till manuell hantering (simulerat mail skickat)...", 'warn');
                log("Väntar på mänsklig input...", 'warn');
                updateUI(stepIndex, 'error');
                localStorage.setItem(WAITING_KEY, 'true'); // Sätt "väntar"-flaggan
                modalOverlay.style.display = "flex"; // Visa modalen!
            } 
            // Hantera Omdirigerings-felet
            else if (scenario === "ESTONIA_FAIL_REROUTE") {
                log("🛑 Omdirigering krävs. Status sparad.", 'warn');
                log("Klicka på 'Försök igen' för att allokera från ny fabrik.", 'info');
                updateUI(stepIndex, 'warning');
                retryButton.style.display = "inline-block";
            }
            // Hantera vanliga, "försök igen"-fel
            else {
                log("🛑 Arbetsflöde avbrutet. Status sparad.", 'error');
                log("Klicka på 'Försök igen' för att återuppta.", 'info');
                updateUI(stepIndex, 'error');
                retryButton.style.display = "inline-block";
            }
        }
    }

    /**
     * Startar/Återupptar flödet (vid knapptryck)
     */
    function startWorkflow() {
        log("Initierar arbetsflöde...");
        retryButton.style.display = "none";
        
        const savedStepIndex = localStorage.getItem(STATE_KEY);
        const scenario = sessionStorage.getItem(SCENARIO_KEY);
        
        if (savedStepIndex) {
            // --- ÅTERUPPTA FLÖDE ---
            const stepIndex = parseInt(savedStepIndex);
            log(`Återupptar från sparat tillstånd (steg ${stepIndex + 1})...`, 'warn');
            
            if (scenario === "ESTONIA_FAIL_REROUTE" && stepIndex === 3) {
                log("Omdirigerar flöde: Spolar tillbaka till 'Lagerallokering'.", 'warn');
                localStorage.setItem(STATE_KEY, "2");
                localStorage.setItem(PATH_KEY, "CHINA"); // Tvinga Kina-vägen
                localStorage.removeItem(FAILED_KEY); // Nollställ felet!
                updateDeliveryDate(30); // Sätt Kina-datum
                runStep(2);
                return;
            }

            // Vanligt "Försök igen" (t.ex. Tull)
            localStorage.removeItem(FAILED_KEY); // Nollställ felet
            runStep(stepIndex);

        } else {
            // --- NYTT FLÖDE ---
            log("Startar nytt arbetsflöde från början...");
            clearWorkflowState(false);
            runStep(0);
        }
    }

    /**
     * NY! Hanterar "Signal" från modalen
     */
    function resumeWithManualInput() {
        modalOverlay.style.display = "none"; // Dölj modalen
        
        const selectedSolution = document.querySelector('input[name="solution"]:checked');
        const solutionPath = selectedSolution.value;
        const costIncrease = selectedSolution.dataset.cost;
        const deliveryDays = parseInt(selectedSolution.dataset.days);

        log(`Signal 'forceReroute' mottagen! Vald lösning: ${solutionPath}.`, 'warn');

        // Visa affärsförslaget
        logBusinessSuggestion(costIncrease, solutionPath);

        // Uppdatera state
        localStorage.setItem(PATH_KEY, solutionPath);
        localStorage.setItem(STATE_KEY, "6"); // Hoppa över tull och gå till Lokal Leverans
        localStorage.removeItem(FAILED_KEY);
        localStorage.removeItem(WAITING_KEY);

        // Uppdatera leveransdatum
        log(`Leveransdatum omberäknat baserat på ${solutionPath}.`, 'info');
        updateDeliveryDate(deliveryDays);

        // Återuppta flödet från steg 6 (index 6)
        runStep(6);
    }

    function clearWorkflowState(fullReset = true) {
        localStorage.removeItem(STATE_KEY);
        localStorage.removeItem(FAILED_KEY);
        localStorage.removeItem(PATH_KEY);
        localStorage.removeItem(WAITING_KEY);
        localStorage.removeItem("delivery_date");
        if (fullReset) {
            sessionStorage.removeItem(SCENARIO_KEY);
        }
    }

    function resetWorkflow() {
        log("Återställer simulering...");
        clearWorkflowState(true);
        
        retryButton.style.display = "none";
        modalOverlay.style.display = "none";
        logOutput.innerHTML = "";
        log("Väntar på att starta...");
        updateUI(-1);
        deliveryDateEl.textContent = "...";
        
        showView("config");
    }

    // --- Event Listeners ---
    
    // Vy 1: Config
    document.getElementById("config-form").addEventListener("submit", (e) => {
        e.preventDefault();
        const selectedRadio = document.querySelector('input[name="scenario"]:checked');
        const scenarioId = selectedRadio.value;
        const scenarioInfo = scenarios[scenarioId];
        
        sessionStorage.setItem(SCENARIO_KEY, scenarioId);

        document.getElementById("product-name-summary").textContent = scenarioInfo.name;
        document.getElementById("product-price-summary").textContent = scenarioInfo.price + " kr";
        document.getElementById("product-price-total").textContent = scenarioInfo.price + " kr";
        
        showView("checkout");
    });

    // Vy 2: Kassa
    document.getElementById("pay-button").addEventListener("click", () => {
        if (document.getElementById("checkout-form").checkValidity()) {
            showView("workflow");
            startWorkflow();
        } else {
            alert("Vänligen fyll i alla fält.");
        }
    });

    // Vy 3: Kontroller
    retryButton.addEventListener("click", startWorkflow);
    resetButton.addEventListener("click", resetWorkflow);
    
    // Vy 4: Modal
    confirmInterventionButton.addEventListener("click", resumeWithManualInput);


    // --- Initiering vid sidladdning ---
    function initialize() {
        const activeStep = localStorage.getItem(STATE_KEY);
        const isWaiting = localStorage.getItem(WAITING_KEY) === 'true';

        if (activeStep) {
            // Vi har ett pågående flöde!
            log("Upptäckte ett pågående arbetsflöde.", 'warn');
            showView("workflow");
            const stepIndex = parseInt(activeStep);
            updateUI(stepIndex);
            
            // Uppdatera sparat leveransdatum
            const savedDate = localStorage.getItem("delivery_date");
            if (savedDate) {
                deliveryDateEl.textContent = formatDate(new Date(savedDate));
            }

            if (isWaiting) {
                // VIKTIGT: Flödet är pausat och väntar på människa
                log("Flödet är pausat och väntar på mänsklig input.", 'error');
                updateUI(stepIndex, 'error');
                modalOverlay.style.display = "flex"; // Visa modalen direkt
            } else if (localStorage.getItem(FAILED_KEY) === 'true') {
                // Flödet har felat men kan startas om (t.ex. tull)
                log("Flödet har tidigare misslyckats. Klicka 'Försök igen'.", 'error');
                updateUI(stepIndex, 'error');
                retryButton.style.display = "inline-block";
            } else {
                // Flödet pausades men hade inte felat (t.ex. stängde fliken)
                log("Återupptar automatiskt...");
                runStep(stepIndex);
            }
        } else {
            // Ren start
            showView("config");
        }
    }

    initialize();
});