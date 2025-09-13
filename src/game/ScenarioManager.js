export class ScenarioManager {
    constructor(scene) {
        this.scene = scene;
        this.scenarios = [];
        this.clients = [];
        this.usedScenarios = new Set();
        this.loadScenarios();
    }

    loadScenarios() {
        // Load scenarios from cache (loaded in Preloader)
        if (this.scene && this.scene.cache.json.has('scenarios')) {
            const scenariosData = this.scene.cache.json.get('scenarios');
            this.scenarios = scenariosData.scenarios;
            this.clients = scenariosData.clients;
        }
    }

    // Get a random scenario that hasn't been used yet
    getRandomScenario() {
        const availableScenarios = this.scenarios.filter(scenario => 
            !this.usedScenarios.has(scenario.id)
        );

        if (availableScenarios.length === 0) {
            // Reset used scenarios if all have been used
            this.usedScenarios.clear();
            return this.scenarios[Math.floor(Math.random() * this.scenarios.length)];
        }

        const randomIndex = Math.floor(Math.random() * availableScenarios.length);
        const selectedScenario = availableScenarios[randomIndex];
        this.usedScenarios.add(selectedScenario.id);
        
        return selectedScenario;
    }

    // Get a specific scenario by ID
    getScenarioById(id) {
        return this.scenarios.find(scenario => scenario.id === id);
    }

    getScenarioByScenarioCount(index) {
        return this.scenarios[index];
    }

    // Get all available scenarios
    getAllScenarios() {
        return this.scenarios;
    }

    // Reset used scenarios (for new game)
    resetUsedScenarios() {
        this.usedScenarios.clear();
    }

    // Get clue by category
    getClueByCategory(scenario, category) {
        if (!scenario || !scenario.clues || !scenario.clues[category]) {
            return null;
        }

        const clues = scenario.clues[category];
        if (Array.isArray(clues)) {
            // Return random clue from array
            return clues[Math.floor(Math.random() * clues.length)];
        }
        
        return clues;
    }

    // Get outcome for a decision
    getOutcome(scenario, decision) {
        if (!scenario || !scenario.outcomes || !scenario.outcomes[decision]) {
            return {
                success: false,
                reputationChange: 0,
                message: "Unknown outcome"
            };
        }

        return scenario.outcomes[decision];
    }

    // Get client data by ID
    getClientById(clientId) {
        return this.clients.find(client => client.id === clientId);
    }

    // Get client data for a scenario
    getScenarioClient(scenario) {
        if (!scenario || !scenario.client) {
            return null;
        }
        return this.getClientById(scenario.client);
    }
}
