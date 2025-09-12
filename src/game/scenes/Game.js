import { EventBus } from '../EventBus';
import { Scene } from 'phaser';

export class Game extends Scene
{
    constructor ()
    {
        super('Game');
    }

    create ()
    {
        this.cameras.main.setBackgroundColor(0x00ff00);

        this.add.image(512, 384, 'background3').setDisplaySize(1024, 768) //.setAlpha(0.5);

        // Create the tech-bro image positioned off-screen to the left
        this.techBro = this.add.image(-200, 326, 'tech-bro');
        this.techBro.setOrigin(0.5);
        this.techBro.setScale(0.3); // Adjust scale as needed
        this.techBro.setDepth(50);

        // Add click/tap input
        this.input.on('pointerdown', this.slideTechBro, this);

        // Add instruction text
        this.add.text(512, 100, 'Click anywhere to see the tech bro!', {
            fontFamily: 'Arial', fontSize: 24, color: '#ffffff',
            stroke: '#000000', strokeThickness: 4,
            align: 'center'
        }).setOrigin(0.5).setDepth(100);

        EventBus.emit('current-scene-ready', this);
    }

    slideTechBro ()
    {
        // Only slide in if the tech-bro is still off-screen (prevent multiple animations)
        if (this.techBro.x < 0) {
            // Create a smooth slide-in animation from the left
            this.tweens.add({
                targets: this.techBro,
                x: 200, // Final position on screen
                duration: 800, // Animation duration in milliseconds
                ease: 'Back.easeOut', // Easing function for a bouncy effect
                onComplete: () => {
                    // Optional: Add a little bounce or pulse effect after sliding in
                    this.tweens.add({
                        targets: this.techBro,
                        scaleX: 0.6,
                        scaleY: 0.6,
                        duration: 100,
                        yoyo: true,
                        ease: 'Power2',
                        onComplete: () => {
                            // Show speech bubble after the bounce animation
                            this.showSpeechBubble();
                        }
                    });
                }
            });
        }
    }

    showSpeechBubble ()
    {
        // Create speech bubble background
        const bubbleWidth = 280;
        const bubbleHeight = 120;
        const bubbleX = this.techBro.x + 150;
        const bubbleY = this.techBro.y - 150;

        // Create the speech bubble graphics
        this.speechBubble = this.add.graphics();
        this.speechBubble.setDepth(75);
        
        // Draw the main bubble
        this.speechBubble.fillStyle(0x000000, 0.95);
        this.speechBubble.lineStyle(3, 0xffffff, 1);
        this.speechBubble.fillRoundedRect(bubbleX - bubbleWidth/2, bubbleY - bubbleHeight/2, bubbleWidth, bubbleHeight, 15);
        this.speechBubble.strokeRoundedRect(bubbleX - bubbleWidth/2, bubbleY - bubbleHeight/2, bubbleWidth, bubbleHeight, 15);
        
        // Draw the speech bubble tail
        const tailPoints = [
            bubbleX - 60, bubbleY + bubbleHeight/2,
            bubbleX - 80, bubbleY + bubbleHeight/2 + 25,
            bubbleX - 40, bubbleY + bubbleHeight/2
        ];
        this.speechBubble.fillStyle(0x000000, 0.95);
        this.speechBubble.lineStyle(3, 0xffffff, 1);
        this.speechBubble.fillTriangle(...tailPoints);
        this.speechBubble.strokeTriangle(...tailPoints);

        // Add pixelated text to the bubble
        const speechText = "Hey! Want to learn\nabout options\ntrading?";
        
        this.bubbleText = this.add.text(bubbleX, bubbleY, speechText, {
            fontFamily: 'Courier New, monospace',
            fontSize: '18px',
            color: 'white',
            align: 'center',
            lineSpacing: 5,
            // Make text appear more pixelated
            resolution: 1
        });
        
        this.bubbleText.setOrigin(0.5);
        this.bubbleText.setDepth(76);
        
        // Make the text look more pixelated by setting CSS properties
        if (this.bubbleText.style.rtl) {
            this.bubbleText.canvas.style.imageRendering = 'pixelated';
            this.bubbleText.canvas.style.imageRendering = '-moz-crisp-edges';
            this.bubbleText.canvas.style.imageRendering = 'crisp-edges';
        }

        // Animate the speech bubble appearing
        this.speechBubble.setAlpha(0);
        this.bubbleText.setAlpha(0);
        
        this.tweens.add({
            targets: [this.speechBubble, this.bubbleText],
            alpha: 1,
            duration: 300,
            ease: 'Power2'
        });

        // Auto-hide the speech bubble after 5 seconds
        this.time.delayedCall(5000, () => {
            this.hideSpeechBubble();
        });
    }

    hideSpeechBubble ()
    {
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

    changeScene ()
    {
        this.scene.start('GameOver');
    }
}
