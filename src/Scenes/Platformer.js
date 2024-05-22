class Platformer extends Phaser.Scene {
    constructor() {
        super("platformerScene");
    }

    init() {
        // variables and settings
        this.ACCELERATION = 158;
        this.DRAG = 559;    // DRAG < ACCELERATION = icy slide
        this.MAXSPEED = 8;
        this.physics.world.gravity.y = 1500;
        this.DOWNGRAVITY = 4.8;
        this.JUMPDURATION = 3.2;
        this.JUMPHEIGHT = 4;
        //jump velocity may have to be negative
        this.JUMP_VELOCITY = -600;
        this.PARTICLE_VELOCITY = 50;
        this.SCALE = 2.5;
        this.winState = false
    }
    create() {
        // Create a new tilemap game object which uses 18x18 pixel tiles, and is
        // 100 tiles wide and 20 tiles tall.
        this.map = this.add.tilemap("platformer-level-1", 18, 18, 100, 20);

        // Add a tileset to the map
        // First parameter: name we gave the tileset in Tiled
        // Second parameter: key for the tilesheet (from this.load.image in Load.js)
        this.tileset0 = this.map.addTilesetImage("tilemap-backgrounds_packed", "tilemap_backgrounds");
        this.tileset1 = this.map.addTilesetImage("kenny_tilemap_packed", "tilemap_tiles");

        //background layer, not collidable
        this.backgroundLayer = this.map.createLayer("Sky-n-Horizon", this.tileset0, 0, 0);

        // Create platform layer
        this.groundLayer = this.map.createLayer("Ground-n-Platform", this.tileset1, 0, 0);

        // Make it collidable
        this.groundLayer.setCollisionByProperty({
            collides: true
        });

        //create decoration layer
        this.grassLayer = this.map.createLayer("Grass-n-Clouds", this.tileset1, 0, 0);
        

        // Find coins in the "Objects" layer in Phaser
        // Look for them by finding objects with the name "coin"
        // Assign the coin texture from the tilemap_sheet sprite sheet
        // Phaser docs:
        // https://newdocs.phaser.io/docs/3.80.0/focus/Phaser.Tilemaps.Tilemap-createFromObjects

        this.coins = this.map.createFromObjects("Objects", {
            name: "coin",
            key: "tilemap_sheet",
            frame: 145
        });

        // object for flag, marks the end goal and ends the game when touched
        this.flag = this.map.createFromObjects("Objects", {
            name: "flag",
            key: "tilemap_sheet",
            frame: 131
        });

        

         // Since createFromObjects returns an array of regular Sprites, we need to convert 
        // them into Arcade Physics sprites (STATIC_BODY, so they don't move) 
        this.physics.world.enable(this.coins, Phaser.Physics.Arcade.STATIC_BODY);
        this.physics.world.enable(this.flag, Phaser.Physics.Arcade.STATIC_BODY);

        // Create a Phaser group out of the array this.coins
        // This will be used for collision detection below.
        this.coinGroup = this.add.group(this.coins);
        this.flagGroup = this.add.group(this.flag);
        

        // set up player avatar
        my.sprite.player = this.physics.add.sprite(30, 250, "character00", "tile_0000.png");
        my.sprite.player.setCollideWorldBounds(true);

        // Enable collision handling
        this.physics.add.collider(my.sprite.player, this.groundLayer);

        // Handle collision detection with coins
        this.physics.add.overlap(my.sprite.player, this.coinGroup, (obj1, obj2) => {
            obj2.destroy(); // remove coin on overlap
            this.sound.play("coin", {
                volume: 1   // Can adjust volume using this, goes from 0 to 1
            });
        });

        // Handle collision detection with flag, set win condition
        this.physics.add.overlap(my.sprite.player, this.flagGroup, (obj1, obj2) => {
            obj2.destroy();
            this.sound.play("victory", {
                volume: 1   // Can adjust volume using this, goes from 0 to 1
            });
            this.winState = true
        });
        

        // set up Phaser-provided cursor key input
        cursors = this.input.keyboard.createCursorKeys();

        this.rKey = this.input.keyboard.addKey('R');  //keep this one in mind, serves as a reset

        // movement vfx

        my.vfx.walking = this.add.particles(0, 0, "kenny-particles", {
            frame: ['smoke_03.png', 'smoke_02.png', 'smoke_02.png',],
            scale: {start: 0.05, end: 0.01, random: true},
            lifespan: 350,
            alpha: {start: 1, end: 0.1, gravityY: -400,}, 
        });

        my.vfx.walking.stop();
        
        // jump vfx
        my.vfx.jumping = this.add.particles(0, 0, "kenny-particles", {
            frame: ['smoke_04.png', 'smoke_09.png'],
            scale: {start: 0.005, end: 0.01, random: true},
            lifespan: 350, maxAliveParticles: 20,
            alpha: {start: 1, end: 0.1, gravityY: -400,}, 
        });

        my.vfx.jumping.stop();
        

        // TODO: add camera code here
        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.cameras.main.startFollow(my.sprite.player, true, 0.25, 0.25); // (target, [,roundPixels][,lerpX][,lerpY])
        this.cameras.main.setDeadzone(50, 50);
        this.cameras.main.setZoom(this.SCALE);

        document.getElementById('description').innerHTML = '<h2>Welcome to Snow Day! Reach the end and touch the flag!</h2><br>Use the arrow keys to jump and move!</br>';
        

    }

    update() {
        if(cursors.left.isDown) {
            my.sprite.player.setAccelerationX(-this.ACCELERATION);
            my.sprite.player.resetFlip();
            my.sprite.player.anims.play('walk', true);
            // TODO: add particle following code here
            my.vfx.walking.startFollow(my.sprite.player, my.sprite.player.displayWidth/2, my.sprite.player.displayHeight/2-5, false);

            my.vfx.walking.setParticleSpeed(this.PARTICLE_VELOCITY, 0);

            // Only play smoke effect if touching the ground

            if (my.sprite.player.body.blocked.down) {

                my.vfx.walking.start();

            }
            else {
                my.vfx.walking.stop();
            }

        } else if(cursors.right.isDown) {
            my.sprite.player.setAccelerationX(this.ACCELERATION);
            my.sprite.player.setFlip(true, false);
            my.sprite.player.anims.play('walk', true);
            // TODO: add particle following code here
            my.vfx.walking.startFollow(my.sprite.player, my.sprite.player.displayWidth/2-20, my.sprite.player.displayHeight/2-5, false);

            my.vfx.walking.setParticleSpeed(this.PARTICLE_VELOCITY, 0);

            // Only play smoke effect if touching the ground

            if (my.sprite.player.body.blocked.down) {

                my.vfx.walking.start();


            }
            else {
                my.vfx.walking.stop();
            }

        } else {
            // Set acceleration to 0 and have DRAG take over
            my.sprite.player.setAccelerationX(0);
            my.sprite.player.setDragX(this.DRAG);
            my.sprite.player.anims.play('idle');
            my.vfx.walking.stop();
        }

        // player jump
        // note that we need body.blocked rather than body.touching b/c the former applies to tilemap tiles and the latter to the "ground"
        if(!my.sprite.player.body.blocked.down) {
            my.sprite.player.anims.play('jump');
            my.vfx.jumping.startFollow(my.sprite.player, my.sprite.player.displayWidth/2-10, my.sprite.player.displayHeight/2-5, false);
            my.vfx.jumping.setParticleSpeed(this.PARTICLE_VELOCITY, 0);
            my.vfx.jumping.start();

        }
        if(my.sprite.player.body.blocked.down && Phaser.Input.Keyboard.JustDown(cursors.up)) {

            my.sprite.player.body.setVelocityY(this.JUMP_VELOCITY);
            this.sound.play("jump", {
                volume: 1   // Can adjust volume using this, goes from 0 to 1
            });

    
        }

        if(my.sprite.player.body.blocked.down==true) {
            my.vfx.jumping.stop();
        }

        if(Phaser.Input.Keyboard.JustDown(this.rKey)) {
            this.scene.restart();
        }

        //check for if the player fell
        if(my.sprite.player.y>700){
            my.sprite.player.setAccelerationX(0);
            document.getElementById('description').innerHTML = '<h1>Game Over!!!</h1><br>Press R to restart and try again!</br>';

        }

        if(this.winState == true) {
            my.sprite.player.setAccelerationX(0);
            document.getElementById('description').innerHTML = '<h1>Level Complete!!!</h1><br>Press R to play again!</br>';

        }
    
    }


}