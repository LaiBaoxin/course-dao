interface Window {
    ethereum?: {
        isMetaMask?: boolean;
        on?: (...args: any[]) => void;
        removeListener?: (...args: any[]) => void;
        request: (...args: any[]) => Promise<any>;
        send: (...args: any[]) => Promise<any>;
    };
}
