// Original pentatonic miniature, synthesized locally; no recordings or network media.
const NOTES = [
  76,79,83,81,79,76,74,0, 72,76,79,83,81,79,76,0,
  74,76,79,81,79,76,74,72, 71,74,76,79,76,74,72,0,
  79,83,86,83,81,79,76,0, 76,79,84,83,81,79,76,74,
  72,76,79,81,79,76,74,71, 72,76,79,76,74,72,0,0,
];
const CHORDS = [[48,55,60,64],[45,52,57,60],[53,60,65,69],[43,50,55,59],[48,55,60,64],[45,52,57,60],[53,60,65,69],[48,55,60,64]];
export class MusicBoxAudio {
  constructor() { this.context=null;this.playing=false;this.position=0;this.step=.43;this.duration=NOTES.length*this.step;this.volume=.55;this.nextNote=0;this.origin=0;this.timer=null;this.onInterrupted=null;this.voices=new Set(); }
  async initialize() {
    if(this.context)return;
    const AudioContext=window.AudioContext||window.webkitAudioContext;
    if(!AudioContext)throw new Error('此浏览器不支持 Web Audio，请换用新版 Chrome 或 Safari。');
    this.context=new AudioContext();const c=this.context;
    this.master=c.createGain();this.master.gain.value=this.volume*.65;
    this.bus=c.createGain();this.bus.gain.value=0;
    const compressor=c.createDynamicsCompressor();compressor.threshold.value=-16;compressor.ratio.value=3;
    this.analyser=c.createAnalyser();this.analyser.fftSize=512;
    this.bus.connect(this.master);this.master.connect(compressor);compressor.connect(this.analyser);this.analyser.connect(c.destination);
    const reverb=c.createConvolver(),buffer=c.createBuffer(2,Math.floor(c.sampleRate*1.8),c.sampleRate);
    let seed=19;
    for(let ch=0;ch<2;ch++) {const data=buffer.getChannelData(ch);for(let i=0;i<data.length;i++){seed=(Math.imul(seed,1664525)+1013904223)|0;data[i]=(seed/2147483648)*Math.pow(1-i/data.length,3.4)*.25;}}
    reverb.buffer=buffer;
    this.reverbInput=c.createGain();this.reverbInput.gain.value=.22;this.reverbInput.connect(reverb);reverb.connect(this.bus);
    this.context.addEventListener('statechange',()=>{if(this.playing&&this.context.state!=='running'){this.pause();this.onInterrupted?.();}});
  }
  note(midi,at,strength=.2) {
    const c=this.context,freq=440*2**((midi-69)/12);
    // Inharmonic upper partials and a fast transient evoke a plucked steel tine.
    for(const [ratio,volume,decay]of [[1,1,1.7],[2,.2,.8],[3.99,.13,.32],[5.43,.035,.16]]) {
      const osc=c.createOscillator(),gain=c.createGain();osc.type='sine';osc.frequency.value=freq*ratio;
      gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(strength*volume,at+.004);gain.gain.exponentialRampToValueAtTime(.0001,at+decay);
      osc.connect(gain);gain.connect(this.bus);gain.connect(this.reverbInput);osc.start(at);osc.stop(at+decay+.02);
      this.voices.add(osc);osc.onended=()=>{this.voices.delete(osc);osc.disconnect();gain.disconnect();};
    }
  }
  schedule() {
    if(!this.playing)return;
    const elapsed=this.context.currentTime-this.origin;
    while(this.nextNote*this.step<elapsed+.11) {
      const absolute=this.nextNote*this.step,at=this.origin+absolute;
      const i=this.nextNote%NOTES.length;
      if(at>=this.context.currentTime-.025) {
        if(NOTES[i])this.note(NOTES[i],Math.max(at,this.context.currentTime),.2);
        if(i%2===0) {const chord=CHORDS[Math.floor(i/8)];this.note(chord[(i/2)%4]+12,Math.max(at,this.context.currentTime),.075);}
      }
      this.nextNote++;
    }
  }
  async play() {
    await this.initialize();await this.context.resume();
    if(this.context.state!=='running')throw new Error('声音尚未开启，请再次点击播放。');
    this.origin=this.context.currentTime-this.position;
    this.nextNote=Math.ceil(this.position/this.step);
    this.playing=true;
    this.bus.gain.cancelScheduledValues(this.context.currentTime);this.bus.gain.setTargetAtTime(1,this.context.currentTime,.03);
    this.schedule();this.timer=setInterval(()=>this.schedule(),40);
  }
  pause() {
    if(!this.playing)return;
    this.position=(this.context.currentTime-this.origin)%this.duration;
    this.playing=false;clearInterval(this.timer);this.timer=null;
    this.bus.gain.cancelScheduledValues(this.context.currentTime);this.bus.gain.setTargetAtTime(0,this.context.currentTime,.018);
    for(const voice of this.voices)voice.stop(this.context.currentTime+.05);
  }
  setVolume(value) {this.volume=value;if(this.master)this.master.gain.setTargetAtTime(value*.65,this.context.currentTime,.02);}
  get currentTime(){return this.playing?(this.context.currentTime-this.origin)%this.duration:this.position;}
  get rms(){if(!this.analyser)return 0;const values=new Float32Array(512);this.analyser.getFloatTimeDomainData(values);return Math.sqrt(values.reduce((sum,n)=>sum+n*n,0)/values.length);}
}
