import { EventBus } from '../EventBus';
import { Scene } from 'phaser';

/**
 * ECS Manager - Handles entities and components
 */
class ECSManager {
    constructor(scenarioData) {
        this.entities = new Map();
        this.components = scenarioData.components;
        this.scenarios = scenarioData.scenarios;
        this.winConditions = scenarioData.win_conditions;
        
        // Initialize entities
        scenarioData.entities.forEach(entity => {
            this.entities.set(entity.id, {
                id: entity.id,
                components: new Set(entity.components)
            });
        });
    }

    getEntitiesWithComponent(componentName) {
        return Array.from(this.entities.values())
            .filter(entity => entity.components.has(componentName));
    }

    getComponent(entityId, componentName) {
        if (this.components[componentName] && this.components[componentName][entityId]) {
            return this.components[componentName][entityId];
        }
        return null;
    }

    hasComponent(entityId, componentName) {
        const entity = this.entities.get(entityId);
        return entity && entity.components.has(componentName);
    }

    getScenario(scenarioId) {
        return this.scenarios.find(s => s.id === scenarioId);
    }
}

/**
 * Render System - Handles visual rendering
 */
class RenderSystem {
    constructor(scene, ecsManager) {
        this.scene = scene;
        this.ecs = ecsManager;
        this.renderedObjects = new Map();
        this.popupGroup = null;
    }

    initialize() {
        // Create popup group for organizing UI elements
        this.popupGroup = this.scene.add.group();
        // Manual tracking array to avoid Phaser group cleanup issues
        this.popupElements = [];
    }

    showEntity(entityId, x = 400, y = 300) {
        // Create popup container if not exists
        if (!this.popupElements || this.popupElements.length === 0) {
            // Create container to hold all popup elements
            this.popupContainer = this.scene.add.container(0, 0);
            this.popupContainer.setDepth(201); // Set container depth high to be above other UI
            
            // Define popup dimensions for consistent positioning
            this.popupConfig = {
                x: 512,
                y: 384, 
                width: 800,
                height: 600
            };
            
            // Create popup background inside container
            const popupBg = this.scene.add.rectangle(
                this.popupConfig.x, 
                this.popupConfig.y, 
                this.popupConfig.width, 
                this.popupConfig.height, 
                0x000000, 
                0.9
            );
            popupBg.setStrokeStyle(3, 0xffffff, 1.0);
            // No need to set depth - container manages this
            
            // Add background to container
            this.popupContainer.add(popupBg);
            
            // Track elements for cleanup
            this.popupElements.push(this.popupContainer);
            
            // Add close button to the container (position relative to popup)
            this.addCloseButton(popupBg);
            
            // Reset content position for new popup
            this.currentYOffset = 180;
        }

        let yOffset = this.currentYOffset || 180;
        
        // Show client information
        if (this.ecs.hasComponent(entityId, 'ClientProfile')) {
            const clientData = this.ecs.getComponent(entityId, 'ClientProfile');
            this.createClientDisplay(clientData, yOffset);
            yOffset += 120;
        }
        
        // Show clue information
        if (this.ecs.hasComponent(entityId, 'Clue')) {
            const clueData = this.ecs.getComponent(entityId, 'Clue');
            this.createClueDisplay(entityId, clueData, yOffset);
            yOffset += 100;
        }
        
        // Show chart information
        if (this.ecs.hasComponent(entityId, 'Chart')) {
            const chartData = this.ecs.getComponent(entityId, 'Chart');
            this.createChartDisplay(chartData, yOffset);
            yOffset += 100;
        }
        
        // Update current position for next entity
        this.currentYOffset = yOffset;
    }

    createClientDisplay(clientData, yOffset) {
        const title = this.scene.add.text(150, yOffset, `CLIENT: ${clientData.name}`, {
            fontSize: '24px', color: '#ffffff', fontStyle: 'bold'
        });
        
        const info = this.scene.add.text(150, yOffset + 30, 
            `Risk Profile: ${clientData.risk_profile.toUpperCase()}\n` +
            `Investment Amount: $${clientData.investment_amount?.toLocaleString() || 'N/A'}\n` +
            `Experience: ${clientData.experience_level || 'N/A'}\n\n` +
            `"${clientData.open_statement}"`,
            {
                fontSize: '16px', color: '#ffffff', 
                wordWrap: { width: 700 },
                lineSpacing: 4
            }
        );
        
        // Add to popup container (automatic depth management)
        this.popupContainer.add([title, info]);
    }

    createClueDisplay(entityId, clueData, yOffset) {
        const typeColor = this.getClueColor(clueData.type);
        const reliabilityColor = this.getReliabilityColor(clueData.reliability);
        
        const title = this.scene.add.text(150, yOffset, 
            `${clueData.type.toUpperCase()} - ${clueData.source}`, {
            fontSize: '18px', color: typeColor, fontStyle: 'bold'
        });
        
        const content = this.scene.add.text(150, yOffset + 25, clueData.content, {
            fontSize: '16px', color: '#ffffff',
            wordWrap: { width: 700 }
        });
        
        const reliability = this.scene.add.text(150, yOffset + 60, 
            `Reliability: ${clueData.reliability} | Impact: ${clueData.impact}`, {
            fontSize: '14px', color: reliabilityColor
        });
        
        // Add to popup container (automatic depth management)
        this.popupContainer.add([title, content, reliability]);
    }

    createChartDisplay(chartData, yOffset) {
        const trendColor = chartData.trend === 'bullish' ? '#00ff00' : '#ff0000';
        
        const title = this.scene.add.text(150, yOffset, 
            `TECHNICAL ANALYSIS: ${chartData.asset}`, {
            fontSize: '18px', color: '#00ff00', fontStyle: 'bold'
        });
        
        const info = this.scene.add.text(150, yOffset + 25,
            `Trend: ${chartData.trend.toUpperCase()} (${chartData.duration})\n` +
            `Volatility: ${chartData.volatility} | Volume: ${chartData.volume}\n` +
            `Support: $${chartData.support_level} | Resistance: $${chartData.resistance_level}`,
            {
                fontSize: '16px', color: trendColor,
                lineSpacing: 4
            }
        );
        
        // Add to popup container (automatic depth management)
        this.popupContainer.add([title, info]);
    }

    getClueColor(type) {
        const colors = {
            'headline': '#ffff00',
            'WOM': '#ff8800',
            'economic_data': '#00ffff',
            'default': '#ffffff'
        };
        return colors[type] || colors.default;
    }

    getReliabilityColor(reliability) {
        const colors = {
            'very_high': '#00ff00',
            'high': '#88ff00',
            'medium': '#ffff00',
            'low': '#ff8800',
            'very_low': '#ff0000'
        };
        return colors[reliability] || '#ffffff';
    }

    hideAllEntities() {
        console.log('hideAllEntities called');
        
        // Destroy all tracked popup elements manually (avoid Phaser group cleanup)
        if (this.popupElements && this.popupElements.length > 0) {
            console.log('Destroying', this.popupElements.length, 'popup elements');
            
            this.popupElements.forEach(element => {
                if (element && element.destroy) {
                    try {
                        element.destroy();
                    } catch (error) {
                        console.warn('Error destroying element:', error);
                    }
                }
            });
            
            // Clear the tracking array
            this.popupElements = [];
        }
        
        // Clear the popup group (now should be empty)
        if (this.popupGroup) {
            this.popupGroup.clear(false, false);
        }
        
        // Remove keyboard listener
        if (this.scene.input.keyboard) {
            this.scene.input.keyboard.off('keydown-ESC');
        }
        
        // Clean up close elements reference
        this.closeElements = null;
        
        // Reset position tracker
        this.currentYOffset = 180;
        
        console.log('hideAllEntities completed');
    }

    addCloseButton(popupBg) {
        // Calculate close button position relative to popup background
        const closeButtonX = this.popupConfig.x + (this.popupConfig.width / 2) - 30; // 30px from right edge
        const closeButtonY = this.popupConfig.y - (this.popupConfig.height / 2) + 30; // 30px from top edge
        
        // Add a visible close button with background
        const closeButtonBg = this.scene.add.rectangle(closeButtonX, closeButtonY, 50, 50, 0x660000, 0.8);
        closeButtonBg.setStrokeStyle(2, 0xff4444, 1.0);
        closeButtonBg.setInteractive();

        const closeButton = this.scene.add.text(closeButtonX, closeButtonY, '✕', {
            fontSize: '28px', color: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5);

        // Add "CLOSE" text label positioned relative to close button
        const closeLabel = this.scene.add.text(closeButtonX, closeButtonY + 30, 'CLOSE', {
            fontSize: '12px', color: '#ff4444', fontStyle: 'bold'
        }).setOrigin(0.5);

        // Add instruction text at bottom of popup (relative to popup)
        const instructionY = this.popupConfig.y + (this.popupConfig.height / 2) - 20; // 20px from bottom
        const instructionText = this.scene.add.text(this.popupConfig.x, instructionY, 
            'Click the X button, press ESC, or click outside to close', {
            fontSize: '14px', color: '#888888', fontStyle: 'italic'
        }).setOrigin(0.5);

        // Close button click handler
        const closePopup = () => {
            this.hideAllEntities();
        };

        // Set up ALL event handlers FIRST (before adding to container)
        closeButtonBg.on('pointerover', () => {
            closeButtonBg.setFillStyle(0xaa0000, 1.0);
            closeButton.setScale(1.2);
            this.scene.input.setDefaultCursor('pointer');
        });

        closeButtonBg.on('pointerout', () => {
            closeButtonBg.setFillStyle(0x660000, 0.8);
            closeButton.setScale(1.0);
            this.scene.input.setDefaultCursor('default');
        });

        closeButtonBg.on('pointerdown', closePopup);
        closeButton.setInteractive().on('pointerdown', closePopup);

        // Close on background click
        popupBg.setInteractive();
        popupBg.on('pointerdown', closePopup);

        // Add keyboard support (ESC key)
        this.scene.input.keyboard.on('keydown-ESC', closePopup);

        // Add close elements to popup container (automatic depth management)
        this.popupContainer.add([closeButtonBg, closeButton, closeLabel, instructionText]);

        // Store references for cleanup (backup method)
        this.closeElements = [closeButtonBg, closeButton, closeLabel, instructionText];
    }
}

/**
 * Hotspot System - Handles interactive desk areas
 */
class HotspotSystem {
    constructor(scene, ecsManager, renderSystem) {
        this.scene = scene;
        this.ecs = ecsManager;
        this.renderSystem = renderSystem;
        this.hotspots = new Map();
        this.activeScenario = null;
    }

    createHotspots(scenario) {
        this.activeScenario = scenario;
        const hotspotEntities = this.ecs.getEntitiesWithComponent('Hotspot');
        
        hotspotEntities.forEach(entity => {
            // Only create hotspots that are in the current scenario
            if (!scenario.hotspots.includes(entity.id)) return;
            
            const hotspotData = this.ecs.getComponent(entity.id, 'Hotspot');
            const opensData = this.ecs.getComponent(entity.id, 'OpensEntity');
            
            if (hotspotData) {
                // Create interactive zone
                const zone = this.scene.add.zone(
                    hotspotData.x + hotspotData.w / 2,
                    hotspotData.y + hotspotData.h / 2,
                    hotspotData.w,
                    hotspotData.h
                ).setInteractive();

                // Visual feedback rectangle
                const rectangle = this.scene.add.rectangle(
                    hotspotData.x + hotspotData.w / 2,
                    hotspotData.y + hotspotData.h / 2,
                    hotspotData.w,
                    hotspotData.h,
                    0x00ff00,
                    0.3
                );
                rectangle.setStrokeStyle(2, 0x00ff00, 0.3);

                // Label text
                const label = this.scene.add.text(
                    hotspotData.x + hotspotData.w / 2,
                    hotspotData.y + hotspotData.h / 2,
                    hotspotData.label,
                    {
                        fontSize: '14px',
                        color: '#ffffff',
                        backgroundColor: 'rgba(0,0,0,0.7)',
                        padding: { x: 8, y: 4 }
                    }
                ).setOrigin(0.5).setVisible(false);

                // Hover effects
                zone.on('pointerover', () => {
                    rectangle.setFillStyle(0x00ff00, 0.3);
                    rectangle.setStrokeStyle(2, 0x00ff00, 0.8);
                    label.setVisible(true);
                    this.scene.input.setDefaultCursor('pointer');
                });

                zone.on('pointerout', () => {
                    rectangle.setFillStyle(0x00ff00, 0.3);
                    rectangle.setStrokeStyle(2, 0x00ff00, 0.3);
                    label.setVisible(false);
                    this.scene.input.setDefaultCursor('default');
                });

                // Click handler
                zone.on('pointerdown', () => {
                    this.handleHotspotClick(entity.id, opensData);
                });

                this.hotspots.set(entity.id, { zone, rectangle, label });
            }
        });
    }

    handleHotspotClick(hotspotId, opensData) {
        if (opensData && opensData.target) {
            // Clear previous displays
            this.renderSystem.hideAllEntities();
            
            const targets = Array.isArray(opensData.target) ? opensData.target : [opensData.target];
            
            // Filter targets to only those in the current scenario
            const validTargets = targets.filter(targetId => 
                this.activeScenario.entities.includes(targetId)
            );
            
            if (validTargets.length > 0) {
                // Use the RenderSystem to show entities instead of creating separate popup
                validTargets.forEach(entityId => {
                    this.renderSystem.showEntity(entityId);
                });
            }
        }
    }

    // Removed old createInfoPopup - now using unified RenderSystem

    destroyHotspots() {
        this.hotspots.forEach(hotspot => {
            hotspot.zone.destroy();
            hotspot.rectangle.destroy();
            hotspot.label.destroy();
        });
        this.hotspots.clear();
    }
}

/**
 * Decision System - Handles player choices and scoring
 */
class DecisionSystem {
    constructor(scene, ecsManager) {
        this.scene = scene;
        this.ecs = ecsManager;
        this.currentScenario = null;
        this.investigatedEntities = new Set();
    }

    setScenario(scenario) {
        this.currentScenario = scenario;
        this.investigatedEntities.clear();
        this.decisionUIVisible = false;
        this.decisionButtons = [];
    }

    markEntityInvestigated(entityId) {
        this.investigatedEntities.add(entityId);
    }

    createDecisionUI() {
        if (!this.currentScenario) return;
        if (this.decisionUIVisible) return; // Already visible

        console.log('Creating decision UI');

        // Create decision panel background
        this.decisionPanel = this.scene.add.rectangle(512, 650, 800, 120, 0x1a1a1a, 0.95);
        this.decisionPanel.setStrokeStyle(2, 0x444444, 1.0);
        this.decisionPanel.setDepth(150);

        // Title
        this.decisionTitle = this.scene.add.text(512, 610, 'Make Your Recommendation:', {
            fontSize: '18px', color: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(151);

        // Decision buttons based on win condition
        this.createDecisionButtons(this.decisionPanel.y);
        
        this.decisionUIVisible = true;
    }

    hideDecisionUI() {
        if (!this.decisionUIVisible) return;
        
        console.log('Hiding decision UI');
        
        // Destroy decision panel elements
        if (this.decisionPanel) {
            this.decisionPanel.destroy();
            this.decisionPanel = null;
        }
        
        if (this.decisionTitle) {
            this.decisionTitle.destroy();
            this.decisionTitle = null;
        }
        
        // Destroy decision buttons
        if (this.decisionButtons) {
            this.decisionButtons.forEach(buttonGroup => {
                if (buttonGroup.button) buttonGroup.button.destroy();
                if (buttonGroup.text) buttonGroup.text.destroy();
            });
            this.decisionButtons = [];
        }
        
        this.decisionUIVisible = false;
    }

    toggleDecisionUI() {
        console.log('Toggling decision UI. Currently visible:', this.decisionUIVisible);
        
        if (this.decisionUIVisible) {
            this.hideDecisionUI();
        } else {
            this.createDecisionUI();
        }
    }

    createDecisionButtons(yPos) {
        const winCondition = this.currentScenario.win_condition;
        let buttons = [];

        switch (winCondition) {
            case 'approve_call':
                buttons = [
                    { text: 'Approve CALL Option', action: 'approve_call', color: 0x00aa00 },
                    { text: 'Reject - Too Risky', action: 'reject_risky', color: 0xaa0000 },
                    { text: 'Need More Info', action: 'need_info', color: 0x0066aa }
                ];
                break;
            case 'approve_put':
                buttons = [
                    { text: 'Approve PUT Option', action: 'approve_put', color: 0xaa4400 },
                    { text: 'Reject - Unsuitable', action: 'reject_unsuitable', color: 0xaa0000 },
                    { text: 'Suggest Alternatives', action: 'suggest_alt', color: 0x0066aa }
                ];
                break;
            default:
                buttons = [
                    { text: 'Approve Trade', action: 'approve', color: 0x00aa00 },
                    { text: 'Reject Trade', action: 'reject', color: 0xaa0000 }
                ];
        }

        const buttonSpacing = 800 / buttons.length;
        
        buttons.forEach((buttonData, index) => {
            const x = 200 + (index * buttonSpacing);
            
            const button = this.scene.add.rectangle(x, yPos, 180, 40, buttonData.color, 0.8);
            button.setStrokeStyle(2, 0xffffff, 1.0);
            button.setInteractive();
            button.setDepth(151);

            const buttonText = this.scene.add.text(x, yPos, buttonData.text, {
                fontSize: '14px', color: '#ffffff', fontStyle: 'bold'
            }).setOrigin(0.5).setDepth(152);

            button.on('pointerover', () => {
                button.setAlpha(1.0);
                button.setScale(1.05);
            });

            button.on('pointerout', () => {
                button.setAlpha(0.8);
                button.setScale(1.0);
            });

            button.on('pointerdown', () => {
                this.processDecision(buttonData.action);
            });
            
            // Store button references for cleanup
            this.decisionButtons.push({ button, text: buttonText });
        });
    }

    processDecision(action) {
        // Show client reaction first
        this.showClientReaction(action, () => {
            // Then analyze the decision
            const result = this.analyzeDecision(action);
            this.showResult(result);
        });
    }

    showClientReaction(action, callback) {
        // Get the client for reaction
        const clientId = this.currentScenario.entities.find(entityId => 
            this.scene.ecsManager.hasComponent(entityId, 'ClientProfile')
        );
        
        if (!clientId) {
            callback();
            return;
        }

        const clientData = this.scene.ecsManager.getComponent(clientId, 'ClientProfile');
        
        // Clear previous speech bubble
        if (this.scene.speechBubble) {
            this.scene.speechBubble.destroy();
            this.scene.speechTexts.forEach(text => text.destroy());
        }

        // Determine reaction based on action and client
        let reactionText = "";
        let reactionColor = "#ffffff";
        
        if (action.includes('approve')) {
            if (clientData.risk_profile === 'low' && action.includes('call')) {
                reactionText = "Are you sure? That seems quite risky for someone like me...";
                reactionColor = "#ffaa00";
            } else {
                reactionText = "Excellent! Thank you for your professional advice.";
                reactionColor = "#00ff00";
            }
        } else if (action.includes('reject')) {
            reactionText = "I understand. Better to be safe than sorry.";
            reactionColor = "#aaaaaa";
        } else {
            reactionText = "Hmm, I'll need to think about this more.";
            reactionColor = "#ffff00";
        }

        // Show reaction bubble
        this.createReactionBubble(reactionText, reactionColor, callback);
    }

    createReactionBubble(text, color, callback) {
        const bubbleWidth = 300;
        const bubbleHeight = 80;
        const bubbleX = this.scene.clientSprite.x + 180;
        const bubbleY = this.scene.clientSprite.y - 60;

        // Create reaction bubble
        const reactionBubble = this.scene.add.graphics();
        reactionBubble.setDepth(78);
        
        reactionBubble.fillStyle(0x000000, 0.9);
        reactionBubble.lineStyle(2, parseInt(color.replace('#', '0x')), 1);
        reactionBubble.fillRoundedRect(
            bubbleX - bubbleWidth/2, 
            bubbleY - bubbleHeight/2, 
            bubbleWidth, 
            bubbleHeight, 
            10
        );
        reactionBubble.strokeRoundedRect(
            bubbleX - bubbleWidth/2, 
            bubbleY - bubbleHeight/2, 
            bubbleWidth, 
            bubbleHeight, 
            10
        );

        const reactionText = this.scene.add.text(bubbleX, bubbleY, text, {
            fontFamily: 'Arial',
            fontSize: '14px',
            color: color,
            align: 'center',
            wordWrap: { width: bubbleWidth - 20 }
        });
        reactionText.setOrigin(0.5);
        reactionText.setDepth(79);

        // Animate in
        reactionBubble.setAlpha(0);
        reactionText.setAlpha(0);
        
        this.scene.tweens.add({
            targets: [reactionBubble, reactionText],
            alpha: 1,
            duration: 200,
            ease: 'Power2',
            onComplete: () => {
                // Wait 2 seconds, then fade out and continue
                this.scene.time.delayedCall(2000, () => {
                    this.scene.tweens.add({
                        targets: [reactionBubble, reactionText],
                        alpha: 0,
                        duration: 200,
                        onComplete: () => {
                            reactionBubble.destroy();
                            reactionText.destroy();
                            callback();
                        }
                    });
                });
            }
        });

        // Make client bounce with emotion
        this.scene.tweens.add({
            targets: this.scene.clientSprite,
            scaleX: 0.45,
            scaleY: 0.35,
            duration: 100,
            yoyo: true,
            repeat: 1,
            ease: 'Power2'
        });
    }

    analyzeDecision(action) {
        let score = 0;
        let feedback = [];
        
        // Check if player investigated enough
        const entitiesInvestigated = this.investigatedEntities.size;
        const totalEntities = this.currentScenario.entities.length;
        
        if (entitiesInvestigated >= totalEntities * 0.7) {
            score += 25;
            feedback.push("✓ Thorough investigation");
        } else {
            score += Math.floor((entitiesInvestigated / totalEntities) * 25);
            feedback.push("⚠ Could have gathered more information");
        }

        // Check win condition match
        if (action === this.currentScenario.win_condition) {
            score += 50;
            feedback.push("✓ Correct recommendation type");
        } else {
            feedback.push("✗ Recommendation doesn't match optimal choice");
        }

        // Bonus for appropriate client risk analysis
        const hasClient = Array.from(this.investigatedEntities).some(id => 
            this.ecs.hasComponent(id, 'ClientProfile')
        );
        
        if (hasClient) {
            score += 15;
            feedback.push("✓ Considered client profile");
        } else {
            feedback.push("⚠ Should review client information");
        }

        // Time bonus (simplified)
        score += 10;

        const finalScore = Math.min(100, Math.max(0, score));
        
        return {
            score: finalScore,
            feedback: feedback,
            grade: this.getGrade(finalScore),
            passed: finalScore >= 60
        };
    }

    getGrade(score) {
        if (score >= 90) return 'A';
        if (score >= 80) return 'B';
        if (score >= 70) return 'C';
        if (score >= 60) return 'D';
        return 'F';
    }

    showResult(result) {
        // Clear the screen
        this.scene.children.removeAll();
        
        // Result background
        this.scene.add.rectangle(512, 384, 1024, 768, 0x000000, 0.9);
        
        // Title
        const title = this.scene.add.text(512, 150, 'Decision Analysis', {
            fontSize: '36px', color: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5);

        // Score display
        const scoreColor = result.passed ? '#00ff00' : '#ff4444';
        this.scene.add.text(512, 220, `Score: ${result.score}/100 (Grade: ${result.grade})`, {
            fontSize: '28px', color: scoreColor, fontStyle: 'bold'
        }).setOrigin(0.5);

        // Result status
        const status = result.passed ? 'PASSED' : 'FAILED';
        this.scene.add.text(512, 270, status, {
            fontSize: '24px', color: scoreColor, fontStyle: 'bold'
        }).setOrigin(0.5);

        // Feedback
        let yOffset = 330;
        result.feedback.forEach(feedback => {
            this.scene.add.text(512, yOffset, feedback, {
                fontSize: '18px', color: '#ffffff'
            }).setOrigin(0.5);
            yOffset += 30;
        });

        // Continue button
        const continueBtn = this.scene.add.rectangle(512, 600, 200, 60, 0x0066aa, 0.8);
        continueBtn.setStrokeStyle(2, 0xffffff, 1.0);
        continueBtn.setInteractive();
        
        this.scene.add.text(512, 600, 'Continue', {
            fontSize: '20px', color: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5);

        continueBtn.on('pointerdown', () => {
            this.scene.scene.start('MainMenu');
        });
    }
}

/**
 * Main Broker Desk Scene
 */
export class BrokerDesk extends Scene {
    constructor() {
        super('BrokerDesk');
    }

    preload() {
        // Load scenarios data (if not already loaded in Preloader)
        if (!this.cache.json.exists('scenarios')) {
            this.load.json('scenarios', '/src/scenarios.json');
        }
        
        // Load additional assets (if not already loaded)
        if (!this.textures.exists('background3')) {
            this.load.image('background3', '/assets/op-bg-3.png');
        }
    }

    create() {
        // Set background
        this.add.image(512, 384, 'background3').setDisplaySize(1024, 768);

        // Load scenarios and initialize ECS
        const scenarioData = this.cache.json.get('scenarios');
        this.ecsManager = new ECSManager(scenarioData);

        // Initialize systems
        this.renderSystem = new RenderSystem(this, this.ecsManager);
        this.hotspotSystem = new HotspotSystem(this, this.ecsManager, this.renderSystem);
        this.decisionSystem = new DecisionSystem(this, this.ecsManager);

        this.renderSystem.initialize();

        // Load default scenario (tutorial) - this will show the client automatically
        this.loadScenario('tutorial_001');

        // UI Elements
        this.createUI();

        // // Add welcome message
        // this.add.text(512, 120, 'Welcome to your first day! A client is waiting...', {
        //     fontSize: '16px', color: '#ffff00', 
        //     stroke: '#000000', strokeThickness: 1
        // }).setOrigin(0.5).setDepth(200);

        EventBus.emit('current-scene-ready', this);
    }

    createUI() {
        // // Title
        // this.add.text(512, 50, 'Options Please - Broker Desk', {
        //     fontSize: '28px', color: '#ffffff', fontStyle: 'bold',
        //     stroke: '#000000', strokeThickness: 2
        // }).setOrigin(0.5).setDepth(200);

        // // Instructions
        // this.add.text(512, 90, 'Click on desk areas to investigate. Gather information before making your recommendation.', {
        //     fontSize: '16px', color: '#ffffff',
        //     stroke: '#000000', strokeThickness: 1
        // }).setOrigin(0.5).setDepth(200);

        // Scenario selector (for testing)
        this.createScenarioSelector();
    }

    createScenarioSelector() {
        const scenarios = ['tutorial_001', 'easy_001', 'medium_001', 'hard_001'];
        const yPos = 700;
        
        scenarios.forEach((scenarioId, index) => {
            const x = 200 + (index * 150);
            const button = this.add.rectangle(x, yPos, 140, 30, 0x333333, 0.8);
            button.setStrokeStyle(1, 0x666666, 1.0);
            button.setInteractive();
            
            const text = this.add.text(x, yPos, scenarioId.replace('_', ' '), {
                fontSize: '12px', color: '#ffffff'
            }).setOrigin(0.5);
            
            button.on('pointerdown', () => {
                this.loadScenario(scenarioId);
            });
        });
    }

    loadScenario(scenarioId) {
        const scenario = this.ecsManager.getScenario(scenarioId);
        if (!scenario) return;

        // Clear existing hotspots and client
        this.hotspotSystem.destroyHotspots();
        this.hideClient();
        
        // Set current scenario
        this.decisionSystem.setScenario(scenario);
        
        // Show client for this scenario
        this.showClient(scenario);
        
        // Create hotspots for this scenario
        this.hotspotSystem.createHotspots(scenario);
        
        // Don't auto-create decision UI - let player click client to show it
        // this.decisionSystem.createDecisionUI();

        console.log(`Loaded scenario: ${scenario.title}`);
    }

    showClient(scenario) {
        console.log('showClient called for scenario:', scenario.id);
        
        // Find the first client in this scenario's entities
        const clientId = scenario.entities.find(entityId => 
            this.ecsManager.hasComponent(entityId, 'ClientProfile')
        );
        
        console.log('Found client ID:', clientId);
        
        if (!clientId) {
            console.warn('No client found in scenario entities:', scenario.entities);
            return;
        }

        const clientData = this.ecsManager.getComponent(clientId, 'ClientProfile');
        const renderData = this.ecsManager.getComponent(clientId, 'Renderable');
        
        console.log('Client data:', clientData);
        console.log('Render data:', renderData);
        
        if (clientData && renderData) {
            console.log('Creating client sprite with:', renderData.sprite);
            
            // Check if sprite exists in texture manager
            if (!this.textures.exists(renderData.sprite)) {
                console.error('Sprite not found:', renderData.sprite);
                console.log('Available textures:', Object.keys(this.textures.list));
                return;
            }
            
            // Create client sprite positioned to the left side
            this.clientSprite = this.add.image(200, 326, renderData.sprite);
            this.clientSprite.setScale(0.3);
            this.clientSprite.setDepth(75);
            this.clientSprite.setInteractive(); // Make clickable
            
            // Add click handler to toggle decision UI
            this.clientSprite.on('pointerdown', () => {
                console.log('Client sprite clicked!');
                this.decisionSystem.toggleDecisionUI();
            });
            
            // Add hover effects
            this.clientSprite.on('pointerover', () => {
                this.clientSprite.setScale(0.32);
                this.input.setDefaultCursor('pointer');
            });
            
            this.clientSprite.on('pointerout', () => {
                this.clientSprite.setScale(0.3);
                this.input.setDefaultCursor('default');
            });
            
            // Start client off-screen and slide in
            this.clientSprite.x = -200;
            
            this.tweens.add({
                targets: this.clientSprite,
                x: 300,
                duration: 800,
                ease: 'Back.easeOut',
                onComplete: () => {
                    // Show speech bubble after slide-in
                    this.showClientSpeech(clientData);
                }
            });
        } else {
            console.warn('Missing client data or render data:', { clientData, renderData });
        }
    }

    showClientSpeech(clientData) {
        // Create speech bubble background
        const bubbleWidth = 350;
        const bubbleHeight = 140;
        const bubbleX = this.clientSprite.x + 200;
        const bubbleY = this.clientSprite.y - 200;

        // Create the speech bubble graphics
        this.speechBubble = this.add.graphics();
        this.speechBubble.setDepth(76);
        
        // Draw the main bubble
        this.speechBubble.fillStyle(0x000000, 0.9);
        this.speechBubble.lineStyle(3, 0xffffff, 1);
        this.speechBubble.fillRoundedRect(
            bubbleX - bubbleWidth/2, 
            bubbleY - bubbleHeight/2, 
            bubbleWidth, 
            bubbleHeight, 
            15
        );
        this.speechBubble.strokeRoundedRect(
            bubbleX - bubbleWidth/2, 
            bubbleY - bubbleHeight/2, 
            bubbleWidth, 
            bubbleHeight, 
            15
        );
        
        // Draw the speech bubble tail pointing to client
        const tailPoints = [
            bubbleX - 120, bubbleY + bubbleHeight/2,
            bubbleX - 140, bubbleY + bubbleHeight/2 + 25,
            bubbleX - 100, bubbleY + bubbleHeight/2
        ];
        this.speechBubble.fillStyle(0x000000, 0.9);
        this.speechBubble.lineStyle(3, 0xffffff, 1);
        this.speechBubble.fillTriangle(...tailPoints);
        this.speechBubble.strokeTriangle(...tailPoints);

        // Add client name and request text
        const nameText = this.add.text(bubbleX, bubbleY - 40, clientData.name, {
            fontFamily: 'Arial',
            fontSize: '18px',
            color: '#ffff00',
            fontStyle: 'bold',
            align: 'center'
        });
        nameText.setOrigin(0.5);
        nameText.setDepth(77);

        const requestText = this.add.text(bubbleX, bubbleY + 10, clientData.open_statement, {
            fontFamily: 'Arial',
            fontSize: '16px',
            color: '#ffffff',
            align: 'center',
            wordWrap: { width: bubbleWidth - 40 },
            lineSpacing: 4
        });
        requestText.setOrigin(0.5);
        requestText.setDepth(77);

        // Add risk profile info
        const riskText = this.add.text(bubbleX, bubbleY + 50, 
            `Risk Profile: ${clientData.risk_profile.toUpperCase()} | Investment: $${clientData.investment_amount?.toLocaleString()}`, {
            fontFamily: 'Arial',
            fontSize: '12px',
            color: '#aaaaaa',
            align: 'center'
        });
        riskText.setOrigin(0.5);
        riskText.setDepth(77);

        // Store text objects for cleanup
        this.speechTexts = [nameText, requestText, riskText];

        // Animate the speech bubble appearing
        this.speechBubble.setAlpha(0);
        this.speechTexts.forEach(text => text.setAlpha(0));
        
        this.tweens.add({
            targets: [this.speechBubble, ...this.speechTexts],
            alpha: 1,
            duration: 300,
            ease: 'Power2'
        });

        // Add a subtle bounce animation to the client
        this.tweens.add({
            targets: this.clientSprite,
            scaleX: 0.42,
            scaleY: 0.38,
            duration: 150,
            yoyo: true,
            ease: 'Power2'
        });
    }

    hideClient() {
        if (this.clientSprite) {
            this.clientSprite.destroy();
            this.clientSprite = null;
        }
        if (this.speechBubble) {
            this.speechBubble.destroy();
            this.speechBubble = null;
        }
        if (this.speechTexts) {
            this.speechTexts.forEach(text => text.destroy());
            this.speechTexts = null;
        }
    }

    update() {
        // Update systems if needed
    }
}
