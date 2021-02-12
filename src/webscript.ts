import { runBot } from './webSubscripts/bot';
import { insertButton } from './webSubscripts/modifyhtml';

const main = () => {
    const startButton = insertButton();
    startButton.onclick = () => {
        startButton.disabled = true;
        runBot();
    };
};

main();
