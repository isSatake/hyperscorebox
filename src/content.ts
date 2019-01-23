import {ScoresInPage} from "./ScoresInPage";
import {getABCBlocks, registerTextInputMutationObserver, registerPageTransitionObserver} from "./Scrapbox";
import {ABCBlock} from "./Types";
import {initIME} from "./IME";
import * as WebAudioTinySynth from "webaudio-tinysynth";

//初期化

const MSG = "hyperscorebox";
const tinySynth = new WebAudioTinySynth({voices: 64});
const page = new ScoresInPage();
const update = (timeout: number = 0, isPageTransition: boolean = false) => {
    setTimeout(async () => {
        const ABCBlocks: ABCBlock[] = await getABCBlocks();
        console.log(MSG, "update", "ABCBlocks", ABCBlocks);
        page.update(ABCBlocks, isPageTransition);
    }, timeout);
};
const isScoreClicked = (e: MouseEvent): boolean => {
    for (let el of e["path"]) {
        if (el.className === "scoreview") {
            return true
        }
    }
    return false
};
const quitEditing = (): void => {
    const editingABCs = document.getElementsByClassName("abcediting");
    for (let abcEl of editingABCs) {
        abcEl.classList.remove("abcediting");
    }
};
const handleClickEvent = (e: MouseEvent): void => {
    update();
    if (isScoreClicked(e)) return;
    quitEditing();
};
const init = async (): Promise<void> => {
    console.log(MSG, "hello from hyperscorebox");
    window.addEventListener("click", handleClickEvent);
    registerTextInputMutationObserver(() => update());
    registerPageTransitionObserver(() => update(0, true));
    update();
    await initIME(tinySynth);
};

setTimeout(async () => {
    await init();
}, 2000);
