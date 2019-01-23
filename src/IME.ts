import {IMECandidate} from "./IMECandidate";
import * as abcjs from "abcjs/midi";
import {getCaretElement, getEditorElement, getTextInputElement, registerTextInputMutationObserver} from "./Scrapbox";
import {getSMF} from "./ABC";
import {ABCDictionary, imeDict} from "./ABCDictionary";

type InputEvent = {
    isComposing: boolean;
    data: string;
} & Event

class IME {
    private readonly MSG = "IME";
    private readonly MIDI_ELEMENT_ID = "IMEMIDI";
    private readonly IGNORE_KEYS = ["Control", "Alt", "Meta", "Shift", "Dead", "Delete", "ArrowLeft", "ArrowRight"];
    private readonly tinySynth;
    private readonly abcDict: ABCDictionary;
    private readonly imeEl;
    private readonly imeInputEl;
    private readonly svgEl;
    private readonly candidatesEl;
    private readonly midiEl;
    private readonly parentEl;
    private readonly caretEl;
    private readonly scrapboxInputEl;
    private readonly caretPaddingEl;
    private text: string = "";
    private isComposeCompleted: boolean = false;
    private candidates: string[];
    private candidateIndex = -1;
    private candidateEls: IMECandidate[] = [];

    constructor(tinySynth, abcDict) {
        this.tinySynth = tinySynth;
        this.abcDict = abcDict;

        this.imeEl = this.createIMEEl();
        this.imeInputEl = this.createIMEInputEl();
        this.svgEl = this.createSvgEl();
        this.candidatesEl = this.createCandidatesEl();
        this.midiEl = this.createMIDIEl();
        this.parentEl = getEditorElement();
        this.caretEl = getCaretElement();
        this.caretPaddingEl = this.createCaretPaddingEl();
        this.scrapboxInputEl = getTextInputElement();

        this.imeEl.appendChild(this.imeInputEl);
        this.imeEl.appendChild(this.svgEl);
        this.imeEl.appendChild(this.candidatesEl);
        this.imeEl.appendChild(this.midiEl);
        this.parentEl.appendChild(this.imeEl);

        registerTextInputMutationObserver(this.followTextInput);
        document.addEventListener("keydown", this.toggle);
        this.scrapboxInputEl.addEventListener("input", this.onJapaneseInput, true);
        this.scrapboxInputEl.addEventListener("keydown", this.onKeyDown);
    }

    private createIMEEl = (): HTMLElement => {
        const el = document.createElement("div");
        el.setAttribute("id", "ime");
        const {style} = el;
        style.position = "absolute";
        style.zIndex = "1000";
        style.width = "400px";
        style.padding = "0 0.5px 1px 1px";
        style.boxShadow = "#dedede 0 0 5px 1px";
        style.backgroundColor = "white";
        style.border = "#ababab solid 1.5px";
        style.display = "none";
        return el;
    };
    private createIMEInputEl = (): HTMLInputElement => {
        const el = document.createElement("input");
        const {style} = el;
        style.position = "absolute";
        style.border = "none";
        style.width = "394px";
        style.height = "30px";
        style.top = "-29px";
        style.backgroundColor = "transparent";
        el.setAttribute("id", "imeinput");
        el.addEventListener("click", e => {
            e.preventDefault();
            e.stopPropagation();
        });
        return el;
    };
    private createSvgEl = (): HTMLElement => {
        const el = document.createElement("div");
        const {style} = el;
        style.width = "100%";
        style.background = "#f5f5f5";
        el.setAttribute("id", "imesvg");
        return el;
    };
    private createCandidatesEl = (): HTMLElement => {
        const el = document.createElement("div");
        el.setAttribute("id", "imecandidates");
        for (let i = 0; i < 6; i++) {
            const candidate = new IMECandidate(i);
            this.candidateEls.push(candidate);
            el.appendChild(candidate.getDiv());
        }
        return el;
    };
    private createMIDIEl = (): HTMLElement => {
        const el = document.createElement("div");
        el.id = this.MIDI_ELEMENT_ID;
        return el;
    };
    private isVisible = (): boolean => this.imeEl.style.display === "";
    private toggle = (e: KeyboardEvent): void => {
        //キャレット表示中にEsc押したらIME表示
        const cursorLine = this.parentEl.querySelector(".cursor-line");
        if (!cursorLine) return;
        const codeBlock = cursorLine.querySelector("span.code-block");
        if (e.key === "Escape") {
            if (codeBlock) {
                if (this.isVisible()) {
                    this.imeEl.style.display = "none";
                } else if (this.caretEl.style.display === "") {
                    this.imeEl.style.display = "";
                }
            }
        }
    };
    private createCaretPaddingEl = (): HTMLElement => {
        const el = document.createElement("span");
        el.style.visibility = "hidden";
        document.body.appendChild(el);
        return el;
    };
    private updateCaretPadding = (): void => {
        this.caretPaddingEl.textContent = this.text;
        this.scrapboxInputEl.style.marginLeft = `${this.caretPaddingEl.offsetWidth * 1.1}px`;
        this.caretEl.style.marginLeft = `${this.caretPaddingEl.offsetWidth * 1.1 + 2}px`;
    };
    private onJapaneseInput = (e: InputEvent): void => {
        if (this.isComposeCompleted && e.isComposing) {
            console.log(this.MSG, "onJapaneseInput");
            this.addText(e.data);
            this.updateCaretPadding();
            abcjs.renderAbc("imesvg", this.text, {responsive: "resize"});
            this.scrapboxInputEl.value = "";
            this.isComposeCompleted = false;
            e.preventDefault();
            e.stopPropagation();
        }
    };
    private addText = (input: string): void => {
        this.text += input;
        this.onInput();
    };
    private resetText = (): void => {
        this.text = "";
        this.onInput();
    };
    private replaceText = (input: string): void => {
        this.text = input;
        this.onInput();
    };
    private removeLastChar = (): void => {
        this.text = this.text.substr(0, this.text.length - 1);
        this.onInput();
    };
    private onKeyDown = (e: KeyboardEvent): void => {
        if (!this.isVisible()) {
            return;
        }
        const {key} = e;
        console.log(this.MSG, "onKeyDown", `keyCode:${e.keyCode} key:${key}`);
        if (this.isIgnoreKey(key)) {
            return;
        }
        if (key === "Tab") {
        } else if (key === "Escape") {
            this.resetText();
            this.updateCaretPadding();
            this.resetCandidateHighlight();
            abcjs.renderAbc("imesvg", this.text, {responsive: "resize"});
            abcjs.renderMidi(this.MIDI_ELEMENT_ID, this.text, {generateInline: false, generateDownload: true});
            return;
        } else if (key === "Enter") {
            if (e.keyCode === 229) {
                console.log(this.MSG, "oninput", "229");
                this.isComposeCompleted = true;
            } else {
                if (this.isTextEmpty()) return;
                if (this.candidateIndex > -1) {
                    this.replaceText(this.candidates[this.candidateIndex]);
                }
                document.execCommand("insertText", null, this.text);
                //最後にrenderしてたabcのsmfをtinyに流すかな
                this.tinySynth.loadMIDI(getSMF(this.midiEl));
                this.tinySynth.stopMIDI();
                this.tinySynth.playMIDI();
                this.resetText();
                this.caretPaddingEl.textContent = "";
                this.scrapboxInputEl.style.marginLeft = "";
                this.caretEl.style.marginLeft = "";
                this.resetCandidateHighlight();
            }
        } else if (e.keyCode === 229) {
        } else if (key === "Backspace") {
            if (this.isTextEmpty()) return;
            this.removeLastChar();
            this.updateCaretPadding();
            this.resetCandidateHighlight();
        } else if (key === " ") {
            if (this.isTextEmpty()) return;
            this.highlightNextCandidate();
        } else if (key === "ArrowUp") {
            this.upOctave();
            this.resetCandidateHighlight();
        } else if (key === "ArrowDown") {
            this.downOctave();
            this.resetCandidateHighlight();
        } else {
            this.addText(key);
            this.updateCaretPadding();
            this.resetCandidateHighlight();
        }
        abcjs.renderAbc("imesvg", this.text, {responsive: "resize"});
        abcjs.renderMidi(this.MIDI_ELEMENT_ID, this.text, {generateInline: false, generateDownload: true});
        e.preventDefault();
        e.stopPropagation();
    };
    private upOctave = (): void => {
        if (this.text.substr(-1) === ",") {
            this.text = this.text.replace(/,$/, "");
        } else if (/([a-g]|[A-G]|')/.test(this.text.substr(-1))) {
            this.addText("'");
        }
    };
    private downOctave = (): void => {
        if (this.text.substr(-1) === "'") {
            this.text = this.text.replace(/'$/, "");
        } else if (/([a-g]|[A-G]|,)/.test(this.text.substr(-1))) {
            this.addText(",");
        }
    };
    private isTextEmpty = (): boolean => !this.text;
    private isIgnoreKey = (inputKey: string): boolean => {
        for (let ignore of this.IGNORE_KEYS) {
            if (ignore === inputKey) return true
        }

        return false;
    };
    private followTextInput = (): void => {
        this.imeEl.style.top = `${this.scrapboxInputEl.offsetTop + 20}px`;
        this.imeEl.style.left = this.scrapboxInputEl.style.left;
    };
    private resetCandidateHighlight = (): void => {
        this.candidateIndex = -1;
        this.updateHighlight();
    };
    private highlightNextCandidate = (): void => {
        //候補が7個以上になった場合動かない
        if (this.candidateIndex === this.candidates.length - 1) {
            this.candidateIndex = -1;
            this.updateHighlight();
            return;
        }
        this.candidateIndex++;
        this.updateHighlight();
    };
    private updateHighlight = (): void => {
        for (let i in this.candidateEls) {
            this.candidateEls[i].highlight(Number(i) === this.candidateIndex);
        }
    };
    private onInput = (): void => {
        this.resetCandidates();
        this.generateCandidates();
        this.renderCandidates();
        this.imeInputEl.value = this.text;
    };
    private generateCandidates = (): void => {
        this.candidates = this.abcDict.getSearchResult(this.text);
    };
    private renderCandidates = (): void => {
        for (let i in this.candidates) {
            this.candidateEls[i].render(this.candidates[i]);
        }
    };
    private resetCandidates = (): void => {
        for (let candidate of this.candidateEls) {
            candidate.reset()
        }
    };
}

export const initIME = async (tinySynth): Promise<void> => {
    await imeDict.initABCDict();
    new IME(tinySynth, imeDict);
};