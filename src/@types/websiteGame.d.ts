interface Window {
    Sleep: (millis: number) => Promise<void>;
    resetCards: (image1?: number, image2?: number) => Promise<void>;
    getImage: (clicked: number) => void;
    clickCard: (number: string) => void;
    resetMiddelImage: () => Promise<void>;
    setMiddleImage: (src: string) => void;
}
