let canvas = document.getElementById("gameCanvas");
let ctx = canvas.getContext("2d");
// 显示阳光点数
let sunPointsSpan = document.getElementById("sunPoints");
//统计打死僵尸数量
let countBitZombie = 0;
// 游戏时间限制
let gameTimeLimit = 200; // 限制时间（秒）
let timeLeft = gameTimeLimit; // 剩余时间
let timeLeftSpan = document.getElementById("timeLeft"); // 显示剩余时间的span元素
//定时器句柄
let timeLeftInterval = null;
let genZombieInterval = null;
//按钮
const startButton = document.getElementById("startButton");
const pauseButton = document.getElementById("pauseButton");
const resumeButton = document.getElementById("resumeButton");
const endButton = document.getElementById("endButton");

// 资源加载
let resources = {
  zombie: './img/zombie.png',
  pea: './img/bullet.png',
  sun: './img/sun.png',
  background: './img/bg.jpg',
  peaShooter: './img/shooter.png',
};

//加载图片资源
let images = {};
let totalResources = Object.keys(resources).length;
let numResourcesLoaded = 0;
for (let key in resources) {
  images[key] = new Image();
  images[key].onload = () => numResourcesLoaded++;
  images[key].src = resources[key];
}

// 游戏状态
let gameState = "loading";
let sunPoints = 25;
let plants = [];
let zombies = [];
let projectiles = [];
let lastSunSpawnTime = new Date().getTime();

// 植物类
class Plant {
  lastShotTime = new Date().getTime();
  health = 80;
  width = 50;
  height = 50;
  constructor(x, y, image) {
    this.x = x;
    this.y = y;
    this.image = image;
  }
  drawLifeCount() {
    ctx.fillStyle = 'white';
    ctx.fillRect(this.x, this.y + this.height, this.width, 16);
    ctx.beginPath();
    ctx.fillStyle = 'red';
    ctx.font = "11px serif";
    ctx.fillText(`子弹:${this.health}发`, this.x, this.y + this.height + 10);
  }
  draw(w, h) {
    ctx.drawImage(this.image, this.x, this.y, w || this.width, h || this.height);
  }
  update() {
    // 每1.5秒生成一个子弹
    if (new Date().getTime() - this.lastShotTime > 1500) {
      let projectile = new Projectile(this.x + this.width, this.y + this.height / 2.5, images.pea);
      projectiles.push(projectile);
      this.lastShotTime = new Date().getTime();
      this.health -= 1;//每颗植物有50发弹量；
    }
  }
  //判断是否碰撞
  collidesWith(obj) {
    let boolX = this.x + this.width > obj.x;
    let boolY = this.y + this.height > obj.y;
    return boolX && boolY && this.y < obj.y + obj.height;
  }
}

// 豌豆射手类
class PeaShooter extends Plant {
  constructor(x, y, image) {
    super(x, y, image);
  }
  draw() {
    super.draw()
    super.drawLifeCount()
  }
}

// 子弹类
class Projectile extends Plant {
  speed = 5;
  constructor(x, y, image) {
    super(x, y, image);
    this.width = 60;
    this.height = 20;
  }
  update() {
    this.x += this.speed;
  }

  handleCollision(obj) {
    obj.health -= 25;
    let index = projectiles.indexOf(this);
    if (index !== -1) {
      projectiles.splice(index, 1);
    }
  }
}

// 僵尸类
class Zombie extends Plant {
  width = 80;
  height = 80;
  health = 100;
  speed = 1;
  constructor(x, y, image) {
    super(x, y, image);
  }
  update() {
    this.x -= this.speed;
  }
}

// 太阳类
class Sun extends Plant {
  width = 50;
  height = 50;
  pointValue = 25;
  constructor(x, y, image) {
    super(x, y, image);
  }
  update() {
    this.y += 2;
  }
  //检测点击太阳边界
  containsPoint(x, y) {
    return x >= this.x && x < this.x + this.width && y >= this.y && y < this.y + this.height;
  }
}


// 游戏循环
function gameLoop() {
  if (gameState === "playing") {
    ctx.drawImage(images.background, 0, 0);// 绘制背景
    plants.forEach((item) => item.draw());// 绘制植物
    zombies.forEach((item) => item.draw());// 绘制僵尸
    projectiles.forEach((item) => item.draw());// 绘制子弹

    // 2秒生成一个可收集的太阳
    if (new Date().getTime() - lastSunSpawnTime > 2000) {
      let x = Math.floor(Math.random() * (canvas.width - 100));
      let y = -100;
      let sun = new Sun(x, y, images.sun);
      plants.push(sun);
      lastSunSpawnTime = new Date().getTime();
    }

    updateGame(); // 更新游戏状态
  }

  // 循环调用gameLoop函数
  requestAnimationFrame(gameLoop);
}

//设置按钮是否可以按
function setButtonDisable(boolStart, boolPause, boolResume, boolEnd) {
  startButton.disabled = boolStart;
  pauseButton.disabled = boolPause;
  resumeButton.disabled = boolResume;
  endButton.disabled = boolEnd;
}

// 游戏开始
function startGame() {
  gameState = "playing";
  // 每秒调用updateTimeLeft函数
  timeLeftInterval = setInterval(updateTimeLeft, 1000);
  // 创建植物
  let peaShooter = new PeaShooter(100, 100, images.peaShooter);
  plants.push(peaShooter);
  setButtonDisable(true, false, true, false)
}

// 游戏暂停
function pauseGame() {
  gameState = "paused";
  setButtonDisable(true, true, false, false)
}

// 游戏继续
function resumeGame() {
  gameState = "playing";
  setButtonDisable(true, false, true, false)
}

// 游戏结束
function endGame() {
  gameState = "gameover";
  setButtonDisable(true, true, true, true);
  clearInterval(timeLeftInterval);
  clearInterval(genZombieInterval);
  alert("游戏结束");
}

// 更新剩余时间
function updateTimeLeft() {
  timeLeft--;
  timeLeftSpan.innerText = timeLeft;
  if (timeLeft <= 0) {
    clearInterval(timeLeftInterval)
    endGame();
  }
}

// 初始化按钮状态
function initButtons() {
  setButtonDisable(true, true, true, true)
  // 等待资源加载完成
  let intervalId = setInterval(function () {
    if (numResourcesLoaded === totalResources) {
      clearInterval(intervalId);
      startButton.disabled = false;
    }
  }, 100);
}

// 更新游戏状态
function updateGame() {
  plants.forEach(item => item.update());// 更新植物
  zombies.forEach(item => item.update());// 更新僵尸
  projectiles.forEach(item => item.update());// 更新子弹

  // 子弹和僵尸检测碰撞
  try {
    projectiles.forEach(PTITEM => {
      zombies.forEach(ZItem => PTITEM.collidesWith(ZItem) && PTITEM.handleCollision(ZItem));
    });
  } catch (err) {
    console.log(err)
  }

  // 移除死亡的植物
  plants.forEach((item, idx) => { item.health <= 0 && plants.splice(idx, 1); })
  // 移除死亡的僵尸
  zombies.forEach((item, idx) => {
    if (item.health <= 0) {
      zombies.splice(idx, 1);
      countBitZombie++
      document.getElementById('countBitZombie').innerText = countBitZombie;
    }
  })
  // 移除超出边界的子弹
  projectiles.forEach((item, idx) => item.health <= 0 && projectiles.splice(idx, 1));
}

// 生成僵尸
genZombieInterval = setInterval(function () {
  if (gameState === "playing") {
    let x = canvas.width;
    let y = Math.floor(Math.random() * (canvas.height - 100));
    let zombie = new Zombie(x, y, images.zombie);
    zombies.push(zombie);
  }
}, 3000);

// 鼠标点击事件处理函数
canvas.addEventListener("click", function (event) {
  let x = event.offsetX;
  let y = event.offsetY;
  if (gameState === "playing") {
    // 创建豌豆射手
    if (sunPoints >= 100 && x >= 50 && x <= 600 && y >= 50 && y <= 800) {
      let peaShooter = new PeaShooter(x, y, images.peaShooter);
      plants.push(peaShooter);
      sunPoints -= 100;
      sunPointsSpan.innerText = sunPoints;
    }

    // 点击收集太阳
    for (let i = plants.length - 1; i >= 0; i--) {
      if (plants[i] instanceof Sun && plants[i].containsPoint(x, y)) {
        sunPoints += plants[i].pointValue;
        sunPointsSpan.innerText = sunPoints;
        plants.splice(i, 1);
        break;
      }
    }
  }
});

// 开始游戏循环
gameLoop();
// 初始化按钮状态
initButtons();
