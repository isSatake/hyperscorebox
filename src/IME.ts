import * as abcjs from "abcjs/midi";

const CANDIDATE_CLASS_NAME = "note-candidate";

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
    ["C", "[ceg]"],
    ["Cm", "[c_eg]"],
    ["Am", "[ace]"],
    ["V", "[gbd]"], //動的辞書の例
];

const search = (input: string): string[] => {
    console.log("search", input);
    if (input === "") return [];
    const candidates = [];
    for (let word of dict) {
        console.log("search", `new RegExp(".*" + ${input} + ".*").test(${word[0]})`);
        if (new RegExp(".*" + input + ".*").test(word[0])) {
            candidates.push(word[1])
        }
    }
    return candidates
};

const renderCandidates = (candidates: string[]): void => {
    for (let i in candidates) {
        abcjs.renderAbc(`note-candidate-${i}`, candidates[i], {responsive: "resize"});
    }
};

const refreshCandidates = (): void => {
    const candidateEls = document.getElementsByClassName(CANDIDATE_CLASS_NAME);
    for (let candidateEl of candidateEls) {
        candidateEl.textContent = null;
    }
};

const onInput = (input: string): void => {
    refreshCandidates();
    const candidates = search(input);
    renderCandidates(candidates);
    console.log("onkeyup", candidates);
};

export const initIME = () => {
    const formEl = document.createElement("input");
    formEl.addEventListener("keyup", () => onInput(formEl.value));

    const candidatesEl = document.createElement("div");
    candidatesEl.setAttribute("id", "imecandidates");
    for (let i = 5; i > -1; i--) {
        const candidateEl = document.createElement("div");
        candidateEl.classList.add(CANDIDATE_CLASS_NAME);

        candidateEl.setAttribute("id", `note-candidate-${i}`);
        candidatesEl.appendChild(candidateEl)
    }

    const IMEEl = document.createElement("div");
    IMEEl.setAttribute("id", "ime");
    const {style} = IMEEl;
    style.position = "fixed";
    style.bottom = "22px";
    style.left = "2px";
    style.zIndex = "300";
    style.width = "400px";
    style.backgroundColor = "white";
    IMEEl.appendChild(candidatesEl);
    IMEEl.appendChild(formEl);

    const container = document.getElementById("app-container");
    container.appendChild(IMEEl);
};
