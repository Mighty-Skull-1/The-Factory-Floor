export class SoundManager {
  private ctx: AudioContext | null = null;
  public isMuted: boolean = false;
  private musicInterval: number | null = null;
  private currentTrack: 'NONE' | 'DUNGEON' | 'MELTDOWN' | 'BOSS' = 'NONE';
  private masterGain: GainNode | null = null;

  constructor() {}

  public init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.22, this.ctx.currentTime); // Gentle, comfortable volume
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.22, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  // --- WARM & BOUNCY CARTOON SFX ---

  public playShoot(type: 'shard' | 'slug' | 'laser' | 'star' = 'laser') {
    if (this.isMuted || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    if (type === 'shard') {
      // Cheerful crystal ping
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(320, now + 0.1);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    } else if (type === 'slug') {
      // Comedic cartoon thwump
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(50, now + 0.18);
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
    } else if (type === 'star') {
      // Bouncy ricochet twang
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.linearRampToValueAtTime(900, now + 0.04);
      osc.frequency.exponentialRampToValueAtTime(250, now + 0.14);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.14);
    } else {
      // Warm bouncy cartoon "pew!"
      osc.type = 'sine';
      osc.frequency.setValueAtTime(540, now);
      osc.frequency.exponentialRampToValueAtTime(160, now + 0.12);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
    }

    osc.connect(gain);
    gain.connect(this.masterGain!);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  public playEnemyShoot() {
    if (this.isMuted || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    // Soft cartoon pop-spit
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    osc.connect(gain);
    gain.connect(this.masterGain!);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  public playExplosion() {
    if (this.isMuted || !this.ctx) return;
    const now = this.ctx.currentTime;
    // Warm cartoon bass boom
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(35, now + 0.28);
    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.28);
    osc.connect(gain);
    gain.connect(this.masterGain!);
    osc.start(now);
    osc.stop(now + 0.3);
  }

  public playFreeze() {
    if (this.isMuted || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(659.25, now); // E5
    osc.frequency.setValueAtTime(880, now + 0.05); // A5
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    osc.connect(gain);
    gain.connect(this.masterGain!);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  public playShock() {
    if (this.isMuted || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.setValueAtTime(780, now + 0.03);
    osc.frequency.setValueAtTime(400, now + 0.06);
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    osc.connect(gain);
    gain.connect(this.masterGain!);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  public playParry() {
    if (this.isMuted || !this.ctx) return;
    const now = this.ctx.currentTime;
    // Loud cartoon metal CLANG!
    const osc = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(840, now);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.35);

    osc2.type = 'square';
    osc2.frequency.setValueAtTime(1260, now);
    osc2.frequency.exponentialRampToValueAtTime(300, now + 0.25);

    gain.gain.setValueAtTime(0.7, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

    osc.connect(gain);
    osc2.connect(gain);
    gain.connect(this.masterGain!);

    osc.start(now);
    osc2.start(now);
    osc.stop(now + 0.4);
    osc2.stop(now + 0.4);
  }

  public playLap2() {
    if (this.isMuted || !this.ctx) return;
    const now = this.ctx.currentTime;
    // Playful Pizza Tower Lap 2 trumpet fanfare
    const notes = [392, 523.25, 659.25, 783.99]; // G4, C5, E5, G5
    notes.forEach((freq, idx) => {
      const noteOsc = this.ctx!.createOscillator();
      const noteGain = this.ctx!.createGain();
      noteOsc.type = 'sawtooth';
      noteOsc.frequency.setValueAtTime(freq, now + idx * 0.08);

      noteGain.gain.setValueAtTime(0.35, now + idx * 0.08);
      noteGain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.08 + 0.2);

      noteOsc.connect(noteGain);
      noteGain.connect(this.masterGain!);
      noteOsc.start(now + idx * 0.08);
      noteOsc.stop(now + idx * 0.08 + 0.22);
    });
  }

  public playBuy() {
    if (this.isMuted || !this.ctx) return;
    const now = this.ctx.currentTime;
    // Two-tone coin bell
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(987.77, now); // B5
    osc.frequency.setValueAtTime(1318.51, now + 0.08); // E6
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.28);
    osc.connect(gain);
    gain.connect(this.masterGain!);
    osc.start(now);
    osc.stop(now + 0.3);
  }

  public playSmash() {
    if (this.isMuted || !this.ctx) return;
    this.playExplosion();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    // Comic punch
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(240, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.22);
    gain.gain.setValueAtTime(0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);
    osc.connect(gain);
    gain.connect(this.masterGain!);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  public playMachTierUp(tier: number) {
    if (this.isMuted || !this.ctx) return;
    const now = this.ctx.currentTime;
    // Bouncy cartoon slide whistle up!
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    const startF = tier === 2 ? 350 : 500;
    osc.frequency.setValueAtTime(startF, now);
    osc.frequency.exponentialRampToValueAtTime(startF * 1.7, now + 0.18);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
    osc.connect(gain);
    gain.connect(this.masterGain!);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  public playSlide() {
    if (this.isMuted || !this.ctx) return;
    const now = this.ctx.currentTime;
    // Playful cartoon squeak-slide
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.15);
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    osc.connect(gain);
    gain.connect(this.masterGain!);
    osc.start(now);
    osc.stop(now + 0.16);
  }

  public playPlace() {
    if (this.isMuted || !this.ctx) return;
    const now = this.ctx.currentTime;
    // Soft wooden pop
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(500, now);
    osc.frequency.exponentialRampToValueAtTime(750, now + 0.05);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);
    osc.connect(gain);
    gain.connect(this.masterGain!);
    osc.start(now);
    osc.stop(now + 0.06);
  }

  public playRotate() {
    if (this.isMuted || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(450, now + 0.04);
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
    osc.connect(gain);
    gain.connect(this.masterGain!);
    osc.start(now);
    osc.stop(now + 0.05);
  }

  public playEnemyHurt() {
    if (this.isMuted || !this.ctx) return;
    const now = this.ctx.currentTime;
    // Goofy cartoon bonk
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.08);
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
    osc.connect(gain);
    gain.connect(this.masterGain!);
    osc.start(now);
    osc.stop(now + 0.09);
  }

  public playPlayerHurt() {
    if (this.isMuted || !this.ctx) return;
    const now = this.ctx.currentTime;
    // Cartoon "ouch" squeak
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(280, now);
    osc.frequency.linearRampToValueAtTime(160, now + 0.15);
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.16);
    osc.connect(gain);
    gain.connect(this.masterGain!);
    osc.start(now);
    osc.stop(now + 0.18);
  }

  public playAlarm() {
    if (this.isMuted || !this.ctx) return;
    const now = this.ctx.currentTime;
    // Playful melodic two-tone cartoon siren (A4 to C#5)
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.setValueAtTime(554.37, now + 0.14);
    osc.frequency.setValueAtTime(440, now + 0.28);
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.38);
    osc.connect(gain);
    gain.connect(this.masterGain!);
    osc.start(now);
    osc.stop(now + 0.4);
  }

  // --- PLAYFUL CARTOON MUSIC LOOPS ---

  public startMusic(track: 'DUNGEON' | 'MELTDOWN' | 'BOSS') {
    if (this.currentTrack === track) return;
    this.stopMusic();
    this.currentTrack = track;
    if (!this.ctx) return;

    let step = 0;
    const tempo = track === 'MELTDOWN' ? 148 : track === 'BOSS' ? 128 : 112;
    const intervalMs = (60 / tempo / 4) * 1000;

    // Upbeat bouncy cartoon pentatonic progressions
    const dungeonMelody = [261.63, 329.63, 392.00, 523.25, 392.00, 329.63, 293.66, 261.63]; // C - E - G - C
    const bossMelody = [220.00, 261.63, 293.66, 349.23, 293.66, 261.63, 220.00, 196.00];
    const meltdownMelody = [329.63, 392.00, 440.00, 523.25, 587.33, 523.25, 440.00, 392.00];

    const dungeonBass = [130.81, 130.81, 164.81, 196.00, 130.81, 196.00, 164.81, 146.83];
    const bossBass = [110.00, 110.00, 130.81, 146.83, 110.00, 164.81, 146.83, 130.81];
    const meltdownBass = [164.81, 196.00, 220.00, 261.63, 196.00, 220.00, 261.63, 329.63];

    this.musicInterval = window.setInterval(() => {
      if (this.isMuted || !this.ctx) return;
      const now = this.ctx.currentTime;

      // Soft bouncy kick on beat 1 & 3
      if (step % 4 === 0) {
        const kickOsc = this.ctx.createOscillator();
        const kickGain = this.ctx.createGain();
        kickOsc.type = 'sine';
        kickOsc.frequency.setValueAtTime(120, now);
        kickOsc.frequency.exponentialRampToValueAtTime(30, now + 0.09);
        kickGain.gain.setValueAtTime(track === 'MELTDOWN' ? 0.35 : 0.25, now);
        kickGain.gain.exponentialRampToValueAtTime(0.01, now + 0.09);
        kickOsc.connect(kickGain);
        kickGain.connect(this.masterGain!);
        kickOsc.start(now);
        kickOsc.stop(now + 0.1);
      }

      // Warm cartoon walking bass on 8th notes
      if (step % 2 === 0) {
        const bassNotes = track === 'MELTDOWN' ? meltdownBass : track === 'BOSS' ? bossBass : dungeonBass;
        const bFreq = bassNotes[(Math.floor(step / 2)) % bassNotes.length];

        const bassOsc = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();
        bassOsc.type = 'triangle'; // Soft, warm, non-grating tone
        bassOsc.frequency.setValueAtTime(bFreq, now);
        bassGain.gain.setValueAtTime(0.18, now);
        bassGain.gain.exponentialRampToValueAtTime(0.01, now + 0.14);
        bassOsc.connect(bassGain);
        bassGain.connect(this.masterGain!);
        bassOsc.start(now);
        bassOsc.stop(now + 0.15);
      }

      // Playful marimba / music-box melody blips
      if (step % 4 === 2 || (track === 'MELTDOWN' && step % 2 === 1)) {
        const melNotes = track === 'MELTDOWN' ? meltdownMelody : track === 'BOSS' ? bossMelody : dungeonMelody;
        const mFreq = melNotes[(Math.floor(step / 2)) % melNotes.length];

        const melOsc = this.ctx.createOscillator();
        const melGain = this.ctx.createGain();
        melOsc.type = 'sine';
        melOsc.frequency.setValueAtTime(mFreq, now);
        melGain.gain.setValueAtTime(track === 'MELTDOWN' ? 0.14 : 0.1, now);
        melGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        melOsc.connect(melGain);
        melGain.connect(this.masterGain!);
        melOsc.start(now);
        melOsc.stop(now + 0.1);
      }

      step++;
    }, intervalMs);
  }

  public stopMusic() {
    if (this.musicInterval !== null) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
    this.currentTrack = 'NONE';
  }
}
