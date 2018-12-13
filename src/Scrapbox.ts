import {ABCBlock, ExternalABC, ScrapboxLine} from "./Types";

const SCRAPBOX_PROJECT_NAME = location.pathname.split("/")[1];
export const SCRAPBOX_URL = `https://scrapbox.io/${SCRAPBOX_PROJECT_NAME}/`;

//Scrapboxページのデータ取得系関数

const getPageLines = async (pageTitle: string): Promise<ScrapboxLine[]> => {
    const res = await fetch(`https://scrapbox.io/api/pages/${SCRAPBOX_PROJECT_NAME}/${pageTitle}`);
    const {lines} = await res.json();
    return lines;
};

const getCodeBlock = async (pageTitle: string, codeTitle: string): Promise<string> => {
    const res = await fetch(`https://scrapbox.io/api/code/${SCRAPBOX_PROJECT_NAME}/${pageTitle}/${codeTitle}`).then(res => {
        if (!res.ok) {
            throw new Error(`getCodeBlock(): Failed to HTTP request ${res.status} ${res.statusText}`)
        }
        return res
    });
    return await res.text();
};

const getFirstCodeBlockTitle = async (pageTitle: string): Promise<string> => {
    for (let line of await getPageLines(pageTitle)) {
        if (/code:.*\.abc/.test(line.text)) {
            return line.text.replace(/^(\t|\s)+/, "").substr(5);
        }
    }
};

const externalABCs: ExternalABC[] = [];

export const getABCBlocks = async (): Promise<ABCBlock[]> => {
    const blocks: ABCBlock[] = [];
    let tempBlock: ABCBlock = null; //連続したcode-block毎に組み立てる
    let hasCodeBlock = false; //1個前のlineがcode-blockならtrue

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
            }

            let abcText = `\n${codeBlockEl.textContent.replace(/^\t+/, "")}`;
            const matchedArray: string[] = abcText.match(/\${[^{}]+}/g);
            if (tempBlock && matchedArray) {
                for (let matchedStr of matchedArray) {
                    const importSource = matchedStr.replace(/(^\${|}$)/g, "");
                    let hasCache: boolean = false;
                    console.log("library", importSource);
                    for (let externalABC of externalABCs) {
                        if (externalABC.source === importSource) {
                            abcText = abcText.replace(matchedStr, externalABC.abc);
                            hasCache = true;
                            console.log("library", "usecache");
                            break;
                        }
                    }
                    if (!hasCache) {
                        try {
                            const importedABC = (await getCodeBlock(importSource, await getFirstCodeBlockTitle(importSource))).replace(/( |\n)+$/, "");
                            abcText = abcText.replace(matchedStr, importedABC);
                            externalABCs.push({source: importSource, abc: importedABC});
                            console.log("library", "get");
                        } catch (e) {
                            console.log(e)
                        }
                    }
                }
            }

            const blockHeight = codeBlockEl.clientHeight;
            const left = codeBlockEl.querySelector(".indent-mark").clientWidth;
            const width = codeBlockEl.querySelector(".indent").clientWidth;
            if (tempBlock) { //tempBlockが存在したら追加系の操作のみ行う
                if (!tempBlock.abc) {
                    tempBlock.abc = abcText;
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