import {ABCBlock, Line} from "./Types";

//Scrapboxページのデータ取得系関数

export const getPageLines = async () => {
    const res = await fetch(`https://scrapbox.io/api/pages${location.pathname}`);
    const {lines} = await res.json();
    return lines;
};

export const getABCElIDs = (lines: Line[]): string[] => {
    const IDs = [];
    for (let line of lines) {
        if (line.text === "code:abc") {
            IDs.push(`L${line.id}`);
        }
    }
    return IDs;
};

export const getABCBlocks = (): ABCBlock[] => {
    const blocks: ABCBlock[] = [];

    // const codeBlockDivs = [];
    // let codeBlockStr = "";
    // let codeBlockHeight = 0;
    // let isEditing = false;
    let tempBlock: ABCBlock = null; //連続したcode-block毎に組み立てる
    let hasCodeBlock = false; //1個前のlineがcode-blockならtrue

    //Scrapboxの行
    const lines = document.querySelector(".lines").children;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        //行の子要素
        const span = line.querySelector("span");
        const codeBlockEl = span.classList.contains("code-block") ? span : null;
        if (codeBlockEl) { //コードブロックか？
            if (tempBlock && !hasCodeBlock) { //コードブロックが途切れたらblocksにpush
                blocks.push(tempBlock);
                tempBlock = null;
            }

            const abcText = `\n${codeBlockEl.textContent.replace(/^\t+/, "")}`;
            const blockHeight = codeBlockEl.clientHeight;
            const left = codeBlockEl.querySelector(".indent-mark").clientWidth;
            const width = codeBlockEl.querySelector(".indent").clientWidth;
            if (tempBlock) { //tempBlockが存在したら追加系の操作のみ行う
                tempBlock.abc += abcText;
                tempBlock.blockHeight += blockHeight;
            } else { //なければすべてのプロパティを一度に追加する
                tempBlock = {
                    titleElement: line as HTMLElement,
                    titleElementID: line.id,
                    abc: "", //コードブロック1行目は無視していい
                    blockHeight: blockHeight,
                    offsetLeft: left,
                    width: width,
                    isEditing: false
                }
            }

            if (line.classList.contains("cursor-line") || line.classList.contains("abcediting")) {
                tempBlock.isEditing = true;
            }
            hasCodeBlock = true;
        } else {
            hasCodeBlock = false;
        }

        if (i === lines.length - 1 && tempBlock) {
            blocks.push(tempBlock);
        }
    }

    return blocks;
};

export const generateInlineStyle = (isEditing: boolean, blockHeight: number, offsetLeft: number, width: number): string => {
    const top = isEditing ? -(28 + blockHeight) : 0;
    const shadow = isEditing ? "box-shadow: 0 0 8px gray;" : "";
    return `position: absolute; width: ${width}px; background: white; z-index: 100; top: ${top}px; left: ${offsetLeft}px; height: ${blockHeight}px; ${shadow}`
};
