import { images } from './images';

export const fetchBase64Image = async (url: string): Promise<string> => fetch(url)
    .then((response) => response.blob())
    .then((blob) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as never);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    }));

export const findImage = (base64: string): string => {
    let result: string = '';
    images.find(({ a, b }, idx) => {
        if (base64 === a) {
            result = `${idx}_a`;
            return true;
        } if (base64 === b) {
            result = `${idx}_b`;
            return true;
        }
        return false;
    });
    return result;
};

export const sleep = async (
    millis: number,
): Promise<void> => new Promise((resolve) => setTimeout(resolve, millis));
