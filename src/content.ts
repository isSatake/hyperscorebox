import {Page} from "./Page";
import {getABCBlocks, getABCElIDs, getPageLines} from "./Scrapbox";
import {ABCBlock} from "./Types";
import {initIME} from "./IME";

const MSG = "hyperscorebox";

console.log(MSG, "hello from hyperscorebox");

setTimeout(initIME, 2000);

const page = new Page();
const update = async () => {
    //コードブロックを含むIDだけ渡すのは間違ってる
    //すべての行を走査しないといけない
    //mutationObserverを使って、更新されたら走査する
    // const ABCIDs = getABCElIDs(await getPageLines());
    // if (ABCIDs.length < 1) {
    //     return;
    // }
    //lineを取る
    //ABCBlockを抽出する
    const ABCBlocks: ABCBlock[] = getABCBlocks();
    console.log(MSG, "update", "ABCBlocks", ABCBlocks);
    page.update(ABCBlocks);
};

setInterval(async () => await update(), 500);
window.addEventListener("click", async (e) => await update());
window.addEventListener("mousedown", e => {
    const editingABCs = document.getElementsByClassName("abcediting");
    for(let abcEl of editingABCs){
        abcEl.classList.remove("abcediting");
    }
});