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
const candidates: IMECandidate[] = [];

const search = (input: string): string[] => {
    console.log("search", input);
    if (input === "") return [];
    const candidatesStr = [];
    for (let word of dict) {
        console.log("search", `new RegExp(".*" + ${input} + ".*").test(${word[0]})`);
        if (new RegExp(".*" + input + ".*").test(word[0])) {
            candidatesStr.push(word[1])
        }
    }
    return candidatesStr
};

const renderCandidates = (candidatesStr: string[]): void => {
    for (let i in candidatesStr) {
        candidates[i].render(candidatesStr[i]);
    }
};

const refreshCandidates = (): void => {
    for (let candidate of candidates) {
        candidate.reset()
    }
};

const onInput = (input: string): void => {
    refreshCandidates();
    const candidates = search(input);
    renderCandidates(candidates);
    console.log("onkeyup", candidates);
};

export const initIME = () => {
    const IMEEl = document.createElement("div");
    IMEEl.setAttribute("id", "ime");
    const {style} = IMEEl;
    style.position = "absolute";
    style.zIndex = "1000";
    style.width = "400px";
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
            style.display = caret.style.display;
        });
    });
    caretObserver.observe(caret, {attributes: true});

    const textarea = document.createElement("input");
    textarea.style.border = "none";
    textarea.style.width = "99.7%";
    textarea.style.height = "30px";
    textarea.style.marginLeft = "1px";
    textarea.style.borderBottom = "#991212 solid 1px";
    textarea.addEventListener("click", e => {
        e.preventDefault();
        e.stopPropagation();
        return true;
    });
    IMEEl.appendChild(textarea);

    const svgEl = document.createElement("div");
    svgEl.setAttribute("id", "imesvg");
    IMEEl.appendChild(svgEl);

    let text = "";
    textInput.addEventListener("keydown", e => {
        const {key} = e;
        if (style.display === "none") {
            return false;
        }
        if (/(Control|Alt|Meta|Tab|Shift|Dead|Delete|Allow.*)/.test(key)) {
            return false;
        }
        if (key === "Escape") {
            text = ""
        } else if (key === "Enter") {
            if (!text) return false;
            document.execCommand("insertText", null, text);
            text = "";
        } else if (key === "Backspace") {
            if (!text) return false;
            text = text.substr(0, text.length - 1);
        } else {
            text += key;
        }
        textarea.value = text;
        abcjs.renderAbc("imesvg", text, {responsive: "resize"});
        e.preventDefault();
        e.stopPropagation();
    });

    //同じabcブロック内にヘッダ情報があれば取り込む(キーとかlengthとか)(タイトルとかは省く)


    // const candidatesEl = document.createElement("div");
    // candidatesEl.setAttribute("id", "imecandidates");
    // candidatesEl.style.display = "flex";
    // candidatesEl.style.flexDirection = "column";
    //
    // const onSelected = (): void => {
    //     refreshCandidates();
    //     formEl.value = "";
    // };
    //
    // for (let i = 0; i < 6; i++) {
    //     const candidate = new IMECandidate(i, onSelected);
    //     candidates.push(candidate);
    //     candidatesEl.appendChild(candidate.getDiv());
    // }
    //
    //
    // IMEEl.appendChild(candidatesEl);

};
