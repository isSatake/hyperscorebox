import {Page} from "./Page";
import {getABCBlocks, registerTextInputMutationObserver, registerPageTransitionObserver} from "./Scrapbox";
import {ABCBlock} from "./Types";
import {initIME} from "./IME";
import * as WebAudioTinySynth from "webaudio-tinysynth";

const MSG = "hyperscorebox";

console.log(MSG, "hello from hyperscorebox");
const tinySynth = new WebAudioTinySynth({voices: 64});

const page = new Page();
const update = (timeout: number = 0, isPageTransition: boolean = false) => {
    setTimeout(async () => {
        const ABCBlocks: ABCBlock[] = await getABCBlocks();
        console.log(MSG, "update", "ABCBlocks", ABCBlocks);
        page.update(ABCBlocks, isPageTransition);
    }, timeout);
};

//初期化
setTimeout(() => {
    window.addEventListener("click", () => update());
    window.addEventListener("mousedown", () => {
        const editingABCs = document.getElementsByClassName("abcediting");
        for (let abcEl of editingABCs) {
            abcEl.classList.remove("abcediting");
        }
    });
    registerTextInputMutationObserver(() => update());
    registerPageTransitionObserver(() => update(0, true));
    initIME(tinySynth);
    update();
}, 2000);
