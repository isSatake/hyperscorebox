import {ABCPage} from "./ABCPage";
import {getABCBlocks, getABCElIDs, getPageLines} from "./Scrapbox";
import {ABCBlock} from "./Types";

const MSG = "hyperscorebox";

console.log(MSG, "hello from hyperscorebox");
const page = new ABCPage();
const update = async () => {
    const ABCIDs = getABCElIDs(await getPageLines());
    if (ABCIDs.length < 1) {
        return;
    }
    const ABCBlocks: ABCBlock[] = getABCBlocks(ABCIDs);
    console.log(MSG, "update", "ABCBlocks", ABCBlocks);
    page.update(ABCBlocks);
};

setInterval(async () => await update(), 500);
window.addEventListener("mousedown", async (e) => await update());