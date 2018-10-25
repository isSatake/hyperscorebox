import {Envelope, Font, Zone} from "./types";

export class WebAudioFontPlayer {
    private envelopes: Envelope[] = [];
    private onCacheFinish = null;
    private onCacheProgress = null;
    private readonly afterTime = 0.05;
    private readonly nearZero = 0.000001;

    constructor() {
        return this;
    }

    //別にWebAudioFontPlayerのメンバにキューイングしてるわけではない
    //どの音をどのように鳴らすか、というのを引数で受ける
    public queueWaveTable = async (audioContext: AudioContext, target, font: Font, when, pitch, duration, volume, slides?): Promise<Envelope> => {
        const zone: Zone = await this.findZone(audioContext, font, pitch);
        if (!(zone.buffer)) {
            console.log('empty buffer ', zone);
            return;
        }

        const baseDetune = zone.originalPitch - 100.0 * zone.coarseTune - zone.fineTune;
        pitch = zone.fixedPitch || pitch;
        const playbackRate = Math.pow(2, (100.0 * pitch - baseDetune) / 1200.0);
        const sampleRatio = zone.sampleRate / audioContext.sampleRate;
        let startWhen = when;
        if (startWhen < audioContext.currentTime) {
            startWhen = audioContext.currentTime;
        }
        let waveDuration = duration + this.afterTime;
        let loop = true;
        if (zone.loopStart < 1 || zone.loopStart >= zone.loopEnd) {
            loop = false;
        }
        if (!loop) {
            if (waveDuration > zone.buffer.duration / playbackRate) {
                waveDuration = zone.buffer.duration / playbackRate;
            }
        }

        //envelopeは音量変化を定義するもの
        const envelope = this.findEnvelope(audioContext, target, startWhen, waveDuration, zone.release);
        //純粋な関数にできねーかな
        this.setupEnvelope(audioContext, envelope, zone, volume, startWhen, waveDuration, duration);
        envelope.audioBufferSourceNode = audioContext.createBufferSource();
        envelope.audioBufferSourceNode.playbackRate.setValueAtTime(playbackRate, 0);

        //slidesって何
        if (slides) {
            if (slides.length > 0) {
                envelope.audioBufferSourceNode.playbackRate.setValueAtTime(playbackRate, when);
                for (let i = 0; i < slides.length; i++) {
                    const newPlaybackRate = Math.pow(2, (100.0 * slides[i].pitch - baseDetune) / 1200.0);
                    const newWhen = when + slides[i].when;
                    envelope.audioBufferSourceNode.playbackRate.linearRampToValueAtTime(newPlaybackRate, newWhen);
                }
            }
        }

        //envelopeの実体はGainNode
        //GainNodeも音量変化を定義するもの
        //ここで鳴らしたい音と鳴らし方をenvelopeに教え込んでいる
        envelope.audioBufferSourceNode.buffer = zone.buffer;
        if (loop) {
            envelope.audioBufferSourceNode.loop = true;
            envelope.audioBufferSourceNode.loopStart = zone.loopStart / zone.sampleRate;
            envelope.audioBufferSourceNode.loopEnd = zone.loopEnd / zone.sampleRate;
        } else {
            envelope.audioBufferSourceNode.loop = false;
        }

        //ここで鳴らす
        envelope.audioBufferSourceNode.connect(envelope);
        envelope.audioBufferSourceNode.start(startWhen, zone.offset);
        envelope.audioBufferSourceNode.stop(startWhen + waveDuration);
        envelope.when = startWhen;
        envelope.duration = waveDuration;
        envelope.pitch = pitch;
        envelope.font = font;
        return envelope; //envelopeを返す
    };

    setupEnvelope = (audioContext, envelope, zone, volume, when, sampleDuration, noteDuration) => {
        envelope.gain.setValueAtTime(0, audioContext.currentTime);
        let lastTime = 0;
        let lastVolume = 0;
        let duration = noteDuration;
        let ahdsr = zone.ahdsr;
        if (sampleDuration < duration + this.afterTime) {
            duration = sampleDuration - this.afterTime;
        }
        if (ahdsr) {
            if (!(ahdsr.length > 0)) {
                ahdsr = [{
                    duration: 0,
                    volume: 1
                }, {
                    duration: 0.5,
                    volume: 1
                }, {
                    duration: 1.5,
                    volume: 0.5
                }, {
                    duration: 3,
                    volume: 0
                }
                ];
            }
        } else {
            ahdsr = [{
                duration: 0,
                volume: 1
            }, {
                duration: duration,
                volume: 1
            }
            ];
        }
        envelope.gain.cancelScheduledValues(when);
        envelope.gain.setValueAtTime(ahdsr[0].volume * volume, when);
        for (let i = 0; i < ahdsr.length; i++) {
            if (ahdsr[i].duration > 0) {
                if (ahdsr[i].duration + lastTime > duration) {
                    const r = 1 - (ahdsr[i].duration + lastTime - duration) / ahdsr[i].duration;
                    const n = lastVolume - r * (lastVolume - ahdsr[i].volume);
                    envelope.gain.linearRampToValueAtTime(volume * n, when + duration);
                    break;
                }
                lastTime = lastTime + ahdsr[i].duration;
                lastVolume = ahdsr[i].volume;
                envelope.gain.linearRampToValueAtTime(volume * lastVolume, when + lastTime);
            }
        }
        envelope.gain.linearRampToValueAtTime(0, when + duration + this.afterTime);
    };

    findEnvelope = (audioContext, target, when, duration, releaseTime = 0.1): Envelope => {
        const envelope: Envelope = audioContext.createGain();
        envelope.target = target;
        envelope.connect(target);
        envelope.cancel = () => {
            envelope.gain.cancelScheduledValues(0);
            envelope.gain.setTargetAtTime(0.00001, audioContext.currentTime, releaseTime);
            envelope.when = audioContext.currentTime + 0.00001;
            envelope.duration = 0;
        };
        return envelope;
    };

    //鳴らしたい音の"zone"を生成
    adjustZone = async (audioContext: AudioContext, zone: Zone): Promise<Zone> => {
        if (zone.buffer) {
            return zone;
        }
        // zone.offset = 0;
        if (zone.sample) {
            const decoded = atob(zone.sample);
            zone.buffer = audioContext.createBuffer(1, decoded.length / 2, zone.sampleRate);
            const float32Array = zone.buffer.getChannelData(0);
            let b1, b2, n;
            for (let i = 0; i < decoded.length / 2; i++) {
                b1 = decoded.charCodeAt(i * 2);
                b2 = decoded.charCodeAt(i * 2 + 1);
                if (b1 < 0) {
                    b1 = 256 + b1;
                }
                if (b2 < 0) {
                    b2 = 256 + b2;
                }
                n = b2 * 256 + b1;
                if (n >= 65536 / 2) {
                    n = n - 65536;
                }
                float32Array[i] = n / 65536.0;
            }
            return zone;
        }

        if (zone.file) {
            const datalen = zone.file.length;
            const arraybuffer = new ArrayBuffer(datalen);
            const view = new Uint8Array(arraybuffer);
            const decoded = atob(zone.file);
            let b;
            for (let i = 0; i < decoded.length; i++) {
                b = decoded.charCodeAt(i);
                view[i] = b;
            }
            zone.buffer = await audioContext.decodeAudioData(arraybuffer);
            return zone;
        }
    };


    //鳴らしたい高さの音を探す
    findZone = async (audioContext: AudioContext, font: Font, pitch: number): Promise<Zone> => {
        let zone = null;
        for (let i = font.zones.length - 1; i >= 0; i--) {
            zone = font.zones[i];
            if (zone.keyRangeLow <= pitch && zone.keyRangeHigh + 1 >= pitch) {
                break; //pitchがzoneのピッチの範囲内ならfor文を抜ける
            }
        }
        try {
            return await this.adjustZone(audioContext, zone);
        } catch (ex) {
            console.log('adjustZone', ex);
        }
    };
}
