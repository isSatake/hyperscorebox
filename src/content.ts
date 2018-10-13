import {ABCPage} from "./ABCPage";
import {getABCBlocks, getABCElIDs, getPageLines} from "./Scrapbox";
import {ABCBlock} from "./Types";

const MSG = "hyperscorebox";

console.log(MSG, "hello from hyperscorebox");
const page = new ABCPage();

setInterval(async () => {
    const ABCIDs = getABCElIDs(await getPageLines());
    if (ABCIDs.length < 1) {
        return;
    }
    const ABCBlocks: ABCBlock[] = getABCBlocks(ABCIDs);
    console.log(MSG, "ABCBlocks", ABCBlocks);
    page.update(ABCBlocks);
}, 500);