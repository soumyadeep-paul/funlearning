// Math Logic and Difficulty Progression

const MathLogic = {
    generateEquation(level) {
        const operations = ['+', '-', '*', '/'];
        let op;

        // Steeper introduction of operations
        if (level === 1) {
            op = '+';
        } else if (level === 2) {
            op = Math.random() > 0.5 ? '+' : '-';
        } else if (level === 3) {
            op = ['+', '-', '*'][Math.floor(Math.random() * 3)];
        } else {
            op = operations[Math.floor(Math.random() * 4)];
        }

        let num1, num2, answer;
        // Aggressive number scaling
        const maxNum = 10 + (level * 5);

        switch (op) {
            case '+':
                num1 = Math.floor(Math.random() * maxNum);
                num2 = Math.floor(Math.random() * maxNum);
                answer = num1 + num2;
                break;
            case '-':
                num1 = Math.floor(Math.random() * maxNum) + 1;
                num2 = Math.floor(Math.random() * num1);
                answer = num1 - num2;
                break;
            case '*':
                const maxMul = 5 + level;
                num1 = Math.floor(Math.random() * maxMul);
                num2 = Math.floor(Math.random() * maxMul);
                answer = num1 * num2;
                break;
            case '/':
                const maxDiv = 5 + level;
                num2 = Math.floor(Math.random() * maxDiv) + 1;
                answer = Math.floor(Math.random() * maxDiv);
                num1 = num2 * answer;
                break;
        }

        return {
            text: `${num1} ${op} ${num2} = ?`,
            answer: answer,
            num1, num2, op
        };
    },

    generateDistractors(correctAnswer, level) {
        const distractors = new Set();
        const count = 3;

        while (distractors.size < count) {
            // Distractors range also scales with level/answer size
            let range = Math.max(10, Math.floor(correctAnswer * 0.5));
            let offset = Math.floor(Math.random() * range) + 1;
            if (Math.random() > 0.5) offset *= -1;

            let distractor = correctAnswer + offset;
            if (distractor >= 0 && distractor !== correctAnswer) {
                distractors.add(distractor);
            }
        }

        return Array.from(distractors);
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = MathLogic;
}
