Hero = function (game, x, y) {
    Phaser.Sprite.call(this, game, x, y, 'hero');
    this.anchor.set(0.5, 0.5);
    this.game.physics.enable(this);
    this.body.collideWorldBounds = true;
    this.animations.add('stop', [0]);
    this.animations.add('run', [1, 2], 8, true);
    this.animations.add('jump', [3]);
    this.animations.add('fall', [4]);
}
Hero.prototype = Object.create(Phaser.Sprite.prototype);
Hero.prototype.constructor = Hero;

Hero.prototype.move = function (direction) {
  const SPEED = 150;
  this.body.velocity.x = direction * SPEED;

  if (this.body.velocity.x < 0) {
        this.scale.x = -1;
    }
    else if (this.body.velocity.x > 0) {
        this.scale.x = 1;
    }
};
Hero.prototype.jump = function () {
    const JUMP_SPEED = 600;
    this.body.velocity.y = -JUMP_SPEED;
};
Hero.prototype.bounce = function () {
    const BOUNCE_SPEED = 200;
    this.body.velocity.y = -BOUNCE_SPEED;
};
Hero.prototype.update = function () {
    let animationName = this._getAnimationName();
    if (this.animations.name !== animationName) {
        this.animations.play(animationName);
    }
};
Hero.prototype._getAnimationName = function () {
    let name = 'stop';

    if (this.body.velocity.y < 0) {
        name = 'jump';
    }
    else if (this.body.velocity.y >= 0 && !this.body.touching.down) {
        name = 'fall';
    }
    else if (this.body.velocity.x !== 0 && this.body.touching.down) {
        name = 'run';
    }
    return name;
};


Spider = function(game, x, y) {
    Phaser.Sprite.call(this, game, x, y, 'spider');

    this.anchor.set(0.5);
    this.animations.add('crawl', [0, 1, 2], 8, true);
    this.animations.add('die', [0, 4, 0, 4, 0, 4, 3, 3, 3, 3, 3, 3], 12);
    this.animations.play('crawl');

    this.game.physics.enable(this);
    this.body.collideWorldBounds = true;
    this.body.velocity.x = Spider.SPEED;
}

Spider.SPEED = 100;

Spider.prototype = Object.create(Phaser.Sprite.prototype);
Spider.prototype.constructor = Spider;

Spider.prototype.update = function () {
    if (this.body.touching.right || this.body.blocked.right) {
        this.body.velocity.x = -Spider.SPEED;
    }
    else if (this.body.touching.left || this.body.blocked.left) {
        this.body.velocity.x = Spider.SPEED;
    }
};
Spider.prototype.die = function () {
    this.body.enable = false;

    this.animations.play('die').onComplete.addOnce(function () {
        this.kill();
    }, this);
};

PlayState = {};

const LEVEL_COUNTER = 4;

PlayState.init = function (data) {
    this.game.renderer.renderSession.roundPixels = true;
    this.keys = this.game.input.keyboard.createCursorKeys();
    this.coinPickupCount = 0;
    this.hasKey = false;
    this.level = (data.level || 1) % LEVEL_COUNTER;
    console.log(this.level);
};

PlayState.preload = function () {
    this.game.load.json('level:1', 'data/level01.json');
    this.game.load.image('background', 'images/background.png');
    this.game.load.image('ground', 'images/ground.png');
    this.game.load.image('grass:8x1', 'images/grass_8x1.png');
    this.game.load.image('grass:6x1', 'images/grass_6x1.png');
    this.game.load.image('grass:4x1', 'images/grass_4x1.png');
    this.game.load.image('grass:2x1', 'images/grass_2x1.png');
    this.game.load.image('grass:1x1', 'images/grass_1x1.png');
    this.game.load.image('invisible-wall', 'images/invisible_wall.png');
    this.game.load.spritesheet('hero', 'images/hero.png', 36, 42);
    this.game.load.spritesheet('coin', 'images/coin_animated.png', 22, 22);
    this.game.load.spritesheet('spider', 'images/spider.png', 42, 32);
    this.game.load.spritesheet('door', 'images/door.png', 42, 66);
    this.game.load.image('icon:coin', 'images/coin_icon.png');
    this.game.load.json('level:2', 'data/level02.json');
    this.game.load.json('level:3', 'data/level03.json');
    this.game.load.image('key', 'images/key.png');
    this.game.load.spritesheet('icon:key', 'images/key_icon.png', 34, 30);
};

PlayState.create = function () {
    this.game.physics.startSystem(Phaser.Physics.ARCADE);
    this.game.add.image(0, 0, 'background');
    this._loadLevel(this.game.cache.getJSON(`level:${this.level}`));
    this._createHud();
};

PlayState._loadLevel = function (data) {
  this.bgDecoration = this.game.add.group();
  this.platforms = this.game.add.group();
  this.movablePlatforms = this.game.add.group();
  this.coins = this.game.add.group();
  this.spiders = this.game.add.group();
  this.enemyWalls = this.game.add.group();
  this.enemyWalls.visible = false;

  data.platforms.forEach(this._spawnPlatform, this);
  data.movablePlatforms.forEach(this._spawnmovablePlatform, this);
  this._spawnCharacters({hero: data.hero, spiders: data.spiders});
  data.coins.forEach(this._spawnCoin, this);
  this._spawnDoor(data.door.x, data.door.y);
  this._spawnKey(data.key.x, data.key.y);

  const GRAVITY = 1200;
  this.game.physics.arcade.gravity.y = GRAVITY;
};

PlayState._spawnPlatform = function (platform) {
  let sprite = this.platforms.create(platform.x, platform.y, platform.image);
  this.game.physics.enable(sprite);
  sprite.body.allowGravity = false;
  sprite.body.immovable = true;

  this._spawnEnemyWall(platform.x, platform.y, 'left');
  this._spawnEnemyWall(platform.x + sprite.width, platform.y, 'right');
};

PlayState._spawnmovablePlatform = function (movablePlatforms) {
  let sprite = this.platforms.create(movablePlatforms.x, movablePlatforms.y, movablePlatforms.image);
  this.game.physics.enable(sprite);
  sprite.body.allowGravity = false;
  sprite.body.immovable = false;
};

PlayState._spawnEnemyWall = function (x, y, side) {
    let sprite = this.enemyWalls.create(x, y, 'invisible-wall');
    sprite.anchor.set(side === 'left' ? 1 : 0, 1);

    this.game.physics.enable(sprite);
    sprite.body.immovable = true;
    sprite.body.allowGravity = false;
};

PlayState._spawnCharacters = function (data) {
  this.hero = new Hero(this.game, data.hero.x, data.hero.y);
  this.game.add.existing(this.hero);

  data.spiders.forEach(function (spider) {
      let sprite = new Spider(this.game, spider.x, spider.y);
      this.spiders.add(sprite);
  }, this);
};

PlayState._spawnCoin = function (coin) {
    let sprite = this.coins.create(coin.x, coin.y, 'coin');
    sprite.anchor.set(0.5, 0.5);
    sprite.animations.add('rotate', [0, 1, 2, 1], 6, true);
    sprite.animations.play('rotate');
    this.game.physics.enable(sprite);
    sprite.body.allowGravity = false;
};

PlayState._spawnDoor = function (x, y) {
    this.door = this.bgDecoration.create(x, y, 'door');
    this.door.anchor.setTo(0.5, 1);
    this.game.physics.enable(this.door);
    this.door.body.allowGravity = false;
};

PlayState._spawnKey = function (x, y) {
    this.key = this.bgDecoration.create(x, y, 'key');
    this.key.anchor.set(0.5, 0.5);
    this.game.physics.enable(this.key);
    this.key.body.allowGravity = false;

    this.key.y -= 3;
    this.game.add.tween(this.key)
        .to({y: this.key.y + 6}, 800, Phaser.Easing.Sinusoidal.InOut)
        .yoyo(true)
        .loop()
        .start();
};

PlayState._createHud = function () {
    this.keyIcon = this.game.make.image(0, 19, 'icon:key');
    this.keyIcon.anchor.set(0, 0.5);
    let coinIcon = this.game.make.image(this.keyIcon.width + 7, 0, 'icon:coin');

    this.hud = this.game.add.group();
    this.hud.add(coinIcon);
    this.hud.add(this.keyIcon);
    this.hud.position.set(10, 10);
    this.scoreText = this.game.add.text(this.keyIcon.width + 60, 16, 'x 0', { fontSize: '32px', fill: '#000' });
};

PlayState.update = function () {
  this._handleCollisions();
  this._handleInput();
  this.scoreText.text = 'x '+this.coinPickupCount;
  this.keyIcon.frame = this.hasKey ? 1 : 0;
};

PlayState._handleInput = function () {
    if (this.keys.left.isDown) {
        this.hero.move(-1);
    }
    else if (this.keys.right.isDown) {
        this.hero.move(1);
    }
    else {
        this.hero.move(0);
    }
    if (this.keys.up.isDown && this.hero.body.touching.down) {
      this.hero.jump();
    }
};

PlayState._handleCollisions = function () {
    this.game.physics.arcade.collide(this.hero, this.platforms);
    this.game.physics.arcade.collide(this.spiders, this.platforms);
    this.game.physics.arcade.collide(this.spiders, this.enemyWalls);

    this.game.physics.arcade.overlap(this.hero, this.coins, this._onHeroVsCoin, null, this);
    this.game.physics.arcade.overlap(this.hero, this.spiders, this._onHeroVsEnemy, null, this);
    this.game.physics.arcade.overlap(this.hero, this.key, this._onHeroVsKey, null, this)
    this.game.physics.arcade.overlap(this.hero, this.door, this._onHeroVsDoor, function (hero, door) {
            return this.hasKey && hero.body.touching.down;
        }, this);
};

PlayState._onHeroVsCoin = function (hero, coin) {
    coin.kill();
    this.coinPickupCount++;
};

PlayState._onHeroVsEnemy = function (hero, enemy) {
  if (hero.body.velocity.y > 0) {
      hero.bounce();
      enemy.die();
  }
  else {
      this.game.state.restart(true, false, {level: this.level});
  }
};

PlayState._onHeroVsKey = function (hero, key) {
    key.kill();
    this.hasKey = true;
};

PlayState._onHeroVsDoor = function (hero, door) {
    this.game.state.restart(true, false, { level: this.level + 1 });
};

window.onload = function () {
    let game = new Phaser.Game(960, 600, Phaser.AUTO, 'game');
    game.state.add('play', PlayState);
    game.state.start('play', true, false, {level: 3});
};
