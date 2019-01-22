import {IMECandidate} from "./IMECandidate";
import * as abcjs from "abcjs/midi";
import {getCaretElement, getEditorElement, registerTextInputMutationObserver} from "./Scrapbox";
import {getSMF} from "./ABC";

type InputEvent = {
    isComposing: boolean;
    data: string;
} & Event

const MSG ="IME";

//楽譜IME
//クラス化する

//辞書はこれからちゃんと作る
const dict = [
    [
        "cello1-1",
        "K:D\n" +
        "M:C\n" +
        "L:1/16\n" +
        "%%score (A B)\n" +
        "[V:A]d,a,(fe) fa,fa, d,,a,(fe) fa,fa, |[V:B]d,8 d,,8 |"
    ],
    [
        "cello1-2",
        "K:D\n" +
        "M:C\n" +
        "L:1/16\n" +
        "%%score (A B)\n" +
        "[V:A]d,b,(gf) gb,gb, d,,b,(gf) gb,gb, |[V:B]d,8 d,,8 | "
    ],
    [
        "cello1-12",
        "K:D\n" +
        "M:C\n" +
        "L:1/16\n" +
        "%%score (A B)\n" +
        "[V:A]d,a,(fe) fa,fa, d,,a,(fe) fa,fa, |d,b,(gf) gb,gb, d,,b,(gf) gb,gb, |[V:B]d,8 d,,8 |d,8 d,,8 |"
    ],
    ["C", "[ceg]"],
    ["Cm", "[c_eg]"],
    ["Am", "[ace]"]
];


const doremiToABC = {
    "ド": "c",
    "レ": "d",
    "ミ": "e",
    "ファ": "f",
    "ソ": "g",
    "ラ": "a",
    "シ": "b"
};

const accidentalToABC = {
    "♯": "^",
    "＃": "^",
    "#": "^",
    "♭": "_",
    "♮": "="
};

const getRegExp = (arr: string[]): RegExp => {
    const length = arr.length;
    let str = "";
    for (let i in arr) {
        if (i === "0") {
            str += "(";
        }
        str += arr[i];
        if (i === (length - 1).toString()) {
            str += ")";
            return new RegExp(str);
        }
        str += "|";
    }
};

const convertAccidentals = (input: string) => {
    let result = input;
    for (let accidental of Object.keys(accidentalToABC)) {
        const accRegExp = new RegExp("[a-g]" + accidental, "g");
        const matched = result.match(accRegExp);
        if (!matched) continue;
        for (let match of matched) {
            result = result.replace(match, accidentalToABC[accidental] + match.replace(accidental, ""));
        }
    }
    return result;
};

export const convertDoremiToABC = (input: string) => {
    let result = input;
    for (let key of Object.keys(doremiToABC)) {
        const regexp = new RegExp(key, "g");
        result = result.replace(regexp, doremiToABC[key]);
    }
    return result;
};

const convert = (input: string): string | null => {
    let convertedStr = "";
    if (getRegExp(Object.keys(doremiToABC)).test(input)) {
        //ドレミ
        console.log(MSG, "convert", "doremi", input);
        convertedStr = convertDoremiToABC(input);
    }
    const nextStr = convertedStr ? convertedStr : input;
    if (getRegExp(Object.keys(accidentalToABC)).test(nextStr)) {
        //臨時記号
        console.log(MSG, "convert", "acc", nextStr);
        convertedStr = convertAccidentals(nextStr);
    }
    if (convertedStr) return convertedStr;
    return null;
};

const candidateContainers: IMECandidate[] = [];

const search = (input: string): string[] => {
    console.log(MSG, "search", input);
    if (input === "") return [];
    const candidatesStr = [];
    let searchStr = input;
    const converted = convert(searchStr);
    if (converted) {
        searchStr = converted;
        candidatesStr.push(converted);
    }
    for (let word of dict) {
        if (new RegExp(".*" + searchStr + ".*").test(word[0])) {
            candidatesStr.push(word[1])
        }
    }
    return candidatesStr
};

const renderCandidates = (candidatesStr: string[]): void => {
    for (let i in candidatesStr) {
        candidateContainers[i].render(candidatesStr[i]);
    }
};

const refreshCandidates = (): void => {
    for (let candidate of candidateContainers) {
        candidate.reset()
    }
};

let candidates = [];

const onInput = (input: string): void => {
    refreshCandidates();
    candidates = search(input);
    renderCandidates(candidates);
    console.log(MSG, "onkeyup", candidates);
};

let highlightIndex = -1;

const updateHighlight = () => {
    for (let i in candidateContainers) {
        candidateContainers[i].highlight(Number(i) === highlightIndex);
    }
};

const highlightNext = () => {
    //候補が7個以上になった場合動かない
    if (highlightIndex === candidates.length - 1) {
        highlightIndex = -1;
        updateHighlight();
        return;
    }
    highlightIndex++;
    updateHighlight();
};

const resetHighlight = () => {
    highlightIndex = -1;
    updateHighlight();
};

const MIDI_ELEMENT_ID = "IMEMIDI";

const createIMEEl = (): HTMLElement => {
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

const createIMEInputEl = (): HTMLInputElement => {
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

const createSvgEl = (): HTMLElement => {
    const el = document.createElement("div");
    const {style} = el;
    style.width = "100%";
    style.background = "#f5f5f5";
    el.setAttribute("id", "imesvg");
    return el;
};

const createCandidatesEl = (): HTMLElement => {
    const el = document.createElement("div");
    el.setAttribute("id", "imecandidates");
    for (let i = 0; i < 6; i++) {
        const candidate = new IMECandidate(i);
        candidateContainers.push(candidate);
        el.appendChild(candidate.getDiv());
    }
    return el;
};

const createMIDIEl = (): HTMLElement => {
    const el = document.createElement("div");
    el.id = MIDI_ELEMENT_ID;
    return el;
};

//キャレットに追従
const followTextInput = (textInput: HTMLInputElement, IMEEl: HTMLElement) => {
    IMEEl.style.top = `${textInput.offsetTop + 20}px`;
    IMEEl.style.left = textInput.style.left;
};

const isIgnoreKey = (inputKey: string): boolean => {
    const ignoreKeys = ["Control", "Alt", "Meta", "Shift", "Dead", "Delete", "ArrowLeft", "ArrowRight"];
    for(let ignore of ignoreKeys){
        if(ignore === inputKey) return true
    }

    return false;
};

//初期化関数にロジック書くのはおかしい
export const initIME = (_tinySynth) => {
    const tinySynth = _tinySynth;
    const IMEEl = createIMEEl();
    const imeInput = createIMEInputEl();
    const svgEl = createSvgEl();
    const candidatesEl = createCandidatesEl();
    const midiEl = createMIDIEl();
    IMEEl.appendChild(imeInput);
    IMEEl.appendChild(svgEl);
    IMEEl.appendChild(candidatesEl);
    IMEEl.appendChild(midiEl);

    registerTextInputMutationObserver(textInput => followTextInput(textInput, IMEEl));

    const container = getEditorElement();
    container.appendChild(IMEEl);

    //キャレット表示中にEsc押したらIME表示
    const caret = getCaretElement();
    document.addEventListener("keydown", e => {
        //キャレットはコードブロック内にあるか？
        const cursorLine = container.querySelector(".cursor-line");
        if (!cursorLine) return;
        const codeBlock = cursorLine.querySelector("span.code-block");
        if (e.key === "Escape") {
            if (codeBlock) {
                if (IMEEl.style.display === "") {
                    IMEEl.style.display = "none";
                } else if (caret.style.display === "") {
                    IMEEl.style.display = "";
                }
            }
        }
    });

    const textInput = document.getElementById('text-input') as HTMLInputElement;
    const updateTextInputOffset = (input: string) => {
        invisibleSpan.textContent = input;
        textInput.style.marginLeft = `${invisibleSpan.offsetWidth * 1.1}px`;
        caret.style.marginLeft = `${invisibleSpan.offsetWidth * 1.1 + 2}px`;
    };

    const invisibleSpan = document.createElement("span");
    document.body.appendChild(invisibleSpan);
    invisibleSpan.style.visibility = "hidden";
    let text = "";
    let isComposeCompleted = false;

    const onCompleteJapaneseInput = (e: InputEvent): void => {
        console.log(MSG, "onCompleteJapaneseInput");
        text += e.data;
        imeInput.value = text;
        //幅測定用spanを生成
        updateTextInputOffset(text);
        abcjs.renderAbc("imesvg", text, {responsive: "resize"});
        onInput(text);
        textInput.value = "";
        isComposeCompleted = false;
        e.preventDefault();
        e.stopPropagation();
    };

    const onKeyDown = (e: KeyboardEvent): void => {
        if (IMEEl.style.display === "none") {
            return;
        }
        const {key} = e;
        console.log(MSG, "onKeyDown", `keyCode:${e.keyCode} key:${key}`);
        if (isIgnoreKey(key)) {
            return;
        }
        if (key === "Tab") {
        } else if (key === "Escape") {
            text = "";
            resetHighlight();
            imeInput.value = text;
            abcjs.renderAbc("imesvg", text, {responsive: "resize"});
            abcjs.renderMidi(MIDI_ELEMENT_ID, text, {generateInline: false, generateDownload: true});
            onInput(text);
            return;
        } else if (key === "Enter") {
            if (e.keyCode === 229) {
                console.log(MSG, "oninput", "229");
                isComposeCompleted = true;
            } else {
                if (!text) return;
                if (highlightIndex > -1) {
                    text = candidates[highlightIndex];
                }
                document.execCommand("insertText", null, text);
                //最後にrenderしてたabcのsmfをtinyに流すかな
                tinySynth.loadMIDI(getSMF(midiEl));
                tinySynth.stopMIDI();
                tinySynth.playMIDI();
                text = "";
                invisibleSpan.textContent = "";
                textInput.style.marginLeft = "";
                caret.style.marginLeft = "";
                resetHighlight();
            }
        } else if (e.keyCode === 229) {
        } else if (key === "Backspace") {
            if (!text) return;
            text = text.substr(0, text.length - 1);
            //invisibleSpanも更新
            updateTextInputOffset(text);
            resetHighlight();
        } else if (key === " ") {
            if (!text) return;
            //候補選択
            highlightNext();
        } else if (key === "ArrowUp") {
            //直前が音符じゃないと無効
            if (text.substr(-1) === ",") {
                text = text.replace(/,$/, "");
            } else if (/([a-g]|[A-G]|')/.test(text.substr(-1))) {
                text += "'";
            }
            resetHighlight();
        } else if (key === "ArrowDown") {
            if (text.substr(-1) === "'") {
                text = text.replace(/'$/, "");
            } else if (/([a-g]|[A-G]|,)/.test(text.substr(-1))) {
                text += ",";
            }
            resetHighlight();
        } else {
            text += key;
            updateTextInputOffset(text);
            resetHighlight();
        }
        imeInput.value = text;
        abcjs.renderAbc("imesvg", text, {responsive: "resize"});
        abcjs.renderMidi(MIDI_ELEMENT_ID, text, {generateInline: false, generateDownload: true});
        onInput(text);
        e.preventDefault();
        e.stopPropagation();
    };

    textInput.addEventListener("input", (e: InputEvent) => {
        if (isComposeCompleted && e.isComposing) onCompleteJapaneseInput(e);
    }, true);

    textInput.addEventListener("keydown", onKeyDown);
};
