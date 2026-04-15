class AudioController {
  private ctx: AudioContext | null = null;
  private enabled: boolean = true;

  constructor() {
    // Initialize lazily to avoid autoplay restrictions
  }

  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  public playTone(freq: number, type: OscillatorType, duration: number, vol: number = 0.1) {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(vol, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      console.error('Audio play error:', e);
    }
  }

  public playJump() {
    this.playTone(400, 'sine', 0.1, 0.1);
    setTimeout(() => this.playTone(600, 'sine', 0.15, 0.1), 50);
  }

  public playCoin() {
    this.playTone(800, 'sine', 0.1, 0.1);
    setTimeout(() => this.playTone(1200, 'sine', 0.2, 0.1), 50);
  }

  public playHit() {
    this.playTone(150, 'sawtooth', 0.2, 0.2);
  }

  public playGameOver() {
    this.playTone(300, 'sawtooth', 0.3, 0.2);
    setTimeout(() => this.playTone(250, 'sawtooth', 0.3, 0.2), 200);
    setTimeout(() => this.playTone(200, 'sawtooth', 0.5, 0.2), 400);
  }

  public playLevelUp() {
    this.playTone(400, 'square', 0.1, 0.1);
    setTimeout(() => this.playTone(500, 'square', 0.1, 0.1), 100);
    setTimeout(() => this.playTone(600, 'square', 0.2, 0.1), 200);
  }

  public playMatch() {
    this.playTone(600, 'sine', 0.1, 0.1);
    setTimeout(() => this.playTone(800, 'sine', 0.1, 0.1), 100);
  }

  public playShoot() {
    this.playTone(800, 'square', 0.1, 0.05);
  }

  public play(type: 'click' | 'success' | 'error') {
    switch (type) {
      case 'click':
        this.playTone(400, 'sine', 0.05, 0.05);
        break;
      case 'success':
        this.playCoin();
        break;
      case 'error':
        this.playGameOver();
        break;
    }
  }
}

export const audio = new AudioController();

export const haptics = {
  vibrate: (pattern: number | number[]) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {
        // Ignore
      }
    }
  },
  light: () => haptics.vibrate(10),
  medium: () => haptics.vibrate(20),
  heavy: () => haptics.vibrate(40),
  success: () => haptics.vibrate([10, 50, 20]),
  error: () => haptics.vibrate([30, 50, 30]),
};
