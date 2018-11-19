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

export const getABCBlocks = (elementIDs: string[]): ABCBlock[] => {
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
                    const text = blockDiv.querySelector(".code-block").textContent;
                    codeBlockStr += `\n${text.replace(/^\t+/, "")}`;
                    codeBlockHeight += blockDiv.clientHeight;
                }
            }
            if (!isEditing && blockDiv.classList.contains("cursor-line")) {
                isEditing = true;
            }

        }

        //キャレットが表示されていると.abceditingが.cursor-lineで上書きされてしまうのでこのような条件にしている
        if (!isEditing && (titleElement.classList.contains("abcediting") || titleElement.classList.contains("cursor-line"))) {
            isEditing = true;
        }

        blocks.push({
            titleElementID: elementID,
            titleElement: titleElement,
            blockHeight: codeBlockHeight,
            abc: codeBlockStr.replace(/(^\n.*\n)/, ""), //コードブロックタイトルにhoverすると余計な文字が入るので排除
            isEditing: isEditing
        });
    }
    return blocks;
};

export const generateInlineStyle = (isEditing: boolean, abcBlockHeight: number): string => {
    const top = isEditing ? -(28 + abcBlockHeight) : 0;
    const shadow = isEditing ? "box-shadow: 0 0 8px gray;" : "";
    return `position: absolute; width: 100%; background: white; z-index: 100; top: ${top}px; height: ${abcBlockHeight}px; ${shadow}`
};
