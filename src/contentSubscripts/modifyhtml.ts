const BUTTON_TEXT = 'Run the game Bitches!' as const;

const INSERT_DIV_QUERY_SELECTOR = '#game .container .col' as const;

export const insertButton = (): HTMLButtonElement => {
    const textElem = document.querySelector(INSERT_DIV_QUERY_SELECTOR);

    const startButtonContainer = document.createElement('div');
    startButtonContainer.style.marginTop = '32px';
    const startButton = document.createElement('button');
    startButton.textContent = BUTTON_TEXT.toString();
    startButtonContainer.appendChild(startButton);
    textElem?.appendChild(startButtonContainer);
    return startButton;
};
