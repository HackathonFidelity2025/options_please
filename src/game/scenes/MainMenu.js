import { EventBus } from '../EventBus';
import { Scene } from 'phaser';

export class MainMenu extends Scene
{
    logoTween;
    keyboardTimer;

    constructor ()
    {
        super('MainMenu');
    }

    create ()
    {
        this.add.image(512, 384, 'background').setDisplaySize(1024, 768);

        // Play intro theme
        this.sound.play('intro', { loop: true });

        // Play keyboard soft sound every 10 seconds
        this.keyboardTimer = this.time.addEvent({
            delay: 10000, // 5 seconds in milliseconds
            callback: () => {
                this.sound.play('keyboard-soft', { volume: 0.25, seek: 5 });
            },
            loop: true // Repeat indefinitely
        });

        this.logo = this.add.image(512, 300, 'logo').setDepth(100);

        this.add.text(512, 460, 'Options Trading Game', {
            fontFamily: 'Minecraft', fontSize: 38, color: '#ffffff',
            stroke: '#000000', strokeThickness: 8,
            align: 'center'
        }).setDepth(100).setOrigin(0.5);
        
        // Add start button
        const startButton = this.add.rectangle(512, 550, 200, 60, 0x00ff00);
        startButton.setInteractive();
        startButton.on('pointerdown', () => this.changeScene());
        startButton.setDepth(100);
        
        const startButtonText = this.add.text(512, 550, 'Start Game', {
            fontFamily: 'Minecraft', fontSize: 24, color: '#000000',
            stroke: '#ffffff', strokeThickness: 2,
            align: 'center'
        }).setDepth(101).setOrigin(0.5);
        
        EventBus.emit('current-scene-ready', this);
    }

    changeScene ()
    {
        if (this.logoTween)
        {
            this.logoTween.stop();
            this.logoTween = null;
        }

        // Stop the keyboard timer
        if (this.keyboardTimer)
        {
            this.keyboardTimer.destroy();
            this.keyboardTimer = null;
        }

        // Stop all sounds
        this.sound.stopAll();

        this.scene.start('Game');
    }

    moveLogo (reactCallback)
    {
        if (this.logoTween)
        {
            if (this.logoTween.isPlaying())
            {
                this.logoTween.pause();
            }
            else
            {
                this.logoTween.play();
            }
        }
        else
        {
            this.logoTween = this.tweens.add({
                targets: this.logo,
                x: { value: 750, duration: 3000, ease: 'Back.easeInOut' },
                y: { value: 80, duration: 1500, ease: 'Sine.easeOut' },
                yoyo: true,
                repeat: -1,
                onUpdate: () => {
                    if (reactCallback)
                    {
                        reactCallback({
                            x: Math.floor(this.logo.x),
                            y: Math.floor(this.logo.y)
                        });
                    }
                }
            });
        }
    }
}
