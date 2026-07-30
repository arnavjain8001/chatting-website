// Web Audio Synthesizer and Audio Streamer for Story Music Playback

class StoryAudioPlayer {
  private audioCtx: AudioContext | null = null;
  private isPlaying: boolean = false;
  private currentTrackId: string | null = null;
  private synthInterval: number | null = null;
  private audioElement: HTMLAudioElement | null = null;

  private initCtx() {
    if (!this.audioCtx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.audioCtx = new AudioCtx();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  public playTrack(trackId: string, language?: string, audioUrl?: string) {
    this.stop();
    this.initCtx();
    this.isPlaying = true;
    this.currentTrackId = trackId;

    // Try HTML5 Audio if audioUrl provided
    if (audioUrl) {
      try {
        this.audioElement = new Audio();
        this.audioElement.crossOrigin = 'anonymous';
        this.audioElement.src = audioUrl;
        this.audioElement.volume = 0.95;
        this.audioElement.loop = true;
        
        const playPromise = this.audioElement.play();
        if (playPromise) {
          playPromise.catch((err) => {
            console.warn('HTML5 audio play blocked or failed, switching to WebAudio Synth:', err);
            this.playSynthMelody(language);
          });
        }
        return;
      } catch (e) {
        console.warn('Audio element error:', e);
      }
    }

    // Fallback: Web Audio Synth tuned to Indian scales & Beats
    this.playSynthMelody(language);
  }

  private playSynthMelody(language?: string) {
    if (!this.audioCtx) return;

    let notes: number[] = [261.63, 293.66, 329.63, 349.23, 392.0, 440.0, 493.88, 523.25]; // C4 major
    if (language === 'Hindi') {
      // Bhairav / Bollywood Sitar-like Raag scale
      notes = [261.63, 277.18, 329.63, 349.23, 392.0, 415.3, 493.88, 523.25];
    } else if (language === 'Punjabi') {
      // Upbeat Punjabi Dhol-style pentatonic scale
      notes = [293.66, 329.63, 392.0, 440.0, 523.25, 587.33];
    }

    let noteIndex = 0;

    const playNote = () => {
      if (!this.isPlaying || !this.audioCtx) return;

      try {
        const now = this.audioCtx.currentTime;
        const freq = notes[noteIndex % notes.length];
        noteIndex++;

        // Lead synth oscillator
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = language === 'Punjabi' ? 'triangle' : language === 'Hindi' ? 'sine' : 'sawtooth';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.start(now);
        osc.stop(now + 0.38);

        // Add rhythm beat
        if (noteIndex % 2 === 0) {
          const bassOsc = this.audioCtx.createOscillator();
          const bassGain = this.audioCtx.createGain();
          bassOsc.type = 'sine';
          bassOsc.frequency.setValueAtTime(language === 'Punjabi' ? 110 : 80, now);
          bassGain.gain.setValueAtTime(0.2, now);
          bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
          bassOsc.connect(bassGain);
          bassGain.connect(this.audioCtx.destination);
          bassOsc.start(now);
          bassOsc.stop(now + 0.22);
        }
      } catch (e) {
        console.error('Synth playback error:', e);
      }
    };

    playNote();
    const intervalTime = language === 'Punjabi' ? 220 : language === 'Hindi' ? 300 : 260;
    this.synthInterval = window.setInterval(playNote, intervalTime);
  }

  public stop() {
    this.isPlaying = false;
    this.currentTrackId = null;

    if (this.audioElement) {
      try {
        this.audioElement.pause();
        this.audioElement.currentTime = 0;
      } catch (e) {}
      this.audioElement = null;
    }

    if (this.synthInterval !== null) {
      clearInterval(this.synthInterval);
      this.synthInterval = null;
    }
  }

  public getIsPlaying() {
    return this.isPlaying;
  }

  public getCurrentTrackId() {
    return this.currentTrackId;
  }
}

export const storyAudioPlayer = new StoryAudioPlayer();

