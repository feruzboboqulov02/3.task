const crypto = require('crypto');
const Table = require('cli-table3');
const readline = require('readline');

class Dice {
    constructor(faces) {
        if (!Array.isArray(faces) || faces.length !== 6 || !faces.every(Number.isInteger)) {
            throw new Error('Dice must have exactly 6 integer faces');
        }
        this.faces = faces;
    }
    getFace(i) { return this.faces[i]; }
    toString() { return this.faces.join(','); }
}

class DiceParser {
    static parse(args) {
        if (args.length < 3) throw new Error('At least 3 dice required. Example: node game.js 2,2,4,4,9,9 6,8,1,1,8,6 7,5,3,7,5,3');
        return args.map((arg, i) => {
            const faces = arg.split(',').map(f => {
                const n = parseInt(f.trim());
                if (isNaN(n)) throw new Error(`Invalid number in dice ${i + 1}: ${f}`);
                return n;
            });
            if (faces.length !== 6) throw new Error(`Dice ${i + 1} must have 6 faces, got ${faces.length}`);
            return new Dice(faces);
        });
    }
}

class CryptoHelper {
    static generateKey() { return crypto.randomBytes(32); }
    static generateNumber(min, max) {
        const range = max - min + 1;
        let val;
        do { val = crypto.randomBytes(4).readUInt32BE(0); } 
        while (val >= Math.floor(0x100000000 / range) * range);
        return (val % range) + min;
    }
    static hmac(key, msg) { return crypto.createHmac('sha3-256', key).update(msg.toString()).digest('hex').toUpperCase(); }
}

// Fixed input helper using readline with promises
class InputHelper {
    static async question(prompt) {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        
        return new Promise((resolve) => {
            rl.question(prompt, (answer) => {
                rl.close();
                resolve(answer.trim());
            });
        });
    }
}

class FairRandom {
    static async generate(min, max, prompt = 'Add your number') {
        // CRITICAL: Generate NEW key for each HMAC calculation
        const key = CryptoHelper.generateKey();
        const computerNum = CryptoHelper.generateNumber(min, max);
        const hmac = CryptoHelper.hmac(key, computerNum);
        
        console.log(`I selected a random value in the range ${min}..${max} (HMAC=${hmac}).`);
        
        const userNum = await this.getInput(min, max, prompt);
        const result = (computerNum + userNum) % (max - min + 1);
        
        console.log(`My number is ${computerNum} (KEY=${key.toString('hex').toUpperCase()}).`);
        console.log(`The fair number generation result is ${computerNum} + ${userNum} = ${result} (mod ${max - min + 1}).`);
        
        return result;
    }

    static async getInput(min, max, prompt) {
        while (true) {
            console.log(`${prompt} modulo ${max - min + 1}.`);
            for (let i = min; i <= max; i++) console.log(`${i} - ${i}`);
            console.log('X - exit\n? - help');

            const answer = await InputHelper.question('Your selection: ');
            
            if (answer.toLowerCase() === 'x') process.exit(0);
            if (answer === '?') { await Game.showHelp(); continue; }
            
            const num = parseInt(answer);
            if (!isNaN(num) && num >= min && num <= max) return num;
            
            console.log('Invalid selection. Please try again.');
        }
    }
}

class ProbabilityCalculator {
    // Using "somebody already did it" approach with array methods
    static calculate(dice1, dice2) {
        return dice1.faces.reduce((wins, x) => 
            wins + dice2.faces.reduce((count, y) => count + (x > y ? 1 : 0), 0), 0
        ) / (dice1.faces.length * dice2.faces.length);
    }

    static calculateAll(dice) {
        return dice.map((d1, i) => 
            dice.map((d2, j) => i === j ? null : this.calculate(d1, d2))
        );
    }
}

class TableRenderer {
    static render(dice, probs) {
        console.log('\nProbability of the win for the user:');
        const table = new Table({
            head: ['User dice v', ...dice.map(d => d.toString())],
            style: { head: ['cyan'], border: ['blue'] }
        });
        
        dice.forEach((d, i) => {
            table.push([d.toString(), ...probs[i].map(p => p === null ? '.3333' : p.toFixed(4))]);
        });
        
        console.log(table.toString() + '\n');
    }
}

class UserInterface {
    static async selectDice(dice, exclude = -1, msg = 'Choose your dice:') {
        while (true) {
            console.log(msg);
            dice.forEach((d, i) => { if (i !== exclude) console.log(`${i} - ${d}`); });
            console.log('X - exit\n? - help');

            const answer = await InputHelper.question('Your selection: ');
            
            if (answer.toLowerCase() === 'x') process.exit(0);
            if (answer === '?') { await Game.showHelp(); continue; }
            
            const idx = parseInt(answer);
            if (!isNaN(idx) && idx >= 0 && idx < dice.length && idx !== exclude) return idx;
            
            console.log('Invalid selection. Please try again.');
        }
    }
}

class Game {
    constructor(dice) {
        this.dice = dice;
        this.probs = ProbabilityCalculator.calculateAll(dice);
    }

    async play() {
        console.log("Let's determine who makes the first move.");
        // Each fair random generation uses a NEW key
        const first = await FairRandom.generate(0, 1, 'Try to guess my selection') === 1;
        
        let compIdx, userIdx;
        
        if (first) {
            console.log('I make the first move and choose the dice.');
            compIdx = CryptoHelper.generateNumber(0, this.dice.length - 1);
            console.log(`I choose the [${this.dice[compIdx]}] dice.`);
            userIdx = await UserInterface.selectDice(this.dice, compIdx);
            console.log(`You choose the [${this.dice[userIdx]}] dice.`);
        } else {
            console.log('You make the first move and choose the dice.');
            userIdx = await UserInterface.selectDice(this.dice);
            console.log(`You choose the [${this.dice[userIdx]}] dice.`);
            do { compIdx = CryptoHelper.generateNumber(0, this.dice.length - 1); } 
            while (compIdx === userIdx);
            console.log(`I choose the [${this.dice[compIdx]}] dice.`);
        }

        console.log("It's time for my roll.");
        // NEW key for computer's roll
        const compRoll = this.dice[compIdx].getFace(await FairRandom.generate(0, 5, 'Add your number'));
        console.log(`My roll result is ${compRoll}.`);

        console.log("It's time for your roll.");
        // NEW key for user's roll  
        const userRoll = this.dice[userIdx].getFace(await FairRandom.generate(0, 5, 'Add your number'));
        console.log(`Your roll result is ${userRoll}.`);

        console.log(userRoll > compRoll ? `You win (${userRoll} > ${compRoll})!` :
                   compRoll > userRoll ? `You lose (${compRoll} > ${userRoll})!` :
                   `It's a tie (${userRoll} = ${compRoll})!`);
    }

    static async showHelp() {
        if (Game.current) TableRenderer.render(Game.current.dice, Game.current.probs);
        else console.log('Help is available during the game.');
    }
}

async function main() {
    try {
        const dice = DiceParser.parse(process.argv.slice(2));
        const game = new Game(dice);
        Game.current = game;
        await game.play();
    } catch (error) {
        console.error(`Error: ${error.message}`);
        console.log('\nExample: node game.js 2,2,4,4,9,9 6,8,1,1,8,6 7,5,3,7,5,3');
        console.log('Install: npm install cli-table3');
        process.exit(1);
    }
}

if (require.main === module) main();