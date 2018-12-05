import {Page} from "./Page";
import {getABCBlocks, registerTextInputMutationObserver} from "./Scrapbox";
import {ABCBlock} from "./Types";
import {initIME} from "./IME";

const MSG = "hyperscorebox";

console.log(MSG, "hello from hyperscorebox");

const page = new Page();
const update = (timeout: number = 0) => {
    setTimeout(async () => {
        const ABCBlocks: ABCBlock[] = await getABCBlocks();
        console.log(MSG, "update", "ABCBlocks", ABCBlocks);
        page.update(ABCBlocks);
    }, timeout);
};

//初期化
setTimeout(() => {
    window.addEventListener("click", () => update());
    window.addEventListener("mousedown", e => {
        const editingABCs = document.getElementsByClassName("abcediting");
        for (let abcEl of editingABCs) {
            abcEl.classList.remove("abcediting");
        }
    });
    registerTextInputMutationObserver(() => update(100));
    initIME();
    update();
}, 2000);
