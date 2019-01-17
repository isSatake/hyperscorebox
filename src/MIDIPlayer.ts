import * as WebAudioTinySynth from "webaudio-tinysynth";

export class MIDIPlayer {
    private readonly controller: HTMLElement;
    private readonly seekBar: HTMLInputElement;
    private readonly playAndPauseButton: HTMLButtonElement;
    private readonly rewindButton: HTMLButtonElement;
    private readonly downloadButton: HTMLButtonElement;
    private smf: ArrayBuffer;
    private tinySynth = new WebAudioTinySynth({voices: 64});

    constructor(smf: ArrayBuffer) {
        this.load(smf);

        this.controller = this.createController();
        this.seekBar = this.createSeekBar();
        this.playAndPauseButton = this.createButton("midi-play-button", this.playPause);
        this.rewindButton = this.createButton("midi-rewind-button", this.rewind);
        this.downloadButton = this.createButton("midi-download-button", this.download);

        this.controller.appendChild(this.playAndPauseButton);
        this.controller.appendChild(this.rewindButton);
        this.controller.appendChild(this.seekBar);
        this.controller.appendChild(this.downloadButton);
    }

    private createController = (): HTMLElement => {
        const controller = document.createElement("div");
        controller.className = "midi-controller";
        controller.addEventListener("click", e => e.stopPropagation()); //更新防止
        controller.addEventListener("mousedown", e => e.stopPropagation());
        return controller;
    };

    private createSeekBar = (): HTMLInputElement => {
        const seekBar = document.createElement("input");
        seekBar.id = "position";
        seekBar.type = "range";
        seekBar.min = "0";
        seekBar.max = "100";
        seekBar.value = "0";
        seekBar.step = "1";
        seekBar.className = "input-range";
        seekBar.addEventListener("input", this.seek);
        return seekBar;
    };

    private createButton = (className: string, clickCallBack: () => void): HTMLButtonElement => {
        const button = document.createElement("button");
        button.className = className;
        button.addEventListener("mousedown", clickCallBack);
        return button;
    };

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

    public load = (smf: ArrayBuffer): void => {
        this.smf = smf;
        this.tinySynth.loadMIDI(smf);
    };
}
