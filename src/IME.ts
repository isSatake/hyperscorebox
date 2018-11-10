import {IMECandidate} from "./IMECandidate";
import * as abcjs from "abcjs/midi";

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
    ["Am", "[ace]"],
    ["V", "[gbd]"], //動的辞書の例
];
const candidateContainers: IMECandidate[] = [];

const search = (input: string): string[] => {
    console.log("search", input);
    if (input === "") return [];
    const candidatesStr = [];
    for (let word of dict) {
        if (new RegExp(".*" + input + ".*").test(word[0])) {
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

export const initIME = () => {
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

    //キャレットに追従
    const textInput = document.getElementById('text-input');
    const textInputObserver = new MutationObserver(mutations => {
        mutations.forEach(() => {
            style.top = `${textInput.offsetTop + 20}px`;
            style.left = textInput.style.left;
        });
    });
    textInputObserver.observe(textInput, {attributes: true});
    const container = document.getElementById("editor");
    container.appendChild(IMEEl);

    //キャレットが消えたらIMEも消える
    const caret = container.querySelector(".cursor") as HTMLElement;
    const caretObserver = new MutationObserver(mutations => {
        mutations.forEach(() => {
            if (caret.style.display === "") {
                //キャレット表示時
                //キャレットがコードブロック外なら消える
                //.lines.line.section-n.section-title.abcediting なら表示
                const cursorLine = container.querySelector(".cursor-line");
                for (let c of cursorLine.classList) {
                    if (/section-[0-9]+/.test(c)) {
                        const sectionTitleLine = container.querySelector(`.${c}`);
                        if (sectionTitleLine.classList.contains("abcediting")) {
                            //表示
                            style.display = "";
                            return;
                        }
                    }
                }
            }
            style.display = "none";
        });
    });
    caretObserver.observe(caret, {attributes: true});


    //Escで表示切替

    const textarea = document.createElement("input");
    textarea.style.border = "none";
    textarea.style.width = "95%";
    textarea.style.height = "30px";
    textarea.addEventListener("click", e => {
        e.preventDefault();
        e.stopPropagation();
        return true;
    });
    IMEEl.appendChild(textarea);

    const svgEl = document.createElement("div");
    svgEl.style.width = "100%";
    svgEl.style.background = "#f5f5f5";
    svgEl.setAttribute("id", "imesvg");
    IMEEl.appendChild(svgEl);


    const candidatesEl = document.createElement("div");
    candidatesEl.setAttribute("id", "imecandidates");

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


    let text = "";
    textInput.addEventListener("keydown", e => {
        const {key} = e;
        if (style.display === "none") {
            return false;
        }
        //スルーするキー
        if (/(Control|Alt|Meta|Shift|Dead|Delete|Arrow.*)/.test(key)) {
            return false;
        }
        //握りつぶすキー
        if (key === "Tab") {
        } else if (key === "Escape") {
            text = "";
            resetHighlight();
        } else if (key === "Enter") {
            if (!text) return false;
            if (highlightIndex > -1) {
                text = candidates[highlightIndex];
            }
            document.execCommand("insertText", null, text);
            text = "";
            resetHighlight();
        } else if (key === "Backspace") {
            if (!text) return false;
            text = text.substr(0, text.length - 1);
            resetHighlight();
        } else if (key === " ") {
            if (!text) return false;
            //候補選択
            highlightNext();
        } else {
            text += key;
            resetHighlight();
        }
        textarea.value = text;
        abcjs.renderAbc("imesvg", text, {responsive: "resize"});
        onInput(text);
        e.preventDefault();
        e.stopPropagation();
    });

    //同じabcブロック内にヘッダ情報があれば取り込む(キーとかlengthとか)(タイトルとかは省く)
    //input内のキャレット移動を可能にする(書き終わってからのリズム訂正やアーティキュレーション挿入が可能になる)

};
