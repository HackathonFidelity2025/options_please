// Game State Management System
export class GameState {
    constructor() {
        this.reputationScore = 50; // Starting reputation (0-100)
        this.currentDay = 1;
        this.totalDays = 5; // Total days in the game
        this.currentClient = null;
        this.clientsCompleted = 0;
        this.totalClients = 3; // Clients per day
        this.dailyTrades = [];
        this.gameCompleted = false;
        this.scenarios = [];
        this.currentScenario = null;
    }

    // Initialize game state
    initialize() {
        this.reputationScore = 50;
        this.currentDay = 1;
        this.currentClient = null;
        this.clientsCompleted = 0;
        this.dailyTrades = [];
        this.gameCompleted = false;
        this.currentScenario = null;
    }

    // Start a new day
    startNewDay() {
        this.currentDay++;
        this.clientsCompleted = 0;
        this.dailyTrades = [];
        this.currentClient = null;
    }

    // Complete a client interaction
    completeClient(tradeResult) {
        this.dailyTrades.push(tradeResult);
        this.clientsCompleted++;
        
        // Update reputation based on trade outcome
        this.updateReputation(tradeResult);
    }

    // Update reputation based on trade outcome
    updateReputation(tradeResult) {
        const reputationChange = tradeResult.reputationChange || 0;
        this.reputationScore = Math.max(0, Math.min(100, this.reputationScore + reputationChange));
    }

    // Check if day is complete
    isDayComplete() {
        return this.clientsCompleted >= this.totalClients;
    }

    // Check if game is complete
    isGameComplete() {
        return this.currentDay > this.totalDays;
    }

    // Get current day summary
    getDaySummary() {
        return {
            day: this.currentDay,
            trades: this.dailyTrades,
            reputationChange: this.dailyTrades.reduce((sum, trade) => sum + (trade.reputationChange || 0), 0),
            finalReputation: this.reputationScore
        };
    }

    // Get final game summary
    getFinalSummary() {
        return {
            totalDays: this.totalDays,
            finalReputation: this.reputationScore,
            totalTrades: this.dailyTrades.length,
            successfulTrades: this.dailyTrades.filter(trade => trade.success).length
        };
    }
}
