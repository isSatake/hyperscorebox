import {Page} from "./Page";
import {getABCBlocks, getABCElIDs, getPageLines} from "./Scrapbox";
import {ABCBlock} from "./Types";
import {initIME} from "./IME";

const MSG = "hyperscorebox";

console.log(MSG, "hello from hyperscorebox");

const page = new Page();
const update = () => {
    const ABCBlocks: ABCBlock[] = getABCBlocks();
    console.log(MSG, "update", "ABCBlocks", ABCBlocks);
    page.update(ABCBlocks);
};

window.addEventListener("click",  (e) =>  update());
window.addEventListener("mousedown", e => {
    const editingABCs = document.getElementsByClassName("abcediting");
    for(let abcEl of editingABCs){
        abcEl.classList.remove("abcediting");
    }
});

setInterval(async () => await update(), 500);
setTimeout(initIME, 2000);
