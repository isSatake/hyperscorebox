import {IMECandidate} from "./IMECandidate";

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

    const textInput = document.getElementById('text-input');
    const observer = new MutationObserver((mutations) => {
        mutations.forEach(() => {
            //追従
            style.top = `${textInput.offsetTop + 20}px`;
            style.left = textInput.style.left;
        });
    });
    observer.observe(textInput, {attributes: true});
    const container = document.getElementById("editor");
    container.appendChild(IMEEl);

    const textarea = document.createElement("input");
    textarea.style.border = "none";
    textarea.style.width = "99%";
    textarea.style.height = "99%";
    textarea.style.marginLeft = "2px";
    textarea.addEventListener("click", e => {
        e.preventDefault();
        e.stopPropagation();
        return true;
    });
    IMEEl.appendChild(textarea);

    let text = "";
    const caret = document.getElementById("text-input");
    caret.addEventListener("keydown", e => {
        const {key} = e;
        if (key === "Control" || key === "Alt" || key === "Meta" || key === "Tab" || key === "Shift") {
            return false;
        }
        if (key === "Enter") {
            if(!text) return false;
            document.execCommand("insertText", null, text);
            text = "";
        } else if (key === "Backspace") {
            if(!text) return false;
            text = text.substr(0, text.length - 1);
        } else {
            text += key;
        }
        textarea.value = text;
        e.preventDefault();
        e.stopPropagation();
    });


    //
    // const candidatesEl = document.createElement("div");
    // candidatesEl.setAttribute("id", "imecandidates");
    // candidatesEl.style.display = "flex";
    // candidatesEl.style.flexDirection = "column-reverse";
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


    // IMEEl.appendChild(candidatesEl);
    // IMEEl.appendChild(formEl);

};
