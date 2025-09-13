import { EventBus } from '../EventBus';
import { Scene } from 'phaser';
import { GameState } from '../GameState';
import { ScenarioManager } from '../ScenarioManager';

export class Game extends Scene {
    constructor() {
        super('Game');
        this.gameState = new GameState();
        this.scenarioManager = null; // Will be initialized in create()
        this.currentClient = null;
        this.clueElements = {};
        this.decisionModal = null;
        this.dayStartModal = null;
        this.guidebookModal = null;
        this.guidebookPages = [];
        this.currentGuidebookPage = 0;
        
        // Analytics tracking
        this.currentScenarioAnalytics = null;
        this.dailyAnalytics = [];
    }

    // Analytics system methods
    initializeScenarioAnalytics() {
        if (!this.currentClient) return;

        // Count available clues
        const availableClues = this.countAvailableClues(this.currentClient);
        
        this.currentScenarioAnalytics = {
            scenarioId: this.currentClient.id,
            scenarioName: this.currentClient.name,
            clientId: this.currentClient.client,
            startTime: Date.now(),
            endTime: null,
            availableClues: availableClues,
            accessedClues: new Set(),
            clientFilesAccessed: false,
            decision: null,
            optimalDecision: this.getOptimalDecision(this.currentClient),
            outcome: null,
            score: 0,
            feedback: [],
            grade: 'F'
        };
    }

    countAvailableClues(scenario) {
        let count = 0;
        if (scenario.clues) {
            if (scenario.clues.wordOfMouth && scenario.clues.wordOfMouth.length > 0) count++;
            if (scenario.clues.newspaper && scenario.clues.newspaper.length > 0) count++;
            if (scenario.clues.charts) count++;
        }
        return count;
    }

    getOptimalDecision(scenario) {
        // Determine optimal decision based on outcomes
        // The optimal decision is the one with the highest reputation change
        if (!scenario.outcomes) return 'hold';
        
        let bestDecision = 'hold';
        let bestReputationChange = scenario.outcomes.hold?.reputationChange || 0;
        
        ['call', 'put'].forEach(decision => {
            const outcome = scenario.outcomes[decision];
            if (outcome && outcome.reputationChange > bestReputationChange) {
                bestReputationChange = outcome.reputationChange;
                bestDecision = decision;
            }
        });
        
        return bestDecision;
    }

    trackClueAccessed(clueType) {
        if (this.currentScenarioAnalytics) {
            this.currentScenarioAnalytics.accessedClues.add(clueType);
        }
    }

    trackClientFilesAccessed() {
        if (this.currentScenarioAnalytics) {
            this.currentScenarioAnalytics.clientFilesAccessed = true;
        }
    }

    analyzeScenarioPerformance() {
        if (!this.currentScenarioAnalytics) return null;

        let score = 0;
        let feedback = [];

        // Check investigation thoroughness
        const cluesAccessed = this.currentScenarioAnalytics.accessedClues.size;
        const totalClues = this.currentScenarioAnalytics.availableClues;
        const investigationRatio = totalClues > 0 ? cluesAccessed / totalClues : 0;

        if (investigationRatio >= 0.8) {
            score += 25;
            feedback.push("✓ Thorough investigation of available evidence");
        } else if (investigationRatio >= 0.5) {
            score += Math.floor(investigationRatio * 25);
            feedback.push("⚠ Could have investigated more evidence sources");
        } else {
            score += Math.floor(investigationRatio * 25);
            feedback.push("⚠ Limited investigation - missed key evidence");
        }

        // Check optimal decision match
        if (this.currentScenarioAnalytics.decision === this.currentScenarioAnalytics.optimalDecision) {
            score += 50;
            feedback.push("✓ Made the optimal recommendation");
        } else {
            feedback.push("✗ Recommendation doesn't match optimal choice");
        }

        // Check client profile consideration
        if (this.currentScenarioAnalytics.clientFilesAccessed) {
            score += 15;
            feedback.push("✓ Reviewed client profile and risk tolerance");
        } else {
            feedback.push("⚠ Should have reviewed client information");
        }

        // Time bonus (simple implementation)
        const timeSpent = (this.currentScenarioAnalytics.endTime - this.currentScenarioAnalytics.startTime) / 1000;
        if (timeSpent < 120) { // Less than 2 minutes
            score += 10;
            feedback.push("✓ Efficient decision-making");
        }

        const finalScore = Math.min(100, Math.max(0, score));
        
        this.currentScenarioAnalytics.score = finalScore;
        this.currentScenarioAnalytics.feedback = feedback;
        this.currentScenarioAnalytics.grade = this.getGrade(finalScore);

        return this.currentScenarioAnalytics;
    }

    getGrade(score) {
        if (score >= 90) return 'A';
        if (score >= 80) return 'B';
        if (score >= 70) return 'C';
        if (score >= 60) return 'D';
        return 'F';
    }

    create() {
        // Initialize game state
        this.gameState.initialize();

        // Initialize scenario manager with scene reference
        this.scenarioManager = new ScenarioManager(this);

        // Set up the main game background
        this.add.image(512, 384, 'background3').setDisplaySize(1024, 768);

        // Create background animation layers
        this.createBackgroundLayers();

        // Create the desk and UI elements
        this.createDeskElements();

        // Create UI overlay elements
        this.createUIOverlay();

        // Start the first day
        this.startNewDay();

        // Loop background sound
         // Play keyboard soft sound every 10 seconds
         this.keyboardTimer = this.time.addEvent({
            delay: 15000, // 15 seconds in milliseconds
            callback: () => {
                this.sound.play('keyboard-soft', { volume: 0.20, seek: 5 });
            },
            loop: true // Repeat indefinitely
         });
        this.printerTimer = this.time.addEvent({
            delay: 30000, // 30 seconds in milliseconds
            callback: () => {
                this.sound.play('printer', { volume: 0.25, seek: 0 });
            },
            loop: true // Repeat indefinitely
        });


        EventBus.emit('current-scene-ready', this);
    }

    createBackgroundLayers() {
        // Create keyboard animation layers - all positioned at the same location
        this.keyboardLayers = [];
        for (let i = 1; i <= 4; i++) {
            const layer = this.add.image(512, 384, `keyboard${i}`);
            layer.setDisplaySize(1024, 768);
            layer.setDepth(5); // Above background but below desk elements
            layer.setAlpha(0); // Start hidden
            this.keyboardLayers.push(layer);
        }
        
        // Create phone animation layers - all positioned at the same location
        this.phoneLayers = [];
        for (let i = 1; i <= 4; i++) {
            const layer = this.add.image(512, 384, `phone${i}`);
            layer.setDisplaySize(1024, 768);
            layer.setDepth(5); // Above background but below desk elements
            layer.setAlpha(0); // Start hidden
            this.phoneLayers.push(layer);
        }
        
        // Create paper animation layers - all positioned at the same location
        this.paperLayers = [];
        for (let i = 1; i <= 2; i++) {
            const layer = this.add.image(512, 384, `paper${i}`);
            layer.setDisplaySize(1024, 768);
            layer.setDepth(5); // Above background but below desk elements
            layer.setAlpha(0); // Start hidden
            this.paperLayers.push(layer);
        }
        
        // Create computer animation layers - all positioned at the same location
        this.computerLayers = [];
        for (let i = 1; i <= 4; i++) {
            const layer = this.add.image(512, 384, `computer${i}`);
            layer.setDisplaySize(1024, 768);
            layer.setDepth(5); // Above background but below desk elements
            layer.setAlpha(0); // Start hidden
            this.computerLayers.push(layer);
        }
        
        // Create binders animation layers - all positioned at the same location
        this.bindersLayers = [];
        for (let i = 1; i <= 1; i++) {
            const layer = this.add.image(512, 384, `binders${i}`);
            layer.setDisplaySize(1024, 768);
            layer.setDepth(5); // Above background but below desk elements
            layer.setAlpha(0); // Start hidden
            this.bindersLayers.push(layer);
        }
        
        // Store animation state
        this.keyboardAnimating = false;
        this.keyboardAnimationFrame = 0;
        this.phoneAnimating = false;
        this.phoneAnimationFrame = 0;
        this.paperAnimating = false;
        this.paperAnimationFrame = 0;
        this.computerAnimating = false;
        this.computerAnimationFrame = 0;
        this.bindersAnimating = false;
        this.bindersAnimationFrame = 0;
        this.bindersFrameDuration = 0;
    }

    animateKeyboard() {
        if (this.keyboardAnimating) return; // Prevent overlapping animations
        
        this.keyboardAnimating = true;
        this.keyboardAnimationFrame = 0;
        this.keyboardFrameDuration = 0; // Track how long current frame has been shown
        
        // Hide all layers first
        this.keyboardLayers.forEach(layer => layer.setAlpha(0));
        
        // Animate through each frame
        const animateFrame = () => {
            if (this.keyboardAnimationFrame < this.keyboardLayers.length) {
                // Show current frame
                this.keyboardLayers[this.keyboardAnimationFrame].setAlpha(1);
                
                // Hide previous frame (except for first frame)
                if (this.keyboardAnimationFrame > 0) {
                    this.keyboardLayers[this.keyboardAnimationFrame - 1].setAlpha(0);
                }
                
                this.keyboardFrameDuration++;
                
                // If we've shown this frame for 2 cycles, move to next frame
                if (this.keyboardFrameDuration >= 2) {
                    this.keyboardAnimationFrame++;
                    this.keyboardFrameDuration = 0;
                }
                
                // Continue to next frame after a short delay
                this.time.delayedCall(100, animateFrame);
            } else {
                // Animation complete - hide all layers
                this.keyboardLayers.forEach(layer => layer.setAlpha(0));
                this.keyboardAnimating = false;
            }
        };
        
        // Start the animation
        animateFrame();
    }

    animatePhone() {
        if (this.phoneAnimating) return; // Prevent overlapping animations
        
        this.phoneAnimating = true;
        this.phoneAnimationFrame = 0;
        this.phoneFrameDuration = 0; // Track how long current frame has been shown
        
        // Hide all layers first
        this.phoneLayers.forEach(layer => layer.setAlpha(0));
        
        // Animate through each frame
        const animateFrame = () => {
            if (this.phoneAnimationFrame < this.phoneLayers.length) {
                // Show current frame
                this.phoneLayers[this.phoneAnimationFrame].setAlpha(1);
                
                // Hide previous frame (except for first frame)
                if (this.phoneAnimationFrame > 0) {
                    this.phoneLayers[this.phoneAnimationFrame - 1].setAlpha(0);
                }
                
                this.phoneFrameDuration++;
                
                // If we've shown this frame for 3 cycles, move to next frame
                if (this.phoneFrameDuration >= 3) {
                    this.phoneAnimationFrame++;
                    this.phoneFrameDuration = 0;
                }
                
                // Continue to next frame after a short delay
                this.time.delayedCall(100, animateFrame);
            } else {
                // Animation complete - hide all layers
                this.phoneLayers.forEach(layer => layer.setAlpha(0));
                this.phoneAnimating = false;
            }
        };
        
        // Start the animation
        animateFrame();
    }

    animatePaper() {
        if (this.paperAnimating) return; // Prevent overlapping animations
        
        this.paperAnimating = true;
        this.paperAnimationFrame = 0;
        
        // Hide all layers first
        this.paperLayers.forEach(layer => layer.setAlpha(0));
        
        // Define the animation sequence: normal → paper1 → paper2 → paper1 → normal
        const animationSequence = [
            null,        // 0: normal background (no layer)
            'paper1',    // 1: paper1
            'paper2',    // 2: paper2
            'paper1',    // 3: paper1 again
            null         // 4: normal background (no layer)
        ];
        
        // Animate through the sequence
        const animateFrame = () => {
            if (this.paperAnimationFrame < animationSequence.length) {
                // Hide all layers first
                this.paperLayers.forEach(layer => layer.setAlpha(0));
                
                // Show current frame if it's not null (normal background)
                const currentFrame = animationSequence[this.paperAnimationFrame];
                if (currentFrame) {
                    const layerIndex = currentFrame === 'paper1' ? 0 : 1; // paper1 = index 0, paper2 = index 1
                    this.paperLayers[layerIndex].setAlpha(1);
                }
                
                this.paperAnimationFrame++;
                
                // Continue to next frame after a delay
                this.time.delayedCall(150, animateFrame);
            } else {
                // Animation complete - hide all layers
                this.paperLayers.forEach(layer => layer.setAlpha(0));
                this.paperAnimating = false;
            }
        };
        
        // Start the animation
        animateFrame();
    }

    animateComputer() {
        if (this.computerAnimating) return; // Prevent overlapping animations
        
        this.computerAnimating = true;
        this.computerAnimationFrame = 0;
        this.computerFrameDuration = 0; // Track how long current frame has been shown
        
        // Hide all layers first
        this.computerLayers.forEach(layer => layer.setAlpha(0));
        
        // Animate through each frame
        const animateFrame = () => {
            if (this.computerAnimationFrame < this.computerLayers.length) {
                // Show current frame
                this.computerLayers[this.computerAnimationFrame].setAlpha(1);
                
                // Hide previous frame (except for first frame)
                if (this.computerAnimationFrame > 0) {
                    this.computerLayers[this.computerAnimationFrame - 1].setAlpha(0);
                }
                
                this.computerFrameDuration++;
                
                // If we've shown this frame for 2 cycles, move to next frame
                if (this.computerFrameDuration >= 2) {
                    this.computerAnimationFrame++;
                    this.computerFrameDuration = 0;
                }
                
                // Continue to next frame after a short delay
                this.time.delayedCall(100, animateFrame);
            } else {
                // Animation complete - hide all layers
                this.computerLayers.forEach(layer => layer.setAlpha(0));
                this.computerAnimating = false;
            }
        };
        
        // Start the animation
        animateFrame();
    }

    hover_call() {
        // Simply show the binders1 frame while hovering
        this.bindersLayers.forEach(layer => layer.setAlpha(0));
        this.bindersLayers[0].setAlpha(1); // Show binders1
    }

    animateBindersLong() {
        if (this.bindersAnimating) return; // Prevent overlapping animations
        
        this.bindersAnimating = true;
        this.bindersAnimationFrame = 0;
        this.bindersFrameDuration = 0; // Track how long current frame has been shown
        
        // Hide all layers first
        this.bindersLayers.forEach(layer => layer.setAlpha(0));
        
        // Animation sequence: normal background → binders1 → normal background
        const sequence = [null, 'binders1', null];
        
        // Animate through each frame
        const animateFrame = () => {
            if (this.bindersAnimationFrame < sequence.length) {
                const currentFrame = sequence[this.bindersAnimationFrame];
                
                // Hide all layers first
                this.bindersLayers.forEach(layer => layer.setAlpha(0));
                
                // Show current frame if it's not null (normal background)
                if (currentFrame) {
                    const layerIndex = parseInt(currentFrame.replace('binders', '')) - 1;
                    this.bindersLayers[layerIndex].setAlpha(1);
                }
                
                this.bindersFrameDuration++;
                
                // If we've shown this frame for 5 cycles (longer), move to next frame
                if (this.bindersFrameDuration >= 5) {
                    this.bindersAnimationFrame++;
                    this.bindersFrameDuration = 0;
                }
                
                // Continue to next frame after a longer delay
                this.time.delayedCall(200, animateFrame);
            } else {
                // Animation complete - hide all layers
                this.bindersLayers.forEach(layer => layer.setAlpha(0));
                this.bindersAnimating = false;
            }
        };
        
        // Start the animation
        animateFrame();
    }

    createDeskElements() {
        // Create interactive desk elements with paired labels
        this.createInteractiveElement('phone', 805, 545, 140, 110, 0x8B4513, 'Phone', () => this.showWordOfMouthClue());
        this.createInteractiveElement('computer', 585, 425, 220, 200, 0x000000, 'Computer', () => this.showComputerClue());
        this.createInteractiveElement('newspaper', 150, 590, 150, 160, 0xFFFFFF, 'News', () => this.showNewspaperClue());
        this.createInteractiveElement('keyboard', 520, 610, 340, 100, 0x333333, 'Recommend', () => this.showDecisionModal());
        this.createInteractiveElement('binders', 650, 210, 125, 110, 0x000000, 'Client Files', () => this.showClientFiles());
    }

    createInteractiveElement(key, x, y, width, height, color, labelText, onClick) {
        // Create the interactive rectangle (transparent background)
        this.clueElements[key] = this.add.rectangle(x, y, width, height, color, 0);
        this.clueElements[key].setInteractive();
        this.clueElements[key].on('pointerdown', onClick);
        this.clueElements[key].setDepth(10);

        // Create the label positioned in the center of the element
        const labelX = x; // Center horizontally
        const labelY = y; // Center vertically

        // Create the label text first to get its actual dimensions
        const label = this.add.text(labelX, labelY, labelText, {
            fontSize: '20px', // Same font size as handbook
            fontFamily: 'Minecraft, Courier New, monospace',
            color: '#ffffff',
            fontFamily: 'Courier New, monospace' // Same font as handbook
        }).setDepth(15);
        label.setOrigin(0.5, 0.5); // Center the text origin
        label.setAlpha(0); // Start hidden

        // Get actual text dimensions
        const textWidth = label.width;
        const textHeight = label.height;
        const paddingX = 8; // Horizontal padding
        const paddingY = 2; // Vertical padding
        const bgWidth = textWidth + (paddingX * 2);
        const bgHeight = textHeight + (paddingY * 2);

        // Create label background (retro label printer style) - initially hidden
        const labelBg = this.add.graphics();
        labelBg.fillStyle(0x000000, 0.7); // Black background with 0.7 opacity
        // Center the background around the centered text
        labelBg.fillRoundedRect(labelX - (bgWidth / 2), labelY - (bgHeight / 2), bgWidth, bgHeight, 3);
        labelBg.setDepth(14);
        labelBg.setAlpha(0); // Start hidden

        // Add hover events to show/hide labels
        this.clueElements[key].on('pointerover', () => {
            // Play hover sound
            this.sound.play('hover', { rate: 1 });
            // Show label on hover
            this.tweens.add({
                targets: [labelBg, label],
                alpha: 1,
                duration: 200,
                ease: 'Power2'
            });
            
            // Trigger animations based on element type
            if (key === 'keyboard') {
                this.animateKeyboard();
            } else if (key === 'phone') {
                this.animatePhone();
            } else if (key === 'newspaper') {
                this.animatePaper();
            } else if (key === 'computer') {
                this.animateComputer();
            } else if (key === 'binders') {
                this.hover_call();
            }
        });

        this.clueElements[key].on('pointerout', () => {
            // Hide label when not hovering
            this.tweens.add({
                targets: [labelBg, label],
                alpha: 0,
                duration: 200,
                ease: 'Power2'
            });
            
            // Hide binders1 frame when not hovering
            if (key === 'binders') {
                this.bindersLayers.forEach(layer => layer.setAlpha(0));
            }
        });

        // Store references for potential future use
        this.clueElements[key].label = label;
        this.clueElements[key].labelBg = labelBg;
    }

    createAvatarLabel() {
        if (!this.avatarHitbox) return;

        // Create label using the same pattern as desk elements
        const labelText = 'Chat';
        const labelX = this.avatarHitbox.x - 20; // Top left of hitbox
        const labelY = this.avatarHitbox.y - 20;

        // Create the label text first to get its actual dimensions
        const label = this.add.text(labelX, labelY, labelText, {
            fontSize: '20px',
            fontFamily: 'Minecraft, Courier New, monospace',
            color: '#ffffff',
            fontFamily: 'Courier New, monospace' // Same font as handbook
        }).setDepth(200);
        label.setAlpha(0); // Start hidden

        // Get actual text dimensions
        const textWidth = label.width;
        const textHeight = label.height;
        const paddingX = 8;
        const paddingY = 2;
        const bgWidth = textWidth + (paddingX * 2);
        const bgHeight = textHeight + (paddingY * 2);

        // Create label background
        const labelBg = this.add.graphics();
        labelBg.fillStyle(0x000000, 0.7);
        labelBg.fillRoundedRect(labelX - paddingX, labelY - paddingY, bgWidth, bgHeight, 3);
        labelBg.setDepth(199);
        labelBg.setAlpha(0); // Start hidden

        // Add hover events to the existing hitbox
        this.avatarHitbox.on('pointerover', () => {
            console.log('Avatar hover detected!');
            this.tweens.add({
                targets: [labelBg, label],
                alpha: 1,
                duration: 200,
                ease: 'Power2'
            });
        });

        this.avatarHitbox.on('pointerout', () => {
            console.log('Avatar hover ended!');
            this.tweens.add({
                targets: [labelBg, label],
                alpha: 0,
                duration: 200,
                ease: 'Power2'
            });
        });

        // Store references for cleanup
        this.avatarHitbox.chatLabel = label;
        this.avatarHitbox.chatLabelBg = labelBg;
    }

    createUIOverlay() {
        // Create UI overlay elements
        this.uiOverlay = this.add.container(0, 0);
        this.uiOverlay.setDepth(100);

        // Day counter
        this.dayText = this.add.text(50, 50, `Day ${this.gameState.currentDay}`, {
            fontSize: '28px',
            fontFamily: 'Minecraft, Courier New, monospace',
            color: '#000000',
            stroke: '#ffffff',
            strokeThickness: 2
        });
        this.uiOverlay.add(this.dayText);

        // Client counter
        this.clientText = this.add.text(50, 80, `Client ${this.gameState.clientsCompleted + 1}/${this.gameState.totalClients}`, {
            fontSize: '22px',
            fontFamily: 'Minecraft, Courier New, monospace',
            color: '#000000',
            stroke: '#ffffff',
            strokeThickness: 2
        });
        this.uiOverlay.add(this.clientText);

        // Create guidebook button in bottom right
        this.createGuidebookButton();

        // Initialize guidebook pages
        this.initializeGuidebookPages();
    }

    createGuidebookButton() {
        // Position in bottom right corner - partially hidden
        const buttonX = 880;
        const buttonY = 820; // Positioned lower so it's partially hidden
        const buttonWidth = 260; // Made bigger
        const buttonHeight = 260; // Made bigger

        // Create guidebook button using handbook image
        this.guidebookButton = this.add.image(buttonX, buttonY, 'handbook');
        this.guidebookButton.setDisplaySize(buttonWidth, buttonHeight);
        this.guidebookButton.setInteractive();
        this.guidebookButton.setDepth(120);
        this.guidebookButton.on('pointerdown', () => this.showGuidebookModal());

        // Create label using the same pattern as desk elements
        const labelText = 'Guide Book';
        const labelX = buttonX; // Center horizontally
        const labelY = buttonY - buttonHeight / 2 - 20; // Position above the sprite

        // Create the label text first to get its actual dimensions
        const label = this.add.text(labelX, labelY, labelText, {
            fontSize: '20px', // Same font size as other desk elements
            fontFamily: 'Minecraft, Courier New, monospace',
            color: '#ffffff',
            fontFamily: 'Courier New, monospace' // Same font as other desk elements
        }).setDepth(125);
        label.setOrigin(0.5, 0.5); // Center the text origin
        label.setAlpha(0); // Start hidden

        // Get actual text dimensions
        const textWidth = label.width;
        const textHeight = label.height;
        const paddingX = 8; // Horizontal padding
        const paddingY = 2; // Vertical padding
        const bgWidth = textWidth + (paddingX * 2);
        const bgHeight = textHeight + (paddingY * 2);

        // Create label background (retro label printer style) - initially hidden
        const labelBg = this.add.graphics();
        labelBg.fillStyle(0x000000, 0.7); // Black background with 0.7 opacity
        // Center the background around the centered text
        labelBg.fillRoundedRect(labelX - (bgWidth / 2), labelY - (bgHeight / 2), bgWidth, bgHeight, 3);
        labelBg.setDepth(124);
        labelBg.setAlpha(0); // Start hidden

        // Store original Y position for hover animation
        this.guidebookButton.originalY = buttonY;

        // Add hover effects
        this.guidebookButton.on('pointerover', () => {
            // Play hover sound
            this.sound.play('hover', { rate: 1 });
            // Show label on hover
            this.tweens.add({
                targets: [labelBg, label],
                alpha: 1,
                duration: 200,
                ease: 'Power2'
            });
            this.tweens.add({
                targets: this.guidebookButton,
                y: this.guidebookButton.originalY - 10,
                duration: 200,
                ease: 'Power2'
            });
        });

        this.guidebookButton.on('pointerout', () => {
            // Hide label when not hovering
            this.tweens.add({
                targets: [labelBg, label],
                alpha: 0,
                duration: 200,
                ease: 'Power2'
            });
            this.tweens.add({
                targets: this.guidebookButton,
                y: this.guidebookButton.originalY,
                duration: 200,
                ease: 'Power2'
            });
        });
    }

    initializeGuidebookPages() {
        // Define guidebook pages - you can easily add more pages here
        this.guidebookPages = [
            {
                title: "Your Role as a Financial Advisor",
                content: `As a financial advisor, your primary responsibility is to guide clients through the decision-making process regarding their options trading opportunities. Clients will visit your office with questions about a specific company’s stock. Based on the information and evidence they provide, it is your duty to recommend one of three courses of action: Call, Put, or Hold.

Your ability to analyze market signals, weigh risks, and provide sound recommendations will directly impact both client satisfaction and your professional reputation.`
            },
            {
                title: "Decision Options",
                content: `
• Call
when you believe the company’s stock value is likely to rise in the future. This indicates a bullish outlook and positions your client to benefit from upward momentum.

• Put
Select Put when you believe the company’s stock value is likely to decrease. This represents a bearish outlook and helps your client profit from downward movement.

• Hold
Select Hold when the available information is inconclusive or the risks are too high to justify a recommendation. Use this option carefully, as clients may view indecision negatively and it may impact their trust in your judgment.`
            },
            {
                title: "Evaluating Evidence",
                content: `Every client will bring supporting materials for you to review. These may include:           

• News Articles or Headlines – Reports of company announcements, product launches, or external factors such as regulatory changes.

• Financial Charts – Data indicating projected revenue, industry performance, or analyst expectations.

• Market Graphs – Historical and current stock trends that reveal potential trajectories.

It is your responsibility to critically assess the reliability and relevance of this evidence. Some sources will be clear and credible, while others may present conflicting or incomplete information.
`
            },
            {
                title: "Word of Mouth & Internal Insights",
                content: `In addition to the evidence provided by clients, you will occasionally receive voicemails and internal messages from coworkers. These insights may provide valuable context, such as early rumors, industry chatter, or reminders of upcoming market events.

While these tips can help inform your decisions, be mindful of their reliability. Not all word of mouth is accurate, and poor judgment can have consequences for both you and your clients.`
            },
            {
                title: "Your Professional Reputation",
                content: `Your professional reputation is a direct reflection of the quality of the guidance you provide. Every recommendation you make—whether it results in a profit, a loss, or missed opportunity—impacts how clients, colleagues, and regulators perceive your advisory practice.           

Key Insight: Reputation is not built overnight. Each client interaction contributes to your long-term standing. Protect it carefully, as it is the most valuable asset in your advisory career.
`
            }
        ];
    }

    showGuidebookModal() {
        // Reset to first page when opening
        this.currentGuidebookPage = 0;
        this.createGuidebookModal();
    }

    createGuidebookModal() {
        // Create guidebook modal container
        this.guidebookModal = this.add.container(0, 0);
        this.guidebookModal.setDepth(250);

        // Modal background
        const modalBg = this.add.graphics();
        modalBg.fillStyle(0x000000, 0.8);
        modalBg.fillRect(0, 0, 1024, 768);
        modalBg.setInteractive(new Phaser.Geom.Rectangle(0, 0, 1024, 768), Phaser.Geom.Rectangle.Contains);
        this.guidebookModal.add(modalBg);

        // Modal content - use handbook page image as background
        const modalWidth = 700;
        const modalHeight = 800;
        const modalX = (1024 - modalWidth) / 2;
        const modalY = (768 - modalHeight) / 2;

        // Create handbook page background image
        const handbookPage = this.add.image(512, 384, 'handbook-page');
        handbookPage.setDisplaySize(modalWidth, modalHeight);
        this.guidebookModal.add(handbookPage);

        // Title - positioned to overlay nicely on the handbook page
        const currentPage = this.guidebookPages[this.currentGuidebookPage];
        const titleText = this.add.text(545, modalY + 85, currentPage.title, {
            fontSize: '28px',
            fontFamily: 'Minecraft, Courier New, monospace',
            color: '#2c3e50', // Dark blue-gray for better contrast on paper
            stroke: '#ffffff',
            strokeThickness: 2
        }).setOrigin(0.5);
        this.guidebookModal.add(titleText);

        // Content - positioned in the main content area of the handbook page
        const contentText = this.add.text(530, modalY + 340, currentPage.content, {
            fontSize: '16px',
            fontFamily: 'Minecraft, Courier New, monospace',
            color: '#2c3e50', // Dark blue-gray for better readability on paper
            stroke: '#ffffff',
            strokeThickness: 1,
            wordWrap: { width: modalWidth - 280 }, // More margin for paper effect
            align: 'left',
            lineSpacing: 4 // Better line spacing for readability
        }).setOrigin(0.5);
        this.guidebookModal.add(contentText);

        // Navigation buttons (only show if more than 1 page)
        if (this.guidebookPages.length > 1) {
            this.createGuidebookNavigation(modalX, modalY, modalWidth, modalHeight);
        }

        // Close button - styled to match the handbook page aesthetic
        const closeButton = this.add.rectangle(530, modalY + 720, 120, 40, 0x8B4513); // Brown paper color
        closeButton.setStrokeStyle(2, 0x654321); // Darker brown border
        closeButton.setInteractive();
        closeButton.on('pointerdown', () => this.hideGuidebookModal());
        this.guidebookModal.add(closeButton);

        const closeButtonText = this.add.text(530, modalY + 720, 'Close', {
            fontSize: '18px',
            fontFamily: 'Minecraft, Courier New, monospace',
            color: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 1,
            resolution: 1
        }).setOrigin(0.5);
        this.guidebookModal.add(closeButtonText);

        // Add hover effect to close button
        closeButton.on('pointerover', () => {
            closeButton.setFillStyle(0xA0522D); // Lighter brown on hover
        });

        closeButton.on('pointerout', () => {
            closeButton.setFillStyle(0x8B4513); // Back to original brown
        });
    }

    createGuidebookNavigation(modalX, modalY, modalWidth, modalHeight) {
        const buttonY = modalY + 660;
        const buttonWidth = 80;
        const buttonHeight = 35;

        // Previous button - styled for handbook page
        const prevButton = this.add.rectangle(modalX + 200, buttonY, buttonWidth, buttonHeight, 0x8B4513); // Brown paper color
        prevButton.setStrokeStyle(2, 0x654321); // Darker brown border
        prevButton.setInteractive();
        prevButton.on('pointerdown', () => {
            this.sound.play('paper-turn2', { rate: 0.8 });
            this.previousGuidebookPage();
        });
        this.guidebookModal.add(prevButton);

        const prevButtonText = this.add.text(modalX + 200, buttonY, 'Previous', {
            fontSize: '16px',
            fontFamily: 'Minecraft, Courier New, monospace',
            color: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 1,
            resolution: 1
        }).setOrigin(0.5);
        this.guidebookModal.add(prevButtonText);

        // Page indicator - styled for handbook page
        const pageIndicator = this.add.text(530, buttonY, `${this.currentGuidebookPage + 1} / ${this.guidebookPages.length}`, {
            fontSize: '16px',
            fontFamily: 'Minecraft, Courier New, monospace',
            color: '#2c3e50', // Dark text for paper background
            stroke: '#ffffff',
            strokeThickness: 1
        }).setOrigin(0.5);
        this.guidebookModal.add(pageIndicator);

        // Next button - styled for handbook page
        const nextButton = this.add.rectangle(modalX + modalWidth - 150, buttonY, buttonWidth, buttonHeight, 0x8B4513); // Brown paper color
        nextButton.setStrokeStyle(2, 0x654321); // Darker brown border
        nextButton.setInteractive();
        nextButton.on('pointerdown', () => {
            this.sound.play('paper-turn2', { rate: 0.8 });
            this.nextGuidebookPage();

        });
        this.guidebookModal.add(nextButton);

        const nextButtonText = this.add.text(modalX + modalWidth - 150, buttonY, 'Next', {
            fontSize: '16px',
            fontFamily: 'Minecraft, Courier New, monospace',
            color: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 1,
            resolution: 1
        }).setOrigin(0.5);
        this.guidebookModal.add(nextButtonText);

        // Update button states
        this.updateGuidebookNavigation(prevButton, nextButton, pageIndicator);

        // Add hover effects - styled for handbook page
        prevButton.on('pointerover', () => {
            if (this.currentGuidebookPage > 0) {
                prevButton.setFillStyle(0xA0522D); // Lighter brown on hover
            }
        });

        prevButton.on('pointerout', () => {
            prevButton.setFillStyle(0x8B4513); // Back to original brown
        });

        nextButton.on('pointerover', () => {
            if (this.currentGuidebookPage < this.guidebookPages.length - 1) {
                nextButton.setFillStyle(0xA0522D); // Lighter brown on hover
            }
        });

        nextButton.on('pointerout', () => {
            nextButton.setFillStyle(0x8B4513); // Back to original brown
        });
    }

    updateGuidebookNavigation(prevButton, nextButton, pageIndicator) {
        // Update page indicator
        pageIndicator.setText(`${this.currentGuidebookPage + 1} / ${this.guidebookPages.length}`);

        // Update button states
        if (this.currentGuidebookPage === 0) {
            prevButton.setAlpha(0.5);
            prevButton.removeInteractive();
        } else {
            prevButton.setAlpha(1);
            prevButton.setInteractive();
        }

        if (this.currentGuidebookPage === this.guidebookPages.length - 1) {
            nextButton.setAlpha(0.5);
            nextButton.removeInteractive();
        } else {
            nextButton.setAlpha(1);
            nextButton.setInteractive();
        }
    }

    nextGuidebookPage() {
        if (this.currentGuidebookPage < this.guidebookPages.length - 1) {
            this.currentGuidebookPage++;
            this.hideGuidebookModal();
            this.createGuidebookModal();
        }
    }

    previousGuidebookPage() {
        if (this.currentGuidebookPage > 0) {
            this.currentGuidebookPage--;
            this.hideGuidebookModal();
            this.createGuidebookModal();
        }
    }

    hideGuidebookModal() {
        if (this.guidebookModal) {
            this.guidebookModal.destroy();
            this.guidebookModal = null;
        }
    }

    startNewDay() {
        // Show day start modal
        this.showDayStartModal();
    }

    showDayStartModal() {
        // Create day start modal container
        this.dayStartModal = this.add.container(0, 0);
        this.dayStartModal.setDepth(200);

        // Modal background - make interactive to block clicks
        const modalBg = this.add.graphics();
        modalBg.fillStyle(0x000000, 0.8);
        modalBg.fillRect(0, 0, 1024, 768);
        modalBg.setInteractive(new Phaser.Geom.Rectangle(0, 0, 1024, 768), Phaser.Geom.Rectangle.Contains);
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
            fontFamily: 'Minecraft, Courier New, monospace',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
        this.dayStartModal.add(dayStartText);

        const instructionText = this.add.text(512, modalY + 140, 'Ready to start trading?', {
            fontSize: '20px',
            fontFamily: 'Minecraft, Courier New, monospace',
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
            fontFamily: 'Minecraft, Courier New, monospace',
            color: '#000000',
            stroke: '#ffffff',
            strokeThickness: 1
        }).setOrigin(0.5);
        this.dayStartModal.add(startButtonText);

        // Add hover effect to start button
        startButton.on('pointerover', () => {
            this.tweens.add({
                targets: [startButton, startButtonText],
                x: '-=2',
                y: '+=2',
                duration: 100,
                ease: 'Power2'
            });
        });

        startButton.on('pointerout', () => {
            this.tweens.add({
                targets: [startButton, startButtonText],
                x: '+=2',
                y: '-=2',
                duration: 100,
                ease: 'Power2'
            });
        });
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
        if (this.clientAvatar) {
            this.clientAvatar.destroy();
            this.avatarHitbox.destroy();
        }
        // Get a random scenario
        this.currentClient = this.scenarioManager.getScenarioByScenarioCount(this.gameState.scenarioCount);

        // Initialize analytics tracking for this scenario
        this.initializeScenarioAnalytics();

        // Get client data for this scenario
        const clientData = this.scenarioManager.getScenarioClient(this.currentClient);

        // Use client avatar or fallback to tech-bro
        const avatarKey = clientData ? clientData.avatar.replace('.png', '') : 'tech-bro';

        // Create client avatar using dynamic image
        this.clientAvatar = this.add.image(-200, 326, avatarKey);
        this.clientAvatar.setOrigin(0.5);
        this.clientAvatar.setScale(0.3);
        this.clientAvatar.setDepth(50);

        // Create a larger hitbox for better interaction
        this.avatarHitbox = this.add.rectangle(-200, 335, 130, 295, 0xff0000, 0);
        this.avatarHitbox.setInteractive();
        this.avatarHitbox.setDepth(51); // Above the avatar

        // Avatar label will be created after slide-in animation completes

        // Slide client in
        this.tweens.add({
            targets: [this.clientAvatar, this.avatarHitbox],
            x: 250,
            duration: 800,
            ease: 'Back.easeOut',
            onComplete: () => {
                // Play client voice
                this.sound.play(clientData.voice, { rate: 1 });
                // Create avatar label after positioning is complete
                this.createAvatarLabel();
                this.showClientOpeningStatement();
            }
        });

        // Highlight interactive elements
        this.highlightClueElements();
    }

    showClientOpeningStatement() {
        // Show opening statement in speech bubble
        this.showSpeechBubble(this.currentClient.openingStatement); // opening statement should close when a recommendation is made.

        // Make client avatar clickable to toggle opening dialogue
        this.avatarHitbox.on('pointerdown', () => {
            if (this.speechBubble && this.speechBubble.alpha > 0) {
                // Hide speech bubble if it's visible
                this.hideSpeechBubble();
            } else {
                // Show speech bubble if it's hidden
                this.showSpeechBubble(this.currentClient.openingStatement);
            }
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
        this.speechBubble.fillRoundedRect(bubbleX - bubbleWidth / 2, bubbleY - bubbleHeight / 2, bubbleWidth, bubbleHeight, 15);
        this.speechBubble.strokeRoundedRect(bubbleX - bubbleWidth / 2, bubbleY - bubbleHeight / 2, bubbleWidth, bubbleHeight, 15);

        // Draw tail
        const tailPoints = [
            bubbleX - 60, bubbleY + bubbleHeight / 2,
            bubbleX - 80, bubbleY + bubbleHeight / 2 + 25,
            bubbleX - 40, bubbleY + bubbleHeight / 2
        ];
        this.speechBubble.fillStyle(0x000000, 0.95);
        this.speechBubble.lineStyle(3, 0xffffff, 1);
        this.speechBubble.fillTriangle(...tailPoints);
        this.speechBubble.strokeTriangle(...tailPoints);

        // Add text
        this.bubbleText = this.add.text(bubbleX, bubbleY, text, {
            fontFamily: 'Minecraft, Courier New, monospace',
            fontSize: '16px',
            color: 'white',
            align: 'center',
            wordWrap: { width: bubbleWidth - 20 }
        });

        this.bubbleText.setOrigin(0.5);
        this.bubbleText.setDepth(76);

        // Add red X close button
        const closeX = bubbleX + bubbleWidth / 2 - 16;
        const closeY = bubbleY - bubbleHeight / 2 + 16;
        
        this.speechBubbleCloseButton = this.add.rectangle(closeX, closeY, 20, 20, 0xff0000);
        this.speechBubbleCloseButton.setInteractive();
        this.speechBubbleCloseButton.setDepth(77);
        this.speechBubbleCloseButton.on('pointerdown', () => {
            this.hideSpeechBubble();
        });

        // Add X text
        this.speechBubbleCloseText = this.add.text(closeX, closeY, 'X', {
            fontFamily: 'Minecraft, Courier New, monospace',
            fontSize: '14px',
            color: 'white',
            fontStyle: 'bold'
        });
        this.speechBubbleCloseText.setOrigin(0.5);
        this.speechBubbleCloseText.setDepth(78);

        // Animate in
        this.speechBubble.setAlpha(0);
        this.bubbleText.setAlpha(0);
        this.speechBubbleCloseButton.setAlpha(0);
        this.speechBubbleCloseText.setAlpha(0);

        this.tweens.add({
            targets: [this.speechBubble, this.bubbleText, this.speechBubbleCloseButton, this.speechBubbleCloseText],
            alpha: 1,
            duration: 300,
            ease: 'Power2'
        });
    }

    hideSpeechBubble() {
        if (this.speechBubble && this.bubbleText && this.speechBubbleCloseButton && this.speechBubbleCloseText) {
            this.tweens.add({
                targets: [this.speechBubble, this.bubbleText, this.speechBubbleCloseButton, this.speechBubbleCloseText],
                alpha: 0,
                duration: 300,
                ease: 'Power2',
                onComplete: () => {
                    this.speechBubble.destroy();
                    this.bubbleText.destroy();
                    this.speechBubbleCloseButton.destroy();
                    this.speechBubbleCloseText.destroy();
                    this.speechBubble = null;
                    this.bubbleText = null;
                    this.speechBubbleCloseButton = null;
                    this.speechBubbleCloseText = null;
                }
            });
        }
    }

    showPhoneBubble(text) {
        // Hide any existing phone bubble first
        this.hidePhoneBubble();
        
        // Create phone bubble positioned above the phone
        const bubbleWidth = 280;
        const bubbleHeight = 100;
        const bubbleX = 805; // Phone X position
        const bubbleY = 400; // Above the phone

        this.phoneBubble = this.add.graphics();
        this.phoneBubble.setDepth(75);

        // Draw bubble
        this.phoneBubble.fillStyle(0x000000, 0.95);
        this.phoneBubble.lineStyle(3, 0xffffff, 1);
        this.phoneBubble.fillRoundedRect(bubbleX - bubbleWidth / 2, bubbleY - bubbleHeight / 2, bubbleWidth, bubbleHeight, 15);
        this.phoneBubble.strokeRoundedRect(bubbleX - bubbleWidth / 2, bubbleY - bubbleHeight / 2, bubbleWidth, bubbleHeight, 15);

        // Draw tail pointing down to phone
        const tailPoints = [
            bubbleX, bubbleY + bubbleHeight / 2,
            bubbleX - 20, bubbleY + bubbleHeight / 2 + 25,
            bubbleX + 20, bubbleY + bubbleHeight / 2 + 25
        ];
        this.phoneBubble.fillStyle(0x000000, 0.95);
        this.phoneBubble.lineStyle(3, 0xffffff, 1);
        this.phoneBubble.fillTriangle(...tailPoints);
        this.phoneBubble.strokeTriangle(...tailPoints);

        // Add text
        this.phoneBubbleText = this.add.text(bubbleX, bubbleY - 10, text, {
            fontFamily: 'Minecraft, Courier New, monospace',
            fontSize: '14px',
            color: 'white',
            align: 'center',
            wordWrap: { width: bubbleWidth - 40 }
        });
        this.phoneBubbleText.setOrigin(0.5);
        this.phoneBubbleText.setDepth(76);

        // Add red X close button
        const closeX = bubbleX + bubbleWidth / 2 - 20;
        const closeY = bubbleY - bubbleHeight / 2 + 25;
        
        this.phoneBubbleCloseButton = this.add.rectangle(closeX, closeY, 20, 20, 0xff0000);
        this.phoneBubbleCloseButton.setInteractive();
        this.phoneBubbleCloseButton.setDepth(77);
        this.phoneBubbleCloseButton.on('pointerdown', () => {
            this.hidePhoneBubble();
        });

        // Add X text
        this.phoneBubbleCloseText = this.add.text(closeX, closeY, 'X', {
            fontFamily: 'Minecraft, Courier New, monospace',
            fontSize: '14px',
            color: 'white',
            fontStyle: 'bold'
        });
        this.phoneBubbleCloseText.setOrigin(0.5);
        this.phoneBubbleCloseText.setDepth(78);

        // Animate in
        this.phoneBubble.setAlpha(0);
        this.phoneBubbleText.setAlpha(0);
        this.phoneBubbleCloseButton.setAlpha(0);
        this.phoneBubbleCloseText.setAlpha(0);

        this.tweens.add({
            targets: [this.phoneBubble, this.phoneBubbleText, this.phoneBubbleCloseButton, this.phoneBubbleCloseText],
            alpha: 1,
            duration: 300,
            ease: 'Power2'
        });
    }

    hidePhoneBubble() {
        if (this.phoneBubble && this.phoneBubbleText && this.phoneBubbleCloseButton && this.phoneBubbleCloseText) {
            this.tweens.add({
                targets: [this.phoneBubble, this.phoneBubbleText, this.phoneBubbleCloseButton, this.phoneBubbleCloseText],
                alpha: 0,
                duration: 300,
                ease: 'Power2',
                onComplete: () => {
                    this.phoneBubble.destroy();
                    this.phoneBubbleText.destroy();
                    this.phoneBubbleCloseButton.destroy();
                    this.phoneBubbleCloseText.destroy();
                    this.phoneBubble = null;
                    this.phoneBubbleText = null;
                    this.phoneBubbleCloseButton = null;
                    this.phoneBubbleCloseText = null;
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
            this.trackClueAccessed('wordOfMouth');
            this.showPhoneBubble(clue);
        }
    }

    showComputerClue() {
        // Get chart data from current scenario
        const chartData = this.scenarioManager.getClueByCategory(this.currentClient, 'charts');
        
        if (chartData && chartData.type && chartData.title) {
            this.trackClueAccessed('charts');
            
            // Map the chart type to the correct image name
            let imageKey = chartData.type;
            
            // Handle pie chart naming differences
            if (chartData.type === 'pie-green') {
                imageKey = 'graph-green-pie';
            } else if (chartData.type === 'pie-red') {
                imageKey = 'graph-red-pie';
            }
            
            this.showComputerModal(imageKey, chartData.title);
        } else {
            // Fallback if no chart data is available
            this.showComputerModal('graph-down', 'MARKET ANALYSIS REPORT');
        }
    }

    showNewspaperClue() {
        const clue = this.scenarioManager.getClueByCategory(this.currentClient, 'newspaper');
        if (clue) {
            this.trackClueAccessed('newspaper');
            this.showNewspaperModal(clue);
            this.sound.play('paper-turn', { volume: 1 });
        }
    }

    showClientFiles() {
        if (!this.currentClient) {
            return;
        }

        // Track that client files were accessed
        this.trackClientFilesAccessed();

        // Get client data from the clients array
        const clientData = this.scenarioManager.getScenarioClient(this.currentClient);
        
        // Create client files modal container
        const modal = this.add.container(0, 0);
        modal.setDepth(150);
        
        // Modal background - make interactive to block clicks
        const modalBg = this.add.graphics();
        modalBg.fillStyle(0x000000, 0.8);
        modalBg.fillRect(0, 0, 1024, 768);
        modalBg.setInteractive(new Phaser.Geom.Rectangle(0, 0, 1024, 768), Phaser.Geom.Rectangle.Contains);
        modal.add(modalBg);
        
        // Modal content
        const modalWidth = 500;
        const modalHeight = 400;
        const modalX = (1024 - modalWidth) / 2;
        const modalY = (768 - modalHeight) / 2;

        const modalContent = this.add.graphics();
        modalContent.fillStyle(0x2c3e50, 0.95);
        modalContent.lineStyle(3, 0xffffff, 1);
        modalContent.fillRoundedRect(modalX, modalY, modalWidth, modalHeight, 15);
        modalContent.strokeRoundedRect(modalX, modalY, modalWidth, modalHeight, 15);
        modal.add(modalContent);

        // Title
        const titleText = this.add.text(512, modalY + 30, 'CLIENT FILES', {
            fontSize: '28px',
            fontFamily: 'Minecraft, Courier New, monospace',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
        modal.add(titleText);

        // Client Name Section
        const nameY = modalY + 80;
        const clientName = clientData ? clientData.name : 'Unknown Client';
        
        const clientNameText = this.add.text(modalX + 20, nameY, `${clientName.toUpperCase()}`, {
            fontSize: '20px',
            fontFamily: 'Minecraft, Courier New, monospace',
            color: '#3498db',
            stroke: '#000000',
            strokeThickness: 1
        });
        modal.add(clientNameText);

        // Client Description Section
        const descY = nameY + 40;
        const clientDesc = clientData ? clientData.description : 'No description available';
        
        console.log('Client data:', clientData);
        console.log('Client description:', clientDesc);
        
        const clientDescText = this.add.text(modalX + 20, descY, clientDesc, {
            fontSize: '16px',
            fontFamily: 'Minecraft, Courier New, monospace',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2,
            wordWrap: { width: modalWidth - 40 }
        });
        modal.add(clientDescText);

        // Risk Factor Section
        const riskY = descY + 60;
        const riskFactor = clientData ? clientData.riskFactor : 'N/A';
        console.log('Client risk tolerance:', riskFactor);
        const riskColor = riskFactor >= 7 ? '#e74c3c' : riskFactor >= 4 ? '#f39c12' : '#27ae60'; // Red for high, orange for medium, green for low
        
        const riskTitleText = this.add.text(modalX + 20, riskY, 'CLIENT RISK TOLERANCE:', {
            fontSize: '16px',
            fontFamily: 'Minecraft, Courier New, monospace',
            color: '#f39c12',
            stroke: '#000000',
            strokeThickness: 1
        });
        modal.add(riskTitleText);

        const riskValueText = this.add.text(modalX + 20, riskY + 25, `${riskFactor}/10`, {
            fontSize: '18px',
            fontFamily: 'Minecraft, Courier New, monospace',
            color: riskColor,
            stroke: '#000000',
            strokeThickness: 1
        });
        modal.add(riskValueText);

        // Close button
        const closeButton = this.add.rectangle(512, modalY + modalHeight - 40, 120, 40, 0x8B4513);
        closeButton.setInteractive();
        closeButton.on('pointerdown', () => {
            modal.destroy();
        });
        modal.add(closeButton);
        
        const closeButtonText = this.add.text(512, modalY + modalHeight - 40, 'Close Files', {
            fontSize: '16px',
            color: '#ffffff',
            fontFamily: 'Minecraft, Courier New, monospace',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 1
        }).setOrigin(0.5);
        modal.add(closeButtonText);
        
        // Add hover effect to close button
        closeButton.on('pointerover', () => {
            closeButton.setFillStyle(0xA0522D);
        });
        
        closeButton.on('pointerout', () => {
            closeButton.setFillStyle(0x8B4513);
        });

        // Play paper sound effect
        this.sound.play('paper-turn', { volume: 0.5 });
    }

    showComputerModal(computerImageKey, headerText) {
        // Create computer modal container
        const modal = this.add.container(0, 0);
        modal.setDepth(150);
        
        // Modal background - make interactive to block clicks
        const modalBg = this.add.graphics();
        modalBg.fillStyle(0x000000, 0.8);
        modalBg.fillRect(0, 0, 1024, 768);
        modalBg.setInteractive(new Phaser.Geom.Rectangle(0, 0, 1024, 768), Phaser.Geom.Rectangle.Contains);
        modal.add(modalBg);
        
        // Display the computer UI sprite centered
        const computerSprite = this.add.image(512, 384, computerImageKey);
        computerSprite.setScale(0.6); // Scale to fit nicely in modal
        modal.add(computerSprite);
        
        // Create header text overlay
        const header = this.add.text(500, 218, headerText, {
            fontFamily: '"Minecraft", "Courier New", monospace',
            fontSize: '38px',
            color: '#ffffff', // White text for better visibility
            fontStyle: 'bold',
            align: 'center',
            stroke: '#000000',
            strokeThickness: 2,
            textShadow: {
                offsetX: 1,
                offsetY: 1,
                color: '#333333',
                blur: 2,
                stroke: false,
                fill: true
            },
            wordWrap: { width: 380 },
            resolution: 1, // Lower resolution for more pixelated effect
        }).setOrigin(0.5, 0.25);
        modal.add(header);
        
        // Close button positioned below the computer screen
        const closeButton = this.add.rectangle(512, 600, 120, 40, 0x8B4513);
        closeButton.setInteractive();
        closeButton.on('pointerdown', () => {
            modal.destroy();
        });
        modal.add(closeButton);
        
        const closeButtonText = this.add.text(512, 600, 'Close', {
            fontSize: '18px',
            color: '#ffffff',
            fontFamily: '"Minecraft", "Courier New", monospace',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 1,
            resolution: 1, // Lower resolution for pixelated effect
        }).setOrigin(0.5);
        modal.add(closeButtonText);
        
        // Add hover effect to close button
        closeButton.on('pointerover', () => {
            closeButton.setFillStyle(0xA0522D);
        });
        
        closeButton.on('pointerout', () => {
            closeButton.setFillStyle(0x8B4513);
        });
    }

    showNewspaperModal(clue) {
        // Create newspaper modal container
        const modal = this.add.container(0, 0);
        modal.setDepth(150);
        
        // Modal background - make interactive to block clicks
        const modalBg = this.add.graphics();
        modalBg.fillStyle(0x000000, 0.8);
        modalBg.fillRect(0, 0, 1024, 768);
        modalBg.setInteractive(new Phaser.Geom.Rectangle(0, 0, 1024, 768), Phaser.Geom.Rectangle.Contains);
        modal.add(modalBg);
        
        // Display the newspaper sprite centered
        const newspaperSprite = this.add.image(512, 384, 'newspaper');
        newspaperSprite.setScale(0.6); // Scale to fit nicely in modal
        modal.add(newspaperSprite);
        
        // Extract headline from clue (assume first line or sentence is the headline)
        const headlineText = this.extractHeadline(clue);
        
        // Create pixelated headline text overlay
        const headline = this.add.text(512, 280, headlineText, {
            fontFamily: '"Minecraft", "Courier New", monospace', // More pixelated fonts
            fontSize: '38px',
            color: '#000000', // Black text for newspaper
            fontStyle: 'bold',
            align: 'center',
            wordWrap: { width: 380 },
            // shadow: {
            //     offsetX: 2,
            //     offsetY: 2,
            //     color: '#666666',
            //     blur: 0,
            //     stroke: false,
            //     fill: true
            // },
            // CSS-style properties for more pixelated look
            resolution: 1, // Lower resolution for more pixelated effect
        }).setOrigin(0.5, 0.25);
        modal.add(headline);
        
        // Add subtitle text if clue has more content
        const subtitleText = this.extractSubtitle(clue);
        if (subtitleText) {
            const subtitle = this.add.text(512, 320, subtitleText, {
                fontFamily: '"Minecraft", "Courier New", monospace',
                fontSize: '16px',
                color: '#444444',
                align: 'center',
                wordWrap: { width: 350 },
                shadow: {
                    offsetX: 1,
                    offsetY: 1,
                    color: '#888888',
                    blur: 0,
                    stroke: false,
                    fill: true
                },
                resolution: 1, // Lower resolution for pixelated effect
            }).setOrigin(0.5, 0.25);
            modal.add(subtitle);
        }
        
        // Close button positioned below the newspaper
        const closeButton = this.add.rectangle(512, 600, 120, 40, 0x8B4513);
        closeButton.setInteractive();
        closeButton.on('pointerdown', () => {
            modal.destroy();
        });
        modal.add(closeButton);
        
        const closeButtonText = this.add.text(512, 600, 'Close', {
            fontSize: '18px',
            color: '#ffffff',
            fontFamily: '"Minecraft", "Courier New", monospace',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 1,
            resolution: 1, // Lower resolution for pixelated effect
        }).setOrigin(0.5);
        modal.add(closeButtonText);
        
        // Add hover effect to close button
        closeButton.on('pointerover', () => {
            closeButton.setFillStyle(0xA0522D);
        });
        
        closeButton.on('pointerout', () => {
            closeButton.setFillStyle(0x8B4513);
        });
    }
    
    extractHeadline(clueText) {
        // Extract the first line or sentence as headline
        const lines = clueText.split('\n');
        const firstLine = lines[0] || clueText;
        
        // If it's a long sentence, take first part up to first period or limit characters
        if (firstLine.length > 60) {
            const sentenceEnd = firstLine.indexOf('.');
            if (sentenceEnd > 0 && sentenceEnd < 60) {
                return firstLine.substring(0, sentenceEnd + 1).toUpperCase();
            } else {
                return firstLine.substring(0, 60).toUpperCase() + '...';
            }
        }
        
        return firstLine.toUpperCase();
    }
    
    extractSubtitle(clueText) {
        // Extract remaining text as subtitle
        const lines = clueText.split('\n');
        if (lines.length > 1) {
            return lines.slice(1).join('\n').substring(0, 200);
        }
        
        // If it's one long line, take the part after the headline
        const firstLine = lines[0] || clueText;
        if (firstLine.length > 60) {
            const remaining = firstLine.substring(60);
            return remaining.length > 200 ? remaining.substring(0, 200) + '...' : remaining;
        }
        
        return null;
    }

    showClueModal(title, content) {
        // Create modal container
        const modal = this.add.container(0, 0);
        modal.setDepth(150);

        // Modal background - make interactive to block clicks
        const modalBg = this.add.graphics();
        modalBg.fillStyle(0x000000, 0.8);
        modalBg.fillRect(0, 0, 1024, 768);
        modalBg.setInteractive(new Phaser.Geom.Rectangle(0, 0, 1024, 768), Phaser.Geom.Rectangle.Contains);
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
            fontFamily: 'Minecraft, Courier New, monospace',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
        modal.add(titleText);

        // Content
        const contentText = this.add.text(512, modalY + 100, content, {
            fontSize: '16px',
            fontFamily: 'Minecraft, Courier New, monospace',
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
            fontFamily: 'Minecraft, Courier New, monospace',
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

        // Modal background - make interactive to block clicks
        const modalBg = this.add.graphics();
        modalBg.fillStyle(0x000000, 0.8);
        modalBg.fillRect(0, 0, 1024, 768);
        modalBg.setInteractive(new Phaser.Geom.Rectangle(0, 0, 1024, 768), Phaser.Geom.Rectangle.Contains);
        this.decisionModal.add(modalBg);

        // Paper-like modal content - long and narrow
        const modalWidth = 700;
        const modalHeight = 450;
        const modalX = (1024 - modalWidth) / 2;
        const modalY = (768 - modalHeight) / 2;

        // Paper background with cream color
        const modalContent = this.add.graphics();
        modalContent.fillStyle(0xF5F5DC, 0.95); // Cream color
        modalContent.lineStyle(2, 0x000000, 1); // Black border
        modalContent.fillRoundedRect(modalX, modalY, modalWidth, modalHeight, 5);
        modalContent.strokeRoundedRect(modalX, modalY, modalWidth, modalHeight, 5);
        this.decisionModal.add(modalContent);

        // Add paper texture lines
        for (let i = 0; i < 8; i++) {
            const lineY = modalY + 80 + (i * 25);
            const line = this.add.graphics();
            line.lineStyle(1, 0xE0E0E0, 0.3); // Light grey lines
            line.beginPath();
            line.moveTo(modalX + 40, lineY);
            line.lineTo(modalX + modalWidth - 40, lineY);
            line.strokePath();
            this.decisionModal.add(line);
        }

        // Title
        const titleText = this.add.text(512, modalY + 50, 'INVESTMENT RECOMMENDATION', {
            fontSize: '28px',
            fontFamily: 'Minecraft, Courier New, monospace',
            color: '#000000',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 1
        }).setOrigin(0.5);
        this.decisionModal.add(titleText);

        // Decision buttons - vertically stacked (bigger)
        const buttonWidth = 320;
        const buttonHeight = 80;
        const buttonSpacing = 25;
        const startX = modalX + (modalWidth - buttonWidth) / 2;
        const startY = modalY + 130;

        // Call button (L-shaped border only)
        const callButton = this.add.rectangle(startX + buttonWidth/2, startY, buttonWidth, buttonHeight, 0x000000, 0); // Transparent fill
        callButton.setStrokeStyle(3, 0x000000);
        callButton.setInteractive();
        callButton.on('pointerdown', () => this.makeDecision('call'));
        this.decisionModal.add(callButton);

        // Draw L-shaped border for Call button
        const callButtonGraphics = this.add.graphics();
        callButtonGraphics.lineStyle(4, 0x000000, 1);
        callButtonGraphics.beginPath();
        callButtonGraphics.moveTo(startX, startY - buttonHeight/2); // Top left
        callButtonGraphics.lineTo(startX + buttonWidth, startY - buttonHeight/2); // Top right
        callButtonGraphics.lineTo(startX + buttonWidth, startY + buttonHeight/2); // Bottom right
        callButtonGraphics.lineTo(startX, startY + buttonHeight/2); // Bottom left
        callButtonGraphics.lineTo(startX, startY - buttonHeight/2 + 20); // Back up to create L shape
        callButtonGraphics.strokePath();
        this.decisionModal.add(callButtonGraphics);

        // Call button hover fill
        const callButtonFill = this.add.graphics();
        callButtonFill.fillStyle(0x404040, 0.4); // Dark grey fill
        callButtonFill.fillRoundedRect(startX + 2, startY - buttonHeight/2 + 2, buttonWidth - 4, buttonHeight - 4, 2);
        callButtonFill.setAlpha(0); // Start hidden
        this.decisionModal.add(callButtonFill);

        const callButtonText = this.add.text(startX + buttonWidth/2, startY, 'CALL', {
            fontSize: '26px',
            fontFamily: 'Minecraft, Courier New, monospace',
            color: '#000000',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 1
        }).setOrigin(0.5);
        this.decisionModal.add(callButtonText);

        // Call button hover effects
        callButton.on('pointerover', () => {
            callButtonFill.setAlpha(1);
            this.tweens.add({
                targets: [callButton, callButtonGraphics, callButtonText, callButtonFill],
                x: '-=2',
                y: '+=2',
                duration: 100,
                ease: 'Power2'
            });
        });

        callButton.on('pointerout', () => {
            callButtonFill.setAlpha(0);
            this.tweens.add({
                targets: [callButton, callButtonGraphics, callButtonText, callButtonFill],
                x: '+=2',
                y: '-=2',
                duration: 100,
                ease: 'Power2'
            });
        });

        // Put button (L-shaped border only)
        const putButton = this.add.rectangle(startX + buttonWidth/2, startY + buttonHeight + buttonSpacing, buttonWidth, buttonHeight, 0x000000, 0); // Transparent fill
        putButton.setStrokeStyle(3, 0x000000);
        putButton.setInteractive();
        putButton.on('pointerdown', () => this.makeDecision('put'));
        this.decisionModal.add(putButton);

        // Draw L-shaped border for Put button
        const putButtonGraphics = this.add.graphics();
        putButtonGraphics.lineStyle(4, 0x000000, 1);
        putButtonGraphics.beginPath();
        putButtonGraphics.moveTo(startX, startY + buttonHeight + buttonSpacing - buttonHeight/2); // Top left
        putButtonGraphics.lineTo(startX + buttonWidth, startY + buttonHeight + buttonSpacing - buttonHeight/2); // Top right
        putButtonGraphics.lineTo(startX + buttonWidth, startY + buttonHeight + buttonSpacing + buttonHeight/2); // Bottom right
        putButtonGraphics.lineTo(startX, startY + buttonHeight + buttonSpacing + buttonHeight/2); // Bottom left
        putButtonGraphics.lineTo(startX, startY + buttonHeight + buttonSpacing - buttonHeight/2 + 20); // Back up to create L shape
        putButtonGraphics.strokePath();
        this.decisionModal.add(putButtonGraphics);

        // Put button hover fill
        const putButtonFill = this.add.graphics();
        putButtonFill.fillStyle(0x404040, 0.4); // Dark grey fill
        putButtonFill.fillRoundedRect(startX + 2, startY + buttonHeight + buttonSpacing - buttonHeight/2 + 2, buttonWidth - 4, buttonHeight - 4, 2);
        putButtonFill.setAlpha(0); // Start hidden
        this.decisionModal.add(putButtonFill);

        const putButtonText = this.add.text(startX + buttonWidth/2, startY + buttonHeight + buttonSpacing, 'PUT', {
            fontSize: '26px',
            fontFamily: 'Minecraft, Courier New, monospace',
            color: '#000000',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 1
        }).setOrigin(0.5);
        this.decisionModal.add(putButtonText);

        // Put button hover effects
        putButton.on('pointerover', () => {
            putButtonFill.setAlpha(1);
            this.tweens.add({
                targets: [putButton, putButtonGraphics, putButtonText, putButtonFill],
                x: '-=2',
                y: '+=2',
                duration: 100,
                ease: 'Power2'
            });
        });

        putButton.on('pointerout', () => {
            putButtonFill.setAlpha(0);
            this.tweens.add({
                targets: [putButton, putButtonGraphics, putButtonText, putButtonFill],
                x: '+=2',
                y: '-=2',
                duration: 100,
                ease: 'Power2'
            });
        });

        // Hold button (L-shaped border only)
        const holdButton = this.add.rectangle(startX + buttonWidth/2, startY + (buttonHeight + buttonSpacing) * 2, buttonWidth, buttonHeight, 0x000000, 0); // Transparent fill
        holdButton.setStrokeStyle(3, 0x000000);
        holdButton.setInteractive();
        holdButton.on('pointerdown', () => this.makeDecision('hold'));
        this.decisionModal.add(holdButton);

        // Draw L-shaped border for Hold button
        const holdButtonGraphics = this.add.graphics();
        holdButtonGraphics.lineStyle(4, 0x000000, 1);
        holdButtonGraphics.beginPath();
        holdButtonGraphics.moveTo(startX, startY + (buttonHeight + buttonSpacing) * 2 - buttonHeight/2); // Top left
        holdButtonGraphics.lineTo(startX + buttonWidth, startY + (buttonHeight + buttonSpacing) * 2 - buttonHeight/2); // Top right
        holdButtonGraphics.lineTo(startX + buttonWidth, startY + (buttonHeight + buttonSpacing) * 2 + buttonHeight/2); // Bottom right
        holdButtonGraphics.lineTo(startX, startY + (buttonHeight + buttonSpacing) * 2 + buttonHeight/2); // Bottom left
        holdButtonGraphics.lineTo(startX, startY + (buttonHeight + buttonSpacing) * 2 - buttonHeight/2 + 20); // Back up to create L shape
        holdButtonGraphics.strokePath();
        this.decisionModal.add(holdButtonGraphics);

        // Hold button hover fill
        const holdButtonFill = this.add.graphics();
        holdButtonFill.fillStyle(0x404040, 0.4); // Dark grey fill
        holdButtonFill.fillRoundedRect(startX + 2, startY + (buttonHeight + buttonSpacing) * 2 - buttonHeight/2 + 2, buttonWidth - 4, buttonHeight - 4, 2);
        holdButtonFill.setAlpha(0); // Start hidden
        this.decisionModal.add(holdButtonFill);

        const holdButtonText = this.add.text(startX + buttonWidth/2, startY + (buttonHeight + buttonSpacing) * 2, 'HOLD', {
            fontSize: '26px',
            fontFamily: 'Minecraft, Courier New, monospace',
            color: '#000000',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 1
        }).setOrigin(0.5);
        this.decisionModal.add(holdButtonText);

        // Hold button hover effects
        holdButton.on('pointerover', () => {
            holdButtonFill.setAlpha(1);
            this.tweens.add({
                targets: [holdButton, holdButtonGraphics, holdButtonText, holdButtonFill],
                x: '-=2',
                y: '+=2',
                duration: 100,
                ease: 'Power2'
            });
        });

        holdButton.on('pointerout', () => {
            holdButtonFill.setAlpha(0);
            this.tweens.add({
                targets: [holdButton, holdButtonGraphics, holdButtonText, holdButtonFill],
                x: '+=2',
                y: '-=2',
                duration: 100,
                ease: 'Power2'
            });
        });

        // Close button - styled like other modal close buttons
        const closeButton = this.add.rectangle(512, modalY + modalHeight - 40, 120, 40, 0x8B4513);
        closeButton.setInteractive();
        closeButton.on('pointerdown', () => {
            this.hideDecisionModal();
        });
        this.decisionModal.add(closeButton);

        const closeButtonText = this.add.text(512, modalY + modalHeight - 40, 'Close', {
            fontSize: '18px',
            fontFamily: 'Minecraft, Courier New, monospace',
            color: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 1,
            resolution: 1
        }).setOrigin(0.5);
        this.decisionModal.add(closeButtonText);

        // Add hover effect to close button
        closeButton.on('pointerover', () => {
            closeButton.setFillStyle(0xA0522D); // Lighter brown on hover
        });

        closeButton.on('pointerout', () => {
            closeButton.setFillStyle(0x8B4513); // Back to original brown
        });
    }

    hideDecisionModal() {
        // Hide decision modal
        if (this.decisionModal) {
            this.decisionModal.destroy();
            this.decisionModal = null;
        }
    }

    makeDecision(decision) {
        // Remove interaction from client to prevent multiple clicks
        if (this.clientAvatar) {
            this.clientAvatar.removeInteractive();
        }

        // Hide decision modal
        this.hideDecisionModal();

        // Get outcome
        const outcome = this.scenarioManager.getOutcome(this.currentClient, decision);

        // Finalize analytics tracking
        if (this.currentScenarioAnalytics) {
            this.currentScenarioAnalytics.endTime = Date.now();
            this.currentScenarioAnalytics.decision = decision;
            this.currentScenarioAnalytics.outcome = outcome;
            
            // Analyze the performance
            const analysis = this.analyzeScenarioPerformance();
            if (analysis) {
                this.dailyAnalytics.push(analysis);
            }
        }

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

        // Hide opening statement bubble and then show outcome after animation completes
        this.hideSpeechBubble();
        this.hidePhoneBubble();
        this.time.delayedCall(350, () => {
            this.showOutcome(outcome);
        });

        // Update UI
        this.updateUI();

        this.gameState.scenarioCount++;

        // Move to next client (nextClient will handle day completion check)
        this.time.delayedCall(3000, () => {
            this.nextClient();
        });
    }

    showOutcome(outcome) {
        // Show outcome in speech bubble
        this.showSpeechBubble(outcome.message);
    }

    removeAvatar(shouldSpawnNew = true) {
        // Slide current client out
        console.log('Removing avatar');
        this.tweens.add({
            targets: [this.clientAvatar, this.avatarHitbox],
            x: -200,
            duration: 500,
            ease: 'Power2',
            onComplete: () => {
                // Clean up chat label before destroying avatar
                if (this.avatarHitbox.chatLabel) {
                    this.avatarHitbox.chatLabel.destroy();
                }
                if (this.avatarHitbox.chatLabelBg) {
                    this.avatarHitbox.chatLabelBg.destroy();
                }
                this.clientAvatar.destroy();
                this.avatarHitbox.destroy();
                // Only spawn new client if requested (not during day completion)
                if (shouldSpawnNew) {
                    this.spawnClient();
                }
            }
        });
    }
 
    nextClient() {
        // Check if we've completed all scenarios for the current day
        if (this.gameState.isDayComplete()) {
            this.completeDay();
            return;
        }

        // Remove interaction from current client
        if (this.avatarHitbox) {
            this.avatarHitbox.removeInteractive();
        }

        // Hide any speech bubbles
        this.hideSpeechBubble();
        this.hidePhoneBubble();
        this.removeAvatar();
    }

    completeDay() {

        this.removeAvatar(false);
        this.hideSpeechBubble();
        this.hidePhoneBubble();

        // Show enhanced day analytics
        this.showDayAnalytics();
    }

    showDayAnalytics() {
        // Calculate overall day performance
        const dayAnalytics = this.calculateDayAnalytics();

        // Create analytics modal container
        const analyticsModal = this.add.container(0, 0);
        analyticsModal.setDepth(200);

        // Modal background - make interactive to block clicks
        const modalBg = this.add.graphics();
        modalBg.fillStyle(0x000000, 0.8);
        modalBg.fillRect(0, 0, 1024, 768);
        modalBg.setInteractive(new Phaser.Geom.Rectangle(0, 0, 1024, 768), Phaser.Geom.Rectangle.Contains);
        analyticsModal.add(modalBg);

        // Modal content - larger for detailed breakdown
        const modalWidth = 700;
        const modalHeight = 750;
        const modalX = (1024 - modalWidth) / 2;
        const modalY = (768 - modalHeight) / 2;

        const modalContent = this.add.graphics();
        modalContent.fillStyle(0x2c3e50, 0.95);
        modalContent.lineStyle(3, 0xffffff, 1);
        modalContent.fillRoundedRect(modalX, modalY, modalWidth, modalHeight, 15);
        modalContent.strokeRoundedRect(modalX, modalY, modalWidth, modalHeight, 15);
        analyticsModal.add(modalContent);

        // Title
        const titleText = this.add.text(512, modalY + 40, `Day ${this.gameState.currentDay} Performance Analysis`, {
            fontSize: '26px',
            fontFamily: 'Minecraft, Courier New, monospace',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
        analyticsModal.add(titleText);

        // Overall score and grade
        const gradeColor = this.getGradeColor(dayAnalytics.overallGrade);
        const scoreText = this.add.text(512, modalY + 85, 
            `Overall Score: ${dayAnalytics.overallScore}/100 (Grade: ${dayAnalytics.overallGrade})`, {
            fontSize: '22px',
            fontFamily: 'Minecraft, Courier New, monospace',
            color: gradeColor,
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
        analyticsModal.add(scoreText);

        // Individual scenario breakdown
        let yOffset = modalY + 130;
        this.dailyAnalytics.forEach((analysis, index) => {
            const scenarioTitle = this.add.text(modalX + 20, yOffset, 
                `Scenario ${index + 1}: ${analysis.scenarioName}`, {
                fontSize: '18px',
                fontFamily: 'Minecraft, Courier New, monospace',
                color: '#3498db',
                stroke: '#000000',
                strokeThickness: 1
            });
            analyticsModal.add(scenarioTitle);
            yOffset += 25;

            const scenarioScore = this.add.text(modalX + 40, yOffset, 
                `Score: ${analysis.score}/100 (${analysis.grade}) | Clues: ${analysis.accessedClues.size}/${analysis.availableClues}`, {
                fontSize: '16px',
                fontFamily: 'Minecraft, Courier New, monospace',
                color: this.getGradeColor(analysis.grade),
                stroke: '#000000',
                strokeThickness: 1
            });
            analyticsModal.add(scenarioScore);
            yOffset += 20;

            // Show key feedback
            const keyFeedback = analysis.feedback.slice(0, 2); // Show first 2 feedback items
            keyFeedback.forEach(feedback => {
                const feedbackText = this.add.text(modalX + 40, yOffset, feedback, {
                    fontSize: '14px',
                    fontFamily: 'Minecraft, Courier New, monospace',
                    color: '#ecf0f1',
                    wordWrap: { width: modalWidth - 80 }
                });
                analyticsModal.add(feedbackText);
                yOffset += 18;
            });
            yOffset += 10;
        });

        // Key insights section
        const insightsY = modalY + modalHeight - 160;
        const insightsTitle = this.add.text(modalX + 20, insightsY, 'Key Insights:', {
            fontSize: '18px',
            fontFamily: 'Minecraft, Courier New, monospace',
            color: '#f39c12',
            stroke: '#000000',
            strokeThickness: 1
        });
        analyticsModal.add(insightsTitle);

        const insights = this.generateDayInsights(dayAnalytics);
        const insightsText = this.add.text(modalX + 20, insightsY + 25, insights, {
            fontSize: '16px',
            fontFamily: 'Minecraft, Courier New, monospace',
            color: '#ffffff',
            wordWrap: { width: modalWidth - 40 },
            lineSpacing: 2
        });
        analyticsModal.add(insightsText);

        // Continue button
        const continueButton = this.add.rectangle(512, modalY + modalHeight - 40, 140, 45, 0x27ae60);
        continueButton.setStrokeStyle(2, 0xffffff);
        continueButton.setInteractive();
        continueButton.on('pointerover', () => {
            this.sound.play('hover', { volume: 1 });
            continueButton.setFillStyle(0x2ecc71);
        });
        continueButton.on('pointerdown', () => {
            analyticsModal.destroy();
            this.startNextDay();
        });
        analyticsModal.add(continueButton);

        const continueButtonText = this.add.text(512, modalY + modalHeight - 40, 'Continue', {
            fontSize: '20px',
            fontFamily: 'Minecraft, Courier New, monospace',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 1
        }).setOrigin(0.5);
        analyticsModal.add(continueButtonText);

        // Add hover effect to continue button
        continueButton.on('pointerover', () => {
            continueButton.setFillStyle(0x2ecc71);
        });

        continueButton.on('pointerout', () => {
            continueButton.setFillStyle(0x27ae60);
        });
    }

    calculateDayAnalytics() {
        const totalScore = this.dailyAnalytics.reduce((sum, analysis) => sum + analysis.score, 0);
        const averageScore = this.dailyAnalytics.length > 0 ? Math.round(totalScore / this.dailyAnalytics.length) : 0;
        const overallGrade = this.getGrade(averageScore);

        return {
            overallScore: averageScore,
            overallGrade: overallGrade,
            totalScenarios: this.dailyAnalytics.length,
            perfectScores: this.dailyAnalytics.filter(a => a.score >= 90).length,
            investigationRate: this.dailyAnalytics.length > 0 ? 
                this.dailyAnalytics.reduce((sum, a) => sum + (a.accessedClues.size / a.availableClues), 0) / this.dailyAnalytics.length : 0,
            clientFilesRate: this.dailyAnalytics.length > 0 ?
                this.dailyAnalytics.filter(a => a.clientFilesAccessed).length / this.dailyAnalytics.length : 0,
            optimalDecisionRate: this.dailyAnalytics.length > 0 ?
                this.dailyAnalytics.filter(a => a.decision === a.optimalDecision).length / this.dailyAnalytics.length : 0
        };
    }

    generateDayInsights(dayAnalytics) {
        let insights = [];

        if (dayAnalytics.investigationRate < 0.5) {
            insights.push("• Consider investigating all available evidence sources before making decisions");
        } else if (dayAnalytics.investigationRate >= 0.8) {
            insights.push("• Excellent investigation thoroughness!");
        }

        if (dayAnalytics.clientFilesRate < 0.5) {
            insights.push("• Review client profiles more consistently to understand risk tolerance");
        } else if (dayAnalytics.clientFilesRate >= 0.8) {
            insights.push("• Great job considering client profiles in your decisions");
        }

        if (dayAnalytics.optimalDecisionRate < 0.5) {
            insights.push("• Focus on analyzing all evidence to identify the best recommendations");
        } else if (dayAnalytics.optimalDecisionRate >= 0.8) {
            insights.push("• Excellent decision-making accuracy!");
        }

        if (dayAnalytics.perfectScores > 0) {
            insights.push(`• Achieved ${dayAnalytics.perfectScores} perfect score${dayAnalytics.perfectScores > 1 ? 's' : ''}!`);
        }

        return insights.length > 0 ? insights.join('\n') : "• Keep practicing to improve your advisory skills!";
    }

    getGradeColor(grade) {
        switch (grade) {
            case 'A': return '#2ecc71'; // Green
            case 'B': return '#3498db'; // Blue
            case 'C': return '#f39c12'; // Orange
            case 'D': return '#e67e22'; // Dark orange
            case 'F': return '#e74c3c'; // Red
            default: return '#ffffff'; // White
        }
    }

    startNextDay() {
        // Check if game is complete
        if (this.gameState.isGameComplete()) {
            this.endGame();
            return;
        }

        // Start new day
        this.gameState.startNewDay();
        
        // Reset daily analytics for new day
        this.dailyAnalytics = [];
        
        this.updateUI();
        this.startNewDay();
    }

    endGame() {
        // Show final score screen
        const finalSummary = this.gameState.getFinalSummary();

        // Create final score modal container
        const finalModal = this.add.container(0, 0);
        finalModal.setDepth(200);

        // Modal background - make interactive to block clicks
        const modalBg = this.add.graphics();
        modalBg.fillStyle(0x000000, 0.8);
        modalBg.fillRect(0, 0, 1024, 768);
        modalBg.setInteractive(new Phaser.Geom.Rectangle(0, 0, 1024, 768), Phaser.Geom.Rectangle.Contains);
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

        // Add hover effect to restart button
        restartButton.on('pointerover', () => {
            this.tweens.add({
                targets: [restartButton, restartButtonText],
                x: '-=2',
                y: '+=2',
                duration: 100,
                ease: 'Power2'
            });
        });

        restartButton.on('pointerout', () => {
            this.tweens.add({
                targets: [restartButton, restartButtonText],
                x: '+=2',
                y: '-=2',
                duration: 100,
                ease: 'Power2'
            });
        });
    }

    updateUI() {
        // Update UI elements
        this.dayText.setText(`Day ${this.gameState.currentDay}`);
        this.clientText.setText(`Client ${this.gameState.clientsCompleted + 1}/${this.gameState.totalClients}`);
    }

    changeScene() {
        this.scene.start('GameOver');
    }
}
