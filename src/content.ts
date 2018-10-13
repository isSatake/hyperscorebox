import * as abcjs from "abcjs/midi";

type Link = {
    startChars: number[],
    pageTitle: string
}

type Line = {
    id: string,
    text: string
}

//コードブロックの状態
type ABCBlock = {
    titleElementID: string
    titleElement: HTMLElement
    blockHeight: number
    abc: string
    isEditing: boolean
}

//楽譜表示部の状態
type ScoreElement = {
    parentElementID: string
    element: HTMLElement
}

const MSG = "hyperscorebox";
// const SCRAPBOX_TITLE = location.pathname.split("/")[2];

const getPageLines = async () => {
    const res = await fetch(`https://scrapbox.io/api/pages${location.pathname}`);
    const {lines} = await res.json();
    return lines;
};

const getABCElIDs = (lines: Line[]): string[] => {
    const IDs = [];
    for (let line of lines) {
        if (line.text === "code:abc") {
            IDs.push(`L${line.id}`);
        }
    }
    return IDs;
};

const getABCBlocks = (elementIDs: string[]): ABCBlock[] => {
    const blocks: ABCBlock[] = [];
    for (let elementID of elementIDs) {
        const titleElement = document.getElementById(elementID);
        const className = titleElement.className;
        const classList = className.split(" ");
        const sectionNumClass = classList.find(e => e.match(/section-\d+/) !== null);
        const blockDivs = document.getElementsByClassName(sectionNumClass);

        const codeBlockDivs = [];
        let codeBlockStr = "";
        let codeBlockHeight = 0;
        let isEditing = false;
        for (let blockDiv of blockDivs) {
            for (let child of blockDiv.children) {
                if (child.classList.contains("code-block") === true) {
                    codeBlockDivs.push(blockDiv);
                    codeBlockStr += `\n${blockDiv.textContent.replace(/^\t+/, "")}`;
                    codeBlockHeight += blockDiv.clientHeight;
                }
            }
            if (blockDiv.classList.contains("cursor-line")) {
                isEditing = true;
            }
        }

        blocks.push({
            titleElementID: elementID,
            titleElement: titleElement,
            blockHeight: codeBlockHeight,
            abc: codeBlockStr.replace(/^\nabc\n/, ""),
            isEditing: isEditing
        })
    }
    return blocks;
};

const generateInlineStyle = (isEditing: boolean, abcBlockHeight: number): string => {
    const top = isEditing ? -(28 + abcBlockHeight) : 0;
    return `position: absolute; width: 100%; background: #00bcd4; z-index: 100; top: ${top}px; height: ${abcBlockHeight}px;`
};

class ABCPage {
    private scoreElements: ScoreElement[] = [];

    private pushScoreElement = (block: ABCBlock): void => {
        const {titleElementID, titleElement, blockHeight, abc, isEditing} = block;
        const scoreDiv = document.createElement("div");
        scoreDiv.setAttribute("id", `ABC${titleElementID}`);
        scoreDiv.setAttribute("style", generateInlineStyle(isEditing, blockHeight));

        const svgDiv = document.createElement("div");
        const svgDivID = `SVG${titleElementID}`;
        svgDiv.setAttribute("id", svgDivID);

        const playerDiv = document.createElement("div");
        const playerDivID = `PLAYER${titleElementID}`;
        playerDiv.setAttribute("id", playerDivID);

        scoreDiv.appendChild(svgDiv);
        scoreDiv.appendChild(playerDiv);
        block.titleElement.appendChild(scoreDiv);
        this.scoreElements.push({
            parentElementID: titleElementID,
            element: scoreDiv
        });
        //楽譜描画
        render(abc, parseLink(abc), svgDivID, playerDivID);
    };

    private getElement = (elementID: string): ScoreElement => {
        if (this.scoreElements.length < 1) return null;
        for (let scoreElement of this.scoreElements) {
            if (scoreElement.parentElementID === elementID) {
                return scoreElement;
            }
        }
        return null;
    };

    private updateElement = (block: ABCBlock): boolean => {
        const scoreElement = this.getElement(block.titleElementID);
        if (!scoreElement) {
            return false;
        }
        scoreElement.element.setAttribute("style", generateInlineStyle(block.isEditing, block.blockHeight));
        //楽譜描画
        return true;
    };

    public update = (newAbcBlocks: ABCBlock[]): void => {
        for (let newBlock of newAbcBlocks) {
            if (!this.updateElement(newBlock)) {
                this.pushScoreElement(newBlock);
            }
        }
    }
}

console.log(MSG, "hello from hyperscorebox");
const page = new ABCPage();

setInterval(async () => {
    const ABCIDs = getABCElIDs(await getPageLines());
    if (ABCIDs.length < 1) {
        return;
    }
    const ABCBlocks: ABCBlock[] = getABCBlocks(ABCIDs);
    console.log(ABCBlocks);
    page.update(ABCBlocks);
}, 500);


const SCRAPBOXURL = "https://scrapbox.io/stk-study-music-theory/";
const LINK_HIGHLIGHT_COLOR = "#3965ff";
const inputEl = document.getElementById("abcinput");
let shifted: boolean = false;

const parseLink = (abc: string): Link[] => {
    const parsedLinks: Link[] = [];
    const linkMached = abc.match(/%Links:.*/);
    if (!linkMached) {
        return [];
    }
    console.log("parseLink", "linkMatched", linkMached[0]);

    const linkStr = linkMached[0].replace(/%Links:/, "");
    const links = linkStr.split("]");
    if (links.length < 1) {
        return [];
    }

    for (let link of links) {
        link = link.replace("[", "");
        const arr = link.split(" ");
        if (arr.length < 2) continue;
        const numbersStr: string[] = arr[0].split(",");
        const numbers: number[] = numbersStr.map(str => Number(str));
        parsedLinks.push({startChars: numbers, pageTitle: arr[1]});
    }

    console.log("parseLink", "parsedLinks", parsedLinks);
    return parsedLinks;
};

const onInput = () => {
    console.log("inputEl", "oninput");
    const ABC: string = (inputEl as HTMLInputElement).value;
    // render(ABC, inputEl as HTMLInputElement, parseLink(ABC));
};

const addLinkToABC = (abc: string, startChar: number): string => {
    if (shifted) {
        const splitted = abc.split("]");
        const tail = splitted[splitted.length - 2];
        const updatedTail = tail.replace("[", `[${startChar},`);
        return abc.replace(tail, updatedTail);
    }
    if (/%Links:($|\[(.*|)\d+ .*]$)/.test(abc)) {
        return `${abc}[${startChar} new]`;
    }
    if (/\n$/.test(abc)) {
        return `${abc}%Links:[${startChar} new]`;
    }
    return `${abc}\n%Links:[${startChar} new]`;
};

const generateClickListener = (inputEl: HTMLInputElement, links: Link[]) => {
    return (abcElem, tuneNumber, classes): void => {
        console.log("abcClickListener", abcElem, tuneNumber, classes);
        //abcjsによる赤ハイライトを取り消す
        abcElem.abselem.highlight(undefined, LINK_HIGHLIGHT_COLOR);

        const clickedNoteStartChar: number = abcElem.startChar;
        const pageTitle: string | null = getLink(links, clickedNoteStartChar);
        if (pageTitle) {
            console.log("abcClickListener", "Linked note is clicked.", "startChar:", clickedNoteStartChar, "destination:", pageTitle);
            window.open(SCRAPBOXURL + pageTitle);
            return
        }

        const ABC = inputEl.value;
        inputEl.value = addLinkToABC(ABC, clickedNoteStartChar);
        onInput();
    };
};

const getLink = (links: Link[], startChar: number): string | null => {
    for (let link of links) {
        for (let _startChar of link.startChars) {
            if (_startChar === startChar) {
                return link.pageTitle
            }
        }
    }
    return null
};

const render = (abc: string, links: Link[], svgDivID: string, playerDivID: string): void => {
    const options = {
        // clickListener: generateClickListener(inputEl, links),
        add_classes: true,
        staffwidth: 1024
    };
    const tuneObjectArray = abcjs.renderAbc(svgDivID, abc, options);
    console.log("render", "tuneObjectArray", tuneObjectArray);

    //リンクをハイライト
    const voices = tuneObjectArray[0].lines[0].staff[0].voices;
    for (let voice of voices) {
        for (let element of voice) {
            if (!element.startChar) continue;
            if (getLink(links, Number(element.startChar))) {
                element.abselem.highlight(undefined, LINK_HIGHLIGHT_COLOR);
            }
        }
    }

    abcjs.renderMidi(playerDivID, abc, {inlineControls: {loopToggle: true,}});
};

window.addEventListener("mousedown", e => {
    console.log("onmousedown", "shifted:", e.shiftKey);
    shifted = e.shiftKey
});
// inputEl.addEventListener("input", onInput);
// onInput();