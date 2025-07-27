
'use client';

let audioContext: AudioContext | null = null;

const getAudioContext = (): AudioContext | null => {
    if (typeof window === 'undefined') return null;
    if (!audioContext) {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContext;
};

type SoundType = 'success' | 'click' | 'error' | 'notification';

export const playSound = (type: SoundType) => {
    const context = getAudioContext();
    if (!context) return;
    
    // Resume context if it's suspended (e.g., due to browser policy)
    if (context.state === 'suspended') {
        context.resume();
    }

    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    
    gainNode.gain.setValueAtTime(0.1, context.currentTime); // Volume

    switch (type) {
        case 'success':
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(600, context.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.00001, context.currentTime + 0.2);
            oscillator.start(context.currentTime);
            oscillator.stop(context.currentTime + 0.2);
            break;
            
        case 'click':
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(440, context.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.00001, context.currentTime + 0.1);
            oscillator.start(context.currentTime);
            oscillator.stop(context.currentTime + 0.1);
            break;

        case 'error':
             oscillator.type = 'square';
             oscillator.frequency.setValueAtTime(150, context.currentTime);
             gainNode.gain.exponentialRampToValueAtTime(0.00001, context.currentTime + 0.3);
             oscillator.start(context.currentTime);
             oscillator.stop(context.currentTime + 0.3);
             break;
        
        case 'notification':
            // A two-tone notification sound
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(800, context.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.00001, context.currentTime + 0.1);
            oscillator.start(context.currentTime);
            oscillator.stop(context.currentTime + 0.1);

            setTimeout(() => {
                if (!getAudioContext()) return; // check if context is still valid
                const osc2 = context.createOscillator();
                const gain2 = context.createGain();
                osc2.connect(gain2);
                gain2.connect(context.destination);
                gain2.gain.setValueAtTime(0.1, context.currentTime);
                osc2.type = 'sine';
                osc2.frequency.setValueAtTime(1000, context.currentTime);
                gain2.gain.exponentialRampToValueAtTime(0.00001, context.currentTime + 0.1);
                osc2.start(context.currentTime);
                osc2.stop(context.currentTime + 0.1);
            }, 120);
            break;
    }
};
