A console-based implementation of a provably fair non-transitive dice game with cryptographic random number generation.


This game demonstrates the mathematical concept of non-transitivity using dice, where dice A might beat dice B, dice B might beat dice C, but dice C might beat dice A (similar to rock-paper-scissors). The game uses cryptographically secure random number generation with HMAC-SHA3 to ensure fairness and prevent cheating.



- **Provably Fair Random Generation**: Uses HMAC-SHA3 protocol for transparent randomness
- **Cryptographic Security**: 256-bit secure keys and uniform random distribution
- **Non-transitive Dice Logic**: Supports arbitrary dice configurations
- **Interactive Console Interface**: User-friendly command-line interaction
- **Probability Tables**: ASCII tables showing win probabilities for each dice pair
- **Comprehensive Error Handling**: Clear error messages for invalid inputs
- **Cross-platform Support**: Works on Windows, macOS, and Linux



### Prerequisites

- Node.js (version 14 or higher)
- npm (comes with Node.js)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/feruzboboqulov02/3.task.git


2. Install dependencies:
```bash
npm install
```

### Usage

Run the game with at least 3 dice (each dice must have exactly 6 comma-separated integers):

```bash
node index.js 2,2,4,4,9,9 6,8,1,1,8,6 7,5,3,7,5,3
```

#### Example Commands

**Basic example with 3 dice:**
```bash
node index.js 2,2,4,4,9,9 1,1,6,6,8,8 3,3,5,5,7,7
```

**Standard dice example:**
```bash
node index.js 1,2,3,4,5,6 1,2,3,4,5,6 1,2,3,4,5,6 1,2,3,4,5,6
```

**Testing with more dice:**
```bash
node index.js 1,1,1,1,1,1 2,2,2,2,2,2 3,3,3,3,3,3 4,4,4,4,4,4 5,5,5,5,5,5
```

##  How to Play

1. **First Move Determination**: The game uses fair random generation to determine who selects dice first
2. **Dice Selection**: Players alternately select different dice from available options
3. **Rolling Phase**: Both players make rolls using the fair random protocol
4. **Result**: The player with the higher roll wins

### During the Game

- Enter numbers `0-5` or `0-1` as prompted
- Type `?` for help (shows probability table)
- Type `X` to exit the game

### Fair Random Protocol

Each random generation follows this cryptographic protocol:
1. Computer generates a secret key and random number
2. Computer shows HMAC hash (commitment)
3. User selects their number
4. Computer reveals its number and key
5. Result = (computer_number + user_number) % range

This ensures neither party can cheat or predict the outcome.

##  Understanding Non-transitivity

The probability table shows win rates between dice pairs. Non-transitive dice can create situations like:
- Dice A beats Dice B (60% win rate)
- Dice B beats Dice C (60% win rate)  
- Dice C beats Dice A (60% win rate)

This creates a "rock-paper-scissors" effect with dice!



### Architecture

The code is organized into 9 main classes:
- `Dice`: Represents a single die with 6 faces
- `DiceParser`: Parses and validates command-line arguments
- `CryptoHelper`: Handles cryptographic operations
- `InputHelper`: Manages user input with readline
- `FairRandom`: Implements the fair random generation protocol
- `ProbabilityCalculator`: Calculates win probabilities between dice
- `TableRenderer`: Renders ASCII tables using cli-table3
- `UserInterface`: Handles dice selection interface
- `Game`: Main game logic and flow control

### Security Features

- **Cryptographically Secure Random Generation**: Uses `crypto.randomBytes()`
- **HMAC-SHA3**: Prevents tampering with random values
- **Uniform Distribution**: Proper rejection sampling eliminates bias
- **New Keys**: Fresh cryptographic key for each random generation

### Dependencies

- `cli-table3`: Professional ASCII table rendering
- `crypto`: Built-in Node.js cryptographic functions
- `readline`: Built-in Node.js input handling

## Error Handling

The game provides specific error messages for common issues:

**No arguments:**
```bash
node index.js
# Error: No dice provided. You need at least 3 dice.
```

**Too few dice:**
```bash
node index.js 1,2,3,4,5,6 2,3,4,5,6,7
# Error: Only 2 dice provided, but at least 3 dice are required.
```

**Wrong number of sides:**
```bash
node index.js 1,2,3,4,5 6,7,8,9,10,11 1,2,3,4,5,6
# Error: Dice 1 has 5 sides, but exactly 6 sides are required.
```

**Invalid values:**
```bash
node index.js 1,2,3,4,5,a 6,7,8,9,10,11 1,2,3,4,5,6
# Error: Non-integer value "a" found in dice 1.
```

##  Testing

Test the game with various scenarios:

1. **Valid inputs**: Different dice configurations
2. **Error cases**: Wrong number of arguments, invalid dice formats
3. **Help system**: Use `?` during gameplay to see probability tables
4. **Complete games**: Play through entire games to test all functionality


