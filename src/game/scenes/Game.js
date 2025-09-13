import { EventBus } from '../EventBus';
import { Scene } from 'phaser';
import { GameState } from '../GameState';
import { ScenarioManager } from '../ScenarioManager';

export class Game extends Scene
{
    constructor ()
    {
        super('Game');
        this.gameState = new GameState();
        this.scenarioManager = null; // Will be initialized in create()
        this.currentClient = null;
        this.clueElements = {};
        this.decisionModal = null;
        this.dayStartModal = null;
    }

    create ()
    {
        // Initialize game state
        this.gameState.initialize();
        
        // Initialize scenario manager with scene reference
        this.scenarioManager = new ScenarioManager(this);
        
        // Set up the main game background
        this.add.image(512, 384, 'background3').setDisplaySize(1024, 768);
        
        // Create the desk and UI elements
        this.createDeskElements();
        
        // Create UI overlay elements
        this.createUIOverlay();
        
        // Start the first day
        this.startNewDay();
        
        EventBus.emit('current-scene-ready', this);
    }

    createDeskElements() {
        // Create interactive desk elements
        // Phone for word of mouth clues
        this.clueElements.phone = this.add.rectangle(200, 600, 60, 40, 0x8B4513);
        this.clueElements.phone.setInteractive();
        this.clueElements.phone.on('pointerdown', () => this.showWordOfMouthClue());
        this.clueElements.phone.setDepth(10);
        
        // Computer terminal for charts/graphs
        this.clueElements.computer = this.add.rectangle(800, 500, 120, 80, 0x000000);
        this.clueElements.computer.setInteractive();
        this.clueElements.computer.on('pointerdown', () => this.showComputerClue());
        this.clueElements.computer.setDepth(10);
        
        // Newspaper stack for headlines
        this.clueElements.newspaper = this.add.rectangle(150, 500, 40, 60, 0xFFFFFF);
        this.clueElements.newspaper.setInteractive();
        this.clueElements.newspaper.on('pointerdown', () => this.showNewspaperClue());
        this.clueElements.newspaper.setDepth(10);
        
        // Add labels for clarity
        this.add.text(200, 650, 'Phone', { fontSize: '16px', color: '#ffffff' }).setDepth(15);
        this.add.text(800, 580, 'Computer', { fontSize: '16px', color: '#ffffff' }).setDepth(15);
        this.add.text(150, 580, 'News', { fontSize: '16px', color: '#000000' }).setDepth(15);
    }

    createUIOverlay() {
        // Create UI overlay elements
        this.uiOverlay = this.add.container(0, 0);
        this.uiOverlay.setDepth(100);
        
        // Day counter
        this.dayText = this.add.text(50, 50, `Day ${this.gameState.currentDay}`, {
            fontSize: '24px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        });
        this.uiOverlay.add(this.dayText);
        
        // Reputation score
        this.reputationText = this.add.text(50, 80, `Reputation: ${this.gameState.reputationScore}`, {
            fontSize: '20px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        });
        this.uiOverlay.add(this.reputationText);
        
        // Client counter
        this.clientText = this.add.text(50, 110, `Client ${this.gameState.clientsCompleted + 1}/${this.gameState.totalClients}`, {
            fontSize: '18px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        });
        this.uiOverlay.add(this.clientText);
    }

    startNewDay() {
        // Show day start modal
        this.showDayStartModal();
    }

    showDayStartModal() {
        // Create day start modal container
        this.dayStartModal = this.add.container(0, 0);
        this.dayStartModal.setDepth(200);
        
        // Modal background
        const modalBg = this.add.graphics();
        modalBg.fillStyle(0x000000, 0.8);
        modalBg.fillRect(0, 0, 1024, 768);
        this.dayStartModal.add(modalBg);
        
        // Modal content
        const modalWidth = 400;
        const modalHeight = 300;
        const modalX = (1024 - modalWidth) / 2;
        const modalY = (768 - modalHeight) / 2;
        
        const modalContent = this.add.graphics();
        modalContent.fillStyle(0x333333, 0.95);
        modalContent.lineStyle(2, 0xffffff, 1);
        modalContent.fillRoundedRect(modalX, modalY, modalWidth, modalHeight, 10);
        modalContent.strokeRoundedRect(modalX, modalY, modalWidth, modalHeight, 10);
        this.dayStartModal.add(modalContent);
        
        // Day start text
        const dayStartText = this.add.text(512, modalY + 80, `Day ${this.gameState.currentDay}`, {
            fontSize: '32px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
        this.dayStartModal.add(dayStartText);
        
        const instructionText = this.add.text(512, modalY + 140, 'Ready to start trading?', {
            fontSize: '20px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
        this.dayStartModal.add(instructionText);
        
        // Start button
        const startButton = this.add.rectangle(512, modalY + 200, 120, 40, 0x00ff00);
        startButton.setInteractive();
        startButton.on('pointerdown', () => this.hideDayStartModal());
        this.dayStartModal.add(startButton);
        
        const startButtonText = this.add.text(512, modalY + 200, 'Start Day', {
            fontSize: '18px',
            color: '#000000',
            stroke: '#ffffff',
            strokeThickness: 1
        }).setOrigin(0.5);
        this.dayStartModal.add(startButtonText);
    }

    hideDayStartModal() {
        if (this.dayStartModal) {
            this.dayStartModal.destroy();
            this.dayStartModal = null;
        }
        // Start the first client of the day
        this.spawnClient();
    }

    spawnClient() {
        // Get a random scenario
        this.currentClient = this.scenarioManager.getRandomScenario();
        
        // Get client data for this scenario
        const clientData = this.scenarioManager.getScenarioClient(this.currentClient);
        
        // Use client avatar or fallback to tech-bro
        const avatarKey = clientData ? clientData.avatar.replace('.png', '') : 'tech-bro';
        
        // Create client avatar using dynamic image
        this.clientAvatar = this.add.image(-200, 326, avatarKey);
        this.clientAvatar.setOrigin(0.5);
        this.clientAvatar.setScale(0.3);
        this.clientAvatar.setDepth(50);
        
        // Slide client in
        this.tweens.add({
            targets: this.clientAvatar,
            x: 200,
            duration: 800,
            ease: 'Back.easeOut',
            onComplete: () => {
                this.showClientOpeningStatement();
            }
        });
        
        // Highlight interactive elements
        this.highlightClueElements();
    }

    showClientOpeningStatement() {
        // Show opening statement in speech bubble
        this.showSpeechBubble(this.currentClient.openingStatement);
        
        // Make client avatar clickable to show decision modal
        this.clientAvatar.setInteractive();
        this.clientAvatar.on('pointerdown', () => {
            this.hideSpeechBubble();
            this.showDecisionModal();
        });
        
        // Add visual indicator that client is clickable
        this.tweens.add({
            targets: this.clientAvatar,
            scaleX: 0.35,
            scaleY: 0.35,
            duration: 1000,
            yoyo: true,
            repeat: -1
        });
    }

    showSpeechBubble(text) {
        // Create speech bubble
        const bubbleWidth = 300;
        const bubbleHeight = 120;
        const bubbleX = this.clientAvatar.x + 150;
        const bubbleY = this.clientAvatar.y - 150;

        this.speechBubble = this.add.graphics();
        this.speechBubble.setDepth(75);
        
        // Draw bubble
        this.speechBubble.fillStyle(0x000000, 0.95);
        this.speechBubble.lineStyle(3, 0xffffff, 1);
        this.speechBubble.fillRoundedRect(bubbleX - bubbleWidth/2, bubbleY - bubbleHeight/2, bubbleWidth, bubbleHeight, 15);
        this.speechBubble.strokeRoundedRect(bubbleX - bubbleWidth/2, bubbleY - bubbleHeight/2, bubbleWidth, bubbleHeight, 15);
        
        // Draw tail
        const tailPoints = [
            bubbleX - 60, bubbleY + bubbleHeight/2,
            bubbleX - 80, bubbleY + bubbleHeight/2 + 25,
            bubbleX - 40, bubbleY + bubbleHeight/2
        ];
        this.speechBubble.fillStyle(0x000000, 0.95);
        this.speechBubble.lineStyle(3, 0xffffff, 1);
        this.speechBubble.fillTriangle(...tailPoints);
        this.speechBubble.strokeTriangle(...tailPoints);

        // Add text
        this.bubbleText = this.add.text(bubbleX, bubbleY, text, {
            fontFamily: 'Arial',
            fontSize: '16px',
            color: 'white',
            align: 'center',
            wordWrap: { width: bubbleWidth - 20 }
        });
        
        this.bubbleText.setOrigin(0.5);
        this.bubbleText.setDepth(76);
        
        // Animate in
        this.speechBubble.setAlpha(0);
        this.bubbleText.setAlpha(0);
        
        this.tweens.add({
            targets: [this.speechBubble, this.bubbleText],
            alpha: 1,
            duration: 300,
            ease: 'Power2'
        });
    }

    hideSpeechBubble() {
        if (this.speechBubble && this.bubbleText) {
            this.tweens.add({
                targets: [this.speechBubble, this.bubbleText],
                alpha: 0,
                duration: 300,
                ease: 'Power2',
                onComplete: () => {
                    this.speechBubble.destroy();
                    this.bubbleText.destroy();
                    this.speechBubble = null;
                    this.bubbleText = null;
                }
            });
        }
    }

    highlightClueElements() {
        // Add glow effect to interactive elements
        Object.values(this.clueElements).forEach(element => {
            this.tweens.add({
                targets: element,
                alpha: 0.5,
                duration: 1000,
                yoyo: true,
                repeat: -1
            });
        });
    }

    showWordOfMouthClue() {
        const clue = this.scenarioManager.getClueByCategory(this.currentClient, 'wordOfMouth');
        if (clue) {
            this.showClueModal('Word of Mouth', clue);
        }
    }

    showComputerClue() {
        // Randomly show either chart or graph
        const clueType = Math.random() < 0.5 ? 'charts' : 'graphs';
        const clue = this.scenarioManager.getClueByCategory(this.currentClient, clueType);
        if (clue) {
            this.showClueModal(clue.title, this.formatChartData(clue));
        }
    }

    showNewspaperClue() {
        const clue = this.scenarioManager.getClueByCategory(this.currentClient, 'newspaper');
        if (clue) {
            this.showClueModal('Newspaper Headlines', clue);
        }
    }

    showClueModal(title, content) {
        // Create modal container
        const modal = this.add.container(0, 0);
        modal.setDepth(150);
        
        // Modal background
        const modalBg = this.add.graphics();
        modalBg.fillStyle(0x000000, 0.8);
        modalBg.fillRect(0, 0, 1024, 768);
        modal.add(modalBg);
        
        // Modal content
        const modalWidth = 600;
        const modalHeight = 400;
        const modalX = (1024 - modalWidth) / 2;
        const modalY = (768 - modalHeight) / 2;
        
        const modalContent = this.add.graphics();
        modalContent.fillStyle(0x333333, 0.95);
        modalContent.lineStyle(2, 0xffffff, 1);
        modalContent.fillRoundedRect(modalX, modalY, modalWidth, modalHeight, 10);
        modalContent.strokeRoundedRect(modalX, modalY, modalWidth, modalHeight, 10);
        modal.add(modalContent);
        
        // Title
        const titleText = this.add.text(512, modalY + 40, title, {
            fontSize: '24px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
        modal.add(titleText);
        
        // Content
        const contentText = this.add.text(512, modalY + 100, content, {
            fontSize: '16px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 1,
            wordWrap: { width: modalWidth - 40 },
            align: 'center'
        }).setOrigin(0.5);
        modal.add(contentText);
        
        // Close button
        const closeButton = this.add.rectangle(512, modalY + 320, 100, 40, 0xff0000);
        closeButton.setInteractive();
        closeButton.on('pointerdown', () => {
            modal.destroy();
        });
        modal.add(closeButton);
        
        const closeButtonText = this.add.text(512, modalY + 320, 'Close', {
            fontSize: '18px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 1
        }).setOrigin(0.5);
        modal.add(closeButtonText);
    }

    formatChartData(chartData) {
        if (chartData.type === 'revenue') {
            return `Revenue Data:\n${chartData.data.join(' → ')}\n\n${chartData.labels.join(' → ')}`;
        } else if (chartData.type === 'trend') {
            return `Price Trend:\n${chartData.data.join(' → ')}\n\n${chartData.labels.join(' → ')}`;
        }
        return JSON.stringify(chartData);
    }

    showDecisionModal() {
        // Create decision modal container
        this.decisionModal = this.add.container(0, 0);
        this.decisionModal.setDepth(200);
        
        // Modal background
        const modalBg = this.add.graphics();
        modalBg.fillStyle(0x000000, 0.8);
        modalBg.fillRect(0, 0, 1024, 768);
        this.decisionModal.add(modalBg);
        
        // Modal content
        const modalWidth = 500;
        const modalHeight = 300;
        const modalX = (1024 - modalWidth) / 2;
        const modalY = (768 - modalHeight) / 2;
        
        const modalContent = this.add.graphics();
        modalContent.fillStyle(0x333333, 0.95);
        modalContent.lineStyle(2, 0xffffff, 1);
        modalContent.fillRoundedRect(modalX, modalY, modalWidth, modalHeight, 10);
        modalContent.strokeRoundedRect(modalX, modalY, modalWidth, modalHeight, 10);
        this.decisionModal.add(modalContent);
        
        // Title
        const titleText = this.add.text(512, modalY + 60, 'Make Your Decision', {
            fontSize: '24px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
        this.decisionModal.add(titleText);
        
        // Decision buttons
        const buttonY = modalY + 150;
        
        // Call button
        const callButton = this.add.rectangle(modalX + 100, buttonY, 80, 40, 0x00ff00);
        callButton.setInteractive();
        callButton.on('pointerdown', () => this.makeDecision('call'));
        this.decisionModal.add(callButton);
        
        const callButtonText = this.add.text(modalX + 100, buttonY, 'Call', {
            fontSize: '18px',
            color: '#000000',
            stroke: '#ffffff',
            strokeThickness: 1
        }).setOrigin(0.5);
        this.decisionModal.add(callButtonText);
        
        // Put button
        const putButton = this.add.rectangle(modalX + 250, buttonY, 80, 40, 0xff0000);
        putButton.setInteractive();
        putButton.on('pointerdown', () => this.makeDecision('put'));
        this.decisionModal.add(putButton);
        
        const putButtonText = this.add.text(modalX + 250, buttonY, 'Put', {
            fontSize: '18px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 1
        }).setOrigin(0.5);
        this.decisionModal.add(putButtonText);
        
        // Hold button
        const holdButton = this.add.rectangle(modalX + 400, buttonY, 80, 40, 0xffff00);
        holdButton.setInteractive();
        holdButton.on('pointerdown', () => this.makeDecision('hold'));
        this.decisionModal.add(holdButton);
        
        const holdButtonText = this.add.text(modalX + 400, buttonY, 'Hold', {
            fontSize: '18px',
            color: '#000000',
            stroke: '#000000',
            strokeThickness: 1
        }).setOrigin(0.5);
        this.decisionModal.add(holdButtonText);
    }

    makeDecision(decision) {
        // Remove interaction from client to prevent multiple clicks
        if (this.clientAvatar) {
            this.clientAvatar.removeInteractive();
        }
        
        // Hide decision modal
        if (this.decisionModal) {
            this.decisionModal.destroy();
            this.decisionModal = null;
        }
        
        // Get outcome
        const outcome = this.scenarioManager.getOutcome(this.currentClient, decision);
        
        // Create trade result
        const tradeResult = {
            decision: decision,
            success: outcome.success,
            reputationChange: outcome.reputationChange,
            message: outcome.message,
            client: this.currentClient.name
        };
        
        // Complete client interaction
        this.gameState.completeClient(tradeResult);
        
        // Show outcome
        this.showOutcome(outcome);
        
        // Update UI
        this.updateUI();
        
        // Check if day is complete
        if (this.gameState.isDayComplete()) {
            this.time.delayedCall(3000, () => {
                this.completeDay();
            });
        } else {
            // Move to next client
            this.time.delayedCall(3000, () => {
                this.nextClient();
            });
        }
    }

    showOutcome(outcome) {
        // Show outcome in speech bubble
        this.showSpeechBubble(outcome.message);
    }

    nextClient() {
        // Remove interaction from current client
        if (this.clientAvatar) {
            this.clientAvatar.removeInteractive();
        }
        
        // Slide current client out
        this.tweens.add({
            targets: this.clientAvatar,
            x: -200,
            duration: 500,
            ease: 'Power2',
            onComplete: () => {
                this.clientAvatar.destroy();
                this.spawnClient();
            }
        });
    }

    completeDay() {
        // Show day summary
        const daySummary = this.gameState.getDaySummary();
        
        // Create day summary modal container
        const summaryModal = this.add.container(0, 0);
        summaryModal.setDepth(200);
        
        // Modal background
        const modalBg = this.add.graphics();
        modalBg.fillStyle(0x000000, 0.8);
        modalBg.fillRect(0, 0, 1024, 768);
        summaryModal.add(modalBg);
        
        // Modal content
        const modalWidth = 500;
        const modalHeight = 400;
        const modalX = (1024 - modalWidth) / 2;
        const modalY = (768 - modalHeight) / 2;
        
        const modalContent = this.add.graphics();
        modalContent.fillStyle(0x333333, 0.95);
        modalContent.lineStyle(2, 0xffffff, 1);
        modalContent.fillRoundedRect(modalX, modalY, modalWidth, modalHeight, 10);
        modalContent.strokeRoundedRect(modalX, modalY, modalWidth, modalHeight, 10);
        summaryModal.add(modalContent);
        
        // Title
        const titleText = this.add.text(512, modalY + 60, `Day ${daySummary.day} Summary`, {
            fontSize: '24px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
        summaryModal.add(titleText);
        
        // Summary content
        const summaryText = this.add.text(512, modalY + 120, 
            `Reputation Change: ${daySummary.reputationChange > 0 ? '+' : ''}${daySummary.reputationChange}\n` +
            `Final Reputation: ${daySummary.finalReputation}\n` +
            `Trades Made: ${daySummary.trades.length}`, {
            fontSize: '18px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 1,
            align: 'center'
        }).setOrigin(0.5);
        summaryModal.add(summaryText);
        
        // Continue button
        const continueButton = this.add.rectangle(512, modalY + 280, 120, 40, 0x00ff00);
        continueButton.setInteractive();
        continueButton.on('pointerdown', () => {
            summaryModal.destroy();
            this.startNextDay();
        });
        summaryModal.add(continueButton);
        
        const continueButtonText = this.add.text(512, modalY + 280, 'Continue', {
            fontSize: '18px',
            color: '#000000',
            stroke: '#ffffff',
            strokeThickness: 1
        }).setOrigin(0.5);
        summaryModal.add(continueButtonText);
    }

    startNextDay() {
        // Check if game is complete
        if (this.gameState.isGameComplete()) {
            this.endGame();
            return;
        }
        
        // Start new day
        this.gameState.startNewDay();
        this.updateUI();
        this.startNewDay();
    }

    endGame() {
        // Show final score screen
        const finalSummary = this.gameState.getFinalSummary();
        
        // Create final score modal container
        const finalModal = this.add.container(0, 0);
        finalModal.setDepth(200);
        
        // Modal background
        const modalBg = this.add.graphics();
        modalBg.fillStyle(0x000000, 0.8);
        modalBg.fillRect(0, 0, 1024, 768);
        finalModal.add(modalBg);
        
        // Modal content
        const modalWidth = 500;
        const modalHeight = 400;
        const modalX = (1024 - modalWidth) / 2;
        const modalY = (768 - modalHeight) / 2;
        
        const modalContent = this.add.graphics();
        modalContent.fillStyle(0x333333, 0.95);
        modalContent.lineStyle(2, 0xffffff, 1);
        modalContent.fillRoundedRect(modalX, modalY, modalWidth, modalHeight, 10);
        modalContent.strokeRoundedRect(modalX, modalY, modalWidth, modalHeight, 10);
        finalModal.add(modalContent);
        
        // Title
        const titleText = this.add.text(512, modalY + 60, 'Game Complete!', {
            fontSize: '24px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
        finalModal.add(titleText);
        
        // Final summary
        const finalText = this.add.text(512, modalY + 120, 
            `Final Reputation: ${finalSummary.finalReputation}\n` +
            `Total Trades: ${finalSummary.totalTrades}\n` +
            `Successful Trades: ${finalSummary.successfulTrades}`, {
            fontSize: '18px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 1,
            align: 'center'
        }).setOrigin(0.5);
        finalModal.add(finalText);
        
        // Restart button
        const restartButton = this.add.rectangle(512, modalY + 280, 120, 40, 0x00ff00);
        restartButton.setInteractive();
        restartButton.on('pointerdown', () => {
            this.scene.restart();
        });
        finalModal.add(restartButton);
        
        const restartButtonText = this.add.text(512, modalY + 280, 'Restart', {
            fontSize: '18px',
            color: '#000000',
            stroke: '#ffffff',
            strokeThickness: 1
        }).setOrigin(0.5);
        finalModal.add(restartButtonText);
    }

    updateUI() {
        // Update UI elements
        this.dayText.setText(`Day ${this.gameState.currentDay}`);
        this.reputationText.setText(`Reputation: ${this.gameState.reputationScore}`);
        this.clientText.setText(`Client ${this.gameState.clientsCompleted + 1}/${this.gameState.totalClients}`);
    }

    changeScene ()
    {
        this.scene.start('GameOver');
    }
}
