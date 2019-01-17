import * as WebAudioTinySynth from "webaudio-tinysynth";

export class MIDIPlayer {
    private readonly smf: ArrayBuffer;
    private readonly controller: HTMLElement;
    private readonly seekBar: HTMLInputElement;
    private readonly playAndPauseButton: HTMLButtonElement;
    private readonly rewindButton: HTMLButtonElement;
    private readonly downloadButton: HTMLButtonElement;
    private tinySynth = new WebAudioTinySynth({voices: 64});

    constructor(smf: ArrayBuffer) {
        this.smf = smf;
        this.tinySynth.loadMIDI(this.smf);
        this.controller = document.createElement("div");
        this.controller.className = "midi-controller";
        this.controller.addEventListener("mousedown", e => e.stopPropagation());

        this.seekBar = document.createElement("input");
        this.seekBar.id = "position";
        this.seekBar.type = "range";
        this.seekBar.min = "0";
        this.seekBar.max = "100";
        this.seekBar.value = "0";
        this.seekBar.step = "1";
        this.seekBar.className = "input-range";
        this.seekBar.addEventListener("input", this.seek);

        this.playAndPauseButton = document.createElement("button");
        this.playAndPauseButton.className = "midi-play-button";
        this.playAndPauseButton.addEventListener("mousedown", this.playPause);

        this.rewindButton = document.createElement("button");
        this.rewindButton.className = "midi-rewind-button";
        this.rewindButton.addEventListener("mousedown", this.rewind);

        this.downloadButton = document.createElement("button");
        this.downloadButton.className = "midi-download-button";
        this.downloadButton.addEventListener("mousedown", this.download);

        this.controller.appendChild(this.playAndPauseButton);
        this.controller.appendChild(this.rewindButton);
        this.controller.appendChild(this.seekBar);
        this.controller.appendChild(this.downloadButton);
    }

    private play = (): void => {
        this.tinySynth.playMIDI();
        this.playAndPauseButton.className = "midi-pause-button";
        this.updateSeekBar();
    };

    private pause = (): void => {
        this.tinySynth.stopMIDI();
    };

    private playPause = (): void => {
        if (this.playAndPauseButton.className === "midi-pause-button") {
            this.pause();
            return;
        }
        this.play();
    };

    private updateSeekBar = (): void => {
        const {play, maxTick, curTick} = this.tinySynth.getPlayStatus();
        this.seekBar.value = `${Math.round(100 * curTick / maxTick)}`;
        if (play === 0) {
            this.playAndPauseButton.className = "midi-play-button";
            return;
        }
        if (curTick === maxTick) {
            this.playAndPauseButton.className = "midi-play-button";
            return;
        }
        setTimeout(() => this.updateSeekBar(), 500);
    };

    private seek = (): void => {
        const {maxTick} = this.tinySynth.getPlayStatus();
        const positionSeekTo = Math.round(Number(this.seekBar.value) / 100 * maxTick);
        this.tinySynth.locateMIDI(positionSeekTo);
    };

    private rewind = (): void => {
        this.tinySynth.loadMIDI(this.smf);
        this.playAndPauseButton.className = "midi-play-button";
        this.seekBar.value = "0";
    };

    private download = (): void => {
        const url = URL.createObjectURL(new Blob([this.smf], {type: "audio/midi"}));
        window.open(url);
    };

    public getElement = (): Element => this.controller;

    public showPlayer = (): void => {
        this.controller.style.visibility = "visible";
    };

    public hidePlayer = (): void => {
        this.controller.style.visibility = "hidden";
    };
}
