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

/*
* 各種Elementの初期化
*   input✅
*   candidateの入れ物✅
*       onclick => クリックボードにコピー
*   コピペ用abcdiv✅
* キーボード入力✅
* 候補オブジェクト生成✅
* 候補div描画✅
*   abcテキストも
* 候補選択
* 選択されたオブジェクトからabcをクリップボードにコピー
* 候補オブジェクトリセット
* 候補divリセット
*
* */

export const initIME = () => {
    const formEl = document.createElement("input");
    formEl.addEventListener("keyup", () => onInput(formEl.value));

    const candidatesEl = document.createElement("div");
    candidatesEl.setAttribute("id", "imecandidates");
    candidatesEl.style.display = "flex";
    candidatesEl.style.flexDirection = "column-reverse";

    for (let i = 0; i < 6; i++) {
        const candidate = new IMECandidate(i);
        candidates.push(candidate);
        candidatesEl.appendChild(candidate.div)
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
