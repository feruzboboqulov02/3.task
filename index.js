const crypto = require('crypto');
const readline = require('readline');
const Table = require('cli-table3');

// Класс для кубика
class Dice {
    constructor(faces) {
        this.faces = faces;
    }
    
    roll(index) {
        return this.faces[index];
    }
    
    toString() {
        return this.faces.join(',');
    }
}

// Парсинг кубиков из аргументов
class DiceParser {
    static parse(args) {
        if (args.length === 0) {
            throw new Error('No dice provided. You need at least 3 dice. Example: node game.js 2,2,4,4,9,9 6,8,1,1,8,6 7,5,3,7,5,3');
        }
        
        if (args.length < 3) {
            throw new Error(`Only ${args.length} dice provided, but at least 3 dice are required. Example: node game.js 2,2,4,4,9,9 6,8,1,1,8,6 7,5,3,7,5,3`);
        }

        let dice = [];
        for (let i = 0; i < args.length; i++) {
            let sides = args[i].split(',');
            
            if (sides.length !== 6) {
                throw new Error(`Dice ${i + 1} has ${sides.length} sides, but exactly 6 sides are required. Each dice must have format: 1,2,3,4,5,6`);
            }

            let faces = [];
            for (let j = 0; j < sides.length; j++) {
                let num = parseInt(sides[j]);
                if (isNaN(num)) {
                    throw new Error(`Non-integer value "${sides[j]}" found in dice ${i + 1}. All face values must be integers.`);
                }
                faces.push(num);
            }
            
            dice.push(new Dice(faces));
        }
        
        return dice;
    }
}

// Криптографические функции
class Crypto {
    static generateKey() {
        return crypto.randomBytes(32);
    }
    
    static randomNumber(min, max) {
        const range = max - min + 1;
        const limit = Math.floor(256 / range) * range;
        let value;
        do {
            value = crypto.randomBytes(1)[0];
        } while (value >= limit);
        return min + (value % range);
    }
    
    static hmac(key, message) {
        return crypto.createHmac('sha3-256', key).update(message.toString()).digest('hex').toUpperCase();
    }
}

// Честная генерация случайных чисел
class FairRandom {
    static async generate(min, max, prompt) {
        // Генерируем ключ и число компьютера
        let key = Crypto.generateKey();
        let computerNum = Crypto.randomNumber(min, max);
        
        // Показываем HMAC
        let hmac = Crypto.hmac(key, computerNum);
        console.log(`I selected a random value in the range ${min}..${max} (HMAC=${hmac}).`);
        
        // Получаем число пользователя
        let userNum = await this.getUserInput(min, max, prompt);
        
        // Показываем результат
        let result = (computerNum + userNum) % (max - min + 1);
        console.log(`My number is ${computerNum} (KEY=${key.toString('hex').toUpperCase()}).`);
        console.log(`The fair number generation result is ${computerNum} + ${userNum} = ${result} (mod ${max - min + 1}).`);
        
        return result;
    }
    
    static async getUserInput(min, max, prompt) {
        let rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        while (true) {
            console.log(`${prompt} modulo ${max - min + 1}.`);
            for (let i = min; i <= max; i++) {
                console.log(`${i} - ${i}`);
            }
            console.log('X - exit');
            console.log('? - help');

            let answer = await new Promise(resolve => {
                rl.question('Your selection: ', resolve);
            });

            if (answer.toLowerCase() === 'x') {
                rl.close();
                process.exit(0);
            }

            if (answer === '?') {
                rl.close();
                await Game.showHelp();
                rl = readline.createInterface({
                    input: process.stdin,
                    output: process.stdout
                });
                continue;
            }

            let num = parseInt(answer);
            if (!isNaN(num) && num >= min && num <= max) {
                rl.close();
                return num;
            }

            console.log('Invalid selection. Please try again.');
        }
    }
}

// Вычисление вероятностей
class ProbabilityCalculator {
    static calculate(dice1, dice2) {
        let wins = 0;
        for (let i = 0; i < 6; i++) {
            for (let j = 0; j < 6; j++) {
                if (dice1.roll(i) > dice2.roll(j)) {
                    wins++;
                }
            }
        }
        return wins / 36;
    }
}

// Отображение таблицы
class TableRenderer {
    static render(dice) {
        console.log('\nProbability of the win for the user:');
        
        let headers = ['User dice v'];
        for (let i = 0; i < dice.length; i++) {
            headers.push(dice[i].toString());
        }
        
        let table = new Table({
            head: headers,
            style: { head: ['cyan'], border: ['blue'] }
        });

        for (let i = 0; i < dice.length; i++) {
            let row = [dice[i].toString()];
            for (let j = 0; j < dice.length; j++) {
                if (i === j) {
                    row.push('.3333');
                } else {
                    let prob = ProbabilityCalculator.calculate(dice[i], dice[j]);
                    row.push(prob.toFixed(4));
                }
            }
            table.push(row);
        }

        console.log(table.toString());
        console.log();
    }
}

// Пользовательский интерфейс
class UserInterface {
    static async selectDice(dice, excludeIndex, message) {
        let rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        while (true) {
            console.log(message);
            for (let i = 0; i < dice.length; i++) {
                if (i !== excludeIndex) {
                    console.log(`${i} - ${dice[i].toString()}`);
                }
            }
            console.log('X - exit');
            console.log('? - help');

            let answer = await new Promise(resolve => {
                rl.question('Your selection: ', resolve);
            });

            if (answer.toLowerCase() === 'x') {
                rl.close();
                process.exit(0);
            }

            if (answer === '?') {
                rl.close();
                await Game.showHelp();
                rl = readline.createInterface({
                    input: process.stdin,
                    output: process.stdout
                });
                continue;
            }

            let index = parseInt(answer);
            if (!isNaN(index) && index >= 0 && index < dice.length && index !== excludeIndex) {
                rl.close();
                return index;
            }

            console.log('Invalid selection. Please try again.');
        }
    }
}

// Основная игра
class Game {
    constructor(dice) {
        this.dice = dice;
    }

    async play() {
        console.log("Let's determine who makes the first move.");
        
        // Определяем кто ходит первым
        let firstMove = await FairRandom.generate(0, 1, 'Try to guess my selection');
        let computerFirst = (firstMove === 1);
        
        let computerDice, userDice;

        if (computerFirst) {
            console.log('I make the first move and choose the dice.');
            computerDice = Crypto.randomNumber(0, this.dice.length - 1);
            console.log(`I choose the [${this.dice[computerDice].toString()}] dice.`);
            
            userDice = await UserInterface.selectDice(this.dice, computerDice, 'Choose your dice:');
            console.log(`You choose the [${this.dice[userDice].toString()}] dice.`);
        } else {
            console.log('You make the first move and choose the dice.');
            userDice = await UserInterface.selectDice(this.dice, -1, 'Choose your dice:');
            console.log(`You choose the [${this.dice[userDice].toString()}] dice.`);
            
            computerDice = Crypto.randomNumber(0, this.dice.length - 1);
            while (computerDice === userDice) {
                computerDice = Crypto.randomNumber(0, this.dice.length - 1);
            }
            console.log(`I choose the [${this.dice[computerDice].toString()}] dice.`);
        }

        // Бросок компьютера
        console.log("It's time for my roll.");
        let computerRollIndex = await FairRandom.generate(0, 5, 'Add your number');
        let computerRoll = this.dice[computerDice].roll(computerRollIndex);
        console.log(`My roll result is ${computerRoll}.`);

        // Бросок пользователя
        console.log("It's time for your roll.");
        let userRollIndex = await FairRandom.generate(0, 5, 'Add your number');
        let userRoll = this.dice[userDice].roll(userRollIndex);
        console.log(`Your roll result is ${userRoll}.`);

        // Результат
        if (userRoll > computerRoll) {
            console.log(`You win (${userRoll} > ${computerRoll})!`);
        } else if (computerRoll > userRoll) {
            console.log(`You lose (${computerRoll} > ${userRoll})!`);
        } else {
            console.log(`It's a tie (${userRoll} = ${computerRoll})!`);
        }
    }

    static async showHelp() {
        if (Game.currentGame) {
            TableRenderer.render(Game.currentGame.dice);
        } else {
            console.log('Help is available during the game.');
        }
    }
}

// Главная функция
async function main() {
    try {
        let args = process.argv.slice(2);
        let dice = DiceParser.parse(args);
        
        let game = new Game(dice);
        Game.currentGame = game;
        
        await game.play();
    } catch (error) {
        console.error(`Error: ${error.message}`);
        console.log('\nExample: node index.js 2,2,4,4,9,9 6,8,1,1,8,6 7,5,3,7,5,3');
        process.exit(1);
    }
}

main();