const state = {
    health: 100,
    strength: 10,
    level: 1,
    baseStats: {
        health: 100,
        strength: 10,
    },
    player: "Игрок",
    location: "village",
    message: "",
    combatTurn: "player",
    isDead: false,
    inCombat: false,
    inAltar: false,
    currentEnemy: null,
    currentAltar: null,
    playerDefending: false,
    xp: 0,
    nextLevel: 20,
    inventory: [],
    equipped: {
        weapon: null,
    },
    eated: false,
    nextAttackBonus: 0,
};

state.player = {
    name: "Игрок",
    x : 0,
    y : 0
};

const enemies = {
    goblin: {
        name: "Гоблин",
        baseHealth: 30,
        baseDamage: 10,
    },
    wolf: {
        name: "Волк",
        baseHealth: 20,
        baseDamage: 15,
    },
    ogre: {
        name: "Огр",
        baseHealth: 60,
        baseDamage: 20,
    },
    witch: {
        name: "Ведьма",
        baseHealth: 30,
        baseDamage: 20,
    }
};

function createEmpty() {
    return {
        type: "empty",
        visited: false,
        interact(state) {
            if (!this.visited) {
                state.message = "Ты ничего не нашел.";
                this.visited = true;
            } else {
                state.message = "Ты уже был здесь.";
            }
        }
    };
};

function createEnemy(type = "goblin") {

    const template = enemies[type];

    return {
        type: "enemy",
        enemyType: type,
        visited: false,
        health: template.baseHealth + (Math.floor(Math.random() * 10)),
        damage: template.baseDamage,

        interact(state) {
            if (!this.visited) {
                state.inCombat = true;
                state.currentEnemy = this;
                state.message = "Ты встретил врага!" + template.name + "!";
            } else {
                state.message = "Ты уже победил этого врага.";
            }
        }
    };
};

function enemyTurn() {
    const enemy = state.currentEnemy;

    let damage = enemy.damage + Math.floor(Math.random() * 4);

    if (state.playerDefending) {
        damage = Math.floor(damage / 2);
        state.playerDefending = false;
    };

    state.health -= damage;
    state.message = "Враг атакует и наносит" + damage;

    if (state.health < 0) {
        state.health = 0;
        render();
        return;
    };

    state.combatTurn = "player";
    render();
};

function createChest() {
    return {
        type: "chest",
        visited: false,
        interact(state) {
            if (this.visited) {
                state.message = "Здесь уже пустой сундук.";
                return;
            };

            this.visited = true;

            const item = getRandomItemFromChest();

            if (!item) {
                state.message = "Ты открыл сундук, но он оказался пуст."
                return;
            }

            addItemToInventory(item);
        }
    };
};

function createTrap() {
    return {
        type: "trap",
        visited: false,
        interact(state) {
            state.health -= 15;
            state.message = "Ты попал в ловушку!"
        }
    };
};

function createAltar() {
    return {
        type: "altar",
        visited: false,
        interact(state) {
            if (this.visited) {
                state.message = "Алтарь потух.";
                return;
            }

            state.inAltar = true;
            state.currentAltar = this;
        }
    }
};

const sword = {
    id: "sword",
    name: "Меч",
    type: "weapon",
    damage: 5,
};

const spear = {
    id: "spear",
    name: "Копье",
    type: "weapon",
    damage: 7,
};

const longSword = {
    id: "longSword",
    name: "Длинный Меч",
    type: "weapon",
    damage: 10,
};

let weapons = [sword, spear, longSword];

const apple = {
    id: "apple",
    name: "Яблоко",
    type: "food",
    health: 3,
}; 

const carrot = {
    id: "carrot",
    name: "Морковь",
    type: "food",
    health: 3,
};

const watermelon = {
    id: "watermelon",
    name: "Арбуз",
    type: "food",
    health: 5,
}

let foodItems = [apple, carrot, watermelon];

function addItemToInventory(item) {
    state.inventory.push(item);
    state.message = "Ты получил: " + item.name;
};

function removeItemFromInventory(item) {
    const index = state.inventory.indexOf(item);
    if (index !== -1) {
        state.inventory.splice(index, 1);
    };
};

function equipItem(item) {
    if (item.type !== "weapon") return;

    if (state.equipped.weapon) {
        state.inventory.push(state.equipped.weapon);
    };
        

    state.equipped.weapon = item;
    removeItemFromInventory(item);

    state.message = "Ты экипировал: " + item.name;
    render();
};

function eatItem(item) {
    if (item.type !== "food") return;

    state.health += item.health;

    if (state.health > state.baseStats.health) {
        state.health = state.baseStats.health;
    };

    removeItemFromInventory(item);

    state.message = "Ты скушал: " + item.name + "и восстановил здоровье.";
    render();
};

function createCell(type) {
    if (type === "empty") return createEmpty();
    if (type === "enemy") return createEnemy();
    if (type === "chest") return createChest();
    if (type === "trap") return createTrap();
    if (type === "altar") return createAltar()
};

function createLevelUp() {
    state.level++;
    state.baseStats.health += 5;
    state.baseStats.strength += 5;

    state.health = state.baseStats.health;
    state.strength = state.baseStats.strength;
    return;
};

function expLevel() {
    if (state.xp >= state.nextLevel) {
        state.level++;
        state.xp = 0;
    };
};

let map = generateMap(30, 30);
map[0][0] = createEmpty();

function generateMap(width, height) {
    const newMap = [];
    const enemyTypes = ["goblin", "wolf", "ogre", "witch"];
    const randomType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];

    for (let y = 0; y < height; y++) {
        const row = [];


        for (let x = 0; x < width; x++) {
            const r = Math.random();

            if (r < 0.05) row.push(createCell("trap"));
            else if (r < 0.15) row.push(createCell("chest"));
            else if (r < 0.20) row.push(createAltar("altar"));
            else if (r < 0.35) {
                const type = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
                row.push(createEnemy(type));
            }
            else row.push(createCell("empty"));
            
        }

        newMap.push(row);
    }

    return newMap;
};
                               
const scene = document.getElementById("scene");
const choices = document.getElementById("choices");
const message = document.getElementById("message");

const locations = {
    village: {
        text: "Ты находишься в деревне.",
        choices: [
            {
                text: "Пойти в лес",
                action: () => {
                    state.location = "forest";
                }
            },
            {
                text: "Пойти в таверну",
                action: () => {
                    state.location = "tavern";
                }
            }    
        ]
    },

    forest: {
        text: "Ты находишься в лесу.",
        choices: [
            {
                text: "Вернуться в деревню",
                action: () => {
                    state.location = "village";
                }
            },
            {
                text: "Пойти глубже в лес",
                action: () => {
                    state.location = "deepForest";
                }
            },
            {
                text: "Осмотреться",
                action: () => {
                    if (Math.random() < 0.5) {
                        state.health -= 10;
                        state.message = "Ты наткнулся на ловушку и потерял 10 здоровья!";
                        if (state.health < 0) {
                            state.health = 0;
                        }
                    }
                    else {
                        state.message = "Ничего не произошло.";
                    }
                }
            }
        ]      
    },

    deepForest: {
        text: "Ты находишься в глубоком лесу.",
        choices: [
            {
                text: "Вернуться в лес",
                action: () => {
                    state.location = "forest";
                }
            },
        ],       
    },

    tavern: {
        text: "Ты находишься в таверне.",
        choices: [
            {
                text: "Вернуться в деревню",
                action: () => {
                    state.location = "village";
                }
            },
            {
                text: "Жестко выпить",
                action: () => {
                    state.health += 10;
                    state.strength -= 1;
                    state.message = "Ты выпил слишком много и потерял 1 силу, но получил 10 здоровья!";
                    if (state.health > 100) {
                        state.health = 100;
                    }
                    if (state.strength < 0) {
                        state.strength = 0;
                    }
                }
            },
            {
                text: "Сохранить игру",
                action: () => {
                    saveGame();
                }
            },
            {
                text: "Загрузить игру",
                action: () => {
                    loadGame();
                }
            }
        ]
    },

    city: {
        text: "Ты находишься в городе.",
        choices: [
            {
                text: "Вернуться в глубокий лес",
                action: () => {
                    state.location = "deepForest";
                }
            },
            {
                text: "Прогуляться по городу",
                action: () => {
                    state.location = "deepCity";
                }
            },
        ],
    },

    deepCity: {
        text: "Ты находишься на опасных улицах",
        choices: [
            {
                text: "Вернуться на безопасные улицы",
                action: () => {
                    state.location = "city";
                }
            }
        ]
    }
};

function renderMap() {

    if (state.inCombat) {
        scene.textContent = "Ты в бою с врагом!" + "Здоровье врага: " + state.currentEnemy.health;
        choices.innerHTML = "";
        if (state.combatTurn === "player") {
            addChoice("Аттаковать", attack);
            addChoice("Защищаться", defend);
        };
        if (state.combatTurn === "enemy") {
            setTimeout(enemyTurn, 500);
        };
        return;
    };

    if (state.inAltar) {
        scene.textContent = "Ты находишься у алтаря";
        choices.innerHTML = "";
        addChoice("Помолиться", pray); 
        addChoice("Принести жертву", sacrifice);
        return;
    };

    if (state.location === "deepForest") {
        scene.textContent = "Ты в глубоком лесу. Координаты: " + state.player.x + ", " + state.player.y;
        if (state.player.x === 0 && state.player.y === 0) {
            addChoice("Вернуться в лес", () => {
                state.location = "forest";
                render();
                }
            )
        };
        if (state.player.x === 20 && state.player.y === 20) {
            addChoice("Войти в город", () => {
                state.location = "city";
                render();
                }
            )
        };

        choices.innerHTML = "";

        addChoice("Вверх", () => move(0, -1));
        addChoice("Вниз", () => move(0, 1));
        addChoice("Влево", () => move(-1, 0));
        addChoice("Вправо", () => move(1, 0));

    };

    if (state.location === "deepCity") {
        scene.textContent = "Ты на городских улицах. Координаты: " + state.player.x + ", " + state.player.y;
        if (state.player.x === 0 && state.player.y === 0) {
            addChoice("Вернуться на безопасные улицы", () => {
                state.location = "city";
                render();
                }
            )
        };

        choices.innerHTML = "";

        addChoice("Вверх", () => move(0, -1));
        addChoice("Вниз", () => move(0, 1));
        addChoice("Влево", () => move(-1, 0));
        addChoice("Вправо", () => move(1, 0));

    };
}; // Здесь описывается deepforest

function move(dx, dy) {
    if (state.inCombat) {
        state.message = "Ты не можешь двигаться, пока в бою!";
        render();
        return;
    };

    if (state.inAltar) {
        state.message = "Ты должен сделать выбор";
        render();
        return;
    }

    const newX = state.player.x + dx;
    const newY = state.player.y + dy;

    if (
        newX < 0 ||
        newY < 0 ||
        newY >= map.length ||
        newX >= map[newY].length
    ) {
        state.message = "Ты не можешь идти в этом направлении!";
        render();
        return;
    }

    state.player.x = newX;
    state.player.y = newY;

    const cell = map[newY][newX];
    cell.interact(state);

    render();
};

function applyNextAttackBuff() {
    state.nextAttackBonus = 0.5;
    state.message = "Твоя следущая атака усилена!";
    render();
};

function eatedFood() {
    state.eated = true;
    state.message = "Ты покушал и восстановил здоровье!";
    render();
}

function attack() {
    const enemy = state.currentEnemy;

    let damage = state.strength;

    if (state.nextAttackBonus > 0) {
        damage = Math.floor(damage * (1 + state.nextAttackBonus));
        state.nextAttackBonus = 0;
    };

    enemy.health -= damage;
    state.message = "Ты атаковал врага и нанес " + damage + " урона!";

    if (enemy.health <= 0) {
        state.xp += 10;
        expLevel();
        state.message += " Ты победил врага!";
        enemy.visited = true;
        state.inCombat = false;
        state.currentEnemy = null;
        render();
        return;
    }

    if (state.health < 0) state.health = 0;

    state.combatTurn = "enemy";

    render();
};

function defend() {
    state.playerDefending = true;
    state.message = "Ты приготовился защищаться.";
    state.combatTurn = "enemy";
    render();
};

function leaveAltar() {
    state.currentAltar.visited = true;
    state.currentAltar = null;
    state.inAltar = false;
};

function pray() {
    if (Math.random() < 0.5) {
        state.xp += 5;
        state.message = "Боги с тобой!";
    } else {
        state.message = "Бесполезно.";
    };

    leaveAltar();
    render();
};

function sacrifice() {
    state.health -= 10;
    state.strength += 5;
    state.message = "Ты принес жертву богам.";

    leaveAltar();
    render();
};
    
function getRandomItemFromChest() {
    const chance = Math.random();

    if (chance < 0.5) {
        return null
    };

    if (chance < 0.8) {
        const randomFoodIndex = Math.floor(Math.random() * foodItems.length);
        return foodItems[randomFoodIndex];
    };

    const randomWeaponIndex = Math.floor(Math.random() * weapons.length);
    return weapons[randomWeaponIndex];
};

function render() {
    if (state.health <= 0) {
        state.isDead = true;
    }

    if (state.isDead) {
        scene.textContent = "Ты мертв. Игра окончена.";
        state.message = "";
        message.textContent = state.message;

        choices.innerHTML = "";
        addChoice("Начать заново", resetGame);

        return;
    };

    message.textContent = state.message;

    healthValue.textContent = state.health;
    strengthValue.textContent = state.strength;
    levelValue.textContent = state.level;
    expValue.textContent = state.xp;


    const currentLocation = locations[state.location];
    if (!currentLocation) {
        console.error(`Локация ${state.location} не найдена!`);
        return;
    };

    if (state.location === "deepForest") {
    renderMap();
    return;
    };  // Здесь располжен deepforest

    scene.textContent = currentLocation.text;
    choices.innerHTML = "";

    currentLocation.choices.forEach(choice => {
        addChoice(choice.text, () => {
            state.message = "";
            choice.action();
            render();
        });
    });
};

function openInventory() {
    scene.textContent = "Инвентарь";
    choices.innerHTML = "";

    if (state.inventory.length === 0) {
        scene.textContent += "\nПусто";
        addChoice("Назад", render);
        return;
    }

    state.inventory.forEach(item => {
        if (item.type === "weapon") {
            addChoice("Экипировать:" + item.name, () => equipItem(item));
        }

        if (item.type === "food") {
        addChoice("Съесть:" + item.name, () => eatItem(item));
    }
    });

    addChoice("Назад", render);
};

function saveGame() {
    const saveData = {
        state: {
            health: state.health,
            strength: state.strength,
            level: state.level,
            location: state.location,
            isDead: state.isDead,
            inCombat: state.inCombat,
            player: state.player,
            enemyType: cell.enemyType
        },
        map: map.map(row =>
            row.map(cell => ({
                type: cell.type,
                visited: cell.visited,
                health: cell.health || null,
            }))
        )
    };

    localStorage.setItem("rpgSave", JSON.stringify(saveData));
    state.message = "Игра сохранена!";
    render();
};

function loadGame() {
    const save = localStorage.getItem("rpgSave");
    if (!save) {
        state.message = "Нет сохраненной игры!";
        render();
        return;
    }

    const saveData = JSON.parse(save);

    Object.assign(state, saveData.state);

    for (let y = 0; y < saveData.map.length; y++) {
        for (let x = 0; x < saveData.map[y].length; x++) {
            const cellData = saveData.map[y][x];

            let newCell;

            if (cellData.type === "enemy") {
                newCell = createEnemy();
                newCell.health = cellData.health;
            }
            else if (cellData.type === "chest") {
                newCell = createChest();
            }
            else {
                newCell = createEmpty();
            }

            newCell.visited = cellData.visited;
            newCell = createEnemy(cellData.enemyType);
            map[y][x] = newCell;
        }
    }

    state.message = "Игра загружена!";
    render();
};

function resetGame() {
    state.level = 1;
    state.location = "village";
    state.isDead = false;
    state.inCombat = false;
    state.currentEnemy = null;
    state.currentAltar = null;
    state.combatTurn = "player";
    state.playerDefending = false;
    state.xp = 0;

    state.player.x = 0;
    state.player.y = 0;

    map = generateMap(30,30);
    map[0][0] = createEmpty();

    state.health = state.baseStats.health;
    state.strength = state.baseStats.strength;

    render();
};

const invButton = document.querySelector("#inventory");
invButton.addEventListener("click", openInventory);

function addChoice(text, handler) {
    const button = document.createElement("button");
    button.textContent = text;
    button.addEventListener("click", handler);
    choices.appendChild(button);
};

render();

