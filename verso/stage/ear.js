// The phone's ear: the microphone at the device's own rate, averaged down to 16 kHz mono 16-bit,
// posted in frames of 2048 samples (128 ms) with the frame's peak level for the meter.
class Ear extends AudioWorkletProcessor {
  constructor() {
    super();
    this.ratio = sampleRate / 16000;
    this.acc = 0; this.sum = 0; this.n = 0; this.peak = 0;
    this.buf = new Int16Array(2048); this.k = 0;
  }
  process(inputs) {
    const ch = inputs[0] && inputs[0][0];
    if (!ch) return true;
    for (let i = 0; i < ch.length; i++) {
      this.sum += ch[i]; this.n++; this.acc += 1;
      if (this.acc >= this.ratio) {
        this.acc -= this.ratio;
        const v = this.sum / this.n;
        this.sum = 0; this.n = 0;
        const a = v < 0 ? -v : v;
        if (a > this.peak) this.peak = a;
        this.buf[this.k++] = Math.max(-32768, Math.min(32767, Math.round(v * 32767)));
        if (this.k === this.buf.length) {
          this.port.postMessage({ pcm: this.buf.buffer, level: this.peak }, [this.buf.buffer]);
          this.buf = new Int16Array(2048); this.k = 0; this.peak = 0;
        }
      }
    }
    return true;
  }
}
registerProcessor('ear', Ear);
