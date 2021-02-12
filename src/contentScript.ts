import { insertButton } from './contentSubscripts/modifyhtml';

const main = () => {
    const startButton = insertButton();
    startButton.onclick = () => {
        console.log('nope!');
    };
};

main();
