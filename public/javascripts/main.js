var game = new Phaser.Game(500, 500, Phaser.AUTO, 'gameDiv');

var mainState = {

    preload: function() {
        game.stage.backgroundColor = '#f5f2d0';

        if(!game.device.desktop) {
            game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
            game.scale.setMinMax(250, 250, 500, 500);
        }

        game.scale.pageAlignHorizontally = true;
        //game.scale.pageAlignVertically = true;

        // game.load.audio('coin', ['assets/coin.wav', 'assets/coin.mp3']);
        // game.load.audio('move', ['assets/move.wav', 'assets/move.mp3']);
        // game.load.audio('hit', ['assets/hit.wav', 'assets/hit.mp3']);
        // game.load.audio('music', ['assets/music.mp3', 'assets/music.ogg']);

        game.load.image('square', 'assets/z square.png');
        game.load.image('coin', 'assets/poo coin.png');
        game.load.image('particle', 'assets/particle.png');
        game.load.image('particle2', 'assets/particle2.png');
        game.load.image('enemy', 'assets/enemy.png');
        game.load.image('map', 'assets/map2.png');

        game.load.image('laundry', 'assets/laundry.png');
        game.load.image('clipboard', 'assets/clipboard.png');
        game.load.image('email', 'assets/email.png');
        game.load.image('laptop', 'assets/laptop.png');
        game.load.image('run', 'assets/run.png');
        game.load.image('shower', 'assets/shower.png');
        game.load.image('tools', 'assets/tools.png');
        game.load.image('phone', 'assets/phone.png');
    },

    create: function() {
        game.physics.startSystem(Phaser.Physics.ARCADE);
        game.forceSingleUpdate = true;
        game.renderer.renderSession.roundPixels = true;

        this.cursor = game.input.keyboard.createCursorKeys();

        if(!game.device.desktop) {
            this.onDown = {x:0, y:0};
            game.input.onDown.add(this.clickDown, this);
        }

        this.score = 0;
        this.bestScore = 0;
        this.count = 0;
        this.speed = 100;
        this.nextEnemy = game.time.now;
        this.menuScene = true;
        this.isMoving = false;
        this.coinTaking = false;
        this.movedDown = false;
        this.movedUp = false;
        this.movedLeft = false;
        this.movedRight = false;
        this.mobileMoving = false;

        this.loadLabels();
        this.loadLevel();
        // this.loadSounds();
        this.loadParticles();
    },

    update: function() {
        game.physics.arcade.overlap(this.square, this.coin, this.takeCoin, null, this);
        game.physics.arcade.overlap(this.square, this.enemies, this.squareHit, null, this);

        this.movePlayer();
        this.spawnEnemies();
        this.mobileInputs();
    },

    spawnEnemies: function() {
        if (game.time.now < this.nextEnemy || this.menuScene)
            return;

        if (game.device.desktop) {
            var start = 1100, end = 500, score = 40;
            var delay = Math.max(start - (start-end)*this.score/score, end);
            this.nextEnemy = game.time.now + delay;
        }
        else {
            var start = 1500, end = 700, score = 40;
            var delay = Math.max(start - (start-end)*this.score/score, end);
            this.nextEnemy = game.time.now + delay;
        }

        var patterns = [];
        patterns[0] = [
            [{i:-1, j:-1, ver:true, speed:1}], [{i:-1, j:0, ver:true, speed:1}], [{i:-1, j:1, ver:true, speed:1}],
            [{i:1, j:-1, ver:true, speed:1}], [{i:1, j:0, ver:true, speed:1}], [{i:1, j:1, ver:true, speed:1}],
            [{i:-1, j:-1, ver:false, speed:1}], [{i:0, j:-1, ver:false, speed:1}], [{i:1, j:-1, ver:false, speed:1}],
            [{i:-1, j:1, ver:false, speed:1}], [{i:0, j:1, ver:false, speed:1}], [{i:1, j:1, ver:false, speed:1}],
        ];

        var e = patterns[0][game.rnd.integerInRange(0, patterns[0].length -1)];

        for (var i =0; i < e.length; i++) {
            this.addEnemy(e[i].i, e[i].j, e[i].ver, e[i].speed*2);
        }
    },

    addEnemy: function(i, j, ver, speed) {
        var enemy = this.enemies.getFirstDead();

        if (!enemy)
            return;

        var tmpX, tmpY;
        if (ver) {
            enemy.reset(game.width/2 +i*8*8 +i*190, game.height/2 +j*8*8);
            enemy.body.velocity.x = -100*i*speed;
        }
        else {
            enemy.reset(game.width/2 +i*8*8, game.height/2 +j*8*8 +j*190);
            enemy.body.velocity.y = -100*j*speed;
        }

        enemy.anchor.setTo(0.5);
        enemy.checkWorldBounds = true;
        enemy.outOfBoundsKill = true;
    },

    clickDown: function() {
        this.onDown = {x:game.input.x, y:game.input.y};
    },

    squareHit: function(s, e) {
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            this.labelBest.text = "best: " + this.bestScore;
        }

        this.emitter2.x = e.x;
        this.emitter2.y = e.y;
        this.emitter2.start(true, 800, null, 20);

        e.kill();
        // this.hitSound.play();
        this.score = 0;
        this.labelScore.text = this.score;

        game.add.tween(this.map.scale).to({x:1.1, y:1.1}, 50).to({x:1, y:1}, 100).start();
    },

    takeCoin: function() {
        if (this.coinTaking)
            return;

        this.coinTaking = true;
        this.menuScene = false;

        this.emitter.x = this.coin.x;
        this.emitter.y = this.coin.y;
        this.emitter.start(true, 800, null, 20);

        // this.coinSound.play();
        this.updateScore();

        var t = game.add.tween(this.coin.scale).to({x:0, y:0}, 100).start();
        game.time.events.add(500, this.addCoin, this);
    },

    updateScore: function() {
        this.score++;
        this.labelScore.text = this.score;
    },

    addCoin: function() {
        var coinPosition = [
            {x: game.width/2 -8*8, y:game.height/2 -8*8}, {x: game.width/2, y:game.height/2 -8*8}, {x: game.width/2 +8*8, y:game.height/2 -8*8},
            {x: game.width/2 -8*8, y:game.height/2}, {x: game.width/2, y:game.height/2}, {x: game.width/2 +8*8, y:game.height/2},
            {x: game.width/2 -8*8, y:game.height/2 +8*8},{x: game.width/2, y:game.height/2 +8*8}, {x: game.width/2 +8*8, y:game.height/2 +8*8},
        ];

        for (var i = 0; i < coinPosition.length; i++) {
            if (coinPosition[i].x == this.coin.x && coinPosition[i].y == this.coin.y)
                coinPosition.splice(i, 1);
            else if (coinPosition[i].x < this.square.x +7*8 && coinPosition[i].x > this.square.x -7*8 &&
                coinPosition[i].y < this.square.y +7*8 && coinPosition[i].y > this.square.y -7*8 )
                coinPosition.splice(i, 1);
        }

        var newPos = coinPosition[game.rnd.integerInRange(0, coinPosition.length -1)];

        this.coin.reset(newPos.x, newPos.y);
        game.add.tween(this.coin.scale).to({x:1, y:1}, 100).start();

        this.coinTaking = false;
    },

    moveDown: function() {
        var t, newPos;

        if (this.square.y < game.height/2 + 8*8) {
            newPos = this.square.y + this.square.height +24;
            t = game.add.tween(this.square).to({y: newPos}, this.speed).start();
        }
        else {
            newPos = this.square.y + this.square.height/3;
            t = game.add.tween(this.square).to({y: newPos}, this.speed/2).to({y: this.square.y}, this.speed/2).start();
        }

        // this.moveSound.play();
        this.isMoving = true;
        t.onComplete.add(this.moveOver, this);
    },

    moveUp: function() {
        var t, newPos;

        if (this.square.y > game.height/2 - 8*8) {
            newPos = this.square.y - this.square.height -24;
            var t = game.add.tween(this.square).to({y: newPos}, this.speed).start();
        }
        else {
            newPos = this.square.y - this.square.height/3;
            var t = game.add.tween(this.square).to({y: newPos}, this.speed/2).to({y: this.square.y}, this.speed/2).start();
        }

        // this.moveSound.play();
        this.isMoving = true;
        t.onComplete.add(this.moveOver, this);
    },

    moveRight: function() {
        var t, newPos;

        if (this.square.x < game.width/2 + 8*8) {
            newPos = this.square.x + this.square.width +24;
            var t = game.add.tween(this.square).to({x: newPos}, this.speed).start();
        }
        else {
            newPos = this.square.x + this.square.width/3;
            var t = game.add.tween(this.square).to({x: newPos}, this.speed/2).to({x: this.square.x}, this.speed/2).start();
        }

        // this.moveSound.play();
        this.isMoving = true;
        t.onComplete.add(this.moveOver, this);
    },

    moveLeft: function() {
        var t, newPos;

        if (this.square.x > game.width/2 - 8*8) {
            newPos = this.square.x - this.square.width -24;
            var t = game.add.tween(this.square).to({x: newPos}, this.speed).start();
        }
        else {
            newPos = this.square.x - this.square.width/3;
            var t = game.add.tween(this.square).to({x: newPos}, this.speed/2).to({x: this.square.x}, this.speed/2).start();
        }

        // this.moveSound.play();
        this.isMoving = true;
        t.onComplete.add(this.moveOver, this);
    },

    movePlayer: function() {
        var speed = 150;
        var t;

        if (this.isMoving)
            return;

        if (this.cursor.down.isDown && !this.movedDown) {
            this.movedDown = true;
            this.moveDown(speed);
            return;
        }
        else if (this.cursor.down.isUp) {
            this.movedDown = false;
        }

        if (this.cursor.up.isDown && !this.movedUp) {
            this.movedUp = true;
            this.moveUp();
            return;
        }
        else if (this.cursor.up.isUp) {
            this.movedUp = false;
        }

        if (this.cursor.left.isDown && !this.movedLeft) {
            this.movedLeft = true;
            this.moveLeft();
            return;
        }
        else if (this.cursor.left.isUp) {
            this.movedLeft = false;
        }

        if (this.cursor.right.isDown && !this.movedRight) {
            this.movedRight = true;
            this.moveRight();
            return;
        }
        else if (this.cursor.right.isUp) {
            this.movedRight = false;
        }
    },

    moveOver: function() {
        this.isMoving = false;
    },

    // loadSounds: function() {
    //     this.coinSound = game.add.audio('coin');
    //     this.coinSound.volume = 0.5;
    //     this.moveSound = game.add.audio('move');
    //     this.moveSound.volume = 0.2;
    //     this.hitSound = game.add.audio('hit');
    //     this.music = game.add.audio('music');
    //     this.music.loop = true;
    //     this.music.sound = 0.8;
    //     this.music.play();
    // },

    loadParticles: function() {
        this.emitter = game.add.emitter(0, 0);
        this.emitter.makeParticles('particle');
        this.emitter.setXSpeed(-150, 150);
        this.emitter.setYSpeed(-150, 150);
        this.emitter.setScale(2, 0, 2, 0, 800);
        this.emitter2 = game.add.emitter(0, 0);
        this.emitter2.makeParticles('particle2');
        this.emitter2.setXSpeed(-150, 150);
        this.emitter2.setYSpeed(-150, 150);
        this.emitter2.setScale(2, 0, 2, 0, 800);
    },

    loadLevel: function() {
        this.coin = game.add.sprite(game.width/2 +8*8, game.height/2 -8*8, 'coin');
        this.coin.anchor.setTo(0.5);
        game.physics.arcade.enable(this.coin);

        this.map = game.add.sprite(game.width/2, game.height/2, 'map');
        this.map.anchor.setTo(0.5);

        this.square = game.add.sprite(game.width/2 -8*8, game.height/2 +8*8, 'square');
        this.square.anchor.setTo(0.5);
        game.physics.arcade.enable(this.square);

        this.enemies = game.add.group();
        this.enemies.enableBody = true;
        this.enemies.createMultiple(1, 'email');
        this.enemies.createMultiple(1, 'phone');
        this.enemies.createMultiple(1, 'laptop');
        this.enemies.createMultiple(1, 'shower');
        this.enemies.createMultiple(1, 'run');
        this.enemies.createMultiple(1, 'laundry');
        this.enemies.createMultiple(1, 'tools');

    },

    loadLabels: function() {
        var text;
        // if(game.device.desktop)
        //     text = "use arrow keys to drink wine and avoid responsibilities";
        // else
        //     text = "swipe to drink wine and avoid responsibilities";
        text = ""

        this.labelName = game.add.text(game.width/2, (game.height-200)/4, "Welcome to lockdown", { font: "25px Arial", fill: "#152238" });
        this.labelName.anchor.setTo(0.5);

        this.labelTuto = game.add.text(game.width/2, game.height - (game.height-200)/4, text, { font: "17px Arial", fill: "#152238" });
        this.labelTuto.anchor.setTo(0.5);

        this.labelBest = game.add.text(game.width/2, game.height - (game.height-200)/4, "best: 0", { font: "25px Arial", fill: "#152238" });
        this.labelBest.anchor.setTo(0.5);
        this.labelBest.alpha = 0;

        this.labelScore = game.add.text(game.width/2, game.height/2+5, "", { font: "100px Arial", fill: "#152238" });
        this.labelScore.anchor.setTo(0.5);
        this.labelScore.alpha = 0.2;
    },

    mobileInputs: function() {
        if (this.score == 3 && this.labelTuto.alpha == 1) {
            game.add.tween(this.labelTuto).to({alpha:0}, 1000).start();
            var t = game.add.tween(this.labelName).to({alpha:0}, 1000).start();
            t.onComplete.add(function(){
                game.add.tween(this.labelBest).to({alpha:1}, 1000).start();
            }, this);
        }

        if (game.input.activePointer.isDown && !this.mobileMoving && !game.device.desktop) {
            var distX = Math.abs(game.input.x - this.onDown.x);
            var distY = Math.abs(game.input.y - this.onDown.y);

            if (distX > distY && distX > 40 && !this.isMoving) {
                this.mobileMoving = true;
                if (this.onDown.x > game.input.x)
                    this.moveLeft();
                else
                    this.moveRight();
            }
            else if (distX < distY && distY > 40 && !this.isMoving) {
                this.mobileMoving = true;
                if (this.onDown.y > game.input.y)
                    this.moveUp();
                else
                    this.moveDown();
            }
        }
        else if (!game.input.activePointer.isDown)
            this.mobileMoving = false;
    }

};

game.state.add('main', mainState);
game.state.start('main');
