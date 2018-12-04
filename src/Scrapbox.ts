import {ABCBlock} from "./Types";

const SCRAPBOX_PROJECT_NAME = location.pathname.split("/")[1];
export const SCRAPBOX_URL = `https://scrapbox.io/${SCRAPBOX_PROJECT_NAME}/`;

type ScrapboxLine = {
    text: string
}

//Scrapboxページのデータ取得系関数

const getPageLines = async (pageTitle: string): Promise<ScrapboxLine[]> => {
    const res = await fetch(`https://scrapbox.io/api/pages/${SCRAPBOX_PROJECT_NAME}/${pageTitle}`);
    const {lines} = await res.json();
    return lines;
};

const getCodeBlock = async (pageTitle: string, codeTitle: string): Promise<string> => {
    const res = await fetch(`https://scrapbox.io/api/code/${SCRAPBOX_PROJECT_NAME}/${pageTitle}/${codeTitle}`);
    return await res.text();
};

const getFirstCodeBlockTitle = async (pageTitle: string): Promise<string> => {
    for (let line of await getPageLines(pageTitle)) {
        if (/code:.*\.abc/.test(line.text)) {
            return line.text.substr(5);
        }
    }
};

export const getABCBlocks = async (): Promise<ABCBlock[]> => {
    const blocks: ABCBlock[] = [];
    let tempBlock: ABCBlock = null; //連続したcode-block毎に組み立てる
    let hasCodeBlock = false; //1個前のlineがcode-blockならtrue
    let externalABC = "";

    //Scrapboxの行
    const lines = document.querySelector(".lines").children;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        //行の子要素
        const span = line.querySelector("span:not(.date-label)");
        const codeBlockEl = span.classList.contains("code-block") ? span : null;
        if (codeBlockEl) { //コードブロックか？
            if (tempBlock && !hasCodeBlock) { //コードブロックが途切れたらblocksにpush
                blocks.push(tempBlock);
                tempBlock = null;
                externalABC = "";
            }

            const abcText = `\n${codeBlockEl.textContent.replace(/^\t+/, "")}`;

            //インポート記法
            if (!externalABC && tempBlock && /%import:.*/.test(abcText)) {
                console.log("import!");
                const reference = abcText.substr(9);
                externalABC = await getCodeBlock(reference, await getFirstCodeBlockTitle(reference));
            }

            const blockHeight = codeBlockEl.clientHeight;
            const left = codeBlockEl.querySelector(".indent-mark").clientWidth;
            const width = codeBlockEl.querySelector(".indent").clientWidth;
            if (tempBlock) { //tempBlockが存在したら追加系の操作のみ行う
                if (externalABC && !tempBlock.abc) {
                    tempBlock.abc = externalABC;
                } else {
                    tempBlock.abc += abcText; //インポートするならページ内のtextは無視
                }
                tempBlock.blockHeight += blockHeight;
            } else { //なければすべてのプロパティを一度に追加する
                if (/(code:|)(.*\.|)abc/.test(abcText)) {
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
    return `position: absolute; width: ${width + 0.5}px; background: white; z-index: 100; top: ${top}px; left: ${offsetLeft - 0.5}px; height: ${blockHeight}px; ${shadow}`
};

export const registerTextInputMutationObserver = (_function: (textInput?: HTMLInputElement) => void) => {
    const textInput = document.getElementById('text-input') as HTMLInputElement;
    const textInputObserver = new MutationObserver(mutations => {
        mutations.forEach(() => {
            _function(textInput);
        });
    });
    textInputObserver.observe(textInput, {attributes: true});
};