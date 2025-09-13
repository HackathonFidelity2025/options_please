import { EventBus } from '../EventBus';
import { Scene } from 'phaser';

export class GameOver extends Scene
{
    constructor ()
    {
        super('GameOver');
    }

    create ()
    {
        // Start with trading floor ambience, then fade to silence
        this.sound.stopAll();
        
        // Black background initially
        this.add.rectangle(512, 384, 1024, 768, 0x000000);

        // Termination dialogue lines
        this.terminationLines = [
            "The door creaks open.",
            "Your manager steps in, silent at first.",
            "",
            '"You\'ve made too many bad calls.',
            'The clients have lost confidence.',
            'The desk cannot afford your mistakes."',
            "",
            "He pauses.",
            "",
            '"You\'re fired."'
        ];

        this.currentLineIndex = 0;
        this.typingSpeed = 80; // Slower, more ominous
        this.isTyping = false;
        this.phase = 'audio'; // audio -> dialogue -> stamp -> credits

        // Text object for the current line being typed
        this.currentText = this.add.text(512, 350, '', {
            fontFamily: 'Courier New, monospace',
            fontSize: 26,
            color: '#ffffff',
            align: 'center',
            wordWrap: { width: 800 }
        }).setOrigin(0.5).setDepth(10);
        this.currentText.setVisible(false);

        // Next button (initially hidden)
        this.nextButton = this.add.rectangle(512, 500, 150, 50, 0x333333, 0.8);
        this.nextButton.setInteractive();
        this.nextButton.setVisible(false);
        this.nextButton.setDepth(20);

        this.nextButtonText = this.add.text(512, 500, 'CONTINUE', {
            fontFamily: 'Courier New, monospace',
            fontSize: 18,
            color: '#ffffff',
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

        // TERMINATED stamp (initially hidden)
        this.terminatedStamp = this.add.text(512, 384, 'TERMINATED', {
            fontFamily: 'Impact, Arial Black, sans-serif',
            fontSize: 128,
            color: '#ff0000',
            stroke: '#000000',
            strokeThickness: 8,
            align: 'center'
        }).setOrigin(0.5).setDepth(100).setVisible(false);

        // Credits container (initially hidden)
        this.creditsContainer = this.add.container(512, 768);
        this.creditsContainer.setDepth(50);
        this.creditsContainer.setVisible(false);

        // Start the audio sequence
        this.startAudioSequence();

        EventBus.emit('current-scene-ready', this);
    }

    startAudioSequence() {
        this.phase = 'audio';
        
        // // Sequence: silence -> footsteps -> door knock -> start dialogue
        // this.time.delayedCall(1000, () => {
        //     // Play footsteps approaching (using printer sound as substitute)
        //     this.sound.play('printer', { volume: 0.3, rate: 0.5 });
        // });

        this.time.delayedCall(1500, () => {
            // Door knock sound (using paper-turn as substitute)
            this.sound.play('knock', { volume: 1, rate: 0.7 });
        });

        this.time.delayedCall(3500, () => {
            // Start the dialogue phase
            this.phase = 'dialogue';
            this.currentText.setVisible(true);
            this.typeCurrentLine();
        });
    }

    typeCurrentLine() {
        if (this.currentLineIndex >= this.terminationLines.length) {
            this.showTerminatedStamp();
            return;
        }

        const line = this.terminationLines[this.currentLineIndex];
        
        // Clear current text
        this.currentText.setText('');
        this.hideNextButton();
        this.isTyping = true;

        // Handle empty lines (dramatic pauses)
        if (line === '') {
            this.isTyping = false;
            this.time.delayedCall(1500, () => {
                this.showNextButton();
            });
            return;
        }

        let charIndex = 0;
        const typeChar = () => {
            if (charIndex < line.length) {
                // Less frequent typing sounds for more ominous effect
                if (charIndex % 3 === 0) {
                    this.sound.play('keyboard-hard', { 
                        volume: 0.15, 
                        rate: Phaser.Math.FloatBetween(0.8, 1.2), // Vary the pitch slightly
                        seek: 7.5
                    });
                }

                this.currentText.setText(line.substring(0, charIndex + 1) + '_');
                charIndex++;
                
                this.time.delayedCall(this.typingSpeed, typeChar);
            } else {
                // Finished typing this line
                this.currentText.setText(line);
                this.isTyping = false;
                this.time.delayedCall(800, () => {
                    this.showNextButton();
                });
            }
        };

        typeChar();
    }

    showNextButton() {
        this.nextButton.setVisible(true);
        this.nextButtonText.setVisible(true);
        
        this.nextButton.setAlpha(0);
        this.nextButtonText.setAlpha(0);
        
        this.tweens.add({
            targets: [this.nextButton, this.nextButtonText],
            alpha: 1,
            duration: 500,
            ease: 'Power2'
        });
    }

    hideNextButton() {
        this.nextButton.setVisible(false);
        this.nextButtonText.setVisible(false);
    }

    nextLine() {
        if (this.isTyping) {
            return;
        }

        this.currentLineIndex++;
        this.typeCurrentLine();
    }

    showTerminatedStamp() {
        this.phase = 'stamp';
        
        // Hide dialogue elements
        this.currentText.setVisible(false);
        this.hideNextButton();

        // Show TERMINATED stamp with dramatic effect
        this.terminatedStamp.setVisible(true);
        this.terminatedStamp.setAlpha(0);
        this.terminatedStamp.setScale(0.5);
        this.terminatedStamp.setRotation(Phaser.Math.DegToRad(-15)); // Slight angle like a stamp

        // Stamp sound effect
        this.sound.play('stamp', { volume: 1 });

        this.tweens.add({
            targets: this.terminatedStamp,
            alpha: 0.9,
            scale: 1,
            duration: 800,
            ease: 'Back.easeOut',
            onComplete: () => {
                // Wait then proceed to credits
                this.time.delayedCall(2500, () => {
                    this.startCredits();
                });
            }
        });
    }

    startCredits() {
        this.phase = 'credits';
        
        // Fade out the TERMINATED stamp
        this.tweens.add({
            targets: this.terminatedStamp,
            alpha: 0,
            duration: 1000,
            ease: 'Power2'
        });

        // Create credits text
        const creditsText = [
            '',
            '',
            '',
            '',
            'OPTIONS, PLEASE',
            '',
            'Created at Fidelity Hackathon 2025',
            'For educational purposes only.',
            '',
            '',
            'GAME DESIGN',
            'Joe Ampfer, Landen Tomlin, Tyler Elgof',
            '',
            'POWERED BY',
            'Phaser.js',
            'JavaScript',
            '',
            'SPECIAL THANKS',
            'Fidelity Investments',
            'All Hackathon Participants',
            '',
            '',
            'Thank you for playing!',
            '',
            '',
            ''
        ];

        let yPos = 0;
        creditsText.forEach((line, index) => {
            const text = this.add.text(0, yPos, line, {
                fontFamily: 'Courier New, monospace',
                fontSize: line === 'OPTIONS, PLEASE' ? 32 : 20,
                color: line === 'OPTIONS, PLEASE' ? '#00ff00' : '#ffffff',
                align: 'center'
            }).setOrigin(0.5, 0);
            
            this.creditsContainer.add(text);
            yPos += line === '' ? 30 : 50;
        });

        // Show credits and start scrolling
        this.creditsContainer.setVisible(true);
        
        // Start subtle sound effects
        this.playCreditsAudio();

        // Scroll credits upward
        this.tweens.add({
            targets: this.creditsContainer,
            y: -yPos - 200,
            duration: creditsText.length * 800,
            ease: 'Linear',
            onComplete: () => {
                // Return to main menu after credits
                this.time.delayedCall(2000, () => {
                    this.changeScene();
                });
            }
        });
    }

    playCreditsAudio() {
        // Play theme
        this.sound.play('intro', { loop: true, rate: 0.8 });

        // Subtle background sounds during credits
        this.time.addEvent({
            delay: 6000,
            callback: () => {
                this.sound.play('keyboard-soft', { volume: 0.09, seek: 3 });
            },
            loop: true
        });
        
        this.time.addEvent({
            delay: 7000,
            callback: () => {
                this.sound.play('paper-turn2', { volume: 0.05 });
            },
            loop: true
        });
    }

    changeScene() {
        this.sound.stopAll();
        this.scene.start('MainMenu');
    }

    // Allow space or enter to advance during dialogue
    update() {
        if (this.phase === 'dialogue') {
            const spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
            const enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
            
            if ((spaceKey.isDown || enterKey.isDown) && !this.isTyping && this.nextButton.visible) {
                this.nextLine();
            }
        }
    }
}
