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
    }

    create() {
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
        // Create interactive desk elements with paired labels
        this.createInteractiveElement('phone', 805, 545, 140, 110, 0x8B4513, 'Phone', () => this.showWordOfMouthClue());
        this.createInteractiveElement('computer', 585, 425, 220, 200, 0x000000, 'Computer', () => this.showComputerClue());
        this.createInteractiveElement('newspaper', 150, 590, 150, 160, 0xFFFFFF, 'News', () => this.showNewspaperClue());
        this.createInteractiveElement('keyboard', 520, 610, 340, 100, 0x333333, 'Recommend', () => this.showDecisionModal());
    }

    createInteractiveElement(key, x, y, width, height, color, labelText, onClick) {
        // Create the interactive rectangle
        this.clueElements[key] = this.add.rectangle(x, y, width, height, color);
        this.clueElements[key].setInteractive();
        this.clueElements[key].on('pointerdown', onClick);
        this.clueElements[key].setDepth(10);

        // Create the label positioned in the center of the element
        const labelX = x; // Center horizontally
        const labelY = y; // Center vertically

        // Create the label text first to get its actual dimensions
        const label = this.add.text(labelX, labelY, labelText, {
            fontSize: '20px', // Increased font size
            color: '#ffffff',
            fontFamily: 'Courier New, monospace' // Monospace font for retro feel
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
        });

        this.clueElements[key].on('pointerout', () => {
            // Hide label when not hovering
            this.tweens.add({
                targets: [labelBg, label],
                alpha: 0,
                duration: 200,
                ease: 'Power2'
            });
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
            color: '#ffffff',
            fontFamily: 'Courier New, monospace'
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
• Call when you believe the company’s stock value is likely to rise in the future. This indicates a bullish outlook and positions your client to benefit from upward momentum.

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
                title: "Evaluating Evidence",
                content: `Your professional reputation is a direct reflection of the quality of the guidance you provide. Every recommendation you make—whether it results in a profit, a loss, or missed opportunity—impacts how clients, colleagues, and regulators perceive your advisory practice.           
• Positive Reputation
Consistently accurate and thoughtful advice builds trust with clients. A strong reputation attracts more business, unlocks higher-value clients, and establishes you as a reliable financial advisor.
• Neutral Reputation
Safe or indecisive recommendations may keep you out of trouble in the short term, but over time, clients may lose confidence in your ability to provide meaningful insights.
• Negative Reputation
Poor or reckless recommendations will damage client trust, reduce future business opportunities, and may draw increased scrutiny from regulators. In extreme cases, a severely damaged reputation could jeopardize your career entirely.

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

        // Modal content
        const modalWidth = 700;
        const modalHeight = 500;
        const modalX = (1024 - modalWidth) / 2;
        const modalY = (768 - modalHeight) / 2;

        const modalContent = this.add.graphics();
        modalContent.fillStyle(0x333333, 0.95);
        modalContent.lineStyle(3, 0xffffff, 1);
        modalContent.fillRoundedRect(modalX, modalY, modalWidth, modalHeight, 15);
        modalContent.strokeRoundedRect(modalX, modalY, modalWidth, modalHeight, 15);
        this.guidebookModal.add(modalContent);

        // Title
        const currentPage = this.guidebookPages[this.currentGuidebookPage];
        const titleText = this.add.text(512, modalY + 40, currentPage.title, {
            fontSize: '28px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
        this.guidebookModal.add(titleText);

        // Content
        const contentText = this.add.text(512, modalY + 120, currentPage.content, {
            fontSize: '16px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 1,
            wordWrap: { width: modalWidth - 40 },
            align: 'left'
        }).setOrigin(0.5);
        this.guidebookModal.add(contentText);

        // Navigation buttons (only show if more than 1 page)
        if (this.guidebookPages.length > 1) {
            this.createGuidebookNavigation(modalX, modalY, modalWidth, modalHeight);
        }

        // Close button
        const closeButton = this.add.rectangle(512, modalY + 420, 120, 40, 0xff0000);
        closeButton.setInteractive();
        closeButton.on('pointerdown', () => this.hideGuidebookModal());
        this.guidebookModal.add(closeButton);

        const closeButtonText = this.add.text(512, modalY + 420, 'Close', {
            fontSize: '18px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 1
        }).setOrigin(0.5);
        this.guidebookModal.add(closeButtonText);

        // Add hover effect to close button
        closeButton.on('pointerover', () => {
            closeButton.setFillStyle(0xff3333);
        });

        closeButton.on('pointerout', () => {
            closeButton.setFillStyle(0xff0000);
        });
    }

    createGuidebookNavigation(modalX, modalY, modalWidth, modalHeight) {
        const buttonY = modalY + 360;
        const buttonWidth = 80;
        const buttonHeight = 35;

        // Previous button
        const prevButton = this.add.rectangle(modalX + 100, buttonY, buttonWidth, buttonHeight, 0x4a4a4a);
        prevButton.setInteractive();
        prevButton.on('pointerdown', () => this.previousGuidebookPage());
        this.guidebookModal.add(prevButton);

        const prevButtonText = this.add.text(modalX + 100, buttonY, 'Previous', {
            fontSize: '14px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 1
        }).setOrigin(0.5);
        this.guidebookModal.add(prevButtonText);

        // Page indicator
        const pageIndicator = this.add.text(512, buttonY, `${this.currentGuidebookPage + 1} / ${this.guidebookPages.length}`, {
            fontSize: '16px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 1
        }).setOrigin(0.5);
        this.guidebookModal.add(pageIndicator);

        // Next button
        const nextButton = this.add.rectangle(modalX + modalWidth - 100, buttonY, buttonWidth, buttonHeight, 0x4a4a4a);
        nextButton.setInteractive();
        nextButton.on('pointerdown', () => this.nextGuidebookPage());
        this.guidebookModal.add(nextButton);

        const nextButtonText = this.add.text(modalX + modalWidth - 100, buttonY, 'Next', {
            fontSize: '14px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 1
        }).setOrigin(0.5);
        this.guidebookModal.add(nextButtonText);

        // Update button states
        this.updateGuidebookNavigation(prevButton, nextButton, pageIndicator);

        // Add hover effects
        prevButton.on('pointerover', () => {
            if (this.currentGuidebookPage > 0) {
                prevButton.setFillStyle(0x666666);
            }
        });

        prevButton.on('pointerout', () => {
            prevButton.setFillStyle(0x4a4a4a);
        });

        nextButton.on('pointerover', () => {
            if (this.currentGuidebookPage < this.guidebookPages.length - 1) {
                nextButton.setFillStyle(0x666666);
            }
        });

        nextButton.on('pointerout', () => {
            nextButton.setFillStyle(0x4a4a4a);
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

        // Create a larger hitbox for better interaction (temporarily visible for debugging)
        this.avatarHitbox = this.add.rectangle(-200, 335, 130, 295, 0xff0000, 0.3);
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
                this.sound.play("old-man", { rate: 1 });
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
            this.sound.play('paper-turn', { volume: 1 });
        }
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

        // Modal background - make interactive to block clicks
        const modalBg = this.add.graphics();
        modalBg.fillStyle(0x000000, 0.8);
        modalBg.fillRect(0, 0, 1024, 768);
        modalBg.setInteractive(new Phaser.Geom.Rectangle(0, 0, 1024, 768), Phaser.Geom.Rectangle.Contains);
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

        // Close button
        const closeButton = this.add.rectangle(512, modalY + 220, 100, 30, 0x666666);
        closeButton.setInteractive();
        closeButton.on('pointerdown', () => {
            this.hideDecisionModal();
        });
        this.decisionModal.add(closeButton);

        const closeButtonText = this.add.text(512, modalY + 220, 'Close', {
            fontSize: '16px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 1
        }).setOrigin(0.5);
        this.decisionModal.add(closeButtonText);
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
        this.time.delayedCall(350, () => {
            this.showOutcome(outcome);
        });

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
        if (this.avatarHitbox) {
            this.avatarHitbox.removeInteractive();
        }

        // Hide any speech bubbles
        this.hideSpeechBubble();

        // Slide current client out
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

        // Modal background - make interactive to block clicks
        const modalBg = this.add.graphics();
        modalBg.fillStyle(0x000000, 0.8);
        modalBg.fillRect(0, 0, 1024, 768);
        modalBg.setInteractive(new Phaser.Geom.Rectangle(0, 0, 1024, 768), Phaser.Geom.Rectangle.Contains);
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
    }

    updateUI() {
        // Update UI elements
        this.dayText.setText(`Day ${this.gameState.currentDay}`);
        this.reputationText.setText(`Reputation: ${this.gameState.reputationScore}`);
        this.clientText.setText(`Client ${this.gameState.clientsCompleted + 1}/${this.gameState.totalClients}`);
    }

    changeScene() {
        this.scene.start('GameOver');
    }
}
