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
            fontSize: '24px',
            fontFamily: 'Minecraft, Courier New, monospace',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        });
        this.uiOverlay.add(this.dayText);

        // Client counter
        this.clientText = this.add.text(50, 80, `Client ${this.gameState.clientsCompleted + 1}/${this.gameState.totalClients}`, {
            fontSize: '18px',
            fontFamily: 'Minecraft, Courier New, monospace',
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
            color: '#2c3e50', // Dark text for paper background
            stroke: '#ffffff',
            strokeThickness: 1
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
            fontSize: '14px',
            fontFamily: 'Minecraft, Courier New, monospace',
            color: '#2c3e50', // Dark text for paper background
            stroke: '#ffffff',
            strokeThickness: 1
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
            fontSize: '14px',
            fontFamily: 'Minecraft, Courier New, monospace',
            color: '#2c3e50', // Dark text for paper background
            stroke: '#ffffff',
            strokeThickness: 1
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
            fontFamily: 'Minecraft, Courier New, monospace',
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
        // Get chart data from current scenario
        const chartData = this.scenarioManager.getClueByCategory(this.currentClient, 'charts');
        
        if (chartData && chartData.type && chartData.title) {
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
            this.showNewspaperModal(clue);
            this.sound.play('paper-turn', { volume: 1 });
        }
    }

    showClientFiles() {
        if (!this.currentClient) {
            return;
        }

        // Get client data
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
        const modalWidth = 700;
        const modalHeight = 600;
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

        // Client Information Section
        const clientInfoY = modalY + 80;
        const clientName = clientData ? clientData.name : 'Unknown Client';
        const clientDesc = clientData ? clientData.description : 'No description available';
        
        const clientNameText = this.add.text(modalX + 20, clientInfoY, `CLIENT: ${clientName.toUpperCase()}`, {
            fontSize: '20px',
            fontFamily: 'Minecraft, Courier New, monospace',
            color: '#3498db',
            stroke: '#000000',
            strokeThickness: 1
        });
        modal.add(clientNameText);

        const clientDescText = this.add.text(modalX + 20, clientInfoY + 30, clientDesc, {
            fontSize: '14px',
            fontFamily: 'Minecraft, Courier New, monospace',
            color: '#ecf0f1',
            stroke: '#000000',
            strokeThickness: 1,
            wordWrap: { width: modalWidth - 40 }
        });
        modal.add(clientDescText);

        // Scenario Information Section
        const scenarioY = clientInfoY + 80;
        const scenarioNameText = this.add.text(modalX + 20, scenarioY, `CASE: ${this.currentClient.name.toUpperCase()}`, {
            fontSize: '18px',
            fontFamily: 'Minecraft, Courier New, monospace',
            color: '#e74c3c',
            stroke: '#000000',
            strokeThickness: 1
        });
        modal.add(scenarioNameText);

        const scenarioDescText = this.add.text(modalX + 20, scenarioY + 25, this.currentClient.description, {
            fontSize: '14px',
            fontFamily: 'Minecraft, Courier New, monospace',
            color: '#ecf0f1',
            stroke: '#000000',
            strokeThickness: 1,
            wordWrap: { width: modalWidth - 40 }
        });
        modal.add(scenarioDescText);

        // Opening Statement Section
        const openingY = scenarioY + 70;
        const openingTitleText = this.add.text(modalX + 20, openingY, 'CLIENT STATEMENT:', {
            fontSize: '16px',
            fontFamily: 'Minecraft, Courier New, monospace',
            color: '#f39c12',
            stroke: '#000000',
            strokeThickness: 1
        });
        modal.add(openingTitleText);

        const openingText = this.add.text(modalX + 20, openingY + 25, `"${this.currentClient.openingStatement}"`, {
            fontSize: '14px',
            fontFamily: 'Minecraft, Courier New, monospace',
            color: '#ecf0f1',
            stroke: '#000000',
            strokeThickness: 1,
            wordWrap: { width: modalWidth - 40 },
            fontStyle: 'italic'
        });
        modal.add(openingText);

        // Available Evidence Section
        const evidenceY = openingY + 80;
        const evidenceTitleText = this.add.text(modalX + 20, evidenceY, 'AVAILABLE EVIDENCE:', {
            fontSize: '16px',
            fontFamily: 'Minecraft, Courier New, monospace',
            color: '#27ae60',
            stroke: '#000000',
            strokeThickness: 1
        });
        modal.add(evidenceTitleText);

        let evidenceYOffset = 25;
        const evidenceTypes = [
            { key: 'wordOfMouth', label: '• Phone Messages', color: '#3498db' },
            { key: 'newspaper', label: '• News Articles', color: '#e74c3c' },
            { key: 'charts', label: '• Financial Charts', color: '#f39c12' },
            { key: 'graphs', label: '• Market Graphs', color: '#9b59b6' }
        ];

        evidenceTypes.forEach(evidenceType => {
            const hasEvidence = this.currentClient.clues && this.currentClient.clues[evidenceType.key];
            const evidenceText = this.add.text(modalX + 20, evidenceY + evidenceYOffset, 
                hasEvidence ? evidenceType.label : `${evidenceType.label} (No data)`, {
                fontSize: '14px',
                fontFamily: 'Minecraft, Courier New, monospace',
                color: hasEvidence ? evidenceType.color : '#7f8c8d',
                stroke: '#000000',
                strokeThickness: 1
            });
            modal.add(evidenceText);
            evidenceYOffset += 20;
        });

        // Game State Information
        const gameStateY = evidenceY + evidenceYOffset + 20;
        const gameStateText = this.add.text(modalX + 20, gameStateY, 
            `DAY: ${this.gameState.currentDay} | CLIENT: ${this.gameState.clientsCompleted + 1}/${this.gameState.totalClients} | REPUTATION: ${this.gameState.reputationScore}`, {
            fontSize: '12px',
            fontFamily: 'Minecraft, Courier New, monospace',
            color: '#95a5a6',
            stroke: '#000000',
            strokeThickness: 1
        });
        modal.add(gameStateText);

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
            color: '#000000', // Black text for computer screen
            fontStyle: 'bold',
            align: 'center',
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
            fontFamily: 'Minecraft, Courier New, monospace',
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
            fontFamily: 'Minecraft, Courier New, monospace',
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
            fontFamily: 'Minecraft, Courier New, monospace',
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
            fontFamily: 'Minecraft, Courier New, monospace',
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
            fontFamily: 'Minecraft, Courier New, monospace',
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

        this.gameState.scenarioCount++;

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
        // Remove interaction from current client
        if (this.avatarHitbox) {
            this.avatarHitbox.removeInteractive();
        }

        // Hide any speech bubbles
        this.hideSpeechBubble();
        this.removeAvatar();

    }

    completeDay() {

        this.removeAvatar(false);
        this.hideSpeechBubble();

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
        this.clientText.setText(`Client ${this.gameState.clientsCompleted + 1}/${this.gameState.totalClients}`);
    }

    changeScene() {
        this.scene.start('GameOver');
    }
}
