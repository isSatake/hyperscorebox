import {IMECandidate} from "./IMECandidate";
import * as abcjs from "abcjs/midi";
import {registerTextInputMutationObserver} from "./Scrapbox";
import {getSMF} from "./ABC";

type InputEvent = {
    isComposing: boolean;
    data: string;
} & Event

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
        console.log("convert", "doremi", input);
        convertedStr = convertDoremiToABC(input);
    }
    const nextStr = convertedStr ? convertedStr : input;
    if (getRegExp(Object.keys(accidentalToABC)).test(nextStr)) {
        //臨時記号
        console.log("convert", "acc", nextStr);
        convertedStr = convertAccidentals(nextStr);
    }
    if (convertedStr) return convertedStr;
    return null;
};

const candidateContainers: IMECandidate[] = [];

const search = (input: string): string[] => {
    console.log("search", input);
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
    console.log("onkeyup", candidates);
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

export const initIME = (_tinySynth) => {
    const tinySynth = _tinySynth;
    const IMEEl = document.createElement("div");
    IMEEl.setAttribute("id", "ime");
    const {style} = IMEEl;
    style.position = "absolute";
    style.zIndex = "1000";
    style.width = "400px";
    style.padding = "0 0.5px 1px 1px";
    style.boxShadow = "#dedede 0 0 5px 1px";
    style.backgroundColor = "white";
    style.border = "#ababab solid 1.5px";
    style.display = "none";

    const imeInput = document.createElement("input");
    imeInput.style.position = "absolute";
    imeInput.style.border = "none";
    imeInput.style.width = "394px";
    imeInput.style.height = "30px";
    imeInput.style.top = "-29px";
    imeInput.style.backgroundColor = "transparent";
    imeInput.setAttribute("id", "imeinput");
    imeInput.addEventListener("click", e => {
        e.preventDefault();
        e.stopPropagation();
    });
    IMEEl.appendChild(imeInput);

    const svgEl = document.createElement("div");
    svgEl.style.width = "100%";
    svgEl.style.background = "#f5f5f5";
    svgEl.setAttribute("id", "imesvg");
    IMEEl.appendChild(svgEl);

    const candidatesEl = document.createElement("div");
    candidatesEl.setAttribute("id", "imecandidates");

    const midiElID = "IMEMIDI";
    const midiEl = document.createElement("div");
    midiEl.id = midiElID;
    IMEEl.appendChild(midiEl);

    //キャレットに追従
    registerTextInputMutationObserver(textInput => {
        style.top = `${textInput.offsetTop + 20}px`;
        style.left = textInput.style.left;
    });
    const container = document.getElementById("editor");
    container.appendChild(IMEEl);

    //キャレット表示中にEsc押したらIME表示
    const caret = container.querySelector(".cursor") as HTMLElement;
    document.addEventListener("keydown", e => {
        //キャレットはコードブロック内にあるか？
        const cursorLine = container.querySelector(".cursor-line");
        if(!cursorLine) return;
        const codeBlock = cursorLine.querySelector("span.code-block");
        if (e.key === "Escape") {
            if (codeBlock) {
                if (style.display === "") {
                    style.display = "none";
                } else if (caret.style.display === "") {
                    style.display = "";
                }
            }
        }
    });


    const onSelected = (): void => {
        // refreshCandidates();
        // formEl.value = "";
    };

    for (let i = 0; i < 6; i++) {
        const candidate = new IMECandidate(i, onSelected);
        candidateContainers.push(candidate);
        candidatesEl.appendChild(candidate.getDiv());
    }

    IMEEl.appendChild(candidatesEl);


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
    textInput.addEventListener("input", (e: InputEvent) => {
        if (isComposeCompleted && e.isComposing) {
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
        }
    }, true);

    textInput.addEventListener("keydown", e => {
        const {key} = e;
        console.log("imeevent", "keydown", `keyCode:${e.keyCode} key:${key}`);
        if (style.display === "none") {
            return;
        }
        //スルーするキー
        if (/(Control|Alt|Meta|Shift|Dead|Delete)/.test(key)) {
            return;
        }
        if (key === "Tab") {
        } else if (key === "Escape") {
            text = "";
            resetHighlight();
            imeInput.value = text;
            abcjs.renderAbc("imesvg", text, {responsive: "resize"});
            abcjs.renderMidi(midiElID, text, {generateInline: false, generateDownload: true});
            onInput(text);
            return;
        } else if (key === "Enter") {
            if (e.keyCode === 229) {
                console.log("oninput", "229");
                isComposeCompleted = true;
            } else {
                if (!text) return;
                if (highlightIndex > -1) {
                    text = candidates[highlightIndex];
                }
                document.execCommand("insertText", null, text);
                //最後にrenderしてたabcのsmfをtinyに流すかな
                // tinySynth.loadMIDI(getSMF(midiEl));
                // tinySynth.stopMIDI();
                // tinySynth.playMIDI();
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
            resetHighlight();
        }
        imeInput.value = text;
        abcjs.renderAbc("imesvg", text, {responsive: "resize"});
        abcjs.renderMidi(midiElID, text, {generateInline: false, generateDownload: true});
        onInput(text);
        e.preventDefault();
        e.stopPropagation();
    });

    //[]は違うイベントを捕捉しているらしい
    //同じabcブロック内にヘッダ情報があれば取り込む(キーとかlengthとか)(タイトルとかは省く)
    //input内のキャレット移動を可能にする(書き終わってからのリズム訂正やアーティキュレーション挿入が可能になる)
    //矢印キーで候補操作


};
