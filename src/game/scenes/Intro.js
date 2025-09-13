import { Scene } from 'phaser';
import { EventBus } from '../EventBus';

export class Intro extends Scene {
    constructor() {
        super('Intro');
    }

    create() {
        // Black background
        this.add.rectangle(512, 384, 1024, 768, 0x000000);

        // Intro text lines
        this.introLines = [
            "Congratulations.",
            "You have been selected to serve as a Junior Financial Advisor",
            "at the Ministry of Markets, Division of Derivatives.",
            "Your duty is simple:",
            "Review client requests.",
            "Examine market evidence.",
            "Decide whether to CALL, PUT, or HOLD.",
            "Be vigilant.",
            "A poor recommendation risks not only your client's trust,",
            "but the stability of the entire desk.",
            "The clients are waiting.",
            "Options, Please."
        ];

        this.currentLineIndex = 0;
        this.typingSpeed = 50; // milliseconds per character
        this.isTyping = false;

        // Text object for the current line being typed
        this.currentText = this.add.text(512, 350, '', {
            fontFamily: 'Courier New, monospace',
            fontSize: 28,
            color: '#00ff00',
            align: 'center',
            wordWrap: { width: 800 }
        }).setOrigin(0.5).setDepth(10);

        // Next button (initially hidden)
        this.nextButton = this.add.rectangle(512, 500, 150, 50, 0x333333, 0.8);
        this.nextButton.setInteractive();
        this.nextButton.setVisible(false);
        this.nextButton.setDepth(20);

        this.nextButtonText = this.add.text(512, 500, 'NEXT', {
            fontFamily: 'Courier New, monospace',
            fontSize: 20,
            color: '#00ff00',
            align: 'center'
        }).setOrigin(0.5).setDepth(21);
        this.nextButtonText.setVisible(false);

        // Button hover effects
        this.nextButton.on('pointerover', () => {
            this.nextButton.setFillStyle(0x555555, 0.9);
            this.sound.play('hover', { volume: 0.3 });
        });
        
        this.nextButton.on('pointerout', () => {
            this.nextButton.setFillStyle(0x333333, 0.8);
        });

        this.nextButton.on('pointerdown', () => {
            this.nextLine();
        });

        // Keyboard click sound (we'll use keyboard-hard for typewriter effect)
        this.typingSound = null;

        // Start typing the first line
        this.typeCurrentLine();

        // Logo (initially hidden, will fade in at the end)
        this.logo = this.add.image(512, 200, 'logo').setVisible(false).setDepth(15);

        EventBus.emit('current-scene-ready', this);
    }

    typeCurrentLine() {
        if (this.currentLineIndex >= this.introLines.length) {
            this.showLogo();
            return;
        }

        const line = this.introLines[this.currentLineIndex];
        
        // Clear current text
        this.currentText.setText('');
        this.hideNextButton();
        this.isTyping = true;

        // Handle empty lines (pauses)
        if (line === '') {
            this.isTyping = false;
            this.showNextButton();
            return;
        }

        let charIndex = 0;
        const typeChar = () => {
            if (charIndex < line.length) {
                // Play keyboard typing sound occasionally (not every character to avoid audio spam)
                if (charIndex % 3 === 0) {
                    this.sound.play('keyboard-hard', { 
                        volume: 0.15, 
                        rate: Phaser.Math.FloatBetween(0.8, 1.2), // Vary the pitch slightly
                        seek: 7.5
                    });
                }

                this.currentText.setText(line.substring(0, charIndex + 1) + '_'); // Add cursor
                charIndex++;
                
                // Schedule next character
                this.time.delayedCall(this.typingSpeed, typeChar);
            } else {
                // Finished typing this line
                this.currentText.setText(line); // Remove cursor
                this.isTyping = false;
                this.showNextButton();
            }
        };

        typeChar();
    }

    showNextButton() {
        this.nextButton.setVisible(true);
        this.nextButtonText.setVisible(true);
        
        // Subtle fade-in animation
        this.nextButton.setAlpha(0);
        this.nextButtonText.setAlpha(0);
        
        this.tweens.add({
            targets: [this.nextButton, this.nextButtonText],
            alpha: 1,
            duration: 300,
            ease: 'Power2'
        });
    }

    hideNextButton() {
        this.nextButton.setVisible(false);
        this.nextButtonText.setVisible(false);
    }

    nextLine() {
        if (this.isTyping) {
            return; // Don't allow skipping while typing
        }

        this.currentLineIndex++;
        this.typeCurrentLine();
    }

    showLogo() {
        // Hide the text and next button
        this.currentText.setVisible(false);
        this.hideNextButton();

        // Show and fade in the logo
        this.logo.setVisible(true);
        this.logo.setAlpha(0);
        this.logo.setScale(0.8);

        // Play a subtle sound effect
        this.sound.play('hover', { volume: 0.5 });

        this.tweens.add({
            targets: this.logo,
            alpha: 1,
            scale: 1,
            duration: 2000,
            ease: 'Power2',
            onComplete: () => {
                // Wait a moment, then proceed to main menu
                this.time.delayedCall(2000, () => {
                    this.proceedToMainMenu();
                });
            }
        });
    }

    proceedToMainMenu() {
        // Fade out everything
        this.tweens.add({
            targets: [this.logo],
            alpha: 0,
            duration: 1000,
            ease: 'Power2',
            onComplete: () => {
                this.scene.start('MainMenu');
            }
        });
    }

    // Allow space or enter to advance (optional convenience)
    update() {
        const spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        const enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
        
        if ((spaceKey.isDown || enterKey.isDown) && !this.isTyping && this.nextButton.visible) {
            this.nextLine();
        }
    }
}
